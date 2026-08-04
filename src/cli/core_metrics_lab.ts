import * as fs from 'fs';
import * as path from 'path';

const projectDir = process.argv[2];
if (!projectDir) {
    console.error('Usage: ts-node core_metrics_lab.ts <project_dir>');
    process.exit(1);
}

const edgesPath = path.join(projectDir, 'data', 'intent_edges.json');
if (!fs.existsSync(edgesPath)) {
    console.error(`Edges not found: ${edgesPath}`);
    process.exit(1);
}

console.log('Loading edges from ' + edgesPath + ' ...');
const rawEdges: any[] = JSON.parse(fs.readFileSync(edgesPath, 'utf8'));
const prefixToRemove = '/home/dogsinatas/다운로드/linux-7.2-rc3/';

const nodeSet = new Set<string>();
const adj = new Map<string, string[]>();

for (const re of rawEdges) {
    const from = re.source.replace(prefixToRemove, '');
    const to = re.target.replace(prefixToRemove, '');
    nodeSet.add(from);
    nodeSet.add(to);
    
    // Unweighted, Undirected for generic topological metrics
    if (!adj.has(from)) adj.set(from, []);
    if (!adj.has(to)) adj.set(to, []);
    adj.get(from)!.push(to);
    if (from !== to) {
        adj.get(to)!.push(from);
    }
}

const nodeList = Array.from(nodeSet);
console.log(`Loaded ${nodeList.length} unique nodes and ${rawEdges.length} edges.\n`);

// Phase 0: Metadata Mapping (Layer & Region)
function getProjectProfile(dir: string) {
    if (dir.includes('linux')) return { name: 'Linux', maxDepth: 2, customRoots: new Set(['arch', 'drivers', 'fs', 'net', 'sound', 'include', 'tools', 'mm', 'kernel', 'block', 'crypto', 'lib']) };
    return { name: 'Default', maxDepth: 2, customRoots: new Set<string>() };
}
const profile = getProjectProfile(projectDir);

function getPhysicalRegion(nodeId: string): string {
    const parts = nodeId.replace(/\\/g, '/').split('/').filter(p => p.length > 0);
    if (parts.length === 0) return 'root';
    for (const root of profile.customRoots) {
        if (nodeId.startsWith(root + '/')) {
            const rootParts = root.split('/').length;
            if (parts.length > rootParts) return parts.slice(0, rootParts + 1).join('/');
            return root;
        }
    }
    return parts.slice(0, Math.min(parts.length - 1, profile.maxDepth)).join('/') || parts[0];
}

const nodeData = new Map<string, any>();
for (const n of nodeList) {
    let layer = 'Business';
    if (n.startsWith('include/') || n.startsWith('lib/') || n.startsWith('Documentation/') || n.startsWith('scripts/') || n.startsWith('tools/')) layer = 'Infrastructure';
    else if (n.startsWith('arch/')) layer = 'Architecture';
    
    nodeData.set(n, {
        id: n,
        layer: layer,
        region: getPhysicalRegion(n)
    });
}

// Phase 1: Compute Metrics
console.log('Computing Degree Centrality...');
for (const n of nodeList) {
    nodeData.get(n).degree = adj.get(n)?.length || 0;
}

console.log('Computing PageRank (damping 0.85, 20 iters)...');
const pr = new Map<string, number>();
const initPr = 1.0 / nodeList.length;
for (const n of nodeList) pr.set(n, initPr);
for (let iter = 0; iter < 20; iter++) {
    const nextPr = new Map<string, number>();
    for (const n of nodeList) {
        let rank = 0;
        const neighbors = adj.get(n) || [];
        for (const neighbor of neighbors) {
            const outCount = adj.get(neighbor)?.length || 0;
            if (outCount > 0) rank += pr.get(neighbor)! / outCount;
        }
        rank = (0.15 / nodeList.length) + 0.85 * rank;
        nextPr.set(n, rank);
    }
    for (const n of nodeList) pr.set(n, nextPr.get(n)!);
}
for (const n of nodeList) nodeData.get(n).pageRank = pr.get(n)!;


console.log('Computing Eigenvector Centrality (Power Iteration, 20 iters)...');
const ev = new Map<string, number>();
for (const n of nodeList) ev.set(n, 1.0);
for (let iter = 0; iter < 20; iter++) {
    const nextEv = new Map<string, number>();
    let sumSq = 0;
    for (const n of nodeList) {
        let sum = 0;
        const neighbors = adj.get(n) || [];
        for (const neighbor of neighbors) sum += ev.get(neighbor)!;
        nextEv.set(n, sum);
        sumSq += sum * sum;
    }
    const norm = Math.sqrt(sumSq) || 1;
    for (const n of nodeList) {
        const val = nextEv.get(n)! / norm;
        ev.set(n, val);
        nodeData.get(n).eigenvector = val;
    }
}

// Phase 2.5: Metric Bias Report
function printMetricBiasReport(title: string, sortKey: string) {
    console.log(`\n======================================================`);
    console.log(`=== METRIC BIAS REPORT: ${title.toUpperCase()} ===`);
    console.log(`======================================================`);
    
    const sorted = Array.from(nodeData.values()).sort((a, b) => b[sortKey] - a[sortKey]);
    const cutoffs = [100, 500, 1000];
    
    for (const limit of cutoffs) {
        const topNodes = sorted.slice(0, limit);
        
        let bCount = 0, iCount = 0, aCount = 0;
        const regionCounts = new Map<string, number>();
        
        for (const node of topNodes) {
            if (node.layer === 'Business') bCount++;
            else if (node.layer === 'Infrastructure') iCount++;
            else aCount++;
            
            regionCounts.set(node.region, (regionCounts.get(node.region) || 0) + 1);
        }
        
        const topRegions = Array.from(regionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
            
        console.log(`\n[ Top ${limit} Bias ]`);
        console.log(`  Layer Distribution:`);
        console.log(`   - Business:       ${Math.round(bCount/limit*100)}%`);
        console.log(`   - Infrastructure: ${Math.round(iCount/limit*100)}%`);
        console.log(`   - Architecture:   ${Math.round(aCount/limit*100)}%`);
        console.log(`  Top 5 Regions:`);
        for (const [r, c] of topRegions) {
            console.log(`   - ${r.padEnd(20)} ${Math.round(c/limit*100)}%`);
        }
    }
    
    console.log(`\n[ ${title} Top 10 Nodes Snapshot ]`);
    sorted.slice(0, 10).forEach((n, idx) => {
        const val = typeof n[sortKey] === 'number' && !Number.isInteger(n[sortKey]) ? n[sortKey].toFixed(6) : n[sortKey];
        console.log(`  ${idx + 1}. ${n.id} (Score: ${val})`);
    });
}

printMetricBiasReport('Degree (Traffic)', 'degree');
printMetricBiasReport('PageRank (Global Centrality)', 'pageRank');
printMetricBiasReport('Eigenvector (Hub Proximity)', 'eigenvector');

console.log('\n✅ Metric Bias Report complete. Review the distributions to find the true Core physics.');
