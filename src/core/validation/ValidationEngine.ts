import { runBundle } from '../../cli/run_b5_bundle';
import { ArchitectureAuditor } from './ArchitectureAuditor';
import type { ASTVerificationResult } from '../../cli/ast_verification_engine';
import { 
    GraphSnapshot,
    ValidationContext,
    ValidationMetrics,
    ParsedRun,
    SpeciesStabilityRow,
    StabilityGateResult,
    SpeciesPresenceRow,
    SpeciesConfidenceRow,
    BoundaryPressure,
    BoundaryConfidenceHistogram,
    InfraTarget,
    ThresholdSweepRow,
    InfraMeshThresholdRecommendation,
    TopCommunitySpeciesRow,
    HistogramBin,
    SpeciesScoreConfidenceRow,
    BreakdownEntry
} from './ValidationContext';

const STABILITY_LABELS = [
    'Mixed Core',
    'Bridge Candidate',
    'Bridge Cluster',
    'Utility Candidate',
    'Utility Cluster',
    'Contract Core',
    'Infrastructure Mesh'
];

const CANDIDATE_GATE = {
    bridgeAuditMinScore: 0.7,
    utilityAuditMinScore: 0.75,
    contractAuditMinScore: 0.75
};

const PRESENCE_MATRIX_LABELS = [
    'Infrastructure Mesh',
    'Mixed Core',
    'Subsystem Core',
    'Contract Core',
    'Execution Core',
    'Bridge Cluster',
    'Bridge Candidate',
    'Utility Cluster',
    'Utility Candidate'
];

const BOUNDARY_BAND = 0.05;
const INFRA_MESH_SWEEP_THRESHOLDS = [0.8, 0.82, 0.84, 0.86];
const INFRA_MESH_BASELINE_THRESHOLD = 0.84;

function formatLogArgs(args: unknown[]): string {
    return args
        .map((arg) => {
            if (typeof arg === 'string') return arg;
            try {
                return JSON.stringify(arg);
            } catch {
                return String(arg);
            }
        })
        .join(' ');
}

