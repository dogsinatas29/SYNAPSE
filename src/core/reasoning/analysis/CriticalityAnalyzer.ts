import { Finding } from '../rules/Rule';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { EvidenceCategory, ICriticalityEvidence } from '../evidence/Evidence';

export class CriticalityAnalyzer {
    public analyze(snapshot: ReasoningSnapshot, findings: Finding[], graph?: any): ReasoningSnapshot {
        // Collect all node IDs present in the graph (or findings)
        const allNodes = new Set<string>();
        findings.forEach(f => f.targetIds.forEach(id => allNodes.add(id)));

        // Index findings by node
        const nodeData = new Map<string, {
            authorityScore: number,
            pipelineCount: number,
            criticalPipelineCount: number,
            isBoundaryCrosser: boolean,
            isStateOwner: boolean,
            isPolicyOwner: boolean,
            isIsland: boolean
        }>();

        for (const node of allNodes) {
            nodeData.set(node, {
                authorityScore: 0,
                pipelineCount: 0,
                criticalPipelineCount: 0,
                isBoundaryCrosser: false,
                isStateOwner: false,
                isPolicyOwner: false,
                isIsland: false
            });
        }

        // Process Authority
        findings.filter(f => f.type === 'DOMINANT_AUTHORITY' || f.type === 'MAJOR_AUTHORITY' || f.type === 'MINOR_AUTHORITY').forEach(f => {
            const score = f.confidence;
            f.targetIds.forEach(id => {
                if (nodeData.has(id)) nodeData.get(id)!.authorityScore = Math.max(nodeData.get(id)!.authorityScore, score);
            });
        });

        // Process Flow
        findings.filter(f => f.type === 'DATA_PIPELINE' || f.type === 'CONTROL_PIPELINE').forEach(f => {
            const isCritical = f.confidence >= 0.8;
            f.targetIds.forEach(id => {
                if (nodeData.has(id)) {
                    nodeData.get(id)!.pipelineCount++;
                    if (isCritical) {
                        nodeData.get(id)!.criticalPipelineCount++;
                    }
                }
            });
        });

        // Also process DEFINES_PAYLOAD as Pipeline Participation
        if (graph) {
            const graphSnapshot = graph.createSnapshot();
            for (const edge of graphSnapshot.edges) {
                if (edge.type === 'DEFINES_PAYLOAD') {
                    const sourceId = edge.source || edge.from;
                    if (nodeData.has(sourceId)) {
                        nodeData.get(sourceId)!.pipelineCount++;
                        // If it defines payload for anything, it's structurally critical (Hidden Core)
                        nodeData.get(sourceId)!.criticalPipelineCount++;
                    }
                }
            }
        }

        // Process Roles
        findings.filter(f => f.type === 'STATE_OWNER').forEach(f => {
            f.targetIds.forEach(id => { if (nodeData.has(id)) nodeData.get(id)!.isStateOwner = true; });
        });
        findings.filter(f => f.type === 'POLICY_OWNER').forEach(f => {
            f.targetIds.forEach(id => { if (nodeData.has(id)) nodeData.get(id)!.isPolicyOwner = true; });
        });

        // Process Boundaries
        findings.filter(f => f.type === 'BOUNDARY_CROSSER').forEach(f => {
            f.targetIds.forEach(id => { if (nodeData.has(id)) nodeData.get(id)!.isBoundaryCrosser = true; });
        });
        findings.filter(f => f.type === 'BOUNDARY_ISLAND').forEach(f => {
            f.targetIds.forEach(id => { if (nodeData.has(id)) nodeData.get(id)!.isIsland = true; });
        });

        // Emit Evidence
        const newSnapshot = snapshot.clone();
        for (const [nodeId, data] of nodeData.entries()) {
            const ev: ICriticalityEvidence = {
                id: `ev-crit-${nodeId}`,
                category: EvidenceCategory.CRITICALITY,
                nodeId,
                description: `Aggregated structural metrics for Criticality classification of ${nodeId}`,
                metadata: {
                    nodeId,
                    authorityScore: data.authorityScore,
                    pipelineParticipationCount: data.pipelineCount,
                    criticalPipelineCount: data.criticalPipelineCount,
                    isBoundaryCrosser: data.isBoundaryCrosser,
                    isStateOwner: data.isStateOwner,
                    isPolicyOwner: data.isPolicyOwner,
                    isIsolatedIsland: data.isIsland
                }
            };
            newSnapshot.addEvidence(ev);
        }

        return newSnapshot;
    }
}
