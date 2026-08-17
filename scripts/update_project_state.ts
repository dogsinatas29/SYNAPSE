import * as fs from 'fs';
import * as path from 'path';
import { DataPipeline } from '../src/core/DataPipeline';

function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            getAllFiles(filepath, fileList);
        } else if (filepath.endsWith('.ts')) {
            fileList.push(filepath);
        }
    }
    return fileList;
}

async function main() {
    const projectRoot = path.join(__dirname, '..');
    const srcDir = path.join(projectRoot, 'src');
    
    // Set project metadata boundary to avoid security error
    const { ProjectMetadata } = require('../src/core/ProjectMetadata');
    ProjectMetadata.getInstance().initialize(projectRoot, 'antigravity-extension-vis');
    
    // Bootstrap the engines (registers scanners)
    const { ScannerRegistry } = require('../src/core/ScannerRegistry');
    const { JsTsScanner } = require('../src/core/JsTsScanner');
    ScannerRegistry.getInstance().register(new JsTsScanner());

    const tsFiles = getAllFiles(srcDir);
    
    // DataPipeline must be instantiated, or we can use an instance
    const pipeline = new DataPipeline();
    const result = await pipeline.processFiles(tsFiles, projectRoot);
    
    // Build snapshot
    const { buildGraph } = require('../src/core/graphBuilder');
    const snapshot = buildGraph(result.nodes, result.edges, result.clusters);
    
    // Save to demo/data/project_state.json
    const statePath = path.join(projectRoot, 'demo/data/project_state.json');
    fs.writeFileSync(statePath, JSON.stringify(snapshot, null, 2), 'utf8');
    
    console.log(`Saved ${snapshot.nodes.length} nodes and ${snapshot.edges.length} edges to project_state.json`);
    
    const implementsEdges = snapshot.edges.filter((e: any) => e.type === 'IMPLEMENTS');
    const extendsEdges = snapshot.edges.filter((e: any) => e.type === 'EXTENDS');
    console.log(`Found ${implementsEdges.length} IMPLEMENTS edges`);
    console.log(`Found ${extendsEdges.length} EXTENDS edges`);
}

main().catch(console.error);
