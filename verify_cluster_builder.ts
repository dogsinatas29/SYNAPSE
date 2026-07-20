/**
 * ClusterBuilder extraction verification.
 * 
 * Usage: npx ts-node verify_cluster_builder.ts
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

console.log('\n=== ClusterBuilder Extraction Verification ===\n');
console.log(`Input: ${summaries.length} files`);

const directoryTree = buildDirectoryTree(summaries);
const nodeResult = buildNodes(summaries, directoryTree);
const clusterResult = buildClusters(nodeResult.nodes);

console.log(`\nNodeBuilder Output:`);
console.log(`  nodes:            ${nodeResult.nodes.length}`);
console.log(`  nodeIds:          ${nodeResult.nodeIds.size}`);

console.log(`\nClusterBuilder Output (pure aggregator):`);
console.log(`  clusters:         ${clusterResult.clusters.length}`);
console.log(`  clusterIds:       ${clusterResult.clusterIds.size}`);

const systemClusters = clusterResult.clusters.filter(c => c.type === 'system');
const folderClusters = clusterResult.clusters.filter(c => c.type === 'folder');
console.log(`  system clusters:  ${systemClusters.length}`);
console.log(`  folder clusters:  ${folderClusters.length}`);

let allPassed = true;

if (systemClusters.length !== 3) {
    console.error(`  ❌ Expected 3 system clusters, got ${systemClusters.length}`);
    allPassed = false;
} else {
    console.log(`  ✅ System clusters: 3 (ghosts, reserved, doc_shelf)`);
}

const expectedSystemIds = ['cluster_ghosts', 'sys_cluster_reserved', 'doc_shelf'];
for (const id of expectedSystemIds) {
    if (!clusterResult.clusterIds.has(id)) {
        console.error(`  ❌ Missing system cluster: ${id}`);
        allPassed = false;
    }
}

let nodeClusterMatch = true;
for (const n of nodeResult.nodes) {
    if (!n.cluster_id) continue;
    if (!clusterResult.clusterIds.has(n.cluster_id)) {
        console.error(`  ❌ Node ${n.id}: cluster_id=${n.cluster_id} not in clusterIds`);
        nodeClusterMatch = false;
    }
}
console.log(`  Node-cluster consistency: ${nodeClusterMatch ? '✅' : '❌'}`);
if (!nodeClusterMatch) allPassed = false;

console.log(`\n=== Result: ${allPassed ? 'ALL PASS ✅' : 'SOME FAILED ❌'} ===\n`);

process.exit(allPassed ? 0 : 1);
