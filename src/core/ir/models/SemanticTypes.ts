export type EvidenceCategory = 'LANGUAGE' | 'STRUCTURAL';

export type SemanticEdgeType =
    | 'DEFINES_PAYLOAD'
    | 'MANAGES_STATE'
    | 'IMPLEMENTS'
    | 'CALLS'
    | 'MODIFIES'
    | 'CROSSES_BOUNDARY'
    | 'OWNS_POLICY'
    | 'IS_EXTENSION_POINT';

export interface ISemanticEvidence {
    id: string;
    kind: string;
    score: number; // Signed: +0.4 (Positive), -0.3 (Negative)
    category: EvidenceCategory;
    description: string;
}

export interface ISemanticCandidate {
    id: string;
    sourceId: string;
    targetId: string;
    proposedEdgeType: SemanticEdgeType;
    baseConfidence: number;
}

export interface ICandidateEvaluation {
    candidateId: string;
    evidence: ISemanticEvidence[];
    structuralEvidenceCount: number;
    languageEvidenceCount: number;
    finalConfidence: number;
}

export interface IPromotionReason {
    evidenceId: string;
    kind: string;
    score: number;
    explanation: string;
}

export interface ISemanticEdge {
    id: string;
    sourceId: string;
    targetId: string;
    type: SemanticEdgeType;
    confidence: number;
    promotionReasons: IPromotionReason[];
}

export interface RejectedCandidateReport {
    candidateId: string;
    sourceId: string;
    targetId: string;
    proposedEdgeType: SemanticEdgeType;
    finalScore: number;
    threshold: number;
    positiveEvidence: ISemanticEvidence[];
    negativeEvidence: ISemanticEvidence[];
    rejectReason: string;
    rejectCategory?: 'LOW_CONFIDENCE' | 'NO_STRUCTURAL_EVIDENCE' | 'NEGATIVE_EVIDENCE';
}

export interface NotCandidateReport {
    subjectId: string;
    generatorName: string;
    reason: string;
}

export interface IArchitectureIrAudit {
    candidateCount: number;
    promotedCount: number;
    rejectedCount: number;
    notCandidateReports: NotCandidateReport[];
    promotedByType: Record<string, number>;
    rejectedByType: Record<string, number>;
    rejectedByCategory: Record<string, number>;
}
