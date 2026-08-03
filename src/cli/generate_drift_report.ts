import * as fs from 'fs';
import * as path from 'path';
import { detectCommunities } from '../core/CommunityDetector';
import { Node, Edge, NodeType } from '../core/GraphModel';

const projectDir = process.argv[2];
if (!projectDir) {
    console.error('Usage: ts-node generate_drift_report.ts <project_dir>');
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

console.log(`Total Edges: ${rawEdges.length}`);

const nodeSet = new Set<string>();
const edges: Edge[] = [];
for (const re of rawEdges) {
    const from = re.source.replace(prefixToRemove, '');
    const to = re.target.replace(prefixToRemove, '');
    nodeSet.add(from);
    nodeSet.add(to);
    
    edges.push({
        id: `e_${edges.length}`,
        from,
        to,
        type: 'dependency',
        weight: re.evidenceCount || 1
    });
}

const nodes: Node[] = Array.from(nodeSet).map(id => ({ id, type: NodeType.FILE }));
console.log(`Loaded ${nodes.length} nodes and ${edges.length} parsed edges.`);

// Stage -1: Physical Region Granularity
function getProjectProfile(dir: string) {
    if (dir.includes('linux')) return { name: 'Linux', maxDepth: 2, customRoots: new Set(['arch', 'drivers', 'fs', 'net', 'sound', 'include', 'tools', 'mm', 'kernel']) };
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

const nodeToRegion = new Map<string, string>();
for (const n of nodes) {
    nodeToRegion.set(n.id, getPhysicalRegion(n.id));
}

// Stage -0.6: Layer Classification
type LayerType = 'Business' | 'Infrastructure' | 'Architecture';
const nodeToLayer = new Map<string, LayerType>();
let bCount = 0, iCount = 0, aCount = 0;

for (const n of nodes) {
    const id = n.id;
    let layer: LayerType = 'Business';
    if (id.startsWith('include/') || id.startsWith('lib/') || id.startsWith('Documentation/') || id.startsWith('scripts/') || id.startsWith('tools/')) {
        layer = 'Infrastructure'; iCount++;
    } else if (id.startsWith('arch/')) {
        layer = 'Architecture'; aCount++;
    } else {
        layer = 'Business'; bCount++;
    }
    nodeToLayer.set(id, layer);
}

console.log(`\n=== LAYER CLASSIFICATION ===`);
console.log(` - Business:       ${bCount} nodes (${Math.round(bCount/nodes.length*100)}%)`);
console.log(` - Infrastructure: ${iCount} nodes (${Math.round(iCount/nodes.length*100)}%)`);
console.log(` - Architecture:   ${aCount} nodes (${Math.round(aCount/nodes.length*100)}%)`);

// Entropy Calc
function calculateEntropy(counts: Map<string, number>, total: number): number {
    let entropy = 0;
    for (const count of counts.values()) {
        const p = count / total;
        if (p > 0) entropy -= p * Math.log2(p);
    }
    return entropy;
}

// Benchmark Runner
function runBenchmark(name: string, allowedLayers: Set<LayerType>) {
    console.log(`\n======================================================`);
    console.log(`=== BENCHMARK: ${name}`);
    console.log(`======================================================`);
    
    const validNodes = nodes.filter(n => allowedLayers.has(nodeToLayer.get(n.id)!));
    const validIds = new Set(validNodes.map(n => n.id));
    const validEdges = edges.filter(e => validIds.has(e.from) && validIds.has(e.to));
    
    console.log(`Running Louvain on ${validNodes.length} nodes, ${validEdges.length} edges...`);
    // suppress internal logging of Louvain for cleaner output
    const originalLog = console.log;
    console.log = () => {};
    const commResult = detectCommunities(validNodes, validEdges);
    console.log = originalLog;
    
    const commMembers = new Map<string, string[]>();
    for (const [node, comm] of commResult.nodeCommunityMap.entries()) {
        if (!commMembers.has(comm)) commMembers.set(comm, []);
        commMembers.get(comm)!.push(node);
    }
    
    console.log(`Found ${commMembers.size} communities.\n`);
    
    // Top Node Score = Business Internal Degree
    const businessInternalDegrees = new Map<string, number>();
    for (const e of validEdges) {
        if (nodeToLayer.get(e.from) === 'Business' && nodeToLayer.get(e.to) === 'Business') {
            const sComm = commResult.nodeCommunityMap.get(e.from);
            const tComm = commResult.nodeCommunityMap.get(e.to);
            if (sComm && tComm && sComm === tComm) {
                businessInternalDegrees.set(e.from, (businessInternalDegrees.get(e.from) || 0) + e.weight);
                if (e.from !== e.to) {
                    businessInternalDegrees.set(e.to, (businessInternalDegrees.get(e.to) || 0) + e.weight);
                }
            }
        }
    }
    
    const largestComms = Array.from(commMembers.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 3);
        
    for (const [commId, members] of largestComms) {
        console.log(`[${commId}] Size: ${members.length}`);
        
        let cB = 0, cI = 0, cA = 0;
        const regionCounts = new Map<string, number>();
        let businessMembersCount = 0;
        
        members.forEach(m => {
            const layer = nodeToLayer.get(m)!;
            if (layer === 'Business') { cB++; businessMembersCount++; }
            else if (layer === 'Infrastructure') cI++;
            else cA++;
            
            if (layer === 'Business') {
                const r = nodeToRegion.get(m)!;
                regionCounts.set(r, (regionCounts.get(r) || 0) + 1);
            }
        });
        
        console.log(`  Layer Distribution: Bus ${Math.round(cB/members.length*100)}% | Inf ${Math.round(cI/members.length*100)}% | Arch ${Math.round(cA/members.length*100)}%`);
        
        const entropy = calculateEntropy(regionCounts, businessMembersCount || 1);
        console.log(`  Region Entropy: ${entropy.toFixed(3)}`);
        
        const sortedRegions = Array.from(regionCounts.entries()).sort((a, b) => b[1] - a[1]);
        const purity = sortedRegions.length > 0 ? Math.round((sortedRegions[0][1] / (businessMembersCount || 1)) * 100) : 0;
        console.log(`  Top Region Purity: ${purity}%`);
        
        console.log(`  Top 3 Regions:`);
        sortedRegions.slice(0, 3).forEach(([r, count]) => {
            console.log(`   - ${r}: ${Math.round(count/(businessMembersCount || 1)*100)}%`);
        });
        
        const memberScores = members.map(m => {
            const score = businessInternalDegrees.get(m) || 0;
            return { node: m, score, layer: nodeToLayer.get(m)! };
        });
        
        const businessLogicMembers = memberScores.filter(ms => ms.layer === 'Business' && !ms.node.endsWith('.h'));
        const sortedBusiness = businessLogicMembers.sort((a, b) => b.score - a.score);
        const signature = '{' + sortedBusiness.slice(0, 3).map(ms => path.basename(ms.node)).join(', ') + '}';
        
        console.log(`  Signature (Business Internal Degree): \n   ${signature}`);
        
        console.log(`  Top 10 Nodes (Business Only):`);
        sortedBusiness.slice(0, 10).forEach((ms, idx) => {
            console.log(`   ${idx + 1}. ${ms.node} (Score: ${ms.score})`);
        });
        console.log('');
    }
}

runBenchmark('Graph A (Business Only)', new Set(['Business']));
runBenchmark('Graph B (Business + Infrastructure)', new Set(['Business', 'Infrastructure']));
runBenchmark('Graph C (Business + Architecture)', new Set(['Business', 'Architecture']));
runBenchmark('Graph D (Full Graph)', new Set(['Business', 'Infrastructure', 'Architecture']));
