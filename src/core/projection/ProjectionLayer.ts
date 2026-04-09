import { Node, Edge, Cluster, GraphSnapshot } from '../GraphModel';
import { standardProjectionRules, ProjectionRule } from './RuleStore';

/**
 * 📽️ SYNAPSE Projection Layer (v0.3.11)
 * 
 * 원본 그래프(사실 계층)로부터 특정 해상도(FILE, FUNCTION 등)로 
 * 투영된 시각화 모델을 생성합니다.
 */

export enum ProjectionResolution {
    FILE = 'file',
    FUNCTION = 'function',
    FULL = 'full'
}

export interface ViewSnapshot {
    nodes: Node[];
    edges: Edge[];
    clusters: Cluster[];
    resolution: ProjectionResolution;
    timestamp: number;
}

export class ProjectionLayer {
    private rules: ProjectionRule[] = standardProjectionRules;

    /**
     * 그래프 스냅샷을 지정된 해상도로 투영하고 시각적 규칙을 적용합니다.
     */
    public project(graph: GraphSnapshot, resolution: ProjectionResolution): ViewSnapshot {
        console.log(`[SYNAPSE] Projecting graph with resolution: ${resolution}`);

        // [v0.3.11] 전역 이름 정규화: 모든 뷰에서 일관된 이름을 보장 (확장자 보존)
        const normalizedNodes = graph.nodes.map(n => {
            const fileName = pathBasename(n.filePath);
            // 우선순위: 사용자 직접 입력 > 파일 시스템 이름 > 기존 데이터 레이블 > 시스템 ID
            const finalLabel = n.label || fileName || (n.data && n.data.label) || n.id;
            
            return {
                ...n,
                label: finalLabel,
                data: { ...n.data, label: finalLabel }
            };
        });

        const normalizedGraph = { ...graph, nodes: normalizedNodes };

        let view: ViewSnapshot;
        switch (resolution) {
            case ProjectionResolution.FILE:
                view = this.projectToFileLevel(normalizedGraph);
                break;
            case ProjectionResolution.FUNCTION:
                view = this.projectToFunctionLevel(normalizedGraph);
                break;
            default:
                view = { ...normalizedGraph, resolution, timestamp: Date.now() };
        }

        // Apply Visual Rules
        let { nodes, edges } = view;
        for (const rule of this.rules) {
            const result = rule.apply(nodes, edges, view.clusters);
            nodes = result.nodes;
            edges = result.edges;
        }

        return { ...view, nodes, edges };
    }

    private projectToFileLevel(graph: GraphSnapshot): ViewSnapshot {
        // [v0.3.11] FILE 레벨 투영: 파일, 소스 뿐만 아니라 'pending' 상태인 수동 노드 무조건 포함
        const allowedTypes = ['file', 'source', 'documentation', 'external', 'symbol', 'FILE', 'SOURCE'];
        const fileNodes = graph.nodes
            .filter(n => 
                allowedTypes.includes(n.type as string) || 
                n.status === 'pending' || 
                (n as any).layer === 'user' || 
                (n.data && n.data.layer === 'user')
            )
            .map(n => ({
                ...n,
                // [v0.3.11] 원본 label이 있으면 유지, 없으면 data.label이나 ID에서 복구
                label: n.label || (n.data && n.data.label) || n.id
            }));
        const fileNodeIds = new Set(fileNodes.map(n => n.id));

        // 엣지 재배선: Symbol -> Symbol 연결을 부모 File -> 부모 File 연결로 변환
        const projectedEdges: Edge[] = [];
        const edgeKeys = new Set<string>();

        graph.edges.forEach(edge => {
            // [v0.3.11] 수동 생성 엣지 및 사용자 레이어 엣지 보존
            if (edge.status === 'pending' || 
                (edge as any).layer === 'user' || 
                (edge.data && (edge.data.projected === false || edge.data.layer === 'user'))) {
                projectedEdges.push({
                    ...edge,
                    data: { ...edge.data, label: edge.type }
                });
                return;
            }

            const fromNode = graph.nodes.find(n => n.id === edge.from);
            const toNode = graph.nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) return;

            // 부모 파일 찾기: 파일 노드면 본인 ID, 아니면 filePath에서 추출. External은 경로 정보 유지.
            let fromFileId = fromNode.id;
            if (fromNode.type !== 'file' && fromNode.type !== 'external') {
                fromFileId = pathBasename(fromNode.filePath) || fromNode.id;
            }

            let toFileId = toNode.id;
            if (toNode.type !== 'file' && toNode.type !== 'external') {
                toFileId = pathBasename(toNode.filePath) || toNode.id;
            }

            if (fromFileId && toFileId && fromFileId !== toFileId) {
                const key = `${fromFileId}->${toFileId}`;
                if (!edgeKeys.has(key)) {
                    projectedEdges.push({
                        ...edge,
                        from: fromFileId,
                        to: toFileId,
                        weight: edge.weight,
                        data: { originalType: edge.type, projected: true }
                    });
                    edgeKeys.add(key);
                }
            }
        });

        return {
            nodes: fileNodes,
            edges: projectedEdges,
            clusters: graph.clusters,
            resolution: ProjectionResolution.FILE,
            timestamp: Date.now()
        };
    }

    private projectToFunctionLevel(graph: GraphSnapshot): ViewSnapshot {
        // [TODO] FUNCTION 레벨 투영 상세 로직 (함수 노드 노출 등)
        return {
            ...graph,
            resolution: ProjectionResolution.FUNCTION,
            timestamp: Date.now()
        };
    }
}

function pathBasename(filePath: string): string {
    if (!filePath) return '';
    const parts = filePath.split(/[\\/]/);
    const last = parts[parts.length - 1];
    // [v0.3.11] 확장자 제거 처리: DataPipeline과 ID 생성 규칙 통일
    return last.replace(/\.[^/.]+$/, "") || last;
}

export const projectionLayer = new ProjectionLayer();
