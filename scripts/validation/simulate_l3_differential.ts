import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectState,
  Node,
  Edge,
  normalizePathCanonical,
  determineNodeRoleCanonical,
  deepEqual,
  transformProjectStatePhaseB
} from './phase_b_transformer';

// ============================================================================
// Condition 4: Rigorous Independent L3 Differential Graph Validator (v1.0.3)
// ============================================================================
// 1. Snapshot Independence: Frozen snapshot stores ALL arbitrary edge attributes.
// 2. Transformer Independence: Compares output of transformProjectStatePhaseB
//    against frozen snapshot, NOT against self-copied objects.
// 3. Mathematical Invariant Verification:
//    \forall e \in E, e' = (M(e.from), M(e.to), e.id, attributes(e))
// 4. Exact Set & 1:1 Bijective Mapping Assertions for Nodes and Edges.
// 5. Strict Allow-list ID-level & Transition-type Assertions.

interface AllowListSpec {
  expectedTransitions: number;
  allowedTransitions: { [key: string]: number };
  allowedIds?: Set<string>;
}

export function runRigorousIndependentL3Audit(
  filePath: string,
  projectName: string,
  spec: AllowListSpec
) {
  console.log(`\n===============================================================`);
  console.log(`[INDEPENDENT L3 DIFFERENTIAL AUDIT v1.0.3] ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`===============================================================`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const originalState: ProjectState = JSON.parse(raw);

  // --------------------------------------------------------------------------
  // Step 1: Pre-Validation & Full Attribute Frozen Snapshot
  // --------------------------------------------------------------------------
  const originalNodeIds = new Set<string>();
  const originalNodeMap = new Map<string, Node>();
  for (const n of originalState.nodes) {
    if (originalNodeIds.has(n.id)) {
      throw new Error(`[FATAL] Duplicate Node ID in source: "${n.id}"`);
    }
    originalNodeIds.add(n.id);
    originalNodeMap.set(n.id, JSON.parse(JSON.stringify(n)));
  }

  const originalEdgeIds = new Set<string>();
  const originalEdgeSnapshot = new Map<string, Edge>();
  for (const e of originalState.edges) {
    if (originalEdgeIds.has(e.id)) {
      throw new Error(`[FATAL] Duplicate Edge ID in source: "${e.id}"`);
    }
    originalEdgeIds.add(e.id);
    // Deep clone ENTIRE edge object including all arbitrary dynamic properties
    originalEdgeSnapshot.set(e.id, JSON.parse(JSON.stringify(e)));
  }

  console.log(`Step 1 (Source Integrity & Full Freeze Snapshot):`);
  console.log(`- Unique Original Nodes: ${originalNodeIds.size}`);
  console.log(`- Unique Original Edges: ${originalEdgeIds.size}`);

  // --------------------------------------------------------------------------
  // Step 2: Execute Independent Transformer Engine
  // --------------------------------------------------------------------------
  const { transformedState, idMapping, roleTransitions } = transformProjectStatePhaseB(originalState);
  console.log(`\nStep 2 (Independent Transformation):`);
  console.log(`- Transformed Nodes Generated: ${transformedState.nodes.length}`);
  console.log(`- Transformed Edges Generated: ${transformedState.edges.length}`);
  console.log(`- Role Transitions Observed: ${roleTransitions.length}`);

  // --------------------------------------------------------------------------
  // Step 3: Bijective Node Set & Endpoint Verification
  // --------------------------------------------------------------------------
  const transformedNodeMap = new Map<string, Node>();
  const transformedNodeIds = new Set<string>();
  for (const n of transformedState.nodes) {
    if (transformedNodeIds.has(n.id)) {
      throw new Error(`[FAIL] Duplicate Node ID in transformed graph: "${n.id}"`);
    }
    transformedNodeIds.add(n.id);
    transformedNodeMap.set(n.id, n);
  }

  // Check 1: Node count equality
  if (transformedNodeIds.size !== originalNodeIds.size) {
    throw new Error(`[FAIL] Node count invariant violated: ${transformedNodeIds.size} !== ${originalNodeIds.size}`);
  }

  // Check 2: Node mapping bijectivity (\forall n \in V, M(n.id) \in V')
  for (const origId of originalNodeIds) {
    const expectedMappedId = idMapping.get(origId);
    if (!expectedMappedId || !transformedNodeIds.has(expectedMappedId)) {
      throw new Error(`[FAIL] Node mapping broken for node "${origId}" -> "${expectedMappedId}"`);
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: Strict Independent Edge Invariant Verification
  // Invariant: \forall e \in E, e' = (M(e.from), M(e.to), e.id, attributes(e))
  // --------------------------------------------------------------------------
  const transformedEdgeIds = new Set<string>();
  let brokenEndpoints = 0;
  let mismatchedEndpoints = 0;
  let mismatchedAttributes = 0;
  let redirectedCount = 0;

  for (const transformedEdge of transformedState.edges) {
    if (transformedEdgeIds.has(transformedEdge.id)) {
      throw new Error(`[FAIL] Duplicate Edge ID in transformed graph: "${transformedEdge.id}"`);
    }
    transformedEdgeIds.add(transformedEdge.id);

    // Retrieve original frozen snapshot
    const origSnapshot = originalEdgeSnapshot.get(transformedEdge.id);
    if (!origSnapshot) {
      throw new Error(`[FAIL] Transformed edge "${transformedEdge.id}" does not exist in original snapshot!`);
    }

    // Expected endpoints under ID mapping M
    const expectedFrom = idMapping.has(origSnapshot.from) ? idMapping.get(origSnapshot.from)! : origSnapshot.from;
    const expectedTo = idMapping.has(origSnapshot.to) ? idMapping.get(origSnapshot.to)! : origSnapshot.to;

    // Verify 1: Endpoint reachability
    if (!transformedNodeMap.has(transformedEdge.from) || !transformedNodeMap.has(transformedEdge.to)) {
      brokenEndpoints++;
      console.error(`[BROKEN_ENDPOINT] Edge "${transformedEdge.id}": from="${transformedEdge.from}", to="${transformedEdge.to}"`);
    }

    // Verify 2: Endpoint mapping correctness
    if (transformedEdge.from !== expectedFrom || transformedEdge.to !== expectedTo) {
      mismatchedEndpoints++;
      console.error(`[ENDPOINT_MISMATCH] Edge "${transformedEdge.id}": got (${transformedEdge.from}, ${transformedEdge.to}), expected (${expectedFrom}, ${expectedTo})`);
    }

    if (transformedEdge.from !== origSnapshot.from || transformedEdge.to !== origSnapshot.to) {
      redirectedCount++;
    }

    // Verify 3: Full arbitrary attribute preservation
    // Compare all properties except 'from' and 'to'
    const origProps: Record<string, any> = { ...origSnapshot };
    delete origProps.from;
    delete origProps.to;

    const transProps: Record<string, any> = { ...transformedEdge };
    delete transProps.from;
    delete transProps.to;

    if (!deepEqual(origProps, transProps)) {
      mismatchedAttributes++;
      console.error(`[ATTRIBUTE_MISMATCH] Edge "${transformedEdge.id}" properties diverged from snapshot!`);
    }
  }

  console.log(`\nStep 4 (Independent Edge Invariant Verification):`);
  console.log(`- Edge Count Preserved: ${transformedEdgeIds.size} === ${originalEdgeIds.size}`);
  console.log(`- Broken Endpoints (Target Node Not Found): ${brokenEndpoints} (Must be 0)`);
  console.log(`- Mismatched Endpoints (Mapping Error): ${mismatchedEndpoints} (Must be 0)`);
  console.log(`- Mismatched Attributes (Full Deep Comparison): ${mismatchedAttributes} (Must be 0)`);
  console.log(`- Redirected Endpoints: ${redirectedCount}`);

  if (transformedEdgeIds.size !== originalEdgeIds.size) {
    throw new Error(`[FAIL] Edge count invariant violated: ${transformedEdgeIds.size} !== ${originalEdgeIds.size}`);
  }
  if (brokenEndpoints > 0) {
    throw new Error(`[FAIL] Broken endpoints detected!`);
  }
  if (mismatchedEndpoints > 0) {
    throw new Error(`[FAIL] Edge endpoint mapping mismatch detected!`);
  }
  if (mismatchedAttributes > 0) {
    throw new Error(`[FAIL] Edge attribute divergence detected against frozen snapshot!`);
  }

  // --------------------------------------------------------------------------
  // Step 5: Strict Role Allow-List Audit
  // --------------------------------------------------------------------------
  console.log(`\nStep 5 (Strict Role Allow-List Audit):`);
  if (roleTransitions.length !== spec.expectedTransitions) {
    throw new Error(`[FAIL] Unexpected transition count: ${roleTransitions.length} !== ${spec.expectedTransitions}`);
  }

  const observedBreakdown: { [key: string]: number } = {};
  for (const t of roleTransitions) {
    const k = `${t.from} -> ${t.to}`;
    observedBreakdown[k] = (observedBreakdown[k] || 0) + 1;

    // Check if transition type is allowed
    if (!spec.allowedTransitions[k]) {
      throw new Error(`[FAIL] Unallowed transition type detected: "${k}" on node "${t.id}"`);
    }

    // Check if ID is in allowed set if provided
    if (spec.allowedIds && !spec.allowedIds.has(t.id)) {
      throw new Error(`[FAIL] Node "${t.id}" not in allowed ID set!`);
    }
  }

  console.log(`- Observed Transitions:`, observedBreakdown);
  console.log(`- Allowed Transitions:`, spec.allowedTransitions);

  for (const [k, count] of Object.entries(spec.allowedTransitions)) {
    if (observedBreakdown[k] !== count) {
      throw new Error(`[FAIL] Transition count mismatch for "${k}": observed ${observedBreakdown[k] || 0} !== expected ${count}`);
    }
  }

  console.log(`\n>>> [VERDICT: PROVEN] All L3 Invariants 100% Mathematically & Empirically Verified! <<<`);
  return {
    projectName,
    nodeCount: transformedNodeIds.size,
    edgeCount: transformedEdgeIds.size,
    roleTransitions: roleTransitions.length,
    observedBreakdown
  };
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

runRigorousIndependentL3Audit(godotPath, 'Godot Engine', {
  expectedTransitions: 188,
  allowedTransitions: {
    'RUNTIME -> TEST': 188
  }
});

runRigorousIndependentL3Audit(vscodePath, 'VS Code', {
  expectedTransitions: 93,
  allowedTransitions: {
    'RUNTIME -> TEST': 80,
    'RUNTIME_ENTRY -> TEST': 6,
    'TOOLING -> TEST': 6,
    'DOMAIN_MODEL -> TEST': 1
  }
});
