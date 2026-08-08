import * as path from 'path';
import { detectCommunities } from '../core/CommunityDetector';

import { GraphSnapshot } from '../core/validation/ValidationContext';

interface Node { id?: string; name?: string; type?: string; label?: string; filePath?: string; }
interface Edge { source: any; target: any; type?: string; weight?: number; }

function normalizeEndpoint(raw: any, workspaceRoot: string): string {
    if (typeof raw !== 'string') return '';
    const normalized = raw.replace(/\\/g, '/').trim();
    if (!normalized) return '';

    // Keep explicit external references as-is for diagnostics.
    if (normalized.startsWith('external://')) {
        return normalized;
    }

    const rootNormalized = workspaceRoot.replace(/\\/g, '/');
    if (rootNormalized && normalized.startsWith(rootNormalized + '/')) {
        return normalized.slice(rootNormalized.length + 1);
    }

    return normalized.replace(/^\.?\//, '').replace(/^\/+/, '');
}

function resolveEndpoint(raw: any, nodeIds: Set<string>, workspaceRoot: string): string {
    if (typeof raw === 'object' && raw) {
        const objectId = raw.id || raw.name || raw.label;
        if (typeof objectId === 'string' && nodeIds.has(objectId)) return objectId;
        const normalizedObjectId = normalizeEndpoint(objectId, workspaceRoot);
        if (nodeIds.has(normalizedObjectId)) return normalizedObjectId;
    }

    if (typeof raw !== 'string') return '';
    if (nodeIds.has(raw)) return raw;

    const normalized = normalizeEndpoint(raw, workspaceRoot);
    if (nodeIds.has(normalized)) return normalized;

    return raw;
}

export function runAudit(snapshot: Readonly<GraphSnapshot>, workspaceRoot: string) {
    console.log(`\n=== 🔬 SYNAPSE Community Edge Audit ===`);

    const nodes: Node[] = (snapshot.nodes as Node[]) || [];
    const edges: Edge[] = (snapshot.edges as Edge[]) || [];

    const nodeIds = new Set(nodes.map(n => n.id || n.name || '').filter(id => id !== ''));
    console.log(`[Audit] Total Nodes: ${nodeIds.size}`);
    console.log(`[Audit] Total Edges: ${edges.length}`);

    // Edge Structure Check
    if (edges.length > 0) {
        console.log(`[Audit] Sample Edge Object:`, edges[0]);
    }

    console.log(`\n[Audit] Sample Node IDs:`, nodes.slice(0, 20).map(n => n.id));
    console.log(`[Audit] Sample Edge Endpoints:`, edges.slice(0, 20).map(e => ({
        from: (e as any).from,
        to: (e as any).to,
        source: e.source,
        target: e.target
    })));

    // Edge Integrity Check
    let validEdges = 0;
    let normalizedEdges = 0;
    let missingSource = 0;
    let missingTarget = 0;
    const unresolvedSamples: Array<{ from: any; to: any; normalizedFrom: string; normalizedTo: string; sourceValid: boolean; targetValid: boolean; }> = [];

    const degreeMap = new Map<string, number>();
    for (const n of nodeIds) degreeMap.set(n, 0);

    for (const e of edges) {
        const sRaw = e.source !== undefined ? e.source : (e as any).from;
        const tRaw = e.target !== undefined ? e.target : (e as any).to;
        const sResolved = resolveEndpoint(sRaw, nodeIds, workspaceRoot);
        const tResolved = resolveEndpoint(tRaw, nodeIds, workspaceRoot);
        const sRawId = typeof sRaw === 'object' && sRaw ? (sRaw.id || sRaw.name || sRaw.label) : sRaw;
        const tRawId = typeof tRaw === 'object' && tRaw ? (tRaw.id || tRaw.name || tRaw.label) : tRaw;
        
        let valid = true;
        const sourceValid = nodeIds.has(sResolved as string);
        const targetValid = nodeIds.has(tResolved as string);

        if (!sourceValid) { missingSource++; valid = false; }
        if (!targetValid) { missingTarget++; valid = false; }

        if (valid && (sResolved !== sRawId || tResolved !== tRawId)) {
            normalizedEdges++;
        }
        
        if (valid) {
            validEdges++;
            degreeMap.set(sResolved, (degreeMap.get(sResolved) || 0) + 1);
            degreeMap.set(tResolved, (degreeMap.get(tResolved) || 0) + 1);
        } else if (unresolvedSamples.length < 10) {
            unresolvedSamples.push({
                from: sRawId,
                to: tRawId,
                normalizedFrom: normalizeEndpoint(sRawId, workspaceRoot),
                normalizedTo: normalizeEndpoint(tRawId, workspaceRoot),
                sourceValid,
                targetValid
            });
        }
    }

    console.log(`\n[Edge Integrity]`);
    console.log(`  Valid Edges (Both endpoints match nodes): ${validEdges}`);
    console.log(`  Valid via Normalization: ${normalizedEdges}`);
    console.log(`  Missing Source count: ${missingSource}`);
    console.log(`  Missing Target count: ${missingTarget}`);
    
    let totalDegreeSum = 0;
    for (const d of degreeMap.values()) totalDegreeSum += d;
    console.log(`  Total Valid Degree Sum: ${totalDegreeSum}`);

    if (unresolvedSamples.length > 0) {
        console.log(`  Unresolved Endpoint Samples (Top ${unresolvedSamples.length}):`, unresolvedSamples);
    }

    console.log(`\n[2] Running Louvain Community Detection...`);
    const result = detectCommunities(nodes as any, edges as any);
    
    const communityNodes = new Map<string, string[]>();
    for (const [nodeId, commId] of result.nodeCommunityMap.entries()) {
        if (!communityNodes.has(commId)) communityNodes.set(commId, []);
        communityNodes.get(commId)!.push(nodeId);
    }

    const internalEdges = new Map<string, number>();
    const externalEdges = new Map<string, number>();
    
    for (const e of edges) {
        const sRaw = e.source !== undefined ? e.source : (e as any).from;
        const tRaw = e.target !== undefined ? e.target : (e as any).to;
        const s = resolveEndpoint(sRaw, nodeIds, workspaceRoot);
        const t = resolveEndpoint(tRaw, nodeIds, workspaceRoot);
        
        const commS = result.nodeCommunityMap.get(s);
        const commT = result.nodeCommunityMap.get(t);
        
        if (commS && commT) {
            if (commS === commT) {
                internalEdges.set(commS, (internalEdges.get(commS) || 0) + 1);
            } else {
                externalEdges.set(commS, (externalEdges.get(commS) || 0) + 1);
                externalEdges.set(commT, (externalEdges.get(commT) || 0) + 1);
            }
        }
    }

    console.log(`\n[3] Community Edge Report (Top 10)`);
    const sortedComms = Array.from(communityNodes.entries()).sort((a, b) => b[1].length - a[1].length);
    
    for (let i = 0; i < Math.min(10, sortedComms.length); i++) {
        const [commId, members] = sortedComms[i];
        let sumDegree = 0;
        for (const n of members) sumDegree += degreeMap.get(n) || 0;

        const internal = internalEdges.get(commId) || 0;
        const external = externalEdges.get(commId) || 0;

        console.log(`=== ${commId} ===`);
        console.log(`  Nodes: ${members.length}`);
        console.log(`  Internal Edges: ${internal}`);
        console.log(`  External Edges: ${external}`);
        console.log(`  Degree Sum (Valid): ${sumDegree}`);
    }

    console.log(`\n[4] Eigenvector Collapse Check`);
    let ev = new Map<string, number>();
    for (const n of nodeIds) ev.set(n, 1.0);
    const adj = new Map<string, string[]>();
    for (const e of edges) {
        const sRaw = e.source !== undefined ? e.source : (e as any).from;
        const tRaw = e.target !== undefined ? e.target : (e as any).to;
        const s = resolveEndpoint(sRaw, nodeIds, workspaceRoot);
        const t = resolveEndpoint(tRaw, nodeIds, workspaceRoot);
        if (!adj.has(s)) adj.set(s, []);
        if (!adj.has(t)) adj.set(t, []);
        adj.get(s)!.push(t);
        adj.get(t)!.push(s);
    }
    for (let i = 0; i < 20; i++) {
        const nextEv = new Map<string, number>();
        let norm = 0;
        for (const n of nodeIds) {
            let sum = 0;
            const neighbors = adj.get(n) || [];
            for (const neighbor of neighbors) {
                sum += ev.get(neighbor) || 0;
            }
            nextEv.set(n, sum);
            norm += sum * sum;
        }
        norm = Math.sqrt(norm) || 1;
        for (const n of nodeIds) ev.set(n, nextEv.get(n)! / norm);
    }
    
    const evValues = Array.from(ev.values());
    console.log(`  Max EV: ${Math.max(...evValues)}`);
    console.log(`  Min EV: ${Math.min(...evValues)}`);
    console.log(`  Non-zero EVs (>1e-10): ${evValues.filter(v => v > 1e-10).length} / ${evValues.length}`);
}

if (require.main === module) {
    const defaultPath = path.join(__dirname, '../../data/project_state.json');
    const targetPath = process.argv[2] || defaultPath;
    const fs = require('fs');
    if (fs.existsSync(targetPath)) {
        const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        const snapshot: GraphSnapshot = {
            nodes: data.nodes || (data.graph && data.graph.nodes) || [],
            edges: data.edges || (data.graph && data.graph.edges) || [],
            clusters: data.clusters || []
        };
        const workspaceRoot = path.resolve(path.dirname(targetPath), '..');
        runAudit(snapshot, workspaceRoot);
    } else {
        console.error(`File not found: ${targetPath}`);
    }
}
