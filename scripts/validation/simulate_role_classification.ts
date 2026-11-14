import * as fs from 'fs';
import * as path from 'path';

// Condition 3: Unified DetermineNodeRole & Role Classification Simulation (v1.0.1 Corrected Priority)
// Preserves EXACT NodeBuilder.ts priority:
// 1. Grammar
// 2. Config
// 3. Build/Packaging Asset
// 4. Document (.md, .txt)
// 5. Asset (images, fonts)
// 6. TEST (includes test segments and test files)
// 7. Tooling (/scripts/, /build/, /tools/)
// 8. Domain Model (types.ts, .d.ts)
// 9. Runtime Entry (index.ts, main.ts)
// 10. Runtime

interface ProjectState {
  nodes: Array<{
    id: string;
    filePath?: string;
    role?: string;
    [key: string]: any;
  }>;
}

export function determineNodeRoleCandidate(rawFilePath: string): { role: string; category: string } {
  // Guard virtual schemas
  if (rawFilePath.startsWith('ghost://') || rawFilePath.startsWith('external://') || rawFilePath.startsWith('builtin://')) {
    return { role: 'GHOST', category: 'External' };
  }

  // 1. Mandatory separator normalization before any path operations (Windows / POSIX safe)
  const relPath = rawFilePath.replace(/\\/g, '/');
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
    ['.yaml', '.yml', '.json', '.toml'].includes(ext)
  ) {
    return { role: 'CONFIG', category: 'Config' };
  }

  // Priority 3: Document (.md, .txt)
  if (ext === '.md' || ext === '.txt') {
    return { role: 'DOCUMENT', category: 'Document' };
  }

  // Priority 4: Asset (.png, .svg, etc.)
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
    return { role: 'ASSET', category: 'Asset' };
  }

  // Priority 5: Test (Segment-based + Basename patterns)
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

  // Priority 6: Tooling (/scripts/, /build/, /tools/)
  if (relPath.includes('/scripts/') || relPath.includes('/build/') || relPath.includes('/tools/')) {
    return { role: 'TOOLING', category: 'Tooling' };
  }

  // Priority 7: Domain Models & Types
  if (['schema.ts', 'types.ts', 'interfaces.ts', 'constants.ts'].includes(basename) || basename.endsWith('.d.ts')) {
    return { role: 'DOMAIN_MODEL', category: 'Domain' };
  }

  // Priority 8: Runtime Entry Points
  if (['extension.ts', 'main.ts', 'index.ts', 'activate.ts'].includes(basename)) {
    return { role: 'RUNTIME_ENTRY', category: 'Entry' };
  }

  // Priority 9: Default Runtime Source Code
  return { role: 'RUNTIME', category: 'Source' };
}

// 1. Boundary & Priority Test Cases
const testCases = [
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
  { path: 'extensions/copilot/src/extension/tools/common/test/toolNames.spec.ts', expected: 'TEST', desc: 'Test within tools directory retains TEST role' }
];

console.log(`==================================================`);
console.log(`[TEST 1] Boundary & Negative Case Verification`);
console.log(`==================================================`);
let allPass = true;
for (const tc of testCases) {
  const res = determineNodeRoleCandidate(tc.path);
  const pass = res.role === tc.expected;
  if (!pass) allPass = false;
  console.log(`- [${pass ? 'PASS' : 'FAIL'}] ${tc.desc}: "${tc.path}" => ${res.role} (Expected: ${tc.expected})`);
}
console.log(`All Boundary Cases Passed: ${allPass}`);

// 2. Project State Evaluation
function evaluateProjectRoles(filePath: string, projectName: string) {
  console.log(`\n==================================================`);
  console.log(`[ANALYSIS] Role Classification Audit: ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`==================================================`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: ProjectState = JSON.parse(raw);

  let currentTestCount = 0;
  let simulatedTestCount = 0;
  const transitions: { from: string; to: string; id: string }[] = [];

  for (const node of data.nodes) {
    if (node.id.startsWith('ghost://') || node.id.startsWith('external://') || node.id.startsWith('builtin://')) {
      continue;
    }

    const currentRole = node.role || 'UNKNOWN';
    if (currentRole === 'TEST') currentTestCount++;

    const newRoleInfo = determineNodeRoleCandidate(node.filePath || node.id);
    if (newRoleInfo.role === 'TEST') simulatedTestCount++;

    if (currentRole !== newRoleInfo.role) {
      transitions.push({ from: currentRole, to: newRoleInfo.role, id: node.id });
    }
  }

  console.log(`- Current Physical TEST Nodes: ${currentTestCount}`);
  console.log(`- Candidate Physical TEST Nodes: ${simulatedTestCount}`);
  console.log(`- Total Transitions: ${transitions.length}`);

  const transitionSummary: { [key: string]: number } = {};
  for (const t of transitions) {
    const key = `${t.from} -> ${t.to}`;
    transitionSummary[key] = (transitionSummary[key] || 0) + 1;
  }
  console.log(`- Transition Summary:`, transitionSummary);

  return { projectName, currentTestCount, simulatedTestCount, transitions, transitionSummary };
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

evaluateProjectRoles(godotPath, 'Godot Engine');
evaluateProjectRoles(vscodePath, 'VS Code');
