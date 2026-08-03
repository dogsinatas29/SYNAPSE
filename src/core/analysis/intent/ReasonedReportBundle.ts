import { EvidenceIR } from './EvidenceIR';
import { IntentEdge } from './IntentEdge';
import { ActionCandidate } from './ActionCandidate';

export interface PipelineStats {
    rawEdges: number;
    resolvedEdges: number;
    unresolvedSymbols: number;
    subsystemEdges: number;
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
