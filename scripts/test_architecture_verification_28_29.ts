import { OnboardingReportBuilder } from '../src/core/reporting/OnboardingReportBuilder';
import { ExecutiveReportBuilder } from '../src/core/reporting/ExecutiveReportBuilder';
import { ReportContext, FailurePropagationReport } from '../src/types/schema';
import * as fs from 'fs';
import * as path from 'path';

console.log("=== Architecture Invariant Verification Suite (v0.3.34.28/29) ===\n");

// [1] Report Purity Test
console.log("[Test 1] Report Purity Test (AST/Regex)");
const reportingDir = path.join(__dirname, '../src/core/reporting');
const files = fs.readdirSync(reportingDir).filter(f => f.endsWith('.ts'));

const forbiddenImports = ['FailurePropagator', 'TopologyMutator', 'TransitionGrammar', 'GraphTraversal', 'BFS', 'DFS'];
let purityPass = true;

for (const file of files) {
    const content = fs.readFileSync(path.join(reportingDir, file), 'utf-8');
    for (const forbidden of forbiddenImports) {
        if (content.includes(forbidden) && !content.includes(`// ${forbidden}`)) {
            // Check if it's imported (excluding type imports which might happen, but even that is risky. We just check strict string matching)
            const importRegex = new RegExp(`import.*${forbidden}`, 's');
            if (importRegex.test(content) || content.includes(`new ${forbidden}`)) {
                console.log(`❌ FAIL: Forbidden class/module ${forbidden} detected in ${file}`);
                purityPass = false;
            }
        }
    }
}
if (purityPass) console.log("✅ PASS: No forbidden analytical engines imported in Report Builders.\n");

// [2] Context Isolation & Graph Access Test
console.log("[Test 2] Context Isolation & Graph Access Test");
let isolationPass = true;
const graphAccessPatterns = [
    'GraphModel', 'NodeRepository', 'EdgeRepository', 
    'context.graph', 'context.nodes', 'context.edges', 'new Graph()'
];

for (const file of files) {
    const content = fs.readFileSync(path.join(reportingDir, file), 'utf-8');
    for (const pattern of graphAccessPatterns) {
        if (content.includes(pattern)) {
            console.log(`❌ FAIL: Direct Graph access detected: '${pattern}' found in ${file}`);
            isolationPass = false;
        }
    }
}
if (isolationPass) console.log("✅ PASS: Builders strictly rely on ReportContext. No raw graph accesses.\n");

// [2.5] AST / Hardcoding Scan Test
console.log("[Test 2.5] Hardcoding Scan Test");
let noHardcodePass = true;
const hardcodeRegex = /\.slice\(\s*0\s*,\s*\d+\s*\)/; // matches .slice(0, 10) etc.
const otherHardcodes = ['TOP_5', 'TOP_10'];

for (const file of files) {
    const content = fs.readFileSync(path.join(reportingDir, file), 'utf-8');
    if (hardcodeRegex.test(content)) {
        console.log(`❌ FAIL: Hardcoded .slice() found in ${file}`);
        noHardcodePass = false;
    }
    for (const h of otherHardcodes) {
        if (content.includes(h)) {
            console.log(`❌ FAIL: Hardcoded magic string '${h}' found in ${file}`);
            noHardcodePass = false;
        }
    }
}
if (noHardcodePass) console.log("✅ PASS: No hardcoded top-N policies detected in Builders.\n");


// Mock Data for logic tests
const mockFailureReport: FailurePropagationReport = {
    totalDirect: 10, totalIndirect: 10, totalCascade: 10, totalNodes: 100,
    impacts: [
        { sourceNodeId: 'A', directImpact: 2, indirectImpact: 2, cascadeImpact: 0, impactedNodes: ['X', 'Y', 'Z', 'W'] }, // 4
        { sourceNodeId: 'B', directImpact: 1, indirectImpact: 0, cascadeImpact: 0, impactedNodes: ['X'] } // 1
    ]
};

const mockContext: ReportContext = {
    systemStats: { totalNodes: 100, totalEdges: 200, totalClusters: 5 },
    failureReport: mockFailureReport,
    authorityNodes: ['A', 'C'],
    assemblyNodes: ['C', 'D'],
    nodeStats: [
        { nodeId: 'A', authorityScore: 100, couplingScore: 50, cohesionScore: 0.1 },
        { nodeId: 'B', authorityScore: 10, couplingScore: 5, cohesionScore: 0.9 },
        { nodeId: 'C', authorityScore: 90, couplingScore: 40, cohesionScore: 0.2 },
        { nodeId: 'D', authorityScore: 50, couplingScore: 20, cohesionScore: 0.5 },
    ],
    generatedAt: Date.now()
};

