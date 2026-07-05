import { Cluster, Node } from '../types/schema';

const SYSTEM_CLUSTERS: Cluster[] = [
    { id: 'cluster_ghosts', label: '☁️ External Ghosts', type: 'system', collapsed: false, position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: { layer: 'external' } },
    { id: 'sys_cluster_reserved', label: '🛡️ Reserved (Internal Pending)', type: 'system', collapsed: false, position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: {} },
    { id: 'doc_shelf', label: '📚 Documentation Shelf', type: 'system', collapsed: false, position: { x: 0, y: 0 }, bounds: { x: 0, y: 0, width: 0, height: 0 }, children: [], nodes: [], data: {} }
];

const SYSTEM_CLUSTER_IDS = new Set(['cluster_ghosts', 'sys_cluster_reserved', 'doc_shelf']);

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

                const newCluster: Cluster = {
                    id: currentClusterId,
                    label: label,
                    type: 'folder',
                    collapsed: false,
                    position: { x: 0, y: 0 },
                    bounds: { x: 0, y: 0, width: 0, height: 0 },
                    children: [],
                    nodes: [],
                    data: { layer: 'ai' },
                    parent_id: parentClusterId
                };
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

    return { clusters, clusterIds };
}
