import * as fs from 'fs';
import * as path from 'path';
import { ValidationEngine } from '../core/validation/ValidationEngine';
import { GraphSnapshot } from '../core/validation/ValidationContext';

export function runB5ValidationLayer(graphFilePath: string, runCount: number): void {
    const data = JSON.parse(fs.readFileSync(graphFilePath, 'utf8'));
    const snapshot: GraphSnapshot = {
        nodes: data.nodes || (data.graph && data.graph.nodes) || [],
        edges: data.edges || (data.graph && data.graph.edges) || [],
        clusters: data.clusters || []
    };

    const workspaceRoot = process.env.SYNAPSE_WORKSPACE_ROOT || path.resolve(path.dirname(graphFilePath), '..');
    
    const context = ValidationEngine.analyzeState(snapshot, runCount, workspaceRoot);

    const reportPath = path.join(workspaceRoot, 'report/b5_validation_layer.latest.json');
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
