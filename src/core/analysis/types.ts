import { ProjectState, Node, Edge, ClusterBridge } from '../../types/schema';
import * as vscode from 'vscode';

export interface DiagnosticRecord {
    relativePath: string;
    severity: vscode.DiagnosticSeverity;
    message: string;
    line: number;
    source?: string;
}

export interface AstFileInfo {
    symbols: string[];
    imports: string[];
    references: string[];
}


export interface BaseFinding {
    type: string;
}

export interface NecrosisFinding extends BaseFinding {
    type: 'necrosis';
    nodeId: string;
    message: string;
    severity: number;
}

export interface FractureFinding extends BaseFinding {
    type: 'fracture';
    edgeId: string;
    sourceNodeId: string;
}

export interface CycleFinding extends BaseFinding {
    type: 'cycle';
    message: string;
    nodeIds: string[];
}

export interface BoundaryFinding extends BaseFinding {
    type: 'boundary';
    message: string;
    sourceId: string;
    targetId?: string;
    violationType: string;
}

export interface PressureFinding extends BaseFinding {
    type: 'pressure';
    message: string;
    nodeId: string;
    pressureType: string;
    value?: number;
}

export interface StructuralFinding extends BaseFinding {
    type: 'structural';
    message: string;
    structuralType: 'dead-end' | 'isolated';
    nodeId: string;
}

export interface SchemaFinding extends BaseFinding {
    type: 'schema';
    message: string;
    schemaType: 'invalid-node' | 'missing-edge-ref';
    nodeId?: string; // For invalid-node
    edgeId?: string; // For missing-edge-ref
}

export type Finding = NecrosisFinding | FractureFinding | CycleFinding | BoundaryFinding | PressureFinding | StructuralFinding | SchemaFinding;

export interface EvidenceBundle {
    version: 1;
    timestamp: number;
    findings: Finding[];
}

export interface CycleCluster {
    id: string; // Hash of sorted node IDs
    nodeIds: string[];
    paths: string[];
    count: number;
}

export interface AggregatedReportBundle {
    version: 1;
    timestamp: number;
    rawFindingsCount: number;
    
    topBottlenecks: PressureFinding[];
    topFanOuts: PressureFinding[];
    topFanIns: PressureFinding[];
    crossClusterPressures: PressureFinding[];
    
    canonicalCycles: CycleCluster[];
    criticalStructurals: StructuralFinding[];
    criticalNecrosis: (NecrosisFinding | BoundaryFinding | SchemaFinding)[];
    criticalFractures: FractureFinding[];
    
    stats: {
        totalBottleneck: number;
        totalFanOut: number;
        totalFanIn: number;
        totalCrossCluster: number;
        totalCycleClusters: number;
        totalCycles: number;
        totalStructurals: number;
        totalNecrosis: number;
        totalFracture: number;
    };
}

export interface SccCluster {
    id: string; // cluster id, usually min(nodeId)
    nodeIds: string[]; // all logic nodes in this SCC
    hubId?: string; // the node with the highest (in + out) degree in this SCC
    hubDegree: number;
}

export interface CompositionMetrics {
    uiCount: number;
    coreCount: number;
    infraCount: number;
    typesCount: number;
    total: number;
    confidence: number; // 0 to 100
}

export type ArchitecturalSmellType = 
    | 'service-locator' 
    | 'god-object' 
    | 'layer-inversion' 
    | 'ui-core-coupling';

export interface ArchitecturalSmell {
    type: ArchitecturalSmellType;
    message: string;
    targetId: string; // Node ID or SCC ID
    evidence: any; // Raw data explaining the reasoning
}

export interface FragmentInfo {
    id: string;
    nodeCount: number;
    representativeNodes: { id: string; degree: number }[]; // Top 2 by degree
}

export interface CriticalBridge {
    sourceId: string;
    targetId: string;
    impact: number; // Percentage
    untangleScore: number;
    structuralRole: string; // e.g. 'Community Boundary Edge'
    edgeType: string; // 'Regex Hypothesis' for v34.3
    sccFragmentation: string; // e.g. "1 SCC (42 nodes) -> 4 Fragments (12, 10, 8, 12)"
    largestRemainingScc: number;
    fragmentCount: number;
    fragments: FragmentInfo[];
}

export interface ReasonedReportBundle {
    version: 1;
    timestamp: number;
    
    sccs: SccCluster[];
    smells: ArchitecturalSmell[];
    criticalBridges: CriticalBridge[];
    clusterBridges?: ClusterBridge[]; // Coupling Measurement

    
    
    base: AggregatedReportBundle; // Retain base metrics for full report
    auditLog?: any;
}


export interface AnalysisContext {
    findings: Finding[];
    nodeMap?: Map<string, Node>;
    edgeMap?: Map<string, Edge>;
    diagnostics?: DiagnosticRecord[];
    astCache?: Map<string, AstFileInfo>;
    workspaceRoot?: string;
}

export interface AnalyzerResult {
    findings: Finding[];
}

export interface ArchitectureAnalyzer {
    readonly id: string;
    analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult;
}

/**
 * Type-safe utility to filter findings by type
 */
export function getFindingsByType<T extends Finding>(
    context: AnalysisContext,
    type: T['type']
): T[] {
    return context.findings.filter(f => f.type === type) as T[];
}
