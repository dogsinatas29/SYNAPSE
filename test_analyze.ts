import * as path from 'path';
import * as fs from 'fs';
import { ValidationEngine } from './src/core/validation/ValidationEngine';
import { GraphSnapshot } from './src/core/validation/ValidationContext';

const targetPath = path.join(__dirname, 'synapse_data/project_state.json');
const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
const snapshot: GraphSnapshot = {
    nodes: data.nodes || (data.graph && data.graph.nodes) || [],
    edges: data.edges || (data.graph && data.graph.edges) || [],
    clusters: data.clusters || []
};
const workspaceRoot = __dirname;
const intentEdges = snapshot.edges.map((e: any) => ({
    source: typeof e.from === 'object' ? (e.from.id || e.from.name || e.from) : e.from,
    target: typeof e.to === 'object' ? (e.to.id || e.to.name || e.to) : e.to,
    type: e.type || 'UNKNOWN',
    semanticType: e.semanticType || 'CODE',
    evidenceCount: typeof e.evidenceCount === 'number' ? e.evidenceCount : 1,
    isGhost: !!e.isGhost
}));

const context = ValidationEngine.analyzeState(snapshot, 1, workspaceRoot, intentEdges);
console.log(JSON.stringify({
    architecturalFindings: context.metrics.architecturalFindings?.length,
    systemAssemblyPoints: context.metrics.systemAssemblyPoints?.length,
    topImpactFiles: context.metrics.topImpactFiles?.length
}, null, 2));
