import { ASTVerificationReport } from '../../cli/ast_verification_engine';
import { IntentEdge } from '../analysis/intent/IntentEdge';

export interface GraphSnapshot {
    nodes: ReadonlyArray<any>;
    edges: ReadonlyArray<any>;
    clusters?: ReadonlyArray<any>;
}

export type SpeciesCounts = Map<string, number>;

export interface InfraTarget {
    id: string;
    splitPriority: number;
    external: number;
    internal: number;
}

export interface TopCommunitySpeciesRow {
    communityId: string;
    species?: string;
    speciesBase?: string;
    bridgeScore?: number;
    utilityScore?: number;
    contractScore?: number;
}

export interface ParsedRun {
    speciesSummary: SpeciesCounts;
    infraTargets: InfraTarget[];
    topCommunityRows: TopCommunitySpeciesRow[];
}

export interface SpeciesStabilityRow {
    species: string;
    min: number;
    max: number;
    avg: number;
    values: number[];
}

export interface StabilityGateResult {
    stable: boolean;
    rule: string;
    failures: string[];
}

export interface SpeciesPresenceRow {
    species: string;
    runPresence: boolean[];
    hitCount: number;
    status: 'Stable' | 'Probable' | 'Unstable';
}

export interface BoundaryPressure {
    label: string;
    threshold: number;
    band: number;
    nearCount: number;
    totalCount: number;
}

export interface SpeciesConfidenceRow {
    species: string;
    confidence: number;
}

export interface HistogramBin {
    range: string;
    count: number;
}

export interface BoundaryConfidenceHistogram {
    label: string;
    bins: HistogramBin[];
    totalCount: number;
}

export interface SpeciesScoreConfidenceRow {
    species: string;
    avg: number;
    min: number;
    max: number;
    count: number;
}

export interface ThresholdSweepRow {
    threshold: number;
    count: number;
    ids: string[];
}

export interface InfraMeshThresholdRecommendation {
    baselineThreshold: number;
    baselineCount: number;
    baselineIds: string[];
    nextThreshold: number;
    nextCount: number;
    rationale: string;
}
export interface BreakdownEntry {
    name: string;
    count: number;
    ratio: number;
}

export interface ValidationMetrics {
    generatedAt?: string;
    graphFilePath?: string;
    runCount?: number;
    establishmentGate?: StabilityGateResult;
    infraMeshBaselineThreshold?: number;
    infraMeshThresholdRecommendation?: InfraMeshThresholdRecommendation;
    infrastructureSplitCandidates?: InfraTarget[];
    speciesStability?: SpeciesStabilityRow[];
    speciesConfidence?: SpeciesConfidenceRow[];
    speciesScoreConfidence?: SpeciesScoreConfidenceRow[];
    presenceMatrix?: SpeciesPresenceRow[];
    boundaryConfidenceHistogram?: BoundaryConfidenceHistogram[];
    boundaryPressure?: BoundaryPressure[];
    infraMeshThresholdSweep?: ThresholdSweepRow[];
    auditThresholds?: any;
    auditQueueSeed?: any[];
    topImpactFiles?: Array<{
        filePath: string;
        externalEdges: number;
        internalEdges: number;
        consumers: string[];
    }>;
    falsePositiveProbability?: number;
    estimatedCost?: {
        engineers: number;
        days: number;
        filesAffected: number;
        edgesAffected: number;
    };
    ifIgnoredImpact?: {
        architectureEntropy: number;
        boundaryFragmentation: boolean;
        estimatedMonthsToIssue: number;
    };
    astVerification?: ASTVerificationReport;

    // ASR 2.0 Breakdown fields
    ghostBreakdown?: BreakdownEntry[];
    couplingBreakdown?: BreakdownEntry[];
    entropyBreakdown?: BreakdownEntry[];

    // ASR 3.0 Evidence Layer fields
    ghostEvidence?: IntentEdge[];
    boundaryEvidence?: IntentEdge[];
}

export interface ValidationContext {
    snapshot: Readonly<GraphSnapshot>;
    metrics: ValidationMetrics;
    workspaceRoot?: string;
}
