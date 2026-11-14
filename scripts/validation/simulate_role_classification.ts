import * as fs from 'fs';
import * as path from 'path';
import {
  determineNodeRoleCanonical,
  normalizePathCanonical
} from './phase_b_transformer';

// ============================================================================
// Condition 3: Unified Role Classification Simulator (v1.0.3)
// Strictly unified with determineNodeRoleCanonical and NodeBuilder population
// ============================================================================

// 1. Boundary & Priority Test Cases
const boundaryCases = [
  { path: 'contest/solution.cpp', expected: 'RUNTIME', desc: 'Negative: contest segment' },
  { path: 'src/attestation/verifier.ts', expected: 'RUNTIME', desc: 'Negative: attestation segment' },
  { path: 'lib/latest/version.ts', expected: 'RUNTIME', desc: 'Negative: latest segment' },
  { path: 'components/context/provider.tsx', expected: 'RUNTIME', desc: 'Negative: context segment' },
  { path: 'testament/doc.md', expected: 'DOCUMENT', desc: 'Negative: testament segment (doc)' },
  { path: 'detest/foo.py', expected: 'RUNTIME', desc: 'Negative: detest segment' },
  { path: 'tests/README.md', expected: 'DOCUMENT', desc: 'Priority: Document in test directory' },
  { path: 'tests/config.json', expected: 'CONFIG', desc: 'Priority: Config in test directory' },
  { path: 'tests/icon.png', expected: 'ASSET', desc: 'Priority: Asset in test directory' },
  { path: 'src\\tests\\test_runner.py', expected: 'TEST', desc: 'Windows separator with test segment' },
  { path: 'tests/core/config/test_project_settings.cpp', expected: 'TEST', desc: 'Godot test source' },
  { path: 'test/sanity/src/main.ts', expected: 'TEST', desc: 'VS Code test entry point' },
  { path: 'extensions/copilot/src/extension/tools/common/test/toolNames.spec.ts', expected: 'TEST', desc: 'Test in tools directory' },
  { path: 'test/integration/electron/testrunner.d.ts', expected: 'TEST', desc: 'Test declaration in test directory' }
];

console.log(`==================================================`);
console.log(`[TEST 1] Boundary & Negative Case Verification`);
console.log(`==================================================`);
for (const tc of boundaryCases) {
  const res = determineNodeRoleCanonical(tc.path);
  const pass = res.role === tc.expected;
  console.log(`- [${pass ? 'PASS' : 'FAIL'}] ${tc.desc}: "${tc.path}" => ${res.role} (Expected: ${tc.expected})`);
  if (!pass) throw new Error(`Boundary test failed on ${tc.path}`);
}

// 2. Strict NodeBuilder Population Evaluation
function auditProjectRolePopulation(filePath: string, projectName: string, expectedCount: number) {
  console.log(`\n==================================================`);
  console.log(`[ANALYSIS] NodeBuilder Role Audit: ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`==================================================`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  const nbNodes = data.nodes.filter((n: any) => n.createdBy === 'NodeBuilder');
  console.log(`Total NodeBuilder physical nodes: ${nbNodes.length}`);

  // Confirm id === filePath for all NodeBuilder nodes
  const pathMismatches = nbNodes.filter((n: any) => n.id !== n.filePath);
  if (pathMismatches.length > 0) {
    throw new Error(`[FAIL] NodeBuilder node id !== filePath for ${pathMismatches.length} nodes!`);
  }
  console.log(`- Pre-check: id === filePath for all ${nbNodes.length} nodes (0 mismatches) [PASS]`);

  const transitions: Array<{ id: string; from: string; to: string }> = [];
  let segBasedCount = 0;
  let filePatternCount = 0;

  for (const node of nbNodes) {
    const currentRole = node.role || 'UNKNOWN';
    // Canonical path: node.id
    const targetRole = determineNodeRoleCanonical(node.id).role;

    if (currentRole !== targetRole) {
      transitions.push({ id: node.id, from: currentRole, to: targetRole });
      const rel = node.id.replace(/\\/g, '/');
      const isSeg = /(^|\/)(test|tests|unit_tests)(\/|$)/i.test(rel);
      if (isSeg) segBasedCount++;
      else filePatternCount++;
    }
  }

  console.log(`- Total Transitions: ${transitions.length} (Expected: ${expectedCount})`);
  console.log(`  * Segment-based triggers: ${segBasedCount}`);
  console.log(`  * File-pattern only triggers: ${filePatternCount}`);

  const breakdown: { [key: string]: number } = {};
  for (const t of transitions) {
    const k = `${t.from} -> ${t.to}`;
    breakdown[k] = (breakdown[k] || 0) + 1;
  }
  console.log(`- Transition Breakdown:`, breakdown);

  if (transitions.length !== expectedCount) {
    throw new Error(`[FAIL] Transition count mismatch: ${transitions.length} !== ${expectedCount}`);
  }
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

auditProjectRolePopulation(godotPath, 'Godot Engine', 188);
auditProjectRolePopulation(vscodePath, 'VS Code', 93);
