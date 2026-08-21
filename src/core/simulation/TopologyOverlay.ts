import { IGraphView } from '../../types/schema';

export class TopologyOverlay implements IGraphView {
    public readonly removedNodes = new Set<string>();
    public readonly removedEdges = new Set<string>(); // Edge ID or stringified source->target
    public readonly addedEdges: { source: string; target: string; type: string }[] = [];

    /**
     * 특정 노드가 Overlay 환경에서 살아있는지 확인한다.
     */
    isNodeAlive(nodeId: string): boolean {
        return !this.removedNodes.has(nodeId);
    }

    /**
     * 특정 엣지가 Overlay 환경에서 살아있는지 확인한다.
     * edgeId는 편의상 `${source}::${target}` 형태로 쓴다.
     */
    isEdgeActive(source: string, target: string): boolean {
        // 둘 중 하나라도 지워진 노드라면 엣지도 끊어진 것으로 간주
        if (this.removedNodes.has(source) || this.removedNodes.has(target)) return false;
        
        const edgeKey = `${source}::${target}`;
        return !this.removedEdges.has(edgeKey);
    }

    /**
     * 원본 그래프의 outgoing 엣지 중 Overlay 필터를 통과한 활성 엣지만 반환한다.
     * 추가된 엣지(addedEdges)도 있다면 함께 반환한다.
     */
    getActiveEdges(sourceNodeId: string, originalOutgoing: string[]): string[] {
        if (!this.isNodeAlive(sourceNodeId)) return [];

        const activeEdges: string[] = [];
        
        // 1. 원본 엣지 필터링
        for (const target of originalOutgoing) {
            if (this.isEdgeActive(sourceNodeId, target)) {
                activeEdges.push(target);
            }
        }

        // 2. 추가된 가상 엣지 반영
        for (const added of this.addedEdges) {
            if (added.source === sourceNodeId && this.isNodeAlive(added.target)) {
                activeEdges.push(added.target);
            }
        }

        return activeEdges;
    }
}
