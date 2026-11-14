import * as fs from 'fs';
import * as path from 'path';

// Condition 2: Path Normalization Conflict Analysis Simulation
// Rules to evaluate:
// 1. replace backslashes with slashes: \ -> /
// 2. resolve /./ and extra slashes (e.g. // -> /)
// 3. strip leading slash (if relative project file): /foo/bar -> foo/bar
// 4. resolve ../ where applicable
// 5. virtual schema protection: ghost://, external:// must remain untouched!

interface ProjectState {
  nodes: Array<{
    id: string;
    path?: string;
    role?: string;
    type?: string;
    [key: string]: any;
  }>;
  edges?: Array<{
    source: string;
    target: string;
    type?: string;
    [key: string]: any;
  }>;
}

function normalizePathCandidate(rawPath: string): string {
  if (!rawPath) return rawPath;

  // Protect virtual schemas
  if (rawPath.startsWith('ghost://') || rawPath.startsWith('external://') || rawPath.startsWith('builtin://')) {
    return rawPath;
  }

  // 1. Replace Windows backslashes
  let p = rawPath.replace(/\\/g, '/');

  // 2. Handle multiple consecutive slashes
  p = p.replace(/\/+/g, '/');

  // 3. Handle /./ segments
  p = p.replace(/\/\.\//g, '/');
  if (p.startsWith('./')) {
    p = p.substring(2);
  }

  // 4. Strip leading slash for relative project paths
  if (p.startsWith('/')) {
    p = p.substring(1);
  }

  // 5. Handle trailing slash if not root
  if (p.length > 1 && p.endsWith('/')) {
    p = p.substring(0, p.length - 1);
  }

  return p;
}

function analyzeProject(filePath: string, projectName: string) {
  console.log(`\n==================================================`);
  console.log(`[ANALYSIS] Project: ${projectName}`);
  console.log(`[FILE] ${filePath}`);
  console.log(`==================================================`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: ProjectState = JSON.parse(raw);

  const totalNodes = data.nodes.length;
  console.log(`Total nodes in SSoT: ${totalNodes}`);

  let backslashCount = 0;
  let leadingSlashCount = 0;
  let doubleSlashCount = 0;
  let dotSlashCount = 0;
  let dotDotSlashCount = 0;
  let virtualSchemaCount = 0;
  let changedCount = 0;

  const originalIdSet = new Set<string>();
  const normalizedMap = new Map<string, string[]>(); // normalizedPath -> list of original IDs

  for (const node of data.nodes) {
    const id = node.id;
    originalIdSet.add(id);

    if (id.startsWith('ghost://') || id.startsWith('external://') || id.startsWith('builtin://')) {
      virtualSchemaCount++;
      continue;
    }

    if (id.includes('\\')) backslashCount++;
    if (id.startsWith('/')) leadingSlashCount++;
    if (id.includes('//')) doubleSlashCount++;
    if (id.includes('/./') || id.startsWith('./')) dotSlashCount++;
    if (id.includes('../')) dotDotSlashCount++;

    const norm = normalizePathCandidate(id);
    if (norm !== id) {
      changedCount++;
    }

    if (!normalizedMap.has(norm)) {
      normalizedMap.set(norm, []);
    }
    normalizedMap.get(norm)!.push(id);
  }

  console.log(`\n--- Pattern Detection Metrics ---`);
  console.log(`- Virtual Schemas (ghost/external/builtin): ${virtualSchemaCount}`);
  console.log(`- Contains Backslash (\\): ${backslashCount}`);
  console.log(`- Starts with Leading Slash (/): ${leadingSlashCount}`);
  console.log(`- Contains Consecutive Slashes (//): ${doubleSlashCount}`);
  console.log(`- Contains Current Dir (./ or /./): ${dotSlashCount}`);
  console.log(`- Contains Parent Dir (../): ${dotDotSlashCount}`);
  console.log(`- Total IDs that would change: ${changedCount}`);

  // Collision Detection
  let collisionCount = 0;
  const collisions: Array<{ normalized: string; originals: string[] }> = [];

  for (const [norm, originals] of normalizedMap.entries()) {
    if (originals.length > 1) {
      collisionCount++;
      collisions.push({ normalized: norm, originals });
    }
  }

  console.log(`\n--- Collision Detection Results ---`);
  console.log(`- Total Normalized Unique Keys: ${normalizedMap.size}`);
  console.log(`- Collision Count (Multiple original IDs mapping to same normalized path): ${collisionCount}`);

  if (collisionCount > 0) {
    console.log(`[ALERT] Collisions detected!`);
    for (const c of collisions.slice(0, 10)) {
      console.log(`  Normalized: "${c.normalized}" <= Originals: ${JSON.stringify(c.originals)}`);
    }
    if (collisions.length > 10) {
      console.log(`  ... and ${collisions.length - 10} more`);
    }
  } else {
    console.log(`[PASS] ZERO Collisions detected across all ${totalNodes} nodes!`);
  }

  return {
    projectName,
    totalNodes,
    virtualSchemaCount,
    backslashCount,
    leadingSlashCount,
    doubleSlashCount,
    dotSlashCount,
    dotDotSlashCount,
    changedCount,
    collisionCount,
    collisions
  };
}

const godotPath = '/home/dogsinatas/다운로드/godot-master/synapse_data/project_state.json';
const vscodePath = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';

const resGodot = analyzeProject(godotPath, 'Godot Engine');
const resVSCode = analyzeProject(vscodePath, 'VS Code');

