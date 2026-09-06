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

const I1 = new Set(['FUNCTION_CALL', 'CONSTRUCTOR_CALL']);
const I2 = new Set(['DYNAMIC_IMPORT']);
const I3 = new Set(['FRAMEWORK_REGISTRATION']);
const I4 = new Set(['INHERITANCE', 'TYPE_ONLY']);
const I5 = new Set(['DECORATOR']);

const ABSOLUTE_VSCODE_ROOT = process.argv[3] || process.cwd();
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

function reclassifyEdge(e: RawEdge, nodes: Map<string, RawNode>): string {
    const sourceNode = nodes.get(e.source);
    if (!sourceNode) return 'UNKNOWN_RUNTIME';
    try {
        const absPath = getAbsPath(sourceNode.path);
        if (!fs.existsSync(absPath)) return 'UNKNOWN_RUNTIME';
        const content = readFileCached(absPath);
        const targetName = path.basename(e.target).replace(/\.ts$/, '').replace(/\.js$/, '');
        
        if (new RegExp(`import\\s+type\\s+.*${targetName}`).test(content)) return 'TYPE_ONLY';
        if (content.includes(`new ${targetName}(`)) return 'CONSTRUCTOR_CALL';
        if (content.includes(`class `) && content.includes(`extends ${targetName}`)) return 'INHERITANCE';
        if (content.includes(`class `) && content.includes(`implements ${targetName}`)) return 'INHERITANCE';
        if (content.includes(`@${targetName}`)) return 'DECORATOR';
        if (content.includes(`register`) && content.includes(targetName)) return 'FRAMEWORK_REGISTRATION';
        if (content.includes(`${targetName}(`)) return 'FUNCTION_CALL';
        if (content.includes(`import `) && content.includes(targetName)) return 'TYPE_ONLY';
        return 'UNKNOWN_RUNTIME';
    } catch (err) {
        return 'UNKNOWN_RUNTIME';
    }
}

function loadGraphs() {
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
            let prov = e.provenance || 'UNKNOWN_RUNTIME';
            edges.push({ source, target, provenance: prov });
        }
    }

    console.log("Reclassifying UNKNOWN_RUNTIME edges using heuristic...");
    for (let i=0; i<edges.length; i++) {
        if (edges[i].provenance === 'UNKNOWN_RUNTIME') {
            edges[i].provenance = reclassifyEdge(edges[i], validNodes);
        }
    }
    return { nodes: validNodes, edges };
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

function classifyLayer(prov: string) {
    if (I1.has(prov)) return 'CALL';
    if (I2.has(prov)) return 'CONTROL';
    if (I3.has(prov)) return 'REGISTRATION';
    if (I4.has(prov)) return 'STRUCTURE';
    if (I5.has(prov)) return 'METADATA';
    return 'UNKNOWN';
}

function countLayerStats(edgeList: RawEdge[]) {
    const counts = { CALL: 0, CONTROL: 0, REGISTRATION: 0, STRUCTURE: 0, METADATA: 0, UNKNOWN: 0 };
    for (const e of edgeList) {
        const layer = classifyLayer(e.provenance);
        counts[layer]++;
    }
    const total = edgeList.length || 1;
    const ratios = {
        CALL: counts.CALL / total,
        CONTROL: counts.CONTROL / total,
        REGISTRATION: counts.REGISTRATION / total,
        STRUCTURE: counts.STRUCTURE / total,
        METADATA: counts.METADATA / total,
        UNKNOWN: counts.UNKNOWN / total
    };
    return { counts, ratios, total: edgeList.length };
}

function main() {
    ensureDir();
    const { nodes, edges } = loadGraphs();
    
    console.log("Finding SCCs...");
    const sccs = findSCCs(edges, nodes);
    
    const giantSccNodes = new Set(sccs[0] || []);
    const secondarySccNodes = new Set<string>();
    for (let i = 1; i < Math.min(10, sccs.length); i++) {
        for (const n of sccs[i]) secondarySccNodes.add(n);
    }

    const giantEdges: RawEdge[] = [];
    const secondaryEdges: RawEdge[] = [];
    const dagEdges: RawEdge[] = [];

    for (const e of edges) {
        if (giantSccNodes.has(e.source) && giantSccNodes.has(e.target)) {
            giantEdges.push(e);
        } else if (secondarySccNodes.has(e.source) && secondarySccNodes.has(e.target)) {
            secondaryEdges.push(e);
        } else {
            dagEdges.push(e);
        }
    }

    const globalStats = countLayerStats(edges);
    const giantStats = countLayerStats(giantEdges);
    const secondaryStats = countLayerStats(secondaryEdges);
    const dagStats = countLayerStats(dagEdges);

    const enrichment = {
        CALL: giantStats.ratios.CALL / (globalStats.ratios.CALL || 1),
        CONTROL: giantStats.ratios.CONTROL / (globalStats.ratios.CONTROL || 1),
        REGISTRATION: giantStats.ratios.REGISTRATION / (globalStats.ratios.REGISTRATION || 1),
        STRUCTURE: giantStats.ratios.STRUCTURE / (globalStats.ratios.STRUCTURE || 1),
        METADATA: giantStats.ratios.METADATA / (globalStats.ratios.METADATA || 1)
    };

    const secondaryEnrichment = {
        CALL: secondaryStats.ratios.CALL / (globalStats.ratios.CALL || 1),
        CONTROL: secondaryStats.ratios.CONTROL / (globalStats.ratios.CONTROL || 1),
        REGISTRATION: secondaryStats.ratios.REGISTRATION / (globalStats.ratios.REGISTRATION || 1),
        STRUCTURE: secondaryStats.ratios.STRUCTURE / (globalStats.ratios.STRUCTURE || 1),
        METADATA: secondaryStats.ratios.METADATA / (globalStats.ratios.METADATA || 1)
    };

    const report = {
        global: globalStats,
        giant_scc: giantStats,
        secondary_scc: secondaryStats,
        dag_region: dagStats,
        enrichment_ratio: enrichment,
        secondary_enrichment_ratio: secondaryEnrichment
    };

    fs.writeFileSync(path.join(OUT_DIR, 'validation_0g_heatmap.json'), JSON.stringify(report, null, 2));
    console.log("Validation-0G Topology Heatmap saved.");
}

main();
