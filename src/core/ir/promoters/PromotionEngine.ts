import { 
    ISemanticCandidate, 
    ICandidateEvaluation, 
    ISemanticEdge, 
    RejectedCandidateReport, 
    IPromotionReason,
    INodeFactCandidate,
    ISemanticNodeFact,
    RejectedNodeFactReport
} from '../models/SemanticTypes';

export class PromotionEngine {
    /**
     * Determines whether a candidate should be promoted to a SemanticEdge.
     */
    public promote(candidate: ISemanticCandidate, evaluation: ICandidateEvaluation, languageFamily: string = 'ts'): { edge?: ISemanticEdge, report?: RejectedCandidateReport } {
        const threshold = this.getThresholdForLanguage(languageFamily);
        
        let rejectReason = '';
        let rejectCategory: 'LOW_CONFIDENCE' | 'NO_STRUCTURAL_EVIDENCE' | 'NEGATIVE_EVIDENCE' | undefined;
        
        const passedStructural = evaluation.structuralEvidenceCount >= 1;
        const roundedConfidence = Math.round(evaluation.finalConfidence * 100) / 100;
        const passedConfidence = roundedConfidence >= threshold;
        const hasNegativeEvidence = evaluation.evidence.some(e => e.score < 0);

        if (!passedStructural) {
            rejectReason = 'Insufficient STRUCTURAL evidence. At least 1 structural evidence is required.';
            rejectCategory = 'NO_STRUCTURAL_EVIDENCE';
        } else if (hasNegativeEvidence && !passedConfidence) {
            rejectReason = `Negative evidence reduced confidence (${evaluation.finalConfidence.toFixed(2)}) below threshold (${threshold.toFixed(2)}).`;
            rejectCategory = 'NEGATIVE_EVIDENCE';
        } else if (!passedConfidence) {
            rejectReason = `Confidence (${evaluation.finalConfidence.toFixed(2)}) is below the required threshold (${threshold.toFixed(2)}).`;
            rejectCategory = 'LOW_CONFIDENCE';
        }

        if (passedStructural && passedConfidence) {
            // Promote to edge
            const promotionReasons: IPromotionReason[] = evaluation.evidence.map(ev => ({
                evidenceId: ev.id,
                kind: ev.kind,
                score: ev.score,
                explanation: ev.description
            }));

            const edge: ISemanticEdge = {
                id: `edge-${candidate.proposedEdgeType}-${candidate.sourceId}-${candidate.targetId}`,
                sourceId: candidate.sourceId,
                targetId: candidate.targetId,
                type: candidate.proposedEdgeType,
                confidence: evaluation.finalConfidence,
                promotionReasons
            };

            return { edge };
        } else {
            // Reject and generate report
            const positiveEvidence = evaluation.evidence.filter(e => e.score > 0);
            const negativeEvidence = evaluation.evidence.filter(e => e.score < 0);

            const report: RejectedCandidateReport = {
                candidateId: candidate.id,
                sourceId: candidate.sourceId,
                targetId: candidate.targetId,
                proposedEdgeType: candidate.proposedEdgeType,
                finalScore: evaluation.finalConfidence,
                threshold,
                positiveEvidence,
                negativeEvidence,
                rejectReason,
                rejectCategory
            };

            return { report };
        }
    }

    private getThresholdForLanguage(languageFamily: string): number {
        switch (languageFamily.toLowerCase()) {
            case 'ts':
            case 'typescript':
            case 'java':
                return 0.8;
            case 'c':
            case 'cpp':
                return 0.6;
            case 'rust':
                return 0.7;
            default:
                return 0.8;
        }
    }

    public promoteFact(candidate: INodeFactCandidate, evaluation: ICandidateEvaluation, languageFamily: string = 'ts'): { fact?: ISemanticNodeFact, report?: RejectedNodeFactReport } {
        const threshold = this.getThresholdForLanguage(languageFamily);
        
        let rejectReason = '';
        let rejectCategory: 'LOW_CONFIDENCE' | 'NO_STRUCTURAL_EVIDENCE' | 'NEGATIVE_EVIDENCE' | undefined;
        
        const passedStructural = evaluation.structuralEvidenceCount >= 1;
        const roundedConfidence = Math.round(evaluation.finalConfidence * 100) / 100;
        const passedConfidence = roundedConfidence >= threshold;
        const hasNegativeEvidence = evaluation.evidence.some(e => e.score < 0);

        if (!passedStructural) {
            rejectReason = 'Insufficient STRUCTURAL evidence. At least 1 structural evidence is required.';
            rejectCategory = 'NO_STRUCTURAL_EVIDENCE';
        } else if (hasNegativeEvidence && !passedConfidence) {
            rejectReason = `Negative evidence reduced confidence (${evaluation.finalConfidence.toFixed(2)}) below threshold (${threshold.toFixed(2)}).`;
            rejectCategory = 'NEGATIVE_EVIDENCE';
        } else if (!passedConfidence) {
            rejectReason = `Confidence (${evaluation.finalConfidence.toFixed(2)}) is below the required threshold (${threshold.toFixed(2)}).`;
            rejectCategory = 'LOW_CONFIDENCE';
        }

        if (passedStructural && passedConfidence) {
            const promotionReasons: IPromotionReason[] = evaluation.evidence.map(ev => ({
                evidenceId: ev.id,
                kind: ev.kind,
                score: ev.score,
                explanation: ev.description
            }));

            const fact: ISemanticNodeFact = {
                nodeId: candidate.nodeId,
                factType: candidate.proposedFactType,
                confidence: evaluation.finalConfidence,
                evidence: evaluation.evidence,
                promotionReasons
            };

            return { fact };
        } else {
            const positiveEvidence = evaluation.evidence.filter(e => e.score > 0);
            const negativeEvidence = evaluation.evidence.filter(e => e.score < 0);

            const report: RejectedNodeFactReport = {
                candidateId: candidate.id,
                nodeId: candidate.nodeId,
                proposedFactType: candidate.proposedFactType,
                finalScore: evaluation.finalConfidence,
                threshold,
                positiveEvidence,
                negativeEvidence,
                rejectReason,
                rejectCategory
            };

            return { report };
        }
    }
}
