import * as fs from 'fs';
import * as path from 'path';
import {
  ProjectState,
  Node,
  Edge,
  transformProjectStatePhaseB
} from './phase_b_transformer';

// ============================================================================
// Condition 4: Rigorous Decoupled L3 Differential Graph Validator (v1.0.15)
// ============================================================================
// Solves all P0-1 ~ P0-4 and P1-1 ~ P1-6:
// 1. Independent Re-calculation of Expected Path & Role directly from contract rules.
// 2. Strict Bijective Mapping Proof:
//    - dom(M) === V_orig
//    - ran(M) is collision-free
//    - ran(M) === V_trans
// 3. Strict 1:1 Inverted Node Mapping (invM: transId -> origId).
// 4. Non-NodeBuilder Node Invariance: 100% JSON structural equality (deep equality).
// 5. NodeBuilder Node Non-Target Invariance: All properties except (id, filePath, role, data.file)
//    must be deepEqualJSON to the original node.
// 6. Edge Invariant Verification:
//    \forall e \in E, e' = (M(e.from), M(e.to), e.id, attributes(e))
// 7. Exact ID Allow-List Strict Invariants:
//    - Array structure, non-empty string elements, zero duplicates.
//    - Exact bi-directional set equality (Observed === Allowed).
//    - All promoted nodes must satisfy segment condition.
//    - Breakdown assertions using Object.prototype.hasOwnProperty.

interface AllowListSpec {
  expectedTransitions: number;
  allowedTransitions: { [key: string]: number };
  allowedIdsPath: string;
}

/**
 * Deep Equality helper strictly scoped to JSON data values (primitives, arrays, plain objects, null).
 */
export function deepEqualJSON(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqualJSON(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqualJSON(a[k], b[k])) return false;
  }
  return true;
}

/**
 * Independent Auditor Re-calculation of Path Normalization:
 * Written completely independently from transformer implementation to detect any shared defects.
 * Strictly adheres to Phase B specification:
 * - Preserves virtual schemas (ghost://, external://, builtin://)
 * - Strict UNC (//server/share)
 * - Windows drive absolute (C:/, C://foo) & root preservation (C:/)
 * - Windows drive relative (C:foo, C:./foo)
 * - POSIX absolute (/home/...) & leading slashes collapse (/// -> /)
 * - Parent directory navigation (..) preserved
 * - Redundant dot segments (. and /./) and consecutive slashes collapsed
 */
export function auditComputeExpectedPath(rawPath: string): string {
  if (!rawPath) return rawPath;
  if (rawPath.startsWith('ghost://') || rawPath.startsWith('external://') || rawPath.startsWith('builtin://')) {
    return rawPath;
  }

  const posix = rawPath.replace(/\\/g, '/');

  // 1. Strict UNC detection: Starts with exactly two slashes followed by non-empty server & share
  const isStrictUNC = /^\/\/[^\/\s]+\/[^\/\s]+(?:\/|$)/.test(posix) && !posix.startsWith('///');

  let prefix = '';
  let remainder = posix;
  let isDriveAbsolute = false;

  if (isStrictUNC) {
    prefix = '//';
    remainder = posix.substring(2);
  } else if (/^[a-zA-Z]:\//.test(posix)) {
    // Windows drive absolute with slash (e.g. C:/ or C://foo)
    prefix = posix.substring(0, 2) + '/';
    remainder = posix.substring(2).replace(/^\/+/, '');
    isDriveAbsolute = true;
  } else if (/^[a-zA-Z]:/.test(posix)) {
    // Windows drive relative (e.g. C:foo or C:./foo)
    prefix = posix.substring(0, 2);
    remainder = posix.substring(2);
  } else if (posix.startsWith('/')) {
    // POSIX absolute or collapsed multiple slashes (e.g. ///foo -> /foo)
    prefix = '/';
    remainder = posix.replace(/^\/+/, '');
  }

  const segments = remainder.split('/').filter(s => s !== '' && s !== '.');
  const joinedSegments = segments.join('/');

  if (isDriveAbsolute && segments.length === 0) {
    return prefix;
  }

  if (prefix.endsWith('/')) {
    return prefix + joinedSegments;
  }
  if (prefix) {
    return joinedSegments ? prefix + (prefix.endsWith(':') ? '' : '/') + joinedSegments : prefix;
  }
  return joinedSegments;
}

/**
 * Self-verification of Decoupled Auditor Path Normalization:
 * Validates canonical boundary cases specified by Master Auditor (26 boundary cases).
 */
