import { GraphModel, Node, Edge } from '../../GraphModel';
import { EvidenceType } from '../../reporting/types';

export interface BoundaryNode {
    id: string;
    members: string[]; // 속한 파일들
    internalEdges: number;
    externalEdges: number;
    size: number;      // members.length
    cohesion: number;  // internal / (internal + external)
    strength: string;  // 'Strong' | 'Weak' 등 텍스트 혹은 점수
}

export interface BoundaryEdge {
    from: string;
    to: string;
    dependencyCount: number; // 예: Scene → Core (847)
    weight: number;
}

export interface BoundaryCandidateAudit {
    id: string;
    members: number;
    internalEdges: number;
    externalEdges: number;
    cohesion: number;
    targetConcentration: number;
    result: 'PROMOTED' | 'REJECT_SMALL' | 'REJECT_WEAK' | 'WRAPPER';
    memberFiles?: string[]; // v0.3.34.40: Track actual member files for audit
    depth?: number; // v0.3.34.40: Track candidate depth in prefix tree
}

export interface BoundaryResult {
    nodes: BoundaryNode[];
    edges: BoundaryEdge[];
    splitWrappers?: string[];
    auditLog?: BoundaryCandidateAudit[];
}

export class BoundaryGraphBuilder {
    private static readonly DEFAULT_DENSITY_THRESHOLD = 0.3;
    private static readonly DEFAULT_EXTERNAL_RATIO = 0.2;
    private static readonly MIN_BOUNDARY_MEMBERS = 5;
    private static readonly MIN_INTERNAL_EDGES = 20;

