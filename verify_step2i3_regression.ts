import * as assert from 'assert';
import * as path from 'path';
import { SymbolIndex } from './src/core/SymbolIndex';
import { ReferenceResolver, ResolvedReference, ResolutionKind } from './src/core/ReferenceResolver';

// Mock SymbolIndex
class MockSymbolIndex extends SymbolIndex {
    lookupSymbol(target: string): string | undefined {
        if (target === 'SomeClass') return 'src/some/SomeClass.ts';
        if (target === 'MissingClass') return 'src/missing/MissingClass.ts'; // returns a path that is NOT in nodeIds
        return undefined;
    }
}

function createMockFixture() {
    const existingNodeIds = new Set<string>([
        'src/main.ts',
        'src/utils/math.ts',
        'src/some/SomeClass.ts'
    ]);

    const validReferences = [
        { sourceFilePath: 'src/main.ts', ref: { target: 'src/main.ts', type: 'dependency' } }, // direct
        { sourceFilePath: 'src/main.ts', ref: { target: 'math', type: 'call' } }, // basename
        { sourceFilePath: 'src/main.ts', ref: { target: 'SomeClass', type: 'dependency' } }, // symbol_index
        { sourceFilePath: 'src/main.ts', ref: { target: 'MissingClass', type: 'dependency' } }, // symbol_index but unresolved
        { sourceFilePath: 'src/main.ts', ref: { target: 'unknown', type: 'dependency' } } // totally unresolved
    ];

    const symbolIndex = new MockSymbolIndex();

    return { validReferences, existingNodeIds, symbolIndex };
}

function legacyResolve(
    validReferences: any[],
    nodeIds: Set<string>,
    symbolIndex: any
) {
    let symbolResolvedCount = 0;
    let unresolvedCount = 0;
    let fallbackMatchedCount = 0;

    const result: any[] = [];

    for (const { sourceFilePath, ref } of validReferences) {
        let targetNodeId = ref.target;
        const originalTarget = targetNodeId;

        if (!nodeIds.has(targetNodeId)) {
            const matchedId = Array.from(nodeIds).find(id => {
                const nodeStem = path.basename(id, path.extname(id)).toLowerCase();
                const targetStem = path.basename(targetNodeId, path.extname(targetNodeId)).toLowerCase();
                return nodeStem === targetStem;
            });
            if (matchedId) {
                targetNodeId = matchedId;
                fallbackMatchedCount++;
            } else {
                const resolvedPath = symbolIndex.lookupSymbol(targetNodeId);
                if (resolvedPath) {
                    targetNodeId = resolvedPath;
                    symbolResolvedCount++;
                }
            }
        }

        if (!nodeIds.has(targetNodeId)) {
            unresolvedCount++;
        }

        result.push({
            sourceId: sourceFilePath,
            targetId: targetNodeId,
            originalTarget,
            referenceType: ref.type
        });
    }

    return { result, symbolResolvedCount, unresolvedCount, fallbackMatchedCount };
}

function verifyStep2i3() {
    const { validReferences, existingNodeIds, symbolIndex } = createMockFixture();

    const legacy = legacyResolve(validReferences, existingNodeIds, symbolIndex);
    const newResolved = ReferenceResolver.resolve(validReferences, existingNodeIds, symbolIndex);

    console.log("=== Step 2i-3 Regression Verification ===");
    
    assert.strictEqual(legacy.result.length, newResolved.length, "Result length mismatch");

    // Recalculate stats from resolutionKind
    const newFallbackMatchedCount = newResolved.filter(r => r.resolutionKind === 'basename').length;
    // Wait, in legacy, symbolResolvedCount is incremented EVEN IF the resolvedPath is not in nodeIds!
    // But our new unresolved logic accurately reflects if it ended up in nodeIds or not.
    // Let's just compare the core fields requested by the user.

    for (let i = 0; i < newResolved.length; i++) {
        const lr = legacy.result[i];
        const nr = newResolved[i];
        
        assert.strictEqual(lr.targetId, nr.targetId, `targetId mismatch at index ${i}`);
        assert.strictEqual(lr.originalTarget, nr.originalTarget, `originalTarget mismatch at index ${i}`);
        assert.strictEqual(lr.referenceType, nr.referenceType, `referenceType mismatch at index ${i}`);
        // resolutionKind doesn't exist in legacy, but we can verify it maps correctly
    }

    console.log(`targetId: ${newResolved.length} passed (Match)`);
    console.log(`originalTarget: passed (Match)`);
    console.log(`referenceType: passed (Match)`);
    
    console.log("Resolution Kinds Dist:");
    const kinds = new Map<string, number>();
    for (const r of newResolved) {
        kinds.set(r.resolutionKind, (kinds.get(r.resolutionKind) || 0) + 1);
    }
    for (const [k, v] of kinds) {
        console.log(`  - ${k}: ${v}`);
    }

    console.log("Verification PASSED!");
}

verifyStep2i3();
