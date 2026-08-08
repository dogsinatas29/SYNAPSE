import { runBundle } from '../../cli/run_b5_bundle';
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
    SpeciesScoreConfidenceRow
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
    static analyzeState(snapshot: Readonly<GraphSnapshot>, runCount: number, workspaceRoot: string): ValidationContext {
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
            auditQueueSeed: auditRows.slice(0, 200)
        };

        return {
            snapshot,
            metrics,
            workspaceRoot
        };
    }
}
