export interface EvidenceItem {
    evidenceId?: string;
    type: string;
    sourceId: string;
    description: string;

    // 역추적성 보장 필드 (KPI 5)
    graphNodeId?: string;
    filePath?: string;
    metadata?: any;

    // Selection Provenance
    predicate?: {
        condition: string;
        metric?: string;
        operator?: string;
        cutoff?: number | string;
        actualValue?: number | string;
        rank?: number;
    } | string;
    selectionBasis?: string;
}
