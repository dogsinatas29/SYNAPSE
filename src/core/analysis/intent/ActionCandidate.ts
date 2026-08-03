export type ActionType = "separate" | "boundary" | "keep";

export interface ImpactVector {
    fanIn: number;
    fanOut: number;
    skew: number;
    cycle: boolean;
}

export interface ActionCandidate {
    type: ActionType;
    source: string;
    target?: string;
    confidence: number;
    evidenceCount: number;
    impactVector: ImpactVector;
    reason: string;
    potentialEffect: string;
}
