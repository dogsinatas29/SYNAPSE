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
        let formattedEvidence: any[] = [];
        if (simulationContext && simulationContext.evidenceBundle && simulationContext.evidenceBundle.findings) {
            const findings = simulationContext.evidenceBundle.findings;
            const semanticFindings = findings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE');
            
            evidenceCount = semanticFindings.length;
            
            Logger.info("[EVIDENCE_SAMPLE]", findings.slice(0, 5));
            Logger.info("[SEMANTIC_COUNT]", semanticFindings.length);
            Logger.info("[BOUNDARY_TARGETS]", semanticFindings.slice(0, 10).map((f: any) => f.targetId));

            const scoredFindings = semanticFindings.map((f: any) => {
                const size = f.metadata?.size || 0;
                const internalEdges = f.metadata?.internalEdges || 0;
                const externalEdges = f.metadata?.externalEdges || 0;
                const inboundEdges = f.metadata?.inboundEdges || 0; // Fan-In
                
                const internalDensity = size > 0 ? internalEdges / size : 0;
                const externalDensity = size > 0 ? externalEdges / size : 0;
                
                // Report A: Complexity (Size * InternalDensity^2 * ExternalDensity)
                const complexityScore = Math.floor(size * internalDensity * internalDensity * externalDensity);
                
                // Report B: Control (Fan-In * Blast Radius)
                // A module with high Fan-In affects many other modules if it dies. 
                const controlScore = Math.floor(inboundEdges * 10 + (size * externalDensity));
                
                let tier = 'Tier 3 (Implementation Module)';
                if (complexityScore >= 5000 || size >= 800) tier = 'Tier 1 (Architecture Level)';
                else if (complexityScore >= 1000 || size >= 100) tier = 'Tier 2 (Subsystem Level)';
                
                return { ...f, complexityScore, controlScore, tier };
            });

            // --- Report A: Architectural Complexity Ranking ---
            const complexityRanked = [...scoredFindings].sort((a: any, b: any) => b.complexityScore - a.complexityScore).slice(0, 50);
            
            const cTier1 = complexityRanked.filter((f: any) => f.tier.includes('Tier 1'));
            const cTier2 = complexityRanked.filter((f: any) => f.tier.includes('Tier 2'));
            const cTier3 = complexityRanked.filter((f: any) => f.tier.includes('Tier 3'));
            
            let contentA = '';
            if (cTier1.length > 0) contentA += `#### Tier 1 (Architecture Level)\n` + cTier1.map((f: any) => `- **[Score: ${f.complexityScore}]** Node: \`${f.targetId}\` | ${f.message}`).join('\n') + `\n\n`;
            if (cTier2.length > 0) contentA += `#### Tier 2 (Subsystem Level)\n` + cTier2.map((f: any) => `- **[Score: ${f.complexityScore}]** Node: \`${f.targetId}\` | ${f.message}`).join('\n') + `\n\n`;
            if (cTier3.length > 0) contentA += `<details>\n<summary>Tier 3 (Micro Boundaries) - Click to expand</summary>\n\n` + cTier3.map((f: any) => `- **[Score: ${f.complexityScore}]** Node: \`${f.targetId}\` | ${f.message}`).join('\n') + `\n</details>\n`;

            // --- Report B: Architectural Control Ranking (System Dominators) ---
            const controlRanked = [...scoredFindings].sort((a: any, b: any) => b.controlScore - a.controlScore).slice(0, 50);
            
            let contentB = controlRanked.map((f: any, i: number) => `${i+1}. **[Control Score: ${f.controlScore}]** Node: \`${f.targetId}\` (Fan-In: ${f.metadata?.inboundEdges || 0}, Size: ${f.metadata?.size || 0})`).join('\n');

            formattedEvidence = [
                {
                    title: 'Report A: Architectural Complexity Ranking (Top 50)',
                    content: contentA || 'No Boundary Nodes found.'
                },
                {
                    title: 'Report B: Architectural Control Ranking (System Dominators)',
                    content: contentB || 'No Boundary Nodes found.'
                }
            ];
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
                evidence: formattedEvidence,
                appendix: []
            };
            returnPath = path.join(bundleDir, 'EXECUTIVE_SUMMARY.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(execContract));
        }

        if (message.command === 'fetchArchitectureReport') {
            const archHeader = insight.generateHeader('ARCHITECT', 'ARCHITECTURAL_SCAN', context, evidenceCount);
            const archContract: ReportContract = {
                header: archHeader,
                summary: 'Observation-based structural analysis. Findings classified by Pareto Frontier membership.',
                findings: [{
                    title: 'Architectural Findings',
                    content: archInsight.findings.length > 0 ? archInsight.findings.map(f => `### ${f.filePath}\n\n## Observation\n${f.observation}\n\n## Interpretation\n${f.interpretation}\n\n## Recommendation\n${f.recommendation}`).join('\n\n---\n\n') : 'No architectural findings in this scope.'
                }],
                evidence: formattedEvidence,
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
                evidence: formattedEvidence,
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
                evidence: formattedEvidence,
                appendix: []
            };
            returnPath = path.join(bundleDir, 'SIMULATION_DEBUG.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(debugContract));
        }

        return returnPath;
    }
}
