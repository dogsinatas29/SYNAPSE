import * as fs from 'fs';
import * as path from 'path';
import { normalizePathCanonical } from './phase_b_transformer';

// ============================================================================
// Condition 2: Rigorous Path Normalization & Collision Audit (v1.0.3)
// Strictly evaluates Canonical normalizePath on NodeBuilder physical nodes
// ============================================================================

// 1. Rigorous Boundary & Platform Edge Cases (Full Matrix including POSIX absolute & root)
const testCases = [
  { in: '/home/project/src/index.ts', expected: '/home/project/src/index.ts', desc: 'POSIX absolute path preservation' },
  { in: 'home/project/src/index.ts', expected: 'home/project/src/index.ts', desc: 'Project relative path' },
  { in: '\\\\server\\share\\file.ts', expected: '//server/share/file.ts', desc: 'UNC Windows path' },
  { in: '//server/share/file.ts', expected: '//server/share/file.ts', desc: 'UNC POSIX path' },
  { in: 'C:\\project\\file.ts', expected: 'C:/project/file.ts', desc: 'Windows drive path' },
  { in: '././src/index.ts', expected: 'src/index.ts', desc: 'Repeated leading dot segments' },
  { in: 'src/././index.ts', expected: 'src/index.ts', desc: 'Repeated intermediate dot segments' },
  { in: '/src/././index.ts', expected: '/src/index.ts', desc: 'Absolute repeated intermediate dot segments' },
  { in: 'foo/bar/../baz.ts', expected: 'foo/bar/../baz.ts', desc: 'Parent dir preservation (no arbitrary stripping)' },
  { in: '../../src/file.ts', expected: '../../src/file.ts', desc: 'Leading parent dirs preservation' },
  { in: 'foo//bar///baz.ts', expected: 'foo/bar/baz.ts', desc: 'Consecutive slashes collapse' },
  { in: 'ghost://cpp/header.h', expected: 'ghost://cpp/header.h', desc: 'Virtual schema bypass' },
  { in: '', expected: '', desc: 'Empty string handling' },
  { in: '/', expected: '/', desc: 'Root path handling' }
];

console.log(`==================================================`);
console.log(`[TEST 1] Boundary & Edge Case Full Matrix Verification`);
console.log(`==================================================`);
for (const tc of testCases) {
  const out = normalizePathCanonical(tc.in);
  const pass = out === tc.expected;
  console.log(`- [${pass ? 'PASS' : 'FAIL'}] ${tc.desc}: "${tc.in}" => "${out}" (Expected: "${tc.expected}")`);
  if (!pass) throw new Error(`Path test failed on ${tc.in}`);
}

// 2. Physical Node Dataset Audit
function auditDatasetPaths(filePath: string, projectName: string) {
  console.log(`\n==================================================`);
  console.log(`[ANALYSIS] Path Normalization Audit: ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`==================================================`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  const nbNodes = data.nodes.filter((n: any) => n.createdBy === 'NodeBuilder');
  console.log(`Total NodeBuilder physical nodes: ${nbNodes.length}`);

  const normalizedMap = new Map<string, string[]>();
  let pathModifications = 0;

  for (const n of nbNodes) {
    const orig = n.id;
    const norm = normalizePathCanonical(orig);
    if (norm !== orig) {
      pathModifications++;
    }
    if (!normalizedMap.has(norm)) {
      normalizedMap.set(norm, []);
    }
    normalizedMap.get(norm)!.push(orig);
  }

  let collisions = 0;
  for (const [norm, origs] of normalizedMap.entries()) {
    if (origs.length > 1) {
      collisions++;
      console.error(`[COLLISION] Normalized: "${norm}" <= Originals: ${JSON.stringify(origs)}`);
    }
  }

  console.log(`- Path Modifications Required: ${pathModifications}`);
  console.log(`- Unique Normalized Keys: ${normalizedMap.size}`);
  console.log(`- Collision Count: ${collisions}`);

  if (collisions > 0) {
    throw new Error(`[FAIL] Collisions detected in ${projectName}!`);
  }
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

auditDatasetPaths(godotPath, 'Godot Engine');
auditDatasetPaths(vscodePath, 'VS Code');
