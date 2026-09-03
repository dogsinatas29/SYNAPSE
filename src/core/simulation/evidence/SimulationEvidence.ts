import { SimulationEvidenceType } from './SimulationEvidenceType';

export interface SimulationEvidence {
    readonly id: string;
    readonly type: SimulationEvidenceType;
    readonly sourceId: string; // The ID of the affected Node/Edge/Boundary
    readonly sequence: number; // Deterministic sequencing, no wall-clock timestamp
    readonly metadata?: Readonly<any>;
}
