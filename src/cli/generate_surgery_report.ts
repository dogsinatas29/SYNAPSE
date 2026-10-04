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
    const projectStatePath = path.join(process.env.SYNAPSE_WORKSPACE_ROOT || path.resolve(path.dirname(reportPath), '..'), 'synapse_data', 'project_state.json');
    let snapshot = { nodes: [], edges: [], clusters: [] };
    if (fs.existsSync(projectStatePath)) {
        const stateData = JSON.parse(fs.readFileSync(projectStatePath, 'utf8'));
        snapshot = {
            nodes: stateData.nodes || (stateData.graph && stateData.graph.nodes) || [],
            edges: stateData.edges || (stateData.graph && stateData.graph.edges) || [],
            clusters: stateData.clusters || []
        };
    }

    const context: ValidationContext = {
        snapshot,
        metrics,
        workspaceRoot: process.env.SYNAPSE_WORKSPACE_ROOT || path.resolve(path.dirname(reportPath), '..')
    };

    ValidationReportBuilder.generateReports(context, evId);
}

if (require.main === module) {
    const evId = process.argv[2] || 'EV-LIVE';
    const workspaceRoot = process.env.SYNAPSE_WORKSPACE_ROOT || path.join(__dirname, '../..');
    const reportPath = path.join(workspaceRoot, 'synapse_report', 'b5_validation_layer.latest.json');
    runSurgeryReportGeneration(reportPath, evId);
}
