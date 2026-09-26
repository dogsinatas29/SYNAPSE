// 임시 바인딩 (추후 실제 클래스로 대체 가능)
export interface Graph {
    [key: string]: any;
}

export interface EvidenceContext {
    [key: string]: any;
}

export interface MetricContext {
    [key: string]: any;
}

export interface DetectorContext {
    graph: Graph;
    evidence: EvidenceContext;
    metrics: MetricContext;
}
