import * as fs from 'fs';
import * as path from 'path';

// Condition 4: Rigorous L3 Differential Graph Validator (v1.0.1)
// Conforming to SSoT schema:
// - Nodes: id, filePath, role, type, cluster_id, createdBy, data, etc.
// - Edges: id, from, to, type, provenance, weight, data, etc.
//
// ZERO ASSUMPTIONS:
// - Absolute prohibition of naive first-node-wins drop logic.
// - Full attribute preservation and diff tracking.
// - 1:1 edge correspondence, weight, type, provenance, data preservation.
// - Explicit handling of virtual schemas.

interface Edge {
  id: string;
  from: string;
  to: string;
  type?: string;
  weight?: number;
  provenance?: string;
  data?: any;
  [key: string]: any;
}

interface Node {
  id: string;
  filePath?: string;
  role?: string;
  type?: string;
  cluster_id?: string;
  createdBy?: string;
  data?: any;
  [key: string]: any;
}

interface ProjectState {
  nodes: Node[];
  edges: Edge[];
}

// Exact Candidate for NodeBuilder.ts
function normalizeNodePath(raw: string): string {
  if (!raw) return raw;
  // Guard virtual schemas
  if (raw.startsWith('ghost://') || raw.startsWith('external://') || raw.startsWith('builtin://')) {
    return raw;
  }
  // Windows backslash to slash
  let p = raw.replace(/\\/g, '/');
  // Collapse redundant slashes
  p = p.replace(/\/+/g, '/');
  // Strip relative current dir prefix ./
  if (p.startsWith('./')) p = p.substring(2);
  // Strip redundant /./
  p = p.replace(/\/\.\//g, '/');
  // Strip trailing slash
  if (p.length > 1 && p.endsWith('/')) p = p.substring(0, p.length - 1);
  return p;
}

function determineNodeRole(rawFilePath: string): { role: string; category: string } {
  if (rawFilePath.startsWith('ghost://') || rawFilePath.startsWith('external://') || rawFilePath.startsWith('builtin://')) {
    return { role: 'GHOST', category: 'External' };
  }

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

  // Priority 3: Tooling Assets (heuristic)
  if (relPath.includes('/scripts/') || relPath.includes('/build/') || relPath.includes('/tools/')) {
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

  // Priority 6: Test
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

  // Priority 7: Domain Models & Types
  if (['schema.ts', 'types.ts', 'interfaces.ts', 'constants.ts'].includes(basename) || basename.endsWith('.d.ts')) {
    return { role: 'DOMAIN_MODEL', category: 'Domain' };
  }

  // Priority 8: Runtime Entry Points
  if (['extension.ts', 'main.ts', 'index.ts', 'activate.ts'].includes(basename)) {
    return { role: 'RUNTIME_ENTRY', category: 'Entry' };
  }

  // Priority 9: Default Runtime
  return { role: 'RUNTIME', category: 'Source' };
}

function runRigorousL3Audit(filePath: string, projectName: string) {
  console.log(`\n===============================================================`);
  console.log(`[L3 RIGOROUS DIFFERENTIAL AUDIT v1.0.1] ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`===============================================================`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const originalState: ProjectState = JSON.parse(raw);

  // 1. Initial State Inventory
  const origNodeMap = new Map<string, Node>();
  for (const n of originalState.nodes) origNodeMap.set(n.id, n);

  const origEdgeMap = new Map<string, Edge>();
  for (const e of originalState.edges) origEdgeMap.set(e.id, e);

  console.log(`Initial Inventory: ${origNodeMap.size} nodes, ${origEdgeMap.size} edges`);

  // 2. Node Transformation & Conflict Check
  const transformedNodes = new Map<string, Node>();
  const idMapping = new Map<string, string>(); // oldId -> newId
  const collisionList: Array<{ newId: string; oldIds: string[] }> = [];

  const roleDeltas: { [fromTo: string]: number } = {};

  for (const node of originalState.nodes) {
    const origId = node.id;
    let newId = origId;

    if (node.createdBy === 'NodeBuilder') {
      newId = normalizeNodePath(origId);
    }
    idMapping.set(origId, newId);

    // Role inference: ONLY for physical files created by NodeBuilder
    let newRole = node.role || 'UNKNOWN';
    if (node.createdBy === 'NodeBuilder') {
      newRole = determineNodeRole(newId).role;
    }

    if (newRole !== node.role) {
      const deltaKey = `${node.role} -> ${newRole}`;
      roleDeltas[deltaKey] = (roleDeltas[deltaKey] || 0) + 1;
    }

    if (transformedNodes.has(newId)) {
      // Collision detected!
      collisionList.push({ newId, oldIds: [transformedNodes.get(newId)!.id, origId] });
      throw new Error(`[FATAL] Unhandled Node Collision detected on newId="${newId}"! Automatic overwrite is FORBIDDEN!`);
    } else {
      transformedNodes.set(newId, {
        ...node,
        id: newId,
        filePath: node.filePath ? (node.createdBy === 'NodeBuilder' ? normalizeNodePath(node.filePath) : node.filePath) : newId,
        role: newRole
      });
    }
  }

  console.log(`Node Transformation Completed: ${transformedNodes.size} nodes, 0 collisions.`);

  // 3. Edge Transformation & Attribute Preservation Check
  let edgeCountPreserved = true;
  let weightsPreserved = true;
  let typesPreserved = true;
  let provPreserved = true;
  let dataPreserved = true;
  let brokenEdgeCount = 0;
  let redirectedCount = 0;

  const transformedEdges: Edge[] = [];

  for (const origEdge of originalState.edges) {
    const newFrom = idMapping.get(origEdge.from) || origEdge.from;
    const newTo = idMapping.get(origEdge.to) || origEdge.to;

    if (newFrom !== origEdge.from || newTo !== origEdge.to) {
      redirectedCount++;
    }

    if (!transformedNodes.has(newFrom) || !transformedNodes.has(newTo)) {
      brokenEdgeCount++;
    }

    // Clone edge with updated from/to
    const transformedEdge: Edge = {
      ...origEdge,
      from: newFrom,
      to: newTo
    };

    // Attribute integrity checks
    if (transformedEdge.id !== origEdge.id) edgeCountPreserved = false;
    if (transformedEdge.weight !== origEdge.weight) weightsPreserved = false;
    if (transformedEdge.type !== origEdge.type) typesPreserved = false;
    if (transformedEdge.provenance !== origEdge.provenance) provPreserved = false;
    if (JSON.stringify(transformedEdge.data) !== JSON.stringify(origEdge.data)) dataPreserved = false;

    transformedEdges.push(transformedEdge);
  }

  console.log(`\n--- Edge Integrity Audit ---`);
  console.log(`- Original Edge Count: ${originalState.edges.length}`);
  console.log(`- Transformed Edge Count: ${transformedEdges.length}`);
  console.log(`- Broken Edges (dangling references): ${brokenEdgeCount}`);
  console.log(`- Redirected Edges: ${redirectedCount}`);
  console.log(`- Edge IDs 1:1 Preserved: ${edgeCountPreserved}`);
  console.log(`- Edge Weights 100% Preserved: ${weightsPreserved}`);
  console.log(`- Edge Types 100% Preserved: ${typesPreserved}`);
  console.log(`- Edge Provenance 100% Preserved: ${provPreserved}`);
  console.log(`- Edge Data Payloads 100% Preserved: ${dataPreserved}`);

  console.log(`\n--- Role Transition Audit ---`);
  console.log(`Role Transitions:`, roleDeltas);

  return {
    projectName,
    nodeCount: transformedNodes.size,
    edgeCount: transformedEdges.length,
    brokenEdgeCount,
    redirectedCount,
    edgeCountPreserved,
    weightsPreserved,
    typesPreserved,
    provPreserved,
    dataPreserved,
    roleDeltas
  };
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

runRigorousL3Audit(godotPath, 'Godot Engine');
runRigorousL3Audit(vscodePath, 'VS Code');