import * as crypto from 'crypto';
import { ReportConfig } from '../src/types/schema';

// Mock Config
const mockConfig: ReportConfig = {
    safeExplorationPolicy: { blastRadiusPercentile: 0.5, authorityPercentile: 0.5, couplingPercentile: 0.5, hardCap: 10 },
    blastRadiusRiskPolicy: { highRiskPercent: 0.1, mediumRiskPercent: 0.02 },
    systemHeartPolicy: { percentile: 0.5, hardCap: 5 },
    assemblyPointPolicy: { percentile: 0.5, hardCap: 10 },
    authorityCenterPolicy: { percentile: 0.5, hardCap: 10 },
    refactoringCandidatePolicy: { percentile: 0.5, hardCap: 10 },
    teamScalingPolicy: { percentile: 0.5, hardCap: 5 }
};

// [3] Onboarding Policy Test
console.log("[Test 3] Onboarding Report - Safe Exploration Zones Test");
const obBuilder = new OnboardingReportBuilder();

const getContextHash = (ctx: any) => crypto.createHash('sha256').update(JSON.stringify(ctx)).digest('hex');
const contextBeforeHash = getContextHash(mockContext);

const obReport = obBuilder.build(mockContext, mockConfig);

// B should be in Safe Exploration Zone since it has low blast, low authority, low coupling
console.log(`Safe Exploration Zones: ${obReport.safeExplorationZones.join(', ')}`);
if (obReport.safeExplorationZones.includes('B') && !obReport.safeExplorationZones.includes('A')) {
    console.log("✅ PASS: Safe Zones calculated correctly via percentile policy.\n");
} else {
    console.log("❌ FAIL: Incorrect Safe Zone calculation.\n");
}

// [4] Executive Team Scaling Risk Test
console.log("[Test 4] Executive Report - Team Scaling Risk Test");
const exBuilder = new ExecutiveReportBuilder();
const exReport = exBuilder.build(mockContext, mockConfig);

const contextAfterHash = getContextHash(mockContext);

console.log("[Test 4.5] Snapshot Consistency Test");
if (contextBeforeHash === contextAfterHash) {
    console.log("✅ PASS: Builders do not mutate ReportContext. Projection is pure.\n");
} else {
    console.log("❌ FAIL: ReportContext was mutated during report generation.\n");
}

console.log(`Team Scaling Risks: ${exReport.teamScalingRisks.join(', ')}`);
if (exReport.teamScalingRisks.includes('A') && exReport.teamScalingRisks.includes('C')) {
    console.log("✅ PASS: High authority nodes identified for scaling risks.\n");
} else {
    console.log("❌ FAIL: Authority concentration not properly reflected.\n");
}

// [5] Memory Test
console.log("[Test 5] Memory Leak Test (< 5MB Overhead)");
let heapSamples: number[] = [];
if (global.gc) global.gc();

const beforeHeap = process.memoryUsage().heapUsed;

for (let i = 0; i < 1000; i++) {
    obBuilder.build(mockContext, mockConfig);
    exBuilder.build(mockContext, mockConfig);
}

if (global.gc) global.gc();

const afterHeap = process.memoryUsage().heapUsed;
const heapDiff = (afterHeap - beforeHeap) / 1024 / 1024;
console.log(`Heap Diff after 1000 iterations: +${heapDiff.toFixed(2)}MB`);
if (heapDiff < 5) console.log("✅ PASS: Pure Projection verified. Memory stable.\n");
else console.log("❌ FAIL: Memory overhead too high.\n");

// [6] Projection Completeness Test
console.log("[Test 6] Projection Completeness Test");
const completenessFields = ['systemStats', 'failureReport', 'authorityNodes', 'assemblyNodes', 'nodeStats'];
let completenessPass = true;

const obContent = fs.readFileSync(path.join(reportingDir, 'OnboardingReportBuilder.ts'), 'utf-8');
const exContent = fs.readFileSync(path.join(reportingDir, 'ExecutiveReportBuilder.ts'), 'utf-8');
const combinedContent = obContent + exContent;

for (const field of completenessFields) {
    if (!combinedContent.includes(`context.${field}`)) {
        console.log(`❌ FAIL: '${field}' from ReportContext is never used by the builders! Projection is incomplete.`);
        completenessPass = false;
    }
}
if (completenessPass) console.log("✅ PASS: Builders consume all sections of ReportContext.\n");

