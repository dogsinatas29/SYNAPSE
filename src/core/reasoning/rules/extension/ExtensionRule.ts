import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IExtensionEvidence } from '../../evidence/Evidence';

export class ExtensionRule implements IRule {
    public readonly id = 'rule-extension';
    public readonly name = 'Extension Point Rule';
    public readonly purpose = 'Identifies structural extension points based on implementation variations and registry/injection patterns.';

    public evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const findings: Finding[] = [];
        
        const extensionEvidence = snapshot.getAllEvidence().filter(
            (e): e is IExtensionEvidence => e.category === EvidenceCategory.EXTENSION
        );

        for (const ev of extensionEvidence) {
            const meta = ev.metadata;

            // The new ExtensionPointEvidenceEvaluator already handles structural validation
            // and computes the confidence score based on density and clusters.
            const qualifies = meta.confidence >= 0.8;

            if (qualifies) {
                findings.push({
                    id: `f-ext-${meta.interfaceId}`,
                    type: 'EXTENSION_POINT',
                    confidence: meta.confidence,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    summary: `${meta.interfaceId} is a structural EXTENSION_POINT.`,
                    explanation: `Has ${meta.implementationCount} implementations. ${meta.hasRegistry ? 'Registered via registry.' : 'Injected directly into consumers.'}`,
                    targetType: 'NODE',
                    targetIds: [meta.interfaceId]
                });
            }
        }

        return findings;
    }
}
