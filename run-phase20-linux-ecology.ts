import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json';
const OUT_DIR = './synapse_report/ecology/linux_kernel';

function ensureDir() {
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }
}

// Extract functional subsystem based on path
function getSubsystem(filePath: string): string {
    if (!filePath) return 'unknown';
    const parts = filePath.split('/');
    const root = parts[0];
    const twoSegmentRoots = new Set(['arch', 'drivers', 'fs', 'net', 'kernel', 'sound']);
    
    if (twoSegmentRoots.has(root) && parts.length > 1) {
        return `${root}/${parts[1]}`;
    }
    return root;
}

function isNoise(p: string): boolean {
    if (!p) return true;
    const lower = p.toLowerCase();
    
    // Extensions and files
    if (lower.endsWith('.md') || lower.endsWith('.txt') || lower.endsWith('makefile') || lower.includes('kconfig')) return true;
    
    // Directories
    const root = p.split('/')[0];
    const noiseDirs = new Set(['documentation', 'scripts', 'tools', 'samples', 'tests', 'test']);
    if (noiseDirs.has(root)) return true;
    
    return false;
}

interface RawNode { id: string; path: string; subsystem: string; isNoise: boolean; }
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
            subsystem: getSubsystem(p),
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
        if (!indices.has(id)) strongconnect(id);
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
    reachability: number;
    isNoise: boolean;
    subsystem: string;
    rawNodes: RawNode[];
}

function compressToDAG(nodes: Map<string, RawNode>, edges: RawEdge[], sccs: string[][]) {
    const nodeToScc = new Map<string, string>();
    const dagNodes = new Map<string, VirtualNode>();
    
    let sccIdCounter = 1;
    for (const scc of sccs) {
        if (scc.length > 1) {
            const sccId = `SCC_Cluster_${scc.length}_${sccIdCounter++}`;
            const sccRawNodes = scc.map(id => nodes.get(id)!);
            for (const id of scc) nodeToScc.set(id, sccId);
            
            dagNodes.set(sccId, {
                id: sccId,
                isVirtual: true,
                size: scc.length,
                internalEdges: 0,
                incomingEdges: 0,
                outgoingEdges: 0,
                reachability: 0,
                isNoise: false, // treat SCC as core logic
                subsystem: 'MIXED',
                rawNodes: sccRawNodes
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
                reachability: 0,
                isNoise: raw.isNoise,
                subsystem: raw.subsystem,
                rawNodes: [raw]
            });
        }
    }

    const dagEdgesSet = new Set<string>();
    const dagGraph = new Map<string, string[]>(); 
    for (const e of edges) {
        const u = nodeToScc.get(e.source)!;
        const v = nodeToScc.get(e.target)!;
        if (u === v) {
            if (dagNodes.get(u)!.isVirtual) dagNodes.get(u)!.internalEdges++;
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
        } catch(e) {
            // handle Max call stack in pathological cases, fall back to simple count if needed
        }
    }
}

function computeBoundaryDiversity(nodes: Map<string, RawNode>, edges: RawEdge[], nodeToScc: Map<string, string>, dagNodes: Map<string, VirtualNode>) {
    const outDiversity = new Map<string, Set<string>>();
    const inDiversity = new Map<string, Set<string>>();

    for (const e of edges) {
        const rawU = nodes.get(e.source)!;
        const rawV = nodes.get(e.target)!;
        if (rawU.subsystem !== rawV.subsystem) {
            const dagU = nodeToScc.get(e.source)!;
            const dagV = nodeToScc.get(e.target)!;
            
            if (!outDiversity.has(dagU)) outDiversity.set(dagU, new Set());
            outDiversity.get(dagU)!.add(rawV.subsystem);

            if (!inDiversity.has(dagV)) inDiversity.set(dagV, new Set());
            inDiversity.get(dagV)!.add(rawU.subsystem);
        }
    }

    const diversityScores = new Map<string, {outD: number, inD: number, totalD: number}>();
    for (const id of dagNodes.keys()) {
        const oD = outDiversity.get(id)?.size || 0;
        const iD = inDiversity.get(id)?.size || 0;
        diversityScores.set(id, { outD: oD, inD: iD, totalD: oD + iD });
    }
    return diversityScores;
}

