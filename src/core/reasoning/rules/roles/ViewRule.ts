import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IUIOutputEvidence } from '../../evidence/Evidence';

export class ViewRule implements IRule {
    id = 'R-003';
    name = 'View Classification';
    purpose = 'Identifies nodes responsible for UI presentation';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const uiEv = snapshot.getEvidenceByCategory<IUIOutputEvidence>(EvidenceCategory.UI_OUTPUT);
        const findings: Finding[] = [];

        for (const ev of uiEv) {
            if (ev.metadata.renderCallCount > 0) {
                findings.push({
                    id: `f-${this.id}-${ev.nodeId}`,
                    type: 'VIEW',
                    confidence: 0.9,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    targetType: 'NODE',
                    targetIds: [ev.nodeId],
                    summary: `Node ${ev.nodeId} is a View`,
                    explanation: `Found ${ev.metadata.renderCallCount} render calls.`
                });
            }
        }

        return findings;
    }
}
