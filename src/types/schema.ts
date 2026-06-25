/**
 * SYNAPSE Core Data Schemas
 * 핵심 데이터 구조 정의 (v0.3.23 Extreme Flexibility)
 */

export type NodeType = any;
export type NodeStatus = any;
export type EdgeType = any;
export type EdgeStyle = any;

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

export interface ProjectState {
    project_name?: any;
    gemini_md_path?: any;
    current_snapshot_id?: any;
    canvas_state?: any;
    nodes?: Node[];
    edges?: Edge[];
    clusters?: Cluster[];
    cluster_flows?: ClusterFlow[];
    system_context?: any;
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
    };
    checksum?: string;
}

export interface BootstrapResult {
    success: boolean;
    structure?: ProjectStructure;
    initial_nodes?: Node[];
    initial_edges?: Edge[];
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