export function verifyAuditComputeExpectedPath(): void {
  const cases: Array<[string, string]> = [
    ['C:/', 'C:/'],
    ['C:\\', 'C:/'],
    ['C:/./', 'C:/'],
    ['C:/foo/', 'C:/foo'],
    ['C:foo', 'C:foo'],
    ['C:foo/./bar', 'C:foo/bar'],
    ['C://foo///bar', 'C:/foo/bar'],
    ['C:./foo', 'C:foo'],
    ['/home//user/./src', '/home/user/src'],
    ['//server/share/./folder', '//server/share/folder'],
    ['//server/share', '//server/share'],
    ['//server//share', '/server/share'],
    ['///server/share', '/server/share'],
    ['//server', '/server'],
    ['//server/share/..', '//server/share/..'],
    ['//server/share name', '/server/share name'],
    ['//server/share?name', '//server/share?name'],
    ['../a', '../a'],
    ['a/../b', 'a/../b'],
    ['/../a', '/../a'],
    ['C:../a', 'C:../a'],
    ['C:/../a', 'C:/../a'],
    ['../../src/./index.ts', '../../src/index.ts'],
    ['ghost://virtual_node', 'ghost://virtual_node'],
    ['external://vscode', 'external://vscode'],
    ['builtin://path', 'builtin://path']
  ];
  for (const [input, expected] of cases) {
    const actual = auditComputeExpectedPath(input);
    if (actual !== expected) {
      throw new Error(`[AUDIT_PATH_SELF_CHECK_FAILED] Input: "${input}", Expected: "${expected}", Got: "${actual}"`);
    }
  }
}

/**
 * Strips ONLY the official Transformation Target Allowlist (4 fields):
 * - Node.id
 * - Node.filePath
 * - Node.role
 * - Node.data.file (only if data is an object and contains file)
 *
 * All other properties (Preservation Set: category, data.label, cluster_id, etc.)
 * remain untouched and are strictly compared with deepEqualJSON.
 */
export function stripTransformationTargets(node: Node): Record<string, any> {
  const cloned: Record<string, any> = JSON.parse(JSON.stringify(node));
  delete cloned.id;
  delete cloned.filePath;
  delete cloned.role;
  if (cloned.data !== null && typeof cloned.data === 'object' && !Array.isArray(cloned.data) && Object.prototype.hasOwnProperty.call(cloned.data, 'file')) {
    delete cloned.data.file;
  }
  return cloned;
}

const AUDIT_BUILD_SCRIPT_EXACT = new Set([
  'build.rs', 'build.py', 'build.sh', 'build.bat', 'build.ps1',
  'configure', 'configure.ac', 'makefile', 'gnumakefile', 'kbuild',
  'cmakelists.txt', 'meson.build', 'meson_options.txt', 'sconstruct', 'scsub',
  'build', 'build.bazel', 'workspace', 'workspace.bazel', 'podfile', 'fastfile',
  'justfile', 'taskfile.yml', 'taskfile.yaml', 'cargo.toml', 'cargo.lock',
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  'pyproject.toml', 'poetry.lock', 'pipfile', 'pipfile.lock', 'setup.py',
  'setup.cfg', 'requirements.txt', 'tsconfig.json', 'jsconfig.json',
  'go.mod', 'go.sum', 'go.work', 'go.work.sum', 'pom.xml', 'composer.json',
  'composer.lock', 'gemfile', 'gemfile.lock', 'code-of-conduct.md',
  'code_of_conduct.md', 'support.md'
]);

const AUDIT_BUILD_CONFIG_PREFIXES = [
  'webpack.config.', 'vite.config.', 'rollup.config.', 'esbuild.',
  'tsup.config.', 'babel.config.', '.babelrc', 'jest.config.',
  'vitest.config.', 'playwright.config.', 'cypress.config.',
  'tailwind.config.', 'postcss.config.', 'eslint.config.', '.eslintrc',
  'prettier.config.', '.prettierrc', 'gulpfile.', 'gruntfile.', 'tsconfig.',
  'requirements-', 'changelog-', 'contributing-', 'code_of_conduct-'
];

const AUDIT_BUILD_EXTENSIONS = ['.cmake', '.bzl', '.gradle', '.gradle.kts'];
const AUDIT_PACKAGING_DIRS = new Set([
  'installer', 'packaging', 'msi', 'wix', 'nsis', 'innosetup',
  'debian', 'rpm', 'flatpak', 'snap', '.github', '.circleci', '.gitlab', 'ci',
  '.cargo', '.mvn', '.gradle', 'cmake', 'changelog', 'testdata'
]);

/**
 * Independent Auditor Re-calculation of Build/Packaging Asset Check (P1-2, P1-3):
 * Decoupled reimplementation strictly mirroring production exclusionRules.ts constants.
 * In Production (NodeBuilder.ts:207), files matching these rules are completely skipped
 * from node generation ('continue').
 */
