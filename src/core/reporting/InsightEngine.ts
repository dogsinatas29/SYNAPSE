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
import { SemanticContext } from '../analysis/SemanticContext';

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
            const semanticContext = new SemanticContext(simContext);
            const groups = this.aggregator.aggregate(simContext, semanticContext);
            const classified = this.classifier.classify(groups, simContext, semanticContext);
            const prioritized = this.priority.assignPriorities(classified);
            const compressed = this.compression.compress(prioritized);

            // Add Immediate Actions (CRITICAL)
            for (const c of compressed.immediateActions) {
                candidates.push({
                    filePath: c.ownerCluster,
                    reason: `[CRITICAL] [${c.primaryRiskType}]\nSubsystem: ${c.boundaryContext?.id || 'None / Unbounded'}\nBoundary Strength: ${c.boundaryContext?.strength || 'None'}\n\n**Role:**\n${c.boundaryContext?.id ? 'Bounded' : 'Unbounded'} Structural Defect\n\n**Architectural Interpretation:**\nThis node contains serious structural defects (Fan-out: ${c.fanOut}, Cycles: ${c.cycleParticipation}). ${c.boundaryContext?.id ? 'Although it is within a boundary, the defect severity is too high.' : 'It lacks strong Boundary protection.'}\nChanges to this code will trigger massive side-effects across the entire system.`,
                    evidence: `**Status:**\nHigh Priority Technical Debt. This architecture is dangerously fragile.\n\n**Recommendation:**\nExtract responsibilities into separate layers or isolate via abstract interfaces.`
                });
            }
            // Add Watch List (UNKNOWN_HUB - Weak Boundary)
            for (const w of compressed.watchList) {
                candidates.push({
                    filePath: w.ownerCluster,
                    reason: `[WATCH] [${w.primaryRiskType}]\nSubsystem: ${w.boundaryContext?.id || 'Unknown'}\nBoundary Strength: Weak\n\n**Role:**\nSuspicious Structural Hub\n\n**Architectural Interpretation:**\nThis node acts as a hub (${w.fanOut} fan-out). It is technically inside the '${w.boundaryContext?.id}' subsystem, but that boundary's internal cohesion is too weak to provide true architectural encapsulation.\nIt is leaking complexity outside its intended Semantic Context.`,
                    evidence: `**Recommended Investigation:**\nStrengthen the boundary of '${w.boundaryContext?.id}' or reduce external coupling.`
                });
            }

            // Add Info List (INTENDED_HUB - Strong Boundary)
            for (const i of compressed.infoList) {
                candidates.push({
                    filePath: i.ownerCluster,
                    reason: `[INFO] [${i.primaryRiskType}]\nSubsystem: ${i.boundaryContext?.id || 'Unknown'}\nBoundary Strength: ${i.boundaryContext?.strength || 'Strong'}\n\n**Role:**\nCentral Resource / API Registry\n\n**Architectural Interpretation:**\nExpected high fan-out (${i.fanOut}) because this node acts as a canonical registry or core hub strictly within the '${i.boundaryContext?.id}' subsystem.\nThe Semantic Context confirms this structure is intentional and safely encapsulated by a Strong boundary.`,
                    evidence: `**Status:**\nValidated as Intended Architecture. No immediate topology refactoring required. Keep monitoring for Ownership/Authority violations.`
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
