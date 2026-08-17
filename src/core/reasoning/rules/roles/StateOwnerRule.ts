import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IStorageEvidence, IMutationEvidence, IReadEvidence } from '../../evidence/Evidence';

export class StateOwnerRule implements IRule {
    id = 'R-001';
    name = 'State Owner Classification';
    purpose = 'Identifies nodes that own and manage state';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const storageEv = snapshot.getEvidenceByCategory<IStorageEvidence>(EvidenceCategory.STORAGE);
        const mutationEv = snapshot.getEvidenceByCategory<IMutationEvidence>(EvidenceCategory.MUTATION);
        const readEv = snapshot.getEvidenceByCategory<IReadEvidence>(EvidenceCategory.READ);

        const nodes = new Set([...storageEv, ...mutationEv, ...readEv].map(e => e.nodeId));
        const findings: Finding[] = [];

        for (const nodeId of nodes) {
            const storage = storageEv.find(e => e.nodeId === nodeId);
            const mutation = mutationEv.find(e => e.nodeId === nodeId);
            const read = readEv.find(e => e.nodeId === nodeId);

            if (!storage || storage.metadata.fieldCount === 0) {
                continue; // No storage = cannot be State Owner
            }

            const evidenceIds = [storage.id];
            let confidence = 0.6; // Base confidence for having storage (sufficient to be a State Owner on its own)

            if (mutation && mutation.metadata.mutationMethodCount > 0) {
                confidence += 0.4;
                evidenceIds.push(mutation.id);
            }

            if (read && read.metadata.readMethodCount > 0) {
                confidence += 0.2;
                evidenceIds.push(read.id);
            }

            if (confidence > 0.5) { // Threshold
                findings.push({
                    id: `f-${this.id}-${nodeId}`,
                    type: 'STATE_OWNER',
                    confidence,
                    evidenceIds,
                    ruleId: this.id,
                    targetType: 'NODE',
                    targetIds: [nodeId],
                    summary: `Node ${nodeId} is a State Owner`,
                    explanation: `Found state logic with confidence ${confidence}.`
                });
            }
        }

        return findings;
    }
}
