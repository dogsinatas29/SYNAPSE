import * as fs from 'fs';
import * as path from 'path';
import { ValidationReportBuilder } from '../core/validation/ValidationReportBuilder';
import { ValidationContext, ValidationMetrics } from '../core/validation/ValidationContext';

export function runSurgeryReportGeneration(reportPath: string, evId: string): void {
    const metrics: ValidationMetrics = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Reconstruct a dummy ValidationContext since we only have metrics from the JSON file
    // Note: To extract top files, we would need the GraphSnapshot, but since this is just
    // a thin wrapper for legacy CLI execution, we'll pass an empty snapshot.
    // The metrics might already have `topImpactFiles` if they were included.
    const context: ValidationContext = {
        snapshot: { nodes: [], edges: [], clusters: [] },
        metrics,
        workspaceRoot: process.env.SYNAPSE_WORKSPACE_ROOT || path.resolve(path.dirname(reportPath), '../..')
    };

    ValidationReportBuilder.generateReports(context, evId);
}

if (require.main === module) {
    const evId = process.argv[2] || 'EV-LIVE';
    const workspaceRoot = process.env.SYNAPSE_WORKSPACE_ROOT || path.join(__dirname, '../..');
    const reportPath = path.join(workspaceRoot, 'report/b5_validation_layer.latest.json');
    runSurgeryReportGeneration(reportPath, evId);
}
