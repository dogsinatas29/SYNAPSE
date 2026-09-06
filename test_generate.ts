import { ReportBundleGenerator } from './src/core/reporting/ReportBundleGenerator';

async function main() {
    const root = __dirname;
    const context = {
        snapshot: { nodes: [], edges: [], clusters: [] },
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
