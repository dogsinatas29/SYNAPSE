import { 
    ReportScope, 
    SelectionSource, 
    ReportHeader,
    ExecutiveInsight,
    ArchitectInsight,
    OnboardingInsight,
    SimulationInsight,
    ReportContract
} from '../../types/schema';
import { ValidationContext } from '../validation/ValidationContext';
import { SimulationContext } from '../../types/schema';

import { RootCauseAggregator } from './RootCauseAggregator';
import { PriorityEngine } from './PriorityEngine';
import { CompressionEngine } from './CompressionEngine';
import { OnboardingAnalyzer } from './OnboardingAnalyzer';
import { RiskClassifier } from './RiskClassifier';

/**
 * InsightEngine orchestrates the presentation pipeline:
 * FindingAggregator -> PriorityEngine -> CompressionEngine -> DTOs
 */
export class InsightEngine {
    
    private aggregator = new RootCauseAggregator();
    private classifier = new RiskClassifier();
    private priority = new PriorityEngine();
    private compression = new CompressionEngine();
    private onboarding = new OnboardingAnalyzer();
    
    public generateHeader(
        reportType: string,
        analysisMode: string,
        context: ValidationContext,
        evidenceCount: number,
        reportConfidence: number = 90
    ): ReportHeader {
        const metadata: any = context.snapshot?.clusters || {};
        const scope = (context as any).reportScope || ReportScope.FULL_PROJECT;
        const target = (context as any).reportTarget || 'Project Root';
        const selectionSource = (context as any).selectionSource || SelectionSource.AUTO_SELECTED;
        const reason = (context as any).scanReason || 'System Auto-Scan';

        return {
            reportType,
            analysisMode,
            scope,
            target,
            selectionSource,
            reason,
            generatedBy: 'InsightEngine',
            evidenceCount,
            reportConfidence
        };
    }

    public buildExecutiveInsight(context: ValidationContext, simContext?: SimulationContext): ExecutiveInsight {
        let health = "STABLE";
        let topRisk = "No immediate risk detected";
        let action = "Continue normal operations";
        let whyItMatters = "Architecture is well-bounded.";
        let sourceVal = "None";

        if (simContext && simContext.evidenceBundle) {
            const groups = this.aggregator.aggregate(simContext);
            const prioritized = this.priority.assignPriorities(groups);
            const compressed = this.compression.compress(prioritized);

            if (compressed.immediateActions.length > 0) {
                health = "WARNING";
                const top = compressed.immediateActions[0];
                topRisk = `Dependency concentration around ${top.ownerCluster} increases change impact.`;
                action = `Immediate action recommended on Top ${compressed.immediateActions.length} risk areas.`;
                whyItMatters = `Changes to ${top.ownerCluster} affect ${top.blastRadius} downstream nodes.`;
                sourceVal = "CompressionEngine (Priority CRITICAL)";
            }
        }
        
        return { 
            health, 
            topRisk, 
            action, 
            whyItMatters,
            sources: { topRisk: { value: topRisk, source: sourceVal } }
        };
    }

    public buildArchitectInsight(context: ValidationContext, simInsight?: SimulationInsight, simContext?: SimulationContext): ArchitectInsight {
        const candidates: any[] = [];
        
        if (simContext && simContext.evidenceBundle) {
            const groups = this.aggregator.aggregate(simContext);
            const classified = this.classifier.classify(groups);
            const prioritized = this.priority.assignPriorities(classified);
            const compressed = this.compression.compress(prioritized);

            // Add Immediate Actions
            for (const c of compressed.immediateActions) {
                candidates.push({
                    filePath: c.ownerCluster,
                    reason: `[CRITICAL] [${c.primaryRiskType}] ${c.cycleParticipation} structural cycles\nBlast Radius: ${c.blastRadius} files\n\n**Reason:**\nArchitectural Risk detected. Contains ${c.fanOut} fan-out issues.`,
                    evidence: `**Recommended Investigation:**\nReview ownership boundaries and isolate cyclic dependencies in this module.`
                });
            }
            // Add Watch List
            for (const w of compressed.watchList) {
                candidates.push({
                    filePath: w.ownerCluster,
                    reason: `[WATCH] [${w.primaryRiskType}] ${w.cycleParticipation} structural cycles\nBlast Radius: ${w.blastRadius} files\n\n**Reason:**\nElevated risk metrics. Contains ${w.fanOut} fan-out issues.`,
                    evidence: `**Recommended Investigation:**\nMonitor dependency growth and resolve cycles to prevent architectural coupling.`
                });
            }

            // Append External Pressures
            if (compressed.externalPressures.length > 0) {
                const topExternal = compressed.externalPressures.slice(0, 5).map(e => `- ${e.ownerCluster} (${e.blastRadius} refs)`).join('\n');
                candidates.push({
                    filePath: "External Dependency Pressures",
                    reason: `[INFO] High usage of external/platform boundaries.\n\n**Top External References:**\n${topExternal}`,
                    evidence: `**Note:** These are heavily referenced but not considered internal structural risks.`
                });
            }
            
            // Note: We'll pass ignored noise count via the first candidate's evidence or via ReportBundleGenerator
            if (compressed.ignoredNoiseCount > 0 && candidates.length > 0) {
                 candidates[0].evidence += `\n\n*Note: ${compressed.ignoredNoiseCount} findings were intentionally ignored as noise (tests, docs, etc.).*`;
            }
        }
        
        return { candidates, sources: {} };
    }

