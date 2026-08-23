export enum PriorityLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    WATCH = 'WATCH',
    IGNORE = 'IGNORE'
}

export enum RiskType {
    STRUCTURAL_DEFECT = 'STRUCTURAL_DEFECT',
    BOUNDARY_ISSUE = 'BOUNDARY_ISSUE',
    ARCHITECTURAL_HUB = 'ARCHITECTURAL_HUB',
    EXTERNAL_PRESSURE = 'EXTERNAL_PRESSURE',
    NORMAL = 'NORMAL'
}

export interface ProblemGroup {
    id: string;
    ownerCluster: string;
    primaryFindingType: string;
    relatedFindings: any[];
    totalImpact: number;
    category?: 'INTERNAL' | 'EXTERNAL' | 'TESTS' | 'DOCS' | 'PLATFORM';
    priority?: PriorityLevel;
    primaryRiskType?: RiskType;
    riskTags?: RiskType[];
    blastRadius: number;
    cycleParticipation: number;
    boundaryCrossings: number;
    fanOut: number;
}

export interface CompressionResult {
    immediateActions: ProblemGroup[];
    watchList: ProblemGroup[];
    externalPressures: ProblemGroup[];
    ignoredNoiseCount: number;
}

export interface OnboardingPath {
    entryPoint: string;
    corePipeline: string[];
    safeAreas: string[];
    readLater: string[];
}
