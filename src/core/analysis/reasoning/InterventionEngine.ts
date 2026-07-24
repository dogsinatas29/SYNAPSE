import { ProjectState, Edge } from '../../../types/schema';
import { SccCluster, CriticalBridge, FragmentInfo } from '../types';
import { TarjanSCC } from './TarjanSCC';
import { CommunityDetector } from './CommunityDetector';

export class InterventionEngine {
    constructor() {
        console.log("[STEP-3] InterventionEngine ctor");
    }
    
    /**
     * Discovers top Critical Bridges by simulating Single-Cut Interventions on the Graph.
     * GraphModel is STRICTLY Read-Only.
     */
    public discoverCriticalBridges(state: ProjectState, sccs: SccCluster[]): CriticalBridge[] {
        console.log("[STEP-4] Intervention analyze start (discoverCriticalBridges)");
        // Only run for massive SCCs (e.g. >= 3 nodes)
        const massiveSccs = sccs.filter(scc => scc.nodeIds.length >= 3);
        console.log(`[InterventionEngine] Starting discovery. Found ${massiveSccs.length} massive SCC(s) (>=3 nodes) out of ${sccs.length} total SCCs.`);
        
        // Fast edge lookup map
        const edges: Edge[] = state.edges || [];
        
        let allBridges: CriticalBridge[] = [];
        
        for (const scc of massiveSccs) {
            console.log(`\n[InterventionEngine] Analyzing SCC: ${scc.id} (${scc.nodeIds.length} nodes)`);
            
            // Find edges strictly inside this SCC
            const sccEdges = edges.filter(e => 
                scc.nodeIds.includes(e.from) && scc.nodeIds.includes(e.to)
            );
            
            // 1. Label Propagation Algorithm (LPA) to detect internal communities
            const communities = CommunityDetector.detect(scc, sccEdges);
            const uniqueCommunities = new Set(communities.values()).size;
            console.log(`[InterventionEngine] LPA detected ${uniqueCommunities} sub-communities inside SCC ${scc.id}.`);
            
            // 2. Identify Potential Bridge Edges:
            // - Cross-Community Edges (from LPA)
            // - Edges connected to Top 30% Hubs
            // - Low-degree gateway edges (Articulation-like)
            const nodeDegrees = [...scc.nodeIds]
                .map(id => ({ id, degree: this.getNodeDegree(id, sccEdges) }))
                .sort((a, b) => b.degree - a.degree);
            
            const hubLimit = Math.max(3, Math.floor(scc.nodeIds.length * 0.3));
            const topHubs = nodeDegrees.slice(0, hubLimit).map(n => n.id);

            const lowDegreeNodes = new Set(nodeDegrees.filter(n => n.degree < 5).map(n => n.id));
            
            let crossCount = 0;
            let hubCount = 0;
            let lowDegreeCount = 0;

            let potentialBridges = sccEdges.filter(e => {
                const isCrossCommunity = communities.get(e.from) !== communities.get(e.to);
                const isHubEdge = topHubs.includes(e.from) || topHubs.includes(e.to);
                const isLowDegreeGate = lowDegreeNodes.has(e.from) || lowDegreeNodes.has(e.to);
                
                if (isCrossCommunity) crossCount++;
                if (isHubEdge) hubCount++;
                if (isLowDegreeGate) lowDegreeCount++;

                return isCrossCommunity || isHubEdge || isLowDegreeGate;
            });
            
            console.log("[INTERVENTION_CANDIDATE_EXPLOSION]", {
                sccNodeCount: scc.nodeIds.length,
                sccEdgeCount: sccEdges.length,
                candidateCount: potentialBridges.length,
                crossCommunityEdges: crossCount,
                hubEdges: hubCount,
                lowDegreeEdges: lowDegreeCount,
                hubThresholdCount: topHubs.length
            });
            
            // [v0.3.34.3_fix] O(E * (V+E)) 프리징 방지용 안전 장치
            potentialBridges.sort((a, b) => {
                const aCross = communities.get(a.from) !== communities.get(a.to) ? 1 : 0;
                const bCross = communities.get(b.from) !== communities.get(b.to) ? 1 : 0;
                return bCross - aCross; // Cross Community 엣지를 최우선으로 시뮬레이션
            });
            
            if (potentialBridges.length > 100) {
                console.log(`[InterventionEngine] Capping potential bridges from ${potentialBridges.length} to 100 to prevent thread freeze.`);
                potentialBridges = potentialBridges.slice(0, 100);
            }
            
            console.log(`[InterventionEngine] Identified ${potentialBridges.length} potential bridge edges to simulate.`);
            
            const originalNodeCount = scc.nodeIds.length;
            const originalEdgesCount = sccEdges.length;
            
            const candidateScores: CriticalBridge[] = [];
            
            // 3. Simulate Removal
            for (const edgeToCut of potentialBridges) {
                // Read-Only virtual graph: remove just this edge
                const virtualEdges = sccEdges.filter(e => e.id !== edgeToCut.id);
                
                // Re-run Tarjan on the virtual graph
                const virtualSccs = TarjanSCC.extractFromSubset(scc.nodeIds, virtualEdges);
                
                // Evaluate impact
                // Find the largest remaining SCC node count
                const maxRemainingNodeCount = virtualSccs.length > 0 ? Math.max(...virtualSccs.map(s => s.nodeIds.length)) : 0;
                
                // Calculate reduction percentages
                const sccReductionPct = ((originalNodeCount - maxRemainingNodeCount) / originalNodeCount) * 100;
                
                const newTotalInternalEdges = virtualSccs.reduce((acc, vscc) => acc + this.countInternalEdges(vscc, virtualEdges), 0);
                const edgeReductionPct = originalEdgesCount === 0 ? 0 : ((originalEdgesCount - newTotalInternalEdges) / originalEdgesCount) * 100;
                
                // Add Fragment Count as a fragmentation bonus (+1.5 points per extra fragment)
                const fragmentationBonus = Math.max(0, (virtualSccs.length - 1) * 1.5);
                
                const untangleScore = (sccReductionPct * 0.6) + (edgeReductionPct * 0.4) + fragmentationBonus;
                
                if (untangleScore > 5) { // Minimum threshold to consider
                    const fragments = this.buildFragments(virtualSccs, virtualEdges);
                    
                    const isCrossCommunity = communities.get(edgeToCut.from) !== communities.get(edgeToCut.to);
                    const isHubEdge = topHubs.includes(edgeToCut.from) || topHubs.includes(edgeToCut.to);
                    const structuralRole = isCrossCommunity ? 'Community Boundary Edge' : (isHubEdge ? 'Hub Connector' : 'Low Degree Gate');
                    
                    candidateScores.push({
                        sourceId: edgeToCut.from,
                        targetId: edgeToCut.to,
                        impact: parseFloat((sccReductionPct).toFixed(1)),
                        untangleScore: parseFloat(untangleScore.toFixed(1)),
                        structuralRole: structuralRole,
                        edgeType: 'Regex Hypothesis', // Always Hypothesis in v34.3
                        sccFragmentation: `1 SCC (${originalNodeCount} nodes) -> ${virtualSccs.length} Fragments (${virtualSccs.map(s => s.nodeIds.length).join(', ')})`,
                        largestRemainingScc: maxRemainingNodeCount,
                        fragmentCount: virtualSccs.length,
                        fragments: fragments
                    });
                }
            }
            
            // Rank candidates for this SCC and take Top 10
            candidateScores.sort((a, b) => a.largestRemainingScc - b.largestRemainingScc || b.untangleScore - a.untangleScore);
            const topCandidates = candidateScores.slice(0, 10);
            
            if (topCandidates.length > 0) {
                console.log(`[InterventionEngine] SCC ${scc.id} Best Candidate: ${topCandidates[0].sourceId} -> ${topCandidates[0].targetId} (Score: ${topCandidates[0].untangleScore})`);
            } else {
                console.log(`[InterventionEngine] No significant bridges found for SCC ${scc.id}.`);
            }
            
            allBridges = allBridges.concat(topCandidates);
        }
        
        return allBridges.sort((a, b) => a.largestRemainingScc - b.largestRemainingScc || b.untangleScore - a.untangleScore);
    }
    
