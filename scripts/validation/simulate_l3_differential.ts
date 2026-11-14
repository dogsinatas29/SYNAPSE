import * as fs from 'fs';
import * as path from 'path';

// Condition 4: L3 Differential Graph Validation Simulator (Fixed Edge Schema: from / to)

interface Edge {
  id?: string;
  from?: string;
  to?: string;
  source?: string;
  target?: string;
  type?: string;
  [key: string]: any;
}

interface ProjectState {
  nodes: Array<{
    id: string;
    filePath?: string;
    role?: string;
    type?: string;
    cluster_id?: string;
    [key: string]: any;
  }>;
  edges: Edge[];
}

function normalizePath(raw: string): string {
  if (!raw) return raw;
  if (raw.startsWith('ghost://') || raw.startsWith('external://') || raw.startsWith('builtin://')) {
    return raw;
  }
  let p = raw.replace(/\\/g, '/');
  p = p.replace(/\/+/g, '/');
  p = p.replace(/\/\.\//g, '/');
  if (p.startsWith('./')) p = p.substring(2);
  if (p.startsWith('/')) p = p.substring(1);
  if (p.length > 1 && p.endsWith('/')) p = p.substring(0, p.length - 1);
  return p;
}

function inferRole(filePath: string, currentRole: string): string {
  if (filePath.startsWith('ghost://') || filePath.startsWith('external://') || filePath.startsWith('builtin://')) {
    return currentRole;
  }

  const isTestSegment = /(^|\/)(test|tests|unit_tests)(\/|$)/i.test(filePath);
  const baseNameLower = path.basename(filePath).toLowerCase();
  const isTestFile = (
    baseNameLower.includes('.test.') ||
    baseNameLower.includes('.spec.') ||
    baseNameLower.startsWith('test_') ||
    baseNameLower.endsWith('_test.cpp') ||
    baseNameLower.endsWith('_test.h') ||
    baseNameLower.endsWith('_test.py') ||
    baseNameLower === 'test-utils.ts'
  );

  if ((isTestSegment || isTestFile) && (currentRole === 'RUNTIME' || currentRole === 'RUNTIME_ENTRY')) {
    return 'TEST';
  }

  return currentRole;
}

function simulateL3Differential(filePath: string, projectName: string) {
  console.log(`\n===============================================================`);
  console.log(`[L3 DIFFERENTIAL VALIDATION] ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`===============================================================`);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const originalState: ProjectState = JSON.parse(raw);

  // Before Metrics
  const beforeNodesCount = originalState.nodes.length;
  const beforeEdgesCount = originalState.edges.length;
  const beforeGhostCount = originalState.nodes.filter(n => n.id.startsWith('ghost://')).length;
  const beforeRoleDist: { [role: string]: number } = {};
  for (const n of originalState.nodes) {
    beforeRoleDist[n.role || 'UNKNOWN'] = (beforeRoleDist[n.role || 'UNKNOWN'] || 0) + 1;
  }

  // Simulation: Transform Nodes
  const idRedirectionMap = new Map<string, string>();
  const simulatedNodesMap = new Map<string, any>();

  for (const node of originalState.nodes) {
    const originalId = node.id;
    const newId = normalizePath(originalId);
    idRedirectionMap.set(originalId, newId);

    const newRole = inferRole(newId, node.role || 'UNKNOWN');

    if (simulatedNodesMap.has(newId)) {
      // Collision / Merge case (e.g. /b.md vs b.md)
    } else {
      simulatedNodesMap.set(newId, {
        ...node,
        id: newId,
        filePath: normalizePath(node.filePath || originalId),
        role: newRole
      });
    }
  }

  // Transform Edges
  let redirectedEdgeCount = 0;
  let brokenEdgeCount = 0;
  let duplicateEdgeCount = 0;
  const simulatedEdges: any[] = [];
  const edgeKeySet = new Set<string>();

  for (const edge of originalState.edges) {
    const origFrom = edge.from || edge.source || '';
    const origTo = edge.to || edge.target || '';

    const newFrom = idRedirectionMap.get(origFrom) || normalizePath(origFrom);
    const newTo = idRedirectionMap.get(origTo) || normalizePath(origTo);

    if (newFrom !== origFrom || newTo !== origTo) {
      redirectedEdgeCount++;
    }

    if (!simulatedNodesMap.has(newFrom) || !simulatedNodesMap.has(newTo)) {
      brokenEdgeCount++;
    }

    const key = `${newFrom}->${newTo}:${edge.type || 'dep'}:${edge.id || ''}`;
    if (!edgeKeySet.has(key)) {
      edgeKeySet.add(key);
      simulatedEdges.push({
        ...edge,
        from: newFrom,
        to: newTo
      });
    } else {
      duplicateEdgeCount++;
    }
  }

  // After Metrics
  const afterNodesCount = simulatedNodesMap.size;
  const afterEdgesCount = simulatedEdges.length;
  const afterGhostCount = Array.from(simulatedNodesMap.values()).filter(n => n.id.startsWith('ghost://')).length;
  const afterRoleDist: { [role: string]: number } = {};
  for (const n of simulatedNodesMap.values()) {
    afterRoleDist[n.role] = (afterRoleDist[n.role] || 0) + 1;
  }

  console.log(`\n--- Metric Comparison (Before vs After) ---`);
  console.log(`Node Count:  Before = ${beforeNodesCount} | After = ${afterNodesCount} (Diff: ${afterNodesCount - beforeNodesCount})`);
  console.log(`Edge Count:  Before = ${beforeEdgesCount} | After = ${afterEdgesCount} (Diff: ${afterEdgesCount - beforeEdgesCount})`);
  console.log(`Ghost Count: Before = ${beforeGhostCount} | After = ${afterGhostCount} (Diff: ${afterGhostCount - beforeGhostCount})`);
  console.log(`Edges Redirected: ${redirectedEdgeCount}`);
  console.log(`Broken Edges: ${brokenEdgeCount}`);
  console.log(`Duplicate Edges: ${duplicateEdgeCount}`);

  console.log(`\n--- Role Distribution Diff ---`);
  const allRoles = Array.from(new Set([...Object.keys(beforeRoleDist), ...Object.keys(afterRoleDist)])).sort();
  for (const r of allRoles) {
    const b = beforeRoleDist[r] || 0;
    const a = afterRoleDist[r] || 0;
    const delta = a - b;
    console.log(`  - ${r.padEnd(15)}: Before=${b.toString().padStart(5)} | After=${a.toString().padStart(5)} | Delta=${(delta >= 0 ? '+' : '') + delta}`);
  }

  return {
    projectName,
    beforeNodesCount,
    afterNodesCount,
    beforeEdgesCount,
    afterEdgesCount,
    redirectedEdgeCount,
    brokenEdgeCount,
    beforeRoleDist,
    afterRoleDist
  };
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

simulateL3Differential(godotPath, 'Godot Engine');
simulateL3Differential(vscodePath, 'VS Code');
