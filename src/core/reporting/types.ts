export enum PriorityLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    WATCH = 'WATCH',
    INFO = 'INFO',
    IGNORE = 'IGNORE'
}

export enum RiskType {
    STRUCTURAL_DEFECT = 'STRUCTURAL_DEFECT',
    BOUNDARY_ISSUE = 'BOUNDARY_ISSUE',
    ARCHITECTURAL_HUB = 'ARCHITECTURAL_HUB',
    INTENDED_HUB = 'INTENDED_HUB',
    UNKNOWN_HUB = 'UNKNOWN_HUB',
    EXTERNAL_PRESSURE = 'EXTERNAL_PRESSURE',
    NORMAL = 'NORMAL'
}

export enum EvidenceType {
    BOUNDARY_NODE = 'BOUNDARY_NODE',
    BOUNDARY_EDGE = 'BOUNDARY_EDGE',
    BOUNDARY_STRENGTH = 'BOUNDARY_STRENGTH',
    SUBSYSTEM = 'SUBSYSTEM',
    CROSS_BOUNDARY_DEPENDENCY = 'CROSS_BOUNDARY_DEPENDENCY',
    WRAPPER_NODE = 'WRAPPER_NODE'
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
    boundaryContext?: {
        id: string;
        strength: string;
        size: number;
    };
}

export interface CompressionResult {
    immediateActions: ProblemGroup[];
    watchList: ProblemGroup[];
    infoList: ProblemGroup[];
    externalPressures: ProblemGroup[];
    ignoredNoiseCount: number;
}

export interface OnboardingPath {
    entryPoint: string;
    corePipeline: string[];
    safeAreas: string[];
    readLater: string[];
}
