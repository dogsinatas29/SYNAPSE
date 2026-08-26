import * as fs from 'fs';
import * as path from 'path';
import { ArchitecturalRole, FindingType, RiskLevel, ArchitecturalFinding } from '../../types/schema';
import { 
    ValidationContext, ValidationMetrics, GraphSnapshot,
    SpeciesStabilityRow, StabilityGateResult, SpeciesPresenceRow,
    SpeciesConfidenceRow, SpeciesScoreConfidenceRow, BoundaryPressure,
    BoundaryConfidenceHistogram, ThresholdSweepRow, InfraMeshThresholdRecommendation,
    InfraTarget, TopCommunitySpeciesRow 
} from './ValidationContext';
// Stub for ASTVerificationReport to avoid importing CLI things
interface ASTVerificationReport {
    auditSuccessRate: number;
    auditCoverage: number;
    falsePositivesDetected: number;
}

interface ValidationReport {
    generatedAt?: string;
    runCount?: number;
    speciesStability?: SpeciesStabilityRow[];
    establishmentGate?: StabilityGateResult;
    presenceMatrix?: SpeciesPresenceRow[];
    speciesConfidence?: SpeciesConfidenceRow[];
    speciesScoreConfidence?: SpeciesScoreConfidenceRow[];
    boundaryPressure?: BoundaryPressure[];
    boundaryConfidenceHistogram?: BoundaryConfidenceHistogram[];
    infraMeshThresholdSweep?: ThresholdSweepRow[];
    infraMeshBaselineThreshold?: number;
    infraMeshThresholdRecommendation?: InfraMeshThresholdRecommendation;
    auditThresholds?: Record<string, number>;
    infrastructureSplitCandidates?: InfraTarget[];
    auditQueueSeed?: TopCommunitySpeciesRow[];
    astVerification?: ASTVerificationReport;
    estimatedCost?: {
        engineers: number;
        days: number;
        filesAffected: number;
        edgesAffected: number;
    };
    ifIgnoredImpact?: {
        architectureEntropy: number;
        boundaryFragmentation: boolean;
        estimatedMonthsToIssue: number;
    };
    falsePositiveProbability?: number;
    topImpactFiles?: Array<{
        filePath: string;
        externalEdges: number;
        internalEdges: number;
        consumers: string[];
    }>;
}

function fixed(n: number | undefined, d = 3): string {
    if (n === undefined || Number.isNaN(n)) return 'n/a';
    return n.toFixed(d);
}

function calculateReportConfidence(report: ValidationReport): { 
    stableSpecies: number; 
    totalSpecies: number;
    overallConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
    scoreMsg: string;
} {
    const stable = report.presenceMatrix?.filter(x => x.status === 'Stable').length || 0;
    const total = report.presenceMatrix?.length || 1;
    const stableRatio = stable / total;
    const confidence = stableRatio >= 0.75 ? 'HIGH' : stableRatio >= 0.50 ? 'MEDIUM' : 'LOW';
    const scoreMsg = `${(stableRatio * 100).toFixed(0)}% stable species across ${report.runCount} runs`;
    return { stableSpecies: stable, totalSpecies: total, overallConfidence: confidence, scoreMsg };
}

function calculateClassificationReasoning(report: ValidationReport): string {
    const top = report.infrastructureSplitCandidates?.[0];
    if (!top) return 'No mesh residue detected.';
    
    const ratio = top.internal > 0 ? top.external / top.internal : 0;
    const purity = ratio < 1.5 ? 'LOW' : ratio < 3 ? 'MEDIUM' : 'HIGH';
    const hubGravity = (top.external / (top.external + top.internal)).toFixed(2);
    
    return [
        `Structural Purity: ${purity} (ext/int ratio = ${ratio.toFixed(2)})`,
        `External Edges: ${top.external}`,
        `Internal Edges: ${top.internal}`,
        `Hub Gravity (external ratio): ${hubGravity}`,
        `Decision: Infrastructure Mesh due to high cross-boundary coupling.`
    ].join('\n');
}

function calculateImpactForecast(report: ValidationReport): string {
    const top = report.infrastructureSplitCandidates?.[0];
    if (!top) return 'No impact forecast for calibrated-out mesh.';
    
    if (top.external === 0 && top.internal === 0) return 'N/A (No edges)';
    const edgeReduction = Math.round((top.external / (top.external + top.internal)) * 100);
    const affectedNodes = top.external + top.internal; // Real count instead of magic 0.65
    
    return [
        `Affected Nodes: ${affectedNodes}`,
        `Predicted Edge Reduction: ${edgeReduction}%`
    ].join('\n');
}

function buildPriorityQueue(report: ValidationReport): string {
    const top = report.infrastructureSplitCandidates?.[0];
    const lines: string[] = [];
    
    if (top) {
        lines.push('**P1: Infrastructure Mesh Residue**');
        lines.push(`- Community: ${top.id}`);
        lines.push(`- Impact: Critical`);
        lines.push(`- Difficulty: Medium`);
        lines.push(`- ROI: Very High (${(top.external / (top.external + top.internal) * 100).toFixed(0)}% cross-boundary)`);
        lines.push('');
    }
    
    const bridge = report.speciesStability?.find(x => x.species === 'Bridge Candidate');
    if (bridge) {
        lines.push('**P2: Bridge Candidate Boundary Tuning**');
        lines.push(`- Count: ${bridge.avg.toFixed(0)} avg (range ${bridge.min}-${bridge.max})`);
        lines.push(`- Impact: High`);
        lines.push(`- Difficulty: Low`);
        lines.push(`- ROI: High (stabilize boundary confidence)`);
        lines.push('');
    }
    
    const utility = report.speciesStability?.find(x => x.species === 'Utility Candidate');
    if (utility) {
        lines.push('**P3: Utility Candidate Refinement**');
        lines.push(`- Count: ${utility.avg.toFixed(0)} avg (range ${utility.min}-${utility.max})`);
        lines.push(`- Impact: Medium`);
        lines.push(`- Difficulty: Medium`);
        lines.push(`- ROI: Medium (reduce boundary volatility)`);
    }
    
    return lines.join('\n') || 'No priority queue items.';
}

export interface SubjectFingerprint {
    subjectName: string;
    filesCount: number;
    internalEdges: number;
    boundaryEdges: number;
    topInternalDomains: string[];
    boundaryTargets: Array<{ target: string; count: number }>;
}

