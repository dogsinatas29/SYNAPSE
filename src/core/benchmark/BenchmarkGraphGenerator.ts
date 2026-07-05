import * as crypto from 'crypto';
import { Node, Edge, Cluster, NodeType, EdgeType } from '../GraphModel';

export interface BenchmarkTopologyProfile {
    name: string;
    hubPercent: number;        // 허브 노드 비율
    hubEdgeMultiplier: number; // 일반 노드 대비 연결도
    clusterSkew: number;       // 클러스터 편향도
}

export const TOPOLOGY_PROFILES = {
    IDE_SMALL: { name: 'IDE_SMALL', hubPercent: 0.01, hubEdgeMultiplier: 20, clusterSkew: 1.5 },
    IDE_MEDIUM: { name: 'IDE_MEDIUM', hubPercent: 0.005, hubEdgeMultiplier: 50, clusterSkew: 2.0 },
    IDE_LARGE: { name: 'IDE_LARGE', hubPercent: 0.002, hubEdgeMultiplier: 100, clusterSkew: 3.0 },
    PATHOLOGICAL: { name: 'PATHOLOGICAL', hubPercent: 0.001, hubEdgeMultiplier: 300, clusterSkew: 5.0 },
    UNIFORM: { name: 'UNIFORM', hubPercent: 0, hubEdgeMultiplier: 1, clusterSkew: 1.0 }
};

export interface BenchmarkTopologyStats {
    maxDegree: number;
    p99Degree: number;
    p95Degree: number;
    averageDegree: number;
}

export class BenchmarkGraphGenerator {
    public static generate(
        nodeCount: number,
        edgeCount: number,
        clusterCount: number,
        profile: BenchmarkTopologyProfile,
        maxHubDegree: number
    ): { nodes: Node[], edges: Edge[], clusters: Cluster[], clusterIds: Set<string>, nodeIds: Set<string>, stats: BenchmarkTopologyStats } {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const clusters: Cluster[] = [];
        const clusterIds = new Set<string>();
        const nodeIds = new Set<string>();

        // Generate Clusters
        for (let i = 0; i < clusterCount; i++) {
            const cId = `cluster_${i}`;
            clusters.push({
                id: cId,
                label: `Cluster ${i}`,
                type: 'module',
                collapsed: false,
                position: { x: 0, y: 0 },
                bounds: { x: 0, y: 0, width: 0, height: 0 },
                children: [],
                nodes: [],
                data: { layer: 'business' }
            });
            clusterIds.add(cId);
        }

        // Generate Nodes
        const hubCount = Math.max(1, Math.floor(nodeCount * profile.hubPercent));
        for (let i = 0; i < nodeCount; i++) {
            const isHub = profile.name !== 'UNIFORM' && i < hubCount;
            const nId = `node_${i}`;
            
            const clusterIdx = Math.floor(Math.pow(Math.random(), profile.clusterSkew) * clusterCount);
            const cId = `cluster_${clusterIdx}`;

            nodes.push({
                id: nId,
                filePath: `src/mock/${cId}/${nId}.ts`,
                type: NodeType.SYMBOL,
                label: isHub ? `HubNode_${i}` : `LeafNode_${i}`,
                cluster_id: cId,
                status: 'confirmed',
                position: { x: 0, y: 0 },
                degree: 0,
                data: {
                    label: nId,
                    file: nId,
                    cluster_id: cId,
                    icon: isHub ? '🌟' : '📄',
                    continent: cId,
                    subcontinent: cId,
                    continent_type: 'INTERNAL'
                },
                intelligence: {},
                visual: { opacity: 1.0 }
            });
            nodeIds.add(nId);
        }

        const hubNodes = profile.name !== 'UNIFORM' ? nodes.slice(0, hubCount) : [];
        const leafNodes = profile.name !== 'UNIFORM' ? nodes.slice(hubCount) : nodes;

        const assignEdgesMultiTier = () => {
            const weights = new Float64Array(nodeCount);
            let totalWeight = 0;
            
            const topHubCount = Math.max(1, Math.floor(nodeCount * profile.hubPercent * 0.1));
            const midHubCount = Math.max(1, Math.floor(nodeCount * profile.hubPercent * 0.9));
            const smallHubCount = Math.max(1, Math.floor(nodeCount * profile.hubPercent * 10));
            
            for (let i = 0; i < nodeCount; i++) {
                if (profile.name === 'UNIFORM') {
                    weights[i] = 1;
                } else {
                    if (i < topHubCount) weights[i] = profile.hubEdgeMultiplier * 10;
                    else if (i < topHubCount + midHubCount) weights[i] = profile.hubEdgeMultiplier;
                    else if (i < topHubCount + midHubCount + smallHubCount) weights[i] = Math.max(1, profile.hubEdgeMultiplier / 5);
                    else weights[i] = 1;
                }
                totalWeight += weights[i];
            }

            // Cumulative weights for O(log n) sampling
            const cumWeights = new Float64Array(nodeCount);
            cumWeights[0] = weights[0];
            for (let i = 1; i < nodeCount; i++) cumWeights[i] = cumWeights[i-1] + weights[i];

            const sampleNode = () => {
                const r = Math.random() * totalWeight;
                let low = 0, high = nodeCount - 1;
                while (low < high) {
                    const mid = (low + high) >> 1;
                    if (r > cumWeights[mid]) low = mid + 1;
                    else high = mid;
                }
                return low;
            };

            let created = 0;
            const degreeMap = new Int32Array(nodeCount);
            let attempts = 0;
            const maxAttempts = edgeCount * 5;

            while (created < edgeCount && attempts < maxAttempts) {
                attempts++;
                const sIdx = sampleNode();
                const tIdx = sampleNode();
                if (sIdx === tIdx) continue;

                if (degreeMap[tIdx] >= maxHubDegree) continue;

                const sNode = nodes[sIdx];
                const tNode = nodes[tIdx];

                edges.push({
                    id: crypto.randomUUID(),
                    from: sNode.filePath,
                    to: tNode.id,
                    type: EdgeType.CALL,
                    weight: 1,
                    status: 'confirmed',
                    is_approved: true,
                    data: {},
                    intelligence: {},
                    visual: { color: '#888', thickness: 1 }
                });

                degreeMap[sIdx]++;
                degreeMap[tIdx]++;
                sNode.degree++;
                tNode.degree++;
                created++;
            }
        };

        assignEdgesMultiTier();

        // Calculate Stats
        const degrees = nodes.map(n => n.degree).sort((a, b) => a - b);
        const maxDegree = degrees[degrees.length - 1] || 0;
        const p99Degree = degrees[Math.floor(degrees.length * 0.99)] || 0;
        const p95Degree = degrees[Math.floor(degrees.length * 0.95)] || 0;
        const averageDegree = degrees.reduce((a, b) => a + b, 0) / (degrees.length || 1);

        const stats: BenchmarkTopologyStats = {
            maxDegree,
            p99Degree,
            p95Degree,
            averageDegree
        };

        return { nodes, edges, clusters, clusterIds, nodeIds, stats };
    }
}
