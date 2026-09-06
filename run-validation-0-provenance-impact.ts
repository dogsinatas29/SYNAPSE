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
            validEdges.push({ source, target, provenance: e.provenance || 'UNKNOWN' });
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

function main() {
    ensureDir();
    console.log("Loading graphs...");
    const { nodes, edges } = loadGraphs();
    
    // Total Runtime Nodes
    const runtimeNodes = Array.from(nodes.values()).filter(n => !n.isNoise).length;
    console.log(`Nodes: ${runtimeNodes}, Total Edges: ${edges.length}`);

    // --- Validation-0A: Taxonomy Audit ---
    const taxonomyCounts: Record<string, number> = { I0:0, I1:0, I2:0, I3:0, I4:0, I5:0, OTHER:0 };
    for (const e of edges) {
        if (I0.has(e.provenance)) taxonomyCounts.I0++;
        else if (I1.has(e.provenance)) taxonomyCounts.I1++;
        else if (I2.has(e.provenance)) taxonomyCounts.I2++;
        else if (I3.has(e.provenance)) taxonomyCounts.I3++;
        else if (I4.has(e.provenance)) taxonomyCounts.I4++;
        else if (I5.has(e.provenance)) taxonomyCounts.I5++;
        else taxonomyCounts.OTHER++;
    }

    const knownEdges = edges.length - taxonomyCounts.I0;
    const coverageRatio = edges.length > 0 ? knownEdges / edges.length : 0;

    const taxonomyResult = {
        totalEdges: edges.length,
        knownProvenanceEdges: knownEdges,
        unknownRuntimeEdges: taxonomyCounts.I0,
        coverageRatio: coverageRatio,
        distribution: taxonomyCounts
    };
    fs.writeFileSync(path.join(OUT_DIR, 'validation_0a_taxonomy.json'), JSON.stringify(taxonomyResult, null, 2));
    console.log("Validation-0A Taxonomy saved.");

    // --- Validation-0B: SCC Collapse Curve ---
    const getProfileEdges = (filterSet: Set<string>) => edges.filter(e => filterSet.has(e.provenance));
    
    const collapseCurveResult = {
        C1: computeMetrics(nodes, getProfileEdges(C1)),
        C2: computeMetrics(nodes, getProfileEdges(C2)),
        C3: computeMetrics(nodes, getProfileEdges(C3)),
        C4: computeMetrics(nodes, getProfileEdges(C4)),
        C5: computeMetrics(nodes, getProfileEdges(C5)),
        BASE: computeMetrics(nodes, getProfileEdges(BASE))
    };
    fs.writeFileSync(path.join(OUT_DIR, 'validation_0b_collapse_curve.json'), JSON.stringify(collapseCurveResult, null, 2));
    console.log("Validation-0B Collapse Curve saved.");

    // --- Validation-0C: Provenance Impact Matrix ---
    const independentProfiles = {
        I0: computeMetrics(nodes, getProfileEdges(I0)),
        I1: computeMetrics(nodes, getProfileEdges(I1)),
        I2: computeMetrics(nodes, getProfileEdges(I2)),
        I3: computeMetrics(nodes, getProfileEdges(I3)),
        I4: computeMetrics(nodes, getProfileEdges(I4)),
        I5: computeMetrics(nodes, getProfileEdges(I5))
    };

    const withoutProfiles = {
        W0: computeMetrics(nodes, getProfileEdges(W0)),
        W1: computeMetrics(nodes, getProfileEdges(W1)),
        W2: computeMetrics(nodes, getProfileEdges(W2)),
        W3: computeMetrics(nodes, getProfileEdges(W3)),
        W4: computeMetrics(nodes, getProfileEdges(W4)),
        W5: computeMetrics(nodes, getProfileEdges(W5))
    };

    const baseMetrics = collapseCurveResult.BASE;

    // Contribution Ratio = (Base - Without) / Base
    const calcContribution = (baseVal: number, withoutVal: number) => {
        return baseVal > 0 ? (baseVal - withoutVal) / baseVal : 0;
    };

    const impactMatrix = {
        I0_UNKNOWN: {
            edgePercentage: taxonomyCounts.I0 / edges.length,
            largestSccContribution: calcContribution(baseMetrics.largestSccSize, withoutProfiles.W0.largestSccSize),
            sccCountContribution: calcContribution(baseMetrics.totalSccCount, withoutProfiles.W0.totalSccCount),
            nodesInSccContribution: calcContribution(baseMetrics.nodesInScc, withoutProfiles.W0.nodesInScc)
        },
        I1_CALL: {
            edgePercentage: taxonomyCounts.I1 / edges.length,
            largestSccContribution: calcContribution(baseMetrics.largestSccSize, withoutProfiles.W1.largestSccSize),
            sccCountContribution: calcContribution(baseMetrics.totalSccCount, withoutProfiles.W1.totalSccCount),
            nodesInSccContribution: calcContribution(baseMetrics.nodesInScc, withoutProfiles.W1.nodesInScc)
        },
        I2_CONTROL: {
            edgePercentage: taxonomyCounts.I2 / edges.length,
            largestSccContribution: calcContribution(baseMetrics.largestSccSize, withoutProfiles.W2.largestSccSize),
            sccCountContribution: calcContribution(baseMetrics.totalSccCount, withoutProfiles.W2.totalSccCount),
            nodesInSccContribution: calcContribution(baseMetrics.nodesInScc, withoutProfiles.W2.nodesInScc)
        },
        I3_REGISTRATION: {
            edgePercentage: taxonomyCounts.I3 / edges.length,
            largestSccContribution: calcContribution(baseMetrics.largestSccSize, withoutProfiles.W3.largestSccSize),
            sccCountContribution: calcContribution(baseMetrics.totalSccCount, withoutProfiles.W3.totalSccCount),
            nodesInSccContribution: calcContribution(baseMetrics.nodesInScc, withoutProfiles.W3.nodesInScc)
        },
        I4_STRUCTURE: {
            edgePercentage: taxonomyCounts.I4 / edges.length,
            largestSccContribution: calcContribution(baseMetrics.largestSccSize, withoutProfiles.W4.largestSccSize),
            sccCountContribution: calcContribution(baseMetrics.totalSccCount, withoutProfiles.W4.totalSccCount),
            nodesInSccContribution: calcContribution(baseMetrics.nodesInScc, withoutProfiles.W4.nodesInScc)
        },
        I5_METADATA: {
            edgePercentage: taxonomyCounts.I5 / edges.length,
            largestSccContribution: calcContribution(baseMetrics.largestSccSize, withoutProfiles.W5.largestSccSize),
            sccCountContribution: calcContribution(baseMetrics.totalSccCount, withoutProfiles.W5.totalSccCount),
            nodesInSccContribution: calcContribution(baseMetrics.nodesInScc, withoutProfiles.W5.nodesInScc)
        }
    };

    const validation0CResult = {
        independentProfiles,
        cumulativeProfiles: collapseCurveResult,
        impactMatrix
    };
    fs.writeFileSync(path.join(OUT_DIR, 'validation_0c_impact_matrix.json'), JSON.stringify(validation0CResult, null, 2));
    console.log("Validation-0C Impact Matrix saved.");
}

main();
