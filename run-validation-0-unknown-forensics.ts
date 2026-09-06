import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = process.argv[2] || './synapse_data/project_state.json';
const OUT_DIR = './synapse_report/ecology';

function ensureDir() {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

interface RawNode { id: string; path: string; isNoise: boolean; }
interface RawEdge { source: string; target: string; provenance: string; }

function isNoise(p: string): boolean {
    if (!p) return true;
    const lower = p.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.json') || lower.endsWith('.css')) return true;
    if (lower.includes('/test/') || lower.includes('/tests/')) return true;
    if (lower.includes('/build/')) return true;
    return false;
}

// TAXONOMY
const I0 = new Set(['UNKNOWN_RUNTIME']);
const I1 = new Set(['FUNCTION_CALL', 'CONSTRUCTOR_CALL']);
const I2 = new Set(['DYNAMIC_IMPORT']);
const I3 = new Set(['FRAMEWORK_REGISTRATION']);
const I4 = new Set(['INHERITANCE', 'TYPE_ONLY']);
const I5 = new Set(['DECORATOR']);

// Cumulative Profiles
const C1 = new Set([...I1]);
const C2 = new Set([...C1, ...I2]);
const C3 = new Set([...C2, ...I3]);
const C4 = new Set([...C3, ...I4]);
const C5 = new Set([...C4, ...I5]); // Base for ALL except UNKNOWN

// Contribution Analysis (Base Without)
const BASE = new Set([...C5, ...I0]); // Full Graph
const W0 = new Set([...BASE].filter(x => !I0.has(x)));
const W1 = new Set([...BASE].filter(x => !I1.has(x)));
const W2 = new Set([...BASE].filter(x => !I2.has(x)));
const W3 = new Set([...BASE].filter(x => !I3.has(x)));
const W4 = new Set([...BASE].filter(x => !I4.has(x)));
const W5 = new Set([...BASE].filter(x => !I5.has(x)));

function loadGraphs() {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    let allNodes: any[] = [];
    if (data.clusters) {
        for (const c of data.clusters) if (c.nodes) allNodes.push(...c.nodes);
    }
    if (data.nodes) allNodes.push(...data.nodes);
    
    let allEdges = data.edges || [];
    
    const validNodes = new Map<string, RawNode>();
    for (const n of allNodes) {
        const p = n.filePath || n.id;
        validNodes.set(n.id, { id: n.id, path: p, isNoise: isNoise(p) });
    }

    const validEdges: RawEdge[] = [];
    for (const e of allEdges) {
        const source = e.source || e.from;
        const target = e.target || e.to;
        if (validNodes.has(source) && validNodes.has(target)) {
            validEdges.push({ source, target, provenance: e.provenance || 'UNKNOWN_RUNTIME' });
        }
    }
    return { nodes: validNodes, edges: validEdges };
}

function findSCCs(nodes: Map<string, RawNode>, edges: RawEdge[]) {
    let index = 0;
    const stack: string[] = [];
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();
    const onStack = new Set<string>();
    const sccs: string[][] = [];

    const graph = new Map<string, string[]>();
    for (const e of edges) {
        if (!graph.has(e.source)) graph.set(e.source, []);
        graph.get(e.source)!.push(e.target);
    }

    function strongconnect(v: string) {
        indices.set(v, index);
        lowlink.set(v, index);
        index++;
        stack.push(v);
        onStack.add(v);

        const neighbors = graph.get(v) || [];
        for (const w of neighbors) {
            if (!indices.has(w)) {
                strongconnect(w);
                lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
            } else if (onStack.has(w)) {
                lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
            }
        }

        if (lowlink.get(v) === indices.get(v)) {
            const scc: string[] = [];
            let w: string;
            do {
                w = stack.pop()!;
                onStack.delete(w);
                scc.push(w);
            } while (w !== v);
            sccs.push(scc);
        }
    }

    for (const id of nodes.keys()) {
        if (!indices.has(id)) strongconnect(id);
    }
    return sccs.filter(scc => scc.length > 1).sort((a,b) => b.length - a.length);
}

function computeMetrics(nodes: Map<string, RawNode>, edges: RawEdge[]) {
    const sccs = findSCCs(nodes, edges);
    const largestSccSize = sccs.length > 0 ? sccs[0].length : 0;
    const totalSccCount = sccs.length;
    let top10SccSum = 0;
    let nodesInScc = 0;
    
    for (let i=0; i<sccs.length; i++) {
        nodesInScc += sccs[i].length;
        if (i < 10) top10SccSum += sccs[i].length;
    }

    const totalNodes = Array.from(nodes.values()).filter(n => !n.isNoise).length;
    const sccOccupancy = totalNodes > 0 ? (nodesInScc / totalNodes) : 0;

    return {
        edgeCount: edges.length,
        largestSccSize,
        top10SccSum,
        totalSccCount,
        nodesInScc,
        sccOccupancy
    };
}

// ---------------- Heuristic Reclassification ----------------
const ABSOLUTE_VSCODE_ROOT = process.argv[3] || process.cwd();
function getAbsPath(relPath: string) {
    if (relPath.startsWith('/')) return relPath;
    return path.join(ABSOLUTE_VSCODE_ROOT, relPath);
}

function reclassifyEdge(e: RawEdge, nodes: Map<string, RawNode>): { reclassified: string, confidence: number, reason: string } {
    const sourceNode = nodes.get(e.source);
    if (!sourceNode) return { reclassified: 'UNKNOWN_RUNTIME', confidence: 0, reason: 'Source node missing' };
    
    try {
        const absPath = getAbsPath(sourceNode.path);
        if (!fs.existsSync(absPath)) return { reclassified: 'UNKNOWN_RUNTIME', confidence: 0.1, reason: 'File not found' };
        
        const content = fs.readFileSync(absPath, 'utf8');
        const targetName = path.basename(e.target).replace(/\.ts$/, '').replace(/\.js$/, '');
        
        // Very basic heuristics
        const importTypeRegex = new RegExp(`import\\s+type\\s+.*${targetName}`);
        if (importTypeRegex.test(content)) {
            return { reclassified: 'TYPE_ONLY', confidence: 0.85, reason: 'import type observed' };
        }
        
        if (content.includes(`new ${targetName}(`)) {
            return { reclassified: 'CONSTRUCTOR_CALL', confidence: 0.9, reason: 'new Object() instantiation' };
        }
        
        if (content.includes(`class `) && content.includes(`extends ${targetName}`)) {
            return { reclassified: 'INHERITANCE', confidence: 0.9, reason: 'extends clause' };
        }
        
        if (content.includes(`class `) && content.includes(`implements ${targetName}`)) {
            return { reclassified: 'INHERITANCE', confidence: 0.9, reason: 'implements clause' };
        }

        if (content.includes(`@${targetName}`)) {
            return { reclassified: 'DECORATOR', confidence: 0.9, reason: 'decorator usage' };
        }

        if (content.includes(`register`) && content.includes(targetName)) {
            return { reclassified: 'FRAMEWORK_REGISTRATION', confidence: 0.7, reason: 'register call' };
        }

        if (content.includes(`${targetName}(`)) {
            return { reclassified: 'FUNCTION_CALL', confidence: 0.6, reason: 'Function call suspected' };
        }

        // If it's a generic import
        if (content.includes(`import `) && content.includes(targetName)) {
            // Assume structure if it's heavily TS interface driven, but let's give low confidence structure
            return { reclassified: 'TYPE_ONLY', confidence: 0.4, reason: 'generic import, likely type in TS' };
        }

        return { reclassified: 'UNKNOWN_RUNTIME', confidence: 0.1, reason: 'No clear pattern matched' };
    } catch (err) {
        return { reclassified: 'UNKNOWN_RUNTIME', confidence: 0, reason: 'Error reading file' };
    }
}

function main() {
    ensureDir();
    console.log("Loading graphs...");
    const { nodes, edges } = loadGraphs();
    
    // Extract UNKNOWN edges
    const unknownEdges = edges.filter(e => I0.has(e.provenance));
    console.log(`Found ${unknownEdges.length} UNKNOWN_RUNTIME edges.`);

    // --- Bucket A: Frequency ---
    const pairCount = new Map<string, number>();
    for (const e of unknownEdges) {
        const k = `${e.source}|${e.target}`;
        pairCount.set(k, (pairCount.get(k) || 0) + 1);
    }
    const bucketA_pairs = Array.from(pairCount.entries()).sort((a,b) => b[1] - a[1]).slice(0, 100);
    const bucketA = unknownEdges.filter(e => bucketA_pairs.some(p => p[0] === `${e.source}|${e.target}`)).slice(0, 100);

    // --- Bucket B: SCC Core ---
    const baseSccs = findSCCs(nodes, edges);
    const largestSccNodes = new Set(baseSccs[0] || []);
    const bucketB = unknownEdges.filter(e => largestSccNodes.has(e.source) && largestSccNodes.has(e.target)).slice(0, 100);

    // --- Bucket C: Hub Connection ---
    // (Skipping deep Hub calc for speed, using in-degree as proxy)
    const inDegree = new Map<string, number>();
    for (const e of edges) inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    const sortedHubs = Array.from(inDegree.entries()).sort((a,b) => b[1] - a[1]).slice(0, 50).map(x => x[0]);
    const hubSet = new Set(sortedHubs);
    const bucketC = unknownEdges.filter(e => hubSet.has(e.target) || hubSet.has(e.source)).slice(0, 100);

    // Combine and deduplicate sample
    const sampleSet = new Map<string, RawEdge>();
    for (const e of [...bucketA, ...bucketB, ...bucketC]) {
        sampleSet.set(`${e.source}|${e.target}`, e);
    }
    
    console.log(`Analyzing ${sampleSet.size} sampled UNKNOWN edges...`);
    
    const reclassificationResults: any[] = [];
    const reclassStats: Record<string, number> = {
        CALL: 0, CONTROL: 0, REGISTRATION: 0, STRUCTURE: 0, METADATA: 0, UNKNOWN: 0
    };

    let successCount = 0;

    for (const e of sampleSet.values()) {
        const res = reclassifyEdge(e, nodes);
        
        // Map to Layer
        let layer = 'UNKNOWN';
        if (I1.has(res.reclassified)) layer = 'CALL';
        else if (I2.has(res.reclassified)) layer = 'CONTROL';
        else if (I3.has(res.reclassified)) layer = 'REGISTRATION';
        else if (I4.has(res.reclassified)) layer = 'STRUCTURE';
        else if (I5.has(res.reclassified)) layer = 'METADATA';

        if (layer !== 'UNKNOWN' && res.confidence > 0.5) {
            successCount++;
            reclassStats[layer]++;
        } else {
            reclassStats['UNKNOWN']++;
        }

        reclassificationResults.push({
            edgeId: `${e.source}->${e.target}`,
            current: 'UNKNOWN_RUNTIME',
            reclassified: res.reclassified,
            layer: layer,
            confidence: res.confidence,
            reason: res.reason
        });
    }

    const coverageConfidence = successCount / sampleSet.size;
    console.log(`Coverage Confidence: ${(coverageConfidence * 100).toFixed(1)}%`);

    fs.writeFileSync(path.join(OUT_DIR, 'unknown_reclassification.json'), JSON.stringify({
        coverageConfidence,
        stats: reclassStats,
        samples: reclassificationResults
    }, null, 2));

    // --- PROJECTION FOR IMPACT MATRIX V2 ---
    // We will apply these ratios to the ALL unknown edges to create V2 graphs
    console.log("Projecting ratios to full dataset and generating v2 metrics...");
    
    const projectedEdges = edges.map(e => {
        if (e.provenance !== 'UNKNOWN_RUNTIME') return e;
        // Fast projection based on ratios, for v2 impact matrix, we actually need discrete edges.
        // But for exact metrics, let's just probabilistically reassign them.
        const rand = Math.random();
        const tot = successCount || 1; // avoid div by 0
        const pCall = reclassStats['CALL'] / tot;
        const pControl = reclassStats['CONTROL'] / tot;
        const pReg = reclassStats['REGISTRATION'] / tot;
        const pStruct = reclassStats['STRUCTURE'] / tot;
        const pMeta = reclassStats['METADATA'] / tot;
        
        let cumulative = 0;
        cumulative += pCall; if (rand <= cumulative) return { ...e, provenance: 'FUNCTION_CALL' };
        cumulative += pControl; if (rand <= cumulative) return { ...e, provenance: 'DYNAMIC_IMPORT' };
        cumulative += pReg; if (rand <= cumulative) return { ...e, provenance: 'FRAMEWORK_REGISTRATION' };
        cumulative += pStruct; if (rand <= cumulative) return { ...e, provenance: 'TYPE_ONLY' };
        cumulative += pMeta; if (rand <= cumulative) return { ...e, provenance: 'DECORATOR' };
        return e;
    });

    // Recalculate V2
    const getProfileEdgesV2 = (filterSet: Set<string>) => projectedEdges.filter(e => filterSet.has(e.provenance));
    
    // C1 to C5
    const C1_edges = getProfileEdgesV2(C1);
    const C2_edges = getProfileEdgesV2(C2);
    const C3_edges = getProfileEdgesV2(C3);
    const C4_edges = getProfileEdgesV2(C4);
    const C5_edges = getProfileEdgesV2(C5);
    const BASE_edges = getProfileEdgesV2(BASE);

    const collapseCurveV2 = {
        C1: computeMetrics(nodes, C1_edges),
        C2: computeMetrics(nodes, C2_edges),
        C3: computeMetrics(nodes, C3_edges),
        C4: computeMetrics(nodes, C4_edges),
        C5: computeMetrics(nodes, C5_edges),
        BASE: computeMetrics(nodes, BASE_edges)
    };
    fs.writeFileSync(path.join(OUT_DIR, 'collapse_curve_v2.json'), JSON.stringify(collapseCurveV2, null, 2));

    // Impact Matrix V2
    const W1_edges = getProfileEdgesV2(W1);
    const W2_edges = getProfileEdgesV2(W2);
    const W3_edges = getProfileEdgesV2(W3);
    const W4_edges = getProfileEdgesV2(W4);
    const W5_edges = getProfileEdgesV2(W5);
    const W0_edges = getProfileEdgesV2(W0); // Should be very few Unknown left

    const calcContribution = (baseVal: number, withoutVal: number) => baseVal > 0 ? (baseVal - withoutVal) / baseVal : 0;
    const baseMetricsV2 = collapseCurveV2.BASE;

    const impactMatrixV2 = {
        I1_CALL: {
            largestSccContribution: calcContribution(baseMetricsV2.largestSccSize, computeMetrics(nodes, W1_edges).largestSccSize),
        },
        I2_CONTROL: {
            largestSccContribution: calcContribution(baseMetricsV2.largestSccSize, computeMetrics(nodes, W2_edges).largestSccSize),
        },
        I3_REGISTRATION: {
            largestSccContribution: calcContribution(baseMetricsV2.largestSccSize, computeMetrics(nodes, W3_edges).largestSccSize),
        },
        I4_STRUCTURE: {
            largestSccContribution: calcContribution(baseMetricsV2.largestSccSize, computeMetrics(nodes, W4_edges).largestSccSize),
        },
        I5_METADATA: {
            largestSccContribution: calcContribution(baseMetricsV2.largestSccSize, computeMetrics(nodes, W5_edges).largestSccSize),
        },
        I0_UNKNOWN_REMAINING: {
            largestSccContribution: calcContribution(baseMetricsV2.largestSccSize, computeMetrics(nodes, W0_edges).largestSccSize),
        }
    };
    
    fs.writeFileSync(path.join(OUT_DIR, 'impact_matrix_v2.json'), JSON.stringify(impactMatrixV2, null, 2));
    console.log("V2 Generation Complete.");
}

main();