    public build(nodes: Node[], edges: Edge[]): BoundaryResult {
        if (!nodes) nodes = [];
        if (!edges) edges = [];

        // 1. Initial Candidates (Top-level directories)
        interface Candidate {
            id: string;
            members: Node[];
        }
        
        const queue: Candidate[] = [];
        const initialGroups = new Map<string, Node[]>();
        const splitWrappers: string[] = [];
        
        for (const node of nodes) {
            const path = node.filePath || (node.data as any)?.file || node.id;
            if (!path) continue;
            
            const parts = path.split(/[\/\\]/);
            let clusterId = 'unknown';

            if (parts.length > 1) {
                clusterId = parts[0];
            } else {
                clusterId = 'root';
            }

            if (!initialGroups.has(clusterId)) initialGroups.set(clusterId, []);
            initialGroups.get(clusterId)!.push(node);
        }
        
        for (const [id, members] of initialGroups.entries()) {
            queue.push({ id, members });
        }
        
        // v0.3.34.40: Dump initial grouping for audit
        console.log(`[BOUNDARY_DISCOVERY_START] Queued ${queue.length} top-level candidates from ${nodes.length} nodes.`);
        console.log(`[CANDIDATE_GEN_AUDIT] Initial Groups:`);
        for (const [id, members] of initialGroups.entries()) {
            console.log(`  ${id}: ${members.length} nodes`);
        }

        // Edge index for fast lookup
        const edgesBySource = new Map<string, Edge[]>();
        const edgesByTarget = new Map<string, Edge[]>();
        
        for (const edge of edges) {
            if (!edge.from || !edge.to) continue;
            if (!edgesBySource.has(edge.from)) edgesBySource.set(edge.from, []);
            if (!edgesByTarget.has(edge.to)) edgesByTarget.set(edge.to, []);
            edgesBySource.get(edge.from)!.push(edge);
            edgesByTarget.get(edge.to)!.push(edge);
        }

        const boundaryNodes = new Map<string, BoundaryNode>();
        const diag = { processed: 0, promoted: 0, split: 0, rejectedSmall: 0, rejectedWeak: 0 };
        const nodeToBoundary = new Map<string, string>(); // Record successful boundaries
        const nodeToLastCandidate = new Map<string, string>(); // Record deepest checked prefix
        const auditLog: BoundaryCandidateAudit[] = []; // Track all candidates for audit

        // 2. Queue-based Hierarchical Validation and Promotion
        while (queue.length > 0) {
            const candidate = queue.shift()!;
            diag.processed++;
            
            let internalEdges = 0;
            let externalEdges = 0;
            const externalTargets = new Map<string, number>();

            const memberIds = candidate.members.map(n => n.id);
            const memberSet = new Set(memberIds);
            
            for (const id of memberIds) {
                nodeToLastCandidate.set(id, candidate.id);
            }

            const subfolders = new Map<string, string>();
            for (const id of memberIds) {
                let relativePath = id;
                if (id.startsWith(candidate.id + '/')) {
                    relativePath = id.substring(candidate.id.length + 1);
                }
                const parts = relativePath.split(/[\/\\]/);
                subfolders.set(id, parts.length > 1 ? parts[0] : '__root__');
            }

            let crossSubfolderEdges = 0;

            for (const memberId of memberIds) {
                const sourceSubfolder = subfolders.get(memberId);
                const outEdges = edgesBySource.get(memberId) || [];
                for (const outEdge of outEdges) {
                    if (memberSet.has(outEdge.to!)) {
                        internalEdges++;
                        const targetSubfolder = subfolders.get(outEdge.to!);
                        if (sourceSubfolder !== targetSubfolder) {
                            crossSubfolderEdges++;
                        }
                    } else {
                        externalEdges++;
                        const targetParts = outEdge.to!.split(/[\/\\]/);
                        const targetPrefix = targetParts[0] === 'src' && targetParts.length > 1 ? `src/${targetParts[1]}` : targetParts[0];
                        externalTargets.set(targetPrefix, (externalTargets.get(targetPrefix) || 0) + 1);
                    }
                }
            }

            const totalEdges = internalEdges + externalEdges;
            const cohesion = totalEdges > 0 ? internalEdges / totalEdges : 0;
            const submoduleCouplingRatio = internalEdges > 0 ? crossSubfolderEdges / internalEdges : 0;
            
            let maxExternalTargetEdges = 0;
            for (const count of externalTargets.values()) {
                if (count > maxExternalTargetEdges) maxExternalTargetEdges = count;
            }
            const targetConcentration = externalEdges > 0 ? maxExternalTargetEdges / externalEdges : 0;

            let resultStatus = '';

            // Promotion Rules (Semantic Pattern Consistency)
            // 1. High absolute cohesion (Independent module)
            // 2. Moderate cohesion BUT highly focused external communication (Dependent but structured module)
            // 3. Massive Subsystem (High volume of internal interactions indicates a boundary despite fan-out)
            
            // A directory is a wrapper (not a subsystem) if its internal submodules don't talk to each other.
            // If < 20% of internal edges cross subfolders, it's just a bucket of isolated modules.
            const isStructuralWrapper = memberIds.length >= 50 && submoduleCouplingRatio < 0.20;
            const isWrapper = memberIds.length >= (nodes.length * 0.75) || isStructuralWrapper; 
            
            const isMassive = !isWrapper && memberIds.length >= 100 && internalEdges >= 1000;
            const isPromoted = !isWrapper && (cohesion >= 0.45 || (cohesion >= 0.2 && targetConcentration >= 0.5) || isMassive);

            if (isWrapper) {
                resultStatus = 'SPLIT';
                diag.split++;
            } else if (memberIds.length < BoundaryGraphBuilder.MIN_BOUNDARY_MEMBERS || internalEdges < BoundaryGraphBuilder.MIN_INTERNAL_EDGES) {
                resultStatus = 'REJECT_SMALL';
                diag.rejectedSmall++;
            } else if (isPromoted) {
                resultStatus = 'PROMOTED';
            } else {
                resultStatus = 'SPLIT';
            }

            // Record audit entry for this candidate
            let auditResult: BoundaryCandidateAudit['result'];
            if (resultStatus === 'PROMOTED') {
                auditResult = 'PROMOTED';
            } else if (resultStatus === 'REJECT_SMALL') {
                auditResult = 'REJECT_SMALL';
            } else if (isWrapper) {
                auditResult = 'WRAPPER';
            } else {
                auditResult = 'REJECT_WEAK';
            }
            auditLog.push({
                id: candidate.id,
                members: memberIds.length,
                internalEdges,
                externalEdges,
                cohesion: parseFloat(cohesion.toFixed(3)),
                targetConcentration: parseFloat(targetConcentration.toFixed(3)),
                result: auditResult,
                memberFiles: memberIds.slice(0, 20), // v0.3.34.40: Track first 20 member files for audit
                depth: candidate.id.split('/').length // v0.3.34.40: Track depth in prefix tree
            });

            // v0.3.34.40: Dump candidate details for audit
            console.log(`[CANDIDATE_GEN_AUDIT] ${candidate.id}: members=${memberIds.length}, depth=${candidate.id.split('/').length}, result=${auditResult}`);
            if (memberIds.length <= 20) {
                console.log(`  Files: ${memberIds.join(', ')}`);
            } else {
                console.log(`  Files (first 20): ${memberIds.slice(0, 20).join(', ')}...`);
            }

            // Dump SUBMODULE_ANALYSIS for large candidates to help tune heuristics
            if (memberIds.length > 500) {
                const subfolderCounts = new Map<string, number>();
                for (const sub of subfolders.values()) {
                    subfolderCounts.set(sub, (subfolderCounts.get(sub) || 0) + 1);
                }
                const sortedSubfolders = Array.from(subfolderCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(e => `${e[0]}(${e[1]})`);
                
                console.log(`[SUBMODULE_ANALYSIS] ` + JSON.stringify({
                    id: candidate.id,
                    subfolders: sortedSubfolders,
                    internalEdges,
                    crossSubfolderEdges,
                    submoduleCouplingRatio: parseFloat(submoduleCouplingRatio.toFixed(3)),
                    result: resultStatus
                }));
            }

            console.log(JSON.stringify({
                event: 'BOUNDARY_CANDIDATE',
                id: candidate.id,
                members: memberIds.length,
                internalEdges,
                externalEdges,
                cohesion: parseFloat(cohesion.toFixed(3)),
                concentration: parseFloat(targetConcentration.toFixed(3)),
                result: resultStatus
            }));

            if (resultStatus === 'PROMOTED') {
                const sizeFactor = Math.min(1, Math.log10(internalEdges + 1) / 3);
                const strengthVal = cohesion * sizeFactor;
                let strengthText = 'Weak';
                if (isMassive || strengthVal >= 0.8) strengthText = 'Strong';
                else if (strengthVal >= 0.5) strengthText = 'Moderate';

                boundaryNodes.set(candidate.id, {
                    id: candidate.id,
                    members: memberIds,
                    internalEdges,
                    externalEdges,
                    size: memberIds.length,
                    cohesion,
                    strength: strengthText
                });
                for (const id of memberIds) nodeToBoundary.set(id, candidate.id);
                diag.promoted++;
            } else if (resultStatus === 'SPLIT') {
                // Attempt to split into sub-directories
                splitWrappers.push(candidate.id);
                const subGroups = new Map<string, Node[]>();
                const prefixParts = candidate.id.split(/[\/\\]/);
                
                for (const node of candidate.members) {
                    const path = node.filePath || (node.data as any)?.file || node.id;
                    let nextPrefix = path;
                    const parts = path.split(/[\/\\]/);
                    
                    if (parts.length > prefixParts.length) {
                        nextPrefix = parts.slice(0, prefixParts.length + 1).join('/');
                    }
                    
                    if (!subGroups.has(nextPrefix)) subGroups.set(nextPrefix, []);
                    subGroups.get(nextPrefix)!.push(node);
                }

                if (subGroups.size > 1) {
                    diag.split++;
                    for (const [nextId, subMembers] of subGroups.entries()) {
                        queue.push({ id: nextId, members: subMembers });
                    }
                } else {
                    diag.rejectedWeak++;
                }
            }
        }

        console.log(`[BOUNDARY_DIAG] ${JSON.stringify(diag)}`);

        // 3. Create Boundary Graph Edges
        const boundaryEdgesMap = new Map<string, BoundaryEdge>();
        
        for (const edge of edges) {
            if (!edge.from || !edge.to) continue;
            
            let sourceCluster = nodeToBoundary.get(edge.from);
            let targetCluster = nodeToBoundary.get(edge.to);
            
            // If one of the endpoints is a promoted boundary but the other isn't, 
            // we still want to track where the edge goes!
            if (!sourceCluster && nodeToLastCandidate.has(edge.from)) {
                sourceCluster = nodeToLastCandidate.get(edge.from)! + ' (Unpromoted)';
            }
            if (!targetCluster && nodeToLastCandidate.has(edge.to)) {
                targetCluster = nodeToLastCandidate.get(edge.to)! + ' (Unpromoted)';
            }
            
            // Record edge only if at least one endpoint is a PROMOTED boundary, 
            // or if we want to see everything, just record it as long as they differ.
            // Semantic Boundary Graph should focus on paths touching at least one Boundary.
            const hasPromotedBoundary = nodeToBoundary.has(edge.from) || nodeToBoundary.has(edge.to);
            
            if (hasPromotedBoundary && sourceCluster && targetCluster && sourceCluster !== targetCluster) {
                const edgeKey = `${sourceCluster}->${targetCluster}`;
                if (!boundaryEdgesMap.has(edgeKey)) {
                    boundaryEdgesMap.set(edgeKey, {
                        from: sourceCluster,
                        to: targetCluster,
                        dependencyCount: 0,
                        weight: 0
                    });
                }
                const bEdge = boundaryEdgesMap.get(edgeKey)!;
                bEdge.dependencyCount++;
                bEdge.weight += (edge.weight || 1.0);
            }
        }

        return {
            nodes: Array.from(boundaryNodes.values()),
            edges: Array.from(boundaryEdgesMap.values()),
            splitWrappers,
            auditLog
        };
    }
}
