import * as fs from 'fs';
import * as path from 'path';
import { ValidationEngine } from '../core/validation/ValidationEngine';
import { GraphSnapshot } from '../core/validation/ValidationContext';

import { ProjectStateSerializer } from '../core/transaction/ProjectStateSerializer';

export function runB5ValidationLayer(graphFilePath: string, runCount: number): void {
    let data = JSON.parse(fs.readFileSync(graphFilePath, 'utf8'));
    data = ProjectStateSerializer.restore(data);
    const snapshot: GraphSnapshot = {
        nodes: data.nodes || (data.graph && data.graph.nodes) || [],
        edges: data.edges || (data.graph && data.graph.edges) || [],
        clusters: data.clusters || []
    };

    const workspaceRoot = process.env.SYNAPSE_WORKSPACE_ROOT || path.resolve(path.dirname(graphFilePath), '..');
    
    // Run Graph Edge Aggregator to generate IntentEdge Cache for ASR Evidence Layer
    const edgeMap = new Map<string, any>();
    for (const e of snapshot.edges) {
        if (!e.from || !e.to) continue;
        const key = `${e.from}|${e.to}`;
        if (!edgeMap.has(key)) {
            edgeMap.set(key, { source: e.from, target: e.to, evidenceCount: 0 });
        }
        edgeMap.get(key).evidenceCount += (e.weight || 1);
    }
    const intentEdges = Array.from(edgeMap.values());
    
    const context = ValidationEngine.analyzeState(snapshot, runCount, workspaceRoot, intentEdges);

    const reportPath = path.join(workspaceRoot, 'synapse_report', 'b5_validation_layer.latest.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(context.metrics, null, 2), 'utf-8');
    console.log(`\n[Validation] JSON report saved: ${reportPath}`);
}

if (require.main === module) {
    const defaultPath = path.join(__dirname, '../../data/project_state.json');
    const targetPath = process.argv[2] || defaultPath;
    const runCount = Math.max(1, parseInt(process.argv[3]) || 3);
    runB5ValidationLayer(targetPath, runCount);
}
