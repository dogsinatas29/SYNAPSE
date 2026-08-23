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

export interface SimulationContext {
    timestamp: number;
    evidenceBundle: any;
    validationContext?: any;
    visibleClusterIds?: string[];
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

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.34.24 — Architecture State Model (FSM)
// UNKNOWN은 분류 실패가 아니다. 상태 전이 이력이 존재하지 않는 노드다.
// ─────────────────────────────────────────────────────────────────────────────

/** 노드 생애주기 단계 (단방향, 정상 경로만) */
export enum LifecycleState {
    DISCOVERED  = 'DISCOVERED',   // 파일 발견
    PARSED      = 'PARSED',       // AST 파싱 완료
    REGISTERED  = 'REGISTERED',   // GraphModel 등록
    CLUSTERED   = 'CLUSTERED',    // cluster_id 배정
    CLASSIFIED  = 'CLASSIFIED',   // role 분류 완료
}

/** 노드 건강 상태 (LifecycleState 실패 판정) */
export enum HealthState {
    HEALTHY      = 'HEALTHY',      // 정상
    UNCLUSTERED  = 'UNCLUSTERED',  // cluster_id 미배정
    UNCLASSIFIED = 'UNCLASSIFIED', // role 분류 실패
    CORRUPTED    = 'CORRUPTED',    // 데이터 손상
}

/** 현재 뷰 기준 상태 (노드 상태가 아닌 뷰 상태) */
export enum ViewState {
    VISIBLE      = 'VISIBLE',      // 현재 표시 중
    COLLAPSED    = 'COLLAPSED',    // 상위 클러스터에 접힘
    FILTERED     = 'FILTERED',     // 필터에 의해 숨김
    OUT_OF_SCOPE = 'OUT_OF_SCOPE', // 현재 View 범위 밖 (정상 상태)
}

/** 참조(Edge) 기준 상태 (노드 상태 아님) */
export enum ReferenceState {
    RESOLVED = 'RESOLVED', // 대상 노드 존재
    GHOST    = 'GHOST',    // 대상 파일/노드 없음
}

/** FSM 전이 완전성 */
export enum FSMCompleteness {
    KNOWN                = 'KNOWN',                 // 모든 전이 기록됨
    INCOMPLETE_TRANSITION = 'INCOMPLETE_TRANSITION', // 전이 단계 누락
    INVALID_TRANSITION   = 'INVALID_TRANSITION',    // 불가능한 전이
}

/** 노드 상태 집약 (여러 상태 축을 단일 객체로) */
export interface NodeState {
    lifecycle : LifecycleState;
    health    : HealthState;
    view      : ViewState;
}

/** 상태 전이 검증 결과 (상태가 아닌 검증 판정) */
export interface TransitionValidation {
    completeness : FSMCompleteness;
    reason?      : string;
}

/** 노드/참조 이벤트 (도메인 이벤트, 구현 함수명 아님) */
export enum NodeEvent {
    // Lifecycle
    NODE_DISCOVERED = 'NODE_DISCOVERED',
    NODE_RESOLVED   = 'NODE_RESOLVED',
    NODE_CLASSIFIED = 'NODE_CLASSIFIED',

    // Health
    NODE_UNCLUSTERED  = 'NODE_UNCLUSTERED',
    NODE_UNCLASSIFIED = 'NODE_UNCLASSIFIED',
    NODE_CORRUPTED    = 'NODE_CORRUPTED',

    // View
    NODE_HIDDEN   = 'NODE_HIDDEN',
    NODE_REVEALED = 'NODE_REVEALED',

