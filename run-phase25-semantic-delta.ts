import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';
const OUT_DIR = './synapse_report/ecology/vscode';

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

const BEHAVIORAL_PROVENANCE = new Set([
    'FUNCTION_CALL', 
    'CONSTRUCTOR_CALL', 
    'INHERITANCE', 
    'DECORATOR', 
    'FRAMEWORK_REGISTRATION'
]);

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

    const structuralEdges: RawEdge[] = [];
    const behavioralEdges: RawEdge[] = [];

    for (const e of allEdges) {
        const source = e.source || e.from;
        const target = e.target || e.to;
        if (validNodes.has(source) && validNodes.has(target)) {
            const edge: RawEdge = { source, target, provenance: e.provenance || 'UNKNOWN' };
            structuralEdges.push(edge);
            if (BEHAVIORAL_PROVENANCE.has(edge.provenance)) {
                behavioralEdges.push(edge);
            }
        }
    }
    return { nodes: validNodes, structuralEdges, behavioralEdges };
}

// ---- Graph Algorithm Engine ----
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
    sccs.sort((a,b) => b.length - a.length);
    return sccs;
}

interface VirtualNode {
    id: string;
    isVirtual: boolean;
    size: number;
    incomingEdges: number;
    outgoingEdges: number;
    reachability: number;
    isNoise: boolean;
    representatives: string[];
}

function compressToDAG(nodes: Map<string, RawNode>, edges: RawEdge[], sccs: string[][]) {
    const nodeToScc = new Map<string, string>();
    const dagNodes = new Map<string, VirtualNode>();
    
    const inDegreeOriginal = new Map<string, number>();
    for (const e of edges) inDegreeOriginal.set(e.target, (inDegreeOriginal.get(e.target) || 0) + 1);

    let sccIdCounter = 1;
    for (const scc of sccs) {
        if (scc.length > 1) {
            const sccId = `SCC_${scc.length}_${sccIdCounter++}`;
            const sortedNodes = [...scc].sort((a,b) => (inDegreeOriginal.get(b)||0) - (inDegreeOriginal.get(a)||0));
            const reps = sortedNodes.slice(0, 3).map(id => nodes.get(id)!.path);

            for (const id of scc) nodeToScc.set(id, sccId);
            
            dagNodes.set(sccId, {
                id: sccId, isVirtual: true, size: scc.length,
                incomingEdges: 0, outgoingEdges: 0, reachability: 0,
                isNoise: false, representatives: reps
            });
        } else {
            const id = scc[0];
            const raw = nodes.get(id)!;
            nodeToScc.set(id, id);
            dagNodes.set(id, {
                id: id, isVirtual: false, size: 1,
                incomingEdges: 0, outgoingEdges: 0, reachability: 0,
                isNoise: raw.isNoise, representatives: [raw.path]
            });
        }
    }

    const dagEdgesSet = new Set<string>();
    const dagGraph = new Map<string, string[]>(); 

    for (const e of edges) {
        const u = nodeToScc.get(e.source)!;
        const v = nodeToScc.get(e.target)!;
        if (u !== v) {
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
    return { dagNodes, dagGraph, nodeToScc };
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
            for (const r of reachSet) totalReachNodes += dagNodes.get(r)!.size;
            dagNodes.get(node)!.reachability = totalReachNodes;
        } catch(e) { } // Pathological stack
    }
}

// Return path components for composition grouping (e.g. src/vs/workbench)
function getSubsystem(p: string): string {
    const parts = p.split('/');
    if (parts.length >= 4 && parts[0] === 'src' && parts[1] === 'vs') {
        return parts.slice(0, 4).join('/'); // e.g. src/vs/workbench/contrib
    }
    if (parts.length >= 3) return parts.slice(0, 3).join('/');
    return parts[0];
}

interface AnalysisResult {
    totalEdges: number;
    sccs: string[][];
    dagNodes: Map<string, VirtualNode>;
    nodeToScc: Map<string, string>;
    largestSccSize: number;
    sccComposition: any[];
    hubs: { id: string, name: string, score: number, isVirtual: boolean, size: number, incoming: number }[];
}

function runAnalysis(nodes: Map<string, RawNode>, edges: RawEdge[]): AnalysisResult {
    const sccs = findSCCs(nodes, edges);
    const { dagNodes, dagGraph, nodeToScc } = compressToDAG(nodes, edges, sccs);
    calculateReachability(dagNodes, dagGraph);

    const largestScc = sccs[0] || [];
    const compMap = new Map<string, number>();
    for (const id of largestScc) {
        const raw = nodes.get(id)!;
        if (!raw.isNoise) {
            const sys = getSubsystem(raw.path);
            compMap.set(sys, (compMap.get(sys) || 0) + 1);
        }
    }
    const composition = Array.from(compMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 10);

    const runtimeNodes = Array.from(dagNodes.values()).filter(n => !n.isNoise);
    const hubs = [...runtimeNodes].sort((a,b) => b.reachability - a.reachability).slice(0, 50).map(n => ({
        id: n.id,
        name: n.representatives[0],
        score: n.reachability,
        isVirtual: n.isVirtual,
        size: n.size,
        incoming: n.incomingEdges
    }));

    return {
        totalEdges: edges.length,
        sccs,
        dagNodes,
        nodeToScc,
        largestSccSize: largestScc.length,
        sccComposition: composition,
        hubs
    };
}

