import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IPathEvidence } from '../../evidence/Evidence';

export class ControlPipelineRule implements IRule {
    id = 'R-202';
    name = 'Control Pipeline Detection';
    purpose = 'Identifies paths that delegate control or orchestrate actions';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const pathEv = snapshot.getEvidenceByCategory<IPathEvidence>(EvidenceCategory.PATH);
        const findings: Finding[] = [];

        for (const ev of pathEv) {
            if (ev.metadata.pathType === 'CONTROL') {
                findings.push({
                    id: `f-${this.id}-${ev.id}`,
                    type: 'CONTROL_PIPELINE',
                    confidence: ev.metadata.segmentConfidenceProduct,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    targetType: 'PATH',
                    targetIds: ev.metadata.pathNodes,
                    summary: `Control Pipeline: ${ev.metadata.pathNodes.join(' -> ')}`,
                    explanation: `Identified a control flow path with confidence ${ev.metadata.segmentConfidenceProduct.toFixed(3)}.`
                });
            }
        }

        return findings;
    }
}
