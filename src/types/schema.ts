/**
 * SYNAPSE Core Data Schemas
 * 핵심 데이터 구조 정의 (v0.3.23 Extreme Flexibility)
 */

export type NodeType = any;
export type NodeStatus = any;
export type EdgeType = any;
export type EdgeStyle = any;

export enum NodeRole {
    RUNTIME = 'RUNTIME',
    RUNTIME_ENTRY = 'RUNTIME_ENTRY',
    DOMAIN_MODEL = 'DOMAIN_MODEL',
    TEST = 'TEST',
    TOOLING = 'TOOLING',
    CONFIG = 'CONFIG',
    DOCUMENT = 'DOCUMENT',
    ASSET = 'ASSET',
    GRAMMAR = 'GRAMMAR',
    EXTERNAL = 'EXTERNAL',
    GHOST = 'GHOST'
}

export enum SemanticRole {
    CORE_RUNTIME = 'CORE_RUNTIME',
    TEST = 'TEST',
    BENCHMARK = 'BENCHMARK',
    SAMPLE = 'SAMPLE',
    TOOLING = 'TOOLING',
    DOCUMENTATION = 'DOCUMENTATION',
    GENERATED = 'GENERATED',
    UNKNOWN = 'UNKNOWN'
}

export enum SemanticEdgeType {
    CODE = 'CODE',
    TEST = 'TEST',
    DOC = 'DOC',
    GENERATED = 'GENERATED',
    GHOST = 'GHOST'
}

export enum EdgeProvenance {
    TYPE_ONLY = 'TYPE_ONLY',
    UNKNOWN_RUNTIME = 'UNKNOWN_RUNTIME',
    CONSTRUCTOR_CALL = 'CONSTRUCTOR_CALL',
    FUNCTION_CALL = 'FUNCTION_CALL',
    INHERITANCE = 'INHERITANCE',
    DECORATOR = 'DECORATOR',
    FRAMEWORK_REGISTRATION = 'FRAMEWORK_REGISTRATION',
    DYNAMIC_IMPORT = 'DYNAMIC_IMPORT',
    INCLUDE_DIRECTIVE = 'IncludeReference'
}

export interface Node {
    id: string;
    type?: any;
    status?: any;
    position?: { x: number; y: number };
    filePath?: any;
    cluster_id?: any;
    degree?: any;
    layer?: any;
    label?: any;
    data?: any;
    intelligence?: any;
    visual?: any;
    clientLayer?: string;
    clientTimestamp?: number;
    role?: NodeRole;
    semanticRole?: SemanticRole;
    isAssemblyPoint?: boolean;
    category?: string;
    confidence?: number;
    [key: string]: any;
}

export interface Edge {
    id?: any;
    from?: any;
    to?: any;
    type?: any;
    is_approved?: any;
    weight?: any;
    status?: any;
    data?: any;
    intelligence?: any;
    visual?: any;
    provenance?: EdgeProvenance;
    semanticType?: SemanticEdgeType;
    [key: string]: any;
}

export interface Cluster {
    id: string;
    label?: any;
    type?: any;
    collapsed?: any;
    position?: { x: number; y: number };
    bounds?: {
        x: number; y: number; width: number; height: number;
    };
    children?: string[];
    parent_id?: any;
    representative_edge?: any;
    nodes?: any;
    data?: any;
    clientLayer?: string;
    [key: string]: any;
}

export interface ClusterFlow {
    from: string;
    to: string;
    count: number;
}

export interface ProjectStructure {
    folders?: string[];
    files?: any[];
    dependencies?: any[];
    includePaths?: string[];
    principles?: string[];
}

export type PositionSource = 'user' | 'auto';

export interface LayoutNodePosition {
    x: number;
    y: number;
    confidence: number;
    source: PositionSource;
}

export interface NamedLayer {
    id: string;
    name: string;
}

export interface LayoutState {
    version: number;
    nodePositions: Record<string, LayoutNodePosition>;
    clusterPositions: Record<string, LayoutNodePosition>;
    layerAssignments: Record<string, string>; // clusterId -> layerId
    layers: NamedLayer[];
}

