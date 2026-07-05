import { Node, Edge } from './GraphModel';

export interface DegreeInfo {
    in: number;
    out: number;
    total: number;
}

export interface ClusterTraffic {
    nodes: number;
    internal_edges: number;
    external_edges: number;
}

export interface ContinentTraffic {
    internal: number;
    external: number;
}

export interface ContinentInfo {
    nodeCount: number;
    clusterCount: number;
    type: 'INTERNAL' | 'EXTERNAL';
}

export interface GraphStats {
    internalEdges: number;
    externalEdges: number;
    ghostNodes: number;
    ghostEdges: number;
    ghostRatio: number;
}

export interface GraphAnalysis {
    degreeMap: Map<string, DegreeInfo>;
    clusterTraffic: Map<string, ClusterTraffic>;
    interClusterTraffic: Map<string, number>;
    ghostImpactTraffic: Map<string, number>;
    directionalClusterTraffic: Map<string, number>;
    continentTraffic: Map<string, ContinentTraffic>;
    interContinentTraffic: Map<string, number>;
    clusterSizes: Record<string, number>;
    continentInfo: Map<string, ContinentInfo>;
    stats: GraphStats;
}

export interface AnalysisInput {
    nodes: Node[];
    edges: Edge[];
    clusterIds: Set<string>;
    nodeIds: Set<string>;
}

