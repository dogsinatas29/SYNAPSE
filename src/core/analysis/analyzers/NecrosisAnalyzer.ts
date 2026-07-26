import { ProjectState } from '../../../types/schema';
import { 
    ArchitectureAnalyzer, 
    AnalysisContext, 
    AnalyzerResult, 
    NecrosisFinding 
} from '../types';
import * as vscode from 'vscode'; // Required for vscode.DiagnosticSeverity

export class NecrosisAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'NecrosisAnalyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const necrosisFindings: NecrosisFinding[] = [];
        const diagnostics = context.diagnostics || [];

        // O(1) Lookup: Group nodes by relative path
        const fileToNodeIds = new Map<string, string[]>();
        
        if (state.nodes) {
            for (const node of state.nodes) {
                const nodeData = (node as any).data;
                const nodeFile = (nodeData?.file || node.filePath || '').replace(/\\/g, '/');
                if (nodeFile) {
                    const ids = fileToNodeIds.get(nodeFile) || [];
                    ids.push(node.id);
                    fileToNodeIds.set(nodeFile, ids);
                }
            }
        }

        // Deduplication to match legacy 'impact.necrosisNodeIds' exactly
        const seenNecrosisNodes = new Set<string>();

        for (const diag of diagnostics) {
            if (diag.severity !== vscode.DiagnosticSeverity.Error && diag.severity !== vscode.DiagnosticSeverity.Warning) {
                continue;
            }

            const relativePath = diag.relativePath;
            const associatedNodeIds = fileToNodeIds.get(relativePath);

            if (associatedNodeIds && associatedNodeIds.length > 0) {
                for (const nodeId of associatedNodeIds) {
                    if (!seenNecrosisNodes.has(nodeId)) {
                        seenNecrosisNodes.add(nodeId);
                        necrosisFindings.push({
                            type: 'necrosis',
                            nodeId,
                            message: diag.message,
                            severity: diag.severity
                        });
                    }
                }
            }
        }

        return {
            findings: necrosisFindings
        };
    }
}