// Pearson, Spearman, Kendall
function computePearson(x: number[], y: number[]) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i=0; i<n; i++) {
        sumX += x[i]; sumY += y[i]; sumXY += x[i]*y[i]; sumX2 += x[i]*x[i]; sumY2 += y[i]*y[i];
    }
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX*sumX) * (n * sumY2 - sumY*sumY));
    return den === 0 ? 0 : num / den;
}

function getRanks(values: number[]): number[] {
    const sorted = [...values].map((v, i) => ({v, i})).sort((a, b) => b.v - a.v);
    const ranks = new Array(values.length).fill(0);
    let i = 0;
    while(i < sorted.length) {
        let j = i;
        let sum = 0;
        while(j < sorted.length && sorted[j].v === sorted[i].v) {
            sum += j + 1;
            j++;
        }
        const avgRank = sum / (j - i);
        for(let k = i; k < j; k++) ranks[sorted[k].i] = avgRank;
        i = j;
    }
    return ranks;
}

function computeSpearman(arrX: number[], arrY: number[]) {
    return computePearson(getRanks(arrX), getRanks(arrY));
}

function computeKendallTau(arrX: number[], arrY: number[]) {
    const n = arrX.length;
    // Downsample for performance if N > 10000
    const step = n > 10000 ? Math.floor(n / 2000) : 1;
    let concordant = 0, discordant = 0;
    let pairs = 0;
    
    for(let i=0; i<n; i+=step) {
        for(let j=i+step; j<n; j+=step) {
            const dx = arrX[i] - arrX[j];
            const dy = arrY[i] - arrY[j];
            pairs++;
            if (dx * dy > 0) concordant++;
            else if (dx * dy < 0) discordant++;
        }
    }
    return pairs === 0 ? 0 : (concordant - discordant) / pairs;
}