export interface WorkspaceState {
    version: number;
    camera: { zoom: number, x: number, y: number };
    visibility: { visibleLayers: string[], hiddenClusters: string[] };
    filters?: any;
}

export interface BookmarkState {
    version: number;
    bookmarks: any[];
}

export interface SynapseWorkspace {
    version: number;
    graphFingerprint: string;
    layout_state: LayoutState;
    workspace_state: WorkspaceState;
    bookmark_state: BookmarkState;
}

export interface ClusterBridge {
    sourceCluster: string;
    targetCluster: string;
    edgeIds: string[];
    totalEdges: number;
    outboundEdges?: number; // from source to target
    inboundEdges?: number;  // from target to source
    typeOnlyEdges: number;
    unknownRuntimeEdges: number;
    functionCallEdges: number;
    constructorEdges: number;
    inheritanceEdges: number;
    frameworkRegistrationEdges: number;
    decoratorEdges: number;
    couplingDensity: number; // Represents the absolute number of edges (equivalent to totalEdges, kept for clarity)
    rawScore: number;
    couplingStrength: number; // Normalized qualitative score of the bond
    dominantProvenance?: string;
    distribution?: {
        typeOnlyPct: number;
        functionCallPct: number;
        constructorPct: number;
        inheritancePct: number;
        decoratorPct: number;
        unknownPct: number;
    };
}

export interface ProjectState {
    version?: number;
    project_name?: any;
    gemini_md_path?: any;
    current_snapshot_id?: any;
    canvas_state?: any; // Deprecated, migrating to SynapseWorkspace
    nodes?: Node[];
    edges?: Edge[];
    clusters?: Cluster[];
    cluster_flows?: ClusterFlow[];
    cluster_bridges?: ClusterBridge[];
    metaEdges?: any[];
    system_context?: any;
    deletedNodeIds?: string[];
    deletedPaths?: string[];
}

export interface ProjectMetadata {
    projectUUID: string;
    projectName: string;
    version: string;
    createdAt: number;
    updatedAt: number;
    snapshotCount: number;
    metadataVersion: number;
}

export interface SymbolIndexData {
    projectName: string;
    projectRoot: string;
    folderTree: any;
    fileRegistry: any[];
    functionCatalog: any[];
}

export enum ArchitecturalRole {
    UI_COMPONENT = 'UI_COMPONENT',
    DOMAIN_SERVICE = 'DOMAIN_SERVICE',
    INFRASTRUCTURE = 'INFRASTRUCTURE',
    ASSEMBLY_POINT = 'ASSEMBLY_POINT',
    CONTRACT_HUB = 'CONTRACT_HUB',
    TEST_ARTIFACT = 'TEST_ARTIFACT',
    COORDINATOR = 'COORDINATOR',
    UNKNOWN = 'UNKNOWN'
}

export enum FindingType {
    UI_TO_SERVICE_COUPLING = 'UI_TO_SERVICE_COUPLING',
    EXCESSIVE_FAN_OUT = 'EXCESSIVE_FAN_OUT',
    GOD_SERVICE = 'GOD_SERVICE',
    CYCLIC_DEPENDENCY = 'CYCLIC_DEPENDENCY',
    HEALTHY_HUB = 'HEALTHY_HUB',
    CONTRACT_BLOAT = 'CONTRACT_BLOAT',
    NORMAL = 'NORMAL'
}

export enum RiskLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    NONE = 'NONE'
}

export interface ArchitecturalFinding {
    nodeId: string;
    filePath: string;
    role: ArchitecturalRole;
    findingType: FindingType;
    risk: RiskLevel;
    evidence: Array<{ type: string; value: string | number }>;
    reasonCodes?: string[];
}

