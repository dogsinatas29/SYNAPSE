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
    public async performVirtualDebug(state: ProjectState, workspaceRoot: string): Promise<DebugImpact> {
        Logger.info('[VirtualDebugger] Starting Virtual Debug Test...');
        
        const impact: DebugImpact = {
            necrosisNodeIds: [],
            fractureEdgeIds: [],
            reports: []
        };

        const localProvider = new LocalDiagnosticProvider();
        const remoteProvider = new RemoteDiagnosticProvider();

        const [localDiags, remoteDiags] = await Promise.all([
            localProvider.getDiagnostics(),
            remoteProvider.getDiagnostics()
        ]);

        const allDiags = [...localDiags, ...remoteDiags];

        const nodes = state.nodes || [];
        const edges = state.edges || [];

        // Map diagnostics to nodes
        for (const diag of allDiags) {
            const relativePath = diag.relativePath;
            const associatedNodes = nodes.filter(n => {
                const nodeFile = (n.data.file || '').replace(/\\/g, '/');
                return nodeFile === relativePath;
            });
            
            if (associatedNodes.length > 0) {
                if (diag.severity === vscode.DiagnosticSeverity.Error || diag.severity === vscode.DiagnosticSeverity.Warning) {
                    associatedNodes.forEach(node => {
                        if (!impact.necrosisNodeIds.includes(node.id)) {
                            impact.necrosisNodeIds.push(node.id);
                        }
                        impact.reports.push({
                            nodeId: node.id,
                            message: diag.message,
                            severity: diag.severity,
                            line: diag.line
                        });
                    });
                }
            }
        }

        // Map Impact to Edges (Fracture)
        // Rule: If a source node has an Error (not just warning), its outgoing edges are fractured.
        impact.fractureEdgeIds = edges.filter(edge => {
            const sourceNodeHasError = impact.reports.some(r => 
                r.nodeId === edge.from && r.severity === vscode.DiagnosticSeverity.Error
            );
            return sourceNodeHasError;
        }).map(e => e.id);

        Logger.info(`[VirtualDebugger] Scan complete: ${impact.necrosisNodeIds.length} nodes necrotic, ${impact.fractureEdgeIds.length} edges fractured.`);
        
        return impact;
    }

    /**
     * Updates the project state with the debug impact.
     */
    public applyImpactToState(state: ProjectState, impact: DebugImpact): ProjectState {
        if (state.nodes!) {
            state.nodes!.forEach(node => {
                if (node.status === 'error_necrosis') {
                    node.status = 'active' as any;
                }
                if (impact.necrosisNodeIds.includes(node.id)) {
                    node.status = 'error_necrosis' as any;
                }
            });
        }
        return state;
    }
}
