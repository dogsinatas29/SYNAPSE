import { Node, Edge, Cluster, GraphSnapshot } from './GraphModel';

/**
 * 🏗️ SYNAPSE Graph Builder (v0.3.11)
 * 
 * "Core Freeze" 원칙에 따라 그래프 생성을 전담하며,
 * 생성된 그래프를 불변(Immutable) 상태로 동결한다.
 */

export function buildGraph(nodes: Node[], edges: Edge[], clusters: Cluster[]): GraphSnapshot {
    // 1. 순서 결정성 확보 (Deterministic Order)
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    const sortedEdges = [...edges].sort((a, b) => {
        const aKey = `${a.from}-${a.to}-${a.type}`;
        const bKey = `${b.from}-${b.to}-${b.type}`;
        return aKey.localeCompare(bKey);
    });
    const sortedClusters = [...clusters].sort((a, b) => a.id.localeCompare(b.id));

    // 2. 스냅샷 생성
    const snapshot: GraphSnapshot = {
        nodes: sortedNodes,
        edges: sortedEdges,
        clusters: sortedClusters,
        timestamp: Date.now()
    };

    // 3. 불변화 (Deep Freeze)
    return deepFreeze(snapshot);
}

/**
 * 객체를 재귀적으로 동결하여 완전 불변 상태를 보장합니다.
 */
function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    const propNames = Object.getOwnPropertyNames(obj);
    for (const name of propNames) {
        const value = (obj as any)[name];
        if (value && typeof value === 'object') {
            deepFreeze(value);
        }
    }

    return Object.freeze(obj);
}
