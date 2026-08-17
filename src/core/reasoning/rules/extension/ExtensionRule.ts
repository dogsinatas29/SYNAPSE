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

            // Strict Gate:
            // 1. Must have 2+ implementations
            // 2. Must either have a Registry OR be injected centrally (not just a ubiquitous dependency like Logger)
            const isCentralInjection = meta.injectedIntoCount > 0 && meta.injectedIntoCount <= 5;
            const qualifies = meta.implementationCount >= 2 && (meta.hasRegistry || isCentralInjection);

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