    // Reference
    REFERENCE_BROKEN   = 'REFERENCE_BROKEN',
    REFERENCE_RESOLVED = 'REFERENCE_RESOLVED',
}

/** 상태 전이 기록 (v0.3.34.25+ 시뮬레이션 기반) */
export interface StateTransitionRecord {
    nodeId     : string;
    state      : NodeState;
    validation : TransitionValidation;
    event      : NodeEvent;
    reason     : string;
    timestamp? : number;
}

/** AnomalyCollector 집계 결과 */
export interface AnomalySummary {
    missingTransitions : number;
    invalidTransitions : number;
    unclustered        : number;
    unclassified       : number;
    corrupted          : number;
    outOfScope         : number;
    ghost              : number;
}

/** Continent 미분류 노드 fallback 상수 — 'unknown' 하드코딩 금지 */
export const UNCHARTED_CONTINENT = 'UNCHARTED' as const;

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.34.25 — Transition Grammar Engine
// Invariant: 현재 상태의 정합성 검증. 과거 상태 저장/재구성 없음.
// ─────────────────────────────────────────────────────────────────────────────

/** Violation 최대 보관 수 (커널 7만 노드 대응, 보고서 폭발 방지) */
export const MAX_VIOLATIONS = 100;

/**
 * 허용/금지 전이 선언.
 * ViewState는 전이 Rule 대상에서 제외 — 축 오염 방지.
 */
export interface TransitionRule {
    from    : LifecycleState | HealthState;
    to      : LifecycleState | HealthState;
    allowed : boolean;
    reason  : string;
}

/**
 * 경로 단위 전이 유효성.
 * A→B 단일 검사가 아니라 DISCOVERED→REGISTERED→CLUSTERED 등 경로 전체 판정.
 */
export interface TransitionChain {
    nodeId  : string;
    path    : (LifecycleState | HealthState)[];
    valid   : boolean;
    reason? : string;
}

/** 전이 위반 단건 (보고서 인라인 출력 금지 — 요약 + 링크만) */
export interface TransitionViolation {
    nodeId  : string;
    path    : string;   // "DISCOVERED→CLASSIFIED" 형태
    type    : 'MISSING' | 'INVALID' | 'UNCHARTED';
    reason  : string;
}

/** FSM 일관성 검사 결과 집계 */
export interface FSMAuditSummary {
    missing    : number;   // 중간 단계 누락
    invalid    : number;   // 논리적 불가 전이
    uncharted  : number;   // 정의되지 않은 경로 (Unknown 아님)
    violations : TransitionViolation[];  // MAX_VIOLATIONS 상한
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.34.26 — Failure Propagation Engine
// Invariant: 정적 의존성 기반 결함 전파 계산. Runtime 예측/캐싱 불가.
// ─────────────────────────────────────────────────────────────────────────────

/** 전파 최대 깊이 (성능 폭발 방지 하드 스탑) */
export const MAX_PROPAGATION_DEPTH = 3;

/** 전파 영향 노드 수 최대치 (대형 프로젝트 스케일 방어) */
export const MAX_IMPACT_NODES = 1000;

export enum TargetPolicyType {
    TOP_N = 'TOP_N',
    TOP_PERCENT = 'TOP_PERCENT',
    ABOVE_THRESHOLD = 'ABOVE_THRESHOLD'
}

export interface SimulationTargetPolicy {
    type: TargetPolicyType;
    value: number; // TOP_N이면 개수, TOP_PERCENT면 0.0~1.0, ABOVE_THRESHOLD면 절대값 기준
    hardCap: number; // Prevent OOM by capping maximum simulation targets (Safety Invariant <= 100)
}

/** 노드 단건에 대한 전파 이력 (어떤 노드가 영향받았는가) */
export interface FailureImpact {
    sourceNodeId   : string;
    directImpact   : number; // depth=1
    indirectImpact : number; // depth=2
    cascadeImpact  : number; // depth>=3
    impactedNodes  : string[]; // 영향받은 노드 ID 목록 (최대 MAX_IMPACT_NODES 제한)
}

/** 결함 전파 전체 집계 (보고서용 요약) */
export interface FailurePropagationReport {
    totalDirect   : number;
    totalIndirect : number;
    totalCascade  : number;
    totalNodes    : number; // 비율 계산용 전체 노드 수
    impacts       : FailureImpact[]; 
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.34.28 & 29 — Reporting View Layer
// Invariant: Pure Projection. No new BFS/DFS or graph traversals.
// ─────────────────────────────────────────────────────────────────────────────

export interface IGraphView {
    isNodeAlive(nodeId: string): boolean;
    isEdgeActive(source: string, target: string): boolean;
    addedEdges: { source: string; target: string; type: string }[];
}

export interface BlastRadiusRiskPolicy {
    highRiskPercent: number;   // e.g., 0.1 for 10%
    mediumRiskPercent: number; // e.g., 0.02 for 2%
}

export interface ReportDisplayPolicy {
    percentile: number; // e.g., 0.2 for Top 20%
    hardCap: number;    // e.g., 10 for max 10 items
}

export interface ReportConfig {
    safeExplorationPolicy: {
        blastRadiusPercentile: number;
        authorityPercentile: number;
        couplingPercentile: number;
        hardCap: number;
    };
    blastRadiusRiskPolicy: BlastRadiusRiskPolicy;
    systemHeartPolicy: ReportDisplayPolicy;
    assemblyPointPolicy: ReportDisplayPolicy;
    authorityCenterPolicy: ReportDisplayPolicy;
    refactoringCandidatePolicy: ReportDisplayPolicy;
    teamScalingPolicy: ReportDisplayPolicy;
}

export interface ReportContext {
    graph?: never;
    nodes?: never;
    edges?: never;
    