export function auditIsBuildOrPackagingAsset(filePath: string): boolean {
  if (!filePath) return false;
  if (filePath.startsWith('external://') || filePath.startsWith('ghost://')) return false;
  const norm = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const lowerPath = norm.toLowerCase();
  const base = path.posix.basename(lowerPath);

  // Preserve TypeScript declaration contracts (.d.ts) even in packaging directories
  if (base.endsWith('.d.ts')) return false;

  if (AUDIT_BUILD_SCRIPT_EXACT.has(base)) return true;
  for (const ext of AUDIT_BUILD_EXTENSIONS) {
    if (base.endsWith(ext)) return true;
  }
  for (const prefix of AUDIT_BUILD_CONFIG_PREFIXES) {
    if (base.startsWith(prefix)) return true;
  }
  const segments = lowerPath.split('/');
  for (const seg of segments) {
    if (AUDIT_PACKAGING_DIRS.has(seg)) return true;
  }
  return false;
}

/**
 * Self-verification of Independent Auditor Build/Packaging Asset Check:
 */
export function verifyAuditIsBuildOrPackagingAsset(): void {
  const cases: Array<[string, boolean]> = [
    ['Makefile', true],
    ['CMakeLists.txt', true],
    ['package.json', true],
    ['build/config.py', false], // Non-packaging directory ('build' is not in PACKAGING_DIR_SEGMENTS). Note: Does not match Priority 7 '/build/' (requires enclosing slashes), defaults to RUNTIME in NodeBuilder.
    ['packaging/installer.sh', true],
    ['ci/deploy.yml', true],
    ['code-of-conduct.md', true], // Matches production BUILD_SCRIPT_EXACT_NAMES (excluded at NodeBuilder line 207)
    ['support.md', true],          // Matches production BUILD_SCRIPT_EXACT_NAMES (excluded at NodeBuilder line 207)
    ['changelog/v1.0.md', true],   // Matches production PACKAGING_DIR_SEGMENTS (excluded at NodeBuilder line 207)
    ['testdata/input.json', true], // Matches production PACKAGING_DIR_SEGMENTS (excluded at NodeBuilder line 207)
    ['ci/types.d.ts', false],       // Priority check: .d.ts preservation over packaging directory
    ['.github/types.d.ts', false],  // Priority check: .d.ts preservation over .github directory
    ['src/index.ts', false],
    ['src/types.d.ts', false]
  ];
  for (const [input, expected] of cases) {
    const actual = auditIsBuildOrPackagingAsset(input);
    if (actual !== expected) {
      throw new Error(`[AUDIT_BUILD_ASSET_CHECK_FAILED] Input: "${input}", Expected: ${expected}, Got: ${actual}`);
    }
  }
}

/**
 * Independent Auditor Re-calculation of Node Role:
 * Directly evaluates contract priority hierarchy independently from transformer.
 */
function auditComputeExpectedRole(filePath: string): string {
  const norm = filePath.replace(/\\/g, '/');
  const base = path.posix.basename(norm);
  const ext = path.posix.extname(norm).toLowerCase();
  const lowerBase = base.toLowerCase();

  // 1. Grammar
  if (ext === '.json' && base.includes('.tmLanguage')) return 'GRAMMAR';
  // 2. Config
  if (
    ['package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts', '.eslintrc.js', '.prettierrc'].includes(base) ||
    ['.yaml', '.yml', '.json', '.toml'].includes(ext)
  ) return 'CONFIG';
  // 3. Build Asset (Decoupled independent auditor check)
  if (auditIsBuildOrPackagingAsset(norm)) return 'TOOLING';
  // 4. Document
  if (ext === '.md' || ext === '.txt') return 'DOCUMENT';
  // 5. Asset
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) return 'ASSET';
  // 6. Test (Includes test, tests, unit_tests, specs, __tests__)
  const isSeg = /(^|\/)(test|tests|unit_tests|specs|__tests__)(\/|$)/i.test(norm);
  const isFile = (
    lowerBase.includes('.test.') ||
    lowerBase.includes('.spec.') ||
    lowerBase.startsWith('test_') ||
    lowerBase.endsWith('_test.cpp') ||
    lowerBase.endsWith('_test.h') ||
    lowerBase.endsWith('_test.py') ||
    lowerBase === 'test-utils.ts'
  );
  if (isSeg || isFile) return 'TEST';
  // 7. Tooling
  if (norm.includes('/scripts/') || norm.includes('/build/') || norm.includes('/tools/')) return 'TOOLING';
  // 8. Domain Model
  if (['schema.ts', 'types.ts', 'interfaces.ts', 'constants.ts'].includes(base) || base.endsWith('.d.ts')) return 'DOMAIN_MODEL';
  // 9. Runtime Entry
  if (['extension.ts', 'main.ts', 'index.ts', 'activate.ts'].includes(base)) return 'RUNTIME_ENTRY';
  // 10. Runtime Default
  return 'RUNTIME';
}