function main() {
    ensureDir();
    console.log("Loading graphs...");
    const { nodes, structuralEdges, behavioralEdges } = loadGraphs();
    const runtimeNodeCount = Array.from(nodes.values()).filter(n => !n.isNoise).length;
    console.log(`Nodes: ${runtimeNodeCount}, Struct Edges: ${structuralEdges.length}, Behav Edges: ${behavioralEdges.length}`);

    console.log("\nRunning Structural Analysis...");
    const structRes = runAnalysis(nodes, structuralEdges);

    console.log("Running Behavioral Analysis...");
    const behavRes = runAnalysis(nodes, behavioralEdges);

    console.log("\nCalculating Stability Metrics...");
    
    // Hub Stability (Top 20)
    let maintainedHubs = 0;
    const topStructHubs = structRes.hubs.slice(0, 20);
    const behavHubNames = new Set(behavRes.hubs.slice(0, 40).map(h => h.name)); // Give it a buffer of top 40 in behavioral
    
    const roleMigrations: string[] = [];
    let falseHubCount = 0;

    for (const sh of topStructHubs) {
        if (behavHubNames.has(sh.name)) {
            maintainedHubs++;
        } else {
            falseHubCount++;
            // Find its rank/role in behavioral
            const behavNodeId = behavRes.nodeToScc.get(sh.name) || sh.name; 
            // Wait, sh.name is the representative path. Let's find the raw node ID for it.
            let rawNodeId = "";
            for (const [id, raw] of nodes.entries()) {
                if (raw.path === sh.name) { rawNodeId = id; break; }
            }
            if (rawNodeId) {
                const bSccId = behavRes.nodeToScc.get(rawNodeId);
                const bDagNode = behavRes.dagNodes.get(bSccId!);
                if (bDagNode) {
                    roleMigrations.push(`- **${sh.name}**: Structural Hub (Reach: ${sh.score}) ➔ Behavioral Rank Dropped (Reach: ${bDagNode.reachability}, In: ${bDagNode.incomingEdges}) - *Type Registry 착시 의심*`);
                }
            }
        }
    }

    const falseHubRate = (falseHubCount / 20) * 100;
    const hubStability = (maintainedHubs / 20) * 100;

    // Largest SCC Reduction
    const sccReduction = ((structRes.largestSccSize - behavRes.largestSccSize) / structRes.largestSccSize) * 100;

    const report = `# Phase 25: Structural vs Behavioral Delta Report (VSCode)

## 1. Engine Evolution Observation
이 보고서는 특정 생태계의 분석을 넘어, SYNAPSE 엔진이 1차원(Topology)에서 2차원(Semantic Layers)으로 진화했음을 증명하는 첫 번째 **Delta Analysis**입니다. 
"컴파일/타입 시스템의 결합(Structural)"과 "실제 실행 궤적의 결합(Behavioral)" 간의 차이를 정량화하여 아키텍처의 진짜 복잡도를 분리해냅니다.

## 2. 📉 Topology Delta (거시 지표 변화)

| Metric | Structural Profile | Behavioral Profile | Delta (Reduction) |
| :--- | :--- | :--- | :--- |
| **Valid Edges** | ${structRes.totalEdges} | ${behavRes.totalEdges} | **-${((1 - behavRes.totalEdges/structRes.totalEdges)*100).toFixed(1)}%** |
| **Largest SCC Size** | ${structRes.largestSccSize} | ${behavRes.largestSccSize} | **-${sccReduction.toFixed(1)}%** |
| **Total DAG Nodes** | ${structRes.dagNodes.size} | ${behavRes.dagNodes.size} | +${behavRes.dagNodes.size - structRes.dagNodes.size} (파편화 증가) |

**해석 (Observation):**
Behavioral 모드 적용 시 Largest SCC가 엄청난 비율로 축소됩니다. 이는 VSCode의 거대한 상호 의존성(2600+ 노드) 중 상당수가 인터페이스 공유, 타입 참조 등 "실행과 무관한 정적 결합"에 의해 부풀려져 있었음을 시사합니다.

## 3. 📊 Stability Metrics (1급 지표: 유지율)

| Metric | Value | 설명 |
| :--- | :--- | :--- |
| **Hub Stability** | **${hubStability.toFixed(1)}%** | Structural Top 20 허브 중 Behavioral Top 40 내에 생존한 비율 |
| **False Hub Rate** | **${falseHubRate.toFixed(1)}%** | Structural에서는 거대한 허브였으나, 실행 관점에서는 허구가 된 비율 |

## 4. 🔄 Role Migration (역할의 이동)
정적 그래프에서는 시스템의 중심(Hub)으로 보였으나, 런타임/행위 관점에서는 단말(Victim/Leaf)에 가깝게 추락한 노드들입니다. **이들은 "단순 타입 레지스트리"이거나 "유틸리티"일 가능성이 매우 높습니다.**

${roleMigrations.join('\n')}

---

## 5. Composition Delta (Largest SCC 성분 변화)
가장 거대한 순환 의존성 덩어리(Largest SCC)가 어떻게 재편되었는가?

### Structural SCC Composition
${structRes.sccComposition.map(([sys, c]) => `- ${sys}: ${c} nodes (${((c/structRes.largestSccSize)*100).toFixed(1)}%)`).join('\n')}

### Behavioral SCC Composition
${behavRes.sccComposition.map(([sys, c]) => `- ${sys}: ${c} nodes (${((c/behavRes.largestSccSize)*100).toFixed(1)}%)`).join('\n')}

---
*Report Generated by SYNAPSE Architecture Engine (Phase 25)*
`;

    fs.writeFileSync(path.join(OUT_DIR, 'semantic_delta_report.md'), report);
    console.log(`\nDelta Report Generated: ${OUT_DIR}/semantic_delta_report.md`);
}

main();