function main() {
    ensureDir();
    console.log('Loading raw graph...');
    const { nodes, edges } = loadRawGraph();
    
    console.log('Finding SCCs...');
    const sccs = findSCCs(nodes, edges);
    
    console.log('Compressing to DAG...');
    const { dagNodes, dagGraph, nodeToScc } = compressToDAG(nodes, edges, sccs);
    
    console.log('Calculating Reachability...');
    calculateReachability(dagNodes, dagGraph);

    console.log('Calculating Boundary Diversity...');
    const divScores = computeBoundaryDiversity(nodes, edges, nodeToScc, dagNodes);
    
    const runtimeNodes = Array.from(dagNodes.values()).filter(n => !n.isNoise);

    console.log('Calculating Correlations...');
    const reachabilities = runtimeNodes.map(n => n.reachability);
    const incomings = runtimeNodes.map(n => n.incomingEdges);
    const diversities = runtimeNodes.map(n => divScores.get(n.id)!.totalD);

    const spearman_reach_inc = computeSpearman(reachabilities, incomings);
    const spearman_reach_div = computeSpearman(reachabilities, diversities);
    const tau_reach_inc = computeKendallTau(reachabilities, incomings);
    const r_reach_inc = computePearson(reachabilities, incomings);

    // Subsystem Concentration of Largest SCC
    const largestSccNodes = sccs[0].map(id => nodes.get(id)!);
    const sccCompMap = new Map<string, number>();
    for (const n of largestSccNodes) {
        if (!n.isNoise) sccCompMap.set(n.subsystem, (sccCompMap.get(n.subsystem) || 0) + 1);
    }
    const largestSccRuntimeCount = Array.from(sccCompMap.values()).reduce((a, b) => a + b, 0);
    const sccComposition = Array.from(sccCompMap.entries())
        .sort((a,b) => b[1] - a[1])
        .slice(0, 10)
        .map(([sys, count]) => `- **${sys}**: ${((count / largestSccRuntimeCount) * 100).toFixed(1)}% (${count} nodes)`)
        .join('\n');

    // Subsystem Role Profile
    const subsystemProfiles = new Map<string, { count: number, hubScore: number, victimScore: number, bridgeScore: number }>();
    for (const rn of runtimeNodes) {
        if (rn.isVirtual) continue; // Skip SCCs for pure subsystem analysis
        const sys = rn.subsystem;
        if (!subsystemProfiles.has(sys)) {
            subsystemProfiles.set(sys, { count: 0, hubScore: 0, victimScore: 0, bridgeScore: 0 });
        }
        const profile = subsystemProfiles.get(sys)!;
        profile.count++;
        profile.hubScore += rn.reachability;
        profile.victimScore += rn.incomingEdges;
        profile.bridgeScore += divScores.get(rn.id)!.totalD;
    }

    const sysList = Array.from(subsystemProfiles.entries())
        .filter(([_, data]) => data.count >= 20) // Only meaningful subsystems
        .map(([sys, data]) => ({
            sys,
            count: data.count,
            avgHub: data.hubScore / data.count,
            avgVictim: data.victimScore / data.count,
            avgBridge: data.bridgeScore / data.count
        }));

    // Rank subsystems
    const topHubSys = [...sysList].sort((a,b) => b.avgHub - a.avgHub).slice(0, 5);
    const topVictimSys = [...sysList].sort((a,b) => b.avgVictim - a.avgVictim).slice(0, 5);
    const topBridgeSys = [...sysList].sort((a,b) => b.avgBridge - a.avgBridge).slice(0, 5);

    function formatSysRank(list: any[], valKey: string) {
        return list.map((l, idx) => `${idx+1}. **${l.sys}** (${l[valKey].toFixed(2)})`).join('\n');
    }

    const report = `# Phase 20: Linux Kernel Ecological Analysis

## 1. Topological Correlation (관측된 경향성)
규모 6만 개 이상의 생태계에서 위상 지표 간의 상관관계를 추출합니다. Long-tail 분포를 고려하여 **Spearman 순위 상관계수**를 최우선으로 해석합니다.

| Correlation Pair | Spearman ($\rho$) | Kendall ($\tau$) | Pearson ($r$) | 관측 결과 해석 |
| --- | --- | --- | --- | --- |
| **Reachability vs Incoming** | ${spearman_reach_inc.toFixed(4)} | ${tau_reach_inc.toFixed(4)} | ${r_reach_inc.toFixed(4)} | ${spearman_reach_inc > 0.3 ? "약/강한 양의 상관관계 (Hub와 Victim의 중첩 현상 관측)" : spearman_reach_inc < -0.3 ? "약/강한 음의 상관관계 (Hub와 Victim의 뚜렷한 분리 현상 관측)" : "0에 수렴. (독립적 역할, 강한 연관성 없음)"} |
| **Reachability vs Diversity** | ${spearman_reach_div.toFixed(4)} | - | - | ${spearman_reach_div > 0.4 ? "Hub가 Bridge 역할을 크게 겸하는 현상 (집중화 구조)" : spearman_reach_div < 0.2 ? "Hub와 Bridge가 분화된 전문화 구조 관측" : "중간 정도의 연결성 관측"} |

---

## 2. Largest SCC Composition (서브시스템 집중도)
전체 위상을 지배하는 가장 큰 SCC(크기: ${largestSccNodes.length})가 어떤 기능들로 이루어졌는지 해부합니다.

**Top Subsystems in Largest SCC:**
${sccComposition}

---

## 3. Subsystem Role Profile (기능별 평균 위상 역할)
파일 단위가 아닌, **서브시스템(Subsystem)** 단위로 생태계에서 어떤 위상을 차지하는지 프로파일링합니다.

### 👑 Top 5 Hub Subsystems (Average Reachability)
${formatSysRank(topHubSys, 'avgHub')}

### 🛡️ Top 5 Victim (Sink) Subsystems (Average Incoming Paths)
${formatSysRank(topVictimSys, 'avgVictim')}

### 🌉 Top 5 Bridge Subsystems (Average Boundary Diversity)
${formatSysRank(topBridgeSys, 'avgBridge')}

---
**Data Summary**:
- Total Parsed Nodes: ${nodes.size}
- Total Runtime Nodes (DAG): ${runtimeNodes.length}
`;

    fs.writeFileSync(path.join(OUT_DIR, 'macro_ecology_report.md'), report);
    console.log(`Phase 20 Report Generated: ${OUT_DIR}/macro_ecology_report.md`);
}

main();
