import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../utils/Logger';
import { ProjectMetadata } from '../ProjectMetadata';
import { SubmissionSnapshot, SubmissionFile, GraphSnapshot } from '../../types/schema';

export type LayerType = 'ai' | 'user' | 'external';

export interface ClassifiedNode {
    id: string;
    filePath: string;
    label: string;
    layer: LayerType;
    clusterId: string;
    isSource: boolean;
    isDocumentation: boolean;
    isExternal: boolean;
    isGhost: boolean;
    hasAtomicSignature: boolean;
    clientLayer?: string;
    clientUsername?: string;
    sessionId?: string;
    clientTimestamp?: number;
}

export interface ClassifiedCluster {
    id: string;
    label: string;
    layer: LayerType;
    memberCount: number;
    clientLayer?: string;
    clientUsername?: string;
    sessionId?: string;
}

export interface ProjectionResult {
    submissionId: string;
    projectUUID: string;
    clientId: string;
    projectedAt: number;
    nodes: ClassifiedNode[];
    clusters: ClassifiedCluster[];
    visibility: {
        showBaseLayer: boolean;
        showUserLayer: boolean;
        showExternalLayer: boolean;
        clientLayers: Record<string, boolean>;
    };
    graphSnapshot: GraphSnapshot;
}

function classifyNodeLayer(node: {
    filePath?: string;
    label?: string;
    clusterId?: string;
    hasAtomicSignature?: boolean;
    isDocumentation?: boolean;
}): LayerType {
    const fp = node.filePath || '';
    const label = node.label || '';

    if (node.hasAtomicSignature) return 'user';
    if (label.startsWith('node_manual_') || fp.startsWith('external://')) return 'external';
    if (fp.startsWith('ghost://')) return 'external';
    if (node.isDocumentation) return 'user';
    if (node.clusterId && node.clusterId !== 'cluster_ghosts' && !node.clusterId.startsWith('folder_')) return 'user';

    return 'ai';
}

function classifyClusterLayer(clusterId: string): LayerType {
    if (clusterId === 'cluster_ghosts') return 'external';
    if (clusterId.startsWith('folder_')) return 'ai';
    if (clusterId.startsWith('sys_')) return 'ai';
    return 'user';
}

export class RemoteLayerProjector {
    private static instance: RemoteLayerProjector;

    static getInstance(): RemoteLayerProjector {
        if (!RemoteLayerProjector.instance) {
            RemoteLayerProjector.instance = new RemoteLayerProjector();
        }
        return RemoteLayerProjector.instance;
    }

