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

        const diagnostics = vscode.languages.getDiagnostics();
        const nodes = state.nodes!;
        const edges = state.edges!;

        // Map diagnostics to nodes
        for (const [uri, diagList] of diagnostics) {
            const relativePath = vscode.workspace.asRelativePath(uri);
            
            // Find nodes associated with this file
            const associatedNodes = nodes.filter(n => n.data.file === relativePath);
            
            if (associatedNodes.length > 0) {
                diagList.forEach(diag => {
                    // Only consider Errors and Warnings for Necrosis
                    if (diag.severity === vscode.DiagnosticSeverity.Error || diag.severity === vscode.DiagnosticSeverity.Warning) {
                        associatedNodes.forEach(node => {
                            if (!impact.necrosisNodeIds.includes(node.id)) {
                                impact.necrosisNodeIds.push(node.id);
                            }
                            impact.reports.push({
                                nodeId: node.id,
                                message: diag.message,
                                severity: diag.severity,
                                line: diag.range.start.line
                            });
                        });
                    }
                });
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
