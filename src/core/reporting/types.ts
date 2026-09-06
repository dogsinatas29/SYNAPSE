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
    WRAPPER_NODE = 'WRAPPER_NODE',
    REJECTED_CANDIDATE = 'REJECTED_CANDIDATE'
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

// Phase 26.5: Validation Framework (General SCC Validation Suite)
export type ValidationStatus = 'observed' | 'supported' | 'rejected' | 'inconclusive' | 'replicated';

export interface ValidationMetric {
    key: string;
    value: number | string;
    unit?: string;
}

export interface ValidationClaim {
    id: string;
    statement: string;
    status: ValidationStatus;
    observation?: string;
    datasetScope?: string;
    competingHypotheses?: {
        hypothesis: string;
        status: 'rejected' | 'inconclusive' | 'supported';
    }[];
    impactSummary?: {
        metric: string;
        before: number;
        after: number;
        delta?: number;
        deltaPercent?: number;
        affectedAreas?: string[];
    };
    supportingStudyIds?: string[];
}

export interface SourceDataset {
    project: string;
    nodeCount: number;
    edgeCount: number;
    hash?: string;
}

export type StudyDomain = 'scc' | 'boundary' | 'dependency' | 'topology' | 'reproduction';

export type StudyMethod = 'inventory' | 'ranking' | 'ablation' | 'sampling' | 'comparison' | 'reproduction';

export interface DatasetRef {
    id: string;
    name: string;
    version?: string;
    fingerprint?: string;
}

export interface ValidationEvidenceItem {
    type: string;
    data: unknown;
}

export type EvidenceSource = 'measured' | 'simulated' | 'mock';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ValidationStudy {
    id: string;
    version: string;
    title: string;
    domain: StudyDomain;
    methods: StudyMethod[];
    dataset: DatasetRef;
    evidenceSource?: EvidenceSource;
    confidenceLevel?: ConfidenceLevel;
    replicationCount?: number;
    claims: ValidationClaim[];
    metrics: ValidationMetric[];
    evidence?: ValidationEvidenceItem[];
}

export interface ValidationRegistry {
    schemaVersion: string;
    studies: ValidationStudy[];
}

// Phase 26.5: Validation Framework (General SCC Validation Suite)
// We keep ValidationEvidence here for backward compatibility during transition, or we replace it:
export interface ValidationEvidence {
    studies: ValidationStudy[];
}
