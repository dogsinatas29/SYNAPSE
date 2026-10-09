import { PatternId } from './PatternId';
import { EvidenceItem } from './EvidenceItem';

export type TargetScope = 'NODE' | 'CLUSTER' | 'EDGE' | 'PROJECT';

export interface PatternFinding {
    findingId?: string;
    patternId: PatternId;

    targetScope: TargetScope;
    targetId: string | string[];

    confidence: number;
    selectionBasis?: string;

    evidence: EvidenceItem[];

    context?: Record<string, unknown>;
}
