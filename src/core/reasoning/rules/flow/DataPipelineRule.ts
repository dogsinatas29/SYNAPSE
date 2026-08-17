import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IPathEvidence } from '../../evidence/Evidence';

export class DataPipelineRule implements IRule {
    id = 'R-201';
    name = 'Data Pipeline Detection';
    purpose = 'Identifies paths that transport data through the system';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const pathEv = snapshot.getEvidenceByCategory<IPathEvidence>(EvidenceCategory.PATH);
        const findings: Finding[] = [];

        for (const ev of pathEv) {
            if (ev.metadata.pathType === 'DATA') {
                findings.push({
                    id: `f-${this.id}-${ev.id}`,
                    type: 'DATA_PIPELINE',
                    confidence: ev.metadata.segmentConfidenceProduct,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    targetType: 'PATH',
                    targetIds: ev.metadata.pathNodes,
                    summary: `Data Pipeline: ${ev.metadata.pathNodes.join(' -> ')}`,
                    explanation: `Identified a data flow path with confidence ${ev.metadata.segmentConfidenceProduct.toFixed(3)}.`
                });
            }
        }

        return findings;
    }
}
