export interface NodeScore {
    targetId: string;
    rawScore: number;
    category: string;
    weight: number;
    finalScore: number;
}

export interface ClusterStat {
    clusterId: string;
    memberCount: number; // Total valid nodes in this cluster
    candidateCount: number; // Nodes with finalScore > 0 in this cluster
    rawBetweennessSum: number;
    weightedBetweennessSum: number;
    maxNodeBetweenness: number; // Max raw score in cluster
    maxWeightedBetweenness: number; // Max weighted score in cluster
    maxNodeId: string;
    topNodeContribution: number; // maxNodeBetweenness / rawBetweennessSum
    candidateRatio: number; // candidateCount / memberCount
    topContributors: string[]; // Node IDs of top contributors
}

export class ClusterAggregator {
    private getClusterId(filePath: string): string {
        const parts = filePath.split('/');
        if (parts.length <= 1) return '/';
        parts.pop();
        return parts.join('/');
    }

    public aggregate(scoredNodes: NodeScore[], allValidNodeIds: string[]): ClusterStat[] {
        const clusterMap = new Map<string, ClusterStat>();
        const clusterNodes = new Map<string, NodeScore[]>();

        // 1. Initialize clusters with member counts based on all valid nodes
        for (const id of allValidNodeIds) {
            const clusterId = this.getClusterId(id);
            if (!clusterMap.has(clusterId)) {
                clusterMap.set(clusterId, {
                    clusterId,
                    memberCount: 0,
                    candidateCount: 0,
                    rawBetweennessSum: 0,
                    weightedBetweennessSum: 0,
                    maxNodeBetweenness: 0,
                    maxWeightedBetweenness: 0,
                    maxNodeId: '',
                    topNodeContribution: 0,
                    candidateRatio: 0,
                    topContributors: []
                });
                clusterNodes.set(clusterId, []);
            }
            clusterMap.get(clusterId)!.memberCount++;
        }

        // 2. Aggregate candidate scores
        for (const node of scoredNodes) {
            const clusterId = this.getClusterId(node.targetId);
            const stat = clusterMap.get(clusterId);
            if (!stat) continue; 

            stat.candidateCount++;
            stat.rawBetweennessSum += node.rawScore;
            stat.weightedBetweennessSum += node.finalScore;
            clusterNodes.get(clusterId)!.push(node);

            if (node.rawScore > stat.maxNodeBetweenness) {
                stat.maxNodeBetweenness = node.rawScore;
                stat.maxNodeId = node.targetId;
            }
            if (node.finalScore > stat.maxWeightedBetweenness) {
                stat.maxWeightedBetweenness = node.finalScore;
            }
        }

        // 3. Compute derived metrics and top contributors
        const result: ClusterStat[] = [];
        for (const stat of clusterMap.values()) {
            if (stat.candidateCount === 0) continue;

            stat.topNodeContribution = stat.rawBetweennessSum > 0 
                ? stat.maxNodeBetweenness / stat.rawBetweennessSum 
                : 0;
            
            stat.candidateRatio = stat.memberCount > 0 
                ? stat.candidateCount / stat.memberCount 
                : 0;

            const nodesInCluster = clusterNodes.get(stat.clusterId) || [];
            nodesInCluster.sort((a, b) => b.finalScore - a.finalScore);
            stat.topContributors = nodesInCluster.slice(0, 3).map(n => n.targetId);
                
            result.push(stat);
        }

        return result;
    }
}
