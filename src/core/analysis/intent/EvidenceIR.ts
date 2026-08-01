export interface EvidenceIR {
    id: string;

    file: string;
    line: number;

    source: string;
    target: string;

    evidenceType: string;
    provider: string;

    reason: string;

    metadata?: Record<string, unknown>;
}
