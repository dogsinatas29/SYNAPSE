import * as fs from 'fs';
import * as path from 'path';

// Condition 3: Segment-Based Role Classification Analysis Simulation
// Evaluates exact segment matching rules vs legacy substring matching

interface ProjectState {
  nodes: Array<{
    id: string;
    filePath?: string;
    role?: string;
    [key: string]: any;
  }>;
}

// Current (Legacy) Rule in NodeBuilder.ts:
// if (relPath.includes('/test/') || relPath.includes('/tests/') || basename.includes('.test.') || basename.includes('.spec.') || basename === 'test-utils.ts')
function isLegacyTest(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);
  const relPath = filePath.replace(/\\/g, '/');

  // Skip doc / config / asset first if applicable, but here we focus on test criteria
  return (
    relPath.includes('/test/') ||
    relPath.includes('/tests/') ||
    basename.includes('.test.') ||
    basename.includes('.spec.') ||
    basename === 'test-utils.ts'
  );
}

// Proposed Segment-Based Rule:
// Matches test / tests / unit_tests as distinct path segment or prefix/suffix:
// e.g. /(^|\/)(tests?|unit_tests)(\/|$)/i
// plus file suffix / naming: .test., .spec., _test., _spec., test_*, *_test
function isSegmentBasedTest(filePath: string): boolean {
  const basename = path.basename(filePath);
  const relPath = filePath.replace(/\\/g, '/');

  // 1. Path segment matching: exactly test, tests, or unit_tests bounded by / or start/end
  const segmentRegex = /(^|\/)(test|tests|unit_tests)(\/|$)/i;
  if (segmentRegex.test(relPath)) {
    return true;
  }

  // 2. Basename patterns
  const baseNameLower = basename.toLowerCase();
  if (
    baseNameLower.includes('.test.') ||
    baseNameLower.includes('.spec.') ||
    baseNameLower.startsWith('test_') ||
    baseNameLower.endsWith('_test.cpp') ||
    baseNameLower.endsWith('_test.h') ||
    baseNameLower.endsWith('_test.py') ||
    baseNameLower === 'test-utils.ts'
  ) {
    return true;
  }

  return false;
}

// Negative edge case verification: ensure false positives don't occur
const negativeCases = [
  'contest/solution.cpp',
  'src/attestation/verifier.ts',
  'lib/latest/version.ts',
  'components/context/provider.tsx',
  'testament/doc.md',
  'detest/foo.py'
];

console.log(`\n==================================================`);
console.log(`[TEST 1] Negative Edge Case Validation`);
console.log(`==================================================`);
for (const tc of negativeCases) {
  const result = isSegmentBasedTest(tc);
  console.log(`- Path: "${tc}" => isTest: ${result} ${result ? '[FAIL: FALSE POSITIVE!]' : '[PASS]'}`);
}

function analyzeProjectRoles(filePath: string, projectName: string) {
  console.log(`\n==================================================`);
  console.log(`[ANALYSIS] Project Role Transition: ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`==================================================`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: ProjectState = JSON.parse(raw);

  let currentTestRoleCount = 0;
  let legacyTestMatchCount = 0;
  let segmentTestMatchCount = 0;

  const newlyIdentifiedTests: string[] = [];
  const rolesOfNewlyIdentified: { [role: string]: number } = {};

  for (const node of data.nodes) {
    const id = node.id;
    const currentRole = node.role || 'UNKNOWN';

    if (currentRole === 'TEST') {
      currentTestRoleCount++;
    }

    const legacyMatch = isLegacyTest(id);
    if (legacyMatch) legacyTestMatchCount++;

    const segmentMatch = isSegmentBasedTest(id);
    if (segmentMatch) {
      segmentTestMatchCount++;
      if (currentRole !== 'TEST') {
        newlyIdentifiedTests.push(id);
        rolesOfNewlyIdentified[currentRole] = (rolesOfNewlyIdentified[currentRole] || 0) + 1;
      }
    }
  }

  console.log(`- Current Node Role === 'TEST': ${currentTestRoleCount}`);
  console.log(`- Legacy Rule Matched: ${legacyTestMatchCount}`);
  console.log(`- Segment-Based Rule Matched: ${segmentTestMatchCount}`);
  console.log(`- Newly Transitioned to TEST (Current Role != TEST): ${newlyIdentifiedTests.length}`);
  console.log(`- Role Breakdown of Transitioned Nodes:`, rolesOfNewlyIdentified);

  console.log(`\nSample Newly Transitioned Nodes (up to 10):`);
  for (const sample of newlyIdentifiedTests.slice(0, 10)) {
    console.log(`  * ${sample}`);
  }

  return {
    projectName,
    currentTestRoleCount,
    segmentTestMatchCount,
    newlyTransitionedCount: newlyIdentifiedTests.length,
    rolesOfNewlyIdentified
  };
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

analyzeProjectRoles(godotPath, 'Godot Engine');
analyzeProjectRoles(vscodePath, 'VS Code');
