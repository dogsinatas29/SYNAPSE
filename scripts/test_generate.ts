import { ReportBundleGenerator } from '../src/core/reporting/ReportBundleGenerator';

import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const root = process.env.SYNAPSE_WORKSPACE_ROOT || path.resolve(__dirname, '..');
    const projectStatePath = path.join(root, 'synapse_data', 'project_state.json');
    let snapshot = { nodes: [], edges: [], clusters: [] };
    if (fs.existsSync(projectStatePath)) {
        const data = JSON.parse(fs.readFileSync(projectStatePath, 'utf8'));
        snapshot = {
            nodes: data.nodes || (data.graph && data.graph.nodes) || [],
            edges: data.edges || (data.graph && data.graph.edges) || [],
            clusters: data.clusters || []
        };
    }
    const context = {
        snapshot,
        metrics: { topImpactFiles: [], systemAssemblyPoints: [] }
    };
    
    console.log("Generating ARCHITECT_REPORT.md...");
    await ReportBundleGenerator.generateBundle(context, root, { command: 'fetchArchitectureReport' });
    
    console.log("Generating ONBOARDING_REPORT.md...");
    await ReportBundleGenerator.generateBundle(context, root, { command: 'fetchOnboardingReport' });
    
    console.log("Generating EXECUTIVE_SUMMARY.md...");
    await ReportBundleGenerator.generateBundle(context, root, { command: 'fetchExecutiveReport' });
    
    console.log("Generating SIMULATION_DEBUG.md...");
    await ReportBundleGenerator.generateBundle(context, root, { command: 'fetchSimulationDebug' });
    
    console.log("Done! Please check the reports in synapse_report/surgery/ directory.");
}

main().catch(e => console.error(e));
