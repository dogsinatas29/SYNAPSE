import * as path from 'path';
import { isBuildOrPackagingAsset } from '../../src/utils/exclusionRules';

// ============================================================================
// Phase B Architecture Transformer Library (v1.0.5)
// Independent Transformation Implementation
// ============================================================================

export interface Node {
  id: string;
  filePath?: string;
  role?: string;
  type?: string;
  cluster_id?: string;
  createdBy?: string;
  data?: any;
  [key: string]: any;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  type?: string;
  weight?: number;
  provenance?: string;
  data?: any;
  [key: string]: any;
}

export interface ProjectState {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Robust Canonical Path Normalizer (v1.0.5):
 * - Preserves virtual schemas (ghost://, external://, builtin://)
 * - Strict UNC handling: Exactly 2 leading slashes followed by non-empty server & share (//server/share)
 * - Multiple leading slashes (>2, e.g. ///foo) are normalized to single leading slash (/foo)
 * - Preserves POSIX absolute paths (/home/project/... -> /home/project/...)
 * - Preserves Windows drive paths (C:\project\... -> C:/project/...)
 * - Preserves parent directory navigation (../ -> ../)
 * - Iteratively resolves repeated current dir segments (./ and /./ -> normalized)
 * - Collapses consecutive slashes (foo///bar -> foo/bar)
 */
export function normalizePathCanonical(rawPath: string): string {
  if (!rawPath) return rawPath;
  if (rawPath.startsWith('ghost://') || rawPath.startsWith('external://') || rawPath.startsWith('builtin://')) {
    return rawPath;
  }

  let p = rawPath.replace(/\\/g, '/');

  // 1. Strict UNC detection: Starts with exactly two slashes and has valid server & share segments
  const isStrictUNC = /^\/\/[^\/\s]+\/[^\/\s]+/.test(p) && !p.startsWith('///');

  let prefix = '';
  if (isStrictUNC) {
    prefix = '//';
    p = p.substring(2);
  } else if (p.startsWith('/')) {
    prefix = '/';
    p = p.replace(/^\/+/, '');
  }

  // 2. Collapse consecutive slashes in the path body
  p = p.replace(/\/+/g, '/');

  // 3. Resolve all current directory dot segments (./ and /./) iteratively
  const parts = p.split('/');
  const resolvedParts: string[] = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    resolvedParts.push(part);
  }
  p = resolvedParts.join('/');

  return prefix + p;
}

/**
 * Canonical determineNodeRole implementation matching NodeBuilder.ts:
 * Priority Hierarchy:
 * 1. GRAMMAR (.tmLanguage.json)
 * 2. CONFIG (package.json, tsconfig.json, webpack.config.js, vite.config.ts, .eslintrc.js, .prettierrc, *.yaml, *.json, *.toml)
 * 3. TOOLING Asset (isBuildOrPackagingAsset from exclusionRules)
 * 4. DOCUMENT (.md, .txt)
 * 5. ASSET (.png, .jpg, .svg, etc.)
 * 6. TEST (Segment matching /(^|\/)(test|tests|unit_tests)(\/|$)/i OR Test File Naming)
 * 7. TOOLING Script (relPath.includes('/scripts/') || relPath.includes('/build/') || relPath.includes('/tools/'))
 * 8. DOMAIN_MODEL (schema.ts, types.ts, interfaces.ts, constants.ts, *.d.ts)
 * 9. RUNTIME_ENTRY (extension.ts, main.ts, index.ts, activate.ts)
 * 10. RUNTIME (Default)
 */
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

  // Priority 6: Test Code & Runner (Segment-based or Basename patterns)
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

  // Priority 7: Tooling Scripts (Preserve exact NodeBuilder.ts rule)
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

/**
 * Phase B Pure Transform Engine:
 * Generates an independently transformed graph from a given ProjectState.
 * P0-4 Fix: Non-NodeBuilder nodes are preserved completely without any new property synthesis!
 */
export function transformProjectStatePhaseB(originalState: ProjectState): {
  transformedState: ProjectState;
  idMapping: Map<string, string>;
  roleTransitions: Array<{ id: string; from: string; to: string }>;
} {
  const transformedNodes: Node[] = [];
  const idMapping = new Map<string, string>();
  const roleTransitions: Array<{ id: string; from: string; to: string }> = [];

  for (const node of originalState.nodes) {
    const origId = node.id;

    // Strict preservation of Non-NodeBuilder nodes: Zero property mutation or injection!
    if (node.createdBy !== 'NodeBuilder') {
      idMapping.set(origId, origId);
      transformedNodes.push(JSON.parse(JSON.stringify(node)));
      continue;
    }

    // NodeBuilder nodes:
    const newId = normalizePathCanonical(origId);
    const newRole = determineNodeRoleCanonical(newId).role;
    idMapping.set(origId, newId);

    if (newRole !== node.role) {
      roleTransitions.push({ id: origId, from: node.role || 'UNKNOWN', to: newRole });
    }

    transformedNodes.push({
      ...node,
      id: newId,
      filePath: node.filePath ? normalizePathCanonical(node.filePath) : newId,
      role: newRole
    });
  }

  // Transform Edges
  const transformedEdges: Edge[] = [];
  for (const edge of originalState.edges) {
    const mappedFrom = idMapping.has(edge.from) ? idMapping.get(edge.from)! : edge.from;
    const mappedTo = idMapping.has(edge.to) ? idMapping.get(edge.to)! : edge.to;

    transformedEdges.push({
      ...edge,
      from: mappedFrom,
      to: mappedTo
    });
  }

  return {
    transformedState: {
      nodes: transformedNodes,
      edges: transformedEdges
    },
    idMapping,
    roleTransitions
  };
}
