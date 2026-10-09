import * as fs from 'fs';
import * as path from 'path';
import { InsightEngine } from './InsightEngine';
import { ReportScope, SelectionSource, ReportContract } from '../../types/schema';
import { ValidationEvidence } from './types';
import { Logger } from '../../utils/Logger';
import { OnboardingReportBuilder } from './OnboardingReportBuilder';
import { ValidationRenderer } from './ValidationRenderer';
import { FindingReportAdapter } from './FindingReportAdapter';
import { EvidenceViewerBuilder } from './EvidenceViewerBuilder';
import { DiagnosticTracer } from '../analysis/pipeline/DiagnosticTracer';

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
        console.log('RBG_INPUT_FINDINGS', simulationContext?.evidenceBundle?.findings?.length || 0);
        console.log(`[DATA_TRACE] ReportBundleGenerator after read: findings=${simulationContext.evidenceBundle?.findings?.length}, path=${simContextPath}`);
        
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
                return { ...f };
            });
            formattedEvidence = [];

            // Add Validation Study Raw Data to Evidence
            if (simulationContext.validationEvidence && simulationContext.validationEvidence.studies) {
                const rawDataContent = simulationContext.validationEvidence.studies
                    .filter((s: any) => s.evidence && s.evidence.length > 0)
                    .map((s: any) => {
                        const items = s.evidence.map((e: any) => `##### ${e.type}\n\`\`\`json\n${JSON.stringify(e.data, null, 2)}\n\`\`\``).join('\n\n');
                        return `#### Study Data: ${s.title}\n${items}\n`;
                    }).join('\n');
                
                if (rawDataContent) {
                    formattedEvidence.push({
                        title: 'Report C: SCC Validation Evidence',
                        content: rawDataContent
                    });
                }
            }
        }
        
        Logger.info('[REPORT] start');
        
        console.time('[PERF] buildOnboardingInsight');
        Logger.info('[REPORT] onboarding start');
        const onboardInsight = insight.buildOnboardingInsight(context, simulationContext);
        Logger.info('[REPORT] onboarding end');
        console.timeEnd('[PERF] buildOnboardingInsight');
        
        console.time('[PERF] buildSimulationInsight');
        const simInsight = insight.buildSimulationInsight(context, simulationContext);
        console.timeEnd('[PERF] buildSimulationInsight');
        
        // Architect Insight consumes Simulation Insight as per architectural requirements
        console.time('[PERF] buildArchitectInsight');
        Logger.info('[REPORT] architect start');
        const archInsight = insight.buildArchitectInsight(context, simInsight, simulationContext);
        Logger.info('[REPORT] architect end');
        console.timeEnd('[PERF] buildArchitectInsight');

        let returnPath = '';
        
        if (message.command === 'fetchArchitectureReport') {
            const archHeader = insight.generateHeader('ARCHITECT', 'ARCHITECTURAL_SCAN', context);
            const cleanEvidence: any[] = [];
            const appendixData: any[] = [];
            
            const adapter = new FindingReportAdapter();
            const sections = adapter.buildArchitectSections(archInsight.patternFindings || []);

            const archContract: ReportContract = {
                header: archHeader,
                summary: 'Observation-based structural analysis with rigorous validation provenance.',
                findings: sections,
                evidence: cleanEvidence,
                appendix: appendixData
            };

            returnPath = path.join(bundleDir, 'ARCHITECT_REPORT.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(archContract));
        }

        if (message.command === 'fetchOnboardingReport') {
            const onboardHeader = insight.generateHeader('ONBOARDING', 'ARCHITECTURAL_SCAN', context);
            const cleanEvidence: any[] = [];
            const appendixData: any[] = [];
            
            const adapter = new FindingReportAdapter();
            const onboardSections = adapter.buildOnboardingSections((onboardInsight as any).patternFindings || onboardInsight.findings || []);

            const onboardContract: ReportContract = {
                header: onboardHeader,
                summary: 'Onboarding Report',
                findings: onboardSections,
                evidence: cleanEvidence,
                appendix: appendixData
            };
            returnPath = path.join(bundleDir, 'ONBOARDING_REPORT.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(onboardContract));
        }

        // 03_SIMULATION_DEBUG is written during Virtual Debug itself, but we can write it if needed.
        // If someone directly wants a bundle that wasn't specific to the 3 above, we can just return SIMULATION_DEBUG
        if (!returnPath) {
            const debugHeader = insight.generateHeader('SIMULATION_DEBUG', 'EXECUTION_TRACE', context);
            
            const cleanEvidence: any[] = [];
            const appendixData: any[] = [];

            const adapter = new FindingReportAdapter();
            console.time('[PERF] adapter.buildExecutionSections');
            const simSections = adapter.buildExecutionSections(simInsight.patternFindings || []);
            console.timeEnd('[PERF] adapter.buildExecutionSections');

            const debugContract: ReportContract = {
                header: debugHeader,
                summary: 'Simulation Debug Report',
                findings: simSections,
                evidence: cleanEvidence,
                appendix: appendixData
            };

            returnPath = path.join(bundleDir, 'SIMULATION_DEBUG.md');
            console.time('[PERF] renderReportToMarkdown');
            const md = insight.renderReportToMarkdown(debugContract);
            console.timeEnd('[PERF] renderReportToMarkdown');
            
            const sectionExists = md.includes('Impact Propagation (Pattern-based)');
            const renderedBoundaryItems = (md.match(/BOUNDARY/g) || []).length;
            console.log(`[DT-A4] Markdown:\n  reportSectionInputBoundary=0\n  section exists=${sectionExists}\n  renderedBoundaryItems=${renderedBoundaryItems}`);
            
            console.time('[PERF] writeFileSync MD');
            fs.writeFileSync(returnPath, md);
            console.timeEnd('[PERF] writeFileSync MD');
        }

        // --- Step 4-A: Separate HTML generation ---
        console.time('[PERF] extract allFindings');
        const allFindings = [
            ...(onboardInsight.findings || []),
            ...(simInsight.patternFindings || []),
            ...(archInsight.patternFindings || [])
        ];
        console.timeEnd('[PERF] extract allFindings');

        // (Omit indentation to avoid Invalid string length on huge graphs)
        console.time('[PERF] writeFileSync allFindings.json');
        fs.writeFileSync(path.join(bundleDir, 'allFindings.json'), JSON.stringify(allFindings));
        console.timeEnd('[PERF] writeFileSync allFindings.json');
        
        console.time('[PERF] EvidenceViewerBuilder.buildHtml');
        const evidenceHtml = EvidenceViewerBuilder.buildHtml(allFindings, bundleDir);
        console.timeEnd('[PERF] EvidenceViewerBuilder.buildHtml');
        
        console.time('[PERF] writeFileSync EVIDENCE_VIEWER.html');
        fs.writeFileSync(path.join(bundleDir, 'EVIDENCE_VIEWER.html'), evidenceHtml);
        console.timeEnd('[PERF] writeFileSync EVIDENCE_VIEWER.html');

        // Add DiagnosticTracer dump so we can debug why findings are empty
        DiagnosticTracer.getInstance().dump(bundleDir);

        return returnPath;
    }
}
