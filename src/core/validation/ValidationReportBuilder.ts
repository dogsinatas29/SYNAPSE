import * as fs from 'fs';
import * as path from 'path';
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
    
    const edgeReduction = Math.round((top.external / (top.external + top.internal)) * 100);
    const purityIncrease = (0.15).toFixed(2);
    const affectedNodes = Math.round((top.external + top.internal) * 0.65);
    
    return [
        `Affected Nodes: ~${affectedNodes}`,
        `Affected Communities: 2-3 (cascade)`,
        `Predicted Edge Reduction: ${edgeReduction}%`,
        `Predicted Purity Increase: +${purityIncrease}`,
        `Blast Radius: Medium (affects subsystem fan-out paths)`
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

function estimateCost(report: ValidationReport): { engineers: number; days: number; filesAffected: number; edgesAffected: number } {
    const top = report.infrastructureSplitCandidates?.[0];
    if (!top) return { engineers: 1, days: 1, filesAffected: 5, edgesAffected: 20 };
    
    const totalEdges = top.external + top.internal;
    const filesAffected = Math.max(5, Math.round(Math.sqrt(totalEdges / 100)));
    const engineers = Math.min(3, Math.ceil(filesAffected / 8));
    const days = Math.max(1, Math.ceil(filesAffected / 12));
    
    return {
        engineers,
        days,
        filesAffected,
        edgesAffected: totalEdges
    };
}

function projectIfIgnored(report: ValidationReport): { architectureEntropy: number; boundaryFragmentation: boolean; estimatedMonthsToIssue: number } {
    const top = report.infrastructureSplitCandidates?.[0];
    const baseEntropy = 0.68;
    
    let entropy = baseEntropy;
    if (top) {
        const ratio = top.external / (top.external + top.internal);
        entropy += ratio * 0.12;
    }
    
    const fragmented = top ? true : false;
    const months = Math.max(1, Math.round(4 - (report.runCount || 1)));
    
    return {
        architectureEntropy: Math.min(1.0, entropy),
        boundaryFragmentation: fragmented,
        estimatedMonthsToIssue: months
    };
}

export class ValidationReportBuilder {
    static generateReports(ctx: ValidationContext, evId: string): { mdPath: string; htmlPath: string } {
        const fingerprint = extractSubjectFingerprint(ctx.snapshot);
        const report = { ...ctx.metrics, subjectFingerprint: fingerprint } as any;

        console.log("[REPORT_INPUT]", {
            subjectName: fingerprint.subjectName,
            files: fingerprint.filesCount,
            totalBoundaryEdges: fingerprint.boundaryEdges
        });

        const mdContent = this.buildMarkdown(report, evId);
        const root = ctx.workspaceRoot || process.cwd();
        const mdPath = path.join(root, 'report/surgery', `ASR_${evId}.md`);
        
        fs.mkdirSync(path.dirname(mdPath), { recursive: true });
        fs.writeFileSync(mdPath, mdContent, 'utf-8');

        const htmlContent = this.buildHtml(evId);
        const htmlPath = path.join(root, 'report/surgery', `ASR_${evId}.html`);
        fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

        return { mdPath, htmlPath };
    }

    private static buildMarkdown(report: any, evId: string): string {
        const fp = report.subjectFingerprint;
        const verdict = report.establishmentGate?.stable ? 'PASS' : 'HOLD';

        const domainsText = (fp.topInternalDomains || []).map((d: string) => `- ${d}`).join('\n') || '- N/A';
        const targetsText = (fp.boundaryTargets || []).map((t: any) => `- **${t.target}** (${t.count} edges)`).join('\n') || '- No boundary targets found';

        return [
            `# 🔬 SYNAPSE Architecture Diagnosis Report (${evId})`,
            `Generated: ${report.generatedAt || 'n/a'}`,
            `Verdict: **${verdict === 'PASS' ? '✅ STABLE' : '🔴 UNSTABLE'}**`,
            '',
            '## 0. Analysis Subject (Layer -3)',
            `- **Subject**: ${fp.subjectName}`,
            `- **Files**: ${fp.filesCount}`,
            `- **Internal Edges**: ${fp.internalEdges}`,
            `- **Boundary Edges**: ${fp.boundaryEdges}`,
            '',
            '### Subject Fingerprint (Top Internal Domains)',
            domainsText,
            '',
            '## 1. Observability: Boundary Targets (Layer -2)',
            targetsText,
            '',
            '## 2. Ecology & Surgery (Pending Phase B)',
            '*(AEL 9-law metrics and surgery prescriptions will be injected here)*'
        ].join('\n');
    }

    private static buildHtml(evId: string): string {
        return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SYNAPSE Architecture Surgery Report - ${evId}</title>
</head>
<body>
  <h1>🔧 Architecture Surgery Report (${evId})</h1>
  <p>See <a href="./ASR_${evId}.md">ASR_${evId}.md</a> for details.</p>
</body>
</html>`;
    }
}
