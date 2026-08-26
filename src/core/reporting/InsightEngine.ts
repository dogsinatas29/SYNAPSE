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
import { RiskVectorBuilder } from './RiskVectorBuilder';
import { ParetoFrontier } from './ParetoFrontier';
import { FrontierPartitioner } from './FrontierPartitioner';
import { OnboardingAnalyzer } from './OnboardingAnalyzer';
import { RiskClassifier } from './RiskClassifier';
import { SemanticContext } from '../analysis/SemanticContext';

/**
 * InsightEngine orchestrates the presentation pipeline:
 * RootCauseAggregator -> RiskClassifier -> RiskVectorBuilder -> ParetoFrontier -> FrontierPartitioner -> DTOs
 */
export class InsightEngine {
    
    private aggregator = new RootCauseAggregator();
    private classifier = new RiskClassifier();
    private vectorBuilder = new RiskVectorBuilder();
    private frontier = new ParetoFrontier();
    private partitioner = new FrontierPartitioner();
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
        let frontierObservation = "No frontier nodes detected";
        let action = "Continue normal operations";
        let whyItMatters = "Architecture is well-bounded.";
        let sourceVal = "None";

        if (simContext && simContext.evidenceBundle) {
            const groups = this.aggregator.aggregate(simContext);
            const classified = this.classifier.classify(groups, simContext);
            const vectors = this.vectorBuilder.build(classified);
            const frontierResult = this.frontier.compute(vectors);
            const partitioned = this.partitioner.partition(frontierResult, vectors);

            if (partitioned.frontier.length > 0) {
                health = "WARNING";
                frontierObservation = `${partitioned.frontier.length} non-dominated structural hotspots observed.`;
                action = `${partitioned.frontier.length} frontier nodes identified for review.`;
                whyItMatters = `No single node dominates another across all dimensions.`;
                sourceVal = "ParetoFrontier (non-dominated set)";
            }
        }
        
        return { 
            health, 
            frontierObservation, 
            action, 
            whyItMatters,
            sources: { frontierObservation: { value: frontierObservation, source: sourceVal } }
        };
    }

    public buildArchitectInsight(context: ValidationContext, simInsight?: SimulationInsight, simContext?: SimulationContext): ArchitectInsight {
        const findings: any[] = [];
        
        if (simContext && simContext.evidenceBundle) {
            const semanticContext = new SemanticContext(simContext);
            const groups = this.aggregator.aggregate(simContext, semanticContext);
            const classified = this.classifier.classify(groups, simContext, semanticContext);
            const vectors = this.vectorBuilder.build(classified);
            const frontierResult = this.frontier.compute(vectors);
            const partitioned = this.partitioner.partition(frontierResult, vectors);

            // Add Frontier nodes (non-dominated set)
            for (const c of partitioned.frontier) {
                const g = c.sourceGroup;
                findings.push({
                    filePath: g.ownerCluster,
                    observation: `Classification: FRONTIER\nTopology Type: ${g.primaryRiskType}\nSubsystem: ${g.boundaryContext?.id || 'None / Unbounded'}\nBoundary Strength: ${g.boundaryContext?.strength || 'None'}\nCoupling: ${c.coupling}\nCycle Participation: ${c.cycle}\nBoundary Crossings: ${c.boundary}\nAuthority Reach: ${c.authority}`,
                    interpretation: g.boundaryContext?.id
                        ? `This node is located on the Pareto Frontier.\nThe node belongs to the subsystem boundary.\nIt remains non-dominated across all observed dimensions.`
                        : `This node is located on the Pareto Frontier.\nNo enclosing boundary was detected.`,
                    recommendation: `Review boundary ownership and dependency propagation.`
                });
            }
            // Add Watch List (non-frontier with signals)
            for (const w of partitioned.watchList) {
                const g = w.sourceGroup;
                findings.push({
                    filePath: g.ownerCluster,
                    observation: `Classification: WATCH\nTopology Type: ${g.primaryRiskType}\nSubsystem: ${g.boundaryContext?.id || 'Unknown'}\nBoundary Strength: ${g.boundaryContext?.strength || 'Weak'}\nCoupling: ${w.coupling}`,
                    interpretation: `This node has multiple outbound connections.\nIt belongs to the '${g.boundaryContext?.id || 'Unknown'}' subsystem.\nOutbound connections cross the subsystem boundary.`,
                    recommendation: `Review subsystem isolation and external coupling.`
                });
            }

            // Add Info List (INTENDED_HUB)
            for (const i of partitioned.infoList) {
                const g = i.sourceGroup;
                findings.push({
                    filePath: g.ownerCluster,
                    observation: `Classification: INTENDED\nTopology Type: ${g.primaryRiskType}\nSubsystem: ${g.boundaryContext?.id || 'Unknown'}\nBoundary Strength: ${g.boundaryContext?.strength || 'Strong'}\nCoupling: ${i.coupling}`,
                    interpretation: `This node has high outbound connectivity.\nIt belongs to the '${g.boundaryContext?.id || 'Unknown'}' subsystem.\nThe Semantic Context confirms the boundary is intentional.`,
                    recommendation: `Monitor for Ownership/Authority violations.`
                });
            }

            // Append External Pressures
            if (partitioned.externalPressures.length > 0) {
                const topExternal = partitioned.externalPressures.slice(0, 5).map(e => `- ${e.sourceGroup.ownerCluster} (${e.authority} refs)`).join('\n');
                findings.push({
                    filePath: "External Dependency Pressures",
                    observation: `Classification: EXTERNAL\nExternal References:\n${topExternal}`,
                    interpretation: `These nodes are external or platform dependencies.\nThey are not considered internal structural risks.`,
                    recommendation: `Monitor external dependency updates.`
                });
            }
            
            // Note: We'll pass ignored noise count via the first finding's recommendation or via ReportBundleGenerator
            // For now, no ignored noise tracking in new pipeline
        }
        
        return { findings, sources: {} };
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
