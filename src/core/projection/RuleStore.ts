import { Node, Edge, Cluster } from '../GraphModel';

/**
 * 📏 SYNAPSE Visual Rule Set (v0.3.11)
 * 
 * Projection 완료 후 시각적 최적화를 위한 룰셋입니다.
 */

export interface ProjectionRule {
    name: string;
    apply(nodes: Node[], edges: Edge[], clusters: Cluster[]): { nodes: Node[], edges: Edge[] };
}

/**
 * [Rule 01] Edge Compression
 * 여러 개의 미세한 엣지를 하나의 굵은 엣지(Aggregated)로 압축합니다.
 */
export class EdgeCompressionRule implements ProjectionRule {
    name = "Edge Compression";
    apply(nodes: Node[], edges: Edge[]) {
        const compressed: Edge[] = [];
        const seen = new Map<string, Edge>();

        edges.forEach(edge => {
            const key = `${edge.from}->${edge.to}`;
            if (seen.has(key)) {
                const existing = seen.get(key)!;
                existing.weight += 0.1; // 가중치 합산
                existing.data = existing.data || {};
                existing.data.count = (existing.data.count || 1) + 1;
            } else {
                const newEdge = { ...edge };
                seen.set(key, newEdge);
                compressed.push(newEdge);
            }
        });

        return { nodes, edges: compressed };
    }
}

/**
 * [Rule 02] Layer Isolation
 * 설정된 계층(Layer) 범위를 벗어난 노드들을 숨깁니다.
 */
export class LayerIsolationRule implements ProjectionRule {
    name = "Layer Isolation";
    constructor(private activeLayers: number[]) {}

    apply(nodes: Node[], edges: Edge[]) {
        const filteredNodes = nodes.filter(n => {
            const layer = n.data?.layer ?? 0;
            return this.activeLayers.includes(layer);
        });
        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredEdges = edges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to));

        return { nodes: filteredNodes, edges: filteredEdges };
    }
}

/**
 * [Rule 03] Document Auto-Classification
 * 특정 확장자를 가진 노드를 자동으로 'document' 타입으로 분류하고
 * AI 레이어(기본 로직)로 고정하여 Documentation Shelf로 보냅니다.
 */
export class DocumentClassificationRule implements ProjectionRule {
    name = "Document Classification";
    apply(nodes: Node[], edges: Edge[]) {
        const docExts = ['.md', '.txt', '.rules', '.json', '.yaml'];
        const updatedNodes = nodes.map(n => {
            const filePath = n.filePath ? n.filePath.toLowerCase() : '';
            const isDoc = docExts.some(ext => filePath.endsWith(ext));
            
            if (isDoc) {
                return {
                    ...n,
                    type: 'document',
                    data: { ...n.data, layer: 'ai', type: 'document' }
                };
            }
            return n;
        });
        return { nodes: updatedNodes, edges };
    }
}

export const standardProjectionRules: ProjectionRule[] = [
    new EdgeCompressionRule(),
    new DocumentClassificationRule()
];
