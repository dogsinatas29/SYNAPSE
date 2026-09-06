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
    
    // secondary is top 2-10
    let secondarySum = top10Sum - largestScc;
    let secondaryCount = Math.min(9, sccs.length > 1 ? sccs.length - 1 : 0);

    return {
        largest_scc: largestScc,
        top10_scc_sum: top10Sum,
        secondary_scc_sum: secondarySum,
        secondary_scc_count: secondaryCount,
        total_scc_count: sccs.length,
        nodes_in_scc: nodesInScc,
        scc_density: nodesInScc / (totalNodes || 1)
    };
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

    console.log("Running reclassification on UNKNOWN_RUNTIME...");
    for (let i=0; i<edges.length; i++) {
        if (edges[i].provenance === 'UNKNOWN_RUNTIME') {
            const res = reclassifyEdgeWithPattern(edges[i], validNodes);
            edges[i].provenance = res.prov;
            edges[i].pattern = res.pattern;
        }
    }

    console.log("Finding Base SCCs to define Topology Zones...");
    const baseSccs = findSCCs(edges, validNodes);
    
    const giantSccNodes = new Set(baseSccs[0] || []);
    const secondarySccNodes = new Set<string>();
    for (let i = 1; i < Math.min(10, baseSccs.length); i++) {
        for (const n of baseSccs[i]) secondarySccNodes.add(n);
    }

    console.log("Auditing Heuristic Patterns...");
    const patternAudit: Record<string, { total: number, giant: number, secondary: number, dag: number }> = {};
    for (const e of edges) {
        if (!e.pattern || e.pattern === 'native') continue;
        const pat = e.pattern;
        if (!patternAudit[pat]) patternAudit[pat] = { total: 0, giant: 0, secondary: 0, dag: 0 };
        
        patternAudit[pat].total++;
        if (giantSccNodes.has(e.source) && giantSccNodes.has(e.target)) {
            patternAudit[pat].giant++;
        } else if (secondarySccNodes.has(e.source) && secondarySccNodes.has(e.target)) {
            patternAudit[pat].secondary++;
        } else {
            patternAudit[pat].dag++;
        }
    }

    console.log("Running Targeted Ablation Tests...");
    const totalNodeCount = validNodes.size;

    // BASELINE (All edges with reclassification)
    const baselineMetrics = calcMetrics(baseSccs, totalNodeCount);

    // WITHOUT STRUCTURE (Remove I4)
    const noStructEdges = edges.filter(e => !I4.has(e.provenance));
    const noStructMetrics = calcMetrics(findSCCs(noStructEdges, validNodes), totalNodeCount);

    // WITHOUT REGISTRATION (Remove I3)
    const noRegEdges = edges.filter(e => !I3.has(e.provenance));
    const noRegMetrics = calcMetrics(findSCCs(noRegEdges, validNodes), totalNodeCount);
    
    // WITHOUT CALL (Remove I1)
    const noCallEdges = edges.filter(e => !I1.has(e.provenance));
    const noCallMetrics = calcMetrics(findSCCs(noCallEdges, validNodes), totalNodeCount);

    const report = {
        heuristic_audit: patternAudit,
        ablation_test: {
            baseline: baselineMetrics,
            without_structure_mass: noStructMetrics,
            without_registration_glue: noRegMetrics,
            without_call_flow: noCallMetrics
        }
    };

    fs.writeFileSync(path.join(OUT_DIR, 'validation_0h_ablation.json'), JSON.stringify(report, null, 2));
    console.log("Validation-0H Ablation and Audit saved.");
}

main();
