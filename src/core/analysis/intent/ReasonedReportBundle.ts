import { EvidenceIR } from './EvidenceIR';
import { IntentEdge } from './IntentEdge';

export interface Finding {
    title: string;
    description: string;
    confidence: number;
}

export interface ReasonedReportBundle {
    generatedAt: string;

    evidenceCount: number;
    intentEdgeCount: number;
    averageConfidence: number;

    evidence: EvidenceIR[];
    intentEdges: IntentEdge[];

    findings: Finding[];
}
