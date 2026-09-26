export interface EvidenceItem {
    evidenceId?: string;
    type: string;
    sourceId: string;
    description: string;

    // 역추적성 보장 필드 (KPI 5)
    graphNodeId?: string;
    filePath?: string;
    metadata?: any;
}
