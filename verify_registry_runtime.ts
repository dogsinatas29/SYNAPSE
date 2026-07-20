/**
 * Runtime verification: ScannerRegistry actually dispatches to Language Scanners.
 * 
 * Usage: npx ts-node verify_registry_runtime.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileScanner } from './src/core/FileScanner';
import { ScannerRegistry } from './src/core/ScannerRegistry';
import { JsTsScanner } from './src/core/JsTsScanner';
import { PythonScanner } from './src/core/PythonScanner';
import { JavaScanner } from './src/core/JavaScanner';
import { RustScanner } from './src/core/RustScanner';

// Register scanners
const registry = ScannerRegistry.getInstance();
registry.register(new JsTsScanner());
registry.register(new PythonScanner());
registry.register(new JavaScanner());
registry.register(new RustScanner());

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'synapse-verify-'));

function writeTestFile(name: string, content: string): string {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
}

const testFiles = [
    {
        name: 'test.ts',
        content: `import { Foo } from './foo';\nclass MyClass { method() {} }\nfunction helper() {}`,
        expectedScanner: 'JsTsScanner',
    },
    {
        name: 'test.py',
        content: `from os import path\nclass MyService:\n    def run(self): pass\ndef main(): pass`,
        expectedScanner: 'PythonScanner',
    },
    {
        name: 'test.java',
        content: `package com.example;\nimport java.util.List;\npublic class Main { void run() {} }`,
        expectedScanner: 'JavaScanner',
    },
    {
        name: 'test.rs',
        content: `use std::collections::HashMap;\npub struct Config { name: String }\nfn main() {}`,
        expectedScanner: 'RustScanner',
    },
];

const scanner = new FileScanner();
let allPassed = true;

console.log('\n=== ScannerRegistry Runtime Verification ===\n');

for (const tf of testFiles) {
    const filePath = writeTestFile(tf.name, tf.content);
    const summary = scanner.scanFile(filePath);
    const ext = path.extname(tf.name);
    const usedScanner = registry.getScanner(ext);
    const actualName = usedScanner?.constructor.name || 'NONE';
    const passed = actualName === tf.expectedScanner;

    if (!passed) allPassed = false;

    console.log(`${tf.name.padEnd(12)} → ${actualName.padEnd(20)} (expected: ${tf.expectedScanner}) ${passed ? '✅' : '❌'}`);
    console.log(`  classes=${summary.classes.length} functions=${summary.functions.length} references=${summary.references.length}`);
}

// Cleanup
fs.rmSync(tmpDir, { recursive: true });

console.log(`\n=== Result: ${allPassed ? 'ALL PASS ✅' : 'SOME FAILED ❌'} ===\n`);

// Duplicate registration test
const registry2 = ScannerRegistry.getInstance();
registry2.register(new JsTsScanner());
registry2.register(new PythonScanner());
const count = registry2.count();
console.log(`Duplicate registration guard: count=${count} (expected: 4) ${count === 4 ? '✅' : '❌'}`);

process.exit(allPassed && count === 4 ? 0 : 1);
