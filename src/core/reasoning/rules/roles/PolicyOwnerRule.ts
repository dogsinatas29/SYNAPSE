import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IValidationEvidence, IDecisionEvidence } from '../../evidence/Evidence';

export class PolicyOwnerRule implements IRule {
    id = 'R-002';
    name = 'Policy Owner Classification';
    purpose = 'Identifies nodes that own and enforce business rules and logic';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const validationEv = snapshot.getEvidenceByCategory<IValidationEvidence>(EvidenceCategory.VALIDATION);
        const decisionEv = snapshot.getEvidenceByCategory<IDecisionEvidence>(EvidenceCategory.DECISION);

        const nodes = new Set([...validationEv, ...decisionEv].map(e => e.nodeId));
        const findings: Finding[] = [];

        for (const nodeId of nodes) {
            const validation = validationEv.find(e => e.nodeId === nodeId);
            const decision = decisionEv.find(e => e.nodeId === nodeId);

            const evidenceIds: string[] = [];
            let confidence = 0.0;

            if (validation && validation.metadata.validationCallCount > 0) {
                confidence += 0.5;
                evidenceIds.push(validation.id);
            }

            if (decision && decision.metadata.branchCount > 5) {
                confidence += 0.5;
                evidenceIds.push(decision.id);
            }

            if (confidence > 0.4) {
                findings.push({
                    id: `f-${this.id}-${nodeId}`,
                    type: 'POLICY_OWNER',
                    confidence,
                    evidenceIds,
                    ruleId: this.id,
                    targetType: 'NODE',
                    targetIds: [nodeId],
                    summary: `Node ${nodeId} is a Policy Owner`,
                    explanation: `Found policy enforcement logic with confidence ${confidence}.`
                });
            }
        }

        return findings;
    }
}
