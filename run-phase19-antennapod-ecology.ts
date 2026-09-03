import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = '/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/synapse_data/project_state.json';
const OUT_DIR = './synapse_report/ecology/antennapod';

function ensureDir() {
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }
}

function isNoise(p: string): boolean {
    if (!p) return true;
    const lower = p.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('.xml') || lower.endsWith('.gradle') || lower.endsWith('.pro')) return true;
    if (lower.includes('/test/') || lower.includes('/androidtest/') || lower.includes('/tests/')) return true;
    if (lower.includes('/build/')) return true;
    return false;
}

interface RawNode { id: string; path: string; cluster_id: string; isNoise: boolean; }
interface RawEdge { source: string; target: string; }

function loadRawGraph() {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    let allNodes: any[] = [];
    if (data.clusters) {
        for (const c of data.clusters) {
            if (c.nodes) allNodes.push(...c.nodes);
        }
    }
    if (data.nodes) allNodes.push(...data.nodes);
    
    let allEdges = data.edges || [];
    
    const validNodes = new Map<string, RawNode>();
    for (const n of allNodes) {
        const p = n.filePath || n.id;
        validNodes.set(n.id, {
            id: n.id,
            path: p,
            cluster_id: n.cluster_id || 'root',
            isNoise: isNoise(p)
        });
    }

    const validEdges: RawEdge[] = [];
    for (const e of allEdges) {
        const source = e.source || e.from;
        const target = e.target || e.to;
        if (validNodes.has(source) && validNodes.has(target)) {
            validEdges.push({ source, target });
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
        if (!indices.has(id)) {
            strongconnect(id);
        }
    }

    sccs.sort((a,b) => b.length - a.length);
    return sccs;
}

interface VirtualNode {
    id: string;
    isVirtual: boolean;
    size: number;
    internalEdges: number;
    incomingEdges: number;
    outgoingEdges: number;
    density: number;
    reachability: number;
    isNoise: boolean;
    representatives: string[];
}

function compressToDAG(nodes: Map<string, RawNode>, edges: RawEdge[], sccs: string[][]) {
    const nodeToScc = new Map<string, string>();
    const dagNodes = new Map<string, VirtualNode>();
    
    const inDegreeOriginal = new Map<string, number>();
    for (const e of edges) {
        inDegreeOriginal.set(e.target, (inDegreeOriginal.get(e.target) || 0) + 1);
    }

    let sccIdCounter = 1;
    for (const scc of sccs) {
        if (scc.length > 1) {
            const sccId = `SCC_Cluster_${scc.length}_${sccIdCounter++}`;
            const sortedNodes = [...scc].sort((a,b) => (inDegreeOriginal.get(b)||0) - (inDegreeOriginal.get(a)||0));
            const reps = sortedNodes.slice(0, 3).map(id => nodes.get(id)!.path);

            for (const id of scc) nodeToScc.set(id, sccId);
            
            dagNodes.set(sccId, {
                id: sccId,
                isVirtual: true,
                size: scc.length,
                internalEdges: 0,
                incomingEdges: 0,
                outgoingEdges: 0,
                density: 0,
                reachability: 0,
                isNoise: false,
                representatives: reps
            });
        } else {
            const id = scc[0];
            const raw = nodes.get(id)!;
            nodeToScc.set(id, id);
            dagNodes.set(id, {
                id: id,
                isVirtual: false,
                size: 1,
                internalEdges: 0,
                incomingEdges: 0,
                outgoingEdges: 0,
                density: 0,
                reachability: 0,
                isNoise: raw.isNoise,
                representatives: [raw.path]
            });
        }
    }

    const dagEdgesSet = new Set<string>();
    const dagGraph = new Map<string, string[]>(); 

    // Bridges defined by Cross-Cluster edges on Original Graph
    const originalBridgeScore = new Map<string, number>();

    for (const e of edges) {
        const u = nodeToScc.get(e.source)!;
        const v = nodeToScc.get(e.target)!;
        
        const rawU = nodes.get(e.source)!;
        const rawV = nodes.get(e.target)!;
        if (rawU.cluster_id !== rawV.cluster_id) {
            // Give bridge score to both ends or just source? Let's give to source.
            originalBridgeScore.set(u, (originalBridgeScore.get(u) || 0) + 1);
        }

        if (u === v) {
            if (dagNodes.get(u)!.isVirtual) {
                dagNodes.get(u)!.internalEdges++;
            }
        } else {
            const edgeKey = `${u}->${v}`;
            if (!dagEdgesSet.has(edgeKey)) {
                dagEdgesSet.add(edgeKey);
                dagNodes.get(u)!.outgoingEdges++;
                dagNodes.get(v)!.incomingEdges++;
                
                if (!dagGraph.has(u)) dagGraph.set(u, []);
                dagGraph.get(u)!.push(v);
            }
        }
    }

    for (const vn of dagNodes.values()) {
        if (vn.isVirtual) {
            const maxInternal = vn.size * (vn.size - 1);
            vn.density = maxInternal > 0 ? vn.internalEdges / maxInternal : 0;
        }
    }

    return { dagNodes, dagGraph, originalBridgeScore };
}

function calculateReachability(dagNodes: Map<string, VirtualNode>, dagGraph: Map<string, string[]>) {
    const reachMemo = new Map<string, Set<string>>();

    function getReach(node: string): Set<string> {
        if (reachMemo.has(node)) return reachMemo.get(node)!;
        
        const reach = new Set<string>();
        reach.add(node);
        const neighbors = dagGraph.get(node) || [];
        for (const n of neighbors) {
            const subReach = getReach(n);
            for (const r of subReach) reach.add(r);
        }
        reachMemo.set(node, reach);
        return reach;
    }

    for (const node of dagNodes.keys()) {
        try {
            const reachSet = getReach(node);
            let totalReachNodes = 0;
            for (const r of reachSet) {
                totalReachNodes += dagNodes.get(r)!.size;
            }
            dagNodes.get(node)!.reachability = totalReachNodes;
        } catch(e) {
            // ignore
        }
    }
}

function main() {
    ensureDir();
    console.log("Loading AntennaPod Graph...");
    const { nodes, edges } = loadRawGraph();
    console.log(`Raw Graph: ${nodes.size} nodes, ${edges.length} edges.`);

    const sccs = findSCCs(nodes, edges);
    const { dagNodes, dagGraph, originalBridgeScore } = compressToDAG(nodes, edges, sccs);
    console.log(`DAG Compression: ${dagNodes.size} virtual/real nodes.`);

    calculateReachability(dagNodes, dagGraph);

    // Filter runtime nodes
    const runtimeNodes = Array.from(dagNodes.values()).filter(n => !n.isNoise);
    const totalRuntimeRawNodes = Array.from(nodes.values()).filter(n => !n.isNoise).length;

    // Largest SCC
    let largestSCC: VirtualNode | null = null;
    for (const n of runtimeNodes) {
        if (n.isVirtual && (!largestSCC || n.size > largestSCC.size)) {
            largestSCC = n;
        }
    }

    const dominanceRatio = totalRuntimeRawNodes > 0 && largestSCC ? (largestSCC.reachability / totalRuntimeRawNodes) * 100 : 0;

    // Identify Hubs (High Reachability)
    const hubs = [...runtimeNodes].sort((a,b) => b.reachability - a.reachability).slice(0, 15);
    
    // Identify Victims (Sinks: High In-degree, Low Out-Degree in DAG)
    // Actually, reachability == size means it propagates nothing outside itself.
    const victims = [...runtimeNodes]
        .filter(n => n.reachability <= n.size + 2) // Allow tiny bit of propagation
        .sort((a,b) => b.incomingEdges - a.incomingEdges)
        .slice(0, 15);

    // Identify Bridges (High Bridge Score)
    const bridges = [...runtimeNodes]
        .sort((a,b) => (originalBridgeScore.get(b.id) || 0) - (originalBridgeScore.get(a.id) || 0))
        .slice(0, 15);

    // Compute RSI (Role Separation Index)
    const hubIds = new Set(hubs.map(n => n.id));
    const victimIds = new Set(victims.map(n => n.id));
    const bridgeIds = new Set(bridges.map(n => n.id));

    let hubVictimOverlap = 0;
    for (const h of hubIds) if (victimIds.has(h)) hubVictimOverlap++;
    
    let hubBridgeOverlap = 0;
    for (const h of hubIds) if (bridgeIds.has(h)) hubBridgeOverlap++;
    
    let victimBridgeOverlap = 0;
    for (const v of victimIds) if (bridgeIds.has(v)) victimBridgeOverlap++;

    const RSI_HV = (hubVictimOverlap / 15) * 100;
    const RSI_HB = (hubBridgeOverlap / 15) * 100;
    const RSI_VB = (victimBridgeOverlap / 15) * 100;

    let boundaryTotal = 0;
    for (const v of originalBridgeScore.values()) boundaryTotal += v;

    const report = `# AntennaPod Macro-Topology Ecology Report (Phase 19-A)

## 1. Graph Meta & Context
- **Project**: AntennaPod (Android/Java/Kotlin)
- **Mode**: Full Graph (No core/app isolation)
- **Total Runtime Nodes**: ${totalRuntimeRawNodes}
- **Boundary Edges (Cross-Module)**: ${boundaryTotal}
- **Total SCCs Compressed**: ${sccs.filter(s=>s.length > 1).length}

---

## 2. Largest SCC Deep Dive
\`\`\`yaml
LargestSCC:
  Size: ${largestSCC?.size || 0} nodes
  Density: ${largestSCC ? (largestSCC.density * 100).toFixed(2) : 0}%
  InternalEdges: ${largestSCC?.internalEdges || 0}
  ExternalIncoming: ${largestSCC?.incomingEdges || 0}
  ExternalOutgoing: ${largestSCC?.outgoingEdges || 0}
  Reachability: ${largestSCC?.reachability || 0} nodes
  DominanceRatio: ${dominanceRatio.toFixed(1)}% (Formula: LargestSCCReachability / TotalRuntimeNodes)
  Representatives:
${largestSCC?.representatives.map(r => `    - ${r}`).join('\n')}
\`\`\`

---

## 3. Role Separation Index (RSI) Analysis
**Hypothesis**: Does typical mobile application architecture separate architectural roles (Hub/Bridge/Victim) as strictly as a massive IDE platform like VSCode?

\`\`\`yaml
RoleSeparationIndex (Top 15):
  Hub ∩ Victim: ${RSI_HV.toFixed(1)}%
  Hub ∩ Bridge: ${RSI_HB.toFixed(1)}%
  Victim ∩ Bridge: ${RSI_VB.toFixed(1)}%
\`\`\`

### Role Breakdown

#### Top 5 Hubs (Dispatchers)
${hubs.slice(0, 5).map(h => `- **${h.representatives[0]}** (Reachability: ${h.reachability})`).join('\n')}

#### Top 5 Bridges (Cross-Boundary Connectors)
${bridges.slice(0, 5).map(b => `- **${b.representatives[0]}** (Cross-Cluster Edges: ${originalBridgeScore.get(b.id) || 0})`).join('\n')}

#### Top 5 Victims (Sinks / Absorbers)
${victims.slice(0, 5).map(v => `- **${v.representatives[0]}** (Incoming DAG Paths: ${v.incomingEdges})`).join('\n')}

---

## 4. Architectural Insight (VSCode vs AntennaPod Preliminary)
- **Role Separation Observation**: If RSI for Hub ∩ Victim is low (< 10%), it confirms that even in a smaller MVVM architecture like AntennaPod, nodes that cause failure (Hubs) and nodes that absorb failure (Victims) occupy distinct topological positions.
- **Dominance Ratio**: AntennaPod's Dominance Ratio is **${dominanceRatio.toFixed(1)}%**. Compared to VSCode Core (25.8%), we can see if AntennaPod is more monolithic or more decoupled.
`;

    fs.writeFileSync(path.join(OUT_DIR, 'macro_ecology_report.md'), report);
    console.log(`Report generated at ${OUT_DIR}/macro_ecology_report.md`);
}

main();
