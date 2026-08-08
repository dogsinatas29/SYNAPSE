import { EvidenceIR } from './EvidenceIR';
import { IntentEdge } from './IntentEdge';
import { ActionCandidate, ImpactVector } from './ActionCandidate';

export interface PipelineStats {
    rawEdges: number;
    resolvedEdges: number;
    unresolvedSymbols: number;
    subsystemEdges: number;
    findingCandidates?: number;
    finalFindings?: number;
}

export interface DependencyCorridor {
    targetRegion: string;
    ratio: string;
    traffic: number;
}

export interface QuickStartGateway {
    file: string;
    diversity: number;
    traffic: number;
    touchedBy: string[];
}

export interface NavigationRegion {
    name: string;
    rank: number;
    massScore: number; // Internal sorting, not rendered
    primaryGateways: string[];
}

export interface ContinentInfo {
    name: string;
    nodeCount: number;
    internalTraffic: number;
    externalTraffic: number;
    connectedRegions: number;
    role: 'Mega Hub' | 'Connector' | 'Specialized' | 'Standard';
}

export interface BridgeFile {
    file: string;
    traffic: number;
    contributionPercentage: number;
}

export interface CorridorInfo {
    regionA: string;
    regionB: string;
    traffic: number;
    topBridges: BridgeFile[];
}

export interface RegionConnectivity {
    region: string;
    connectedRegions: number;
    externalTraffic: number;
}

export interface RepresentativeFile {
    region: string;
    coreFiles: string[];
}

export interface StrategicAsset {
    file: string;
    globalTraffic: number;
    regionsTouched: number;
    maxCorridorOwnership: number;
    criticalityScore: number;
}

export interface ArchitectureAtlas {
    strategicAssets: StrategicAsset[];
    continents: ContinentInfo[];
    corridors: CorridorInfo[];
    regionConnectivity: RegionConnectivity[];
    representativeFiles: RepresentativeFile[];
}

export interface ReasonedReportBundle {
    generatedAt: string;
    pipelineStats: PipelineStats;
    
    evidenceCount: number;
    intentEdgeCount: number;
    averageConfidence: number;
    
    evidence: EvidenceIR[];
    intentEdges: IntentEdge[];

    onboardingMap?: ArchitectureAtlas;
}

export type FindingType =
    | 'circular_dependency'
    | 'domain_bottleneck'
    | 'diffuse_coupling'
    | 'shared_infrastructure'
    | 'orchestrator';

export interface CriticalEdge {
    sourceSub: string;
    targetSub: string;
    count: number;
    topFiles: string[];
    traceReference: string;
}

export interface Finding {
    title: string;
    findingType: FindingType;
    observation: string;
    interpretation: string;
    consequence: string;
    confidence: number;
    impactVector: ImpactVector;
    relatedEdges: IntentEdge[];
    evidencePattern: string;
    criticalEdges: CriticalEdge[];
}
