export interface IntentEdge {
    source: string;
    target: string;

    intent: string;

    confidence: number;

    evidenceCount: number;

    providers: string[];
}