// [7] Deterministic Ordering Test
console.log("[Test 7] Deterministic Ordering Test");
const tieBreakerStats = [];
for (let i = 0; i < 50; i++) {
    tieBreakerStats.push({ nodeId: `NODE_${i}`, authorityScore: 10, couplingScore: 10, cohesionScore: 10 });
}
const tieBreakerContext: ReportContext = {
    ...mockContext,
    nodeStats: tieBreakerStats,
    failureReport: {
        totalDirect: 10, totalIndirect: 10, totalCascade: 10, totalNodes: 100,
        impacts: tieBreakerStats.map(s => ({ sourceNodeId: s.nodeId, directImpact: 1, indirectImpact: 1, cascadeImpact: 1, impactedNodes: ['A', 'B'] }))
    },
    authorityNodes: tieBreakerStats.map(s => s.nodeId),
    assemblyNodes: tieBreakerStats.map(s => s.nodeId)
};

const hashSet = new Set<string>();
for (let i = 0; i < 100; i++) {
    const r1 = obBuilder.build(tieBreakerContext, mockConfig);
    const r2 = exBuilder.build(tieBreakerContext, mockConfig);
    const runHash = crypto.createHash('sha256').update(JSON.stringify({ r1, r2 })).digest('hex');
    hashSet.add(runHash);
}
if (hashSet.size === 1) {
    console.log("✅ PASS: Deterministic Ordering guaranteed across 100 identical tie-score executions.\n");
} else {
    console.log(`❌ FAIL: Deterministic ordering failed. Produced ${hashSet.size} different output variations.\n`);
}

// [8] Report Stability Test (Extreme Dataset Scale)
console.log("[Test 8] Report Stability Test (Linux Kernel scale vs AntennaPod scale)");
const extremeScaleContext: ReportContext = {
    ...mockContext,
    systemStats: { totalNodes: 70000, totalEdges: 200000, totalClusters: 1000 },
    nodeStats: Array(70000).fill(0).map((_, i) => ({ nodeId: `N${i}`, authorityScore: i % 100, couplingScore: i % 50, cohesionScore: i % 10 })),
    failureReport: {
        totalDirect: 0, totalIndirect: 0, totalCascade: 0, totalNodes: 70000,
        impacts: Array(100).fill(0).map((_, i) => ({ sourceNodeId: `N${i}`, directImpact: 1, indirectImpact: 1, cascadeImpact: 1, impactedNodes: Array(1000).fill('X') }))
    },
    authorityNodes: Array(1000).fill(0).map((_, i) => `N${i}`),
    assemblyNodes: Array(1000).fill(0).map((_, i) => `N${i}`)
};

const extremeConfig: ReportConfig = {
    safeExplorationPolicy: { blastRadiusPercentile: 0.1, authorityPercentile: 0.1, couplingPercentile: 0.1, hardCap: 15 },
    blastRadiusRiskPolicy: { highRiskPercent: 0.1, mediumRiskPercent: 0.02 },
    systemHeartPolicy: { percentile: 0.01, hardCap: 5 },
    assemblyPointPolicy: { percentile: 0.01, hardCap: 10 },
    authorityCenterPolicy: { percentile: 0.01, hardCap: 10 },
    refactoringCandidatePolicy: { percentile: 0.01, hardCap: 10 },
    teamScalingPolicy: { percentile: 0.01, hardCap: 5 }
};

const extremeObReport = obBuilder.build(extremeScaleContext, extremeConfig);
const extremeExReport = exBuilder.build(extremeScaleContext, extremeConfig);

let stabilityPass = true;
if (extremeObReport.systemHeart.length === 0 || extremeObReport.systemHeart.length > 5) stabilityPass = false;
if (extremeObReport.safeExplorationZones.length > 15) stabilityPass = false;
if (extremeExReport.topRisks.length === 0 || extremeExReport.topRisks.length > 5) stabilityPass = false;
if (extremeExReport.authorityConcentration.topNodes.length === 0 || extremeExReport.authorityConcentration.topNodes.length > 10) stabilityPass = false;

if (stabilityPass) {
    console.log("✅ PASS: Percentile + HardCap policies gracefully handle 70,000 node graphs without UI explosion or collapse.\n");
} else {
    console.log("❌ FAIL: Report stability compromised on extreme dataset scale.\n");
}

console.log("=== All Tests Completed ===");
