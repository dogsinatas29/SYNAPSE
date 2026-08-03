import { IntentEdge } from './IntentEdge';
import { Finding } from './ReasonedReportBundle';
import { ActionCandidate, ActionType } from './ActionCandidate';

const ACTION_MAP: Record<string, ActionType | null> = {
    circular_dependency: 'separate',
    domain_bottleneck: 'separate',
    diffuse_coupling: 'boundary',
    shared_infrastructure: 'keep',
    orchestrator: 'keep',
    weak_link: null  // Finding only
};

const POTENTIAL_EFFECTS: Record<string, string> = {
    domain_bottleneck: 'Boundary becomes explicit. Domain ownership becomes clearer. Change impact may become localized.',
    circular_dependency: 'Independent testing becomes easier. Deployment order constraints may decrease.',
    diffuse_coupling: 'Architectural layering becomes clearer. Cross-domain coupling may decrease.',
    shared_infrastructure: 'System remains stable. Foundational dependencies remain intact.',
    orchestrator: 'Control flow remains centralized and predictable.'
};

export class ArchitectureActionGenerator {
    generate(findings: Finding[], intentEdges: IntentEdge[]): ActionCandidate[] {
        const edgeConfMap = new Map<string, IntentEdge>();
        for (const edge of intentEdges) {
            edgeConfMap.set(`${edge.source}|${edge.target}`, edge);
        }

        const candidates: ActionCandidate[] = [];

        for (const finding of findings) {
            const actionType = ACTION_MAP[finding.findingType];
            if (actionType === null || actionType === undefined) continue;

            let totalEvidenceCount = 0;
            let weightedConfidence = finding.confidence;

            if (finding.relatedEdges.length > 0) {
                let confSum = 0;
                let confCount = 0;
                for (const edge of finding.relatedEdges) {
                    totalEvidenceCount += edge.evidenceCount;
                    confSum += edge.confidence;
                    confCount++;
                }
                if (confCount > 0) {
                    weightedConfidence = (finding.confidence + confSum / confCount) / 2;
                }
            }

            const primaryEdge = finding.relatedEdges[0];
            const primarySource = primaryEdge ? primaryEdge.source : finding.title;
            const primaryTarget = primaryEdge ? primaryEdge.target : undefined;
            
            // Format the reason logically based on the observation
            let reasonStr = finding.observation;

            candidates.push({
                type: actionType,
                source: primarySource,
                target: primaryTarget || undefined,
                confidence: parseFloat(weightedConfidence.toFixed(4)),
                evidenceCount: totalEvidenceCount,
                impactVector: finding.impactVector,
                reason: reasonStr,
                potentialEffect: POTENTIAL_EFFECTS[finding.findingType] ?? ''
            });
        }

        // We do NOT sort here. Sorting and Priority calculation is the responsibility of the Exporter (View).
        return candidates;
    }
}
