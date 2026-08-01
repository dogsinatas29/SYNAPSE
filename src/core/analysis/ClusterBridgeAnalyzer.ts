import { Cluster, ClusterBridge, Edge, EdgeProvenance, Node } from '../../types/schema';

export class ClusterBridgeAnalyzer {
    
    private static getProvenanceWeight(provenance?: EdgeProvenance): number {
        if (!provenance) return 2; // UNKNOWN_RUNTIME default
        switch (provenance) {
            case EdgeProvenance.TYPE_ONLY: return 1;
            case EdgeProvenance.UNKNOWN_RUNTIME: return 2;
            case EdgeProvenance.DECORATOR: return 3;
            case EdgeProvenance.FRAMEWORK_REGISTRATION: return 4;
            case EdgeProvenance.FUNCTION_CALL: return 4;
            case EdgeProvenance.INHERITANCE: return 6;
            case EdgeProvenance.CONSTRUCTOR_CALL: return 8;
            default: return 2;
        }
    }

    public static analyzeVisibleClusters(targetClusterIds: string[], nodes: Node[], edges: Edge[], clusters?: Cluster[]): ClusterBridge[] {
        console.time('[COUPLING_TOTAL]');
        console.log('[COUPLING_RAW]', {
            targetClusters: targetClusterIds.length,
            nodes: nodes.length,
            edges: edges.length,
            clusters: clusters?.length
        });
        if (targetClusterIds.length > 100) {
            console.warn(`[ClusterBridgeAnalyzer] WARNING: ${targetClusterIds.length} clusters — proceeding with edge-based analysis.`);
            // [v0.3.34.8] Guard disabled for performance measurement
            // return [];
        }

        const bridges: ClusterBridge[] = [];
        
        // Map node ID to the Set of cluster IDs it belongs to (target clusters AND all other clusters)
        const nodeToClusters = new Map<string, Set<string>>();
        const activeClusterSet = new Set(targetClusterIds);
        const isFiltering = targetClusterIds.length > 0;

        const parentMap = new Map<string, string>();
        if (clusters) {
            clusters.forEach(c => {
                if (c.parent_id) parentMap.set(c.id, c.parent_id);
            });
        }

        console.time('[COUPLING_NODEMAP]');
        for (const node of nodes) {
            if (node.cluster_id && typeof node.cluster_id === 'string') {
                let currentId = node.cluster_id;
                const belongsTo = new Set<string>();
                
                while (currentId) {
                    // Collect ALL clusters the node belongs to
                    belongsTo.add(currentId);
                    const exactParent = parentMap.get(currentId);
                    if (exactParent) {
                        currentId = exactParent;
                    } else {
                        const lastSlash = currentId.lastIndexOf('/');
                        if (lastSlash !== -1) {
                            currentId = currentId.substring(0, lastSlash);
                        } else if (currentId.startsWith('folder_')) {
                            const lastUnder = currentId.lastIndexOf('_');
                            if (lastUnder > 7) {
                                currentId = currentId.substring(0, lastUnder);
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                }
                
                if (belongsTo.size > 0) {
                    nodeToClusters.set(node.id, belongsTo);
                }
            }
        }
        console.timeEnd('[COUPLING_NODEMAP]');
        console.log('[COUPLING_NODE_MAP]', { mappedNodes: nodeToClusters.size, totalNodes: nodes.length });

        // Bridge map: "sourceId||targetId" -> { edges: Edge[], couplingStrength: number, totalEdges: number }
        const bridgeMap = new Map<string, { edges: Edge[], couplingStrength: number, totalEdges: number }>();

        console.time('[COUPLING_BRIDGE]');
        for (const edge of edges) {
            if (!edge.from || !edge.to) continue;
            
            const sourceClusters = nodeToClusters.get(edge.from);
            const targetClusters = nodeToClusters.get(edge.to);
            
            if (!sourceClusters || !targetClusters) continue;
            
            // Cross product of clusters
            for (const s of sourceClusters) {
                for (const t of targetClusters) {
                    if (s === t) continue; // Skip internal edges of the same cluster
                    
                    // If filtering, AT LEAST ONE cluster must be in the active target set
                    if (isFiltering && !activeClusterSet.has(s) && !activeClusterSet.has(t)) {
                        continue;
                    }
                    
                    // Consistent key for undirected bridge accumulation
                    const key = s < t ? `${s}||${t}` : `${t}||${s}`;
                    let bridgeInfo = bridgeMap.get(key);
                    if (!bridgeInfo) {
                        bridgeInfo = { edges: [], couplingStrength: 0, totalEdges: 0 };
                        bridgeMap.set(key, bridgeInfo);
                    }
                    bridgeInfo.couplingStrength += (edge.weight || 1);
                    bridgeInfo.totalEdges++;
                    // [GC Thrashing 방지] 엣지 객체를 무한정 담으면 38만 x 수백만 계층 시 메모리 2GB 초과
                    if (bridgeInfo.edges.length < 10) {
                        bridgeInfo.edges.push(edge);
                    }
                }
            }
        }
        console.timeEnd('[COUPLING_BRIDGE]');
        let totalBridgeEdges = 0;
        for (const info of bridgeMap.values()) {
            totalBridgeEdges += info.totalEdges;
        }
        const avgEdgesPerBridge = bridgeMap.size > 0 ? (totalBridgeEdges / bridgeMap.size).toFixed(2) : '0';
        console.log('[COUPLING_BRIDGES]', { bridgePairs: bridgeMap.size, bridgeEdges: totalBridgeEdges, avgEdgesPerBridge });

        console.time('[COUPLING_STATS]');
        // Now compute stats for each pair
        for (const [key, info] of bridgeMap.entries()) {
            const [s, t] = key.split('||');
            const bridge = this.computeBridgeStats(s, t, info, nodeToClusters);
            bridges.push(bridge);
        }
        console.timeEnd('[COUPLING_STATS]');

        console.timeEnd('[COUPLING_TOTAL]');
        return bridges;
    }

    private static computeBridgeStats(sourceCluster: string, targetCluster: string, info: { edges: Edge[], couplingStrength: number, totalEdges: number }, nodeToClusters: Map<string, Set<string>>): ClusterBridge {
        const bridge: ClusterBridge = {
            sourceCluster,
            targetCluster,
            edgeIds: info.edges.map(e => e.id),
            totalEdges: info.totalEdges,
            outboundEdges: 0,
            inboundEdges: 0,
            typeOnlyEdges: 0,
            unknownRuntimeEdges: 0,
            functionCallEdges: 0,
            constructorEdges: 0,
            inheritanceEdges: 0,
            frameworkRegistrationEdges: 0,
            decoratorEdges: 0,
            couplingDensity: info.totalEdges,
            rawScore: info.couplingStrength,
            couplingStrength: info.couplingStrength
        };

        for (const edge of info.edges) {
            if (edge.from && edge.to) {
                const fromClusters = nodeToClusters.get(edge.from);
                if (fromClusters && fromClusters.has(sourceCluster)) {
                    bridge.outboundEdges!++;
                } else {
                    bridge.inboundEdges!++;
                }
            }

            switch (edge.provenance) {
                case EdgeProvenance.TYPE_ONLY:
                    bridge.typeOnlyEdges++; break;
                case EdgeProvenance.UNKNOWN_RUNTIME:
                case undefined:
                    bridge.unknownRuntimeEdges++; break;
                case EdgeProvenance.FUNCTION_CALL:
                    bridge.functionCallEdges++; break;
                case EdgeProvenance.CONSTRUCTOR_CALL:
                    bridge.constructorEdges++; break;
                case EdgeProvenance.INHERITANCE:
                    bridge.inheritanceEdges++; break;
                case EdgeProvenance.FRAMEWORK_REGISTRATION:
                    bridge.frameworkRegistrationEdges++; break;
                case EdgeProvenance.DECORATOR:
                    bridge.decoratorEdges++; break;
            }
        }

        // couplingStrength는 단순 평균(Normalized)이 아니라, 결합의 '총 질량(질적 가중치의 합)'을 의미해야 하므로 rawScore를 그대로 사용합니다.
        bridge.couplingStrength = bridge.rawScore;

        if (bridge.totalEdges > 0) {
            const total = bridge.totalEdges;
            bridge.distribution = {
                typeOnlyPct: Math.round((bridge.typeOnlyEdges / total) * 100),
                functionCallPct: Math.round((bridge.functionCallEdges / total) * 100),
                constructorPct: Math.round((bridge.constructorEdges / total) * 100),
                inheritancePct: Math.round((bridge.inheritanceEdges / total) * 100),
                decoratorPct: Math.round((bridge.decoratorEdges / total) * 100),
                unknownPct: Math.round((bridge.unknownRuntimeEdges / total) * 100)
            };

            const candidates = [
                { prov: 'CONSTRUCTOR_CALL', count: bridge.constructorEdges },
                { prov: 'INHERITANCE', count: bridge.inheritanceEdges },
                { prov: 'FUNCTION_CALL', count: bridge.functionCallEdges },
                { prov: 'TYPE_ONLY', count: bridge.typeOnlyEdges },
                { prov: 'DECORATOR', count: bridge.decoratorEdges },
                { prov: 'UNKNOWN', count: bridge.unknownRuntimeEdges }
            ];
            
            // Sort by count descending, then by impact (which naturally follows the array order above for ties, roughly)
            candidates.sort((a, b) => b.count - a.count);
            bridge.dominantProvenance = candidates[0].count > 0 ? candidates[0].prov : 'UNKNOWN';
        }

        return bridge;
    }
}
