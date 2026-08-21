import { FailurePropagator } from '../src/core/FailurePropagator';
import { HealthState } from '../src/types/schema';

console.log("=== Architecture Verification Tests (v0.3.34.26) ===");
const propagator = new FailurePropagator();

function createNodeState(id: string, health: HealthState = HealthState.HEALTHY) {
    return { nodeId: id, state: { health } };
}

// ─────────────────────────────────────────────────────────
console.log("\n[Test 1] Self Consistency Test (Depth Calculation)");
// A -> B -> C -> D
const nodes1 = [
    createNodeState('A', HealthState.CORRUPTED),
    createNodeState('B'),
    createNodeState('C'),
    createNodeState('D')
];
const edges1 = [
    { source: 'A', target: 'B', type: 'DependsOn' },
    { source: 'B', target: 'C', type: 'DependsOn' },
    { source: 'C', target: 'D', type: 'DependsOn' }
];

const res1 = propagator.propagate(nodes1, edges1);
console.log(`Direct: ${res1.totalDirect} (Expected 1)`);
console.log(`Indirect: ${res1.totalIndirect} (Expected 1)`);
console.log(`Cascade: ${res1.totalCascade} (Expected 1)`);
if (res1.totalDirect === 1 && res1.totalIndirect === 1 && res1.totalCascade === 1) console.log("✅ PASS"); else console.log("❌ FAIL");

// ─────────────────────────────────────────────────────────
console.log("\n[Test 2] Branch Explosion Test (BFS Check)");
// A -> B, A -> C, A -> D
const nodes2 = [
    createNodeState('A', HealthState.CORRUPTED),
    createNodeState('B'),
    createNodeState('C'),
    createNodeState('D')
];
const edges2 = [
    { source: 'A', target: 'B', type: 'DependsOn' },
    { source: 'A', target: 'C', type: 'DependsOn' },
    { source: 'A', target: 'D', type: 'DependsOn' }
];

const res2 = propagator.propagate(nodes2, edges2);
console.log(`Direct: ${res2.totalDirect} (Expected 3)`);
console.log(`Indirect: ${res2.totalIndirect} (Expected 0)`);
console.log(`Cascade: ${res2.totalCascade} (Expected 0)`);
if (res2.totalDirect === 3 && res2.totalIndirect === 0 && res2.totalCascade === 0) console.log("✅ PASS"); else console.log("❌ FAIL");

// ─────────────────────────────────────────────────────────
console.log("\n[Test 3] Cycle Protection Test (A -> B -> C -> A)");
const nodes3 = [
    createNodeState('A', HealthState.CORRUPTED),
    createNodeState('B'),
    createNodeState('C')
];
const edges3 = [
    { source: 'A', target: 'B', type: 'DependsOn' },
    { source: 'B', target: 'C', type: 'DependsOn' },
    { source: 'C', target: 'A', type: 'DependsOn' }
];

const res3 = propagator.propagate(nodes3, edges3);
// Should not infinite loop, output shouldn't count A since A is the source and already unhealthy
console.log(`Impacted count: ${res3.impacts[0].impactedNodes.length} (Expected 2, B and C)`);
if (res3.impacts[0].impactedNodes.length === 2) console.log("✅ PASS"); else console.log("❌ FAIL");

// ─────────────────────────────────────────────────────────
console.log("\n[Test 4] Depth Limit Test (MAX_DEPTH=3)");
// A -> B -> C -> D -> E -> F
const nodes4 = [
    createNodeState('A', HealthState.CORRUPTED),
    createNodeState('B'),
    createNodeState('C'),
    createNodeState('D'),
    createNodeState('E'),
    createNodeState('F')
];
const edges4 = [
    { source: 'A', target: 'B', type: 'DependsOn' },
    { source: 'B', target: 'C', type: 'DependsOn' },
    { source: 'C', target: 'D', type: 'DependsOn' },
    { source: 'D', target: 'E', type: 'DependsOn' },
    { source: 'E', target: 'F', type: 'DependsOn' }
];

const res4 = propagator.propagate(nodes4, edges4);
console.log(`Direct: ${res4.totalDirect} (Expected 1)`);
console.log(`Indirect: ${res4.totalIndirect} (Expected 1)`);
console.log(`Cascade: ${res4.totalCascade} (Expected 1)`); // B is direct, C is indirect, D is cascade (depth 3). E (depth 4) and F (depth 5) are ignored
if (res4.totalDirect === 1 && res4.totalIndirect === 1 && res4.totalCascade === 1 && res4.impacts[0].impactedNodes.length === 3) console.log("✅ PASS"); else console.log("❌ FAIL");

// ─────────────────────────────────────────────────────────
console.log("\n[Test 5] Impact Node Limit Test (5000 nodes)");
const nodes5: any[] = [createNodeState('Root', HealthState.CORRUPTED)];
const edges5: any[] = [];
for (let i = 1; i <= 5000; i++) {
    nodes5.push(createNodeState(`N${i}`));
    edges5.push({ source: 'Root', target: `N${i}`, type: 'DependsOn' });
}

const res5 = propagator.propagate(nodes5, edges5);
console.log(`Impacted count: ${res5.impacts[0].impactedNodes.length} (Expected 1000)`);
if (res5.impacts[0].impactedNodes.length === 1000) console.log("✅ PASS"); else console.log("❌ FAIL");

// ─────────────────────────────────────────────────────────
console.log("\n[Test 6] State Mutation Test (Immutable Check)");
const nodes6 = [
    createNodeState('A', HealthState.CORRUPTED),
    createNodeState('B', HealthState.HEALTHY)
];
const edges6 = [
    { source: 'A', target: 'B', type: 'DependsOn' }
];
// deep copy to compare later
const originalStateB = JSON.parse(JSON.stringify(nodes6[1]));

const res6 = propagator.propagate(nodes6, edges6);
console.log(`Original Health: ${originalStateB.state.health}`);
console.log(`Current Health : ${nodes6[1].state.health}`);
if (originalStateB.state.health === nodes6[1].state.health) console.log("✅ PASS"); else console.log("❌ FAIL");

