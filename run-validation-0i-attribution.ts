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

function classifyLayer(prov: string) {
    if (I1.has(prov)) return 'CALL';
    if (I2.has(prov)) return 'CONTROL';
    if (I3.has(prov)) return 'REGISTRATION';
    if (I4.has(prov)) return 'STRUCTURE';
    if (I5.has(prov)) return 'METADATA';
    return 'UNKNOWN';
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

function calcMetrics(sccs: string[][]) {
    const largestScc = sccs.length > 0 ? sccs[0].length : 0;
    let top10Sum = 0;
    let nodesInScc = 0;
    for (let i = 0; i < sccs.length; i++) {
        nodesInScc += sccs[i].length;
        if (i < 10) top10Sum += sccs[i].length;
    }
    
    return {
        largest_scc: largestScc,
        top10_scc_sum: top10Sum,
        total_scc_count: sccs.length,
        nodes_in_scc: nodesInScc,
    };
}

function analyzeDataset(name: string, nodes: Map<string, RawNode>, allEdges: RawEdge[]) {
    // Only keep edges where BOTH source and target are in the dataset
    const edges = allEdges.filter(e => nodes.has(e.source) && nodes.has(e.target));
    
    // Baseline metrics (With ALL edges)
    const baseSccs = findSCCs(edges, nodes);
    const structSccSize = baseSccs.length > 0 ? baseSccs[0].length : 0;

    // Without STRUCTURE
    const noStructEdges = edges.filter(e => !I4.has(e.provenance));
    const sccs = findSCCs(noStructEdges, nodes);
    const execMetrics = calcMetrics(sccs);
    
    // Provenance of Largest SCC
    const provCounts: Record<string, number> = { CALL: 0, REGISTRATION: 0, METADATA: 0, UNKNOWN: 0, CONTROL: 0, STRUCTURE: 0 };
    if (sccs.length > 0) {
        const giantSccNodes = new Set(sccs[0]);
        for (const e of noStructEdges) {
            if (giantSccNodes.has(e.source) && giantSccNodes.has(e.target)) {
                const layer = classifyLayer(e.provenance);
                if (provCounts[layer] !== undefined) provCounts[layer]++;
            }
        }
    }
    
    // Ablations on the Without STRUCTURE graph
    const noCall = noStructEdges.filter(e => !I1.has(e.provenance));
    const noReg = noStructEdges.filter(e => !I3.has(e.provenance));
    const noMeta = noStructEdges.filter(e => !I5.has(e.provenance));

    return {
        structural_giant_scc: structSccSize,
        execution_scc_metrics: execMetrics,
        execution_scc_provenance: provCounts,
        ablation_without_CALL: calcMetrics(findSCCs(noCall, nodes)),
        ablation_without_REG: calcMetrics(findReg(noReg, nodes)),
        ablation_without_META: calcMetrics(findSCCs(noMeta, nodes))
    };
}

function findReg(edges: RawEdge[], nodes: Map<string, RawNode>) {
    return findSCCs(edges, nodes);
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

    const allEdges: RawEdge[] = [];
    for (const e of (data.edges || [])) {
        const source = e.source || e.from;
        const target = e.target || e.to;
        if (validNodes.has(source) && validNodes.has(target)) {
            allEdges.push({ source, target, provenance: e.provenance || 'UNKNOWN_RUNTIME', pattern: 'native' });
        }
    }

    console.log("Reclassifying UNKNOWN_RUNTIME...");
    for (let i=0; i<allEdges.length; i++) {
        if (allEdges[i].provenance === 'UNKNOWN_RUNTIME') {
            const res = reclassifyEdgeWithPattern(allEdges[i], validNodes);
            allEdges[i].provenance = res.prov;
            allEdges[i].pattern = res.pattern;
        }
    }

    // Split Datasets
    const coreNodes = new Map<string, RawNode>();
    const copilotNodes = new Map<string, RawNode>();
    const combinedNodes = validNodes;

    for (const [id, node] of validNodes.entries()) {
        const p = node.path.replace(/\\/g, '/'); // Normalize path
        if (p.includes('extensions/copilot')) {
            copilotNodes.set(id, node);
        } else if (!p.includes('extensions/')) {
            coreNodes.set(id, node);
        }
    }

    console.log(`Node Counts - Core: ${coreNodes.size}, Copilot: ${copilotNodes.size}, Combined: ${combinedNodes.size}`);

    console.log("Analyzing 0I.1: VSCode Core Only...");
    const coreResult = analyzeDataset("Core Only", coreNodes, allEdges);

    console.log("Analyzing 0I.2: Copilot Only...");
    const copilotResult = analyzeDataset("Copilot Only", copilotNodes, allEdges);

    console.log("Analyzing 0I.3: Combined Baseline...");
    const combinedResult = analyzeDataset("Combined Baseline", combinedNodes, allEdges);

    const report = {
        I1_VSCode_Core: coreResult,
        I2_Copilot_Only: copilotResult,
        I3_Combined: combinedResult
    };

    fs.writeFileSync(path.join(OUT_DIR, 'validation_0i_attribution.json'), JSON.stringify(report, null, 2));
    console.log("Validation-0I Attribution saved.");
}

main();
