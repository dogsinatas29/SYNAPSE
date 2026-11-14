import * as fs from 'fs';
import * as path from 'path';
import { InsightEngine } from './InsightEngine';
import { ReportScope, SelectionSource, ReportContract } from '../../types/schema';
import { QUESTION_DICTIONARY } from './ReportContract';
import { ValidationEvidence } from './types';
import { Logger } from '../../utils/Logger';
import { OnboardingReportBuilder } from './OnboardingReportBuilder';
import { ValidationRenderer } from './ValidationRenderer';
import { FindingReportAdapter } from './FindingReportAdapter';
import { EvidenceViewerBuilder } from './EvidenceViewerBuilder';
import { DiagnosticTracer } from '../analysis/pipeline/DiagnosticTracer';
import { ScopeResolver } from '../analysis/ScopeResolver';

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

        const scopeResolver: ScopeResolver = context.scopeResolver || ScopeResolver.loadConfig(context.workspaceRoot);
        let scopeHeaderMd = '';

        if (scopeResolver && scopeResolver.hasExclusions()) {
            const patterns = scopeResolver.getPatterns();
            const allNodes = context.snapshot?.nodes || [];
            const patternMatchCounts = new Map<string, number>();
            for (const p of patterns) {
                patternMatchCounts.set(p, 0);
            }
            for (const n of allNodes) {
                const fp = n.filePath || n.id;
                if (fp) {
                    for (const p of patterns) {
                        if (scopeResolver.matchPattern(p, fp)) {
                            patternMatchCounts.set(p, (patternMatchCounts.get(p) || 0) + 1);
                        }
                    }
                }
            }

            let patternLines = '';
            for (const p of patterns) {
                const count = patternMatchCounts.get(p) || 0;
                if (count === 0) {
                    patternLines += `  - \`${p}\`: 0 files matched [WARN] UNMATCHED\n`;
                } else {
                    patternLines += `  - \`${p}\`: ${count} files matched\n`;
                }
            }

            const onbFindings = (onboardInsight as any).patternFindings || onboardInsight.findings || [];
            const o2Meta = onbFindings.find((f: any) => f.patternId === 'DEPENDENCY_ROOT')?.evidence?.[0]?.metadata;
            const o2Excluded = o2Meta?.excludedByScope || 0;
            const o2Eligible = o2Meta?.eligibleCandidates || 0;
            const o2Universe = o2Meta?.universeCandidates || 0;

            const archFindings = archInsight.patternFindings || [];
            const a1Meta = archFindings.find((f: any) => f.patternId === 'SYSTEM_CORE')?.evidence?.[0]?.metadata;
            const a1Excluded = a1Meta?.excludedByScope || 0;
            const a1Eligible = a1Meta?.eligibleCandidates || 0;
            const a1Universe = a1Meta?.universeCandidates || 0;

            const execFindings = simInsight.patternFindings || [];
            const e2Meta = execFindings.find((f: any) => f.patternId === 'CHANGE_AMPLIFIER')?.evidence?.[0]?.metadata;
            const e2Excluded = e2Meta?.excludedByScope || 0;
            const e2Eligible = e2Meta?.eligibleCandidates || 0;
            const e2Universe = e2Meta?.universeCandidates || 0;

            scopeHeaderMd = `- **Declared Scope Exclusions**:\n${patternLines}` +
                `- **Scope Exclusion Accounting**:\n` +
                `  - O2 (Dependency Roots): ${o2Excluded} nodes excluded (${o2Eligible} eligible / ${o2Universe} candidates)\n` +
                `  - A1 (System Cores): ${a1Excluded} components excluded (${a1Eligible} eligible / ${a1Universe} candidates)\n` +
                `  - E2 (Change Amplifiers): ${e2Excluded} components excluded (${e2Eligible} eligible / ${e2Universe} candidates)\n`;
        }

        let returnPath = '';
        
        if (message.command === 'fetchArchitectureReport') {
            const archHeader = insight.generateHeader('ARCHITECT', 'ARCHITECTURAL_SCAN', context);
            const cleanEvidence: any[] = [];
            const appendixData: any[] = [];
            
            const adapter = new FindingReportAdapter();
            const sections = adapter.buildArchitectSections(archInsight.patternFindings || []);

            const archFindings = archInsight.patternFindings || [];
            const a1Count = new Set(archFindings.filter((f: any) => f.patternId === 'SYSTEM_CORE').map((f: any) => f.targetId)).size;
            const a1Meta = archFindings.find((f: any) => f.patternId === 'SYSTEM_CORE')?.evidence?.[0]?.metadata as any;
            const a1Total = a1Meta?.totalCandidates;
            const a1Eligible = a1Meta?.eligibleCandidates;
            const a1HasScope = a1Meta?.hasScopeExclusions;
            const a1Str = a1HasScope
                ? (a1Eligible !== undefined ? `top 10% (${a1Count} of ${a1Eligible} eligible candidates)` : `${a1Count}`)
                : (a1Total ? `top 10% (${a1Count} of ${a1Total} candidates)` : `${a1Count}`);
            const a2Count = new Set(archFindings.filter((f: any) => f.patternId === 'CROSS_BOUNDARY_REFERENCE').map((f: any) => f.targetId)).size;
            const a3Count = new Set(archFindings.filter((f: any) => QUESTION_DICTIONARY["A3"].supportingPatterns.includes(f.patternId)).map((f: any) => f.targetId)).size;
            const a5Count = new Set(archFindings.filter((f: any) => f.patternId === 'CONTROL_BRIDGE').map((f: any) => f.targetId)).size;

            const archContract: ReportContract = {
                header: archHeader,
                summary: `Architectural structural scan observed ${a1Str} system cores, ${a2Count} cross-boundary reference points, ${a3Count} structural boundaries, and ${a5Count} control bridges.`,
                findings: sections,
                evidence: cleanEvidence,
                appendix: appendixData
            };
            if (scopeHeaderMd) {
                (archContract as any).scopeHeader = scopeHeaderMd;
            }

            returnPath = path.join(bundleDir, 'ARCHITECT_REPORT.md');
            fs.writeFileSync(returnPath, insight.renderReportToMarkdown(archContract));
        }

        if (message.command === 'fetchOnboardingReport') {
            const onboardHeader = insight.generateHeader('ONBOARDING', 'ARCHITECTURAL_SCAN', context);
            const cleanEvidence: any[] = [];
            const appendixData: any[] = [];
            
            const adapter = new FindingReportAdapter();
            const onboardSections = adapter.buildOnboardingSections((onboardInsight as any).patternFindings || onboardInsight.findings || []);

            const onbFindings = (onboardInsight as any).patternFindings || onboardInsight.findings || [];
            const o2Count = new Set(onbFindings.filter((f: any) => f.patternId === 'DEPENDENCY_ROOT').map((f: any) => f.targetId)).size;

            const onboardContract: ReportContract = {
                header: onboardHeader,
                summary: `Onboarding scan observed top ${o2Count} structural dependency roots with zero incoming dependencies.`,
                findings: onboardSections,
                evidence: cleanEvidence,
                appendix: appendixData
            };
            if (scopeHeaderMd) {
                (onboardContract as any).scopeHeader = scopeHeaderMd;
            }

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

            const execFindings = simInsight.patternFindings || [];
            const e2Count = new Set(execFindings.filter((f: any) => f.patternId === 'CHANGE_AMPLIFIER').map((f: any) => f.targetId)).size;
            const e2Meta = execFindings.find((f: any) => f.patternId === 'CHANGE_AMPLIFIER')?.evidence?.[0]?.metadata as any;
            const e2Total = e2Meta?.totalCandidates;
            const e2Eligible = e2Meta?.eligibleCandidates;
            const e2HasScope = e2Meta?.hasScopeExclusions;
            const e2Str = e2HasScope
                ? (e2Eligible !== undefined ? `top 10% (${e2Count} of ${e2Eligible} eligible candidates)` : `${e2Count}`)
                : (e2Total ? `top 10% (${e2Count} of ${e2Total} candidates)` : `${e2Count}`);

            const debugContract: ReportContract = {
                header: debugHeader,
                summary: `Execution trace simulation observed ${e2Str} change propagation amplifier components.`,
                findings: simSections,
                evidence: cleanEvidence,
                appendix: appendixData
            };
            if (scopeHeaderMd) {
                (debugContract as any).scopeHeader = scopeHeaderMd;
            }

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
