import { Node, Edge, SemanticRole, SemanticEdgeType, AssemblyAuditReason, AssemblyAuditEntry } from './GraphModel';

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
    assemblyAudit: AssemblyAuditEntry[];
}

export interface AnalysisInput {
    nodes: Node[];
    edges: Edge[];
    clusterIds: Set<string>;
    nodeIds: Set<string>;
}

export function analyzeGraph(input: AnalysisInput): GraphAnalysis {
    console.log('[GRAPH_ANALYZER_ENTER]', { nodeCount: input.nodes?.length, edgeCount: input.edges?.length });
    const { nodes, edges, clusterIds, nodeIds } = input;
    const path = require('path');

        // [P0 진단] 후보 파일 존재 여부 확인
        const candidateNames = nodes
            .map(n => path.basename(n.filePath || n.id || '').toLowerCase())
            .filter(name =>
                /(main|app|bootstrap|startup|program|compositionroot|server|client|container|dependencyregistrar|services?)/.test(name)
            );

    console.log('[ASSEMBLY_CANDIDATE_DUMP]', candidateNames);

    const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]));
    const degreeMap = new Map<string, DegreeInfo>();
    const nodeBoundaryMap = new Map<string, number>();

    // 1. Assign SemanticEdgeType and Count Boundaries
    for (const edge of edges) {
        if (!edge.semanticType) {
            const source = edge.from;
            const target = edge.to;
            if (source.endsWith('.md') || source.endsWith('.txt') || source.toLowerCase().includes('readme') || source.toLowerCase().includes('plan')) {
                edge.semanticType = SemanticEdgeType.DOC;
            } else if (source.includes('.test.') || source.includes('.spec.') || source.includes('/test/') || source.includes('/mock/')) {
                edge.semanticType = SemanticEdgeType.TEST;
            } else if (source.includes('generated') || source.includes('auto-generated')) {
                edge.semanticType = SemanticEdgeType.GENERATED;
            } else if (target.startsWith('ghost://') || target.startsWith('external://') || nodeMap.get(target)?.status === 'ghost') {
                edge.semanticType = SemanticEdgeType.GHOST;
            } else {
                edge.semanticType = SemanticEdgeType.CODE;
            }
        }
    }

    let internalEdges = 0;
    let externalEdges = 0;

    for (const edge of edges) {
        // Core structural analysis only considers CODE and GHOST edges
        if (edge.semanticType === SemanticEdgeType.CODE || edge.semanticType === SemanticEdgeType.GHOST) {
            
            // Calculate global internal/external (Ghost/External targets)
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

            // Calculate node-level Boundary Crossing (Cross-Cluster or Ghost)
            const sourceNode = nodeMap.get(edge.from);
            const targetNode = nodeMap.get(edge.to);
            const sourceCluster = sourceNode?.cluster_id;
            const targetCluster = targetNode?.cluster_id;
            
            const isBoundary = edge.semanticType === SemanticEdgeType.GHOST || !targetCluster || sourceCluster !== targetCluster;
            if (isBoundary) {
                nodeBoundaryMap.set(edge.from, (nodeBoundaryMap.get(edge.from) || 0) + 1);
            }
        }
    }

    // Calculate Percentiles for FanOut
    const arrFanOut: number[] = [];
    for (const d of degreeMap.values()) arrFanOut.push(d.out);
    arrFanOut.sort((a, b) => a - b);
    
    const getPercentile = (sortedArr: number[], val: number) => {
        if (sortedArr.length === 0) return 0;
        let idx = sortedArr.findIndex(v => v >= val);
        if (idx === -1) idx = sortedArr.length;
        // Standard percentile: 95 means top 5%
        return (idx / sortedArr.length) * 100;
    };

    const assemblyAudit: AssemblyAuditEntry[] = [];
    
    // [P0 진단] GraphAnalyzer candidate 추적
    let candidateCount = 0;
    let pushCount = 0;

    // 2. Assign SemanticRole (2-Stage Logic for ASSEMBLY_POINT)
    for (const node of nodes) {
        delete node.semanticRole; // Force re-evaluation for shared node objects (ponytail: deep cloning is overkill)
        if (!node.semanticRole) {
            const filePath = node.filePath || node.id;
            const degree = degreeMap.get(node.id) || { in: 0, out: 0, total: 0 };
            const nodeFanOut = degree.out;
            const boundaryEdges = nodeBoundaryMap.get(node.id) || 0;
            const boundaryRatio = nodeFanOut > 0 ? (boundaryEdges / nodeFanOut) : 0;
            
            node.semanticRole = SemanticRole.CORE_RUNTIME; // Default until proven otherwise
            
            if (/(^|\/)(test|tests|testing|selftests|mock|mocks|fixtures?|spec|specs|__tests__|__mocks__)\//i.test(filePath)) {
                node.semanticRole = SemanticRole.TEST;
            } else if (/(^|\/)(examples?|samples?|demo|demos)\//i.test(filePath)) {
                node.semanticRole = SemanticRole.SAMPLE;
            } else if (/(^|\/)(bench|benchmark|benchmarks|perf)\//i.test(filePath)) {
                node.semanticRole = SemanticRole.BENCHMARK;
            } else if (/(^|\/)(docs?|documentation|man)\//i.test(filePath) || filePath.endsWith('.md') || filePath.endsWith('.txt') || filePath.toLowerCase().includes('readme')) {
                node.semanticRole = SemanticRole.DOCUMENTATION;
            } else if (/(^|\/)(tools?|scripts?|build|kconfig|kbuild)\//i.test(filePath)) {
                node.semanticRole = SemanticRole.TOOLING;
            } else if (filePath.includes('generated') || filePath.endsWith('.pb.go') || filePath.endsWith('lex.yy.c') || filePath.endsWith('y.tab.c')) {
                node.semanticRole = SemanticRole.GENERATED;
            }
            
            // Only process CORE_RUNTIME for assembly points
            if (node.semanticRole === SemanticRole.CORE_RUNTIME) {
                // Stage 1: Heuristic Extraction
                const basename = path.basename(filePath).toLowerCase();
                const isStrongCandidate = /(main|app|bootstrap|startup|program|compositionroot)\.(ts|js|cs|java|go|rs|c|cpp)$/.test(basename);
                const isWeakCandidate = /(server|client|container|dependencyregistrar|services?)\.(ts|js|cs|java|go|rs|c|cpp|h|hpp)$/.test(basename);
                const isAssemblyCandidate = isStrongCandidate || isWeakCandidate;
                
                if (!isAssemblyCandidate && /(main|app|bootstrap|startup|program|compositionroot|server|client|container|dependencyregistrar|services?)/.test(basename)) {
                    console.log(`\n[ASSEMBLY_AUDIT]\n\n${node.filePath || node.id}\n\nREJECTED\nReason=REJECT_EXTENSION_MISMATCH\n\nFanIn=${degree.in}\nFanOut=${degree.out}\nBoundaryRatio=${boundaryRatio.toFixed(2)}`);
                }
                
                // [P0 진단] 후보 판정 상세 상태
                if (basename.match(/(main|app|server|services|client)\./)) {
                    console.log('[ASSEMBLY_CANDIDATE_STATE]', {
                        nodeCount: nodes.length,
                        basename,
                        semanticRole: node.semanticRole,
                        isAssemblyCandidate,
                        isStrongCandidate,
                        isWeakCandidate
                    });
                }
                
                // Stage 2: Structural Verification
                if (isAssemblyCandidate) {
                    candidateCount++;
                    const pFanOut = getPercentile(arrFanOut, nodeFanOut);
                    const reasons: AssemblyAuditReason[] = [];
                    let accepted = false;

                    console.log('[ASSEMBLY_CANDIDATE]', {
                        node: node.label || basename,
                        fanOut: nodeFanOut,
                        boundaryRatio,
                        isStrongCandidate,
                        isWeakCandidate
                    });

                    const isHighFanOut = nodeFanOut > 10 || pFanOut >= 90;
                    const isStrictHighFanOut = nodeFanOut > 20 && pFanOut >= 90;

                    if (isStrongCandidate) {
                        if (!isHighFanOut) reasons.push(AssemblyAuditReason.REJECTED_LOW_FANOUT);
                        if (boundaryRatio <= 0.8) reasons.push(AssemblyAuditReason.REJECTED_LOW_BOUNDARY_RATIO);
                        if (isHighFanOut && boundaryRatio > 0.8) accepted = true;
                    } else if (isWeakCandidate) {
                        if (!isStrictHighFanOut) {
                            if (nodeFanOut <= 50) reasons.push(AssemblyAuditReason.REJECTED_LOW_FANOUT);
                        }
                        if (boundaryRatio <= 0.8) reasons.push(AssemblyAuditReason.REJECTED_LOW_BOUNDARY_RATIO);
                        if (isStrictHighFanOut && boundaryRatio > 0.8) accepted = true;
                    }

                    if (accepted) {
                        if (nodeFanOut > 100) reasons.push(AssemblyAuditReason.ASSEMBLY_HIGH_FANOUT);
                        if (boundaryRatio > 0.9) reasons.push(AssemblyAuditReason.ASSEMBLY_HIGH_BOUNDARY_RATIO);
                    }

                    if (accepted) {
                        reasons.push(AssemblyAuditReason.ACCEPTED);
                        (node as any).isAssemblyPoint = true;
                    } else {
                        (node as any).isAssemblyPoint = false;
                    }

                    assemblyAudit.push({
                        nodeId: node.id,
                        filePath: node.filePath || node.id,
                        accepted,
                        fanOut: nodeFanOut,
                        fanOutPercentile: pFanOut,
                        boundaryRatio: boundaryRatio,
                        reasons
                    });
                    pushCount++;
                    console.log(`\n[ASSEMBLY_AUDIT]\n\n${node.filePath || node.id}\n\n${accepted ? 'ACCEPTED' : 'REJECTED'}\nReason=${reasons.join(', ')}\n\nFanIn=${degree.in}\nFanOut=${degree.out}\nBoundaryRatio=${boundaryRatio.toFixed(2)}`);
                }
            }
        }
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

    const unknownSample: any[] = [];
    for (const edge of edges) {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        const fromCont = fromNode?.data?.continent || 'unknown';
        const toCont = toNode?.data?.continent || 'unknown';

        if (fromCont === 'unknown' && unknownSample.length < 10) {
            unknownSample.push({ id: edge.from, cluster_id: fromNode?.cluster_id, role: fromNode?.role, type: fromNode?.type });
        }
        if (toCont === 'unknown' && unknownSample.length < 10) {
            unknownSample.push({ id: edge.to, cluster_id: toNode?.cluster_id, role: toNode?.role, type: toNode?.type });
        }

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

    // [P0 진단] GraphAnalyzer candidate 추적 결과
    console.log('[GRAPH_ANALYZER_CANDIDATES]', {
        candidateCount,
        pushCount,
        assemblyAuditLength: assemblyAudit.length
    });
    console.error('[COUPLING_UNKNOWN]', { sampleCount: unknownSample.length });
    for (const s of unknownSample) {
        console.error('[COUPLING_UNKNOWN_ITEM]', JSON.stringify(s));
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
        },
        assemblyAudit
    };
}
