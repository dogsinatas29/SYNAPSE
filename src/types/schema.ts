/**
 * SYNAPSE Core Data Schemas
 * 핵심 데이터 구조 정의
 */

// 노드 타입
export type NodeType = 'source' | 'cluster' | 'documentation' | 'test' | 'config' | 'history' | 'external';

// 노드 상태
export type NodeStatus = 'proposed' | 'active' | 'error' | 'completed' | 'warning';

// 엣지 타입
export type EdgeType = 'dependency' | 'data_flow' | 'event' | 'conditional' | 'origin';

// 엣지 스타일
export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * 노드 스키마
 */
export interface Node {
    id: string;
    type: NodeType;
    status: NodeStatus;
    position: { x: number; y: number };
    data: {
        file?: string;           // 연결된 파일 경로
        label: string;           // 표시 이름
        cluster_id?: string;     // 소속 클러스터
        content?: string;        // 코드 스니펫 (확대 시)
        color?: string;          // 상태 색상
        description?: string;    // 설명
        layer?: number;          // 계층 (0: Discovery, 1: Reasoning, 2: Action)
        priority?: number;       // 실행 우선순위
    };
    visual: {
        opacity: number;         // 0.5 = 제안 상태
        dashArray?: string;      // 점선 패턴
    };
}

/**
 * 엣지 스키마
 */
export interface Edge {
    id: string;
    from: string;              // 출발 노드 ID
    to: string;                // 도착 노드 ID
    type: EdgeType;
    is_approved: boolean;      // 승인 여부
    visual: {
        thickness: number;       // 선 굵기 (중요도)
        style: EdgeStyle;
        color: string;           // 상태 색상
        animated?: boolean;      // 입자 흐름 효과
    };
}

/**
 * 클러스터 스키마
 */
export interface Cluster {
    id: string;
    label: string;
    collapsed: boolean;        // 접힘 상태
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    children: string[];        // 포함된 노드 ID 목록
    parent_id?: string;        // 부모 클러스터 ID (계층 구조 지원)
    representative_edge?: string; // 접혔을 때 표시할 대표 선
}

/**
 * 프로젝트 구조 (GEMINI.md 분석 결과)
 */
export interface ProjectStructure {
    folders: string[];         // 생성할 폴더 목록
    files: {
        path: string;
        type: NodeType;
        description: string;
    }[];
    dependencies: {            // 파일 간 의존성
        from: string;
        to: string;
        type: EdgeType;
        label?: string;
    }[];
    includePaths?: string[];   // 스캔 범위 제한
}

/**
 * 프로젝트 상태
 */
export interface ProjectState {
    project_name: string;
    gemini_md_path: string;    // GEMINI.md 경로
    current_snapshot_id?: string;
    canvas_state: {
        zoom_level: number;
        offset: { x: number; y: number };
        visible_layers: string[];
    };
    nodes: Node[];
    edges: Edge[];
    clusters: Cluster[];
}

/**
 * Bootstrap 결과
 */
export interface BootstrapResult {
    success: boolean;
    structure: ProjectStructure;
    initial_nodes: Node[];
    initial_edges: Edge[];
    error?: string;
}
