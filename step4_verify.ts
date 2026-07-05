/**
 * Step 4-9 Verification Harness
 * 
 * 1. Registry Route (10 languages)
 * 2. Golden Sample
 * 3. Scanner Ownership
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScannerRegistry } from './src/core/ScannerRegistry';
import { JsTsScanner } from './src/core/JsTsScanner';
import { PythonScanner } from './src/core/PythonScanner';
import { ShellScanner } from './src/core/ShellScanner';
import { MarkdownScanner } from './src/core/MarkdownScanner';
import { JavaScanner } from './src/core/JavaScanner';
import { KotlinScanner } from './src/core/KotlinScanner';
import { CppScanner } from './src/core/CppScanner';
import { RustScanner } from './src/core/RustScanner';
import { SqlScanner } from './src/core/SqlScanner';
import { ConfigScanner } from './src/core/ConfigScanner';
import { FileScanner } from './src/core/FileScanner';

ScannerRegistry.getInstance().register(new JsTsScanner());
ScannerRegistry.getInstance().register(new PythonScanner());
ScannerRegistry.getInstance().register(new ShellScanner());
ScannerRegistry.getInstance().register(new MarkdownScanner());
ScannerRegistry.getInstance().register(new JavaScanner());
ScannerRegistry.getInstance().register(new KotlinScanner());
ScannerRegistry.getInstance().register(new CppScanner());
ScannerRegistry.getInstance().register(new RustScanner());
ScannerRegistry.getInstance().register(new SqlScanner());
ScannerRegistry.getInstance().register(new ConfigScanner());

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, label: string) {
    if (condition) {
        passCount++;
        console.log(`  ✅ ${label}`);
    } else {
        failCount++;
        console.log(`  ❌ ${label}`);
    }
}

// ============================================================
// 1. Registry Route Verification (10 languages)
// ============================================================
console.log('\n=== 1. REGISTRY ROUTE VERIFICATION ===\n');

const routeTests: [string, string][] = [
    ['README.md',         'MarkdownScanner'],
    ['build.sh',          'ShellScanner'],
    ['main.py',           'PythonScanner'],
    ['index.ts',          'JsTsScanner'],
    ['component.tsx',     'JsTsScanner'],
    ['app.js',            'JsTsScanner'],
    ['page.jsx',          'JsTsScanner'],
    ['MainActivity.java', 'JavaScanner'],
    ['App.kt',            'KotlinScanner'],
    ['build.gradle.kts',  'KotlinScanner'],
    ['main.cpp',          'CppScanner'],
    ['header.h',          'CppScanner'],
    ['source.c',          'CppScanner'],
    ['util.hpp',          'CppScanner'],
    ['impl.cc',           'CppScanner'],
    ['lib.rs',            'RustScanner'],
    ['schema.sql',        'SqlScanner'],
    ['config.json',       'ConfigScanner'],
    ['settings.yaml',     'ConfigScanner'],
    ['Cargo.toml',        'ConfigScanner'],
];

for (const [filename, expectedScanner] of routeTests) {
    const ext = path.extname(filename);
    const scanner = ScannerRegistry.getInstance().getScanner(ext);
    const actualName = scanner ? scanner.constructor.name : 'NONE';
    assert(actualName === expectedScanner, `${filename.padEnd(22)} ext=${ext.padEnd(6)} → ${actualName} (expected ${expectedScanner})`);
}

// ============================================================
// 2. Golden Sample Verification
// ============================================================
console.log('\n=== 2. GOLDEN SAMPLE VERIFICATION ===\n');

const goldenSamples = [
    'src/core/DataPipeline.ts',
    'src/core/FileScanner.ts',
    'src/extension.ts',
];

const scanner = new FileScanner();

for (const sample of goldenSamples) {
    const fullPath = path.join(__dirname, sample);
    if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠️  SKIP: ${sample} (not found)`);
        continue;
    }
    const summary = scanner.scanFile(fullPath);
    console.log(`  📄 ${sample}`);
    console.log(`     classes:    ${summary.classes.length}`);
    console.log(`     functions:  ${summary.functions.length}`);
    console.log(`     references: ${summary.references.length}`);
    console.log(`     hasAtomic:  ${summary.hasAtomicSignature}`);
    console.log(`     hasImport:  ${summary.hasImportSignature}`);
    console.log();
}

// ============================================================
// 3. Scanner Ownership Verification
// ============================================================
console.log('=== 3. SCANNER OWNERSHIP VERIFICATION ===\n');

const fileScannerPath = path.join(__dirname, 'src/core/FileScanner.ts');
const fileScannerContent = fs.readFileSync(fileScannerPath, 'utf-8');

// ALL migrated parsers should NOT be in FileScanner
const migratedParsers = ['parseJavaScript', 'parsePython', 'parseShell', 'parseMarkdown', 'parseJava', 'parseKotlin', 'parseCpp', 'parseRust', 'parseSql', 'parseConfig'];
for (const parser of migratedParsers) {
    const count = (fileScannerContent.match(new RegExp(parser, 'g')) || []).length;
    assert(count === 0, `${parser} in FileScanner.ts: ${count} matches (expected 0)`);
}

// Scanner files should exist and have parse logic
const scannerFiles: [string, string][] = [
    ['src/core/JsTsScanner.ts', 'JsTsScanner'],
    ['src/core/PythonScanner.ts', 'PythonScanner'],
    ['src/core/ShellScanner.ts', 'ShellScanner'],
    ['src/core/MarkdownScanner.ts', 'MarkdownScanner'],
    ['src/core/JavaScanner.ts', 'JavaScanner'],
    ['src/core/KotlinScanner.ts', 'KotlinScanner'],
    ['src/core/CppScanner.ts', 'CppScanner'],
    ['src/core/RustScanner.ts', 'RustScanner'],
    ['src/core/SqlScanner.ts', 'SqlScanner'],
    ['src/core/ConfigScanner.ts', 'ConfigScanner'],
];

for (const [scannerPath, name] of scannerFiles) {
    const fullPath = path.join(__dirname, scannerPath);
    if (!fs.existsSync(fullPath)) {
        assert(false, `${name} exists`);
        continue;
    }
    assert(true, `${name} exists`);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasParse = content.includes('parse(');
    assert(hasParse, `${name} has parse() method`);
}

// ScannerRegistry integration check
assert(fileScannerContent.includes('ScannerRegistry.getInstance().scan'), `FileScanner uses ScannerRegistry.scan()`);

// ============================================================
// Summary
// ============================================================
console.log('\n=== VERIFICATION SUMMARY ===\n');
console.log(`  PASS: ${passCount}`);
console.log(`  FAIL: ${failCount}`);
console.log(`  TOTAL: ${passCount + failCount}`);

if (failCount === 0) {
    console.log('\n  🎉 Step 4-9 ALL CHECKS PASSED\n');
    process.exit(0);
} else {
    console.log('\n  💥 Step 4-9 FAILED — review failures above\n');
    process.exit(1);
}
