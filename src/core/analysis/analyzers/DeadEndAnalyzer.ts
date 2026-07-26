import { ProjectState, Node } from '../../../types/schema';
import { AnalysisContext, AnalyzerResult, ArchitectureAnalyzer, StructuralFinding } from '../types';

export class DeadEndAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'dead_end_analyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const findings: StructuralFinding[] = [];
        const nodes = state.nodes || [];
        const edges = state.edges || [];

        // Logic nodes filter
        const nonLogicTypes = ['document', 'documentation', 'doc', 'directory', 'folder', 'file', 'asset', 'history'];
        const logicNodes = nodes.filter(n => !nonLogicTypes.includes(n.type as string));
        const logicNodeIds = new Set(logicNodes.map(n => n.id));
        const logicEdges = edges.filter(e => logicNodeIds.has(e.from) && logicNodeIds.has(e.to));

        const incomingSet = new Set<string>();
        const outgoingSet = new Set<string>();
        
        logicEdges.forEach(e => {
            incomingSet.add(e.to);
            outgoingSet.add(e.from);
        });

        logicNodes.forEach(node => {
            const hasIncoming = incomingSet.has(node.id);
            const hasOutgoing = outgoingSet.has(node.id);

            if (hasIncoming && !hasOutgoing) {
                if (node.data?.layer !== undefined && node.data.layer > 0) {
                    findings.push({
                        type: 'structural',
                        message: `노드 ${node.data?.label || node.id}에서 나가는 흐름이 끊겼습니다. (Dead end)`,
                        structuralType: 'dead-end',
                        nodeId: node.id
                    });
                }
            }
        });

        return { findings };
    }
}
