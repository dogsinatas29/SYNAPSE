import * as fs from 'fs';
import * as path from 'path';
import { dataPipeline } from './src/core/DataPipeline';
import { TarjanSCC } from './src/core/analysis/reasoning/TarjanSCC';

function getFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file === 'out' || file === '.git') continue;
        const stat = fs.statSync(path.join(dir, file));
        if (stat.isDirectory()) {
            getFiles(path.join(dir, file), fileList);
        } else {
            fileList.push(path.join(dir, file));
        }
    }
    return fileList;
}

async function run() {
    console.log('--- SYNAPSE HYGIENE VERIFICATION ---');
    const root = process.cwd();
    const files = getFiles(root);
    
    // Filter to only include common text files to avoid binary scans
    const validExts = ['.ts', '.js', '.json', '.md', '.html', '.css'];
    const filteredFiles = files.filter(f => validExts.includes(path.extname(f)));
    
    console.log(`Scanning ${filteredFiles.length} files...`);
    
    const result = await dataPipeline.processFiles(filteredFiles, root);
    
    console.log(`\nTotal Nodes: ${result.nodes.length}`);
    console.log(`Total Edges: ${result.edges.length}`);
    
    // Check Role distribution
    const roleCount = new Map<string, number>();
    for (const n of result.nodes) {
        const role = n.role || 'UNKNOWN';
        roleCount.set(role, (roleCount.get(role) || 0) + 1);
    }
    console.log('\nRole Distribution:');
    for (const [r, c] of roleCount.entries()) {
        console.log(` - ${r}: ${c}`);
    }
    
    const sccs = TarjanSCC.extract({ nodes: result.nodes, edges: result.edges });
    console.log(`\nTotal SCCs Found: ${sccs.length}`);
    
    if (sccs.length > 0) {
        const largest = sccs[0];
        console.log(`\nLargest SCC: ${largest.nodeIds.length} nodes`);
        console.log(`Largest SCC Hub ID: ${largest.hubId} (Degree: ${largest.hubDegree})`);
        
        // Let's compute Top 10 Hubs manually inside the largest SCC to show the user
        const inDegree = new Map<string, number>();
        const outDegree = new Map<string, number>();
        for (const e of result.edges) {
            if (largest.nodeIds.includes(e.source) && largest.nodeIds.includes(e.target)) {
                outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
                inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
            }
        }
        
        const degrees = largest.nodeIds.map(id => {
            return { id, deg: (inDegree.get(id) || 0) + (outDegree.get(id) || 0) };
        });
        
        degrees.sort((a, b) => b.deg - a.deg);
        console.log('\nTop 10 Hubs in Largest SCC:');
        for (const node of degrees.slice(0, 10)) {
            const nData = result.nodes.find(n => n.id === node.id);
            console.log(` - ${node.id.split('/').pop()} (Degree: ${node.deg}, Role: ${nData?.role || 'UNKNOWN'})`);
        }
    }
}

run().catch(console.error);
