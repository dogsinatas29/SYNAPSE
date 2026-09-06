import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = process.argv[2] || './synapse_data/project_state.json';
const ABSOLUTE_VSCODE_ROOT = process.argv[3] || process.cwd();
const OUT_DIR = './synapse_report/ecology';

function ensureDir() {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

interface RawNode { id: string; path: string; isNoise: boolean; }
interface RawEdge { source: string; target: string; provenance: string; pattern?: string; }

function isNoise(p: string): boolean {
    if (!p) return true;
    const lower = p.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.json') || lower.endsWith('.css')) return true;
    if (lower.includes('/test/') || lower.includes('/tests/')) return true;
    if (lower.includes('/build/')) return true;
    return false;
}

const I1 = new Set(['FUNCTION_CALL', 'CONSTRUCTOR_CALL']);
const I2 = new Set(['DYNAMIC_IMPORT']);
const I3 = new Set(['FRAMEWORK_REGISTRATION']);
const I4 = new Set(['INHERITANCE', 'TYPE_ONLY']);
const I5 = new Set(['DECORATOR']);
const I0 = new Set(['UNKNOWN_RUNTIME']);

function getAbsPath(relPath: string) {
    if (relPath.startsWith('/')) return relPath;
    return path.join(ABSOLUTE_VSCODE_ROOT, relPath);
}

const fileCache = new Map<string, string>();
function readFileCached(absPath: string) {
    if (fileCache.has(absPath)) return fileCache.get(absPath)!;
    const content = fs.readFileSync(absPath, 'utf8');
    fileCache.set(absPath, content);
    return content;
}

function reclassifyEdgeWithPattern(e: RawEdge, nodes: Map<string, RawNode>): { prov: string, pattern: string } {
    const sourceNode = nodes.get(e.source);
    if (!sourceNode) return { prov: 'UNKNOWN_RUNTIME', pattern: 'missing_source' };
    try {
        const absPath = getAbsPath(sourceNode.path);
        if (!fs.existsSync(absPath)) return { prov: 'UNKNOWN_RUNTIME', pattern: 'file_not_found' };
        const content = readFileCached(absPath);
        const targetName = path.basename(e.target).replace(/\.ts$/, '').replace(/\.js$/, '');
        
        if (new RegExp(`import\\s+type\\s+.*${targetName}`).test(content)) return { prov: 'TYPE_ONLY', pattern: 'import_type' };
        if (content.includes(`new ${targetName}(`)) return { prov: 'CONSTRUCTOR_CALL', pattern: 'new_object' };
        if (content.includes(`class `) && content.includes(`extends ${targetName}`)) return { prov: 'INHERITANCE', pattern: 'extends' };
        if (content.includes(`class `) && content.includes(`implements ${targetName}`)) return { prov: 'INHERITANCE', pattern: 'implements' };
        if (content.includes(`@${targetName}`)) return { prov: 'DECORATOR', pattern: 'decorator' };
        if (content.includes(`register`) && content.includes(targetName)) return { prov: 'FRAMEWORK_REGISTRATION', pattern: 'register' };
        if (content.includes(`${targetName}(`)) return { prov: 'FUNCTION_CALL', pattern: 'function_call' };
        if (content.includes(`import `) && content.includes(targetName)) return { prov: 'TYPE_ONLY', pattern: 'import_generic' };
        return { prov: 'UNKNOWN_RUNTIME', pattern: 'no_match' };
    } catch (err) {
        return { prov: 'UNKNOWN_RUNTIME', pattern: 'error' };
    }
}

function findSCCs(edges: RawEdge[], nodes: Map<string, RawNode>) {
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

function calcMetrics(sccs: string[][], totalNodes: number) {
    const largestScc = sccs.length > 0 ? sccs[0].length : 0;
    let top10Sum = 0;
    let nodesInScc = 0;
    for (let i = 0; i < sccs.length; i++) {
        nodesInScc += sccs[i].length;
        if (i < 10) top10Sum += sccs[i].length;
    }
    
    let secondaryCount = Math.min(9, sccs.length > 1 ? sccs.length - 1 : 0);

    return {
        largest_scc: largestScc,
        top10_scc_sum: top10Sum,
        secondary_scc_count: secondaryCount,
        total_scc_count: sccs.length,
        nodes_in_scc: nodesInScc,
    };
}

function classifyLayer(prov: string) {
    if (I1.has(prov)) return 'CALL';
    if (I2.has(prov)) return 'CONTROL';
    if (I3.has(prov)) return 'REGISTRATION';
    if (I4.has(prov)) return 'STRUCTURE';
    if (I5.has(prov)) return 'METADATA';
    return 'UNKNOWN';
}

function getSubsystem(p: string) {
    if (p.includes('src/vs/base/')) return 'src/vs/base';
    if (p.includes('src/vs/platform/')) return 'src/vs/platform';
    if (p.includes('src/vs/workbench/')) return 'src/vs/workbench';
    if (p.includes('src/vs/editor/')) return 'src/vs/editor';
    if (p.includes('extensions/')) return 'extensions';
    return 'others';
}

function main() {
    ensureDir();
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    let allNodes: any[] = [];
    if (data.clusters) {
        for (const c of data.clusters) if (c.nodes) allNodes.push(...c.nodes);
    }
    if (data.nodes) allNodes.push(...data.nodes);
    
    const validNodes = new Map<string, RawNode>();
    for (const n of allNodes) {
        const p = n.filePath || n.id;
        validNodes.set(n.id, { id: n.id, path: p, isNoise: isNoise(p) });
    }

    const edges: RawEdge[] = [];
    for (const e of (data.edges || [])) {
        const source = e.source || e.from;
        const target = e.target || e.to;
        if (validNodes.has(source) && validNodes.has(target)) {
            edges.push({ source, target, provenance: e.provenance || 'UNKNOWN_RUNTIME', pattern: 'native' });
        }
    }

    console.log("Reclassifying UNKNOWN_RUNTIME...");
    for (let i=0; i<edges.length; i++) {
        if (edges[i].provenance === 'UNKNOWN_RUNTIME') {
            const res = reclassifyEdgeWithPattern(edges[i], validNodes);
            edges[i].provenance = res.prov;
            edges[i].pattern = res.pattern;
        }
    }

    console.log("Computing Baseline Without STRUCTURE Graph...");
    const noStructEdges = edges.filter(e => !I4.has(e.provenance));
    const sccs = findSCCs(noStructEdges, validNodes);
    
    if (sccs.length === 0) {
        console.log("No SCCs found in Without STRUCTURE graph.");
        return;
    }
    
    const giantSccNodes = new Set(sccs[0]);
    console.log(`Surviving Giant SCC Size: ${giantSccNodes.size}`);

    // PART A: Surviving SCC Provenance Distribution
    console.log("Running Part A: Provenance Distribution...");
    const giantSccEdges: RawEdge[] = [];
    const provCounts: Record<string, number> = { CALL: 0, REGISTRATION: 0, METADATA: 0, UNKNOWN: 0, CONTROL: 0, STRUCTURE: 0 };
    for (const e of noStructEdges) {
        if (giantSccNodes.has(e.source) && giantSccNodes.has(e.target)) {
            giantSccEdges.push(e);
            const layer = classifyLayer(e.provenance);
            if (provCounts[layer] !== undefined) provCounts[layer]++;
        }
    }
    const totalGiantEdges = giantSccEdges.length;
    const partA = {
        total_edges: totalGiantEdges,
        CALL_percent: (provCounts.CALL / totalGiantEdges) * 100,
        REGISTRATION_percent: (provCounts.REGISTRATION / totalGiantEdges) * 100,
        METADATA_percent: (provCounts.METADATA / totalGiantEdges) * 100,
        CONTROL_percent: (provCounts.CONTROL / totalGiantEdges) * 100,
        UNKNOWN_percent: (provCounts.UNKNOWN / totalGiantEdges) * 100,
        counts: provCounts
    };

    // PART B: Secondary Ablation
    console.log("Running Part B: Secondary Ablation...");
    const totalNodes = validNodes.size;
    const baselineMetrics = calcMetrics(sccs, totalNodes);
    
    const noStructNoCall = noStructEdges.filter(e => !I1.has(e.provenance));
    const noStructNoMeta = noStructEdges.filter(e => !I5.has(e.provenance));
    const noStructNoReg = noStructEdges.filter(e => !I3.has(e.provenance));
    const noStructNoUnknown = noStructEdges.filter(e => !I0.has(e.provenance));

    const partB = {
        baseline_without_struct: baselineMetrics,
        without_CALL: calcMetrics(findSCCs(noStructNoCall, validNodes), totalNodes),
        without_METADATA: calcMetrics(findSCCs(noStructNoMeta, validNodes), totalNodes),
        without_REGISTRATION: calcMetrics(findSCCs(noStructNoReg, validNodes), totalNodes),
        without_UNKNOWN: calcMetrics(findSCCs(noStructNoUnknown, validNodes), totalNodes)
    };

    // PART C: Cluster Composition
    console.log("Running Part C: Cluster Composition...");
    const subsystemCounts: Record<string, number> = {
        'src/vs/base': 0,
        'src/vs/platform': 0,
        'src/vs/workbench': 0,
        'src/vs/editor': 0,
        'extensions': 0,
        'others': 0
    };
    
    // Also track clusters by extracting immediate parent dir
    const clusterCounts = new Map<string, number>();

    for (const nodeId of giantSccNodes) {
        const node = validNodes.get(nodeId)!;
        const sub = getSubsystem(node.path);
        subsystemCounts[sub]++;

        const clusterName = path.dirname(node.path);
        clusterCounts.set(clusterName, (clusterCounts.get(clusterName) || 0) + 1);
    }
    
    const topClusters = Array.from(clusterCounts.entries())
        .sort((a,b) => b[1] - a[1])
        .slice(0, 15)
        .map(x => ({ cluster: x[0], count: x[1] }));

    const partC = {
        subsystems: subsystemCounts,
        top_clusters: topClusters
    };

    const report = {
        part_A_provenance_distribution: partA,
        part_B_secondary_ablation: partB,
        part_C_cluster_composition: partC
    };

    fs.writeFileSync(path.join(OUT_DIR, 'validation_0i_core_anatomy.json'), JSON.stringify(report, null, 2));
    console.log("Validation-0I Core Anatomy saved.");
}

main();
