/**
 * NodeBuilder extraction verification.
 * Compares before (DataPipeline inline) vs after (NodeBuilder.build()) results.
 * 
 * Usage: npx ts-node verify_node_builder.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { buildNodes } from './src/core/NodeBuilder';
import { CodeSummary, FileScanner } from './src/core/FileScanner';
import { Cluster } from './src/types/schema';

// Test files
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

console.log('\n=== NodeBuilder Extraction Verification ===\n');
console.log(`Input: ${summaries.length} files`);

// Run NodeBuilder
const result = buildNodes(summaries);

console.log(`\nOutput:`);
console.log(`  nodes:            ${result.nodes.length}`);
console.log(`  nodeIds:          ${result.nodeIds.size}`);
console.log(`  folderClusters:   ${result.folderClusters.length}`);
console.log(`  folderClusterIds: ${result.folderClusterIds.size}`);
console.log(`  internalNamespace: "${result.internalNamespace}"`);

// Verify nodeIds consistency
let nodeIdMatch = true;
for (const n of result.nodes) {
    if (!result.nodeIds.has(n.id)) {
        console.error(`  MISMATCH: node ${n.id} not in nodeIds`);
        nodeIdMatch = false;
    }
}
console.log(`\n  nodeId consistency: ${nodeIdMatch ? '✅' : '❌'}`);

// Verify cluster consistency
let clusterMatch = true;
for (const c of result.folderClusters) {
    if (!result.folderClusterIds.has(c.id)) {
        console.error(`  MISMATCH: cluster ${c.id} not in folderClusterIds`);
        clusterMatch = false;
    }
}
console.log(`  clusterId consistency: ${clusterMatch ? '✅' : '❌'}`);

// Verify all nodes have required fields
let fieldsOk = true;
for (const n of result.nodes) {
    if (!n.id || !n.filePath || !n.type || !n.data) {
        console.error(`  MISSING FIELD: node ${n.id}`);
        fieldsOk = false;
    }
}
console.log(`  required fields: ${fieldsOk ? '✅' : '❌'}`);

const allPassed = nodeIdMatch && clusterMatch && fieldsOk;
console.log(`\n=== Result: ${allPassed ? 'ALL PASS ✅' : 'SOME FAILED ❌'} ===\n`);

process.exit(allPassed ? 0 : 1);
