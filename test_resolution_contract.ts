import { ReferenceResolver } from './src/core/ReferenceResolver';
import { GhostExpander } from './src/core/GhostExpander';
import { GhostClassifier } from './src/core/GhostClassifier';
import * as path from 'path';

// Mock dependencies
const projectRoot = '/home/dogsinatas/godot-master';
const existingNodeIds = new Set<string>([
    'main.cpp' // A parsed file
]);
// We intentionally DO NOT add the target files to existingNodeIds to simulate them being skipped/unparsed.
const existingClusterIds = new Set<string>();

const symbolIndex = { lookupSymbol: () => undefined } as any;

// Original references from different extensions (.c, .h, .inc)
const testCases = [
    {
        sourceFilePath: 'modules/navigation_2d/nav_map.cpp',
        ref: {
            target: '2d/nav_map_builder_2d.h',
            type: 'dependency',
            provenance: 'INCLUDE',
            fullPath: '/home/dogsinatas/godot-master/modules/navigation_2d/2d/nav_map_builder_2d.h'
        }
    },
    {
        sourceFilePath: 'thirdparty/freetype/src/pcf/pcfread.c',
        ref: {
            target: 'pcfutil.c',
            type: 'dependency',
            provenance: 'INCLUDE',
            fullPath: '/home/dogsinatas/godot-master/thirdparty/freetype/src/pcf/pcfutil.c'
        }
    },
    {
        sourceFilePath: 'core/variant/variant.cpp',
        ref: {
            target: 'variant_construct.inc',
            type: 'dependency',
            provenance: 'INCLUDE',
            fullPath: '/home/dogsinatas/godot-master/core/variant/variant_construct.inc'
        }
    }
];

console.log("=== 1. ReferenceResolver ===");
const resolved = ReferenceResolver.resolve(testCases, existingNodeIds, symbolIndex, projectRoot);

resolved.forEach(r => {
    console.log(`Original Target: ${r.originalTarget} -> TargetNodeId: ${r.targetId} (Kind: ${r.resolutionKind})`);
});

console.log("\n=== 2. GhostExpander ===");
const expansionResult = GhostExpander.expand(resolved, existingClusterIds, existingNodeIds, 'godot');

expansionResult.ghostNodes.forEach(node => {
    console.log(`Created Ghost Node ID: ${node.id}`);
});

console.log("\n=== 3. GhostClassifier ===");
const suffixIndex = new Set<string>(); // Mock suffix index
const classified = GhostClassifier.inspect({
    ghostNodes: expansionResult.ghostNodes,
    resolvedReferences: resolved,
    projectRoot,
    suffixIndex,
    existingNodeIds
});

classified.ghostNodes.forEach(node => {
    console.log(`Ghost Node ID: ${node.id} -> Classification: ${(node.data as any).ghost_classification}, Reason: ${(node.data as any).ghost_reason}`);
});

console.log("\n=== 4. Edge Targeting ===");
expansionResult.expandedReferences.forEach(ref => {
    console.log(`Edge Source: ${ref.sourceId} -> Edge Target (edge.to): ${ref.targetId}`);
});
