import { ProjectState, Node } from '../../../types/schema';
import { AnalysisContext, AnalyzerResult, ArchitectureAnalyzer, StructuralFinding } from '../types';

export class IsolatedNodeAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'isolated_node_analyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const findings: StructuralFinding[] = [];
        const nodes = state.nodes || [];
        const edges = state.edges || [];

        const nonLogicTypes = ['document', 'documentation', 'doc', 'directory', 'folder', 'file', 'asset', 'history'];
        const logicNodes = nodes.filter(n => !nonLogicTypes.includes(n.type as string));
        const logicNodeIds = new Set(logicNodes.map(n => n.id));
        const logicEdges = edges.filter(e => logicNodeIds.has(e.from) && logicNodeIds.has(e.to));

        const connectedIds = new Set<string>();
        for (const edge of logicEdges) {
            connectedIds.add(edge.from);
            connectedIds.add(edge.to);
        }

        logicNodes.forEach(node => {
            const hasEdge = connectedIds.has(node.id);
            if (!hasEdge && (node.type as any) !== 'cluster' && (node.type as any) !== 'documentation') {
                findings.push({
                    type: 'structural',
                    message: `고립된 노드: '${node.data?.label}'이(가) 어떤 흐름과도 연결되어 있지 않습니다.`,
                    structuralType: 'isolated',
                    nodeId: node.id
                });
            }
        });

        return { findings };
    }
}
