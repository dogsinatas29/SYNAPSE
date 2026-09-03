import { SimulationScenario } from '../../scenario/SimulationScenario';
import { SimulationPropagationResult } from '../SimulationPropagationResult';
import { SimulationSnapshot } from '../../SimulationSnapshot';
import { PropagationTraceEdge } from '../PropagationTraceEdge';

export interface SimulationAuditReport {
    summaryMarkdown: string;
    traceGraph: PropagationTraceEdge[];
}

export class SimulationAuditBuilder {
    public build(
        scenario: SimulationScenario,
        snapshot: SimulationSnapshot,
        result: SimulationPropagationResult
    ): SimulationAuditReport {
        const rootCauseEvidenceCount = scenario.evidenceIds ? scenario.evidenceIds.length : 0;
        const transitionCount = result.transitions.length;
        const traceCount = result.traces.length;
        
        let affectedNodes = 0;
        let affectedEdges = 0;
        const clusterDistribution = new Map<string, number>();

        for (const t of result.transitions) {
            if (t.ownerType === 'NODE') {
                affectedNodes++;
                const node = snapshot.getNode(t.ownerId);
                if (node) {
                    const clusterParts = node.cluster_id.split('/');
                    const rootCluster = clusterParts[0];
                    clusterDistribution.set(rootCluster, (clusterDistribution.get(rootCluster) || 0) + 1);
                }
            } else {
                affectedEdges++;
            }
        }

        let clusterSummary = '';
        if (affectedNodes > 0) {
            const sortedClusters = Array.from(clusterDistribution.entries())
                .sort((a, b) => b[1] - a[1]);
            
            for (const [cluster, count] of sortedClusters) {
                const percentage = ((count / affectedNodes) * 100).toFixed(1);
                clusterSummary += `  ${cluster} ${percentage}%\n`;
            }
        }

        const evidenceLine = rootCauseEvidenceCount > 0 
            ? `└─ Evidence: ${scenario.evidenceIds?.join(', ')}`
            : `└─ Evidence: None`;

        const maxDepth = result.stats?.maxDepthReached || 0;

        const summaryMarkdown = `ROOT CAUSE
└─ Scenario: ${scenario.type} (Target: ${scenario.targetId})
${evidenceLine}

SUMMARY
Affected Nodes : ${affectedNodes}
Affected Edges : ${affectedEdges}
Transition Count : ${transitionCount}
Trace Links : ${traceCount}
Root Cause Evidence : ${rootCauseEvidenceCount}

Affected Clusters :
${clusterSummary || '  None'}
DEPTH
Max Depth : ${maxDepth} (Rule 탐색 기준)

* Note: 전체 인과 관계(Propagation Trace Graph)는 \`trace_graph.json\`으로 별도 저장되었습니다.
`;

        return {
            summaryMarkdown,
            traceGraph: result.traces
        };
    }
}
