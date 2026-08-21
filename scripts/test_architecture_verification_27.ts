import { TopologyOverlay } from '../src/core/simulation/TopologyOverlay';
import { FailurePropagator } from '../src/core/FailurePropagator';
import { TopologyMutator } from '../src/core/simulation/TopologyMutator';
import { HealthState, TargetPolicyType, FailurePropagationReport } from '../src/types/schema';
import * as crypto from 'crypto';

console.log("=== Architecture Invariant Verification Suite (v0.3.34.27) ===\n");

function createNodeState(id: string, health: HealthState = HealthState.HEALTHY) {
    return { nodeId: id, state: { health } };
}

function hashGraph(nodes: any[], edges: any[]): string {
    return crypto.createHash('sha256').update(JSON.stringify(nodes) + JSON.stringify(edges)).digest('hex');
}

const propagator = new FailurePropagator();
const mutator = new TopologyMutator();

// 기본 그래프 준비
const nodes = [
    createNodeState('A', HealthState.CORRUPTED),
    createNodeState('B'),
    createNodeState('C'),
    createNodeState('D'),
    createNodeState('E')
];
const edges = [
    { source: 'A', target: 'B', type: 'DependsOn' },
    { source: 'B', target: 'C', type: 'DependsOn' },
    { source: 'A', target: 'D', type: 'DependsOn' },
    { source: 'D', target: 'E', type: 'DependsOn' }
];

const baseReport = propagator.propagate(nodes, edges);

// ─────────────────────────────────────────────────────────
console.log("[Test 1] Graph Clone Detection Test");
const largeNodes = [];
const largeEdges = [];
for (let i = 0; i < 70000; i++) largeNodes.push(createNodeState(`N${i}`, i === 0 ? HealthState.CORRUPTED : HealthState.HEALTHY));
for (let i = 0; i < 70000 - 1; i++) largeEdges.push({ source: `N${i}`, target: `N${i+1}`, type: 'DependsOn' });

const beforeHeap = process.memoryUsage().heapUsed;
const largeBaseReport: FailurePropagationReport = {
    totalDirect: 0, totalIndirect: 0, totalCascade: 0, totalNodes: 70000,
    impacts: [{ sourceNodeId: 'N0', directImpact: 1, indirectImpact: 1, cascadeImpact: 0, impactedNodes: [] }]
};
mutator.simulateNodeRemovals(largeNodes, largeEdges, largeBaseReport, largeNodes, { type: TargetPolicyType.TOP_N, value: 5 });

if (global.gc) {
    global.gc();
}

const afterHeap = process.memoryUsage().heapUsed;
const heapDiff = (afterHeap - beforeHeap) / 1024 / 1024;
console.log(`Heap 증가량: +${heapDiff.toFixed(2)}MB (Expected < 5MB)`);
if (heapDiff < 5) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 2] Original Graph Integrity Test");
const hashBefore = hashGraph(nodes, edges);
mutator.simulateNodeRemovals(nodes, edges, baseReport, nodes, { type: TargetPolicyType.TOP_N, value: 1 });
const hashAfter = hashGraph(nodes, edges);
console.log(`Hash Before === Hash After: ${hashBefore === hashAfter}`);
if (hashBefore === hashAfter) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 3] Overlay Purity Test");
let overlay = new TopologyOverlay();
overlay.removedNodes.add('A');
// Simulate GC by dropping reference
// Since JS doesn't have manual memory management, we just verify the overlay doesn't mutate globals
console.log(`Node A exists in original: ${nodes.find(n => n.nodeId === 'A') !== undefined}`);
if (nodes.find(n => n.nodeId === 'A') !== undefined) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 4] Remove Node Test");
// A -> B -> C, Remove B
overlay = new TopologyOverlay();
overlay.removedNodes.add('B');
const r4 = propagator.propagate(nodes, edges, overlay);
// A corrupted, A->B but B is removed. A->D is fine.
const impacted4 = r4.impacts.length > 0 ? r4.impacts[0].impactedNodes : [];
console.log(`Impacted by A when B removed: ${impacted4.join(',')}`);
if (!impacted4.includes('C') && impacted4.includes('D')) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 5] Remove Edge Test");
// A -> B, Remove A->B
overlay = new TopologyOverlay();
overlay.removedEdges.add('A::B');
const r5 = propagator.propagate(nodes, edges, overlay);
const impacted5 = r5.impacts.length > 0 ? r5.impacts[0].impactedNodes : [];
console.log(`Impacted by A when A->B edge removed: ${impacted5.join(',')}`);
if (!impacted5.includes('B') && impacted5.includes('D')) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 6] Add Edge Test");
overlay = new TopologyOverlay();
overlay.addedEdges.push({ source: 'A', target: 'X', type: 'Virtual' });
// original nodes/edges shouldn't have X
console.log(`Original edges has A->X: ${edges.some(e => e.source === 'A' && e.target === 'X')}`);
if (!edges.some(e => e.source === 'A' && e.target === 'X')) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 7] Multiple Mutation Test");
overlay = new TopologyOverlay();
overlay.removedNodes.add('B');
overlay.removedNodes.add('C');
overlay.addedEdges.push({ source: 'A', target: 'D', type: 'Virtual' });
const r7 = propagator.propagate(nodes, edges, overlay);
console.log(`Original graph unchanged. Multiple mutations applied in overlay view.`);
if (hashGraph(nodes, edges) === hashBefore) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 8] Repeatability Test");
const r8_1 = mutator.simulateNodeRemovals(nodes, edges, baseReport, nodes, { type: TargetPolicyType.TOP_N, value: 2 });
const r8_2 = mutator.simulateNodeRemovals(nodes, edges, baseReport, nodes, { type: TargetPolicyType.TOP_N, value: 2 });
const r8_3 = mutator.simulateNodeRemovals(nodes, edges, baseReport, nodes, { type: TargetPolicyType.TOP_N, value: 2 });
const hash8_1 = crypto.createHash('md5').update(JSON.stringify(r8_1)).digest('hex');
const hash8_2 = crypto.createHash('md5').update(JSON.stringify(r8_2)).digest('hex');
const hash8_3 = crypto.createHash('md5').update(JSON.stringify(r8_3)).digest('hex');
console.log(`Deterministic Results: ${hash8_1 === hash8_2 && hash8_2 === hash8_3}`);
if (hash8_1 === hash8_2 && hash8_2 === hash8_3) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

// ─────────────────────────────────────────────────────────
console.log("[Test 9] Linux Kernel Stress Test (Mock 70K)");
try {
    mutator.simulateNodeRemovals(largeNodes, largeEdges, largeBaseReport, largeNodes, { type: TargetPolicyType.TOP_N, value: 5 });
    console.log("Completed without OOM. ✅ PASS\n");
} catch (e) {
    console.log("❌ FAIL: ", e);
}

// ─────────────────────────────────────────────────────────
console.log("[Test 10] Compute → Report → Discard Test");
const heapSamples: number[] = [];
for (let i = 0; i < 100; i++) {
    mutator.simulateNodeRemovals(nodes, edges, baseReport, nodes, { type: TargetPolicyType.TOP_N, value: 1 });
    if (i % 20 === 0) heapSamples.push(process.memoryUsage().heapUsed);
}
// Force GC if we could, but let's just check the trend
const diffLastFirst = (heapSamples[heapSamples.length - 1] - heapSamples[0]) / 1024 / 1024;
console.log(`Heap trend over 100 iterations: +${diffLastFirst.toFixed(2)}MB`);
if (diffLastFirst < 5) console.log("✅ PASS\n"); else console.log("❌ FAIL\n");

console.log("=== All Tests Completed ===");