    public buildOnboardingInsight(context: ValidationContext, simContext?: SimulationContext): OnboardingInsight {
        const path = this.onboarding.extractPath(context, simContext);

        return {
            entryPoint: path.entryPoint,
            coreDomain: path.corePipeline.length > 0 ? path.corePipeline.join(',') : 'N/A',
            safeArea: path.safeAreas,
            avoidReadingYet: path.readLater.join(','),
            sources: {}
        };
    }

    public buildSimulationInsight(context: ValidationContext, simContext?: SimulationContext): SimulationInsight {
        const files = context.metrics.topImpactFiles || [];
        
        let immediateImpact: string[] = [];
        let secondaryImpact: string[] = [];
        let blastRadius = 0;
        
        if (simContext && simContext.evidenceBundle) {
            const findings = simContext.evidenceBundle.findings || [];
            
            // Extract nodes correctly based on finding type
            const cycleFiles = findings.filter((f: any) => f.type === 'cycle').flatMap((f: any) => f.nodeIds || []);
            const fractureFiles = findings.filter((f: any) => f.type === 'fracture').map((f: any) => f.nodeId || f.sourceId);
            const boundaryFiles = findings.filter((f: any) => String(f.type).includes('boundary')).map((f: any) => f.sourceId);
            
            const allImpacted = Array.from(new Set([...cycleFiles, ...fractureFiles, ...boundaryFiles].filter(Boolean)))
                .filter(name => typeof name === 'string' && !name.startsWith('AGGREGATE_') && !name.startsWith('SYSTEM_') && !name.includes('UNKNOWN'));
            
            immediateImpact = allImpacted.slice(0, 5);
            if (immediateImpact.length === 0) immediateImpact = ['N/A'];
            
            secondaryImpact = ['Cascading downstream dependencies based on AST'];
            blastRadius = allImpacted.length > 0 ? allImpacted.length * 3 : 0;
            
        } else if (files.length > 0) {
            const consumers = files[0].consumers || [];
            immediateImpact = consumers.slice(0, 3);
            if (immediateImpact.length === 0) immediateImpact = [files[0].filePath]; // Fallback to itself if no consumers tracked
            
            secondaryImpact = ['Cascading downstream dependencies'];
            blastRadius = consumers.length > 0 ? consumers.length * 2 : 3;
        } else {
            immediateImpact = ['N/A'];
            secondaryImpact = ['N/A'];
        }
        
        return { 
            immediateImpact, 
            secondaryImpact, 
            blastRadius,
            sources: {
                blastRadius: { value: blastRadius, source: 'metrics.topImpactFiles[0].consumers' }
            }
        };
    }

    public renderReportToMarkdown(contract: ReportContract): string {
        const h = contract.header;
        let md = `---
# REPORT HEADER

Report Type: ${h.reportType}
Analysis Mode: ${h.analysisMode}
Scope: ${h.scope}
Target: ${h.target}
Selection Source: ${h.selectionSource}
Reason: ${h.reason}
Generated By: ${h.generatedBy}
Evidence Count: ${h.evidenceCount}
Report Confidence: ${h.reportConfidence}%
---\n\n`;

        md += `## Executive Summary\n\n${contract.summary}\n\n`;

        md += `## Findings\n\n`;
        for (const section of contract.findings) {
            md += `### ${section.title}\n\n${section.content}\n\n`;
        }

        md += `## Evidence\n\n`;
        for (const section of contract.evidence) {
            md += `### ${section.title}\n\n${section.content}\n\n`;
        }

        md += `## Appendix\n\n`;
        for (const section of contract.appendix) {
            md += `<details>\n<summary>${section.title}</summary>\n\n\`\`\`json\n${section.content}\n\`\`\`\n</details>\n\n`;
        }

        return md;
    }
}
