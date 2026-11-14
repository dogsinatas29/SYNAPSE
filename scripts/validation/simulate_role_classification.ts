import * as fs from 'fs';
import * as path from 'path';
import { isBuildOrPackagingAsset } from '../../src/utils/exclusionRules';

// ============================================================================
// Condition 3: Unified Role Classification Simulator (v1.0.2)
// Strictly unified with determineNodeRoleCanonical and NodeBuilder population
// ============================================================================

export function determineNodeRoleCanonical(filePath: string): { role: string; category: string } {
  const relPath = filePath.replace(/\\/g, '/');
  const basename = path.posix.basename(relPath);
  const ext = path.posix.extname(relPath).toLowerCase();
  const baseNameLower = basename.toLowerCase();

  // Priority 1: Grammar
  if (ext === '.json' && basename.includes('.tmLanguage')) {
    return { role: 'GRAMMAR', category: 'Grammar' };
  }

  // Priority 2: Config
  if (
    ['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts', '.eslintrc.js', '.prettierrc'].includes(basename) ||
    ext === '.yaml' || ext === '.yml' || ext === '.json' || ext === '.toml'
  ) {
    return { role: 'CONFIG', category: 'Config' };
  }

  // Priority 3: Build or Packaging Asset
  if (isBuildOrPackagingAsset(relPath)) {
    return { role: 'TOOLING', category: 'Tooling' };
  }

  // Priority 4: Document
  if (ext === '.md' || ext === '.txt') {
    return { role: 'DOCUMENT', category: 'Document' };
  }

  // Priority 5: Asset
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
    return { role: 'ASSET', category: 'Asset' };
  }

  // Priority 6: Test Code & Runner
  const isTestSegment = /(^|\/)(test|tests|unit_tests)(\/|$)/i.test(relPath);
  const isTestFile = (
    baseNameLower.includes('.test.') ||
    baseNameLower.includes('.spec.') ||
    baseNameLower.startsWith('test_') ||
    baseNameLower.endsWith('_test.cpp') ||
    baseNameLower.endsWith('_test.h') ||
    baseNameLower.endsWith('_test.py') ||
    baseNameLower === 'test-utils.ts'
  );
  if (isTestSegment || isTestFile) {
    return { role: 'TEST', category: 'Test' };
  }

  // Priority 7: Tooling Scripts
  if (relPath.includes('/scripts/') || relPath.includes('/build/') || relPath.includes('/tools/')) {
    return { role: 'TOOLING', category: 'Tooling' };
  }

  // Priority 8: Domain Models
  if (['schema.ts', 'types.ts', 'interfaces.ts', 'constants.ts'].includes(basename) || basename.endsWith('.d.ts')) {
    return { role: 'DOMAIN_MODEL', category: 'Domain' };
  }

  // Priority 9: Runtime Entry Points
  if (['extension.ts', 'main.ts', 'index.ts', 'activate.ts'].includes(basename)) {
    return { role: 'RUNTIME_ENTRY', category: 'Entry' };
  }

  // Priority 10: Runtime Default
  return { role: 'RUNTIME', category: 'Source' };
}

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

  const transitions: Array<{ id: string; from: string; to: string }> = [];
  let segBasedCount = 0;
  let filePatternCount = 0;

  for (const node of nbNodes) {
    const currentRole = node.role || 'UNKNOWN';
    const targetRole = determineNodeRoleCanonical(node.filePath || node.id).role;

    if (currentRole !== targetRole) {
      transitions.push({ id: node.id, from: currentRole, to: targetRole });
      const rel = (node.filePath || node.id).replace(/\\/g, '/');
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
