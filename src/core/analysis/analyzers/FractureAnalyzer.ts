import { ProjectState } from '../../../types/schema';
import { 
    ArchitectureAnalyzer, 
    AnalysisContext, 
    AnalyzerResult, 
    FractureFinding,
    NecrosisFinding,
    getFindingsByType
} from '../types';

export class FractureAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'FractureAnalyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const fractureFindings: FractureFinding[] = [];
        const edges = state.edges || [];

        // 1. Get necrosis findings from previous analyzer in the pipeline
        const necrosisFindings = getFindingsByType<NecrosisFinding>(context, 'necrosis');
        
        // Optimize lookup for necrotic nodes (ONLY Error severity causes fracture in legacy)
        // vscode.DiagnosticSeverity.Error is 0
        const errorNodeIds = new Set(
            necrosisFindings
                .filter(f => f.severity === 0)
                .map(f => f.nodeId)
        );

        // 2. Rule: If a source node has an Error (not just warning), its outgoing edges are fractured.
        // We match exactly the legacy VirtualDebugger logic here.
        for (const edge of edges) {
            if (errorNodeIds.has(edge.from)) {
                fractureFindings.push({
                    type: 'fracture',
                    edgeId: edge.id,
                    sourceNodeId: edge.from
                });
            }
        }

        return {
            findings: fractureFindings
        };
    }
}
