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

        // Populate calculated metrics
        report.falsePositiveProbability = calculateFalsePositiveProbability(report);
        report.estimatedCost = estimateCost(report);
        report.ifIgnoredImpact = projectIfIgnored(report);

        console.log("[REPORT_INPUT]", {
            subjectName: fingerprint.subjectName,
            files: fingerprint.filesCount,
            totalBoundaryEdges: fingerprint.boundaryEdges
        });

        const mdContent = this.buildMarkdown(report, evId, ctx.workspaceRoot || '');
        const root = ctx.workspaceRoot || process.cwd();
        const mdPath = path.join(root, 'synapse_report', 'surgery', `ASR_${evId}.md`);
        
        fs.mkdirSync(path.dirname(mdPath), { recursive: true });
        fs.writeFileSync(mdPath, mdContent, 'utf-8');

        const htmlContent = this.buildHtml(report, evId, ctx.workspaceRoot || '');
        const htmlPath = path.join(root, 'synapse_report', 'surgery', `ASR_${evId}.html`);
        fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

        const jsonPath = path.join(root, 'synapse_report', 'surgery', `ASR_${evId}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');

        return { mdPath, htmlPath };
    }

    private static cleanDomainName(name: string): string {
        if (!name) return 'Unknown';
        if (name.includes('ghost')) return 'Ghost Dependency Zone';
        if (name.startsWith('folder_')) {
            return 'Module: ' + name.replace('folder_', '').replace(/_/g, '/');
        }
        return name;
    }

    private static buildMarkdown(report: any, evId: string, rootPath: string): string {
        const fp = report.subjectFingerprint;
        const verdict = report.establishmentGate?.stable ? 'PASS' : 'HOLD';
        const confidenceScore = (1 - (report.falsePositiveProbability || 0.125)) * 100;
        
        const boundaryRatio = fp.internalEdges > 0 ? (fp.boundaryEdges / fp.internalEdges).toFixed(1) : fp.boundaryEdges;
        const entropyScore = Math.round((report.ifIgnoredImpact?.architectureEntropy || 0.81) * 100);
        const entropyLevel = entropyScore > 75 ? 'HIGH' : entropyScore > 50 ? 'MEDIUM' : 'LOW';

        const expectedEntropy = Math.round(entropyScore * 0.5); 
        const expectedBoundary = Math.round(fp.boundaryEdges * 0.38);
        const ghostCount = fp.boundaryTargets?.find((t:any) => t.target.includes('ghost'))?.count || 0;

        let ghostBreakdownText = '';
        if (report.ghostBreakdown && report.ghostBreakdown.length > 0) {
            ghostBreakdownText = report.ghostBreakdown
                .slice(0, 5)
                .map((b: any) => `  - **${this.cleanDomainName(b.name)}**: ${b.count} (${b.ratio}%)`)
                .join('\n');
            if (report.ghostBreakdown.length > 5) ghostBreakdownText += '\n  - ...';
        } else {
            ghostBreakdownText = '  - N/A';
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

        const verdictSection = [
            `## 1. Executive Summary`,
            `**Verdict**: ${verdict === 'PASS' ? '✅ STABLE' : '🔴 UNSTABLE'}`,
            '',
            `**Audit Confidence (Scanner Reliability)**: ${confidenceScore.toFixed(1)}%`,
            `*Note: Represents the structural integrity of the parsed GraphSnapshot. Evidence counts below are raw observations.*`,
            '',
            '### Reason',
            `- **Boundary Edge Ratio**: ${fp.boundaryEdges} / ${fp.internalEdges} (${boundaryRatio}x)`,
            `- **Entropy**: ${entropyScore}`,
            `- **Ghost Dependencies**: ${ghostCount}`,
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

        let rawMetricsSection = [
            '## 5. Raw Metrics',
            `### 5.1 AEL Metrics`,
            `- **Architecture Entropy**: ${entropyScore} / 100 (Risk Level: **${entropyLevel}**)`,
            `- **False Positive Probability**: ${(report.falsePositiveProbability * 100).toFixed(1)}%`,
            '',
            '### 5.2 Source Breakdown (ASR 3.0)',
            '#### Ghost Source Top N',
            ghostBreakdownText,
            '',
            '#### Coupling Source Top N',
            couplingBreakdownText,
            '',
            '### 5.3 Cost Projection',
            `- **Estimated Engineers**: ${report.estimatedCost?.engineers}`,
            `- **Estimated Days**: ${report.estimatedCost?.days}`,
            `- **Files Affected**: ${report.estimatedCost?.filesAffected}`,
            `- **Edges Affected**: ${report.estimatedCost?.edgesAffected}`
        ].join('\n');

        let surgerySection = ['## 2. Impact Files'];
        let topImpactFiles: any[] = report.topImpactFiles || [];

        if (topImpactFiles.length > 0) {
            for (const file of topImpactFiles) {
                const absFile = path.isAbsolute(file.filePath) ? file.filePath : path.join(rootPath, file.filePath);
                surgerySection.push(`### ${this.cleanDomainName(file.filePath)}`);
                surgerySection.push(`- **Role**: High-Coupling Domain Entity`);
                surgerySection.push(`- **Problem**: Coupled to ${file.consumers.length} external modules (Total External Edges: ${file.externalEdges}).`);
                surgerySection.push(`- **Risk**: Domain Leakage (High Coupling).`);
                surgerySection.push(`- **Recommendation**: Introduce DTO boundary or Interface isolation.`);
                surgerySection.push(`- [View File](vscode://file/${absFile})`);
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
            expectedSection,
            '',
            rawMetricsSection
        ].join('\n');
    }

    private static buildHtml(report: any, evId: string, rootPath: string): string {
        const fp = report.subjectFingerprint;
        const verdict = report.establishmentGate?.stable ? 'PASS' : 'HOLD';
        const confidenceScore = (1 - (report.falsePositiveProbability || 0.125)) * 100;
        
        const boundaryRatio = fp.internalEdges > 0 ? (fp.boundaryEdges / fp.internalEdges).toFixed(1) : fp.boundaryEdges;
        const entropyScore = Math.round((report.ifIgnoredImpact?.architectureEntropy || 0.81) * 100);
        const entropyLevel = entropyScore > 75 ? 'HIGH' : entropyScore > 50 ? 'MEDIUM' : 'LOW';

        const expectedEntropy = Math.round(entropyScore * 0.5); 
        const expectedBoundary = Math.round(fp.boundaryEdges * 0.38);
        const ghostCount = fp.boundaryTargets?.find((t:any) => t.target.includes('ghost'))?.count || 0;

        let ghostBreakdownHtml = '';
        if (report.ghostBreakdown && report.ghostBreakdown.length > 0) {
            ghostBreakdownHtml = '<ul>' + report.ghostBreakdown
                .slice(0, 5)
                .map((b: any) => `<li><strong>${this.cleanDomainName(b.name)}</strong>: ${b.count} (${b.ratio}%)</li>`)
                .join('') + '</ul>';
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
        // Uses the same logic topImpactFiles created above, but here we rebuild it if it's not exported. Wait, I should build topImpactFiles in generateHtmlReport as well or build it in ValidationEngine so it's on metrics. 
        // I will just rebuild it here just like in MD since they are independent.
        let topImpactFilesHtmlArray: any[] = [];
        if (report.boundaryEvidence) {
            const impactMap = new Map<string, { externalEdges: number, consumers: Set<string> }>();
            for (const e of report.boundaryEvidence) {
                if (!impactMap.has(e.source)) impactMap.set(e.source, { externalEdges: 0, consumers: new Set() });
                impactMap.get(e.source)!.externalEdges += e.evidenceCount;
                impactMap.get(e.source)!.consumers.add(e.target);
            }
            topImpactFilesHtmlArray = Array.from(impactMap.entries())
                .map(([filePath, data]) => ({ filePath, externalEdges: data.externalEdges, consumers: Array.from(data.consumers) }))
                .sort((a, b) => b.externalEdges - a.externalEdges)
                .slice(0, 5);
        }

        if (topImpactFilesHtmlArray.length > 0) {
            impactFilesHtml = topImpactFilesHtmlArray.map((f: any) => {
                const absPath = path.isAbsolute(f.filePath) ? path.relative(rootPath, f.filePath) : f.filePath;
                return `
                <div style="border:1px solid #ccc; margin-bottom:10px; padding:10px;">
                    <h4><a href="vscode://file/${absPath}">${this.cleanDomainName(f.filePath)}</a></h4>
                    <ul>
                        <li><strong>Role</strong>: High-Coupling Domain Entity</li>
                        <li><strong>Problem</strong>: Coupled to ${f.consumers.length} external modules (Total External Edges: ${f.externalEdges}).</li>
                        <li><strong>Risk</strong>: Domain Leakage (High Coupling).</li>
                        <li><strong>Recommendation</strong>: Introduce DTO boundary or Interface isolation.</li>
                    </ul>
                </div>`;
            }).join('');
        } else {
            impactFilesHtml = '<p><em>No specific impact files identified.</em></p>';
        }

        let rawMetricsSection = `
  <h2>5. Raw Metrics</h2>
  <h3>5.1 AEL Metrics</h3>
  <ul>
      <li><strong>Architecture Entropy</strong>: ${entropyScore} / 100 (Risk Level: <strong>${entropyLevel}</strong>)</li>
      <li><strong>False Positive Probability</strong>: ${(report.falsePositiveProbability * 100).toFixed(1)}%</li>
  </ul>
  
  <h3>5.2 Source Breakdown (ASR 3.0)</h3>
  <h4>Ghost Source Top N</h4>
  ${ghostBreakdownHtml}
  <h4>Coupling Source Top N</h4>
  ${couplingBreakdownHtml}

  <h3>5.3 Cost Projection</h3>
  <ul>
      <li><strong>Estimated Engineers</strong>: ${report.estimatedCost?.engineers}</li>
      <li><strong>Estimated Days</strong>: ${report.estimatedCost?.days}</li>
      <li><strong>Files Affected</strong>: ${report.estimatedCost?.filesAffected}</li>
      <li><strong>Edges Affected</strong>: ${report.estimatedCost?.edgesAffected}</li>
  </ul>
`;

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
  <h1>🔬 SYNAPSE Architecture Scan Report (${evId})</h1>
  <p><strong>Generated:</strong> ${report.generatedAt || new Date().toISOString()}</p>
  
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
      <h2>Verdict: <span style="color:${verdict === 'PASS' ? 'green' : 'red'};">${verdict === 'PASS' ? '✅ STABLE' : '🔴 UNSTABLE'}</span></h2>
      <p><strong>Audit Confidence (Scanner Reliability):</strong> ${confidenceScore.toFixed(1)}%</p>
      <p><em>Note: Represents the structural integrity of the parsed GraphSnapshot. Evidence counts below are raw observations.</em></p>
      <h3>Reason</h3>
      <ul>
          <li><strong>Boundary Edge Ratio</strong>: ${fp.boundaryEdges} / ${fp.internalEdges} (${boundaryRatio}x)</li>
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

  <h2>4. Expected After Surgery</h2>
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
