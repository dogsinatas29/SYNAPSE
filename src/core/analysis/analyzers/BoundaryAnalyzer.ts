import { ProjectState } from '../../../types/schema';
import { AnalysisContext, ArchitectureAnalyzer, AnalyzerResult, SemanticFinding } from '../types';
import { BoundaryGraphBuilder } from './BoundaryGraphBuilder';
import { EvidenceType } from '../../reporting/types';

export class BoundaryAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'BoundaryAnalyzer';
    private builder: BoundaryGraphBuilder;

    constructor() {
        this.builder = new BoundaryGraphBuilder();
    }

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const findings: SemanticFinding[] = [];

        // Build the Boundary Graph using the provided state snapshot directly
        // rather than relying on a potentially empty global GraphModel.
        const result = this.builder.build(state.nodes || [], state.edges || []);

        // Generate Semantic Findings for Boundary Nodes
        for (const node of result.nodes) {
            findings.push({
                type: 'semantic',
                evidenceType: EvidenceType.BOUNDARY_NODE,
                targetId: node.id,
                message: `Boundary Node discovered: ${node.id} with ${node.size} members (Strength: ${node.strength})`,
                metadata: {
                    members: node.members,
                    internalEdges: node.internalEdges,
                    externalEdges: node.externalEdges,
                    size: node.size,
                    cohesion: node.cohesion,
                    strength: node.strength
                }
            });
        }

        if (result.splitWrappers) {
            for (const wrapperId of result.splitWrappers) {
                findings.push({
                    type: 'semantic',
                    evidenceType: EvidenceType.WRAPPER_NODE,
                    targetId: wrapperId,
                    message: `Wrapper Node split: ${wrapperId}`,
                    metadata: {}
                });
            }
        }

        // Generate Semantic Findings for Cross Boundary Dependencies
        for (const edge of result.edges) {
            findings.push({
                type: 'semantic',
                evidenceType: EvidenceType.CROSS_BOUNDARY_DEPENDENCY,
                targetId: edge.from, // Focus on source
                message: `Cross Boundary Dependency: ${edge.from} -> ${edge.to} (${edge.dependencyCount} dependencies)`,
                metadata: {
                    from: edge.from,
                    to: edge.to,
                    dependencyCount: edge.dependencyCount,
                    weight: edge.weight
                }
            });
        }

        return { findings };
    }
}
