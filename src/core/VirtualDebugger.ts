import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectState, Node, Edge, NodeStatus, EdgeType } from '../types/schema';
import { Logger } from '../utils/Logger';

export interface DebugImpact {
    necrosisNodeIds: string[];
    fractureEdgeIds: string[];
    reports: {
        nodeId: string;
        message: string;
        severity: vscode.DiagnosticSeverity;
        line: number;
    }[];
}

export interface DiagnosticRecord {
    relativePath: string;
    severity: vscode.DiagnosticSeverity;
    message: string;
    line: number;
    source?: string;
}

export interface DiagnosticProvider {
    getDiagnostics(): Promise<DiagnosticRecord[]>;
}

export class LocalDiagnosticProvider implements DiagnosticProvider {
    async getDiagnostics(): Promise<DiagnosticRecord[]> {
        const diagnostics = vscode.languages.getDiagnostics();
        const records: DiagnosticRecord[] = [];
        for (const [uri, diagList] of diagnostics) {
            const relativePath = vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');
            for (const diag of diagList) {
                records.push({
                    relativePath,
                    severity: diag.severity,
                    message: diag.message,
                    line: diag.range.start.line,
                    source: diag.source
                });
            }
        }
        return records;
    }
}

export class DiagnosticsStore {
    private static _instance: DiagnosticsStore;
    private _snapshots = new Map<string, { timestamp: number, diagnostics: any[] }>();

    public static getInstance() {
        if (!this._instance) this._instance = new DiagnosticsStore();
        return this._instance;
    }

    public updateSnapshot(clientId: string, timestamp: number, diagnostics: any[]) {
        this._snapshots.set(clientId, { timestamp, diagnostics });
    }

    public getActiveDiagnostics(): DiagnosticRecord[] {
        const now = Date.now();
        const records: DiagnosticRecord[] = [];
        for (const [clientId, snap] of this._snapshots.entries()) {
            // STALE check: 95 seconds
            if (now - snap.timestamp > 95000) {
                Logger.info(`[DiagnosticsStore] Client ${clientId} diagnostics are STALE.`);
                continue;
            }
            for (const d of snap.diagnostics) {
                records.push({
                    relativePath: d.relativePath,
                    severity: d.severity,
                    message: d.message,
                    line: d.line,
                    source: d.source
                });
            }
        }
        return records;
    }
}

export class RemoteDiagnosticProvider implements DiagnosticProvider {
    async getDiagnostics(): Promise<DiagnosticRecord[]> {
        return DiagnosticsStore.getInstance().getActiveDiagnostics();
    }
}

