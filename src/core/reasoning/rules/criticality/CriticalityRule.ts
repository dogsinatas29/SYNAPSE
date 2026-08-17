import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, ICriticalityEvidence } from '../../evidence/Evidence';

export class CriticalityRule implements IRule {
    public readonly id = 'rule-criticality';
    public readonly name = 'Criticality Rule';
    public readonly purpose = 'Classifies nodes into CORE, SUPPORTING, and UTILITY based on structural necessity.';

    public evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const findings: Finding[] = [];
        
        const criticalityEvidence = snapshot.getAllEvidence().filter(
            (e): e is ICriticalityEvidence => e.category === EvidenceCategory.CRITICALITY
        );

        for (const ev of criticalityEvidence) {
            const meta = ev.metadata;

            // Definition of CORE: Structural Necessity
            // 1. Bridges boundary AND participates in a critical pipeline
            // 2. Owns state AND has high reachability/authority
            // 3. Owns policy AND participates in control flow
            // 4. Defines critical data pipeline structure (e.g. GraphSchema, participates in critical pipeline but might not have massive fan-in)
            const isStructuralBridge = meta.isBoundaryCrosser && meta.criticalPipelineCount > 0;
            const isCoreState = meta.isStateOwner && meta.authorityScore > 0.5;
            const isCorePolicy = meta.isPolicyOwner && meta.pipelineParticipationCount > 0;
            const isPipelineDefiner = meta.criticalPipelineCount >= 1 && (meta.isStateOwner || meta.isPolicyOwner || meta.authorityScore >= 0.3); // Hidden Core catch

            const isCore = isStructuralBridge || isCoreState || isCorePolicy || isPipelineDefiner;

            // Definition of UTILITY: Domain Agnostic
            // High authority (fan-in), NO critical pipelines, NO state, NO policy. Often isolated.
            const isUtility = meta.authorityScore > 0 && meta.criticalPipelineCount === 0 && !meta.isStateOwner && !meta.isPolicyOwner && !meta.isBoundaryCrosser;

            // Default to SUPPORTING if neither
            const isSupporting = !isCore && !isUtility && (meta.authorityScore > 0 || meta.pipelineParticipationCount > 0);

            if (isCore) {
                findings.push({
                    id: `f-crit-core-${meta.nodeId}`,
                    type: 'CORE',
                    confidence: 0.9,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    summary: `${meta.nodeId} is a CORE architectural pillar.`,
                    explanation: this.buildCoreExplanation(meta),
                    targetType: 'NODE',
                    targetIds: [meta.nodeId]
                });
            } else if (isUtility) {
                findings.push({
                    id: `f-crit-util-${meta.nodeId}`,
                    type: 'UTILITY',
                    confidence: 0.8,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    summary: `${meta.nodeId} is a highly reused UTILITY.`,
                    explanation: `Domain agnostic logic with high reuse but no structural necessity.`,
                    targetType: 'NODE',
                    targetIds: [meta.nodeId]
                });
            } else if (isSupporting) {
                findings.push({
                    id: `f-crit-supp-${meta.nodeId}`,
                    type: 'SUPPORTING',
                    confidence: 0.7,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    summary: `${meta.nodeId} is SUPPORTING logic.`,
                    explanation: `Facilitates feature behavior but does not define critical architecture.`,
                    targetType: 'NODE',
                    targetIds: [meta.nodeId]
                });
            }
        }

        return findings;
    }

    private buildCoreExplanation(meta: any): string {
        const reasons = [];
        if (meta.isBoundaryCrosser) reasons.push('Structural Bridge');
        if (meta.isStateOwner) reasons.push('State Owner');
        if (meta.isPolicyOwner) reasons.push('Policy Owner');
        if (meta.criticalPipelineCount > 0) reasons.push(`Participates in ${meta.criticalPipelineCount} critical pipelines`);
        return reasons.join(', ');
    }
}
