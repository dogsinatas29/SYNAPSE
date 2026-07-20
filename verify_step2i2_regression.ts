import * as assert from 'assert';
import { GhostPolicy } from './src/core/GhostPolicy';
import { CodeSummary } from './src/core/FileScanner';

function createMockFixture(): { filePath: string; summary: CodeSummary }[] {
    return [
        {
            filePath: 'src/main.ts',
            summary: {
                functions: [],
                classes: [],
                references: [
                    { target: 'android.view.View', type: 'dependency', fullPath: 'android.view.View' }, // package blocked
                    { target: 'List', type: 'type', fullPath: 'java.util.List' }, // package blocked
                    { target: 'os', type: 'dependency', fullPath: 'os' }, // exact blocked
                    { target: 'MyCustomClass', type: 'dependency', fullPath: 'com.my.app.MyCustomClass' }, // valid
                    { target: 'test.utils', type: 'dependency', fullPath: 'test.utils' }, // exact 'test' blocked
                    { target: 'valid.test', type: 'dependency', fullPath: 'valid.test' } // valid
                ]
            }
        }
    ];
}

function legacyFilter(summaries: { filePath: string; summary: CodeSummary }[]) {
    const validReferences: any[] = [];
    let packageFilteredCount = 0;
    let exactFilteredCount = 0;

    for (const item of summaries) {
        for (const ref of item.summary.references) {
            if (!ref.target) continue;

            let isBlacklisted = false;
            const ghostRules = {
                packagePrefix: [
                    'android.', 'androidx.', 'java.', 'javax.', 'kotlin.', 'kotlinx.collections.', 'kotlinx.atomicfu.', 'kotlinx.datetime.',
                    'org.junit.', 'org.mockito.', 'com.bumptech.glide.', 'org.greenrobot.eventbus.', 'com.google.android.'
                ],
                exact: [
                    'os', 'sys', 'math', 'json', 'datetime', 'vscode', 'path', 'fs',
                    'context', 'nonnull', 'list', 'log', 'arraylist', 'nullable', 'r', 'view',
                    'bundle', 'layoutinflater', 'collections', 'schedulers', 'eventbus',
                    'ioexception', 'androidschedulers', 'test', 'disposable', 'date',
                    'textutils', 'intent', 'locale', 'materialalertdialogbuilder', 'static',
                    'string', 'object'
                ]
            };

            if ((ref as any).fullPath) {
                const lowerFullPath = (ref as any).fullPath.toLowerCase();
                if (ghostRules.packagePrefix.some(prefix => lowerFullPath.startsWith(prefix))) {
                    isBlacklisted = true;
                    packageFilteredCount++;
                }
            }

            const lowerId = ref.target.toLowerCase();
            if (!isBlacklisted && ghostRules.exact.some(b => lowerId === b || lowerId.startsWith(b + '.'))) {
                isBlacklisted = true;
                exactFilteredCount++;
            }

            if (!isBlacklisted) {
                validReferences.push({ sourceFilePath: item.filePath, ref });
            }
        }
    }

    return { validReferences, packageFilteredCount, exactFilteredCount };
}

function verifyStep2i2() {
    const fixture = createMockFixture();

    const legacyResult = legacyFilter(fixture);
    const newResult = GhostPolicy.filter(fixture);

    console.log("=== Step 2i-2 Regression Verification ===");
    
    assert.strictEqual(legacyResult.packageFilteredCount, newResult.packageFilteredCount, "Package filtered count mismatch");
    console.log(`packageFilteredCount: ${newResult.packageFilteredCount} (Match)`);

    assert.strictEqual(legacyResult.exactFilteredCount, newResult.exactFilteredCount, "Exact filtered count mismatch");
    console.log(`exactFilteredCount: ${newResult.exactFilteredCount} (Match)`);

    assert.strictEqual(legacyResult.validReferences.length, newResult.validReferences.length, "Valid references count mismatch");
    
    for (let i = 0; i < legacyResult.validReferences.length; i++) {
        const legacyRef = legacyResult.validReferences[i];
        const newRef = newResult.validReferences[i];
        assert.deepStrictEqual(legacyRef, newRef, `Mismatch at index ${i}`);
    }
    console.log(`validReferences: ${newResult.validReferences.length} passed (Match)`);

    console.log("Verification PASSED!");
}

verifyStep2i2();