export class VirtualDebugger {
    /**
     * Harvests diagnostics from VS Code and maps them to the current project state.
     */
    public async performVirtualDebug(state: ProjectState, workspaceRoot: string, visibleClusterIds?: string[]): Promise<{ evidence: any, reports: any[], analyzedNodeCount: number }> {
        console.log("[STEP-1] VirtualDebug start");
        Logger.info('[VirtualDebugger] Starting Virtual Debug (AAE Facade)...');
        
        // --- [VP-02] State Mutation Check (Before) ---
        let targetNodes = state.nodes || [];
        let targetEdges = state.edges || [];
        
        if (visibleClusterIds && visibleClusterIds.length > 0) {
            Logger.info(`[VirtualDebugger] Note: Frontend already pre-filters nodes. Skipping redundant backend cluster filter.`);
        }
        
        Logger.info(`[RUNTIME_SCOPE]\nvisibleClusters=${state.clusters?.length || 0}\nvisibleNodes=${targetNodes.length}\nruntimeNodes=${targetNodes.length}`);

        
        const targetState = { ...state, nodes: targetNodes, edges: targetEdges };
        
        const nodesBefore = targetState.nodes;
        const edgesBefore = targetState.edges;
        const nodeCountBefore = targetState.nodes?.length || 0;
        const edgeCountBefore = targetState.edges?.length || 0;
        const hashBefore = JSON.stringify(targetState.nodes?.map(n => n.status));
        // ---------------------------------------------

        const localProvider = new LocalDiagnosticProvider();
        const remoteProvider = new RemoteDiagnosticProvider();

        const [localDiags, remoteDiags] = await Promise.all([
            localProvider.getDiagnostics(),
            remoteProvider.getDiagnostics()
        ]);

        const allDiags = [...localDiags, ...remoteDiags];

        const { ArchitectureAnalysisEngine } = require('./analysis/ArchitectureAnalysisEngine');
        const { NecrosisAnalyzer } = require('./analysis/analyzers/NecrosisAnalyzer');
        const { FractureAnalyzer } = require('./analysis/analyzers/FractureAnalyzer');
        const { CycleAnalyzer } = require('./analysis/analyzers/CycleAnalyzer');
        const { BoundaryGuardAnalyzer } = require('./analysis/analyzers/BoundaryGuardAnalyzer');
        const { DependencyPressureAnalyzer } = require('./analysis/analyzers/DependencyPressureAnalyzer');
        const { SchemaViolationAnalyzer } = require('./analysis/analyzers/SchemaViolationAnalyzer');
        const { DeadEndAnalyzer } = require('./analysis/analyzers/DeadEndAnalyzer');
        const { IsolatedNodeAnalyzer } = require('./analysis/analyzers/IsolatedNodeAnalyzer');
        const { ReportExporter } = require('./analysis/ReportExporter');
        const { ReportAggregator } = require('./analysis/aggregation/ReportAggregator');
        
        const engine = new ArchitectureAnalysisEngine();
        engine.registerAnalyzer(new NecrosisAnalyzer());
        engine.registerAnalyzer(new FractureAnalyzer());
        engine.registerAnalyzer(new CycleAnalyzer());
        engine.registerAnalyzer(new BoundaryGuardAnalyzer());
        engine.registerAnalyzer(new DependencyPressureAnalyzer());
        engine.registerAnalyzer(new SchemaViolationAnalyzer());
        engine.registerAnalyzer(new DeadEndAnalyzer());
        engine.registerAnalyzer(new IsolatedNodeAnalyzer());
        
        const evidenceBundle = engine.run(targetState, allDiags, workspaceRoot);
        const aggregatedBundle = ReportAggregator.aggregate(evidenceBundle, targetState);
        
        const { ReasoningEngine } = require('./analysis/reasoning/ReasoningEngine');
        const reasonedBundle = ReasoningEngine.reason(aggregatedBundle, targetState);
        
        // [v0.3.34.6] Cluster Coupling Measurement
        const { ClusterBridgeAnalyzer } = require('./analysis/ClusterBridgeAnalyzer');
        const activeClusterIds = (targetState.clusters || []).map((c: any) => c.id);
        const bridges = ClusterBridgeAnalyzer.analyzeVisibleClusters(activeClusterIds, targetState.nodes || [], targetState.edges || [], targetState.clusters);
        reasonedBundle.clusterBridges = bridges;

        
        if (workspaceRoot) {
            ReportExporter.export(reasonedBundle, targetState, workspaceRoot);
        }
        
        // Extract reports from necrosis findings for the Markdown report
        const reports = evidenceBundle.findings
            .filter((f: any) => f.type === 'necrosis')
            .map((f: any) => ({
                nodeId: f.nodeId,
                message: f.message,
                severity: f.severity,
                line: 0 // Placeholder, as line is no longer strictly needed for the summary
            }));

        const necroCount = evidenceBundle.findings.filter((f: any) => f.type === 'necrosis').length;
        const fractureCount = evidenceBundle.findings.filter((f: any) => f.type === 'fracture').length;
        Logger.info(`[VirtualDebugger] Scan complete: ${necroCount} necrosis, ${fractureCount} fractures.`);

        // --- [VP-01] Cycle Match Test ---
        const { LogicAnalyzer } = require('./LogicAnalyzer');
        const legacyAnalyzer = new LogicAnalyzer();
        const legacyAllIssues = legacyAnalyzer.analyze(state);
        const legacyCycles = legacyAllIssues.filter((i: any) => i.type === 'circular');
        
        const newCycles = evidenceBundle.findings.filter((f: any) => f.type === 'cycle');

        const legacyCount = legacyCycles.length;
        const newCount = newCycles.length;
        
        const legacyNodesStr = JSON.stringify(legacyCycles.map((c: any) => c.nodeIds).sort());
        const newNodesStr = JSON.stringify(newCycles.map((c: any) => c.nodeIds).sort());

        const legacyPaths = JSON.stringify(legacyCycles.map((c: any) => c.message).sort());
        const newPaths = JSON.stringify(newCycles.map((c: any) => c.message).sort());

        if (legacyCount === newCount && legacyNodesStr === newNodesStr && legacyPaths === newPaths) {
            Logger.info(`[VP-01] Cycle Match Test: PASS (Count: ${newCount}, Exact Node & Path Match)`);
        } else {
            Logger.error(`[VP-01] Cycle Match Test: FAIL`);
            Logger.error(`Legacy: ${legacyCount}, ${legacyNodesStr}, ${legacyPaths}`);
            Logger.error(`New: ${newCount}, ${newNodesStr}, ${newPaths}`);
        }
        // --------------------------------

        // --- [VP-03] Boundary & Pressure Match Test ---
        const legacyArchViolations = legacyAllIssues.filter((i: any) => i.type === 'architecture-violation');
        
        // Split legacy pressures
        const legacyBottleneck = legacyAllIssues.filter((i: any) => i.type === 'bottleneck' && i.message.includes('병목 지점 의심'));
        const legacyHint = legacyAllIssues.filter((i: any) => (i.type === 'bottleneck' && i.message.includes('[Hint]')) || i.type === 'warning');
        
        const newBoundaries = evidenceBundle.findings.filter((f: any) => f.type === 'boundary');
        
        // Split new pressures
        const newBottleneck = evidenceBundle.findings.filter((f: any) => f.type === 'pressure' && f.pressureType === 'bottleneck');
        const newHint = evidenceBundle.findings.filter((f: any) => f.type === 'pressure' && (f.pressureType === 'warning' || f.pressureType === 'fan-out' || f.pressureType === 'fan-in'));

        Logger.info(`[VP-03-SPLIT] Legacy Bottleneck: ${legacyBottleneck.length}, New Bottleneck: ${newBottleneck.length}`);
        Logger.info(`[VP-03-SPLIT] Legacy Hint: ${legacyHint.length}, New Hint: ${newHint.length}`);

        const legacyPressures = legacyBottleneck.length + legacyHint.length;
        const newPressures = newBottleneck.length + newHint.length;

        // LogicAnalyzer.detectDeterministicViolations also emits 'architecture-violation', so legacy might be slightly larger.
        if (newBoundaries.length <= legacyArchViolations.length && newPressures === legacyPressures) {
            Logger.info(`[VP-03] Boundary & Pressure Match Test: PASS (Boundary: ${newBoundaries.length}, Pressure: ${newPressures})`);
        } else {
            Logger.warn(`[VP-03] Boundary/Pressure Count Mismatch. Legacy Arch: ${legacyArchViolations.length}, New Boundary: ${newBoundaries.length} / Legacy Pressure: ${legacyPressures}, New Pressure: ${newPressures}`);
        }
        // --------------------------------

        // --- [VP-04] Schema Match Test ---
        const legacySchemas = legacyAllIssues.filter((i: any) => i.type === 'schema-violation');
        const newSchemas = evidenceBundle.findings.filter((f: any) => f.type === 'schema');
        if (legacySchemas.length === newSchemas.length) {
            Logger.info(`[VP-04] Schema Match Test: PASS (${newSchemas.length})`);
        } else {
            Logger.error(`[VP-04] Schema Match Test: FAIL (Legacy: ${legacySchemas.length}, New: ${newSchemas.length})`);
        }
        // --------------------------------
        
        // --- [VP-05] DeadEnd Match Test ---
        const legacyDeadEnds = legacyAllIssues.filter((i: any) => i.type === 'dead-end');
        const newDeadEnds = evidenceBundle.findings.filter((f: any) => f.type === 'structural' && f.structuralType === 'dead-end');
        if (legacyDeadEnds.length === newDeadEnds.length) {
            Logger.info(`[VP-05] DeadEnd Match Test: PASS (${newDeadEnds.length})`);
        } else {
            Logger.error(`[VP-05] DeadEnd Match Test: FAIL (Legacy: ${legacyDeadEnds.length}, New: ${newDeadEnds.length})`);
        }
        // --------------------------------

        // --- [VP-06] Isolated Match Test ---
        const legacyIsolated = legacyAllIssues.filter((i: any) => i.type === 'isolated');
        const newIsolated = evidenceBundle.findings.filter((f: any) => f.type === 'structural' && f.structuralType === 'isolated');
        if (legacyIsolated.length === newIsolated.length) {
            Logger.info(`[VP-06] Isolated Match Test: PASS (${newIsolated.length})`);
        } else {
            Logger.error(`[VP-06] Isolated Match Test: FAIL (Legacy: ${legacyIsolated.length}, New: ${newIsolated.length})`);
        }
        // --------------------------------

        // --- [VP-02] State Mutation Check (After) ---
        const nodeCountAfter = state.nodes?.length || 0;
        const edgeCountAfter = state.edges?.length || 0;
        const hashAfter = JSON.stringify(state.nodes?.map(n => n.status));
        
        const isNodeRefSame = nodesBefore === state.nodes;
        const isEdgeRefSame = edgesBefore === state.edges;

        if (hashBefore === hashAfter && nodeCountBefore === nodeCountAfter && edgeCountBefore === edgeCountAfter && isNodeRefSame && isEdgeRefSame) {
            Logger.info(`[VP-02] ProjectState Mutation Test: PASS (0 Mutations, Same Object Refs)`);
        } else {
            Logger.error(`[VP-02] ProjectState Mutation Test: FAIL (State was mutated!)`);
        }
        // --------------------------------------------

        return {
            evidence: evidenceBundle,
            reports,
            analyzedNodeCount: targetNodes.length
        };
    }

    /**
     * @deprecated ProjectState should not be mutated. Use EvidenceBundle overlay instead.
     */
    public applyImpactToState(state: ProjectState, impact: DebugImpact): ProjectState {
        Logger.warn('[VirtualDebugger] applyImpactToState is deprecated and will not mutate state.');
        return state;
    }
}
