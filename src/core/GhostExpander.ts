import { Node, Cluster, NodeType } from './GraphModel';
import { ResolvedReference } from './ReferenceResolver';

export interface ExpandedReference {
    sourceId: string;
    targetId: string;
    referenceType: string;
    isGhost: boolean;
}

export interface ExpansionResult {
    ghostNodes: Node[];
    ghostClusters: Cluster[];
    expandedReferences: ExpandedReference[];
}

export class GhostExpander {
    public static expand(
        resolvedReferences: ResolvedReference[],
        existingClusterIds: ReadonlySet<string>,
        internalNamespace?: string
    ): ExpansionResult {
        const ghostNodes: Node[] = [];
        const ghostClusters: Cluster[] = [];
        const expandedReferences: ExpandedReference[] = [];
        
        const newClusterIds = new Set<string>();
        const newNodeIds = new Set<string>();

        const getGhostClusterId = (cleanId: string): string => {
            const predefined = ['android', 'androidx', 'java', 'javax', 'kotlin', 'com.google', 'org.apache'];
            for (const p of predefined) {
                if (cleanId.startsWith(p + '.')) return `cluster_ghost_${p.replace(/\./g, '_')}`;
            }
            const segments = cleanId.split('.');
            if (segments.length > 1) {
                return `cluster_ghost_${segments[0]}`; // fallback to first segment
            }
            return 'cluster_ghosts';
        };

        const addGhostCluster = (cId: string, label: string) => {
            if (!existingClusterIds.has(cId) && !newClusterIds.has(cId)) {
                ghostClusters.push({
                    id: cId,
                    label: label,
                    type: 'system',
                    collapsed: false,
                    position: { x: 0, y: 0 },
                    bounds: { x: 0, y: 0, width: 0, height: 0 },
                    children: [],
                    nodes: [],
                    data: { layer: 'external' }
                });
                newClusterIds.add(cId);
            }
        };

        for (const ref of resolvedReferences) {
            const targetNodeId = ref.targetId;
            const isUnresolved = ref.resolutionKind === 'unresolved';

            expandedReferences.push({
                sourceId: ref.sourceId,
                targetId: ref.targetId,
                referenceType: ref.referenceType,
                isGhost: isUnresolved
            });

            if (isUnresolved) {
                const _origTarget = ref.originalTarget;
                const isDocRef = targetNodeId.toLowerCase().endsWith('.md');
                const cleanId = ref.fullPath ? ref.fullPath : _origTarget.replace('external://', '').replace('ghost://', '');

                let isExternal = false;
                if (ref.referenceType === 'network_link') {
                    isExternal = true;
                } else if (internalNamespace && cleanId.includes('.')) {
                    isExternal = !cleanId.startsWith(internalNamespace);
                } else {
                    isExternal = ref.referenceType === 'api_call' || ref.referenceType === 'dependency' || !targetNodeId.includes('.');
                }

                let ghostClusterId = isDocRef ? 'doc_shelf' : (isExternal ? getGhostClusterId(cleanId) : 'sys_cluster_reserved');

                if (ref.referenceType === 'network_link') {
                    ghostClusterId = 'cluster_ghost_network_remote';
                    // We removed the console logs to keep it pure, or we can keep them out.
                }

                if (isExternal && ghostClusterId !== 'doc_shelf') {
                    const label = ghostClusterId === 'cluster_ghost_network_remote' 
                        ? '🌐 Remote Network / Cross-Workspace' 
                        : `☁️ External (${ghostClusterId.replace('cluster_ghost_', '')})`;
                    addGhostCluster(ghostClusterId, label);
                }

                let ghostContinent = 'unknown';
                if (isDocRef) {
                    ghostContinent = 'doc';
                } else if (ghostClusterId.startsWith('cluster_ghost_')) {
                    ghostContinent = ghostClusterId.replace('cluster_ghost_', '');
                } else if (ghostClusterId !== 'sys_cluster_reserved') {
                    ghostContinent = ghostClusterId;
                }

                if (!newNodeIds.has(targetNodeId)) {
                    ghostNodes.push({
                        id: targetNodeId,
                        filePath: isExternal ? `external://${targetNodeId}` : `ghost://${targetNodeId}`,
                        type: isDocRef ? NodeType.DOCUMENTATION : (isExternal ? NodeType.EXTERNAL : NodeType.SYMBOL),
                        label: targetNodeId.split('/').pop() || targetNodeId,
                        cluster_id: ghostClusterId,
                        status: 'ghost' as any,
                        layer: isExternal ? 'external' : 'ai',
                        position: { x: 0, y: 0 },
                        degree: 0,
                        data: {
                            label: targetNodeId,
                            file: targetNodeId,
                            cluster_id: ghostClusterId,
                            icon: isDocRef ? '📚' : '👻',
                            hiddenOnCanvas: isDocRef,
                            continent: ghostContinent,
                            subcontinent: ghostContinent,
                            continent_type: 'EXTERNAL',
                            layer: isExternal ? 'external' : 'ai'
                        },
                        intelligence: {},
                        visual: { opacity: isExternal ? 0.6 : 1.0 }
                    });
                    newNodeIds.add(targetNodeId);
                }
            }
        }

        return { ghostNodes, ghostClusters, expandedReferences };
    }
}
