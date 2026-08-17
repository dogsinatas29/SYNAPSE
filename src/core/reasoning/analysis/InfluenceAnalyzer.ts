import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { Finding } from '../rules/Rule';
import { EvidenceCategory, IRoleDensityEvidence } from '../evidence/Evidence';

/**
 * InfluenceAnalyzer bridges Phase 2 (Role Classification) to Phase 3 (Authority).
 * It reads Phase 2 Findings and Phase 1 Raw Evidence to synthesize Influence Evidence.
 * It NEVER reads the GraphModel directly.
 */
export class InfluenceAnalyzer {

    /**
     * Creates a V2 snapshot containing all V1 evidence plus the new Influence Evidence.
     */
    public analyze(snapshotV1: ReasoningSnapshot, roleFindings: Finding[]): ReasoningSnapshot {
        const snapshotV2 = snapshotV1.clone();

        // Compute Role Density Evidence
        const rolesByNode = new Map<string, string[]>();

        for (const finding of roleFindings) {
            // Finding ID is usually f-RuleId-NodeId, or we extract nodeId from finding logic
            // In a robust implementation, Finding should explicitly have a `targetNodeId`.
            // For now, we extract it from summary or assume each finding targets a node.
            // Let's parse it out of the summary (e.g. "Node X is a..."):
            const match = finding.summary.match(/Node (.+?) is a/);
            if (match) {
                const nodeId = match[1];
                if (!rolesByNode.has(nodeId)) {
                    rolesByNode.set(nodeId, []);
                }
                rolesByNode.get(nodeId)!.push(finding.type);
            }
        }

        for (const [nodeId, roles] of rolesByNode.entries()) {
            snapshotV2.addEvidence({
                id: `ev-roledensity-${nodeId}`,
                category: EvidenceCategory.ROLE_DENSITY,
                nodeId,
                description: `Role density for ${nodeId}`,
                metadata: {
                    roles,
                    roleCount: roles.length
                }
            } as IRoleDensityEvidence);
        }

        // Freeze V2 to maintain immutability for Phase 3 rules
        snapshotV2.freeze();
        return snapshotV2;
    }
}