export enum AssemblyAuditReason {
    ACCEPTED = 'ACCEPTED',
    REJECTED_BOUNDED = 'REJECTED_BOUNDED',
    REJECTED_LOW_FANOUT = 'REJECTED_LOW_FANOUT',
    REJECTED_LOW_BOUNDARY_RATIO = 'REJECTED_LOW_BOUNDARY_RATIO',
    ASSEMBLY_HIGH_FANOUT = 'ASSEMBLY_HIGH_FANOUT',
    ASSEMBLY_HIGH_BOUNDARY_RATIO = 'ASSEMBLY_HIGH_BOUNDARY_RATIO',
    NOT_CANDIDATE_NAME = 'NOT_CANDIDATE_NAME'
}

export interface AssemblyAuditEntry {
    nodeId: string;
    filePath: string;
    accepted: boolean;
    fanOut: number;
    fanOutPercentile: number;
    boundaryRatio: number;
    reasons: AssemblyAuditReason[];
}

export interface GraphSnapshot {
    nodes: Node[];
    edges: Edge[];
    clusters: Cluster[];
    cluster_flows?: ClusterFlow[];
    timestamp: number;
    snapshotVersion?: number;
    metadata?: {
        projectUUID: string;
        projectName: string;
        snapshotCount: number;
        assemblyAudit?: AssemblyAuditEntry[];
        architecturalFindings?: ArchitecturalFinding[];
        ghostBreakdown?: Record<string, number>;
        externalBreakdown?: Record<string, number>;
        resolutionStats?: {
            total: number;
            resolved: number;
            ambiguous: number;
            ghost: number;
            unresolved: number;
        };
        edgeTypeDistribution?: Record<string, number>;
    };
    checksum?: string;
}

export interface BootstrapResult {
    success: boolean;
    structure: ProjectStructure;
    initial_nodes: any[];
    initial_edges: any[];
    metaEdges?: any[];
    error?: any;
}

export type HarvestSessionState = 'Inactive' | 'Locked' | 'Comparing' | 'Approving' | 'Executing' | 'Harvesting' | 'Unlocked';

export type CompareResultType = 'UNCHANGED' | 'MODIFIED' | 'ADDED';

export interface CompareResult {
    filePath: string;
    state: CompareResultType;
    clientUsername: string;
    userId: string;
}

export interface HarvestCandidate {
    filePath: string;
    clientUsername: string;
    userId: string;
    targetPath: string; // Master layer path
    sourcePath: string; // Client layer path
}

export type HarvestFailureReason = 'SSE_TIMEOUT' | 'WRITE_ERROR' | 'PATH_TRAVERSAL' | 'UNKNOWN';

export interface HarvestFailure {
    candidate: HarvestCandidate;
    reason: HarvestFailureReason;
    detail: string;
}

export interface ClientFileHash {
    filePath: string;
    hash: string;
}

export interface SubmissionFile {
    filePath: string;
    content: string;
    encoding?: string;
}

export interface SubmissionSnapshot {
    id: string;
    projectUUID: string;
    clientId: string;
    clientUsername?: string;
    sessionId?: string;
    files: { filePath: string; content: string; encoding?: string }[];
    timestamp: number;
}

export type ReviewState = any;
export type HarvestInput = any;
export type HarvestedFile = any;

// v0.3.32 Contribution Entity Types
export type ContributionNodeKind = 'compared' | 'harvested';
export type ContributionEdgeRelation = 'derived_from';

export interface ContributionNode {
    id: string; // hash(filePath, userId)
    kind: ContributionNodeKind;
    filePath: string;
    userId: string;
}

export interface ContributionEdge {
    id: string;
    from: string;
    to: string;
    relation: ContributionEdgeRelation;
}

export interface CodeSummary {
    classes: string[];
    functions: string[];
    references: { target: string, type: string, nodeId?: string, isApproved?: boolean, fullPath?: string, confidence?: number, provenance?: EdgeProvenance }[];
    package?: string;
    hasAtomicSignature?: boolean;
    hasImportSignature?: boolean;
}

export interface LanguageScanner {
    supportsExtension(ext: string): boolean;
    parse(content: string, summary: CodeSummary): void;
}
