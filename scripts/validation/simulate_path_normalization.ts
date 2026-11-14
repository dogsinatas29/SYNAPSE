import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Condition 2: Rigorous Path Normalization & Collision Audit (v1.0.2)
// Strictly evaluates Canonical normalizePath on NodeBuilder physical nodes
// ============================================================================

export function normalizePathCanonical(rawPath: string): string {
  if (!rawPath) return rawPath;
  if (rawPath.startsWith('ghost://') || rawPath.startsWith('external://') || rawPath.startsWith('builtin://')) {
    return rawPath;
  }

  // 1. UNC prefix preservation: \\server\share or //server/share
  const isUNC = rawPath.startsWith('\\\\') || rawPath.startsWith('//');
  let p = rawPath.replace(/\\/g, '/');

  let prefix = '';
  if (isUNC) {
    prefix = '//';
    p = p.substring(2);
  }

  // 2. Collapse consecutive slashes
  p = p.replace(/\/+/g, '/');

  // 3. Resolve all current directory segments (./ and /./) iteratively
  const parts = p.split('/');
  const resolvedParts: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    resolvedParts.push(part);
  }
  p = resolvedParts.join('/');

  // 4. Reattach UNC prefix if applicable
  if (isUNC) {
    return prefix + p;
  }

  return p;
}

// 1. Rigorous Boundary & Platform Edge Cases
const testCases = [
  { in: '\\\\server\\share\\file.ts', expected: '//server/share/file.ts', desc: 'UNC path preservation' },
  { in: '//server/share/file.ts', expected: '//server/share/file.ts', desc: 'POSIX UNC path' },
  { in: 'C:\\project\\file.ts', expected: 'C:/project/file.ts', desc: 'Windows drive letter preservation' },
  { in: '././src/index.ts', expected: 'src/index.ts', desc: 'Repeated leading dot segments' },
  { in: 'src/././index.ts', expected: 'src/index.ts', desc: 'Repeated intermediate dot segments' },
  { in: 'foo//bar///baz.ts', expected: 'foo/bar/baz.ts', desc: 'Repeated slashes collapse' },
  { in: 'foo/bar/../baz.ts', expected: 'foo/bar/../baz.ts', desc: 'Parent dir preservation (no arbitrary stripping)' },
  { in: 'ghost://cpp/header.h', expected: 'ghost://cpp/header.h', desc: 'Virtual schema bypass' }
];

console.log(`==================================================`);
console.log(`[TEST 1] Boundary & Edge Case Verification`);
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