    project(snapshot: SubmissionSnapshot): ProjectionResult {
        const projectRoot = ProjectMetadata.getInstance().getProjectRoot();
        const projectionDir = path.join(projectRoot, 'data', 'projection', snapshot.id);

        Logger.info(`[v0.3.30] Projecting submission: ${snapshot.id} (${snapshot.files.length} files)`);

        if (!fs.existsSync(projectionDir)) {
            fs.mkdirSync(projectionDir, { recursive: true });
        }

        const classifiedNodes: ClassifiedNode[] = [];
        const classifiedClustersMap = new Map<string, ClassifiedCluster>();
        const sourceExtensions = new Set(['.py', '.ts', '.js', '.rs', '.cpp', '.c', '.go', '.java', '.kt', '.kts', '.swift']);
        const docExtensions = new Set(['.md', '.mdx', '.rst', '.txt']);

        for (const file of snapshot.files) {
            if (file.filePath.startsWith('external://') || file.filePath.startsWith('ghost://')) continue;
            const ext = path.extname(file.filePath).toLowerCase();
            const fileName = path.basename(file.filePath);
            const isDoc = docExtensions.has(ext);
            const isSource = sourceExtensions.has(ext);

            let clusterId = '';
            const dir = path.dirname(file.filePath);
            if (dir && dir !== '.') {
                const normalizedDir = dir.replace(/\\/g, '/');
                clusterId = `folder_${normalizedDir.replace(/[^a-zA-Z0-9]/g, '_')}`;
            }

            if (isDoc) {
                clusterId = 'doc_shelf';
            }

            const node: ClassifiedNode = {
                id: file.filePath,
                filePath: file.filePath,
                label: fileName.replace(/\.[^/.]+$/, ''),
                layer: 'ai',
                clusterId,
                isSource,
                isDocumentation: isDoc,
                isExternal: false,
                isGhost: false,
                hasAtomicSignature: false,
                clientLayer: snapshot.clientId,
                clientUsername: snapshot.clientUsername,
                sessionId: snapshot.sessionId,
                clientTimestamp: snapshot.timestamp,
            };

            node.layer = classifyNodeLayer(node);
            classifiedNodes.push(node);

            if (clusterId) {
                const existing = classifiedClustersMap.get(clusterId);
                if (existing) {
                    existing.memberCount++;
                } else {
                    const layer = classifyClusterLayer(clusterId);
                    classifiedClustersMap.set(clusterId, {
                        id: clusterId,
                        label: `📂 ${path.basename(dir)}`,
                        layer,
                        memberCount: 1,
                        clientLayer: snapshot.clientId,
                        clientUsername: snapshot.clientUsername,
                        sessionId: snapshot.sessionId,
                    });
                }
            }
        }

        const systemClusters: ClassifiedCluster[] = [
            { id: 'cluster_ghosts', label: '☁️ External Ghosts', layer: 'external', memberCount: 0 },
            { id: 'sys_cluster_reserved', label: '🛡️ Reserved (Internal Pending)', layer: 'ai', memberCount: 0 },
            { id: 'doc_shelf', label: '📚 Documentation Shelf', layer: 'user', memberCount: 0 },
        ];

        for (const sc of systemClusters) {
            if (!classifiedClustersMap.has(sc.id)) {
                classifiedClustersMap.set(sc.id, sc);
            }
        }

        const ghostFiles = snapshot.files.filter(f => f.filePath.startsWith('external://') || f.filePath.startsWith('ghost://'));
        for (const gf of ghostFiles) {
            const ghostNode: ClassifiedNode = {
                id: gf.filePath,
                filePath: gf.filePath,
                label: gf.filePath.replace(/^(external|ghost):\/\//, ''),
                layer: 'external',
                clusterId: 'cluster_ghosts',
                isSource: false,
                isDocumentation: false,
                isExternal: gf.filePath.startsWith('external://'),
                isGhost: gf.filePath.startsWith('ghost://'),
                hasAtomicSignature: false,
            };
            classifiedNodes.push(ghostNode);

            const ghostCluster = classifiedClustersMap.get('cluster_ghosts');
            if (ghostCluster) {
                ghostCluster.memberCount++;
            }
        }

        const classifiedClusters = Array.from(classifiedClustersMap.values());

        const graphSnapshot: GraphSnapshot = {
            nodes: classifiedNodes.map(n => ({
                id: n.id,
                filePath: n.filePath,
                type: n.isDocumentation ? 'documentation' : (n.isExternal ? 'external' : (n.isGhost ? 'source' : 'source')),
                label: n.label,
                cluster_id: n.clusterId,
                layer: n.layer,
                clientLayer: n.clientLayer,
                clientTimestamp: n.clientTimestamp,
                data: {
                    label: n.label,
                    file: n.filePath,
                    cluster_id: n.clusterId,
                    layer: n.layer,
                    clientLayer: n.clientLayer,
                    clientUsername: n.clientUsername,
                    sessionId: n.sessionId,
                    clientTimestamp: n.clientTimestamp,
                    icon: n.isDocumentation ? '📚' : (n.isExternal ? '☁️' : (n.hasAtomicSignature ? '⚡' : '📄')),
                    hiddenOnCanvas: n.isDocumentation,
                    hasAtomicSignature: n.hasAtomicSignature,
                },
                visual: { opacity: n.isGhost ? 0.5 : 1.0 },
                position: { x: 0, y: 0 },
                degree: 0,
            })),
            edges: [],
            clusters: classifiedClusters.map(c => ({
                id: c.id,
                label: c.label,
                type: 'folder',
                layer: c.layer,
                clientLayer: c.clientLayer,
                data: { layer: c.layer, clientLayer: c.clientLayer, clientUsername: c.clientUsername },
                position: { x: 0, y: 0 },
                bounds: { x: 0, y: 0, width: 0, height: 0 },
                children: [],
                nodes: [],
            })),
            timestamp: Date.now(),
            snapshotVersion: 1,
        };

        const clientLayers: Record<string, boolean> = {};
        clientLayers[snapshot.clientId] = true;

        const result: ProjectionResult = {
            submissionId: snapshot.id,
            projectUUID: snapshot.projectUUID,
            clientId: snapshot.clientId,
            projectedAt: Date.now(),
            nodes: classifiedNodes,
            clusters: classifiedClusters,
            visibility: {
                showBaseLayer: true,
                showUserLayer: true,
                showExternalLayer: true,
                clientLayers,
            },
            graphSnapshot,
        };

        Logger.info(`[v0.3.30] Projection complete: ${result.nodes.length} nodes, ${result.clusters.length} clusters`);
        return result;
    }

    private writeTempFiles(snapshot: SubmissionSnapshot, targetDir: string): void {
        for (const file of snapshot.files) {
            if (file.filePath.startsWith('external://') || file.filePath.startsWith('ghost://')) continue;
            const targetPath = path.join(targetDir, file.filePath);
            const targetDirPath = path.dirname(targetPath);
            if (!fs.existsSync(targetDirPath)) {
                fs.mkdirSync(targetDirPath, { recursive: true });
            }
            fs.writeFileSync(targetPath, file.content, (file.encoding || 'utf8') as BufferEncoding);
        }
    }
}
