import { Node, Cluster, NodeType } from './GraphModel';
import { NodeRole } from '../types/schema';
import { ResolvedReference } from './ReferenceResolver';
import { makeExternalSemantic } from './ExternalReferenceSemantics';

export interface ExpandedReference {
    sourceId: string;
    targetId: string;
    referenceType: string;
    isGhost: boolean;
    provenance?: any;
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
        existingNodeIds: ReadonlySet<string>,
        internalNamespace?: string
    ): ExpansionResult {
        const ghostNodes: Node[] = [];
        const ghostClusters: Cluster[] = [];
        const expandedReferences: ExpandedReference[] = [];

        // For GHOST_SUMMARY
        const ghostStats = {
            total: 0,
            byLanguage: {} as Record<string, number>,
            targets: {} as Record<string, number>,
            domainCounts: {} as Record<string, number>
        };

        console.error('[GHOST_EXPANDER_ENTER]', {
            existingNodeCount: existingNodeIds.size
        });
        
        const newClusterIds = new Set<string>();
        const newNodeIds = new Set<string>();

        // [v0.3.33.2] Precompute existing directories to avoid O(N*E) loop and GC thrashing
        const existingDirectories = new Set<string>();
        for (const id of existingNodeIds) {
            let dir = id;
            while (dir.includes('/')) {
                dir = dir.substring(0, dir.lastIndexOf('/'));
                existingDirectories.add(dir);
            }
        }

        const getGhostClusterId = (domain: string): string => {
            // [v0.3.35] External Layer Compression - 3-Tier 계층 도메인 분리 적용
            return `cluster_ghost_${domain}`;
        };

        const addGhostCluster = (cId: string, label: string, parentId: string | null = null) => {
            if (!existingClusterIds.has(cId) && !newClusterIds.has(cId)) {
                ghostClusters.push({
                    id: cId,
                    parent_id: parentId, // [v0.3.35] 계층 구조 연결
                    label: label,
                    type: 'system',
                    collapsed: false, // User Request: Expand all by default
                    position: { x: 0, y: 0 },
                    bounds: { x: 0, y: 0, width: 0, height: 0 },
                    children: [],
                    nodes: [],
                    data: { layer: 'external', continent: 'external', subcontinent: 'external' }
                });
                newClusterIds.add(cId);
            }
        };

        const extractGhostDomain = (id: string): string => {
            const p = id.split('/');
            if (p[0] === 'uapi') return 'uapi';
            if (p[0] === 'asm' || p[0] === 'arch') return 'asm';
            if (p[0] === 'trace') return 'trace';
            if (p[0] === 'generated') return 'generated';
            if (p[0] === 'linux' || id.includes('/linux/')) return 'linux';
            return p[0] || 'other';
        };

        let _ghostIdx = 0;
        for (const ref of resolvedReferences) {
            _ghostIdx++;
            const targetNodeId = ref.targetId;
            const isUnresolved = ref.resolutionKind === 'unresolved';

            expandedReferences.push({
                sourceId: ref.sourceId,
                targetId: ref.targetId,
                referenceType: ref.referenceType,
                isGhost: isUnresolved,
                provenance: ref.provenance
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

                const ghostDomain = extractGhostDomain(targetNodeId);

                let ghostClusterId = isDocRef ? 'doc_shelf' : (isExternal ? getGhostClusterId(ghostDomain) : 'sys_cluster_reserved');

                if (ref.referenceType === 'network_link') {
                    ghostClusterId = 'cluster_ghost_network_remote';
                    // We removed the console logs to keep it pure, or we can keep them out.
                }

                if (isExternal && ghostClusterId !== 'doc_shelf') {
                    // [v0.3.35] 최상위 Root Cluster 강제 생성
                    addGhostCluster('cluster_ghosts', '🌐 External Dependencies', null);
                    
                    const label = ghostClusterId === 'cluster_ghost_network_remote' 
                        ? '🌐 Remote Network / Cross-Workspace' 
                        : `☁️ External (${ghostDomain})`;
                    
                    // [v0.3.35] Domain Sub-Cluster 생성 및 Parent 연결
                    addGhostCluster(ghostClusterId, label, 'cluster_ghosts');
                }

                let ghostContinent = 'unknown';
                if (isDocRef) {
                    ghostContinent = 'doc';
                } else if (ghostClusterId.startsWith('cluster_ghost_')) {
                    ghostContinent = ghostClusterId.replace('cluster_ghost_', '');
                } else if (ghostClusterId !== 'sys_cluster_reserved') {
                    ghostContinent = ghostClusterId;
                }

                // [Fix] Prevent creating ghost node if the target acts as a directory for existing nodes
                if (targetNodeId === '.' || targetNodeId === '..') {
                    continue; // Completely ignore relative path roots
                }

                if (targetNodeId === 'src') {
                    console.error('[SRC_DEBUG]', {
                        targetNodeId,
                        existingNodeCount: existingNodeIds.size,
                        sample: Array.from(existingNodeIds).slice(0, 20)
                    });
                }

                const isActingAsDir = existingDirectories.has(targetNodeId);

                if (targetNodeId === 'src' || targetNodeId.startsWith('extensions/')) {
                    console.error('[GHOST_CHECK]', {
                        targetNodeId,
                        isActingAsDir,
                    });
                }

                if (isActingAsDir || existingNodeIds.has(targetNodeId)) {
                    continue; // Skip creating ghost node to prevent FILE_ACTING_AS_DIR crashes
                }

                if (!newNodeIds.has(targetNodeId)) {
                    // ==========================================
                    // [USER PROBE: GHOST_SUMMARY STATS]
                    // ==========================================
                    const ext = targetNodeId.split('.').pop() || '';
                    let parserLanguage = 'unknown';
                    if (['ts', 'js'].includes(ext)) parserLanguage = 'javascript/typescript';
                    else if (['rs'].includes(ext)) parserLanguage = 'rust';
                    else if (['py'].includes(ext)) parserLanguage = 'python';
                    else if (['md'].includes(ext)) parserLanguage = 'markdown';
                    
                    ghostStats.total++;
                    ghostStats.byLanguage[parserLanguage] = (ghostStats.byLanguage[parserLanguage] || 0) + 1;
                    ghostStats.targets[targetNodeId] = (ghostStats.targets[targetNodeId] || 0) + 1;
                    ghostStats.domainCounts[ghostDomain] = (ghostStats.domainCounts[ghostDomain] || 0) + 1;

                    if (targetNodeId === '.' || targetNodeId === '..' || targetNodeId === 'src' || targetNodeId.startsWith('extensions/')) {
                        console.error('[EXTERNAL_NODE_CREATED]', {
                            id: targetNodeId,
                            source: 'GhostExpander',
                            sourceFile: ref.sourceId,
                            referenceType: ref.referenceType,
                            originalTarget: ref.originalTarget
                        });
                    }

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
                        createdBy: 'GhostExpander',
                        role: isDocRef ? NodeRole.DOCUMENT : (isExternal ? NodeRole.EXTERNAL : NodeRole.GHOST),
                        data: {
                            label: targetNodeId,
                            file: targetNodeId,
                            cluster_id: ghostClusterId,
                            icon: isDocRef ? '📚' : '👻',
                            hiddenOnCanvas: isDocRef,
                            continent: ghostContinent,
                            subcontinent: ghostContinent,
                            continent_type: 'EXTERNAL',
                            layer: isExternal ? 'external' : 'ai',
                            domain: ghostDomain,
                            sourceFile: ref.sourceId,
                            referenceType: ref.referenceType,
                            ...(isDocRef
                                ? makeExternalSemantic('DocumentationReference', 'DOCUMENTATION')
                                : (isExternal
                                    ? makeExternalSemantic('Unknown', 'UNKNOWN')
                                    : makeExternalSemantic('Unknown', 'UNKNOWN')))
                        },
                        intelligence: {},
                        visual: { opacity: isExternal ? 0.6 : 1.0 }
                    });
                    newNodeIds.add(targetNodeId);
                }
            }
        }

        // Print GHOST_SUMMARY
        console.log('[GHOST_SUMMARY]', {
            total: ghostStats.total,
            byLanguage: ghostStats.byLanguage,
            domainCounts: ghostStats.domainCounts,
            topTargets: Object.entries(ghostStats.targets)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50)
                .map(([t, c]) => `${t} (${c})`)
        });

        console.error('[GHOST_DONE]', 'ghostNodes=', ghostNodes.length, 'ghostClusters=', ghostClusters.length, 'expandedReferences=', expandedReferences.length);
        return { ghostNodes, ghostClusters, expandedReferences };
    }
}