export function analyzeGraph(input: AnalysisInput): GraphAnalysis {
    const { nodes, edges, clusterIds, nodeIds } = input;

    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));

    const degreeMap = new Map<string, DegreeInfo>();
    let internalEdges = 0;
    let externalEdges = 0;

    // internalEdges: edge to a confirmed (non-ghost) node
    // externalEdges: edge to a ghost node or unknown (external) target
    for (const edge of edges) {
        if (nodeIds.has(edge.to) && !edge.to.startsWith('external://') && !edge.to.startsWith('ghost://')) {
            const tgt = nodeMap.get(edge.to);
            if (tgt && tgt.status === 'ghost') {
                externalEdges++;
            } else {
                internalEdges++;
            }
        } else {
            externalEdges++;
        }

        if (!degreeMap.has(edge.from)) degreeMap.set(edge.from, { in: 0, out: 0, total: 0 });
        if (!degreeMap.has(edge.to)) degreeMap.set(edge.to, { in: 0, out: 0, total: 0 });

        degreeMap.get(edge.from)!.out++;
        degreeMap.get(edge.from)!.total++;
        degreeMap.get(edge.to)!.in++;
        degreeMap.get(edge.to)!.total++;
    }

    const clusterNodesCount = new Map<string, number>();
    for (const node of nodes) {
        if (node.cluster_id) {
            clusterNodesCount.set(node.cluster_id, (clusterNodesCount.get(node.cluster_id) || 0) + 1);
        }
    }

    const clusterSizes = { '1 node': 0, '2-5 nodes': 0, '6-10': 0, '11-20': 0, '20+': 0 };
    for (const [, cCount] of clusterNodesCount.entries()) {
        if (cCount === 1) clusterSizes['1 node']++;
        else if (cCount <= 5) clusterSizes['2-5 nodes']++;
        else if (cCount <= 10) clusterSizes['6-10']++;
        else if (cCount <= 20) clusterSizes['11-20']++;
        else clusterSizes['20+']++;
    }

    const clusterTraffic = new Map<string, ClusterTraffic>();
    for (const cid of Array.from(clusterIds)) {
        clusterTraffic.set(cid, { nodes: 0, internal_edges: 0, external_edges: 0 });
    }
    for (const n of nodes) {
        if (n.cluster_id && n.cluster_id.startsWith('cluster_ghost')) {
            if (!clusterTraffic.has(n.cluster_id)) clusterTraffic.set(n.cluster_id, { nodes: 0, internal_edges: 0, external_edges: 0 });
        }
    }

    for (const node of nodes) {
        if (node.cluster_id && clusterTraffic.has(node.cluster_id)) {
            clusterTraffic.get(node.cluster_id)!.nodes++;
        }
    }

    const interClusterTraffic = new Map<string, number>();
    const ghostImpactTraffic = new Map<string, number>();
    const directionalClusterTraffic = new Map<string, number>();

    let ghostEdges = 0;
    for (const edge of edges) {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        const fromCid = fromNode?.cluster_id || 'unknown';
        const toCid = toNode?.cluster_id || 'unknown';

        if (fromCid !== toCid) {
            if (clusterTraffic.has(fromCid)) {
                clusterTraffic.get(fromCid)!.external_edges++;
            }
            if (clusterTraffic.has(toCid)) {
                clusterTraffic.get(toCid)!.external_edges++;
            }

            if (fromCid.startsWith('cluster_ghost') || toCid.startsWith('cluster_ghost')) {
                ghostEdges++;
                const ghostCid = fromCid.startsWith('cluster_ghost') ? fromCid : toCid;
                const internalCid = fromCid.startsWith('cluster_ghost') ? toCid : fromCid;
                const key = `${ghostCid} -> ${internalCid}`;
                ghostImpactTraffic.set(key, (ghostImpactTraffic.get(key) || 0) + 1);
            } else {
                const pairKeys = [fromCid, toCid].sort();
                const key = `${pairKeys[0]} <-> ${pairKeys[1]}`;
                interClusterTraffic.set(key, (interClusterTraffic.get(key) || 0) + 1);

                const dirKey = `${fromCid} -> ${toCid}`;
                directionalClusterTraffic.set(dirKey, (directionalClusterTraffic.get(dirKey) || 0) + 1);
            }
        } else {
            if (clusterTraffic.has(fromCid)) {
                clusterTraffic.get(fromCid)!.internal_edges++;
            }
            if (fromCid.startsWith('cluster_ghost')) {
                ghostEdges++;
            }
        }
    }

    let ghostNodes = 0;
    for (const [cid, data] of clusterTraffic.entries()) {
        if (cid.startsWith('cluster_ghost')) ghostNodes += data.nodes;
    }

    const ghostRatio = edges.length > 0 ? (ghostEdges / edges.length) * 100 : 0;

    const continentClusters = new Map<string, Set<string>>();
    const continentInfo = new Map<string, ContinentInfo>();

    for (const node of nodes) {
        const cont = node.data?.continent || 'unknown';
        if (!continentInfo.has(cont)) {
            continentInfo.set(cont, {
                nodeCount: 0,
                clusterCount: 0,
                type: (node.data?.continent_type as 'INTERNAL' | 'EXTERNAL') || 'INTERNAL'
            });
        }
        continentInfo.get(cont)!.nodeCount++;
        if (node.cluster_id) {
            if (!continentClusters.has(cont)) continentClusters.set(cont, new Set());
            continentClusters.get(cont)!.add(node.cluster_id);
        }
    }

    for (const [cont, clusters] of continentClusters) {
        continentInfo.get(cont)!.clusterCount = clusters.size;
    }

    const continentTraffic = new Map<string, ContinentTraffic>();
    const interContinentTraffic = new Map<string, number>();

    for (const edge of edges) {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        const fromCont = fromNode?.data?.continent || 'unknown';
        const toCont = toNode?.data?.continent || 'unknown';

        if (!continentTraffic.has(fromCont)) continentTraffic.set(fromCont, { internal: 0, external: 0 });
        if (!continentTraffic.has(toCont)) continentTraffic.set(toCont, { internal: 0, external: 0 });

        if (fromCont === toCont) {
            continentTraffic.get(fromCont)!.internal++;
        } else {
            continentTraffic.get(fromCont)!.external++;
            continentTraffic.get(toCont)!.external++;

            const pairKeys = [fromCont, toCont].sort();
            const key = `${pairKeys[0]} <-> ${pairKeys[1]}`;
            interContinentTraffic.set(key, (interContinentTraffic.get(key) || 0) + 1);
        }
    }

    return {
        degreeMap,
        clusterTraffic,
        interClusterTraffic,
        ghostImpactTraffic,
        directionalClusterTraffic,
        continentTraffic,
        interContinentTraffic,
        clusterSizes,
        continentInfo,
        stats: {
            internalEdges,
            externalEdges,
            ghostNodes,
            ghostEdges,
            ghostRatio
        }
    };
}
