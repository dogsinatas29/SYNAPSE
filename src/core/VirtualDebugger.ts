import * as vscode from 'vscode';
import { ValidationEngine } from './validation/ValidationEngine';
import { ValidationReportBuilder } from './validation/ValidationReportBuilder';
import { GraphSnapshot } from './validation/ValidationContext';
import * as path from 'path';
import { ProjectState, Node, Edge, NodeStatus, EdgeType, HealthState, ViewState, UNCHARTED_CONTINENT } from '../types/schema';
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
        Logger.info('[VD-CHECKPOINT-LOCAL-1] vscode.languages.getDiagnostics() called');
        const diagnostics = vscode.languages.getDiagnostics();
        Logger.info(`[VD-CHECKPOINT-LOCAL-2] vscode.languages.getDiagnostics() returned ${diagnostics.length} entries`);
        
        const records: DiagnosticRecord[] = [];
        let totalCount = 0;
        for (const [uri, diagList] of diagnostics) {
            totalCount += diagList.length;
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
        Logger.info(`[VD-CHECKPOINT-LOCAL-3] Mapped ${totalCount} diagnostics`);
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
    public async performVirtualDebug(state: ProjectState, workspaceRoot: string, visibleClusterIds?: string[]): Promise<{ evidence: any, reports: any[], analyzedNodeCount: number, surgeryReportUri?: any }> {
        console.log("[STEP-1] VirtualDebug start");
        Logger.info('[VirtualDebugger] Starting Virtual Debug (AAE Facade)...');
        
        // --- [VP-02] State Mutation Check (Before) ---
        const { graphModel } = require('./GraphModel');

        // [v0.3.34.8] Restore stripped data (like data.content) from graphModel to avoid massive IPC payloads
        const allNodesMap = (graphModel as any).nodes instanceof Map ? (graphModel as any).nodes : new Map(Array.from((graphModel as any).nodes?.values() || []).map((n: any) => [n.id, n]));
        const rawStateNodes = Array.isArray(state.nodes) ? state.nodes : Object.values(state.nodes || {});
        let targetNodes = rawStateNodes.map((n: any) => {
            const fullNode = (allNodesMap.get(n.id) || {}) as any;
            return { ...fullNode, ...n, data: { ...(fullNode.data || {}), ...(n.data || {}) } };
        });

        const allEdgesMap = new Map(((graphModel as any).edges || []).map((e: any) => [e.id, e]));
        const rawStateEdges = Array.isArray(state.edges) ? state.edges : Object.values(state.edges || {});
        let targetEdges = rawStateEdges.map((e: any) => {
            const fullEdge = (allEdgesMap.get(e.id) || {}) as any;
            return { ...fullEdge, ...e };
        });
        
        console.log("[AUDIT] VirtualDebugger Start");
        console.log("[AUDIT] state.nodes", targetNodes.length);
        console.log("[AUDIT] state.edges", targetEdges.length);
        console.log("[AUDIT] state.clusters", state.clusters?.length || 0);

        const allClusters = Array.isArray(state.clusters) ? state.clusters : Object.values(state.clusters || {});
        const _collapsedCount = allClusters.filter((c: any) => c.collapsed === true).length;
        console.log(`[VD_COLLAPSE_CHECK] total=${allClusters.length} collapsed=${_collapsedCount}`);
        console.log(`[VD_CLUSTER_SAMPLE]`, allClusters.filter((c: any) => c.collapsed === true).slice(0, 5).map((c: any) => c.id));
        Logger.info(`[VD_SCOPE] Nodes=${targetNodes.length} | Edges=${targetEdges.length} | Clusters=${allClusters.length} | VisibleClusters=${visibleClusterIds?.length || 0} | BridgeGuard=${allClusters.length > 100 ? 'BLOCKED(>100)' : 'PASS'}`);
        
        // [CLUSTER_HIERARCHY_AUDIT]
        const auditTargets = ['trace', 'util', 'sys', 'arch', 'arm64', 'External (trace)', 'External (util)', 'cluster_external'];
        for (const target of auditTargets) {
            const found: any = allClusters.find((c: any) => c.id === target || c.label === target || c.id?.includes(target));
            if (found) {
                console.log("[CLUSTER_HIERARCHY_AUDIT]", {
                    cluster: found.id,
                    label: found.label,
                    parent: found.parent_id || found.parentId,
                    type: found.type || found.layer
                });
            }
        }
        
        if (visibleClusterIds !== undefined) {
            console.log(
              '[VD_VISIBLE_INPUT]',
              {
                 visibleClusterIds: visibleClusterIds.length,
                 stateNodes: state.nodes?.length,
                 stateEdges: state.edges?.length
              }
            );
            Logger.info(`[VirtualDebugger] Note: Frontend sent ${visibleClusterIds.length} visible clusters. Filtering nodes and edges on backend.`);
            if (visibleClusterIds.length > 0) {
                const visibleSet = new Set(visibleClusterIds);
                
                // [BOUNDARY_AUDIT]
                let exp2exp = 0, exp2col = 0, col2col = 0;
                // Map to build parent relationships
                const clusterMap = new Map(allClusters.map((c: any) => [c.id, c]));
                
                // Function to find the lowest visible ancestor (which is the effective cluster for the node)
                const getVisibleAncestor = (cid: string): string | null => {
                    let current = cid;
                    let lastVisible = null;
                    while (current) {
                        if (visibleSet.has(current)) {
                            // First visible ancestor going up the tree is the one we want
                            // Wait, if 'folder_drivers' is visible and 'folder_drivers_gpu' is NOT visible,
                            // the node should belong to 'folder_drivers'.
                            return current;
                        }
                        const c = clusterMap.get(current);
                        if (!c || !c.parent_id) break;
                        current = c.parent_id;
                    }
                    return null;
                };

                // Map all nodes to their effective visible cluster
                const allNodeClusters = new Map<string, string | null>();
                rawStateNodes.forEach((n: any) => {
                    const effectiveCluster = getVisibleAncestor(n.cluster_id);
                    allNodeClusters.set(n.id, effectiveCluster);
                });

                // Keep only nodes that have a visible ancestor, and UPDATE their cluster_id on the cloned objects
                targetNodes = targetNodes.filter((n: any) => {
                    const eff = allNodeClusters.get(n.id);
                    if (eff) {
                        n.cluster_id = eff; // Aggregate! This is safe because n is already a shallow copy from line 114
                        return true;
                    }
                    return false;
                });

                const targetNodeIds = new Set(targetNodes.map((n: any) => n.id));
                
                // Aggregate Nodes Map: cluster_id -> AggregateNode
                const aggregateNodes = new Map<string, any>();

                targetEdges = rawStateEdges.map((e: any) => {
                    const fullEdge = (allEdgesMap.get(e.id) || {}) as any;
                    return { ...fullEdge, ...e };
                }).filter((e: any) => {
                    const fromExp = targetNodeIds.has(e.from);
                    const toExp = targetNodeIds.has(e.to);
                    
                    if (fromExp && toExp) return true; // exp2exp (Both ends have visible ancestors)
                    
                    if (fromExp || toExp) { // Boundary to completely invisible cluster
                        const collapsedNodeId = fromExp ? e.to : e.from;
                        // Use original cluster_id for the collapsed node, since getVisibleAncestor is null
                        const collapsedNode: any = rawStateNodes.find((n:any) => n.id === collapsedNodeId);
                        // nodeFound=false → node in graph but absent from current view scope (OUT_OF_SCOPE)
                        // nodeFound=true but cluster_id missing → UNCLUSTERED (soft bug)
                        const clusterFallback = collapsedNode ? HealthState.UNCLUSTERED : ViewState.OUT_OF_SCOPE;
                        const originalCollapsedCluster = collapsedNode?.cluster_id || clusterFallback;

                        
                        const aggId = `AGGREGATE_${originalCollapsedCluster}`;
                        if (!aggregateNodes.has(originalCollapsedCluster)) {
                            const originalClusterInfo = state.clusters?.find((c: any) => c.id === originalCollapsedCluster);
                            const aggContinent = originalClusterInfo?.data?.continent || (originalCollapsedCluster.startsWith('cluster_ghost') ? 'external' : (originalCollapsedCluster.replace('folder_', '').split('_')[0] || UNCHARTED_CONTINENT));
                            
                            aggregateNodes.set(originalCollapsedCluster, {
                                id: aggId,
                                cluster_id: originalCollapsedCluster,
                                label: `[Aggregate] ${originalCollapsedCluster}`,
                                type: 'aggregate',
                                data: {
                                    continent: aggContinent
                                }
                            });
                        }
                        
                        if (fromExp) {
                            e.originalTo = e.to;
                            e.to = aggId;
                        } else {
                            e.originalFrom = e.from;
                            e.from = aggId;
                        }
                        
                        return true;
                    }
                    return false;
                });
                
                // Append aggregate nodes to targetNodes
                targetNodes.push(...Array.from(aggregateNodes.values()));
            } else {
                targetNodes = [];
                targetEdges = [];
            }
            
            console.log(
              "[VD_VISIBLE_FILTER_RESULT]",
              targetNodes.length,
              targetEdges.length,
              state.clusters?.length
            );
        }
        
        // [v0.3.34.9] Pre-Platform Filter Logging (Hub Top 5 Before)
        const rawNodeMap = new Map();
        targetNodes.forEach((n: any) => rawNodeMap.set(n.id, { id: n.id, fanout: 0 }));
        targetEdges.forEach((e: any) => {
            if (rawNodeMap.has(e.from)) rawNodeMap.get(e.from).fanout++;
            if (rawNodeMap.has(e.to)) rawNodeMap.get(e.to).fanout++;
        });
        const hubBefore = Array.from(rawNodeMap.values()).sort((a: any, b: any) => b.fanout - a.fanout).slice(0, 5);
        Logger.info(`[HUB_BEFORE] Top 5:\n${hubBefore.map((h, i) => `  ${i+1}. ${h.id} (fanout=${h.fanout})`).join('\n')}`);

        // [v0.3.34.9] Platform Header 투명 처리
        const { PlatformHeaderPolicy } = require('./analysis/PlatformHeaderPolicy');
        const { ContractHeaderPolicy } = require('./analysis/ContractHeaderPolicy');
        const { ArchitectureHeaderPolicy } = require('./analysis/ArchitectureHeaderPolicy');

        const platformNodeIds = new Set<string>();
        const contractNodeIds = new Set<string>();
        const archNodeIds = new Set<string>();

        for (const n of targetNodes) {
            const id = n.id || (n.data as any)?.file || '';
            if (PlatformHeaderPolicy.isPlatformHeader(id)) platformNodeIds.add(n.id);
            else if (ArchitectureHeaderPolicy.isArchitectureHeader(id)) archNodeIds.add(n.id);
            else if (ContractHeaderPolicy.isContractHeader(id)) contractNodeIds.add(n.id);
        }

        const beforeNodeCount = targetNodes.length;
        const beforeEdgeCount = targetEdges.length;
        const targetEdgesBefore = targetEdges;

        targetNodes = targetNodes.filter((n: any) => !platformNodeIds.has(n.id) && !archNodeIds.has(n.id));
        targetEdges = targetEdges.filter((e: any) =>
            !platformNodeIds.has(e.from) && !platformNodeIds.has(e.to) &&
            !archNodeIds.has(e.from) && !archNodeIds.has(e.to)
        );

        Logger.info(`[PLATFORM_FILTER] Platform Headers Removed: ${platformNodeIds.size}`);
        Logger.info(`[PLATFORM_FILTER] Architecture Headers Removed: ${archNodeIds.size}`);
        Logger.info(`[PLATFORM_FILTER] Contract Headers Retained: ${contractNodeIds.size}`);
        Logger.info(`[PLATFORM_FILTER] Nodes: ${beforeNodeCount} → ${targetNodes.length}`);
        Logger.info(`[PLATFORM_FILTER] Edges: ${beforeEdgeCount} → ${targetEdges.length}`);
        
        // [v0.3.34.9] Compute Hubs After
        const rawNodeMapAfter = new Map();
        targetNodes.forEach((n: any) => rawNodeMapAfter.set(n.id, { id: n.id, fanout: 0 }));
        targetEdges.forEach((e: any) => {
            if (rawNodeMapAfter.has(e.from)) rawNodeMapAfter.get(e.from).fanout++;
            if (rawNodeMapAfter.has(e.to)) rawNodeMapAfter.get(e.to).fanout++;
        });
        const hubAfter = Array.from(rawNodeMapAfter.values()).sort((a: any, b: any) => b.fanout - a.fanout).slice(0, 5);
        Logger.info(`[HUB_AFTER] Top 5:\n${hubAfter.map((h, i) => `  ${i+1}. ${h.id} (fanout=${h.fanout})`).join('\n')}`);
        
        try {
            const { TarjanSCC } = require('./analysis/reasoning/TarjanSCC');
            const sccBeforeFilter = TarjanSCC.extractFromSubset(Array.from(rawNodeMap.keys()), targetEdgesBefore);
            const sccBeforeLargest = sccBeforeFilter.length > 0 ? Math.max(...sccBeforeFilter.map((s: any) => s.nodeIds.length)) : 0;
            const sccBeforeAvg = sccBeforeFilter.length > 0 ? sccBeforeFilter.reduce((sum: number, s: any) => sum + s.nodeIds.length, 0) / sccBeforeFilter.length : 0;
            Logger.info(`[SCC_BEFORE] SCC Count: ${sccBeforeFilter.length}, Largest SCC: ${sccBeforeLargest}, Average SCC: ${sccBeforeAvg.toFixed(1)}`);

            const sccAfterFilter = TarjanSCC.extractFromSubset(Array.from(rawNodeMapAfter.keys()), targetEdges);
            const sccAfterLargest = sccAfterFilter.length > 0 ? Math.max(...sccAfterFilter.map((s: any) => s.nodeIds.length)) : 0;
            const sccAfterAvg = sccAfterFilter.length > 0 ? sccAfterFilter.reduce((sum: number, s: any) => sum + s.nodeIds.length, 0) / sccAfterFilter.length : 0;
            Logger.info(`[SCC_AFTER] SCC Count: ${sccAfterFilter.length}, Largest SCC: ${sccAfterLargest}, Average SCC: ${sccAfterAvg.toFixed(1)}`);
        } catch (e: any) {
            Logger.error(`[SCC_COMPARE_ERROR] ${e.message}`);
        }

        Logger.info(`[RUNTIME_SCOPE]\nvisibleClusters=${state.clusters?.length || 0}\nvisibleNodes=${targetNodes.length}\nruntimeNodes=${targetNodes.length}`);

        Logger.info('[PRE_AAE_COLLAPSE]', (Array.isArray(state.clusters) ? state.clusters : Object.values(state.clusters || {})).filter((c: any) => c?.collapsed === true).length);

        Logger.info('[VD-CHECKPOINT-1] Creating targetState');
        const targetState = { ...state, nodes: targetNodes, edges: targetEdges };
        console.log(
          '[VD_SNAPSHOT_BUILD]',
          {
             nodes: targetState.nodes?.length,
             edges: targetState.edges?.length,
             clusters: targetState.clusters?.length
          }
        );
        
        const nodesBefore = targetState.nodes;
        const edgesBefore = targetState.edges;
        const nodeCountBefore = targetState.nodes?.length || 0;
        const edgeCountBefore = targetState.edges?.length || 0;
        
        Logger.info('[VD-CHECKPOINT-2] Stringifying hashBefore');
        const hashBefore = JSON.stringify(targetState.nodes?.map(n => n.status));
        
        Logger.info('[VD-CHECKPOINT-3] Getting diagnostics start');
        
        Logger.info('[VD-CHECKPOINT-3.1] Creating providers');
        const localProvider = new LocalDiagnosticProvider();
        const remoteProvider = new RemoteDiagnosticProvider();

        Logger.info('[VD-CHECKPOINT-3.2] Calling Promise.all');
        const [localDiags, remoteDiags] = await Promise.all([
            (async () => {
                Logger.info('[VD-CHECKPOINT-3.3] Local getDiagnostics start');
                const diags = await localProvider.getDiagnostics();
                Logger.info('[VD-CHECKPOINT-3.4] Local getDiagnostics end');
                return diags;
            })(),
            (async () => {
                Logger.info('[VD-CHECKPOINT-3.5] Remote getDiagnostics start');
                const diags = await remoteProvider.getDiagnostics();
                Logger.info('[VD-CHECKPOINT-3.6] Remote getDiagnostics end');
                return diags;
            })()
        ]);

        Logger.info('[VD-CHECKPOINT-4] Diagnostics ready');
        const allDiags = [...localDiags, ...remoteDiags];

        Logger.info('[VD-CHECKPOINT-5] Loading analyzers');
        const { ArchitectureAnalysisEngine } = require('./analysis/ArchitectureAnalysisEngine');
        const { NecrosisAnalyzer } = require('./analysis/analyzers/NecrosisAnalyzer');
        const { FractureAnalyzer } = require('./analysis/analyzers/FractureAnalyzer');
        const { CycleAnalyzer } = require('./analysis/analyzers/CycleAnalyzer');
        const { BoundaryGuardAnalyzer } = require('./analysis/analyzers/BoundaryGuardAnalyzer');
        const { DependencyPressureAnalyzer } = require('./analysis/analyzers/DependencyPressureAnalyzer');
        const { SchemaViolationAnalyzer } = require('./analysis/analyzers/SchemaViolationAnalyzer');
        const { DeadEndAnalyzer } = require('./analysis/analyzers/DeadEndAnalyzer');
        const { BoundaryAnalyzer } = require('./analysis/analyzers/BoundaryAnalyzer');
        const { IsolatedNodeAnalyzer } = require('./analysis/analyzers/IsolatedNodeAnalyzer');
        const { ReportExporter } = require('./analysis/ReportExporter');
        const { ReportAggregator } = require('./analysis/aggregation/ReportAggregator');
        
        Logger.info('[VD-CHECKPOINT-6] Registering analyzers');
        const engine = new ArchitectureAnalysisEngine();
        engine.registerAnalyzer(new NecrosisAnalyzer());
        engine.registerAnalyzer(new FractureAnalyzer());
        engine.registerAnalyzer(new BoundaryAnalyzer()); // Added for Semantic Boundary Discovery
        engine.registerAnalyzer(new CycleAnalyzer());
        engine.registerAnalyzer(new BoundaryGuardAnalyzer());
        engine.registerAnalyzer(new DependencyPressureAnalyzer());
        engine.registerAnalyzer(new SchemaViolationAnalyzer());
        engine.registerAnalyzer(new DeadEndAnalyzer());
        console.log('[ASR_SCOPE]', {
            expanded: visibleClusterIds?.length || 0,
            collapsed: (targetState.clusters?.length || 0) - (visibleClusterIds?.length || 0)
        });

        console.log('[ASR_GRAPH_INPUT]', {
            nodes: targetState.nodes?.length,
            edges: targetState.edges?.length,
            clusters: targetState.clusters?.length,
            diagnostics: allDiags.length
        });
        console.log('[ASR_GRAPH_SAMPLE]', {
            firstNodes: targetState.nodes?.slice(0, 5).map((n: any) => n.id),
            firstEdges: targetState.edges?.slice(0, 5).map((e: any) => `${e.from}->${e.to}`)
        });
        const evidenceBundle = engine.run(targetState, allDiags, workspaceRoot);
        Logger.info(`[CHECKPOINT-A] AAE returned`);
        console.log('[AAE_RESULT]', {
            findings: evidenceBundle.findings.length,
            necrosis: evidenceBundle.findings.filter((f: any) => f.type === 'necrosis').length,
            fracture: evidenceBundle.findings.filter((f: any) => f.type === 'fracture').length,
            cycle: evidenceBundle.findings.filter((f: any) => f.type === 'cycle').length
        });
        Logger.info(`[CHECKPOINT-A1] findings=${evidenceBundle.findings.length}`);
        
        const simContextPath = require('path').join(workspaceRoot, 'synapse_report', 'surgery', 'simulation_evidence.json');
        require('fs').mkdirSync(require('path').dirname(simContextPath), { recursive: true });
        const simulationContext = {
            timestamp: Date.now(),
            evidenceBundle: evidenceBundle,
            visibleClusterIds: visibleClusterIds
        };
        require('fs').writeFileSync(simContextPath, JSON.stringify(simulationContext, null, 2), 'utf-8');

        // [v0.3.34.31] Dump Boundary Analysis Report for Semantic Discovery Verification
        try {
            const { BoundaryAnalysisReportBuilder } = require('./reporting/BoundaryAnalysisReportBuilder');
            const bReport = BoundaryAnalysisReportBuilder.build(evidenceBundle);
            const bReportPath = require('path').join(workspaceRoot, 'synapse_report', 'BoundaryAnalysisReport.md');
            require('fs').writeFileSync(bReportPath, bReport, 'utf-8');
            Logger.info(`[BoundaryGraphBuilder] Dumped BoundaryAnalysisReport to ${bReportPath}`);
        } catch (err) {
            Logger.error('[BoundaryGraphBuilder] Failed to build BoundaryAnalysisReport', err);
        }
        
        Logger.info(`[CHECKPOINT-B] before aggregate`);
        const aggregatedBundle = ReportAggregator.aggregate(evidenceBundle, targetState);
        Logger.info(`[CHECKPOINT-C] after aggregate`);
        
        const { ReasoningEngine } = require('./analysis/reasoning/ReasoningEngine');
        Logger.info(`[CHECKPOINT-D] before reason`);
        const reasonedBundle = ReasoningEngine.reason(aggregatedBundle, targetState, visibleClusterIds);
        Logger.info(`[CHECKPOINT-E] after reason`);
        
        // [v0.3.35] Fix empty array fallback bug
        const { ClusterBridgeAnalyzer } = require('./analysis/ClusterBridgeAnalyzer');
        const activeClusterIds = visibleClusterIds !== undefined
            ? visibleClusterIds
            : allClusters.map((c: any) => c.id);
        Logger.info(`[VD_BRIDGE_SCOPE] Using ${visibleClusterIds?.length ? 'VISIBLE' : 'ALL'} clusters (count=${activeClusterIds.length})`);
        console.log('[COUPLING_CALL]', {
            activeClusterIds: activeClusterIds.length,
            nodes: targetState.nodes?.length,
            edges: targetState.edges?.length
        });
        const bridges = ClusterBridgeAnalyzer.analyzeVisibleClusters(activeClusterIds, targetState.nodes || [], targetState.edges || [], targetState.clusters);
        console.log('[COUPLING_RESULT]', { bridges: bridges.length });
        reasonedBundle.clusterBridges = bridges;
        Logger.info(`[CHECKPOINT-E1] after ClusterBridgeAnalyzer`);
        Logger.info('[POST_AAE_COLLAPSE]', (Array.isArray(state.clusters) ? state.clusters : Object.values(state.clusters || {})).filter((c: any) => c?.collapsed === true).length);
        Logger.info('[POST_AAE_VISIBLE]', visibleClusterIds?.length || 0);

        
        let surgeryReportUri: any = null;
        if (workspaceRoot) {
            Logger.info(`[CHECKPOINT-F] before ValidationEngine execution (Surgery Pipeline)`);
            const fs = require('fs');
            const path = require('path');
            
            // Phase 1: Temporary JSON dump for CLI compatibility / debugging
            if (process.env.SYNAPSE_DEBUG_DUMP === 'true') {
                const tempStatePath = path.join(workspaceRoot, 'synapse_report', 'temp_target_state.json');
                fs.mkdirSync(path.join(workspaceRoot, 'synapse_report'), { recursive: true });
                fs.writeFileSync(tempStatePath, JSON.stringify(targetState, null, 2), 'utf8');
                console.log("[ASR] temp dump ok");
            }

            try {
                // 1. Run Validation Engine directly
                Logger.info(`[Laboratory] Running Validation Engine in-memory`);
                console.log("[ASR] validation start");
                
                // Construct GraphSnapshot from targetState
                const snapshot: GraphSnapshot = {
                    nodes: targetState.nodes || [],
                    edges: targetState.edges || [],
                    clusters: targetState.clusters || []
                };

                console.log(
                  '[ASR_SNAPSHOT]',
                  {
                    nodes: snapshot.nodes.length,
                    edges: snapshot.edges.length,
                    clusters: snapshot.clusters?.length ?? 0
                  }
                );

                console.log(
                  '[ASR_CLUSTER_SAMPLE]',
                  snapshot.clusters
                    ?.slice(0, 20)
                    .map((c: any) => ({
                      id: c.id,
                      collapsed: c.collapsed
                    }))
                );

                // Run Graph Edge Aggregator to generate IntentEdge Cache for ASR Evidence Layer
                const edgeMap = new Map<string, any>();
                for (const e of snapshot.edges) {
                    const fromId = e.originalFrom || e.from;
                    const toId = e.originalTo || e.to;
                    if (!fromId || !toId) continue;
                    const key = `${fromId}|${toId}`;
                    if (!edgeMap.has(key)) {
                        const isGhost = (e.originalFrom && e.from.includes('AGGREGATE')) || (e.originalTo && e.to.includes('AGGREGATE'));
                        edgeMap.set(key, { source: fromId, target: toId, evidenceCount: 0, isGhost });
                    }
                    edgeMap.get(key).evidenceCount += (e.weight ?? 1);
                }
                const intentEdges = Array.from(edgeMap.values());

                const analysisMode = visibleClusterIds !== undefined ? 'SELECTED_CLUSTER' : 'GLOBAL';
                const selectedClusters = visibleClusterIds || [];
                const nodeCount = snapshot.nodes.length;
                const edgeCount = snapshot.edges.length;
                const visibleClusterCount = visibleClusterIds?.length || (snapshot.clusters?.length ?? 0);

                console.log("[SCOPE_AUDIT]", {
                  analysisMode,
                  selectedClusters,
                  nodeCount,
                  edgeCount,
                  visibleClusterCount
                });

                const context = ValidationEngine.analyzeState(snapshot, 1, workspaceRoot, intentEdges);
                console.log("[ASR] validation exit 0");

                try {
                    const { ReasoningPipelineRunner } = require('./reasoning/ReasoningPipelineRunner');
                    const answerBundle = ReasoningPipelineRunner.run(snapshot, context);
                    (context as any).answerBundle = answerBundle;
                    console.log("[REASONING] bundle attached");
                    console.log("[REASONING]", answerBundle?.extensionPoints?.length);
                    console.log("[REASONING_CONTEXT]", !!(context as any).answerBundle);
                } catch (reasoningErr: any) {
                    console.log("[ASR] reasoning pipeline failed", reasoningErr.message);
                    console.error("[REASONING] failed", reasoningErr);
                }
                
                console.log(
                  '[ASR_CTX]',
                  {
                    findings: (context.metrics as any).findings?.length,
                    communities: (context.metrics as any).communities?.length,
                    species: (context.metrics as any).species?.length,
                    diagnostics: (context.metrics as any).diagnostics?.length
                  }
                );

                console.log(
                  '[ASR_REPORT_INPUT]',
                  Object.keys(context.metrics)
                );

                // 2. Run generate_surgery_report logic
                Logger.info(`[Laboratory] Generating Surgery Report (SIMULATION_DEBUG)...`);
                console.log("[ASR] surgery start");
                
                const { ReportBundleGenerator } = require('./reporting/ReportBundleGenerator');
                const mdPath = await ReportBundleGenerator.generateBundle(context, workspaceRoot, { command: 'fetchSimulationDebug' });
                console.log("[ASR] surgery exit 0");
                
                surgeryReportUri = vscode.Uri.file(mdPath);
                console.log("[ASR] report generated", surgeryReportUri.fsPath);
            } catch (err: any) {
                Logger.error(`[Surgery Error] Engine execution failed: ${err.message}`);
                console.log("[ASR] execution failed", err.message);
                if (err.stack) Logger.error(`STACK: ${err.stack}`);
            }
            Logger.info(`[CHECKPOINT-G] after ValidationEngine execution`);
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
            Logger.error(`Legacy Count: ${legacyCount}, New Count: ${newCount}`);
            // [v0.3.34.8] Prevent massive JSON dump that freezes terminal and Extension Host
            Logger.error(`[VP-01] Mismatch details omitted for huge graphs to prevent OOM/freezing.`);
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
            analyzedNodeCount: targetNodes.length,
            surgeryReportUri
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
