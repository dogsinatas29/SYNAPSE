import * as path from 'path';
import { runAudit } from './community_edge_audit';
import { runStageB5Validation } from './stage_a5_validator';

function runBundle(graphFilePath: string) {
    console.log('=== SYNAPSE Bundle: Edge Audit + Stage B.5 ===');
    console.log(`[Input] ${graphFilePath}`);

    console.log('\n----- [Part 1/2] Community Edge Audit -----');
    runAudit(graphFilePath);

    console.log('\n----- [Part 2/2] Stage B.5 Validation -----');
    runStageB5Validation(graphFilePath);
}

if (require.main === module) {
    const defaultPath = path.join(__dirname, '../../data/project_state.json');
    const targetPath = process.argv[2] || defaultPath;
    runBundle(targetPath);
}

export { runBundle };
