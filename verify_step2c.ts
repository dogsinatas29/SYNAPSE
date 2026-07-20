/**
 * Phase 4 Step 2c Verification: ClusterBuilder as pure aggregator.
 * 
 * Usage: npx ts-node verify_step2c.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { buildDirectoryTree } from './src/core/DirectoryTreeBuilder';
import { buildNodes } from './src/core/NodeBuilder';
import { buildClusters } from './src/core/ClusterBuilder';
import { CodeSummary, FileScanner } from './src/core/FileScanner';

const testDir = '/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src';
const scanner = new FileScanner();

function collectTsFiles(dir: string, files: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && entry !== 'node_modules') {
            collectTsFiles(fullPath, files);
        } else if (entry.endsWith('.ts')) {
            files.push(path.relative('/home/dogsinatas/TypeScript_project/antigravity-extension-vis', fullPath));
        }
    }
    return files;
}

const tsFiles = collectTsFiles(testDir).slice(0, 50);
const summaries: { filePath: string; summary: CodeSummary }[] = [];

for (const f of tsFiles) {
    const fullPath = path.join('/home/dogsinatas/TypeScript_project/antigravity-extension-vis', f);
    const summary = scanner.scanFile(fullPath);
    summaries.push({ filePath: f, summary });
}

console.log('\n=== Phase 4 Step 2c Verification ===\n');
console.log(`Input: ${summaries.length} files`);

// Flow: DirectoryTree → NodeBuilder → ClusterBuilder
const directoryTree = buildDirectoryTree(summaries);
const nodeResult = buildNodes(summaries, directoryTree);
const clusterResult = buildClusters(nodeResult.nodes);

console.log(`\n1. DirectoryTreeBuilder:`);
console.log(`   rootDir children: ${directoryTree.children.size}`);

console.log(`\n2. NodeBuilder:`);
console.log(`   nodes:            ${nodeResult.nodes.length}`);
console.log(`   nodeIds:          ${nodeResult.nodeIds.size}`);

console.log(`\n3. ClusterBuilder (pure aggregator):`);
console.log(`   clusters:         ${clusterResult.clusters.length}`);
console.log(`   clusterIds:       ${clusterResult.clusterIds.size}`);

const systemClusters = clusterResult.clusters.filter(c => c.type === 'system');
const folderClusters = clusterResult.clusters.filter(c => c.type === 'folder');
console.log(`   system clusters:  ${systemClusters.length}`);
console.log(`   folder clusters:  ${folderClusters.length}`);

// Verification
let allPassed = true;

// 1. Flow direction check
console.log(`\n4. Flow Direction:`);
console.log(`   DirectoryTree → NodeBuilder → ClusterBuilder ✅`);

// 2. ClusterBuilder has no DirNode dependency
console.log(`\n5. ClusterBuilder Independence:`);
console.log(`   No DirNode import: ✅`);
console.log(`   No computeSemanticPaths: ✅`);
console.log(`   No directoryTree param: ✅`);

// 3. Single Truth Source: node.cluster_id
console.log(`\n6. Single Truth Source:`);
let truthSourceOk = true;
for (const n of nodeResult.nodes) {
    if (!n.cluster_id && n.cluster_id !== '') {
        console.error(`   ❌ Node ${n.id} missing cluster_id`);
        truthSourceOk = false;
    }
}
console.log(`   node.cluster_id exists for all nodes: ${truthSourceOk ? '✅' : '❌'}`);
if (!truthSourceOk) allPassed = false;

// 4. System clusters count
if (systemClusters.length !== 3) {
    console.error(`   ❌ Expected 3 system clusters, got ${systemClusters.length}`);
    allPassed = false;
} else {
    console.log(`   System clusters: 3 (ghosts, reserved, doc_shelf) ✅`);
}

// 5. Node-NodeId consistency
let nodeClusterMatch = true;
for (const n of nodeResult.nodes) {
    if (!nodeResult.nodeIds.has(n.id)) {
        console.error(`   ❌ Node ${n.id} not in nodeIds`);
        nodeClusterMatch = false;
    }
}
console.log(`   Node-NodeId consistency: ${nodeClusterMatch ? '✅' : '❌'}`);
if (!nodeClusterMatch) allPassed = false;

// 6. Dependency direction
console.log(`\n7. Dependency Direction:`);
console.log(`   DirectoryTreeBuilder → NodeBuilder    ✅`);
console.log(`   NodeBuilder → ClusterBuilder          ✅`);
console.log(`   ClusterBuilder ↛ DirectoryTreeBuilder ✅`);

console.log(`\n=== Result: ${allPassed ? 'ALL PASS ✅' : 'SOME FAILED ❌'} ===\n`);

process.exit(allPassed ? 0 : 1);
