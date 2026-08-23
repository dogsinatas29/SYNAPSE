import * as fs from 'fs';
import * as path from 'path';
import { InsightEngine } from './InsightEngine';
import { ReportScope, SelectionSource, ReportContract } from '../../types/schema';
import { Logger } from '../../utils/Logger';
import { OnboardingReportBuilder } from './OnboardingReportBuilder';
import { ExecutiveReportBuilder } from './ExecutiveReportBuilder';

export class ReportBundleGenerator {
    
    public static async generateBundle(context: any, rootPath: string, message: any): Promise<string> {
        const bundleDir = path.join(rootPath, 'synapse_report', 'surgery');
        fs.mkdirSync(bundleDir, { recursive: true });
        
        const insight = new InsightEngine();
        
        const scope = message.scope || ReportScope.FULL_PROJECT;
        const target = message.target || 'Project Root';
        const selectionSource = message.selectionSource || SelectionSource.USER_SELECTED;
        
        // Update context for InsightEngine
        context.reportScope = scope;
        context.reportTarget = target;
        context.selectionSource = selectionSource;
        context.scanReason = 'User Requested Generation';
        
        const simContextPath = path.join(bundleDir, 'simulation_evidence.json');
        if (!fs.existsSync(simContextPath)) {
            throw new Error('Simulation Evidence Not Found. Please run Virtual Debug first.');
        }
        
        const simulationContextStr = fs.readFileSync(simContextPath, 'utf-8');
        const simulationContext = JSON.parse(simulationContextStr);
        
        let evidenceCount = context.nodeStats?.length || 0;
        if (simulationContext && simulationContext.evidenceBundle && simulationContext.evidenceBundle.findings) {
            evidenceCount = simulationContext.evidenceBundle.findings.length;
        }
        
        Logger.info('[REPORT] start');
        
        // 1. Build Insights using SimulationContext as Source of Truth
        Logger.info('[REPORT] executive start');
        const execInsight = insight.buildExecutiveInsight(context, simulationContext);
        Logger.info('[REPORT] executive end');
        
        Logger.info('[REPORT] onboarding start');
        const onboardInsight = insight.buildOnboardingInsight(context, simulationContext);
        Logger.info('[REPORT] onboarding end');
        
        const simInsight = insight.buildSimulationInsight(context, simulationContext);
        
        // Architect Insight consumes Simulation Insight as per architectural requirements
        Logger.info('[REPORT] architect start');
        const archInsight = insight.buildArchitectInsight(context, simInsight, simulationContext);
        Logger.info('[REPORT] architect end');

        let returnPath = '';
        
        if (message.command === 'fetchExecutiveReport') {
            const execHeader = insight.generateHeader('EXECUTIVE', 'ARCHITECTURAL_SCAN', context, evidenceCount);
            const execBuilder = new ExecutiveReportBuilder();
            const execContract: ReportContract = {
                header: execHeader,
                summary: 'Executive Summary focusing on system health and immediate actions.',
                findings: execBuilder.build(execInsight),
                evidence: [],
                appendix: []
            };
            returnPath = path.join(bundleDir, 'EXECUTIVE_SUMMARY.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(execContract));
        }

        if (message.command === 'fetchArchitectureReport') {
            const archHeader = insight.generateHeader('ARCHITECT', 'ARCHITECTURAL_SCAN', context, evidenceCount);
            const archContract: ReportContract = {
                header: archHeader,
                summary: 'Focuses on boundaries, roles, and structural risks. Redundant noise has been compressed.',
                findings: [{
                    title: 'Actionable Insights',
                    content: archInsight.candidates.length > 0 ? archInsight.candidates.map(c => `### ${c.filePath}\n\n**Risk:** ${c.reason}\n\n**Why It Matters:** ${c.evidence}`).join('\n\n---\n\n') : 'No high-gravity modules in this scope.'
                }],
                evidence: [],
                appendix: []
            };
            returnPath = path.join(bundleDir, 'ARCHITECT_REPORT.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(archContract));
        }

        if (message.command === 'fetchOnboardingReport') {
            const onboardHeader = insight.generateHeader('ONBOARDING', 'ARCHITECTURAL_SCAN', context, evidenceCount);
            const onboardBuilder = new OnboardingReportBuilder();
            const onboardContract: ReportContract = {
                header: onboardHeader,
                summary: 'Guides new developers through entry points and the system heart.',
                findings: onboardBuilder.build(onboardInsight),
                evidence: [],
                appendix: []
            };
            returnPath = path.join(bundleDir, 'ONBOARDING_REPORT.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(onboardContract));
        }

        // 03_SIMULATION_DEBUG is written during Virtual Debug itself, but we can write it if needed.
        // If someone directly wants a bundle that wasn't specific to the 3 above, we can just return SIMULATION_DEBUG
        if (!returnPath) {
            const debugHeader = insight.generateHeader('SIMULATION_DEBUG', 'EXECUTION_TRACE', context, evidenceCount);
            const debugContract: ReportContract = {
                header: debugHeader,
                summary: 'Analyzes blast radius and failure propagation of changes.',
                findings: [{
                    title: 'Impact Analysis',
                    content: `**Immediate Impact:**\n${simInsight.immediateImpact.map(i => `- ${i}`).join('\n')}\n\n**Secondary Impact:**\n${simInsight.secondaryImpact.map(i => `- ${i}`).join('\n')}\n\n**Estimated Blast Radius:** ${simInsight.blastRadius} files`
                }],
                evidence: [],
                appendix: []
            };
            returnPath = path.join(bundleDir, 'SIMULATION_DEBUG.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(debugContract));
        }

        return returnPath;
    }
}
