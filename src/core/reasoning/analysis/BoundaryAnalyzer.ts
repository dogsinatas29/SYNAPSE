import { GraphModel, Node, Edge } from '../../GraphModel';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { detectCommunities } from '../../CommunityDetector';
import { EvidenceCategory, ICommunityEvidence, IBoundaryStrengthEvidence } from '../evidence/Evidence';

export class BoundaryAnalyzer {
    public analyze(snapshot: ReasoningSnapshot, findings: any[], graph: GraphModel): ReasoningSnapshot {
        const graphSnapshot = graph.createSnapshot();
        const nodes = graphSnapshot.nodes;
        const edges = graphSnapshot.edges;
        
        // Run Louvain Community Detection
        const result = detectCommunities(nodes, edges);

        // Convert the raw map into grouped data
        const communities = new Map<string, string[]>();
        result.nodeCommunityMap.forEach((commId, nodeId) => {
            if (!communities.has(commId)) communities.set(commId, []);
            communities.get(commId)!.push(nodeId);
        });

        const newSnapshot = snapshot.clone();
        
        const communityInternalEdges = new Map<string, number>();
        const communityExternalEdges = new Map<string, number>();
        const crossingEdges = new Map<string, { count: number, bridgeNodes: Set<string> }>();

        // Pre-calculate edge metrics
        for (const edge of edges) {
            const commA = result.nodeCommunityMap.get(edge.from);
            const commB = result.nodeCommunityMap.get(edge.to);

            if (!commA || !commB) continue;

            if (commA === commB) {
                communityInternalEdges.set(commA, (communityInternalEdges.get(commA) || 0) + 1);
            } else {
                communityExternalEdges.set(commA, (communityExternalEdges.get(commA) || 0) + 1);
                communityExternalEdges.set(commB, (communityExternalEdges.get(commB) || 0) + 1);

                // Ensure sorted key for undirected crossing pair
                const key = [commA, commB].sort().join('::');
                if (!crossingEdges.has(key)) {
                    crossingEdges.set(key, { count: 0, bridgeNodes: new Set() });
                }
                const crossing = crossingEdges.get(key)!;
                crossing.count++;
                crossing.bridgeNodes.add(edge.from);
                crossing.bridgeNodes.add(edge.to);
            }
        }

        // Emit CommunityEvidence
        for (const [commId, nodes] of communities.entries()) {
            const internal = communityInternalEdges.get(commId) || 0;
            const external = communityExternalEdges.get(commId) || 0;
            
            // Simple modularity heuristic: ratio of internal to total edges.
            const total = internal + external;
            const modularityScore = total === 0 ? 1 : internal / total;

            const evidence: ICommunityEvidence = {
                id: `ev-comm-${commId}`,
                category: EvidenceCategory.COMMUNITY,
                nodeId: commId, // Treating communityId as the "node" for this evidence
                description: `Community ${commId} structural grouping`,
                metadata: {
                    communityId: commId,
                    nodeIds: nodes,
                    internalEdgeCount: internal,
                    externalEdgeCount: external,
                    modularityScore
                }
            };
            newSnapshot.addEvidence(evidence);
        }

        // Emit BoundaryStrengthEvidence
        for (const [key, data] of crossingEdges.entries()) {
            const [commA, commB] = key.split('::');
            
            const evidence: IBoundaryStrengthEvidence = {
                id: `ev-bound-${commA}-${commB}`,
                category: EvidenceCategory.BOUNDARY_STRENGTH,
                nodeId: `${commA}::${commB}`,
                description: `Boundary strength between ${commA} and ${commB}`,
                metadata: {
                    communityA: commA,
                    communityB: commB,
                    crossingEdgeCount: data.count,
                    bridgeNodeIds: Array.from(data.bridgeNodes)
                }
            };
            newSnapshot.addEvidence(evidence);
        }

        return newSnapshot;
    }
}
