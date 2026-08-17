import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IDispatchEvidence, IRoutingEvidence } from '../../evidence/Evidence';

export class ControllerRule implements IRule {
    id = 'R-004';
    name = 'Controller Classification';
    purpose = 'Identifies nodes that dispatch or route data/events';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const dispatchEv = snapshot.getEvidenceByCategory<IDispatchEvidence>(EvidenceCategory.DISPATCH);
        const routeEv = snapshot.getEvidenceByCategory<IRoutingEvidence>(EvidenceCategory.ROUTING);

        const nodes = new Set([...dispatchEv, ...routeEv].map(e => e.nodeId));
        const findings: Finding[] = [];

        for (const nodeId of nodes) {
            const dispatch = dispatchEv.find(e => e.nodeId === nodeId);
            const route = routeEv.find(e => e.nodeId === nodeId);

            const evidenceIds: string[] = [];
            let confidence = 0.0;

            if (dispatch && dispatch.metadata.dispatchCallCount > 0) {
                confidence += 0.6;
                evidenceIds.push(dispatch.id);
            }

            if (route && route.metadata.routeCount > 0) {
                confidence += 0.4;
                evidenceIds.push(route.id);
            }

            if (confidence >= 0.4) {
                findings.push({
                    id: `f-${this.id}-${nodeId}`,
                    type: 'CONTROLLER',
                    confidence,
                    evidenceIds,
                    ruleId: this.id,
                    targetType: 'NODE',
                    targetIds: [nodeId],
                    summary: `Node ${nodeId} is a Controller`,
                    explanation: `Found dispatch/routing logic with confidence ${confidence}.`
                });
            }
        }

        return findings;
    }
}
