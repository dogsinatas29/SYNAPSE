import { Cluster, Node } from '../types/schema';

const SYSTEM_CLUSTERS: Cluster[] = [
    { id: 'cluster_ghosts', label: '🌐 External Dependencies', type: 'system', collapsed: false, position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: { layer: 'external', continent: 'external', subcontinent: 'external' } },
    { id: 'sys_cluster_reserved', label: '🛡️ Reserved (Internal Pending)', type: 'system', position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: {} },
    { id: 'doc_shelf', label: '📚 Documentation Shelf', type: 'system', position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: {} },
    { id: 'folder_root', label: '📁 Root Directory', type: 'folder', position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: { layer: 'ai', continent: 'root', subcontinent: 'root' } }
];

const SYSTEM_CLUSTER_IDS = new Set(['cluster_ghosts', 'sys_cluster_reserved', 'doc_shelf', 'folder_root']);

const BOILERPLATE = new Set(['src', 'main', 'test', 'java', 'kotlin', 'androidTest', 'resources', 'assets']);

export interface ClusterBuildResult {
    clusters: Cluster[];
    clusterIds: Set<string>;
}

import * as path from 'path';

export function buildClusters(nodes: Node[]): ClusterBuildResult {
    const clusters: Cluster[] = SYSTEM_CLUSTERS.map(c => ({ ...c }));
    const clusterIds = new Set<string>(SYSTEM_CLUSTER_IDS);
    const clusterMap = new Map<string, Cluster>();
    clusters.forEach(c => clusterMap.set(c.id, c));

    const dirNodeCount = new Map<string, number>();
    for (const node of nodes) {
        if (!node.cluster_id || SYSTEM_CLUSTER_IDS.has(node.cluster_id)) continue;
        const dir = path.posix.dirname(node.filePath.replace(/\\/g, '/'));
        if (dir && dir !== '.' && dir !== '/') {
            dirNodeCount.set(dir, (dirNodeCount.get(dir) || 0) + 1);
        }
    }

    for (const node of nodes) {
        if (!node.cluster_id || SYSTEM_CLUSTER_IDS.has(node.cluster_id)) continue;

        const dir = path.posix.dirname(node.filePath.replace(/\\/g, '/'));
        if (!dir || dir === '.' || dir === '/') continue;

        let currentPath = dir;
        let currentClusterId = `folder_${currentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

        while (currentPath !== '.' && currentPath.length > 0) {
            const parentPath = path.posix.dirname(currentPath);
            let parentClusterId: string | undefined = undefined;

            if (parentPath && parentPath !== '.' && parentPath !== '/') {
                parentClusterId = `folder_${parentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
            }

            if (!clusterMap.has(currentClusterId)) {
                let label = `📂 ${path.posix.basename(currentPath)}`;
                // [v0.3.32.4] Prefix client username for harvest clusters
                const match = currentPath.match(/(?:\/|^)\.synapse\/clients\/([^/]+)/);
                if (match && match[1]) {
                    const username = match[1];
                    label = `📂 [${username}] ${path.posix.basename(currentPath)}`;
                }

                const rawParts = currentPath.split('/').filter(p => p && p !== '.' && p !== '..');
                const parts = rawParts.filter(p => !BOILERPLATE.has(p));
                const continent = parts[0] || 'root';
                const subcontinent = parts.slice(0, 2).join('/') || continent;

                const newCluster: Cluster = {
                    id: currentClusterId,
                    label: label,
                    type: 'folder',
                    position: { x: 0, y: 0 },
                    bounds: { x: 0, y: 0, width: 0, height: 0 },
                    children: [],
                    nodes: [],
                    data: { layer: 'ai', continent, subcontinent },
                    parent_id: parentClusterId
                };
                const directCount = dirNodeCount.get(currentPath) || 0;
                if (currentClusterId === 'folder_report') {
                    console.error(
                        "[CREATE_CLUSTER]",
                        currentClusterId,
                        {
                            directNodes: directCount,
                            parent: parentClusterId || 'none',
                            path: currentPath
                        }
                    );
                } else {
                    console.log('[CLUSTER_CREATED]', currentClusterId,
                        'directNodes:', directCount,
                        'parent:', parentClusterId || 'none',
                        'path:', currentPath);
                }
                clusterMap.set(currentClusterId, newCluster);
                clusters.push(newCluster);
                clusterIds.add(currentClusterId);
            } else if (parentClusterId && !clusterMap.get(currentClusterId)!.parent_id) {
                clusterMap.get(currentClusterId)!.parent_id = parentClusterId;
            }

            if (!parentClusterId) break;
            currentPath = parentPath;
            currentClusterId = parentClusterId;
        }
    }

    // [v0.3.34] Populate the children array for frontend tree/logging consistency
    for (const c of clusters) {
        if (c.parent_id && clusterMap.has(c.parent_id)) {
            const parent = clusterMap.get(c.parent_id)!;
            if (!parent.children) parent.children = [];
            if (!parent.children.includes(c.id)) {
                parent.children.push(c.id);
            }
        }
    }

    // Populate the nodes array for each cluster
    for (const node of nodes) {
        if (!node.cluster_id) continue;
        const cluster = clusterMap.get(node.cluster_id);
        if (cluster && !cluster.nodes.includes(node.id)) {
            cluster.nodes.push(node.id);
        }
    }

    const emptyClusters = clusters.filter(
        c => c.nodes.length === 0 && (!c.children || c.children.length === 0)
    );
    console.log('[EMPTY_CLUSTER_COUNT]', {
        total: emptyClusters.length,
        sample: emptyClusters.slice(0, 20).map(c => c.id)
    });
    
    // [ROOT_AUDIT] Identify all root clusters (no parent) and sort by node count deterministically
    const rootClusters = clusters.filter(c => !c.parent_id);
    rootClusters.sort((a, b) => {
        const aCount = a.nodes.length || 0;
        const bCount = b.nodes.length || 0;
        if (bCount !== aCount) return bCount - aCount;
        return a.id.localeCompare(b.id); // Deterministic tie-breaker
    });
    
    console.log('[ROOT_AUDIT] Cluster Build completed. Top 20 Roots:', {
        totalRoots: rootClusters.length,
        top20: rootClusters.slice(0, 20).map(c => `${c.id} (${c.nodes?.length || 0} files)`)
    });

    return { clusters, clusterIds };
}