    systemStats: {
        totalNodes: number;
        totalEdges: number;
        totalClusters: number;
    };
    failureReport: FailurePropagationReport;
    authorityNodes: string[]; 
    assemblyNodes: string[];  
    nodeStats: Array<{
        nodeId: string;
        authorityScore: number;
        couplingScore: number;
        cohesionScore: number; // For refactoring candidates
    }>;
    generatedAt: number;
}

export interface OnboardingReport {
    systemHeart: string[];
    coreAssemblyPoints: string[];
    safeExplorationZones: string[];
    architectureLandmarks: {
        systemHeart: string[];
        coreAssembly: string[];
        authorityCenters: string[];
        peripheralZones: string[];
    };
    doNotTouch: string[];
}

export interface ExecutiveReport {
    systemSnapshot: {
        totalNodes: number;
        totalEdges: number;
        totalClusters: number;
        assemblyPoints: number;
        authorityNodes: number;
    };
    topRisks: string[];
    blastRadiusDashboard: {
        highRiskCount: number;
        mediumRiskCount: number;
        lowRiskCount: number;
    };
    authorityConcentration: {
        topNodesCoverPercent: number; // e.g. 61.5 for 61.5%
        topNodes: string[];
    };
    refactoringCandidates: string[];
    teamScalingRisks: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// v0.3.34.30 — Architecture What-if Laboratory (Orchestration Layer)
// Invariant: No Calculation Engines, Pure Orchestration and Replay.
// ─────────────────────────────────────────────────────────────────────────────

export enum SimulationActionType {
    REMOVE_NODE = 'REMOVE_NODE',
    REMOVE_EDGE = 'REMOVE_EDGE',
    ADD_EDGE = 'ADD_EDGE'
}

export interface SimulationAction {
    type: SimulationActionType;
    nodeId?: string;
    source?: string;
    target?: string;
    edgeType?: string;
}

export interface ScenarioSnapshot {
    id: string;
    timestamp: number;
    description: string;
    actions: SimulationAction[];
}

export interface ScenarioComparison {
    baselineReport: ExecutiveReport;
    scenarioReport: ExecutiveReport;
}

export enum ReportScope {
    FULL_PROJECT = 'FULL_PROJECT',
    SELECTED_CLUSTER = 'SELECTED_CLUSTER',
    BOUNDARY_SCAN = 'BOUNDARY_SCAN',
    SINGLE_NODE = 'SINGLE_NODE'
}

export enum SelectionSource {
    USER_SELECTED = 'USER_SELECTED',
    AUTO_SELECTED = 'AUTO_SELECTED'
}

export interface ReportHeader {
    reportType: string;
    analysisMode: string;
    scope: ReportScope;
    target: string;
    selectionSource: SelectionSource;
    reason: string;
    generatedBy: string;
    evidenceCount: number;
    reportConfidence: number;
}

export interface ReportSection {
    title: string;
    content: string;
}

export interface ReportContract {
    header: ReportHeader;
    summary: string;
    findings: ReportSection[];
    evidence: ReportSection[];
    appendix: ReportSection[];
}

export interface InsightSource {
    value: string | number | string[];
    source: string;
}

export interface ExecutiveInsight {
    health: string;
    topRisk: string;
    action: string;
    whyItMatters: string;
    sources?: Record<string, InsightSource>;
}

export interface RefactorCandidate {
    filePath: string;
    reason: string;
    evidence: string;
}

export interface ArchitectInsight {
    candidates: RefactorCandidate[];
    sources?: Record<string, InsightSource>;
}

export interface OnboardingInsight {
    entryPoint: string;
    coreDomain: string;
    safeArea: string[];
    avoidReadingYet: string;
    sources?: Record<string, InsightSource>;
}

export interface SimulationInsight {
    immediateImpact: string[];
    secondaryImpact: string[];
    blastRadius: number;
    sources?: Record<string, InsightSource>;
}
