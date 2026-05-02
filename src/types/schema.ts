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

export interface GraphSnapshot {
    nodes: Node[];
    edges: Edge[];
    clusters: Cluster[];
    cluster_flows?: ClusterFlow[];
    timestamp: number;
}

export interface BootstrapResult {
    success: boolean;
    structure?: ProjectStructure;
    initial_nodes?: Node[];
    initial_edges?: Edge[];
    error?: any;
}
