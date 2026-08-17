import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IBridgeEvidence } from '../../evidence/Evidence';

export class AdapterRule implements IRule {
    id = 'R-005';
    name = 'Adapter Classification';
    purpose = 'Identifies nodes that bridge boundaries or protocols';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const bridgeEv = snapshot.getEvidenceByCategory<IBridgeEvidence>(EvidenceCategory.BRIDGE);
        const findings: Finding[] = [];

        for (const ev of bridgeEv) {
            if (ev.metadata.crossLayerCallCount > 0) {
                findings.push({
                    id: `f-${this.id}-${ev.nodeId}`,
                    type: 'ADAPTER',
                    confidence: 0.8,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    targetType: 'NODE',
                    targetIds: [ev.nodeId],
                    summary: `Node ${ev.nodeId} is an Adapter`,
                    explanation: `Node bridges layers with ${ev.metadata.crossLayerCallCount} cross-layer calls.`
                });
            }
        }

        return findings;
    }
}
