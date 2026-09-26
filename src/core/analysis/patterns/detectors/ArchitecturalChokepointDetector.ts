import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { CategoryClassifier } from '../../providers/CategoryClassifier';
import { BetweennessProvider } from '../../providers/BetweennessProvider';
import { ClusterAggregator, NodeScore } from '../../providers/ClusterAggregator';

export class ArchitecturalChokepointDetector implements PatternDetector {
    private categoryClassifier: CategoryClassifier;
    private betweennessProvider: BetweennessProvider;
    private clusterAggregator: ClusterAggregator;

    constructor() {
        this.categoryClassifier = new CategoryClassifier();
        this.betweennessProvider = new BetweennessProvider();
        this.clusterAggregator = new ClusterAggregator();
    }

    private isRealFile(filePath: string): boolean {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) {
            return false;
        }
        if (!filePath.includes('.')) return false;
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    }

    public detect(context: any, simContext?: any): PatternFinding[] {
        console.log('[TRACE] DetectorStart: ArchitecturalChokepointDetector');
        const findings: PatternFinding[] = [];
        const snapshot = context?.snapshot;
        if (!snapshot || !Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) {
            console.log('[TRACE] DetectorComplete: ArchitecturalChokepointDetector (no graph)');
            return findings;
        }

        const nodeIds = snapshot.nodes.map((n: any) => n.id).filter((id: string) => this.isRealFile(id));
        const nodeIdSet = new Set(nodeIds);
        const validEdges = snapshot.edges.filter((e: any) => {
            const f = e.from ?? e.source;
            const t = e.to ?? e.target;
            return nodeIdSet.has(f) && nodeIdSet.has(t);
        }).map((e: any) => ({
            from: e.from ?? e.source,
            to: e.to ?? e.target
        }));

        // Stage 1: Raw Betweenness
        const t0 = performance.now();
        const rawCentrality = this.betweennessProvider.calculate(nodeIds, validEdges);
        const t1 = performance.now();

        // Stage 2: Architectural Context Filter
        const scoredCandidates: NodeScore[] = [];
        for (const id of nodeIds) {
            const rawScore = rawCentrality.get(id) || 0;
            if (rawScore === 0) continue;

            const category = this.categoryClassifier.classify(id);
            const weight = this.categoryClassifier.getWeight(category);
            
            const finalScore = rawScore * weight;
            if (finalScore > 0) {
                scoredCandidates.push({
                    targetId: id,
                    rawScore,
                    category,
                    weight,
                    finalScore
                });
            }
        }

        scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
        const t2 = performance.now();

        // Print Node Rankings to console for internal testing
        console.log('\n[DEBUG] --- Top 10 Node Candidates ---');
        scoredCandidates.slice(0, 10).forEach((c, i) => {
            console.log(`  #${i + 1} [${c.targetId}] BC=${c.rawScore.toFixed(0)}, W=${c.weight}, Final=${c.finalScore.toFixed(0)}`);
        });

        // Stage 3: Cluster Aggregation
        const clusterStats = this.clusterAggregator.aggregate(scoredCandidates, nodeIds);
        const t3 = performance.now();
        
        console.log(`\n[METROLOGY] Brandes computation: ${(t1 - t0).toFixed(2)} ms`);
        console.log(`[METROLOGY] Context Filter: ${(t2 - t1).toFixed(2)} ms`);
        console.log(`[METROLOGY] Cluster aggregation: ${(t3 - t2).toFixed(2)} ms`);

        
        const alpha = 0.15;
        const scoredClusters = clusterStats.map(c => {
            const score = c.maxWeightedBetweenness + alpha * (c.weightedBetweennessSum - c.maxWeightedBetweenness);
            return { ...c, alphaScore: score };
        });

        scoredClusters.sort((a, b) => b.alphaScore - a.alphaScore);

        const TOP_N = 20;
        for (const stat of scoredClusters.slice(0, TOP_N)) {
            const findingId = `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const evidenceId = `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            
            findings.push({
                findingId,
                patternId: PatternId.ARCHITECTURAL_CHOKEPOINT,
                targetScope: 'CLUSTER',
                targetId: stat.clusterId,
                confidence: 1.0,
                evidence: [{
                    evidenceId,
                    type: 'STRUCTURAL_METRIC',
                    sourceId: stat.clusterId,
                    description: `Architectural Chokepoint (Cluster Score: ${stat.alphaScore.toFixed(2)}, Contribution: ${stat.topNodeContribution.toFixed(2)})`,
                    filePath: stat.clusterId,
                    metadata: {
                        rawBetweennessSum: stat.rawBetweennessSum,
                        weightedBetweennessSum: stat.weightedBetweennessSum,
                        maxBetweenness: stat.maxWeightedBetweenness, // Using weighted max
                        topNodeContribution: stat.topNodeContribution,
                        memberCount: stat.memberCount,
                        candidateCount: stat.candidateCount,
                        aggregationMethod: 'MAX_PLUS_DIMINISHING_RETURNS',
                        aggregationAlpha: alpha,
                        clusterScore: stat.alphaScore,
                        topContributors: stat.topContributors
                    }
                }]
            });
            console.log(`[TRACE] FindingCreated: ${findingId} (Target: ${stat.clusterId})`);
            console.log(`[TRACE] EvidenceCreated: ${evidenceId}`);
        }

        console.log('[TRACE] DetectorComplete: ArchitecturalChokepointDetector');
        console.log('[TRACE] ReportConsume: ArchitecturalChokepointDetector done');

        return findings;
    }
}
