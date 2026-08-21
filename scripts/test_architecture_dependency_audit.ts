import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(__dirname, '../src/core');

// 1. Define layers
const LAYERS: Record<string, number> = {
    'StateAuditPipeline.ts': 27, // Reclassified as Orchestrator pipeline, not basic state
    'TransitionGrammar.ts': 25,
    'FailurePropagator.ts': 26,
    'TopologyOverlay.ts': 27,
    'TopologyMutator.ts': 27,
    'SimulationTargetSelector.ts': 27,
    'OnboardingReportBuilder.ts': 28,
    'ExecutiveReportBuilder.ts': 29,
    'SimulationSession.ts': 30,
    'ExecutiveReportDiffBuilder.ts': 30
};

// 2. Extract dependencies
interface ModuleMeta {
    file: string;
    layer: number;
    imports: string[];
}

const modules = new Map<string, ModuleMeta>();

function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDirectory(fullPath);
        } else if (file.endsWith('.ts')) {
            const layer = LAYERS[file];
            if (layer !== undefined) {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
                const imports: string[] = [];
                let match;
                while ((match = importRegex.exec(content)) !== null) {
                    const importPath = match[1];
                    // resolve to filename
                    const importedFile = path.basename(importPath) + '.ts';
                    if (LAYERS[importedFile] !== undefined) {
                        imports.push(importedFile);
                    }
                }
                modules.set(file, { file, layer, imports });
            }
        }
    }
}

scanDirectory(SRC_DIR);

console.log("=== Architecture Dependency Audit ===");

// 3. Analyze DAG and Layer Violations
let hasReverse = false;
let hasCycle = false;

console.log("\n[Dependency Map]");
for (const [file, meta] of modules.entries()) {
    console.log(`[L${meta.layer}] ${file}`);
    for (const imp of meta.imports) {
        const impLayer = LAYERS[imp];
        console.log(`  -> [L${impLayer}] ${imp}`);
        
        // Reverse dependency check
        // Rule: Higher layer (e.g. 30) can import lower layer (e.g. 29). 
        // Lower layer (e.g. 26) CANNOT import higher layer (e.g. 27).
        if (meta.layer < impLayer) {
            console.log(`     ❌ REVERSE DEPENDENCY DETECTED: L${meta.layer} -> L${impLayer}`);
            hasReverse = true;
        }
    }
}

// Check Cycles (DFS)
const visited = new Set<string>();
const stack = new Set<string>();
function dfs(file: string) {
    visited.add(file);
    stack.add(file);
    const meta = modules.get(file);
    if (meta) {
        for (const imp of meta.imports) {
            if (!visited.has(imp)) {
                dfs(imp);
            } else if (stack.has(imp)) {
                console.log(`     ❌ CYCLE DETECTED: ${file} -> ${imp}`);
                hasCycle = true;
            }
        }
    }
    stack.delete(file);
}

for (const file of modules.keys()) {
    if (!visited.has(file)) {
        dfs(file);
    }
}

console.log("\n[Audit Results]");
if (hasReverse) {
    console.log("❌ FAILED: Reverse Dependencies found.");
} else {
    console.log("✅ PASS: No Reverse Dependencies.");
}

if (hasCycle) {
    console.log("❌ FAILED: Cycles found in DAG.");
} else {
    console.log("✅ PASS: Strict DAG maintained.");
}

if (!hasReverse && !hasCycle) {
    console.log("\n🚀 AUDIT PASSED: v0.3.34.24 ~ 30 Architecture Freeze Verified.");
} else {
    process.exit(1);
}
