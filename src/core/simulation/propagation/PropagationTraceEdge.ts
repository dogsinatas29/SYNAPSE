export interface PropagationTraceEdge {
    sourceId: string;
    sourceType: 'NODE' | 'EDGE';
    targetId: string;
    targetType: 'NODE' | 'EDGE';
    depth: number;
}
