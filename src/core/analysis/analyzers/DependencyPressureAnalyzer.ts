import { ProjectState, Node } from '../../../types/schema';
import { AnalysisContext, AnalyzerResult, ArchitectureAnalyzer, PressureFinding } from '../types';

export class DependencyPressureAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'dependency_pressure_analyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const findings: PressureFinding[] = [];
        const nodes = state.nodes || [];
        const edges = state.edges || [];

        // Logic nodes filter
        const nonLogicTypes = ['document', 'documentation', 'doc', 'directory', 'folder', 'file', 'asset', 'history'];
        const logicNodes = nodes.filter(n => !nonLogicTypes.includes(n.type as string));
        const logicNodeIds = new Set(logicNodes.map(n => n.id));
        const logicEdges = edges.filter(e => logicNodeIds.has(e.from) && logicNodeIds.has(e.to));

        const incomingCount = new Map<string, number>();
        const outgoingCount = new Map<string, number>();

        logicEdges.forEach(e => {
            incomingCount.set(e.to, (incomingCount.get(e.to) || 0) + 1);
            outgoingCount.set(e.from, (outgoingCount.get(e.from) || 0) + 1);
        });

        // detectBottlenecks
        logicNodes.forEach(node => {
            const count = incomingCount.get(node.id) || 0;
            if (count >= 5) {
                findings.push({
                    type: 'pressure',
                    message: `병목 지점 의심: '${node.data?.label || node.id}'에 ${count}개의 의존성이 집중되어 있습니다.`,
                    nodeId: node.id,
                    pressureType: 'bottleneck',
                    value: count
                });
            }
        });

        // detectV0321Hints (Uses ALL nodes and ALL edges)
        const allIncomingCount = new Map<string, number>();
        const allOutgoingCount = new Map<string, number>();

        edges.forEach(e => {
            allIncomingCount.set(e.to, (allIncomingCount.get(e.to) || 0) + 1);
            allOutgoingCount.set(e.from, (allOutgoingCount.get(e.from) || 0) + 1);
        });

        nodes.forEach(node => {
            const outgoing = allOutgoingCount.get(node.id) || 0;
            const incoming = allIncomingCount.get(node.id) || 0;
            const connections = outgoing + incoming;

            // 1. Super Node: connections > 10 (threshold)
            if (connections > 10) {
                findings.push({
                    type: 'pressure',
                    message: `[Hint] High coupling detected in '${node.data?.label}'. Consider splitting responsibilities.`,
                    nodeId: node.id,
                    pressureType: 'warning',
                    value: connections
                });
            }

            // 2. Fan-out Overload: out > 7 and out > 3 * in
            if (outgoing > 7 && outgoing > incoming * 3) {
                findings.push({
                    type: 'pressure',
                    message: `[Hint] High fan-out in '${node.data?.label}'. Possible orchestrator overload.`,
                    nodeId: node.id,
                    pressureType: 'fan-out',
                    value: outgoing
                });
            }

            // 3. Fan-in Overload: in > 7 and in > 3 * out
            if (incoming > 7 && incoming > outgoing * 3) {
                findings.push({
                    type: 'pressure',
                    message: `[Hint] High fan-in in '${node.data?.label}'. Potential hidden dependency hub.`,
                    nodeId: node.id,
                    pressureType: 'fan-in',
                    value: incoming
                });
            }
        });

        const flowMap = new Map<string, number>();
        const clusterOutCount = new Map<string, number>();
        const nodeMap = context.nodeMap || new Map<string, Node>(nodes.map(n => [n.id, n]));

        edges.forEach(edge => {
            const src = nodeMap.get(edge.from);
            const tgt = nodeMap.get(edge.to);
            if (src && tgt && src.data?.cluster_id && tgt.data?.cluster_id && src.data?.cluster_id !== tgt.data?.cluster_id) {
                const key = `${src.data.cluster_id}->${tgt.data.cluster_id}`;
                clusterOutCount.set(src.data.cluster_id, (clusterOutCount.get(src.data.cluster_id) || 0) + 1);
                flowMap.set(key, (flowMap.get(key) || 0) + 1);
            }
        });

        flowMap.forEach((count, key) => {
            const [srcId, tgtId] = key.split('->');
            if (tgtId === 'cluster_ghosts' || tgtId === 'doc_shelf') return;
            
            const totalOut = clusterOutCount.get(srcId) || 1;
            const ratio = count / totalOut;

            if (ratio > 0.6 && count > 5) {
                const relatedNodes = nodes.filter(n => n.data?.cluster_id === srcId);
                if (relatedNodes.length > 0) {
                    findings.push({
                        type: 'pressure',
                        message: `[Hint] Strong dependency between clusters (${srcId} -> ${tgtId}). Consider boundary extraction.`,
                        nodeId: relatedNodes[0].id,
                        pressureType: 'warning',
                        value: count
                    });
                }
            }
        });

        return { findings };
    }
}
