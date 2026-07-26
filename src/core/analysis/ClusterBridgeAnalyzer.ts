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
        const bridges: ClusterBridge[] = [];
        
        // Map node ID to the Set of cluster IDs it belongs to (target clusters only)
        const nodeToClusters = new Map<string, Set<string>>();
        const activeClusterSet = new Set(targetClusterIds);

        const parentMap = new Map<string, string>();
        if (clusters) {
            clusters.forEach(c => {
                if (c.parent_id) parentMap.set(c.id, c.parent_id);
            });
        }

        for (const node of nodes) {
            if (node.cluster_id && typeof node.cluster_id === 'string') {
                let currentId = node.cluster_id;
                const belongsTo = new Set<string>();
                
                while (currentId) {
                    if (activeClusterSet.has(currentId)) {
                        belongsTo.add(currentId);
                    }
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

        // Bridge map: "sourceId||targetId" -> Edge[]
        const bridgeMap = new Map<string, Edge[]>();

        for (const edge of edges) {
            if (!edge.from || !edge.to) continue;
            
            const sourceClusters = nodeToClusters.get(edge.from);
            const targetClusters = nodeToClusters.get(edge.to);
            
            if (!sourceClusters || !targetClusters) continue;
            
            // Cross product of clusters
            for (const s of sourceClusters) {
                for (const t of targetClusters) {
                    if (s === t) continue; // Skip internal edges of the same cluster
                    
                    // Consistent key for undirected bridge accumulation
                    const key = s < t ? `${s}||${t}` : `${t}||${s}`;
                    let bridgeEdges = bridgeMap.get(key);
                    if (!bridgeEdges) {
                        bridgeEdges = [];
                        bridgeMap.set(key, bridgeEdges);
                    }
                    bridgeEdges.push(edge);
                }
            }
        }

        // Now compute stats for each pair
        for (const [key, bridgeEdges] of bridgeMap.entries()) {
            const [s, t] = key.split('||');
            const bridge = this.computeBridgeStats(s, t, bridgeEdges, nodeToClusters);
            bridges.push(bridge);
        }

        return bridges;
    }

    private static computeBridgeStats(sourceCluster: string, targetCluster: string, edges: Edge[], nodeToClusters: Map<string, Set<string>>): ClusterBridge {
        const bridge: ClusterBridge = {
            sourceCluster,
            targetCluster,
            totalEdges: edges.length,
            outboundEdges: 0,
            inboundEdges: 0,
            typeOnlyEdges: 0,
            unknownRuntimeEdges: 0,
            functionCallEdges: 0,
            constructorEdges: 0,
            inheritanceEdges: 0,
            frameworkRegistrationEdges: 0,
            decoratorEdges: 0,
            couplingDensity: edges.length,
            rawScore: 0,
            couplingStrength: 0
        };

        for (const edge of edges) {
            const weight = this.getProvenanceWeight(edge.provenance);
            bridge.rawScore += weight;
            
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
