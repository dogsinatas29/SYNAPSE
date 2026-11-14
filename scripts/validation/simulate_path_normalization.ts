import { normalizePathCanonical } from './phase_b_transformer';

// ============================================================================
// Condition 2: Rigorous Path Normalization Boundary Matrix Audit (v1.0.5)
// ============================================================================

const testCases = [
  { in: '/home/project/src/index.ts', expected: '/home/project/src/index.ts', desc: 'POSIX absolute path preservation' },
  { in: 'home/project/src/index.ts', expected: 'home/project/src/index.ts', desc: 'Project relative path' },
  { in: '\\\\server\\share\\file.ts', expected: '//server/share/file.ts', desc: 'UNC Windows path' },
  { in: '//server/share/file.ts', expected: '//server/share/file.ts', desc: 'UNC POSIX path' },
  { in: '///server/share/file.ts', expected: '/server/share/file.ts', desc: 'Triple leading slashes collapse' },
  { in: '////foo/bar', expected: '/foo/bar', desc: 'Quad leading slashes collapse' },
  { in: '//server', expected: '/server', desc: 'UNC missing share segment collapses to absolute path' },
  { in: '//server/', expected: '/server', desc: 'UNC with empty share segment collapses to absolute path' },
  { in: '//server/share/', expected: '//server/share', desc: 'UNC trailing slash collapse' },
  { in: 'C:\\project\\file.ts', expected: 'C:/project/file.ts', desc: 'Windows drive path' },
  { in: 'C:/project/file.ts', expected: 'C:/project/file.ts', desc: 'Windows forward slash drive path' },
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
console.log(`[TEST 1] Boundary & Edge Case Full Matrix Verification (v1.0.5)`);
console.log(`==================================================`);
let allPass = true;
for (const tc of testCases) {
  const out = normalizePathCanonical(tc.in);
  const pass = out === tc.expected;
  if (!pass) allPass = false;
  console.log(`- [${pass ? 'PASS' : 'FAIL'}] ${tc.desc}: "${tc.in}" => "${out}" (Expected: "${tc.expected}")`);
  if (!pass) throw new Error(`Path test failed on ${tc.in}`);
}

console.log(`All Boundary Cases Passed: ${allPass}`);
