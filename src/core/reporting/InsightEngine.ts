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
import { Logger } from '../../utils/Logger';

import { SystemCoreDetector } from '../analysis/patterns/detectors/SystemCoreDetector';
import { PatternId } from '../analysis/patterns/PatternId';
import { traceDetectorExecution } from '../analysis/pipeline/DiagnosticTracer';
import { ChangeAmplifierDetector } from '../analysis/patterns/detectors/ChangeAmplifierDetector';

import { MetricAccessDetector } from '../analysis/patterns/detectors/MetricAccessDetector';
import { VocabularyViolationDetector } from '../analysis/patterns/detectors/VocabularyViolationDetector';
import { BoundaryPatternDetector } from '../analysis/patterns/detectors/BoundaryPatternDetector';
import { CrossBoundaryReferenceDetector } from '../analysis/patterns/detectors/CrossBoundaryReferenceDetector';
import { ArchitecturalChokepointDetector } from '../analysis/patterns/detectors/ArchitecturalChokepointDetector';

export interface AuditInsight {
    patternFindings?: any[];
}

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
        context: ValidationContext
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
            generatedBy: 'InsightEngine'
        };
    }

    public buildExecutiveInsight(context: ValidationContext, simContext?: SimulationContext): ExecutiveInsight {
        console.log(`[DATA_TRACE] InsightEngine input: findings=${simContext?.evidenceBundle?.findings?.length}`);
        let health = "STABLE";
        let frontierObservation = "No frontier nodes detected";
        let action = "Continue normal operations";
        let whyItMatters = "Architecture is well-bounded.";
        let sourceVal = "None";

        if (simContext && simContext.evidenceBundle) {
            const semanticContext = new SemanticContext(simContext);
            const groups = this.aggregator.aggregate(simContext, semanticContext);
            const classified = this.classifier.classify(groups, simContext, semanticContext);
            const vectors = this.vectorBuilder.build(classified);
            const frontierResult = this.frontier.compute(vectors);
            const partitioned = this.partitioner.partition(frontierResult, vectors);

            if (partitioned.frontier.length > 0) {
                // SCORCHED EARTH MUTATION: Remove unverified SEVERE claim generation
                /*
                health = "SEVERE (High Coupling Risk)";
                const validFrontiers = partitioned.frontier.filter(c => c.sourceGroup.ownerCluster.includes('.'));
                const topNode = validFrontiers.length > 0 ? validFrontiers[0].sourceGroup.ownerCluster : partitioned.frontier[0].sourceGroup.ownerCluster;
                
                const maxFanIn = Math.max(...partitioned.frontier.map(c => c.sourceGroup.boundaryContext?.inboundEdges || 0));
                const maxBoundaryCrossings = Math.max(...partitioned.frontier.map(c => c.boundary || 0));
                const maxScc = Math.max(...partitioned.frontier.map(c => c.cycle || 0));

                frontierObservation = `${partitioned.frontier.length} structural bottlenecks detected. Core issue traced to: ${topNode}`;
                action = `Immediate architectural decoupling required for ${partitioned.frontier.length} frontier nodes to prevent cascading failures.`;
                whyItMatters = `Systemic risk detected. Centralized dependencies around '${topNode}' are eroding module boundaries and threatening maintainability and build times.\n\n**근거 (Evidence):**\n- Frontier Nodes: ${partitioned.frontier.length}개\n- 최대 Fan-In: ${maxFanIn}\n- 최대 Boundary Crossing: ${maxBoundaryCrossings}\n- 최대 SCC Participation: ${maxScc}`;
                sourceVal = "ParetoFrontier (non-dominated set)";
                */
            }
        }
        
        const sysCoreDetector = new SystemCoreDetector();
        const boundaryDetector = new BoundaryPatternDetector();
        const crossBoundaryRefDetector = new CrossBoundaryReferenceDetector();
        const patternFindings = [
            ...traceDetectorExecution(PatternId.SYSTEM_CORE, 'SystemCoreDetector', sysCoreDetector, context, simContext),
            ...traceDetectorExecution(PatternId.BOUNDARY_CANDIDATE, 'BoundaryPatternDetector', boundaryDetector, context, simContext),
            ...traceDetectorExecution(PatternId.CROSS_BOUNDARY_REFERENCE, 'CrossBoundaryReferenceDetector', crossBoundaryRefDetector, context, simContext)
        ];

        return { 
            health, 
            frontierObservation, 
            action, 
            whyItMatters,
            sources: { frontierObservation: { value: frontierObservation, source: sourceVal } },
            patternFindings
        };
    }

    public buildArchitectInsight(context: ValidationContext, simInsight?: SimulationInsight, simContext?: SimulationContext): ArchitectInsight {
        const findings: any[] = [];
        
        const crossBoundaryRefDetector = new CrossBoundaryReferenceDetector();
        const boundaryDetector = new BoundaryPatternDetector();
        const sysCoreDetector = new SystemCoreDetector();
        const chokepointDetector = new ArchitecturalChokepointDetector();
        const patternFindings = [
            ...traceDetectorExecution(PatternId.CROSS_BOUNDARY_REFERENCE, 'CrossBoundaryReferenceDetector', crossBoundaryRefDetector, context, simContext),
            ...traceDetectorExecution(PatternId.BOUNDARY_CANDIDATE, 'BoundaryPatternDetector', boundaryDetector, context, simContext),
            ...traceDetectorExecution(PatternId.SYSTEM_CORE, 'SystemCoreDetector', sysCoreDetector, context, simContext),
            ...traceDetectorExecution(PatternId.ARCHITECTURAL_CHOKEPOINT, 'ArchitecturalChokepointDetector', chokepointDetector, context, simContext)
        ];
        
        if (simContext && simContext.evidenceBundle) {
            const semanticContext = new SemanticContext(simContext);
            const groups = this.aggregator.aggregate(simContext, semanticContext);
            const classified = this.classifier.classify(groups, simContext, semanticContext);
            const vectors = this.vectorBuilder.build(classified);
            const frontierResult = this.frontier.compute(vectors);
            const partitioned = this.partitioner.partition(frontierResult, vectors);

            if (process.env.SC_AUDIT) {
                console.log(`[SC_AUDIT] InsightEngine: frontier=${partitioned.frontier.length}, watch=${partitioned.watchList.length}, info=${partitioned.infoList.length}`);
            }

            const isBoundary = (name: string) => name && !name.includes('.') && !name.startsWith('AGGREGATE_');

            const candidates = partitioned.frontier;
            Logger.info('[FRONTIER_INPUT]', {
                total: candidates.length,
                boundaries: candidates.filter((c: any) => isBoundary(c.sourceGroup.ownerCluster)).length
            });

            // Add Frontier nodes (non-dominated set)
            // SCORCHED EARTH MUTATION: Remove unverified FRONTIER claims
            /*
            let validFrontierCount = 0;
            for (const c of partitioned.frontier) { ... }
            Logger.info('[FRONTIER_OUTPUT]', { frontierCount: validFrontierCount });
            */

            // Add Watch List (non-frontier with signals)
            // SCORCHED EARTH MUTATION: Remove unverified WATCH claims
            /*
            for (const w of partitioned.watchList) { ... }
            */

            // Add Info List (SYSTEM_CORE)
            // SCORCHED EARTH MUTATION: Remove unverified INTENDED claims
            /*
            for (const i of partitioned.infoList) { ... }
            */

            // Append External Pressures
            // SCORCHED EARTH MUTATION: Remove unverified EXTERNAL claims
            /*
            if (partitioned.externalPressures.length > 0) { ... }
            */
            
            // Note: We'll pass ignored noise count via the first finding's recommendation or via ReportBundleGenerator
            // For now, no ignored noise tracking in new pipeline
        }
        
        return { findings, sources: {}, patternFindings };
    }

    public buildOnboardingInsight(context: ValidationContext, simContext?: SimulationContext): OnboardingInsight {
        const path = this.onboarding.extractPath(context, simContext);

        return {
            entryPoint: path.entryPoint,
            // SCORCHED EARTH MUTATION: Remove unverified Reading Path, Safe Areas, etc.
            coreDomain: 'N/A',
            safeArea: [],
            avoidReadingYet: 'N/A',
            safeRefactoringZone: [],
            sources: {},
            findings: path.findings
        };
    }

    public buildSimulationInsight(context: ValidationContext, simContext?: SimulationContext): SimulationInsight {
        let immediateImpact: string[] = [];
        let secondaryImpact: string[] = [];
        let blastRadius = 0;
        
        if (simContext && simContext.evidenceBundle) {
            const findings = simContext.evidenceBundle.findings || [];
            
            // Extract nodes correctly based on finding type
            const cycleFiles = findings.filter((f: any) => f.type === 'cycle').flatMap((f: any) => f.nodeIds || []);
            const fractureFiles = findings.filter((f: any) => f.type === 'fracture').map((f: any) => f.nodeId || f.sourceId);
            const legacyBoundaryFiles = findings.filter((f: any) => String(f.type).includes('boundary')).map((f: any) => f.sourceId);
            
            const semanticBoundaryNodes = findings
                .filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE')
                .map((f: any) => {
                    const size = f.metadata?.size || 0;
                    const internalEdges = f.metadata?.internalEdges || 0;
                    const externalEdges = f.metadata?.externalEdges || 0;
                    
                    const internalDensity = size > 0 ? internalEdges / size : 0;
                    const externalDensity = size > 0 ? externalEdges / size : 0;
                    
                    // Priority Engine: Reward complex subsystems over flat utility libraries
                    // Squaring internalDensity demotes utility folders (high fan-out, low internal complexity)
                    const score = Math.floor(size * internalDensity * internalDensity * externalDensity);
                    
                    return { targetId: f.targetId, size, internalEdges, externalEdges, score };
                })
                .sort((a: any, b: any) => b.score - a.score);
            
            Logger.info('[IMPACT_SCORE_TOP_20]', semanticBoundaryNodes.slice(0, 20));
            
            const semanticBoundaries = semanticBoundaryNodes.map((b: any) => b.targetId);
            const crossBoundaryDeps = findings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'CROSS_BOUNDARY_DEPENDENCY');
            
            const allImpacted = Array.from(new Set([
                ...semanticBoundaries, 
                ...legacyBoundaryFiles, 
                ...cycleFiles, 
                ...fractureFiles
            ].filter(Boolean)))
                .filter(name => typeof name === 'string' && !name.startsWith('AGGREGATE_') && !name.startsWith('SYSTEM_') && !name.includes('UNKNOWN'));
            
            // Ghost Isolation for Legacy Architectures
            const isLegacyGhost = (name: string) => {
                return name.startsWith('arch/alpha') || 
                       name.startsWith('arch/mips') || 
                       name.startsWith('arch/arm') ||
                       name.startsWith('arch/powerpc') ||
                       name.startsWith('arch/sh');
            };

            const actualImpacted = allImpacted.filter(name => !isLegacyGhost(name));
            
            immediateImpact = actualImpacted.slice(0, 5);
            if (immediateImpact.length === 0) immediateImpact = ['N/A'];
            
            // Subsystem count is directly the number of impacted boundaries/components
            const subsystemCount = actualImpacted.length;
            
            secondaryImpact = [
                `Cascading dependency failures propagating across ${subsystemCount} distinct subsystems.`,
                `Root cause traced to system cores violating module boundaries.`
            ];
            
            // Blast Radius Calculation Fix (v0.3.34.46)
            // Instead of summing up edge weights (which inflates the number to thousands),
            // sum the actual unique file count (size) of the impacted boundaries.
            let actualAffectedFiles = 0;
            actualImpacted.forEach(impactedName => {
                const node = semanticBoundaryNodes.find((b: any) => b.targetId === impactedName);
                if (node && node.size) {
                    actualAffectedFiles += node.size;
                } else {
                    actualAffectedFiles += 1; // Fallback for single files
                }
            });
            
            // Add a modest 10% cascade penalty, since cross-deps were removed from the raw sum.
            blastRadius = Math.ceil(actualAffectedFiles * 1.1);            
        } else {
            immediateImpact = ['N/A'];
            secondaryImpact = ['N/A'];
            blastRadius = 0;
        }
        
        Logger.info("[IMPACT_OUTPUT]", immediateImpact);

        const changeAmpDetector = new ChangeAmplifierDetector();
        const boundaryDetector = new BoundaryPatternDetector();
        const chokepointDetector = new ArchitecturalChokepointDetector();
        const patternFindings = [
            ...traceDetectorExecution(PatternId.CHANGE_AMPLIFIER, 'ChangeAmplifierDetector', changeAmpDetector, context, simContext),
            ...traceDetectorExecution(PatternId.BOUNDARY_CANDIDATE, 'BoundaryPatternDetector', boundaryDetector, context, simContext),
            ...traceDetectorExecution(PatternId.ARCHITECTURAL_CHOKEPOINT, 'ArchitecturalChokepointDetector', chokepointDetector, context, simContext)
        ];

        const boundaryFindings = patternFindings.filter(f => f.patternId === PatternId.BOUNDARY_CANDIDATE);
        console.log(`[DT-A1] InsightEngine:\n  totalFindings=${simContext?.evidenceBundle?.findings?.length || 0}\n  totalPatternFindings=${patternFindings.length}\n  boundaryPatternFindings=${boundaryFindings.length}\n  patternIds={ ${Array.from(new Set(patternFindings.map(f => f.patternId))).join(', ')} }`);

        
        return { 
            immediateImpact, 
            secondaryImpact, 
            blastRadius,
            sources: {
                blastRadius: { value: blastRadius, source: 'simContext.evidenceBundle' }
            },
            patternFindings
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
---\n\n`;

        md += `## Executive Summary\n\n${contract.summary}\n\n`;

        md += `## Findings\n\n`;
        for (const section of contract.findings) {
            md += `### ${section.title}\n\n${section.content}\n\n`;
        }

        md += `## Evidence\n\n`;
        if (!contract.evidence || contract.evidence.length === 0) {
            md += `Detailed evidence is available in the [Evidence Viewer](EVIDENCE_VIEWER.html).\n\n`;
        }
        for (const section of contract.evidence) {
            md += `### ${section.title}\n\n${section.content}\n\n`;
        }

        md += `## Appendix\n\n`;
        for (const section of contract.appendix) {
            md += `<details>\n<summary>${section.title}</summary>\n\n\`\`\`json\n${section.content}\n\`\`\`\n</details>\n\n`;
        }

        return md;
    }

    public buildAuditInsight(context: ValidationContext, simContext?: SimulationContext): AuditInsight {
        const metricDetector = new MetricAccessDetector();
        const vocabDetector = new VocabularyViolationDetector();
        
        const patternFindings = [
            ...traceDetectorExecution(PatternId.METRIC_ACCESS_VIOLATION, 'MetricAccessDetector', metricDetector, context, simContext),
            ...traceDetectorExecution(PatternId.VOCABULARY_VIOLATION, 'VocabularyViolationDetector', vocabDetector, context, simContext)
        ];
        
        return {
            patternFindings
        };
    }
}
