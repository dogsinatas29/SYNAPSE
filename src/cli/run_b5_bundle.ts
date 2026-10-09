import * as path from 'path';
import { runAudit } from './community_edge_audit';
import { runStageB5Validation } from './stage_a5_validator';
import { GraphSnapshot } from '../core/validation/ValidationContext';

export function runBundle(snapshot: Readonly<GraphSnapshot>, workspaceRoot: string) {
    console.log('=== SYNAPSE Bundle: Edge Audit + Stage B.5 ===');

    const perfLog = (global as any).perfLog || ((name: string) => process.stdout.write(`[PERFLOG] ${name} at ${Date.now()}\n`));

    console.log('\n----- [Part 1/2] Community Edge Audit -----');
    perfLog("Bundle 1 Start - runAudit");
    runAudit(snapshot, workspaceRoot);
    perfLog("Bundle 1 End - runAudit");

    console.log('\n----- [Part 2/2] Stage B.5 Validation -----');
    perfLog("Bundle 2 Start - runStageB5Validation");
    runStageB5Validation(snapshot, workspaceRoot);
    perfLog("Bundle 2 End - runStageB5Validation");
}

if (require.main === module) {
    const defaultPath = path.join(__dirname, '../../data/project_state.json');
    const targetPath = process.argv[2] || defaultPath;
    const fs = require('fs');
    if (fs.existsSync(targetPath)) {
        const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        const snapshot: GraphSnapshot = {
            nodes: data.nodes || (data.graph && data.graph.nodes) || [],
            edges: data.edges || (data.graph && data.graph.edges) || [],
            clusters: data.clusters || []
        };
        const workspaceRoot = path.resolve(path.dirname(targetPath), '..');
        runBundle(snapshot, workspaceRoot);
    } else {
        console.error(`File not found: ${targetPath}`);
    }
}
