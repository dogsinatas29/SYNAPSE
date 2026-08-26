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

export interface OnboardingPath {
    entryPoint: string;
    corePipeline: string[];
    safeAreas: string[];
    readLater: string[];
}

// v0.3.34.36 Governance Engine
export interface RiskVector {
    sourceGroup: ProblemGroup;
    boundary: number;
    cycle: number;
    coupling: number;
    authority: number;
    isIntendedHub: boolean;
}

export interface FrontierResult {
    frontier: RiskVector[];
    dominated: RiskVector[];
}

export interface PartitionResult {
    frontier: RiskVector[];
    watchList: RiskVector[];
    infoList: RiskVector[];
    externalPressures: RiskVector[];
}
