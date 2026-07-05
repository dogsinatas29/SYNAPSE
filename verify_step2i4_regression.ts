import * as assert from 'assert';
import { GhostExpander } from './src/core/GhostExpander';
import { NodeType } from './src/core/GraphModel';

function createMockFixture() {
    const existingClusterIds = new Set<string>(['sys_cluster_reserved', 'cluster_ghost_java']);
    
    const resolvedReferences = [
        {
            sourceId: 'src/main.ts',
            targetId: 'com.google.auth',
            resolutionKind: 'unresolved' as const,
            originalTarget: 'com.google.auth',
            referenceType: 'dependency',
            fullPath: 'com.google.auth'
        },
        {
            sourceId: 'src/main.ts',
            targetId: 'README.md',
            resolutionKind: 'unresolved' as const,
            originalTarget: 'README.md',
            referenceType: 'document',
            fullPath: 'README.md'
        },
        {
            sourceId: 'src/main.ts',
            targetId: 'java.util.List',
            resolutionKind: 'unresolved' as const,
            originalTarget: 'java.util.List',
            referenceType: 'dependency',
            fullPath: 'java.util.List'
        },
        {
            sourceId: 'src/main.ts',
            targetId: 'local.resolved',
            resolutionKind: 'direct' as const,
            originalTarget: 'local.resolved',
            referenceType: 'dependency',
            fullPath: 'local.resolved'
        }
    ];

    return { resolvedReferences, existingClusterIds, internalNamespace: 'my.app' };
}

function legacyGhostLogic(
    resolvedReferences: any[],
    clusterIds: Set<string>,
    internalNamespace: string
) {
    const ghostNodes: any[] = [];
    const ghostClusters: any[] = [];
    
    // Legacy did this inline
    for (const ref of resolvedReferences) {
        if (ref.resolutionKind === 'unresolved') {
            const targetNodeId = ref.targetId;
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
            
            if (isExternal && ghostClusterId !== 'doc_shelf') {
                const label = ghostClusterId === 'cluster_ghost_network_remote' 
                    ? '🌐 Remote Network / Cross-Workspace' 
                    : `☁️ External (${ghostClusterId.replace('cluster_ghost_', '')})`;
                
                if (!clusterIds.has(ghostClusterId)) {
                    ghostClusters.push({
                        id: ghostClusterId,
                        label: label,
                        type: 'system',
                        collapsed: false,
                        position: { x: 0, y: 0 },
                        bounds: { x: 0, y: 0, width: 0, height: 0 },
                        children: [],
                        nodes: [],
                        data: { layer: 'external' }
                    });
                    clusterIds.add(ghostClusterId);
                }
            }

            let ghostContinent = 'unknown';
            if (isDocRef) {
                ghostContinent = 'doc';
            } else if (ghostClusterId.startsWith('cluster_ghost_')) {
                ghostContinent = ghostClusterId.replace('cluster_ghost_', '');
            } else if (ghostClusterId !== 'sys_cluster_reserved') {
                ghostContinent = ghostClusterId;
            }

            if (!ghostNodes.find(n => n.id === targetNodeId)) {
                ghostNodes.push({
                    id: targetNodeId,
                    filePath: isExternal ? `external://${targetNodeId}` : `ghost://${targetNodeId}`,
                    type: isDocRef ? NodeType.DOCUMENTATION : (isExternal ? NodeType.EXTERNAL : NodeType.SYMBOL),
                    label: targetNodeId.split('/').pop() || targetNodeId,
                    cluster_id: ghostClusterId,
                    status: 'ghost' as any,
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
                        continent_type: 'EXTERNAL'
                    },
                    intelligence: {},
                    visual: { opacity: isExternal ? 0.6 : 1.0 }
                });
            }
        }
    }
    
    function getGhostClusterId(cleanId: string): string {
        const predefined = ['android', 'androidx', 'java', 'javax', 'kotlin', 'com.google', 'org.apache'];
        for (const p of predefined) {
            if (cleanId.startsWith(p + '.')) return `cluster_ghost_${p.replace(/\./g, '_')}`;
        }
        const segments = cleanId.split('.');
        if (segments.length > 1) {
            return `cluster_ghost_${segments[0]}`; // fallback to first segment
        }
        return 'cluster_ghosts';
    }

    return { ghostNodes, ghostClusters };
}

function verifyStep2i4() {
    const { resolvedReferences, existingClusterIds, internalNamespace } = createMockFixture();

    const legacyClusterIds = new Set(existingClusterIds);
    const legacy = legacyGhostLogic(resolvedReferences, legacyClusterIds, internalNamespace);
    const newExpansion = GhostExpander.expand(resolvedReferences, existingClusterIds, internalNamespace);

    console.log("=== Step 2i-4 Regression Verification ===");
    
    assert.strictEqual(legacy.ghostNodes.length, newExpansion.ghostNodes.length, "Ghost nodes length mismatch");
    assert.strictEqual(legacy.ghostClusters.length, newExpansion.ghostClusters.length, "Ghost clusters length mismatch");

    for (let i = 0; i < legacy.ghostNodes.length; i++) {
        assert.deepStrictEqual(legacy.ghostNodes[i], newExpansion.ghostNodes[i], `Ghost node mismatch at ${i}`);
    }
    for (let i = 0; i < legacy.ghostClusters.length; i++) {
        assert.deepStrictEqual(legacy.ghostClusters[i], newExpansion.ghostClusters[i], `Ghost cluster mismatch at ${i}`);
    }

    // Verify expandedReferences output
    assert.strictEqual(resolvedReferences.length, newExpansion.expandedReferences.length, "Expanded references length mismatch");
    for (let i = 0; i < resolvedReferences.length; i++) {
        assert.strictEqual(resolvedReferences[i].sourceId, newExpansion.expandedReferences[i].sourceId);
        assert.strictEqual(resolvedReferences[i].targetId, newExpansion.expandedReferences[i].targetId);
        assert.strictEqual(resolvedReferences[i].referenceType, newExpansion.expandedReferences[i].referenceType);
        assert.strictEqual(resolvedReferences[i].resolutionKind === 'unresolved', newExpansion.expandedReferences[i].isGhost);
    }

    console.log(`ghostNodes: ${newExpansion.ghostNodes.length} passed (Match)`);
    console.log(`ghostClusters: ${newExpansion.ghostClusters.length} passed (Match)`);
    console.log(`expandedReferences: ${newExpansion.expandedReferences.length} passed (Match)`);
    console.log("Verification PASSED!");
}

verifyStep2i4();
