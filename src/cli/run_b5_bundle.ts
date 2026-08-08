import * as path from 'path';
import { runAudit } from './community_edge_audit';
import { runStageB5Validation } from './stage_a5_validator';
import { GraphSnapshot } from '../core/validation/ValidationContext';

export function runBundle(snapshot: Readonly<GraphSnapshot>, workspaceRoot: string) {
    console.log('=== SYNAPSE Bundle: Edge Audit + Stage B.5 ===');

    console.log('\n----- [Part 1/2] Community Edge Audit -----');
    runAudit(snapshot, workspaceRoot);

    console.log('\n----- [Part 2/2] Stage B.5 Validation -----');
    runStageB5Validation(snapshot, workspaceRoot);
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