    private getNodeDegree(nodeId: string, edges: Edge[]): number {
        return edges.filter(e => e.from === nodeId || e.to === nodeId).length;
    }
    
    private countInternalEdges(scc: SccCluster, edges: Edge[]): number {
        const set = new Set(scc.nodeIds);
        let count = 0;
        for (const e of edges) {
            if (set.has(e.from) && set.has(e.to)) count++;
        }
        return count;
    }
    
    private buildFragments(virtualSccs: SccCluster[], virtualEdges: Edge[]): FragmentInfo[] {
        return virtualSccs.map(vscc => {
            // Find top 2 representative nodes by degree
            const inDegrees = new Map<string, number>();
            const outDegrees = new Map<string, number>();
            const set = new Set(vscc.nodeIds);
            
            for (const id of vscc.nodeIds) {
                inDegrees.set(id, 0);
                outDegrees.set(id, 0);
            }
            
            for (const e of virtualEdges) {
                if (set.has(e.from) && set.has(e.to)) {
                    outDegrees.set(e.from, outDegrees.get(e.from)! + 1);
                    inDegrees.set(e.to, inDegrees.get(e.to)! + 1);
                }
            }
            
            const degreeList = vscc.nodeIds.map(id => {
                let degree = inDegrees.get(id)! + outDegrees.get(id)!;
                if (id.endsWith('index.ts') || id.endsWith('index.js') || id.endsWith('exports.ts')) {
                    degree = Math.max(0, degree - 100);
                }
                return { id, degree };
            });
            
            degreeList.sort((a, b) => b.degree - a.degree);
            
            return {
                id: vscc.id,
                nodeCount: vscc.nodeIds.length,
                representativeNodes: degreeList.slice(0, 2)
            };
        }).sort((a, b) => b.nodeCount - a.nodeCount);
    }
}
