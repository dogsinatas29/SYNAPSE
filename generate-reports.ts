import * as path from 'path';
import { ReportBundleGenerator } from './src/core/reporting/ReportBundleGenerator';

async function main() {
    const root = path.resolve('.');
    const ctx = {
        nodeStats: [],
        nodes: [],
        edges: [],
        metrics: { topImpactFiles: [] }
    };
    
    await ReportBundleGenerator.generateBundle(ctx, root, { command: 'fetchExecutiveReport' });
    await ReportBundleGenerator.generateBundle(ctx, root, { command: 'fetchArchitectureReport' });
    await ReportBundleGenerator.generateBundle(ctx, root, { command: 'fetchOnboardingReport' });
    await ReportBundleGenerator.generateBundle(ctx, root, { command: 'fetchSimulationDebug' });
    console.log("Generated all reports in synapse_report/surgery");
}
main();