function extractSubjectFingerprint(snapshot: Readonly<GraphSnapshot>): SubjectFingerprint {
    if (!snapshot.nodes || snapshot.nodes.length === 0) {
        return { subjectName: 'Unknown', filesCount: 0, internalEdges: 0, boundaryEdges: 0, topInternalDomains: [], boundaryTargets: [] };
    }
    
    const clusterCounts = new Map<string, number>();
    let realFilesCount = 0;
    
    for (const node of snapshot.nodes) {
        if (node.type === 'aggregate') continue;
        realFilesCount++;
        const cid = node.cluster_id || 'Unknown';
        clusterCounts.set(cid, (clusterCounts.get(cid) || 0) + 1);
    }
    
    // Sort all candidates by file count
    const sortedDomains = Array.from(clusterCounts.entries()).sort((a, b) => b[1] - a[1]);
    
    // Filter out ghost and system clusters to find the true Subject
    const validSubjects = sortedDomains.filter(([cid, _]) => !cid.includes('ghost') && !cid.startsWith('sys_') && cid !== 'Unknown');
    
    const subjectName = validSubjects.length > 0 ? validSubjects[0][0] : (sortedDomains.length > 0 ? sortedDomains[0][0] : 'Unknown');
    
    console.log("[SUBJECT_AUDIT]", {
        candidateSubjects: sortedDomains.slice(0, 5).map(([cid, count]) => `${cid} (${count} files)`),
        selectedSubject: subjectName,
        reason: validSubjects.length > 0 ? 'largest non-ghost/system domain' : 'fallback to largest domain'
    });
    
    // Use the children/sub-domains of the subject if possible, but for now just show top internal valid domains
    const topInternalDomains = validSubjects.slice(0, 5).map(x => x[0]);
    
    let internalEdges = 0;
    let boundaryEdges = 0;
    const boundaryTargetCounts = new Map<string, number>();
    
    const nodeClusterMap = new Map<string, string>();
    for (const node of snapshot.nodes) {
        nodeClusterMap.set(node.id, node.cluster_id || 'Unknown');
    }
    
    for (const edge of snapshot.edges || []) {
        const fromCluster = nodeClusterMap.get(edge.from ?? '');
        const toCluster = nodeClusterMap.get(edge.to ?? '');
        
        const actualFrom = fromCluster || 'Unknown';
        const actualTo = toCluster || 'Unknown';
        
        if (actualFrom === actualTo) {
            internalEdges++;
        } else {
            boundaryEdges++;
            boundaryTargetCounts.set(actualTo, (boundaryTargetCounts.get(actualTo) || 0) + 1);
        }
    }
    
    const boundaryTargets = Array.from(boundaryTargetCounts.entries())
        .map(([target, count]) => ({ target, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
        
    return {
        subjectName,
        filesCount: realFilesCount,
        internalEdges,
        boundaryEdges,
        topInternalDomains,
        boundaryTargets
    };
}

function calculateFalsePositiveProbability(report: ValidationReport): number {
    const confReport = calculateReportConfidence(report);
    let prob = 1.0 - (confReport.stableSpecies / confReport.totalSpecies);
    
    if (report.establishmentGate?.stable) {
        prob *= 0.1;
    } else {
        prob *= 0.3;
    }
    
    return Math.max(0.05, Math.min(0.35, prob));
}

function estimateCost(report: ValidationReport): any {
    const top = report.infrastructureSplitCandidates?.[0];
    
    // Healthy codebase: no infra mesh candidates → derive cost from topImpactFiles instead
    if (!top) {
        const impactFiles: any[] = (report as any).topImpactFiles || [];
        console.log(`[CostProjection] infra candidates=0, topImpactFiles=${impactFiles.length}`);
        if (impactFiles.length === 0) return { engineers: 0, days: 0, filesAffected: 0, edgesAffected: 0 };
        
        const totalEdges = impactFiles.reduce((sum: number, f: any) => sum + (f.externalEdges || 0), 0);

        // filesAffected = deduplicated consumers across all top impact files
        // impactFiles.length is the SCAN LIMIT, not the actual affected file count
        const consumerSet = new Set<string>();
        for (const f of impactFiles) {
            for (const c of (f.consumers || [])) consumerSet.add(c);
        }
        const filesAffected = consumerSet.size > 0 ? consumerSet.size : impactFiles.length;

        const engineers = Math.min(8, Math.max(1, Math.ceil(filesAffected / 20)));
        const days = Math.max(1, Math.ceil(totalEdges / 50));
        console.log(`[CostProjection] filesAffected=${filesAffected}(consumers=${consumerSet.size}), totalEdges=${totalEdges}`);
        return { engineers, days, filesAffected, edgesAffected: totalEdges };
    }
    
    const totalEdges = top.external + top.internal;
    if (totalEdges === 0) return { engineers: 0, days: 0, filesAffected: 0, edgesAffected: 0 };
    
    const filesAffected = Math.max(1, Math.round(Math.sqrt(totalEdges)));
    const engineers = Math.min(3, Math.ceil(filesAffected / 10));
    const days = Math.max(1, Math.ceil(filesAffected / 5));
    
    return { engineers, days, filesAffected, edgesAffected: totalEdges };
}


function projectIfIgnored(report: ValidationReport): any {
    const top = report.infrastructureSplitCandidates?.[0];
    
    if (!top || (top.external === 0 && top.internal === 0)) {
        return {
            architectureEntropy: 12, // Base healthy entropy
            boundaryFragmentation: false,
            estimatedMonthsToIssue: 'Healthy (>36 months)'
        };
    }
    
    const ratio = top.external / (top.external + top.internal);
    const entropy = Math.min(1.0, ratio); // Real calculation based on coupling
    
    return {
        architectureEntropy: Math.round(entropy * 100),
        boundaryFragmentation: true,
        estimatedMonthsToIssue: 'UNKNOWN'
    };
}

// Constants for rendering assessments and recommendations
const FindingAssessmentTemplates: Record<string, string> = {
    [FindingType.UI_TO_SERVICE_COUPLING]: 'UI layer is directly coupled to domain services and state-management layers.',
    [FindingType.EXCESSIVE_FAN_OUT]: 'Component directly manages or orchestrates an excessive number of dependencies.',
    [FindingType.GOD_SERVICE]: 'Centralized service object that handles too many responsibilities across domain boundaries.',
    [FindingType.CYCLIC_DEPENDENCY]: 'Participates in a structural cycle, preventing independent testing or deployment.',
    [FindingType.HEALTHY_HUB]: 'Project startup composition root. Responsible for wiring multiple subsystem clusters.',
    [FindingType.CONTRACT_BLOAT]: 'Central contract node is accumulating too many dependent modules, becoming a protocol bottleneck.',
    [FindingType.NORMAL]: 'Standard node behavior without severe structural anomalies.'
};

const FindingRecommendationTemplates: Record<string, string> = {
    [FindingType.UI_TO_SERVICE_COUPLING]: 'Introduce ViewModel, Facade, or Presentation Boundary.',
    [FindingType.EXCESSIVE_FAN_OUT]: 'Split responsibilities or apply Dependency Inversion Principle (DIP).',
    [FindingType.GOD_SERVICE]: 'Decompose into smaller domain-specific services.',
    [FindingType.CYCLIC_DEPENDENCY]: 'Break cycle via interfaces (DIP) or merge modules.',
    [FindingType.HEALTHY_HUB]: 'No action required. Excluded from risk ranking.',
    [FindingType.CONTRACT_BLOAT]: 'Monitor growth and split contract domains if Fan-In continues increasing.',
    [FindingType.NORMAL]: 'No immediate architectural action required.'
};

export class ValidationReportBuilder {
    static generateReports(ctx: ValidationContext, evId: string): { mdPath: string; htmlPath: string } {
        const BUILD_VERSION = "v0.3.34.20";
        console.log('[ASR_BUILDER]', BUILD_VERSION, new Date().toISOString());

        const fingerprint = extractSubjectFingerprint(ctx.snapshot);
        const report = { ...ctx.metrics, snapshot: ctx.snapshot, subjectFingerprint: fingerprint, buildVersion: BUILD_VERSION, answerBundle: (ctx as any).answerBundle } as any;
        report.assemblyAudit = (ctx.snapshot as any).metadata?.assemblyAudit || [];

        // [P0 진단] 결함 1 원인 규명: 데이터 전달 계측
        console.log('[VRB_ENTRY]', {
            ctxAssemblyAudit: (ctx.snapshot as any).metadata?.assemblyAudit?.length || 0,
            ctxArchitecturalFindings: (ctx.snapshot as any).metadata?.architecturalFindings?.length || 0,
            reportAssemblyAudit: report.assemblyAudit?.length || 0
        });

        // [P0 진단] report 객체 포함 여부 확인
        console.log('[VRB_REPORT]', {
            assemblyAudit: report.assemblyAudit?.length ?? -1,
            architecturalFindings: report.architecturalFindings?.length ?? -1
        });

        // Populate calculated metrics
        report.falsePositiveProbability = calculateFalsePositiveProbability(report);
        report.estimatedCost = estimateCost(report);
        report.ifIgnoredImpact = projectIfIgnored(report);

        console.log("[REPORT_INPUT]", {
            subjectName: fingerprint.subjectName,
            files: fingerprint.filesCount,
            totalBoundaryEdges: fingerprint.boundaryEdges
        });
        
        console.log('[REPORT_REASONING]', !!(ctx as any).answerBundle);

        const root = ctx.workspaceRoot || process.cwd();
        const path = require('path');
        const projectName = path.basename(root);
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0]; // YYYY-MM-DD_HHMMSS
        
        const bundleDir = path.join(root, 'synapse_report', 'surgery');
        fs.mkdirSync(bundleDir, { recursive: true });

        // Generate the legacy ASR content to preserve data during transition
        const mdContent = this.buildMarkdown(report, evId, ctx.workspaceRoot || '');
        
        // Output the 4 structured files using InsightEngine
        const { InsightEngine } = require('../reporting/InsightEngine');
        const insight = new InsightEngine();
        
        const evidenceCount = ctx.snapshot?.nodes?.length || 0;
        
        // 00_EXECUTIVE_SUMMARY
        const execHeader = insight.generateHeader('EXECUTIVE', 'ARCHITECTURAL_SCAN', ctx, evidenceCount);
        const execInsight = insight.buildExecutiveInsight(ctx);
        const execSummaryStr = `**Health**: ${execInsight.health}\n\n**Frontier Observation**: ${execInsight.frontierObservation}\n\n**Action**: ${execInsight.action}\n\n**Why It Matters**: ${execInsight.whyItMatters}`;
        const execContract = {
            header: execHeader,
            summary: execSummaryStr,
            findings: [{ title: 'Overview', content: 'See Executive Summary for high-level health.' }],
            evidence: [],
            appendix: []
        };
        fs.writeFileSync(path.join(bundleDir, '00_EXECUTIVE_SUMMARY.md'), insight.renderReportToMarkdown(execContract));
        
        // 01_ARCHITECT_REPORT
        const archHeader = insight.generateHeader('ARCHITECT', 'ARCHITECTURAL_SCAN', ctx, evidenceCount);
        const archContract = {
            header: archHeader,
            summary: 'Focuses on boundaries, roles, and structural risks.',
            findings: [{ title: 'Role Distribution', content: 'Pending Integration' }],
            evidence: [],
            appendix: []
        };
        fs.writeFileSync(path.join(bundleDir, '01_ARCHITECT_REPORT.md'), insight.renderReportToMarkdown(archContract));

        // 02_ONBOARDING_REPORT
        const onboardHeader = insight.generateHeader('ONBOARDING', 'ARCHITECTURAL_SCAN', ctx, evidenceCount);
        const onboardContract = {
            header: onboardHeader,
            summary: 'Guides new developers through entry points and the system heart.',
            findings: [{ title: 'Entry Points', content: 'Pending Integration' }],
            evidence: [],
            appendix: []
        };
        fs.writeFileSync(path.join(bundleDir, '02_ONBOARDING_REPORT.md'), insight.renderReportToMarkdown(onboardContract));

        // 03_SIMULATION_DEBUG
        const debugHeader = insight.generateHeader('SIMULATION_DEBUG', 'EXECUTION_TRACE', ctx, evidenceCount);
        const debugContract = {
            header: debugHeader,
            summary: 'Analyzes blast radius and failure propagation of changes.',
            findings: [{ title: 'Legacy ASR Findings', content: 'See Appendix for full dump.' }],
            evidence: [],
            appendix: [{ title: 'Legacy ASR Dump', content: mdContent }]
        };
        fs.writeFileSync(path.join(bundleDir, '03_SIMULATION_DEBUG.md'), insight.renderReportToMarkdown(debugContract));

        // 04_RAW_DATA
        fs.writeFileSync(path.join(bundleDir, '04_RAW_DATA.json'), JSON.stringify(report, null, 2), 'utf-8');

        // Return the summary path as mdPath
        const mdPath = path.join(bundleDir, '00_EXECUTIVE_SUMMARY.md');
        const htmlPath = ''; 

        return { mdPath, htmlPath };
    }

    private static cleanDomainName(name: string): string {
        if (!name) return 'Unknown';
        if (name.includes('ghost')) {
            const parts = name.split('_');
            const libName = parts.length > 2 ? parts.slice(2).join('/') : name;
            return `Ghost Dependency (${libName})`;
        }
        if (name.startsWith('folder_')) {
            return 'Module: ' + name.replace('folder_', '').replace(/_/g, '/');
        }
        return name;
    }

    private static buildMarkdown(report: any, evId: string, rootPath: string): string {
        const fp = report.subjectFingerprint;
        const verdict = report.establishmentGate?.stable ? 'PASS' : 'HOLD';
        const confidenceScore = (1 - (report.falsePositiveProbability || 0.125)) * 100;
        
        const mBoundaryRatio = fp.internalEdges > 0 ? (fp.boundaryEdges / fp.internalEdges).toFixed(1) : (fp.boundaryEdges === 0 ? '0.0' : 'N/A');
        const entropyScore = report.ifIgnoredImpact?.architectureEntropy !== 'N/A' ? report.ifIgnoredImpact.architectureEntropy : 'N/A';
        const entropyLevel = entropyScore !== 'N/A' ? (entropyScore > 75 ? 'HIGH' : entropyScore > 50 ? 'MEDIUM' : 'LOW') : 'UNKNOWN';

        const expectedEntropy = (report.estimatedCost?.edgesAffected === 0 && entropyScore !== 'N/A') ? entropyScore : 'N/A';
        const expectedBoundary = (report.estimatedCost?.edgesAffected === 0) ? fp.boundaryEdges : 'N/A';
        const ghostCount = fp.boundaryTargets?.find((t:any) => t.target.includes('ghost'))?.count || 0;

        let ghostBreakdownText = '';
        if (report.ghostBreakdown && report.ghostBreakdown.length > 0) {
            const unknownEntry = report.ghostBreakdown.find((b: any) => b.name === 'UNKNOWN_REFERENCE');
            const unknownCount = unknownEntry ? unknownEntry.count : 0;
            const unknownRatio = unknownEntry ? unknownEntry.ratio : 0;
            
            let assessmentStr = 'Scanner quality is EXCELLENT.';
            if (unknownRatio > 10) assessmentStr = 'Scanner quality is POOR. Needs rule refinement.';
            else if (unknownRatio > 5) assessmentStr = 'Scanner quality is FAIR.';
            else if (unknownRatio > 0) assessmentStr = 'Scanner quality is GOOD.';

            ghostBreakdownText = '#### Ghost Health\n\n' + report.ghostBreakdown
                .map((b: any) => `- **${this.cleanDomainName(b.name)}**: ${b.count} (${b.ratio}%)`)
                .join('\n');
            
            ghostBreakdownText += `\n\n**Assessment:**\n${assessmentStr}\nUnknown ghost ratio = ${unknownRatio.toFixed(1)}%`;
        } else {
            ghostBreakdownText = '  - N/A';
        }

        let externalBreakdownText = '';
        if (report.externalBreakdown && report.externalBreakdown.length > 0) {
            externalBreakdownText = report.externalBreakdown
                .map((b: any) => `  - **${this.cleanDomainName(b.name)}**: ${b.count} (${b.ratio}%)`)
                .join('\n');
        } else {
            externalBreakdownText = '  - N/A';
        }

        let couplingBreakdownText = '';
        if (report.couplingBreakdown && report.couplingBreakdown.length > 0) {
            couplingBreakdownText = report.couplingBreakdown
                .slice(0, 5)
                .map((b: any) => `  - **${this.cleanDomainName(b.name)}**: ${b.count} (${b.ratio}%)`)
                .join('\n');
            if (report.couplingBreakdown.length > 5) couplingBreakdownText += '\n  - ...';
        } else {
            couplingBreakdownText = '  - N/A';
        }
        const domainsText = (fp.topInternalDomains || []).map((d: string) => `- ${this.cleanDomainName(d)}`).join('\n') || '- N/A';
        const targetsText = (fp.boundaryTargets || []).map((t: any) => `- **${this.cleanDomainName(t.target)}** (${t.count} edges)`).join('\n') || '- No boundary targets found';

        let topImpactFilesArray = (report.topImpactFiles || []).slice(0, 10);
        
        const calcTopSum = (n: number) => {
            if (report.topImpactFiles.length === 0) return 0;
            return report.topImpactFiles.slice(0, n).reduce((sum: number, f: any) => sum + (f.externalEdges || 0), 0);
        };
        const calcTopPct = (sum: number) => fp.boundaryEdges > 0 ? ((sum / fp.boundaryEdges) * 100).toFixed(1) : '0.0';

        const top3Sum = calcTopSum(3);
        const top10Sum = calcTopSum(10);
        const top50Sum = calcTopSum(50);
        const top100Sum = calcTopSum(100);
        
        const top3Names = (report.topImpactFiles || []).slice(0, 3).map((f: any) => path.basename(f.filePath)).join(', ');

        const cm = report.auditConfidenceMatrix;
        let confidenceMatrixText = '';
        if (cm) {
            confidenceMatrixText = [
                `**Audit Confidence**: ${cm.finalScore}%`,
                '',
                `Base Score                     ${cm.baseScore}`,
                `Grammar Noise Filtered        +${cm.grammarNoiseFiltered}`,
                `Assembly Point Classified      +${cm.assemblyPointClassified}`,
                `Contract Hub Verified          +${cm.contractHubVerified}`,
                `Ghost Ratio < 5%               +${cm.lowGhostRatio}`,
                `Unknown References             ${cm.unknownReferences}`,
                `Final Score                   ${cm.finalScore}`
            ].join('\n');
        } else {
            confidenceMatrixText = `**Audit Confidence (Scanner Reliability)**: ${confidenceScore.toFixed(1)}%`;
        }

        const verdictSection = [
            `## 1. Executive Summary`,
            `**Scan Context**: Sub-cluster Analysis`,
            `**Observation**: External Dependency Ratio = ${mBoundaryRatio}x`,
            `**Assessment**: Selected cluster depends heavily on modules outside the scan boundary.`,
            `**Implication**: This does not imply whole-project instability.`,
            '',
            `**Why High External Coupling?**`,
            `- **Boundary Edge Count**: ${fp.boundaryEdges} / ${fp.internalEdges} (Internal)`,
            `- **Top 3 Contributors**: 상위 3개 파일(${top3Names || 'N/A'})이 전체 Boundary Edge의 **${calcTopPct(top3Sum)}%** (${top3Sum}개)를 생성하고 있습니다.`,
            '',
            (report.snapshot?.metadata?.resolutionStats ? [
                `### Edge Resolution Quality`,
                `- **TOTAL EDGES**: ${report.snapshot.metadata.resolutionStats.total}`,
                `- **RESOLVED**: ${report.snapshot.metadata.resolutionStats.resolved}`,
                `- **AMBIGUOUS**: ${report.snapshot.metadata.resolutionStats.ambiguous}`,
                `- **GHOST**: ${report.snapshot.metadata.resolutionStats.ghost}`,
                `- **UNRESOLVED**: ${report.snapshot.metadata.resolutionStats.unresolved}`,
                ''
            ].join('\n') : ''),
            ((report.metrics?.edgeTypeDistribution || report.snapshot?.metadata?.edgeTypeDistribution) ? [
                `### Edge Type Distribution`,
                ...Object.entries((report.metrics?.edgeTypeDistribution || report.snapshot?.metadata?.edgeTypeDistribution) as Record<string, number>)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([k, v]) => `- **${k}**: ${v}`),
                ''
            ].join('\n') : ''),
            `**Cumulative Boundary Contribution**`,
            `- **Top 3**: ${calcTopPct(top3Sum)}% (${top3Sum} edges)`,
            `- **Top 10**: ${calcTopPct(top10Sum)}% (${top10Sum} edges)`,
            `- **Top 50**: ${calcTopPct(top50Sum)}% (${top50Sum} edges)`,
            `- **Top 100**: ${calcTopPct(top100Sum)}% (${top100Sum} edges)`,
            '',
            confidenceMatrixText,
            '',
            '### Global Metrics',
            `- **Entropy**: ${entropyScore}`,
            `- **Ghost Dependencies**: ${ghostCount}`,
            '',
            '### Dependency Sources Breakdown',
            '**Ghost Dependencies (Scanner Issues)**',
            ghostBreakdownText,
            '',
            '**External Dependencies (Architecture)**',
            externalBreakdownText,
            ''
        ].join('\n');

        const expectedSection = [
            '## 4. Expected After Surgery',
            '🟢 **STRENGTHENED**',
            `- **Entropy**: ${entropyScore} -> ${expectedEntropy}`,
            `- **Boundary Edges**: ${fp.boundaryEdges} -> ${expectedBoundary}`,
            ''
        ].join('\n');

        let ghostEvidenceText = '';
        if (report.ghostEvidence && report.ghostEvidence.length > 0) {
            ghostEvidenceText = '<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>\n\n' + report.ghostEvidence
                .map((e: any) => {
                    const absSource = path.isAbsolute(e.source) ? e.source : path.join(rootPath, e.source);
                    return `- [${this.cleanDomainName(e.source)}](vscode://file/${absSource}) -> ${this.cleanDomainName(e.target)} (Count: ${e.evidenceCount})`;
                })
                .join('\n') + '\n</details>';
        }

        let boundaryEvidenceText = '';
        if (report.boundaryEvidence && report.boundaryEvidence.length > 0) {
            boundaryEvidenceText = '<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>\n\n' + report.boundaryEvidence
                .map((e: any) => {
                    const absSource = path.isAbsolute(e.source) ? e.source : path.join(rootPath, e.source);
                    return `- [${this.cleanDomainName(e.source)}](vscode://file/${absSource}) -> ${this.cleanDomainName(e.target)} (Count: ${e.evidenceCount})`;
                })
                .join('\n') + '\n</details>';
        }


        let surgerySection = ['## 2. Impact Files (Architectural Assessment)'];

        const archFindings = report.snapshot?.metadata?.architecturalFindings || [];
        const findingMap = new Map<string, ArchitecturalFinding>();
        for (const f of archFindings) findingMap.set(f.nodeId, f);

        if (topImpactFilesArray.length > 0) {
            for (let i = 0; i < topImpactFilesArray.length; i++) {
                const file = topImpactFilesArray[i];
                const absFile = path.isAbsolute(file.filePath) ? file.filePath : path.join(rootPath, file.filePath);
                
                const finding = findingMap.get(file.filePath);
                // [v0.3.34.20] architecturalRole 우선 사용: Auditor 판정 결과 > NodeRole > 기본값
                const roleText = finding ? finding.role : (file.architecturalRole || file.role || 'Impact File');
                
                surgerySection.push(`### ${i + 1}. ${this.cleanDomainName(file.filePath)}`);
                surgerySection.push(`- **Role**: ${roleText}`);
                surgerySection.push(`[View Source File](vscode://file/${absFile})`);
                surgerySection.push('');
                
                surgerySection.push(`**Evidence (Observed Behavior)**`);
                if (finding && finding.evidence) {
                    for (const ev of finding.evidence) {
                        surgerySection.push(`- ${ev.type}: ${ev.value}`);
                    }
                } else {
                    surgerySection.push(`- Boundary Crossing: ${file.externalEdges || 0}`);
                    surgerySection.push(`- Fan-Out: ${file.fanOut || 0}`);
                    surgerySection.push(`- Blast Radius: ${file.reachability ? file.reachability + ' Clusters' : 'N/A (No reachable cluster data)'}`);
                }
                surgerySection.push('');
                
                if (finding) {
                    surgerySection.push(`**Architectural Assessment**`);
                    surgerySection.push(`> ${finding.findingType}: ${FindingAssessmentTemplates[finding.findingType] || 'No specific assessment.'}`);
                    surgerySection.push('');
                    
                    surgerySection.push(`**Risk Level**: ${finding.risk}`);
                    surgerySection.push('');
                    
                    surgerySection.push(`**Recommended Action**`);
                    surgerySection.push(`> ${FindingRecommendationTemplates[finding.findingType] || 'No action specified.'}`);
                    surgerySection.push('');
                }
                
                if (file.targets && file.targets.length > 0) {
                    surgerySection.push(`**Top External Targets (Evidence)**`);
                    for (const t of file.targets) {
                        surgerySection.push(`- ${this.cleanDomainName(t.target)} (${t.count} edges - Type: ${t.typeStr || 'UNKNOWN'})`);
                    }
                } else if (file.consumers && file.consumers.length > 0) {
                    // Legacy fallback
                    surgerySection.push(`- **Coupled Consumers**: ${file.consumers.length} external modules`);
                }

                // [v0.3.34.20] AST Evidence Verification output
                if (file.astVerification && !file.astVerification.degraded) {
                    const av = file.astVerification;
                    const cls = av.classification || 'UNKNOWN';
                    const r = av.ratios || {};
                    const humanMap: Record<string, string> = {
                        TYPE_ONLY: '이 파일은 주로 타입과 인터페이스 정의를 담당한다. 런타임 위험도 낮음.',
                        CONTRACT_HUB: '이 파일은 대규모 계약 허브다. 변경 시 광범위한 타입 호환성 영향.',
                        BARREL_EXPORT: '이 파일은 하위 모듈을 일괄 재수출하는 배럴 파일이다. 직접 실행 로직 없음.',
                        HEADER_CONTRACT: '이 파일은 선언 중심 헤더 계약이다. 런타임 로직 없음.',
                        TEST_ARTIFACT: '이 파일은 테스트 아티팩트다. 프로덕션 위험도에서 제외.',
                        RUNTIME_HUB: '이 파일은 실제 실행 로직을 포함하는 런타임 허브다. 변경 시 즉각적 영향.',
                        HEALTHY_CONTRACT: '이 파일은 계약과 구현이 균형을 이룬다. 표준 위험도.',
                        DATA_HUB: '이 파일은 데이터 전용 파일이다. 위험도 낮음.',
                    };
                    surgerySection.push('');
                    surgerySection.push(`**AST Evidence Verification** \`[${cls}]\``);
                    surgerySection.push(`- interface: ${r.interface ?? 0}% | type: ${r.type ?? 0}% | function: ${r.function ?? 0}% | statement: ${r.statement ?? 0}%`);
                    if (file.adjustedImpactScore !== undefined && file.adjustedImpactScore !== (file.impactScore || file.externalEdges)) {
                        surgerySection.push(`- Score: ${file.impactScore || file.externalEdges || 0} → ${file.adjustedImpactScore} (×${av.multiplier})`);
                    }
                    surgerySection.push(`> ${humanMap[cls] || cls}`);
                }

                surgerySection.push('');

            }
        } else {
            surgerySection.push('*No specific impact files identified.*');
        }

        let evidenceLayerSection = [
            '## 3. Evidence Layer',
            '### 3.1 Ghost Evidence',
            ghostEvidenceText || '*No ghost evidence found.*',
            '',
            '### 3.2 Boundary Evidence',
            boundaryEvidenceText || '*No boundary evidence found.*'
        ].join('\n');

        let systemAssemblySection = ['## 4. System Assembly Points (Healthy Hubs)'];
        if (report.systemAssemblyPoints && report.systemAssemblyPoints.length > 0) {
            for (let i = 0; i < report.systemAssemblyPoints.length; i++) {
                const file = report.systemAssemblyPoints[i];
                const absFile = path.isAbsolute(file.filePath) ? file.filePath : path.join(rootPath, file.filePath);
                // [v0.3.34.20] architecturalRole 사용: Auditor 판정 결과
                systemAssemblySection.push(`- [${this.cleanDomainName(file.filePath)}](vscode://file/${absFile}) (Role: ${file.architecturalRole || file.role || 'Unknown'})`);
            }
        } else {
            systemAssemblySection.push('*No system assembly points identified.*');
        }

        let assemblyAuditSection = ['### 4.1 ASSEMBLY_POINT Audit'];
        if (report.assemblyAudit && report.assemblyAudit.length > 0) {
            for (const audit of report.assemblyAudit) {
                const mark = audit.accepted ? 'ACCEPTED' : 'REJECTED';
                assemblyAuditSection.push(`${this.cleanDomainName(audit.filePath)}`);
                assemblyAuditSection.push(`Verdict: ${mark}`);
                assemblyAuditSection.push('');
                assemblyAuditSection.push(`Evidence`);
                assemblyAuditSection.push(`FanOut: ${audit.fanOut}`);
                assemblyAuditSection.push(`Boundary Ratio: ${audit.boundaryRatio.toFixed(2)}`);
                assemblyAuditSection.push('');
                
                if (audit.reasons && audit.reasons.length > 0) {
                    assemblyAuditSection.push(`Reason Code:`);
                    for (const reason of audit.reasons) {
                        assemblyAuditSection.push(`${reason}`);
                    }
                }
                assemblyAuditSection.push('');
                assemblyAuditSection.push('---');
            }
        } else {
            assemblyAuditSection.push('*No candidates found.*');
        }

        let contractHubSection = [];

        let docEvidenceSection = ['## 5. Knowledge Connectivity'];
        if (report.docEvidence && report.docEvidence.length > 0) {
            docEvidenceSection.push('<details><summary><b>Show Knowledge Sources</b></summary>\n');
            docEvidenceSection.push(report.docEvidence
                .map((e: any) => {
                    const absSource = path.isAbsolute(e.source) ? e.source : path.join(rootPath, e.source);
                    return `- [${this.cleanDomainName(e.source)}](vscode://file/${absSource}) -> ${this.cleanDomainName(e.target)}`;
                })
                .join('\n') + '\n</details>');
        } else {
            docEvidenceSection.push('*No knowledge sources linked.*');
        }

        const totalSubjectEdges = fp.boundaryEdges + fp.internalEdges;
        const boundaryPercentage = totalSubjectEdges > 0 ? ((fp.boundaryEdges / totalSubjectEdges) * 100).toFixed(1) + '%' : 'N/A';
        
        let rawMetricsSection = [
            '## 6. Raw Metrics',
            `### 6.1 Global Metrics`,
            `- **Boundary Ratio**: ${boundaryPercentage}`,
            '',
            '### 6.2 Source Breakdown (ASR 3.0)',
            '#### Ghost Source Top N',
            ghostBreakdownText,
            '',
            '#### Coupling Source Top N',
            couplingBreakdownText
        ].join('\n');

        let architecturalReasoningSection = ['## 7. Architectural Reasoning'];
        const answerBundle = (report.snapshot?.metadata as any)?.answerBundle || (report as any).answerBundle;
        if (answerBundle) {
            if (answerBundle.extensionPoints && answerBundle.extensionPoints.length > 0) {
                architecturalReasoningSection.push('### Q4 Extension Points');
                // The answer engine returns answers. We want to extract findings from the answers.
                // Q4ExtensionAggregator returns Answer objects with findings
                for (const answer of answerBundle.extensionPoints) {
                    if (answer.items && answer.items.length > 0) {
                        for (const item of answer.items) {
                            architecturalReasoningSection.push(`- **${this.cleanDomainName(item.targetId)}** (Confidence: ${item.score.toFixed(2)})`);
                            const reasons = item.explanation.split('\n').filter(Boolean);
                            for (const reason of reasons) {
                                architecturalReasoningSection.push(`  - ${reason}`);
                            }
                        }
                    } else {
                        architecturalReasoningSection.push('*No significant extension points found.*');
                    }
                }
            } else {
                architecturalReasoningSection.push('### Q4 Extension Points\n*No extension points answered.*');
            }
        } else {
            architecturalReasoningSection.push('*Reasoning Pipeline was not executed or results unavailable.*');
        }

        // ── Section 8: Architecture State Report (v0.3.34.24) ───────────────────
        const anomaly = (report as any).anomalySummary as import('../../types/schema').AnomalySummary | undefined;
        const fsmAudit = (report as any).fsmAudit as import('../../types/schema').FSMAuditSummary | undefined;

        let architectureStateSection: string;
        if (anomaly) {
            const fsmStatus = (anomaly.missingTransitions === 0 && anomaly.invalidTransitions === 0) ? '✅ PASS' : '⚠️ ISSUES';
            const fsmAuditText = fsmAudit ? [
                '### FSM Audit (v0.3.34.25)',
                `| Type | Count |`,
                `|---|---|`,
                `| Missing Transitions | ${fsmAudit.missing} |`,
                `| Invalid Transitions | ${fsmAudit.invalid} |`,
                `| Uncharted Transitions | ${fsmAudit.uncharted} |`,
                '',
                fsmAudit.violations.length > 0 ? `Top violations → [View in Workspace](command:synapse.openFsmAudit)` : '*No violations detected.*',
                ''
            ].join('\n') : '';

            architectureStateSection = [
                '## 8. Architecture State Report',
                '',
                '### FSM Completeness',
                `| Metric | Count |`,
                `|---|---|`,
                `| Missing Transitions | ${anomaly.missingTransitions} |`,
                `| Invalid Transitions | ${anomaly.invalidTransitions} |`,
                `| **State Completeness** | **${fsmStatus}** |`,
                '',
                fsmAuditText,
                '### HealthState',
                `| State | Count | Severity |`,
                `|---|---|---|`,
                `| UNCLUSTERED  | ${anomaly.unclustered}  | Soft Bug |`,
                `| UNCLASSIFIED | ${anomaly.unclassified} | Soft Anomaly (Role ontology gap) |`,
                `| CORRUPTED    | ${anomaly.corrupted}    | Hard Bug |`,
                '',
                '### ViewState',
                `| State | Count |`,
                `|---|---|`,
                `| OUT_OF_SCOPE | ${anomaly.outOfScope} |`,
                '',
                '### ReferenceState',
                `| State | Count |`,
                `|---|---|`,
                `| GHOST | ${anomaly.ghost} |`,
            ].join('\n');
        } else {
            architectureStateSection = '## 8. Architecture State Report\n\n*AnomalyCollector not available.*';
        }

        // ── Section 9: Failure Propagation (v0.3.34.26) ───────────────────
        const propagation = (report as any).failurePropagation as import('../../types/schema').FailurePropagationReport | undefined;
        let failurePropagationSection: string;
        if (propagation) {
            const totalImpact = propagation.totalDirect + propagation.totalIndirect + propagation.totalCascade;
            const ratio = propagation.totalNodes > 0 ? (totalImpact / propagation.totalNodes) : 0;
            
            let blastRadius = 'SAFE';
            if (totalImpact > 0) {
                if (ratio >= 0.10) blastRadius = 'HIGH';
                else if (ratio >= 0.02) blastRadius = 'MEDIUM';
                else blastRadius = 'LOW';
            }

            failurePropagationSection = [
                '## 9. Failure Propagation Report',
                '',
                `| Impact Depth | Count |`,
                `|---|---|`,
                `| Direct Impact | ${propagation.totalDirect} |`,
                `| Indirect Impact | ${propagation.totalIndirect} |`,
                `| Cascade Impact | ${propagation.totalCascade} |`,
                '',
                `**Blast Radius Score:** ${blastRadius} (${(ratio * 100).toFixed(2)}%)`,
                '',
                propagation.impacts.length > 0 ? `> Top impacts → [View Failure Graph](command:synapse.openFailurePropagation)` : '*No failure propagation detected.*',
                ''
            ].join('\n');
        } else {
            failurePropagationSection = '## 9. Failure Propagation Report\n\n*FailurePropagator not available.*';
        }

        return [
            `# 🔬 SYNAPSE Architecture Scan Report (${evId})`,
            `Generated: ${report.generatedAt || new Date().toISOString()}`,
            '',
            '## 0. Analysis Subject (Layer -3)',
            `- **Subject**: ${this.cleanDomainName(fp.subjectName)}`,
            `- **Files**: ${fp.filesCount}`,
            `- **Internal Edges**: ${fp.internalEdges}`,
            `- **Boundary Edges**: ${fp.boundaryEdges}`,
            '',
            '### Subject Fingerprint (Top Internal Domains)',
            domainsText,
            '',
            verdictSection,
            '',
            surgerySection.join('\n'),
            '',
            evidenceLayerSection,
            '',
            systemAssemblySection.join('\n'),
            '',
            assemblyAuditSection.join('\n'),
            '',
            docEvidenceSection.join('\n'),
            '',
            architecturalReasoningSection.join('\n'),
            '',
            architectureStateSection,
            '',
            failurePropagationSection,
            '',
            rawMetricsSection
        ].join('\n');
    }

    private static buildHtml(report: any, evId: string, rootPath: string): string {
        const fp = report.subjectFingerprint;
        const verdict = report.establishmentGate?.stable ? 'PASS' : 'HOLD';
        const confidenceScore = (1 - (report.falsePositiveProbability || 0.125)) * 100;
        
        const htmlBoundaryRatio = fp.internalEdges > 0 ? (fp.boundaryEdges / fp.internalEdges).toFixed(1) : (fp.boundaryEdges === 0 ? '0.0' : 'N/A');
        const entropyScore = report.ifIgnoredImpact?.architectureEntropy !== 'N/A' ? report.ifIgnoredImpact.architectureEntropy : 'N/A';
        const entropyLevel = entropyScore !== 'N/A' ? (entropyScore > 75 ? 'HIGH' : entropyScore > 50 ? 'MEDIUM' : 'LOW') : 'UNKNOWN';

        const expectedEntropy = (report.estimatedCost?.edgesAffected === 0 && entropyScore !== 'N/A') ? entropyScore : 'N/A';
        const expectedBoundary = (report.estimatedCost?.edgesAffected === 0) ? fp.boundaryEdges : 'N/A';
        const ghostCount = fp.boundaryTargets?.find((t:any) => t.target.includes('ghost'))?.count || 0;

        let ghostBreakdownHtml = '';
        if (report.ghostBreakdown && report.ghostBreakdown.length > 0) {
            const unknownEntry = report.ghostBreakdown.find((b: any) => b.name === 'UNKNOWN_REFERENCE');
            const unknownCount = unknownEntry ? unknownEntry.count : 0;
            const unknownRatio = unknownEntry ? unknownEntry.ratio : 0;
            
            let assessmentStr = 'Scanner quality is EXCELLENT.';
            if (unknownRatio > 10) assessmentStr = 'Scanner quality is POOR. Needs rule refinement.';
            else if (unknownRatio > 5) assessmentStr = 'Scanner quality is FAIR.';
            else if (unknownRatio > 0) assessmentStr = 'Scanner quality is GOOD.';

            ghostBreakdownHtml = '<div class="expected-box"><h4>Ghost Health Assessment</h4>' +
                `<p><strong>${assessmentStr}</strong><br/>Unknown ghost ratio = ${unknownRatio.toFixed(1)}%</p></div>` +
                '<ul>' + report.ghostBreakdown
                .map((b: any) => `<li><strong>${this.cleanDomainName(b.name)}</strong>: ${b.count} (${b.ratio}%)</li>`)
                .join('\n') + '</ul>';
        } else {
            ghostBreakdownHtml = '<p>N/A</p>';
        }

        let couplingBreakdownHtml = '';
        if (report.couplingBreakdown && report.couplingBreakdown.length > 0) {
            couplingBreakdownHtml = '<ul>' + report.couplingBreakdown
                .slice(0, 5)
                .map((b: any) => `<li><strong>${this.cleanDomainName(b.name)}</strong>: ${b.count} (${b.ratio}%)</li>`)
                .join('') + '</ul>';
        } else {
            couplingBreakdownHtml = '<p>N/A</p>';
        }

        const domainsHtml = (fp.topInternalDomains || []).map((d: string) => `<li>${this.cleanDomainName(d)}</li>`).join('') || '<li>N/A</li>';
        const targetsHtml = (fp.boundaryTargets || []).map((t: any) => `<li><strong>${this.cleanDomainName(t.target)}</strong> (${t.count} edges)</li>`).join('') || '<li>No boundary targets found</li>';

        let ghostEvidenceText = '';
        if (report.ghostEvidence && report.ghostEvidence.length > 0) {
            ghostEvidenceText = '<details><summary><b>Show Ghost Evidence (Top 50)</b></summary>\n<ul>\n' + report.ghostEvidence
                .map((e: any) => `<li><a href="vscode://file/${path.isAbsolute(e.source) ? path.relative(rootPath, e.source) : e.source}">${this.cleanDomainName(e.source)}</a> -> ${this.cleanDomainName(e.target)} (Count: ${e.evidenceCount})</li>`)
                .join('\n') + '\n</ul>\n</details>';
        }

        let boundaryEvidenceText = '';
        if (report.boundaryEvidence && report.boundaryEvidence.length > 0) {
            boundaryEvidenceText = '<details><summary><b>Show Boundary Evidence (Top 50)</b></summary>\n<ul>\n' + report.boundaryEvidence
                .map((e: any) => `<li><a href="vscode://file/${path.isAbsolute(e.source) ? path.relative(rootPath, e.source) : e.source}">${this.cleanDomainName(e.source)}</a> -> ${this.cleanDomainName(e.target)} (Count: ${e.evidenceCount})</li>`)
                .join('\n') + '\n</ul>\n</details>';
        }

        let impactFilesHtml = '';
        let topImpactFilesHtmlArray: any[] = (report.topImpactFiles || []).slice(0, 10);

        const archFindingsHtml = report.snapshot?.metadata?.architecturalFindings || [];
        const findingMapHtml = new Map<string, ArchitecturalFinding>();
        for (const f of archFindingsHtml) findingMapHtml.set(f.nodeId, f);

        if (topImpactFilesHtmlArray.length > 0) {
            impactFilesHtml = topImpactFilesHtmlArray.map((f: any) => {
                const absPath = path.isAbsolute(f.filePath) ? path.relative(rootPath, f.filePath) : f.filePath;
                
                const finding = findingMapHtml.get(f.filePath);
                // [v0.3.34.20] architecturalRole 우선 사용: Auditor 판정 결과 > NodeRole > 기본값
                const roleText = finding ? finding.role : (f.architecturalRole || f.role || 'Impact File');
                
                let evidenceHtml = '';
                if (finding && finding.evidence) {
                    evidenceHtml = finding.evidence.map((ev: any) => `<li><strong>${ev.type}</strong>: ${ev.value}</li>`).join('');
                } else {
                    evidenceHtml = `<li><strong>Boundary Crossing</strong>: ${f.externalEdges || 0}</li>
                                    <li><strong>Fan-Out</strong>: ${f.fanOut || 0}</li>
                                    <li><strong>Blast Radius</strong>: ${f.reachability ? f.reachability + ' Clusters' : 'N/A (No reachable cluster data)'}</li>`;
                }

                let targetsHtml = '';
                if (f.targets && f.targets.length > 0) {
                    targetsHtml = '<ul>' + f.targets.map((t: any) => `<li>${this.cleanDomainName(t.target)} (${t.count} edges)</li>`).join('') + '</ul>';
                }
                
                let assessmentHtml = '';
                if (finding) {
                    assessmentHtml = `
                    <div style="margin-top: 10px;">
                        <p><strong>Architectural Assessment:</strong> <span style="color:#555;">${finding.findingType}</span></p>
                        <div style="background-color: #f8d7da; padding: 10px; border-left: 4px solid #dc3545; margin-bottom: 10px;">
                            ${FindingAssessmentTemplates[finding.findingType] || 'No specific assessment.'}
                        </div>
                        <p><strong>Risk Level:</strong> <span style="font-weight:bold; color:${finding.risk === RiskLevel.CRITICAL ? 'red' : 'darkorange'}">${finding.risk}</span></p>
                        <p><strong>Recommended Action:</strong></p>
                        <div style="background-color: #d4edda; padding: 10px; border-left: 4px solid #28a745;">
                            ${FindingRecommendationTemplates[finding.findingType] || 'No action specified.'}
                        </div>
                    </div>`;
                }

                return `
                <div style="border:1px solid #ccc; margin-bottom:10px; padding:10px;">
                    <h4><a href="vscode://file/${absPath}">${this.cleanDomainName(f.filePath)}</a></h4>
                    <p><strong>Role</strong>: ${roleText}</p>
                    <p><strong>Evidence (Observed Behavior)</strong></p>
                    <ul>
                        ${evidenceHtml}
                    </ul>
                    ${assessmentHtml}
                    ${targetsHtml ? `<p><strong>Top External Targets</strong></p>${targetsHtml}` : ''}
                </div>`;
            }).join('');
        } else {
            impactFilesHtml = '<p><em>No specific impact files identified.</em></p>';
        }


        let systemAssemblySection = `<h2>4. System Assembly Points (Healthy Hubs)</h2>\n<ul>\n`;
        if (report.systemAssemblyPoints && report.systemAssemblyPoints.length > 0) {
            for (let i = 0; i < report.systemAssemblyPoints.length; i++) {
                const file = report.systemAssemblyPoints[i];
                const absFile = path.isAbsolute(file.filePath) ? file.filePath : path.join(rootPath, file.filePath);
                // [v0.3.34.20] architecturalRole 사용: Auditor 판정 결과
                systemAssemblySection += `<li><a href="vscode://file/${absFile}">${this.cleanDomainName(file.filePath)}</a> (Role: ${file.architecturalRole || file.role || 'Unknown'})</li>\n`;
            }
            systemAssemblySection += `</ul>`;
        } else {
            systemAssemblySection = `<h2>4. System Assembly Points (Healthy Hubs)</h2>\n<p><em>No system assembly points identified.</em></p>`;
        }

        let assemblyAuditSection = `<h3>4.1 ASSEMBLY_POINT Audit</h3>\n<ul>\n`;
        if (report.assemblyAudit && report.assemblyAudit.length > 0) {
            for (const audit of report.assemblyAudit) {
                const mark = audit.accepted ? '✓' : '✗';
                assemblyAuditSection += `<li style="margin-bottom: 8px;"><strong>${mark} ${this.cleanDomainName(audit.filePath)}</strong><br/>`;
                if (audit.accepted) {
                    assemblyAuditSection += `<span style="font-size: 0.9em; color: #555;">FanOut: ${audit.fanOut} | Percentile: ${audit.fanOutPercentile.toFixed(1)} | BoundaryRatio: ${audit.boundaryRatio.toFixed(2)}</span>`;
                } else {
                    assemblyAuditSection += `<span style="font-size: 0.9em; color: #d9534f;">Rejected: ${audit.reasons.join(', ')}</span><br/>`;
                    assemblyAuditSection += `<span style="font-size: 0.85em; color: #777;">(FanOut: ${audit.fanOut}, Percentile: ${audit.fanOutPercentile.toFixed(1)}, BoundaryRatio: ${audit.boundaryRatio.toFixed(2)})</span>`;
                }
                assemblyAuditSection += `</li>\n`;
            }
            assemblyAuditSection += `</ul>`;
        } else {
            assemblyAuditSection += `</ul><p><em>No candidates found.</em></p>`;
        }

        let docEvidenceSection = `<h2>5. Knowledge Connectivity</h2>\n`;
        if (report.docEvidence && report.docEvidence.length > 0) {
            docEvidenceSection += `<details><summary><b>Show Knowledge Sources</b></summary>\n<ul>\n` + report.docEvidence
                .map((e: any) => `<li><a href="vscode://file/${path.isAbsolute(e.source) ? path.relative(rootPath, e.source) : e.source}">${this.cleanDomainName(e.source)}</a> -> ${this.cleanDomainName(e.target)}</li>`)
                .join('\n') + '\n</ul>\n</details>';
        } else {
            docEvidenceSection += `<p><em>No knowledge sources linked.</em></p>`;
        }

        let rawMetricsSection = `
  <h2>7. Raw Metrics</h2>
  <h3>7.1 AEL Metrics</h3>
  <ul>
      <li><strong>Architecture Entropy</strong>: ${entropyScore !== 'N/A' ? entropyScore + ' / 100' : 'N/A'} (Risk Level: <strong>${entropyLevel}</strong>)</li>
      <li><strong>False Positive Probability</strong>: ${report.falsePositiveProbability !== undefined ? (report.falsePositiveProbability * 100).toFixed(1) + '%' : 'UNKNOWN'}</li>
  </ul>
  
  <h3>7.2 Source Breakdown (ASR 3.0)</h3>
  <h4>Ghost Source Top N</h4>
  ${ghostBreakdownHtml}
  <h4>Coupling Source Top N</h4>
  ${couplingBreakdownHtml}

  <h3>7.3 Cost Projection</h3>
  <ul>
      <li><strong>Estimated Engineers</strong>: ${report.estimatedCost?.engineers ?? 0}</li>
      <li><strong>Estimated Days</strong>: ${report.estimatedCost?.days ?? 0}</li>
      <li><strong>Files Affected</strong>: ${report.estimatedCost?.filesAffected ?? 0}</li>
      <li><strong>Edges Affected</strong>: ${report.estimatedCost?.edgesAffected ?? 0}</li>
  </ul>
`;

        console.log(`Building HTML report with version: ${report.buildVersion}`);
        return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SYNAPSE Architecture Scan Report - ${evId}</title>
  <style>
    body { font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 900px; margin: 0 auto; }
    h1, h2, h3, h4 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 1.5em; }
    .verdict-box { padding: 15px; background: #f9f9f9; border-left: 5px solid ${verdict === 'PASS' ? '#4caf50' : '#f44336'}; margin: 20px 0; }
    .expected-box { padding: 15px; background: #e8f5e9; border-left: 5px solid #4caf50; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Architecture Surgery Report: ${report.subjectFingerprint?.subjectName || 'Unknown Domain'}</h1>
  <p><em>Generated by SYNAPSE AEL Validation Engine (v${report.buildVersion || '0.3.34'})</em></p>
  <p><em>Pipeline: Metric → Auditor → Renderer</em></p>
  <p><em>Date: ${report.generatedAt || new Date().toISOString()}</em></p>
  <p><em>ID: ${evId}</em></p>
  <hr/>
  
  <h2>0. Analysis Subject (Layer -3)</h2>
  <ul>
      <li><strong>Subject</strong>: ${this.cleanDomainName(fp.subjectName)}</li>
      <li><strong>Files</strong>: ${fp.filesCount}</li>
      <li><strong>Internal Edges</strong>: ${fp.internalEdges}</li>
      <li><strong>Boundary Edges</strong>: ${fp.boundaryEdges}</li>
  </ul>
  
  <h3>Subject Fingerprint (Top Internal Domains)</h3>
  <ul>${domainsHtml}</ul>

  <h2>1. Executive Summary</h2>
  <div class="verdict-box">
      <h3>Scan Context: Sub-cluster Analysis</h3>
      <p><strong>Observation:</strong> External Dependency Ratio = ${htmlBoundaryRatio}x</p>
      <p><strong>Assessment:</strong> Selected cluster depends heavily on modules outside the scan boundary.</p>
      <p><strong>Implication:</strong> This does not imply whole-project instability.</p>
      
      <p style="margin-top:15px;"><strong>Audit Confidence (Scanner Reliability):</strong> ${confidenceScore.toFixed(1)}%</p>
      <p><em>Note: Represents the structural integrity of the parsed GraphSnapshot. Evidence counts below are raw observations.</em></p>
      <h3>Why High External Coupling?</h3>
      <ul>
          <li><strong>Boundary Edge Count</strong>: ${fp.boundaryEdges} / ${fp.internalEdges} (Internal)</li>
          <li><strong>Entropy</strong>: ${entropyScore}</li>
          <li><strong>Ghost Dependencies</strong>: ${ghostCount}</li>
      </ul>
  </div>

  <h2>2. Impact Files</h2>
  ${impactFilesHtml}

  <h2>3. Evidence Layer</h2>
  <h3>3.1 Ghost Evidence</h3>
  ${ghostEvidenceText || '<p><em>No ghost evidence found.</em></p>'}
  <h3>3.2 Boundary Evidence</h3>
  ${boundaryEvidenceText || '<p><em>No boundary evidence found.</em></p>'}

  ${systemAssemblySection}

  ${assemblyAuditSection}
  ${docEvidenceSection}

  <h2>6. Expected After Surgery</h2>
  <div class="expected-box">
      <p><strong>🟢 STRENGTHENED</strong></p>
      <ul>
          <li><strong>Entropy</strong>: ${entropyScore} -> ${expectedEntropy}</li>
          <li><strong>Boundary Edges</strong>: ${fp.boundaryEdges} -> ${expectedBoundary}</li>
      </ul>
  </div>

  ${rawMetricsSection}

</body>
</html>`;
    }
}