export function runRigorousIndependentL3Audit(
  filePath: string,
  projectName: string,
  spec: AllowListSpec
) {
  console.log(`\n===============================================================`);
  console.log(`[DECOUPLED L3 DIFFERENTIAL AUDIT v1.0.15] ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`===============================================================`);

  // Step 0: Self-verification of independent audit rules
  verifyAuditComputeExpectedPath();
  verifyAuditIsBuildOrPackagingAsset();

  const raw = fs.readFileSync(filePath, 'utf-8');
  const originalState: ProjectState = JSON.parse(raw);

  // --------------------------------------------------------------------------
  // Step 1: Pre-condition SSoT Invariant Validation & Freeze Snapshots
  // --------------------------------------------------------------------------
  const originalNodeIds = new Set<string>();
  const originalNodeSnapshot = new Map<string, Node>();
  for (const n of originalState.nodes) {
    if (typeof n.id !== 'string' || n.id.trim().length === 0) {
      throw new Error(`[ORIG_SSOT_EMPTY_PATH_VIOLATION] Original Node ID is empty, non-string, or whitespace-only: "${n.id}"`);
    }
    if (originalNodeIds.has(n.id)) {
      throw new Error(`[FATAL] Duplicate Node ID in source: "${n.id}"`);
    }

    // NodeBuilder nodes: Strict input invariant validation before transformation (Pre-condition)
    if (n.createdBy === 'NodeBuilder') {
      if (typeof n.filePath !== 'string' || n.filePath.trim().length === 0) {
        throw new Error(`[ORIG_SSOT_EMPTY_PATH_VIOLATION] Original Node "${n.id}" filePath is empty, non-string, or whitespace-only: "${n.filePath}"`);
      }

      const origHasFile = n.data !== null && typeof n.data === 'object' && !Array.isArray(n.data) && Object.prototype.hasOwnProperty.call(n.data, 'file');
      if (origHasFile) {
        if (typeof n.data.file !== 'string' || n.data.file.trim().length === 0) {
          throw new Error(`[ORIG_SSOT_EMPTY_OR_NON_STRING_PATH] Original Node "${n.id}" has empty, non-string, or whitespace-only data.file: "${n.data.file}"`);
        }
        if (n.data.file !== n.filePath) {
          throw new Error(`[ORIG_SSOT_INVARIANT_VIOLATION] Original Node "${n.id}" had data.file mismatch with filePath: "${n.data.file}" !== "${n.filePath}"`);
        }
      }
    }

    originalNodeIds.add(n.id);
    originalNodeSnapshot.set(n.id, JSON.parse(JSON.stringify(n)));
  }

  const originalEdgeIds = new Set<string>();
  const originalEdgeSnapshot = new Map<string, Edge>();
  for (const e of originalState.edges) {
    if (originalEdgeIds.has(e.id)) {
      throw new Error(`[FATAL] Duplicate Edge ID in source: "${e.id}"`);
    }
    originalEdgeIds.add(e.id);
    originalEdgeSnapshot.set(e.id, JSON.parse(JSON.stringify(e)));
  }

  console.log(`Step 1 (Source Integrity & Full Freeze Snapshot):`);
  console.log(`- Unique Original Nodes: ${originalNodeIds.size}`);
  console.log(`- Unique Original Edges: ${originalEdgeIds.size}`);

  if (originalNodeIds.size !== originalState.nodes.length) {
    throw new Error(`[BIJECTION] Duplicate original node IDs: set size ${originalNodeIds.size} !== array length ${originalState.nodes.length}`);
  }
  if (originalEdgeIds.size !== originalState.edges.length) {
    throw new Error(`[BIJECTION] Duplicate original edge IDs: set size ${originalEdgeIds.size} !== array length ${originalState.edges.length}`);
  }

  // --------------------------------------------------------------------------
  // Step 2: Execute Transformer Engine
  // --------------------------------------------------------------------------
  const { transformedState, idMapping, roleTransitions } = transformProjectStatePhaseB(originalState);
  console.log(`\nStep 2 (Transformation Output):`);
  console.log(`- Transformed Nodes Generated: ${transformedState.nodes.length}`);
  console.log(`- Transformed Edges Generated: ${transformedState.edges.length}`);
  console.log(`- Role Transitions Observed: ${roleTransitions.length}`);

  // --------------------------------------------------------------------------
  // Step 3: P0-1, P0-2, P0-4 - Independent Bijective Mapping Verification
  // --------------------------------------------------------------------------
  // A. Independent Re-calculation of expected mapping M_expected
  // Master Auditor P1-6: Iterates originalNodeSnapshot to guarantee baseline reference integrity
  const auditorExpectedMapping = new Map<string, string>();
  for (const [originalId, origNode] of originalNodeSnapshot) {
    const expId = origNode.createdBy === 'NodeBuilder'
      ? auditComputeExpectedPath(origNode.id)
      : origNode.id;
    auditorExpectedMapping.set(originalId, expId);

    // Cross-check: transformer idMapping must match auditor expected mapping
    if (idMapping.get(originalId) !== expId) {
      throw new Error(`[FAIL P0-4] Transformer idMapping diverged from auditor calculation for "${originalId}": got "${idMapping.get(originalId)}", expected "${expId}"`);
    }
  }

  // B. Bijective Mapping Proof:
  // 1. dom(M) === originalNodeIds (Bidirectional Domain Completeness)
  if (idMapping.size !== originalNodeIds.size) {
    throw new Error(`[FAIL P0-2] idMapping size mismatch: ${idMapping.size} !== ${originalNodeIds.size}`);
  }
  for (const origKey of idMapping.keys()) {
    if (!originalNodeIds.has(origKey)) {
      throw new Error(`[FAIL P0-2] idMapping contains extraneous key not in originalNodeIds: "${origKey}"`);
    }
  }
  for (const origId of originalNodeIds) {
    if (!idMapping.has(origId)) {
      throw new Error(`[FAIL P0-2] Original node "${origId}" missing from idMapping domain!`);
    }
  }

  // 2. Injective Proof: ran(M) has zero collisions (a !== b => M(a) !== M(b))
  const mappedValuesSet = new Set<string>();
  for (const [origKey, mappedVal] of idMapping.entries()) {
    if (mappedValuesSet.has(mappedVal)) {
      throw new Error(`[FAIL P0-2] Injective Collision in mapping: multiple original IDs map to "${mappedVal}"`);
    }
    mappedValuesSet.add(mappedVal);
  }

  // 3. Surjective Proof: ran(M) === transformedNodeIds (Bidirectional Set Equality)
  const transformedNodeIds = new Set<string>(transformedState.nodes.map(n => n.id));
  if (transformedNodeIds.size !== transformedState.nodes.length) {
    throw new Error(`[BIJECTION] Duplicate transformed node IDs: set size ${transformedNodeIds.size} !== array length ${transformedState.nodes.length}`);
  }
  if (mappedValuesSet.size !== transformedNodeIds.size) {
    throw new Error(`[FAIL P0-2] mappedValuesSet size !== transformedNodeIds size: ${mappedValuesSet.size} !== ${transformedNodeIds.size}`);
  }
  for (const val of mappedValuesSet) {
    if (!transformedNodeIds.has(val)) {
      throw new Error(`[FAIL P0-2] Mapped value "${val}" not found in transformedNodeIds!`);
    }
  }
  for (const transId of transformedNodeIds) {
    if (!mappedValuesSet.has(transId)) {
      throw new Error(`[FAIL P0-2] Transformed node ID "${transId}" not found in ran(M)!`);
    }
  }
  if (transformedNodeIds.size !== originalNodeIds.size) {
    throw new Error(`[FAIL P0-2] Node count changed: ${transformedNodeIds.size} !== ${originalNodeIds.size}`);
  }

  // C. Invertible Mapping Proof (invM: transId -> origId, invM(M(v)) === v) (P0-3)
  const invertedMapping = new Map<string, string>();
  for (const [origKey, mappedVal] of idMapping.entries()) {
    invertedMapping.set(mappedVal, origKey);
  }
  for (const origKey of originalNodeIds) {
    const mapped = idMapping.get(origKey)!;
    const recovered = invertedMapping.get(mapped);
    if (recovered !== origKey) {
      throw new Error(`[FAIL P0-3] Inverted mapping failure: invM(M("${origKey}")) === "${recovered}" !== "${origKey}"`);
    }
  }

  // --------------------------------------------------------------------------
  // Step 4: P0-3, P0-4 - Node Attribute Invariance & Independent Role Verification
  // --------------------------------------------------------------------------
  const transformedNodeMap = new Map<string, Node>();
  let nonNbMutations = 0;
  let nbAttributeMismatches = 0;
  let roleMismatches = 0;

  for (const transNode of transformedState.nodes) {
    transformedNodeMap.set(transNode.id, transNode);

    // Retrieve unique originating node via strict inverted mapping!
    if (!invertedMapping.has(transNode.id)) {
      throw new Error(`[FAIL P0-3] Transformed node "${transNode.id}" has no mapped originating ID in invM!`);
    }
    const originatingId = invertedMapping.get(transNode.id)!;
    const origSnapshot = originalNodeSnapshot.get(originatingId);
    if (!origSnapshot) {
      throw new Error(`[FAIL P0-3] Originating node "${originatingId}" missing from snapshot!`);
    }

    if (origSnapshot.createdBy !== 'NodeBuilder') {
      // Non-NodeBuilder node: 100% JSON deep equality (structural identity) required!
      if (!deepEqualJSON(origSnapshot, transNode)) {
        nonNbMutations++;
        console.error(`[NON_NB_NODE_MUTATION] Non-NodeBuilder node "${transNode.id}" was modified!`);
      }
    } else {
      // NodeBuilder node: Post-transformation verification
      // 1. Post-condition: transNode.id and transNode.filePath must be valid non-empty, non-whitespace strings
      if (typeof transNode.id !== 'string' || transNode.id.trim().length === 0) {
        throw new Error(`[TRANS_SSOT_EMPTY_PATH_VIOLATION] Transformed Node ID is empty, non-string, or whitespace-only: "${transNode.id}"`);
      }
      if (typeof transNode.filePath !== 'string' || transNode.filePath.trim().length === 0) {
        throw new Error(`[TRANS_SSOT_EMPTY_PATH_VIOLATION] Transformed Node "${transNode.id}" filePath is empty, non-string, or whitespace-only: "${transNode.filePath}"`);
      }

      // 2. Independent filePath calculation verification (P0-3)
      const expectedFilePath = auditComputeExpectedPath(origSnapshot.filePath!);
      if (transNode.filePath !== expectedFilePath) {
        throw new Error(`[FAIL P0-3] Node "${transNode.id}" filePath diverged from independent auditor calculation: got "${transNode.filePath}", expected "${expectedFilePath}"`);
      }

      // 3. Post-condition: data.file mutual consistency verification
      // (Pre-conditions on origSnapshot were already verified and asserted in Step 1)
      const origHasFile = origSnapshot.data !== null && typeof origSnapshot.data === 'object' && !Array.isArray(origSnapshot.data) && Object.prototype.hasOwnProperty.call(origSnapshot.data, 'file');
      const transHasFile = transNode.data !== null && typeof transNode.data === 'object' && !Array.isArray(transNode.data) && Object.prototype.hasOwnProperty.call(transNode.data, 'file');

      if (origHasFile) {
        if (!transHasFile) {
          throw new Error(`[FAIL P0-3] Node "${transNode.id}": original had data.file, but transformed node lacks data.file!`);
        }
        if (typeof transNode.data.file !== 'string' || transNode.data.file.trim().length === 0) {
          throw new Error(`[TRANS_SSOT_EMPTY_OR_NON_STRING_PATH] Transformed Node "${transNode.id}" has empty, non-string, or whitespace-only data.file: "${transNode.data.file}"`);
        }
        if (transNode.data.file !== transNode.filePath) {
          throw new Error(`[FAIL P0-3] Invariant violation on "${transNode.id}": Node.data.file !== Node.filePath ("${transNode.data.file}" !== "${transNode.filePath}")`);
        }
      } else {
        // If original did not have data.file, transformer must NOT synthesize it
        if (transHasFile) {
          throw new Error(`[FAIL P0-3] Node "${transNode.id}": data.file was unauthorizedly synthesized!`);
        }
      }

      // P0-2: Independent Role Check based on normalized filePath (matching NodeBuilder.ts contract)
      const targetFilePathForRole = transNode.filePath !== undefined ? transNode.filePath : transNode.id;
      const expectedRole = auditComputeExpectedRole(targetFilePathForRole);
      if (transNode.role !== expectedRole) {
        roleMismatches++;
        console.error(`[ROLE_MISMATCH] Node "${transNode.id}": got "${transNode.role}", expected "${expectedRole}"`);
      }

      // Non-target attribute invariance check (Allowlist exclusion via stripTransformationTargets)
      const origFiltered = stripTransformationTargets(origSnapshot);
      const transFiltered = stripTransformationTargets(transNode);

      if (!deepEqualJSON(origFiltered, transFiltered)) {
        nbAttributeMismatches++;
        console.error(`[NB_NODE_ATTRIBUTE_MUTATION] Node "${transNode.id}" non-target attributes diverged!`);
      }
    }
  }

  console.log(`\nStep 3 & 4 (Bijective Node & Attribute Verification):`);
  console.log(`- Bijective Mapping & Set Equivalence: 100% Verified [PASS]`);
  console.log(`- Non-NodeBuilder Mutations: ${nonNbMutations} (Must be 0)`);
  console.log(`- NodeBuilder Non-Target Attribute Mismatches: ${nbAttributeMismatches} (Must be 0)`);
  console.log(`- Auditor Independent Role Mismatches: ${roleMismatches} (Must be 0)`);

  if (nonNbMutations > 0) throw new Error(`[FAIL P0-4] Non-NodeBuilder nodes were mutated!`);
  if (nbAttributeMismatches > 0) throw new Error(`[FAIL P0-3] NodeBuilder non-target attributes diverged!`);
  if (roleMismatches > 0) throw new Error(`[FAIL P0-4] Role calculation diverged from auditor independent rules!`);

  // --------------------------------------------------------------------------
  // Step 5: Strict Independent Edge Invariant Verification
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

    const origSnapshot = originalEdgeSnapshot.get(transformedEdge.id);
    if (!origSnapshot) {
      throw new Error(`[FAIL] Transformed edge "${transformedEdge.id}" does not exist in original snapshot!`);
    }

    // P0-2 Invariant: Assert total endpoint domain mapping: e.from, e.to \in dom(M)
    if (!idMapping.has(origSnapshot.from)) {
      throw new Error(`[FAIL P0-2] Edge "${transformedEdge.id}" from endpoint "${origSnapshot.from}" not in mapping domain dom(M)!`);
    }
    if (!idMapping.has(origSnapshot.to)) {
      throw new Error(`[FAIL P0-2] Edge "${transformedEdge.id}" to endpoint "${origSnapshot.to}" not in mapping domain dom(M)!`);
    }

    const expectedFrom = idMapping.get(origSnapshot.from)!;
    const expectedTo = idMapping.get(origSnapshot.to)!;

    // Verify 1: Endpoint reachability in transformed node set
    if (!transformedNodeMap.has(transformedEdge.from) || !transformedNodeMap.has(transformedEdge.to)) {
      brokenEndpoints++;
    }

    // Verify 2: Endpoint mapping correctness
    if (transformedEdge.from !== expectedFrom || transformedEdge.to !== expectedTo) {
      mismatchedEndpoints++;
    }

    if (transformedEdge.from !== origSnapshot.from || transformedEdge.to !== origSnapshot.to) {
      redirectedCount++;
    }

    // Verify 3: Full JSON attribute preservation (all properties except from/to)
    const origProps: Record<string, any> = { ...origSnapshot };
    delete origProps.from;
    delete origProps.to;

    const transProps: Record<string, any> = { ...transformedEdge };
    delete transProps.from;
    delete transProps.to;

    if (!deepEqualJSON(origProps, transProps)) {
      mismatchedAttributes++;
      console.error(`[EDGE_ATTRIBUTE_MISMATCH] Edge "${transformedEdge.id}" properties diverged from snapshot!`);
    }
  }

  // P0-2 Invariant: Edge set cardinality & bidirectional ID set equality
  if (transformedEdgeIds.size !== transformedState.edges.length) {
    throw new Error(`[BIJECTION] Duplicate transformed edge IDs: set size ${transformedEdgeIds.size} !== array length ${transformedState.edges.length}`);
  }
  if (transformedEdgeIds.size !== originalEdgeIds.size) {
    throw new Error(`[FAIL P0-2] Edge count mismatch: transformed ${transformedEdgeIds.size} !== original ${originalEdgeIds.size}`);
  }
  for (const edgeId of originalEdgeIds) {
    if (!transformedEdgeIds.has(edgeId)) {
      throw new Error(`[FAIL P0-2] Original edge ID "${edgeId}" missing from transformed graph!`);
    }
  }
  for (const edgeId of transformedEdgeIds) {
    if (!originalEdgeIds.has(edgeId)) {
      throw new Error(`[FAIL P0-2] Transformed edge ID "${edgeId}" missing from original graph!`);
    }
  }

  console.log(`\nStep 5 (Independent Edge Invariant Verification):`);
  console.log(`- Edge Count Preserved: ${transformedEdgeIds.size} === ${originalEdgeIds.size} [PASS]`);
  console.log(`- Broken Endpoints: ${brokenEndpoints} (Must be 0)`);
  console.log(`- Mismatched Endpoints: ${mismatchedEndpoints} (Must be 0)`);
  console.log(`- Mismatched Edge Attributes: ${mismatchedAttributes} (Must be 0)`);
  console.log(`- Redirected Endpoints: ${redirectedCount}`);

  if (transformedEdgeIds.size !== originalEdgeIds.size) throw new Error(`[FAIL] Edge count invariant violated!`);
  if (brokenEndpoints > 0) throw new Error(`[FAIL] Broken endpoints detected!`);
  if (mismatchedEndpoints > 0) throw new Error(`[FAIL] Edge endpoint mapping mismatch detected!`);
  if (mismatchedAttributes > 0) throw new Error(`[FAIL] Edge attribute divergence detected!`);

  // --------------------------------------------------------------------------
  // Step 6: P1-1, P1-2, P1-4 - Exact ID-Level & Type-Level Allow-List Audit
  // --------------------------------------------------------------------------
  console.log(`\nStep 6 (Exact ID-Level Allow-List Audit):`);
  const rawAllowedIds = fs.readFileSync(spec.allowedIdsPath, 'utf-8');
  const allowedIdList: any = JSON.parse(rawAllowedIds);

  // P1-1 Invariant: allowedIdList must be an Array of non-empty strings with 0 duplicates
  if (!Array.isArray(allowedIdList)) {
    throw new Error(`[FAIL P1-1] Allow-list JSON must be an array!`);
  }
  for (const item of allowedIdList) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new Error(`[FAIL P1-1] Invalid allow-list item: "${item}"`);
    }
  }
  const allowedIdSet = new Set<string>(allowedIdList);
  if (allowedIdList.length !== allowedIdSet.size) {
    throw new Error(`[FAIL P1-1] Duplicate IDs found in allow-list JSON! Length=${allowedIdList.length}, Unique=${allowedIdSet.size}`);
  }
  if (allowedIdSet.size !== spec.expectedTransitions) {
    throw new Error(`[FAIL P1-1] Allowed ID list size mismatch: ${allowedIdSet.size} !== ${spec.expectedTransitions}`);
  }

  // Total transition count
  if (roleTransitions.length !== spec.expectedTransitions) {
    throw new Error(`[FAIL] Observed transitions count mismatch: ${roleTransitions.length} !== ${spec.expectedTransitions}`);
  }

  // Exact Bi-directional ID Set Equality: Observed === Allowed
  const observedIdSet = new Set<string>(roleTransitions.map(t => t.id));
  for (const id of observedIdSet) {
    if (!allowedIdSet.has(id)) {
      throw new Error(`[FAIL P1-1] Unallowed node ID transitioned to TEST: "${id}"`);
    }
  }
  for (const id of allowedIdSet) {
    if (!observedIdSet.has(id)) {
      throw new Error(`[FAIL P1-1] Expected allowed node ID did not transition: "${id}"`);
    }
  }

  // P1-4: Verify transition cause condition (Segment rule requirement: test, tests, unit_tests, specs, __tests__)
  // P1-1: Query transformed node by ID and test transNode.filePath
  for (const id of observedIdSet) {
    const transNode = transformedNodeMap.get(id);
    if (!transNode) {
      throw new Error(`[FAIL P1-1] Observed transitioned node ID "${id}" not found in transformedNodeMap!`);
    }
    const targetPath = transNode.filePath !== undefined ? transNode.filePath : transNode.id;
    const isSeg = /(^|\/)(test|tests|unit_tests|specs|__tests__)(\/|$)/i.test(targetPath.replace(/\\/g, '/'));
    if (!isSeg) {
      throw new Error(`[FAIL P1-1] Node "${id}" (filePath: "${targetPath}") promoted without satisfying test segment condition!`);
    }
  }

  // P1-2: Type-level breakdown assertion using Object.prototype.hasOwnProperty
  const observedBreakdown: { [key: string]: number } = {};
  for (const t of roleTransitions) {
    const k = `${t.from} -> ${t.to}`;
    observedBreakdown[k] = (observedBreakdown[k] || 0) + 1;
    if (!Object.prototype.hasOwnProperty.call(spec.allowedTransitions, k)) {
      throw new Error(`[FAIL P1-2] Unallowed transition type: "${k}" on node "${t.id}"`);
    }
  }

  for (const [k, count] of Object.entries(spec.allowedTransitions)) {
    const observedCount = observedBreakdown[k] || 0;
    if (observedCount !== count) {
      throw new Error(`[FAIL P1-2] Type count mismatch for "${k}": observed ${observedCount} !== expected ${count}`);
    }
  }

  console.log(`- Exact ID Set Equality (Bi-directional): 100% Verified [PASS]`);
  console.log(`- Test Segment Cause Assertion: 100% Verified [PASS]`);
  console.log(`- Transition Type Breakdown:`, observedBreakdown);

  console.log(`\n>>> [VERDICT: PIPELINE VERIFICATION PASS] All Specified L3 Differential Invariants Satisfied on Target Dataset <<<`);
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
  },
  allowedIdsPath: path.resolve(__dirname, 'godot_phase_b_allow_ids.json')
});

runRigorousIndependentL3Audit(vscodePath, 'VS Code', {
  expectedTransitions: 93,
  allowedTransitions: {
    'RUNTIME -> TEST': 80,
    'RUNTIME_ENTRY -> TEST': 6,
    'TOOLING -> TEST': 6,
    'DOMAIN_MODEL -> TEST': 1
  },
  allowedIdsPath: path.resolve(__dirname, 'vscode_phase_b_allow_ids.json')
});