function parseIntSafe(raw: string | undefined): number {
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

function parseFloatSafe(raw: string | undefined): number {
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

class ValidationRunParser {
    private speciesSummary = new Map<string, number>();
    private infraTargets: InfraTarget[] = [];
    private topCommunityRows: TopCommunitySpeciesRow[] = [];
    private inSpeciesSummary = false;
    private inInfraTargets = false;
    private currentCommunityId = '';

    consume(line: string): void {
        const communityHeader = line.match(/^===\s+([^\s].*?)\s+\(Size:\s*\d+\)\s*===/);
        if (communityHeader) {
            this.currentCommunityId = communityHeader[1];
            return;
        }

        if (line.startsWith('[4] Species Summary')) {
            this.inSpeciesSummary = true;
            this.inInfraTargets = false;
            return;
        }

        if (line.startsWith('[5] B.5.6 Infrastructure Mesh Split Targets')) {
            this.inSpeciesSummary = false;
            this.inInfraTargets = true;
            return;
        }

        if (line.startsWith('[6]') || line.startsWith('=== SYNAPSE Bundle')) {
            this.inSpeciesSummary = false;
            this.inInfraTargets = false;
        }

        if (this.inSpeciesSummary) {
            const speciesRow = line.match(/^\s*-\s+(.+?):\s+(\d+)\s*$/);
            if (speciesRow) {
                this.speciesSummary.set(speciesRow[1], parseIntSafe(speciesRow[2]));
            }
        }

        if (this.inInfraTargets) {
            const targetRow = line.match(/^\s*-\s+(.+?):\s+splitPriority=([0-9.]+)\s+\(external=(\d+),\s+internal=(\d+)\)\s*$/);
            if (targetRow) {
                this.infraTargets.push({
                    id: targetRow[1],
                    splitPriority: parseFloatSafe(targetRow[2]),
                    external: parseIntSafe(targetRow[3]),
                    internal: parseIntSafe(targetRow[4])
                });
            }
        }

        if (!this.currentCommunityId) {
            return;
        }

        const speciesLine = line.match(/^\s+Species:\s+(.+)\s*$/);
        if (speciesLine) {
            this.topCommunityRows.push({
                communityId: this.currentCommunityId,
                species: speciesLine[1]
            });
            return;
        }

        const baseLine = line.match(/^\s+Species Base:\s+(.+)\s*$/);
        if (baseLine && this.topCommunityRows.length > 0) {
            this.topCommunityRows[this.topCommunityRows.length - 1].speciesBase = baseLine[1];
            return;
        }

        const scoreLine = line.match(/^\s+(Bridge Score|Utility Score|Contract Score):\s+([0-9.]+)\s*$/);
        if (scoreLine && this.topCommunityRows.length > 0) {
            const row = this.topCommunityRows[this.topCommunityRows.length - 1];
            const scoreValue = parseFloatSafe(scoreLine[2]);
            if (scoreLine[1] === 'Bridge Score') row.bridgeScore = scoreValue;
            if (scoreLine[1] === 'Utility Score') row.utilityScore = scoreValue;
            if (scoreLine[1] === 'Contract Score') row.contractScore = scoreValue;
        }
    }

    build(): ParsedRun {
        return {
            speciesSummary: this.speciesSummary,
            infraTargets: this.infraTargets,
            topCommunityRows: this.topCommunityRows
        };
    }
}

function runSingle(snapshot: Readonly<GraphSnapshot>, workspaceRoot: string): ParsedRun {
    const parser = new ValidationRunParser();
    const originalLog = console.log;
    try {
        console.log = (...args: unknown[]) => {
            parser.consume(formatLogArgs(args));
        };
        runBundle(snapshot, workspaceRoot);
    } finally {
        console.log = originalLog;
    }
    return parser.build();
}

function toStabilityRows(runs: ParsedRun[]): SpeciesStabilityRow[] {
    const labels = new Set<string>();
    for (const run of runs) {
        for (const label of run.speciesSummary.keys()) {
            labels.add(label);
        }
    }

    const rows: SpeciesStabilityRow[] = [];
    for (const label of labels) {
        const values = runs.map((run) => run.speciesSummary.get(label) || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((acc, v) => acc + v, 0) / Math.max(1, values.length);
        rows.push({ species: label, min, max, avg, values });
    }

    rows.sort((a, b) => b.avg - a.avg || a.species.localeCompare(b.species));
    return rows;
}

function volatility(row: SpeciesStabilityRow): number {
    if (row.avg <= 0) return row.max > 0 ? 1 : 0;
    return (row.max - row.min) / row.avg;
}

function evaluateStabilityGate(rows: SpeciesStabilityRow[]): StabilityGateResult {
    const byLabel = new Map(rows.map((r) => [r.species, r]));
    const failures: string[] = [];

    for (const label of STABILITY_LABELS) {
        const row = byLabel.get(label);
        if (!row) {
            failures.push(`${label}: missing`);
            continue;
        }

        const range = row.max - row.min;
        const rel = volatility(row);

        if (label === 'Infrastructure Mesh') {
            if (range > 1) {
                failures.push(`${label}: range=${range} (>1)`);
            }
            continue;
        }

        if (range > 6 || rel > 0.35) {
            failures.push(`${label}: range=${range}, rel=${rel.toFixed(2)}`);
        }
    }

    return {
        stable: failures.length === 0,
        rule: 'default: range<=6 and rel<=0.35; Infrastructure Mesh range<=1',
        failures
    };
}

function classifyPresenceStatus(hitCount: number, runCount: number): 'Stable' | 'Probable' | 'Unstable' {
    if (runCount <= 0) return 'Unstable';
    if (hitCount === runCount) return 'Stable';
    if (hitCount >= Math.max(1, runCount - 1)) return 'Probable';
    return 'Unstable';
}

function buildPresenceRows(runs: ParsedRun[], labels: string[]): SpeciesPresenceRow[] {
    const rows: SpeciesPresenceRow[] = [];
    const runCount = runs.length;
    for (const label of labels) {
        const runPresence = runs.map((run) => (run.speciesSummary.get(label) || 0) > 0);
        const hitCount = runPresence.filter(Boolean).length;
        rows.push({
            species: label,
            runPresence,
            hitCount,
            status: classifyPresenceStatus(hitCount, runCount)
        });
    }

    return rows;
}

function buildSpeciesConfidenceRows(presenceRows: SpeciesPresenceRow[]): SpeciesConfidenceRow[] {
    const rows = presenceRows.map((row) => ({
        species: row.species,
        confidence: row.runPresence.length > 0 ? row.hitCount / row.runPresence.length : 0
    }));
    rows.sort((a, b) => b.confidence - a.confidence || a.species.localeCompare(b.species));
    return rows;
}

function collectCandidateScores(runs: ParsedRun[]): { bridge: number[]; utility: number[]; contract: number[] } {
    const allRows = runs.flatMap((run) => run.topCommunityRows);
    return {
        bridge: allRows
            .filter((row) => row.species === 'Bridge Candidate' && row.bridgeScore !== undefined)
            .map((row) => row.bridgeScore as number),
        utility: allRows
            .filter((row) => row.species === 'Utility Candidate' && row.utilityScore !== undefined)
            .map((row) => row.utilityScore as number),
        contract: allRows
            .filter((row) => row.species === 'Contract Candidate' && row.contractScore !== undefined)
            .map((row) => row.contractScore as number)
    };
}

function buildHistogram(scores: number[]): HistogramBin[] {
    const bins: HistogramBin[] = [
        { range: '<0.60', count: 0 },
        { range: '0.60-0.70', count: 0 },
        { range: '0.70-0.80', count: 0 },
        { range: '0.80-0.90', count: 0 },
        { range: '>=0.90', count: 0 }
    ];

    for (const score of scores) {
        if (score < 0.6) {
            bins[0].count += 1;
        } else if (score < 0.7) {
            bins[1].count += 1;
        } else if (score < 0.8) {
            bins[2].count += 1;
        } else if (score < 0.9) {
            bins[3].count += 1;
        } else {
            bins[4].count += 1;
        }
    }

    return bins;
}

function buildBoundaryConfidenceHistogram(runs: ParsedRun[]): BoundaryConfidenceHistogram[] {
    const scores = collectCandidateScores(runs);
    return [
        {
            label: 'Bridge Candidate',
            bins: buildHistogram(scores.bridge),
            totalCount: scores.bridge.length
        },
        {
            label: 'Utility Candidate',
            bins: buildHistogram(scores.utility),
            totalCount: scores.utility.length
        },
        {
            label: 'Contract Candidate',
            bins: buildHistogram(scores.contract),
            totalCount: scores.contract.length
        }
    ];
}

function buildSpeciesScoreConfidenceRows(runs: ParsedRun[]): SpeciesScoreConfidenceRow[] {
    const grouped = new Map<string, number[]>();
    for (const row of runs.flatMap((run) => run.topCommunityRows)) {
        const species = row.species || '';
        if (!species) continue;
        const score = row.bridgeScore ?? row.utilityScore ?? row.contractScore;
        if (score === undefined) continue;
        const prev = grouped.get(species) || [];
        prev.push(score);
        grouped.set(species, prev);
    }

    const result: SpeciesScoreConfidenceRow[] = [];
    for (const [species, scores] of grouped.entries()) {
        if (scores.length === 0) continue;
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const avg = scores.reduce((acc, v) => acc + v, 0) / scores.length;
        result.push({ species, avg, min, max, count: scores.length });
    }

    result.sort((a, b) => b.avg - a.avg || b.count - a.count || a.species.localeCompare(b.species));
    return result;
}

function buildInfraMeshThresholdSweep(infraRows: InfraTarget[], thresholds: number[]): ThresholdSweepRow[] {
    return thresholds.map((threshold) => {
        const matches = infraRows.filter((row) => row.splitPriority >= threshold);
        return {
            threshold,
            count: matches.length,
            ids: matches.map((row) => row.id)
        };
    });
}

function buildInfraMeshThresholdRecommendation(
    sweepRows: ThresholdSweepRow[],
    baselineThreshold: number
): InfraMeshThresholdRecommendation {
    const baselineRow = sweepRows.find((row) => Math.abs(row.threshold - baselineThreshold) < 1e-9)
        || { threshold: baselineThreshold, count: 0, ids: [] };
    const sorted = sweepRows.slice().sort((a, b) => a.threshold - b.threshold);
    const baselineIdx = sorted.findIndex((row) => Math.abs(row.threshold - baselineThreshold) < 1e-9);
    const nextRow = baselineIdx >= 0 && baselineIdx + 1 < sorted.length
        ? sorted[baselineIdx + 1]
        : baselineRow;

    const maxCount = sweepRows.reduce((acc, row) => Math.max(acc, row.count), 0);
    if (maxCount === 0) {
        return {
            baselineThreshold,
            baselineCount: 0,
            baselineIds: [],
            nextThreshold: nextRow.threshold,
            nextCount: 0,
            rationale: 'No high-priority mesh residue after ghost-aware filtering; treat mesh as calibrated-out for this dataset and prioritize Bridge/Utility boundary tuning.'
        };
    }

    return {
        baselineThreshold,
        baselineCount: baselineRow.count,
        baselineIds: baselineRow.ids,
        nextThreshold: nextRow.threshold,
        nextCount: nextRow.count,
        rationale: '0.84 keeps last high-priority mesh residue while 0.86 tends to over-prune in Linux-scale runs.'
    };
}

function collectBoundaryPressure(runs: ParsedRun[]): BoundaryPressure[] {
    const scores = collectCandidateScores(runs);

    const calc = (label: string, threshold: number, scores: number[]): BoundaryPressure => {
        const nearCount = scores.filter((s) => Math.abs(s - threshold) <= BOUNDARY_BAND).length;
        return {
            label,
            threshold,
            band: BOUNDARY_BAND,
            nearCount,
            totalCount: scores.length
        };
    };

    return [
        calc('Bridge Candidate', CANDIDATE_GATE.bridgeAuditMinScore, scores.bridge),
        calc('Utility Candidate', CANDIDATE_GATE.utilityAuditMinScore, scores.utility),
        calc('Contract Candidate', CANDIDATE_GATE.contractAuditMinScore, scores.contract)
    ];
}

function selectAuditQueue(runs: ParsedRun[]): TopCommunitySpeciesRow[] {
    const allRows = runs.flatMap((run) => run.topCommunityRows);
    const filtered = allRows.filter((row) => {
        const s = row.species || '';
        if (s === 'Bridge Candidate') return (row.bridgeScore || 0) >= CANDIDATE_GATE.bridgeAuditMinScore;
        if (s === 'Utility Candidate') return (row.utilityScore || 0) >= CANDIDATE_GATE.utilityAuditMinScore;
        if (s === 'Contract Candidate') return (row.contractScore || 0) >= CANDIDATE_GATE.contractAuditMinScore;
        return s.includes('Infrastructure Mesh') || s.includes('Mixed');
    });

    const uniq = new Map<string, TopCommunitySpeciesRow>();
    for (const row of filtered) {
        const key = `${row.communityId}|${row.species}`;
        if (!uniq.has(key)) {
            uniq.set(key, row);
        }
    }

    return Array.from(uniq.values());
}

function summarizeInfraTargets(runs: ParsedRun[]): InfraTarget[] {
    const merged = new Map<string, { sumPriority: number; count: number; maxExternal: number; maxInternal: number }>();
    for (const run of runs) {
        for (const t of run.infraTargets) {
            const prev = merged.get(t.id) || { sumPriority: 0, count: 0, maxExternal: 0, maxInternal: 0 };
            prev.sumPriority += t.splitPriority;
            prev.count += 1;
            prev.maxExternal = Math.max(prev.maxExternal, t.external);
            prev.maxInternal = Math.max(prev.maxInternal, t.internal);
            merged.set(t.id, prev);
        }
    }

    const rows: InfraTarget[] = [];
    for (const [id, agg] of merged.entries()) {
        rows.push({
            id,
            splitPriority: agg.count > 0 ? agg.sumPriority / agg.count : 0,
            external: agg.maxExternal,
            internal: agg.maxInternal
        });
    }

    rows.sort((a, b) => b.splitPriority - a.splitPriority || b.external - a.external);
    return rows;
}

export function printSummary(
    stability: SpeciesStabilityRow[],
    gate: StabilityGateResult,
    presenceRows: SpeciesPresenceRow[],
    speciesConfidenceRows: SpeciesConfidenceRow[],
    speciesScoreConfidenceRows: SpeciesScoreConfidenceRow[],
    boundaryPressure: BoundaryPressure[],
    boundaryHistogram: BoundaryConfidenceHistogram[],
    infraMeshSweep: ThresholdSweepRow[],
    infraMeshRecommendation: InfraMeshThresholdRecommendation,
    infraRows: InfraTarget[],
    auditRows: TopCommunitySpeciesRow[]
): void {
    console.log('[Validation] Species Stability (min/max/avg over runs)');
    for (const row of stability) {
        console.log(`  - ${row.species}: min=${row.min}, max=${row.max}, avg=${row.avg.toFixed(2)}, rel=${volatility(row).toFixed(2)}, values=[${row.values.join(',')}]`);
    }

    console.log('\n[Validation] Establishment Gate');
    console.log(`  - verdict: ${gate.stable ? 'PASS' : 'HOLD'}`);
    console.log(`  - rule: ${gate.rule}`);
    if (gate.failures.length > 0) {
        for (const failure of gate.failures) {
            console.log(`  - fail: ${failure}`);
        }
    }

    console.log('\n[Validation] Species Presence Matrix');
    for (const row of presenceRows) {
        const marks = row.runPresence.map((v) => (v ? '✓' : '·')).join(' ');
        console.log(`  - ${row.species}: ${marks} | hit=${row.hitCount}/${row.runPresence.length} | status=${row.status}`);
    }

    console.log('\n[Validation] Species Confidence');
    for (const row of speciesConfidenceRows) {
        console.log(`  - ${row.species}: confidence=${row.confidence.toFixed(2)}`);
    }

    console.log('\n[Validation] Species Score Confidence');
    if (speciesScoreConfidenceRows.length === 0) {
        console.log('  - none');
    } else {
        for (const row of speciesScoreConfidenceRows) {
            console.log(`  - ${row.species}: avg=${row.avg.toFixed(3)}, min=${row.min.toFixed(3)}, max=${row.max.toFixed(3)}, n=${row.count}`);
        }
    }

    console.log('\n[Validation] Candidate Boundary Pressure');
    for (const row of boundaryPressure) {
        console.log(`  - ${row.label}: near=${row.nearCount}/${row.totalCount} within ±${row.band.toFixed(2)} of threshold ${row.threshold.toFixed(2)}`);
    }

    console.log('\n[Validation] Boundary Confidence Histogram');
    for (const hist of boundaryHistogram) {
        const parts = hist.bins.map((bin) => `${bin.range}:${bin.count}`).join(', ');
        console.log(`  - ${hist.label}: total=${hist.totalCount} | ${parts}`);
    }

    console.log('\n[Validation] Infrastructure Mesh Split Candidates');
    if (infraRows.length === 0) {
        console.log('  - none');
    } else {
        for (const row of infraRows.slice(0, 5)) {
            console.log(`  - ${row.id}: meanSplitPriority=${row.splitPriority.toFixed(3)} (maxExternal=${row.external}, maxInternal=${row.internal})`);
        }
    }

    console.log('\n[Validation] Infrastructure Mesh Threshold Sweep');
    for (const row of infraMeshSweep) {
        const ids = row.ids.length > 0 ? row.ids.join(', ') : 'none';
        console.log(`  - threshold=${row.threshold.toFixed(2)} -> count=${row.count} | ids=${ids}`);
    }

    console.log('\n[Validation] Infrastructure Mesh Threshold Recommendation');
    const baselineIds = infraMeshRecommendation.baselineIds.length > 0
        ? infraMeshRecommendation.baselineIds.join(', ')
        : 'none';
    console.log(`  - baseline=${infraMeshRecommendation.baselineThreshold.toFixed(2)} -> count=${infraMeshRecommendation.baselineCount} | ids=${baselineIds}`);
    console.log(`  - next=${infraMeshRecommendation.nextThreshold.toFixed(2)} -> count=${infraMeshRecommendation.nextCount}`);
    console.log(`  - rationale: ${infraMeshRecommendation.rationale}`);

    console.log('\n[Validation] AST Audit Queue Seed (top-community uncertain species)');
    if (auditRows.length === 0) {
        console.log('  - none');
        return;
    }

    for (const row of auditRows.slice(0, 20)) {
        const speciesConfidence = speciesConfidenceRows.find((x) => x.species === row.species)?.confidence;
        const score = row.bridgeScore ?? row.utilityScore ?? row.contractScore;
        const scoreLabel = row.bridgeScore !== undefined
            ? 'bridgeScore'
            : row.utilityScore !== undefined
                ? 'utilityScore'
                : row.contractScore !== undefined
                    ? 'contractScore'
                    : 'score';
        const scoreText = score !== undefined ? `, ${scoreLabel}=${score.toFixed(3)}` : '';
        const confText = speciesConfidence !== undefined ? `, speciesConfidence=${speciesConfidence.toFixed(2)}` : '';
        const base = row.speciesBase ? `, base=${row.speciesBase}` : '';
        console.log(`  - ${row.communityId}: species=${row.species || 'unknown'}${base}${confText}${scoreText}`);
    }
}

export class ValidationEngine {
    static analyzeState(snapshot: Readonly<GraphSnapshot>, runCount: number, workspaceRoot: string, intentEdges?: any[]): ValidationContext {
        const runs: ParsedRun[] = [];
        for (let i = 0; i < runCount; i++) {
            console.log(`[Validation] run ${i + 1}/${runCount} started`);
            const parsed = runSingle(snapshot, workspaceRoot);
            runs.push(parsed);
            console.log(`[Validation] run ${i + 1}/${runCount} completed`);
        }

        const stability = toStabilityRows(runs);
        const gate = evaluateStabilityGate(stability);
        const presenceRows = buildPresenceRows(runs, PRESENCE_MATRIX_LABELS);
        const speciesConfidenceRows = buildSpeciesConfidenceRows(presenceRows);
        const speciesScoreConfidenceRows = buildSpeciesScoreConfidenceRows(runs);
        const boundaryPressure = collectBoundaryPressure(runs);
        const boundaryHistogram = buildBoundaryConfidenceHistogram(runs);
        const infraRows = summarizeInfraTargets(runs);
        const infraMeshSweep = buildInfraMeshThresholdSweep(infraRows, INFRA_MESH_SWEEP_THRESHOLDS);
        const infraMeshRecommendation = buildInfraMeshThresholdRecommendation(
            infraMeshSweep,
            INFRA_MESH_BASELINE_THRESHOLD
        );
        const auditRows = selectAuditQueue(runs);

        printSummary(
            stability,
            gate,
            presenceRows,
            speciesConfidenceRows,
            speciesScoreConfidenceRows,
            boundaryPressure,
            boundaryHistogram,
            infraMeshSweep,
            infraMeshRecommendation,
            infraRows,
            auditRows
        );

        // [P0 진단] ValidationEngine 진입 시 semanticRole 분포
        const semanticRoleDist = new Map<string, number>();
        for (const node of snapshot.nodes) {
            const role = (node as any).semanticRole || 'UNDEFINED';
            semanticRoleDist.set(role, (semanticRoleDist.get(role) || 0) + 1);
        }
        console.log('[SEMANTIC_ROLE_DIST]', Object.fromEntries(semanticRoleDist));

        // [P0 진단] ValidationEngine 진입 시 노드 샘플
        console.log('[VE_SAMPLE_NODE]', {
            id: snapshot.nodes[0]?.id,
            semanticRole: (snapshot.nodes[0] as any)?.semanticRole,
            role: (snapshot.nodes[0] as any)?.role,
            architecturalRole: (snapshot.nodes[0] as any)?.architecturalRole
        });

        // Assembly Point 현황 확인
        const assemblyPoints = snapshot.nodes.filter(
            n => (n as any).isAssemblyPoint === true
        );
        const sampleAssembly = assemblyPoints[0];
        console.log(`[ValidationEngine] Found ${assemblyPoints.length} assembly points. Sample:`, sampleAssembly ? {
            id: sampleAssembly.id,
            isAssemblyPoint: (sampleAssembly as any)?.isAssemblyPoint
        } : 'None');
        const { analyzeGraph } = require('../GraphAnalyzer');
        const graphAnalysis = analyzeGraph({
            nodes: snapshot.nodes,
            edges: snapshot.edges,
            clusterIds: new Set(snapshot.clusters?.map(c => c.id) || []),
            nodeIds: new Set(snapshot.nodes.map(n => n.id))
        });
        
        const anySnapshot = snapshot as any;
        if (!anySnapshot.metadata) {
            anySnapshot.metadata = { projectUUID: '', projectName: '', snapshotCount: 0 };
        }
        anySnapshot.metadata.assemblyAudit = graphAnalysis.assemblyAudit;
        
        // [P0 진단] assemblyAudit 생성 여부 확인
        console.log('[ASSEMBLY_AUDIT_SAVE]', {
            graphAnalysisLength: graphAnalysis.assemblyAudit?.length ?? -1,
            metadataLength: anySnapshot.metadata.assemblyAudit?.length ?? -1
        });

        const ghostBreakdown: BreakdownEntry[] = [];
        let totalGhost = 0;
        const metaGhost = anySnapshot.metadata?.ghostBreakdown || {};
        for (const [source, count] of Object.entries(metaGhost)) {
            if ((count as number) > 0) {
                ghostBreakdown.push({ name: source, count: count as number, ratio: 0 });
                totalGhost += (count as number);
            }
        }
        if (totalGhost > 0) {
            ghostBreakdown.forEach(entry => entry.ratio = Math.round((entry.count / totalGhost) * 1000) / 10);
            ghostBreakdown.sort((a, b) => b.count - a.count);
        }

        const externalBreakdown: BreakdownEntry[] = [];
        let totalExternal = 0;
        const metaExternal = anySnapshot.metadata?.externalBreakdown || {};
        for (const [source, count] of Object.entries(metaExternal)) {
            if ((count as number) > 0) {
                externalBreakdown.push({ name: source, count: count as number, ratio: 0 });
                totalExternal += (count as number);
            }
        }
        if (totalExternal > 0) {
            externalBreakdown.forEach(entry => entry.ratio = Math.round((entry.count / totalExternal) * 1000) / 10);
            externalBreakdown.sort((a, b) => b.count - a.count);
        }

        const couplingBreakdown: BreakdownEntry[] = [];
        let totalCoupling = 0;
        for (const [source, traffic] of graphAnalysis.continentTraffic.entries()) {
            couplingBreakdown.push({ name: source, count: traffic.external, ratio: 0 });
            totalCoupling += traffic.external;
        }
        if (totalCoupling > 0) {
            couplingBreakdown.forEach(entry => entry.ratio = Math.round((entry.count / totalCoupling) * 1000) / 10);
            couplingBreakdown.sort((a, b) => b.count - a.count);
        }

        let ghostEvidence: any[] = [];
        let boundaryEvidence: any[] = [];
        let topImpactFiles: any[] = [];
        let systemAssemblyPoints: any[] = [];
        let docEvidence: any[] = [];
        if (intentEdges && intentEdges.length > 0) {
            const TOP_IMPACT_LIMIT = 100;
            const EVIDENCE_LIMIT = 50;
            const path = require('path');

            const nodeMap = new Map<string, any>();
            for (const n of snapshot.nodes) {
                nodeMap.set(n.id, n);
            }

            // [P0 진단] tmLanguage 노드 존재 여부 + role 확인
            const tmlNodes = snapshot.nodes.filter((n: any) => 
                n.id?.toLowerCase().includes('tmlanguage') || 
                n.filePath?.toLowerCase().includes('tmlanguage')
            );
            console.log('[SNAPSHOT_ROLE_AUDIT]', {
                tmlNodes: tmlNodes.slice(0, 5).map((n: any) => ({
                    id: n.id?.substring(0, 80),
                    role: n.role,
                    type: n.type
                }))
            });

            const impactMap = new Map<string, { externalEdges: number, targets: Map<string, { count: number, types: Set<string> }> }>();
            
            // To find semanticType and type of an intentEdge, we can look up the first matching edge in snapshot
            const edgeSemTypeMap = new Map<string, string>();
            const edgeRefTypeMap = new Map<string, string>();
            for (const e of snapshot.edges) {
                const key = `${e.from}->${e.to}`;
                if (!edgeSemTypeMap.has(key)) edgeSemTypeMap.set(key, e.semanticType || 'CODE');
                if (!edgeRefTypeMap.has(key)) edgeRefTypeMap.set(key, e.type || 'UNKNOWN');
            }

            for (const e of intentEdges) {
                // [v0.3.34.20b] AGGREGATE_ nodes are collapsed external clusters (extensions/cli/etc).
                // They are valid as boundary targets in evidence, but must NOT pollute impact ranking.
                if (e.source?.startsWith('AGGREGATE_') || e.target?.startsWith('AGGREGATE_')) continue;

                const edgeKey = `${e.source}->${e.target}`;
                const semType = edgeSemTypeMap.get(edgeKey) || 'CODE';
                const refType = edgeRefTypeMap.get(edgeKey) || 'UNKNOWN';
                
                // 순수 CODE_EDGE 및 GHOST(unresolved code reference) 만을 아키텍처 위험도 평가에 반영
                if (semType === 'DOC' || semType === 'TEST' || semType === 'GENERATED') {
                    continue; 
                }

                const sourceNode = nodeMap.get(e.source);
                if (sourceNode?.data?.role === 'GRAMMAR' || sourceNode?.role === 'GRAMMAR' || e.source.toLowerCase().endsWith('.tmlanguage.json')) {
                    continue;
                }

                // [Ponytail] Test artifacts are not valid architectural boundary targets. Strip them out.
                if (e.target.includes('/test/') || e.target.includes('test/') || e.target.includes('/mock/') || e.target.includes('mock/') || e.target.includes('fixtures/') || e.target.includes('simulation') || e.target.includes('test-resolver') || e.target.includes('test-harness') || e.target.includes('testServices')) {
                    continue;
                }

                const targetNode = nodeMap.get(e.target);
                const sourceCluster = sourceNode?.cluster_id;
                const targetCluster = targetNode?.cluster_id;
                const isBoundary = e.isGhost || !targetCluster || sourceCluster !== targetCluster;
                
                if (isBoundary) {
                    if (!impactMap.has(e.source)) impactMap.set(e.source, { externalEdges: 0, targets: new Map() });
                    const data = impactMap.get(e.source)!;
                    data.externalEdges += e.evidenceCount;
                    
                    if (!data.targets.has(e.target)) data.targets.set(e.target, { count: 0, types: new Set() });
                    const targetData = data.targets.get(e.target)!;
                    targetData.count += e.evidenceCount;
                    targetData.types.add(refType);
                }
            }
            
            // Calculate Global Averages and Percentiles
            const globalStats = new Map<string, { boundary: number, fanIn: number, fanOut: number }>();
            for (const n of snapshot.nodes) {
                const degree = graphAnalysis.degreeMap.get(n.id) || { in: 0, out: 0, total: 0 };
                globalStats.set(n.id, { boundary: 0, fanIn: degree.in, fanOut: degree.out });
            }
            for (const [source, data] of impactMap.entries()) {
                if (globalStats.has(source)) {
                    globalStats.get(source)!.boundary = data.externalEdges;
                }
            }
            
            let sumBoundary = 0, sumFanIn = 0, sumFanOut = 0;
            const arrBoundary: number[] = [];
            const arrFanIn: number[] = [];
            const arrFanOut: number[] = [];
            
            for (const stats of globalStats.values()) {
                sumBoundary += stats.boundary;
                sumFanIn += stats.fanIn;
                sumFanOut += stats.fanOut;
                arrBoundary.push(stats.boundary);
                arrFanIn.push(stats.fanIn);
                arrFanOut.push(stats.fanOut);
            }
            
            const nodeCount = globalStats.size || 1;
            const avgBoundary = sumBoundary / nodeCount;
            const avgFanIn = sumFanIn / nodeCount;
            const avgFanOut = sumFanOut / nodeCount;
            
            arrBoundary.sort((a, b) => a - b);
            arrFanIn.sort((a, b) => a - b);
            arrFanOut.sort((a, b) => a - b);
            
            const getPercentile = (sortedArr: number[], val: number) => {
                if (sortedArr.length === 0) return 0;
                let idx = sortedArr.findIndex(v => v >= val);
                if (idx === -1) idx = sortedArr.length;
                return 100 - ((idx / sortedArr.length) * 100);
            };
            
            const fanInTop5 = arrFanIn[Math.floor(arrFanIn.length * 0.95)] || 0;
            const fanOutTop5 = arrFanOut[Math.floor(arrFanOut.length * 0.95)] || 0;

            const candidates = Array.from(impactMap.entries())
                .filter(([source, data]) => {
                    const node = nodeMap.get(source);
                    if (node && (node.role === 'GRAMMAR' || node.role === 'ASSET')) {
                        return false;
                    }
                    return data.externalEdges > 0;
                })
                .map(([filePath, data]) => {
                    const node = nodeMap.get(filePath);
                    
                    const targetsList = Array.from(data.targets.entries())
                        .map(([target, tData]) => ({ 
                            target, 
                            count: tData.count, 
                            typeStr: Array.from(tData.types).join(', ') 
                        }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 10);
                        
                    const degree = graphAnalysis.degreeMap.get(filePath) || { in: 0, out: 0, total: 0 };
                    const pBoundary = getPercentile(arrBoundary, data.externalEdges);
                    const pFanIn = getPercentile(arrFanIn, degree.in);
                    const pFanOut = getPercentile(arrFanOut, degree.out);

                    // consumers = files that import THIS file (fan-in sources from intentEdges)
                    // Exclude AGGREGATE_ nodes (collapsed external clusters) from consumer list
                    const consumerSet = new Set<string>();
                    for (const e of intentEdges) {
                        if (e.target === filePath && !e.source?.startsWith('AGGREGATE_')) consumerSet.add(e.source);
                    }
                    
                    return { 
                        filePath, 
                        externalEdges: data.externalEdges, 
                        targets: targetsList,
                        fanIn: degree.in,
                        fanOut: degree.out,
                        reachability: 0,
                        consumers: Array.from(consumerSet),
                        percentiles: { boundary: pBoundary, fanIn: pFanIn, fanOut: pFanOut },
                        averages: { boundary: avgBoundary, fanIn: avgFanIn, fanOut: avgFanOut },
                        // [v0.3.34.20] 메타데이터 보존: 역할 계층 분리
                        role: node?.role,                    // NodeRole (파일 유형: GRAMMAR, RUNTIME, CONFIG 등)
                        semanticRole: node?.semanticRole     // SemanticRole (그래프 구조: ASSEMBLY_POINT 등)
                    };
                });

                
            // 1차 필터링: Boundary + FanOut 기준으로 상위 N개 추출
            candidates.sort((a, b) => (b.externalEdges + b.fanOut) - (a.externalEdges + a.fanOut));
            const bfsLimit = Math.min(200, Math.max(100, Math.ceil(candidates.length * 0.05)));
            const topCandidates = candidates.slice(0, bfsLimit);
            
            const rawTop20Log = topCandidates.slice(0, 20).map((c, idx) => {
                return `  #${idx + 1} ${c.filePath} | Role: ${(c as any).role || 'UNKNOWN'}/${(c as any).semanticRole || 'UNKNOWN'} | Boundary: ${c.externalEdges} | FanOut: ${c.fanOut}`;
            }).join('\n');
            console.log(`[ValidationEngine] RAW Top 20 candidates (Before Penalty):\n${rawTop20Log}`);
            
            const adjacency = new Map<string, string[]>();
            for (const e of snapshot.edges) {
                if (!adjacency.has(e.from)) adjacency.set(e.from, []);
                adjacency.get(e.from)!.push(e.to);
            }
            
            // 3-Hop Cross-Cluster BFS (Blast Radius)
            for (const candidate of topCandidates) {
                const startNode = nodeMap.get(candidate.filePath);
                const startCluster = startNode?.cluster_id;
                const visitedClusters = new Set<string>();
                const visitedNodes = new Set<string>();
                
                const queue: {id: string, depth: number}[] = [{id: candidate.filePath, depth: 0}];
                visitedNodes.add(candidate.filePath);
                
                let head = 0;
                while (head < queue.length) {
                    const current = queue[head++];
                    if (current.depth >= 3) continue;
                    
                    const neighbors = adjacency.get(current.id);
                    if (neighbors) {
                        for (const n of neighbors) {
                            if (!visitedNodes.has(n)) {
                                visitedNodes.add(n);
                                queue.push({id: n, depth: current.depth + 1});
                                
                                const nNode = nodeMap.get(n);
                                const targetCluster = nNode?.cluster_id;
                                if (targetCluster && targetCluster !== startCluster && !targetCluster.includes('ghost')) {
                                    visitedClusters.add(targetCluster);
                                }
                            }
                        }
                    }
                }
                candidate.reachability = visitedClusters.size;
            }
            
            const architecturalFindings = ArchitectureAuditor.audit(snapshot as any, topCandidates);
            
            const assemblyFindings = architecturalFindings.filter(f => f.findingType === 'HEALTHY_HUB');
            const impactFindings = architecturalFindings.filter(f => f.findingType !== 'HEALTHY_HUB');
            
            // [v0.3.34.20] architecturalRole 병합: Auditor 판정 결과를 candidate에 미리 추가 (정렬 전)
            topCandidates.forEach(c => {
                const finding = architecturalFindings.find(f => f.filePath === c.filePath);
                if (finding) {
                    (c as any).architecturalRole = finding.role;
                }
            });

            // 최종 Multi-Level Sort: Role Penalty > Boundary DESC > Reachability DESC > FanOut DESC
            topCandidates.sort((a, b) => {
                if (b.externalEdges !== a.externalEdges) return b.externalEdges - a.externalEdges;
                if (b.reachability !== a.reachability) return b.reachability - a.reachability;
                return b.fanOut - a.fanOut;
            });
            
            const assemblyPoints = topCandidates
                .filter(c => assemblyFindings.some(f => f.filePath === c.filePath));
            const testHarnessCount = candidates.filter(c => c.semanticRole === 'TEST' || c.role === 'TEST_ARTIFACT').length;
            console.log(`[ValidationEngine] TEST or TEST_ARTIFACT count: ${testHarnessCount}`);
            
            const logStr = topCandidates.slice(0, 10).map((c, idx) => {
                const cAny = c as any;
                const roleStr = cAny.architecturalRole || cAny.role || 'UNKNOWN';
                const semanticStr = cAny.semanticRole || 'UNKNOWN';
                return `  #${idx + 1} ${c.filePath} | Role: ${roleStr}/${semanticStr} | Boundary: ${c.externalEdges} | FanOut: ${c.fanOut}`;
            }).join('\n');
            console.log(`[ValidationEngine] Top 10 sorted candidates:\n${logStr}`);
            
            // Validation Report Data Structure 생성을 위한 임시 배열
            let validCandidates: any[] = topCandidates
                .filter(c => impactFindings.some(f => f.filePath === c.filePath))
                .filter(c => {
                    const role = (c as any).semanticRole;
                    // Ponytail: Hard filter for Runtime Hub. Kick out tests, tooling, docs, samples.
                    return role === 'CORE_RUNTIME' || role === 'UNKNOWN' || role === 'NORMAL' || role === undefined;
                });
            
            topImpactFiles = validCandidates.slice(0, TOP_IMPACT_LIMIT);

            // === AST Evidence Verification Layer (Step 1 integration) ===
            // Regex 그래프는 절대 건드리지 않음. Top Impact Files만 AST로 재검증하여 위험도 랭킹 오탐 제거.
            try {
                const { ASTVerificationEngine } = require('../../cli/ast_verification_engine');
                const astEngine = new ASTVerificationEngine();
                const topFilePaths = topImpactFiles.map((f: any) => f.filePath);
                const astResults = astEngine.verifyTopFiles(topFilePaths, workspaceRoot);
                
                // adjustedImpactScore 적용 + 재정렬 + Top 재선정
                const adjustedCandidates = topImpactFiles.map((candidate: any) => {
                    const astResult = astResults.find((r: any) => r.filePath === candidate.filePath);
                    if (astResult && !astResult.degraded) {
                        const originalScore = candidate.impactScore || candidate.externalEdges || 0;
                        const adjustedScore = Math.round(originalScore * astResult.multiplier);
                        return {
                            ...candidate,
                            adjustedImpactScore: adjustedScore,
                            astVerification: {
                                classification: astResult.classification,
                                classificationReason: astResult.classificationReason,
                                ratios: astResult.ratios,
                                multiplier: astResult.multiplier,
                                nodeCount: astResult.nodeCount,
                                confidence: astResult.confidence
                            }
                        };
                    }
                    // Degraded Mode: 기존 보고서 유지
                    return {
                        ...candidate,
                        adjustedImpactScore: candidate.impactScore || candidate.externalEdges || 0,
                        astVerification: astResult ? {
                            classification: astResult.classification,
                            classificationReason: astResult.classificationReason,
                            degraded: true
                        } : undefined
                    };
                });
                
                // 재정렬: adjustedImpactScore DESC (TEST_ARTIFACT는 이미 Multi-Level Sort에서 penalty 받음)
                adjustedCandidates.sort((a: any, b: any) => (b.adjustedImpactScore || 0) - (a.adjustedImpactScore || 0));
                
                // Top 재선정
                topImpactFiles = adjustedCandidates.slice(0, TOP_IMPACT_LIMIT);
                
                console.log(`[ValidationEngine] AST Verification complete: ${astResults.length} files processed, re-ranked top ${topImpactFiles.length}`);
            } catch (err) {
                console.warn('[ValidationEngine] AST Verification skipped (import or execution failed):', err);
                // Degraded Mode: 기존 topImpactFiles 유지
            }

            systemAssemblyPoints = assemblyPoints.slice(0, TOP_IMPACT_LIMIT);

            const allAuditedFiles = [...topImpactFiles, ...systemAssemblyPoints];
            
            const anySnapshot = snapshot as any;
            if (!anySnapshot.metadata) {
                anySnapshot.metadata = { projectUUID: '', projectName: '', snapshotCount: 1 };
            }
            anySnapshot.metadata.architecturalFindings = architecturalFindings;

            ghostEvidence = intentEdges
                .filter(e => {
                    if (e.source?.startsWith('AGGREGATE_')) return false;
                    const semType = edgeSemTypeMap.get(`${e.source}->${e.target}`) || 'CODE';
                    return semType === 'GHOST';
                })
                .sort((a, b) => b.evidenceCount - a.evidenceCount)
                .slice(0, EVIDENCE_LIMIT);
                
            boundaryEvidence = intentEdges
                .filter(e => {
                    if (e.source?.startsWith('AGGREGATE_')) return false;
                    const semType = edgeSemTypeMap.get(`${e.source}->${e.target}`) || 'CODE';
                    // We only show true CODE/GHOST boundaries, wait GHOST is covered above
                    return !e.isGhost && e.evidenceCount > 0 && semType === 'CODE';
                })
                .sort((a, b) => b.evidenceCount - a.evidenceCount)
                .slice(0, EVIDENCE_LIMIT);
                
            docEvidence = intentEdges
                .filter(e => {
                    if (e.source?.startsWith('AGGREGATE_')) return false;
                    const semType = edgeSemTypeMap.get(`${e.source}->${e.target}`) || 'CODE';
                    return semType === 'DOC';
                })
                .sort((a, b) => b.evidenceCount - a.evidenceCount)
                .slice(0, Math.min(EVIDENCE_LIMIT, 20)); // Up to 20 doc edges
        }

        // --- Compute Confidence Matrix ---
        let grammarNoiseFiltered = 0;
        let assemblyPointClassified = 0;
        let contractHubVerified = 0;
        let lowGhostRatioScore = 0;
        let unknownReferencesPenalty = 0;
        
        const grammarCount = ghostBreakdown.find(e => e.name === 'GRAMMAR_REFERENCE')?.count || 0;
        if (grammarCount > 0) grammarNoiseFiltered = 10;
        
        if (systemAssemblyPoints && systemAssemblyPoints.length > 0) assemblyPointClassified = 5;
        
        const hasContractHub = anySnapshot.metadata?.architecturalFindings?.some((f: any) => f.role === 'CONTRACT_HUB');
        if (hasContractHub) contractHubVerified = 4;
        
        const totalGhostRatio = (ghostBreakdown.reduce((sum, e) => sum + e.count, 0) / snapshot.edges.length) * 100;
        if (totalGhostRatio < 5 && snapshot.edges.length > 0) lowGhostRatioScore = 6;
        
        const unknownCount = ghostBreakdown.find(e => e.name === 'UNKNOWN_REFERENCE')?.count || 0;
        if (unknownCount > 0) unknownReferencesPenalty = -2;

        const baseScore = 70;
        const finalScore = baseScore + grammarNoiseFiltered + assemblyPointClassified + contractHubVerified + lowGhostRatioScore + unknownReferencesPenalty;
        const auditConfidenceMatrix = {
            baseScore,
            grammarNoiseFiltered,
            assemblyPointClassified,
            contractHubVerified,
            lowGhostRatio: lowGhostRatioScore,
            unknownReferences: unknownReferencesPenalty,
            finalScore: Math.min(100, Math.max(0, finalScore))
        };

        const metrics: ValidationMetrics = {
            generatedAt: new Date().toISOString(),
            runCount,
            speciesStability: stability,
            establishmentGate: gate,
            presenceMatrix: presenceRows,
            speciesConfidence: speciesConfidenceRows,
            speciesScoreConfidence: speciesScoreConfidenceRows,
            boundaryPressure,
            boundaryConfidenceHistogram: boundaryHistogram,
            infraMeshThresholdSweep: infraMeshSweep,
            infraMeshBaselineThreshold: INFRA_MESH_BASELINE_THRESHOLD,
            infraMeshThresholdRecommendation: infraMeshRecommendation,
            auditThresholds: CANDIDATE_GATE,
            infrastructureSplitCandidates: infraRows,
            auditQueueSeed: auditRows.slice(0, 200),
            ghostBreakdown,
            externalBreakdown,
            couplingBreakdown,
            ghostEvidence,
            boundaryEvidence,
            docEvidence,
            topImpactFiles,
            systemAssemblyPoints,
            auditConfidenceMatrix
        };

        // [P0 진단] 결함 1 원인 규명: 데이터 흐름 계측
        console.log('[VE_DIAG]', {
            assemblyAudit: anySnapshot.metadata?.assemblyAudit?.length || 0,
            architecturalFindings: anySnapshot.metadata?.architecturalFindings?.length || 0,
            systemAssemblyPoints: systemAssemblyPoints.length,
            topImpactFiles: topImpactFiles.length
        });

        // [v0.3.34.21] Copy Edge Type Distribution to metrics so the report can read it
        if (anySnapshot.metadata?.edgeTypeDistribution) {
            metrics.edgeTypeDistribution = anySnapshot.metadata.edgeTypeDistribution;
        }

        // [v0.3.34.24] Architecture State Model — AnomalyCollector
        // snapshot.nodes = 전체 그래프 노드 (rawStateNodes 개념 없음 — ValidationEngine은 전체 그래프 대상)
        // 모든 노드를 분류하고 FSM Completeness 집계
        let anomalySummary: import('../../types/schema').AnomalySummary | undefined;
        let fsmAudit: import('../../types/schema').FSMAuditSummary | undefined;
        let failurePropagation: import('../../types/schema').FailurePropagationReport | undefined;
        try {
            const { StateAuditPipeline } = require('../StateAuditPipeline');
            // ValidationEngine은 전체 그래프 기준 → rawStateNodes = snapshot.nodes (OUT_OF_SCOPE 없음)
            const pipeline = new StateAuditPipeline(snapshot.nodes, snapshot.nodes);
            const result = pipeline.run(snapshot.nodes, snapshot.edges);
            anomalySummary = result.anomalySummary;
            fsmAudit = result.fsmAudit;
            failurePropagation = result.failurePropagation;
            console.log('[ANOMALY_SUMMARY]', anomalySummary);
            console.log('[FSM_AUDIT]', fsmAudit);
            console.log('[FAILURE_PROPAGATION_SUMMARY] direct:', failurePropagation?.totalDirect, 'indirect:', failurePropagation?.totalIndirect, 'cascade:', failurePropagation?.totalCascade);
        } catch (e) {
            console.warn('[AnomalyCollector] skipped:', e);
        }

        return {
            snapshot,
            metrics,
            workspaceRoot,
            anomalySummary,
            fsmAudit,
            failurePropagation,
        };
    }
}
