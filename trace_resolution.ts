import * as fs from 'fs';
import * as path from 'path';
import { FileScanner } from './src/core/FileScanner';
import { ReferenceResolver } from './src/core/ReferenceResolver';
import { GhostExpander } from './src/core/GhostExpander';
import { GhostClassifier } from './src/core/GhostClassifier';

const projectRoot = '/home/dogsinatas/다운로드/godot-master';

async function runTrace() {
    console.log("=== 1. Check Actual Files ===");
    const file1 = path.join(projectRoot, 'modules/navigation_2d/2d/nav_map_builder_2d.h');
    const file2 = path.join(projectRoot, 'thirdparty/freetype/src/pcf/pcfutil.c');
    
    console.log(`File 1 exists: ${fs.existsSync(file1)}`);
    console.log(`File 2 exists: ${fs.existsSync(file2)}`);

    console.log("\n=== 2. Check FileScanner (Why weren't they in existingNodeIds?) ===");
    const scanner = new FileScanner();
    const sum1 = scanner.scanFile(file1);
    console.log(`Scanner output for File 1: status=${sum1.parseStatus}, nodeIds=${sum1.nodeIds?.length || 0}`);
    const sum2 = scanner.scanFile(file2);
    console.log(`Scanner output for File 2: status=${sum2.parseStatus}, nodeIds=${sum2.nodeIds?.length || 0}`);

    console.log("\n=== 3. Trace ReferenceResolver ===");
    const existingNodeIds = new Set<string>(); // Mock that they were NOT successfully parsed into graph
    const existingClusterIds = new Set<string>();
    const symbolIndex = { lookupSymbol: () => undefined } as any;

    const testCases = [
        {
            sourceFilePath: 'modules/navigation_2d/nav_map.cpp',
            ref: {
                target: '2d/nav_map_builder_2d.h',
                type: 'dependency',
                provenance: 'INCLUDE',
                fullPath: file1
            }
        },
        {
            sourceFilePath: 'thirdparty/freetype/src/pcf/pcfread.c',
            ref: {
                target: 'pcfutil.c',
                type: 'dependency',
                provenance: 'INCLUDE',
                fullPath: file2
            }
        }
    ];

    const resolved = ReferenceResolver.resolve(testCases, existingNodeIds, symbolIndex, projectRoot);

    resolved.forEach((r, idx) => {
        const tc = testCases[idx];
        console.log(`[Trace ${idx+1}]`);
        console.log(`  Original ref.target: ${tc.ref.target}`);
        console.log(`  Original ref.fullPath: ${tc.ref.fullPath}`);
        console.log(`  projectRoot: ${projectRoot}`);
        console.log(`  Calculated relPath: ${path.relative(projectRoot, tc.ref.fullPath).replace(/\\/g, '/')}`);
        console.log(`  fs.existsSync(relPath): ${fs.existsSync(tc.ref.fullPath)}`);
        console.log(`  existingNodeIds.has(relPath): false`);
        console.log(`  => Final targetNodeId: ${r.targetId}`);
        console.log(`  => Final resolutionKind: ${r.resolutionKind}`);
    });

    console.log("\n=== 4. Trace GhostExpander & Edge Output ===");
    const expansionResult = GhostExpander.expand(resolved, existingClusterIds, existingNodeIds, 'godot');
    
    expansionResult.ghostNodes.forEach(n => {
        console.log(`GhostExpander created node: ID=${n.id}, type=${n.type}`);
    });
    
    expansionResult.expandedReferences.forEach(ref => {
        console.log(`Final Edge Output: source=${ref.sourceId} -> target(edge.to)=${ref.targetId}`);
    });
}

runTrace().catch(console.error);
