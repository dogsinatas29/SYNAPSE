import { GraphModel, Edge } from '../GraphModel';
import { ICandidateGenerator, IEvidenceEvaluator } from './models/GeneratorInterfaces';
import { PayloadCandidateGenerator } from './generators/PayloadCandidateGenerator';
import { PayloadEvidenceEvaluator } from './evaluators/PayloadEvidenceEvaluator';
import { StateOwnerCandidateGenerator } from './generators/StateOwnerCandidateGenerator';
import { StateOwnerEvidenceEvaluator } from './evaluators/StateOwnerEvidenceEvaluator';
import { BoundaryCandidateGenerator } from './generators/BoundaryCandidateGenerator';
import { BoundaryEvidenceEvaluator } from './evaluators/BoundaryEvidenceEvaluator';
import { PromotionEngine } from './promoters/PromotionEngine';
import { RejectedCandidateReport, IArchitectureIrAudit } from './models/SemanticTypes';

export class ArchitectureIrBuilder {
    private pipelines: { generator: ICandidateGenerator, evaluator: IEvidenceEvaluator }[];
    private promotionEngine: PromotionEngine;

    constructor() {
        this.pipelines = [
            { generator: new PayloadCandidateGenerator(), evaluator: new PayloadEvidenceEvaluator() },
            { generator: new StateOwnerCandidateGenerator(), evaluator: new StateOwnerEvidenceEvaluator() },
            { generator: new BoundaryCandidateGenerator(), evaluator: new BoundaryEvidenceEvaluator() }
        ];
        this.promotionEngine = new PromotionEngine();
    }

    public build(rawGraph: GraphModel, languageFamily: string = 'ts'): { 
        enrichedGraph: GraphModel, 
        rejectedReports: RejectedCandidateReport[],
        audit: IArchitectureIrAudit
    } {
        const rejectedReports: RejectedCandidateReport[] = [];
        const audit: IArchitectureIrAudit = {
            candidateCount: 0,
            promotedCount: 0,
            rejectedCount: 0,
            notCandidateReports: [],
            promotedByType: {},
            rejectedByType: {},
            rejectedByCategory: {}
        };

        for (const pipeline of this.pipelines) {
            // 1. Generate Candidates
            const { candidates, notCandidates } = pipeline.generator.generate(rawGraph);
            console.log(`[DEBUG] ${pipeline.generator.generatorName} generated ${candidates.length} candidates.`);
            
            audit.candidateCount += candidates.length;
            audit.notCandidateReports.push(...notCandidates);

            for (const candidate of candidates) {
                // 2. Evaluate Candidates
                const evaluation = pipeline.evaluator.evaluate(candidate, rawGraph);

                // 3. Promote or Reject
                const { edge, report } = this.promotionEngine.promote(candidate, evaluation, languageFamily);

                if (edge) {
                    audit.promotedCount++;
                    audit.promotedByType[edge.type] = (audit.promotedByType[edge.type] || 0) + 1;

                    const newGraphEdge: Edge = {
                        id: edge.id,
                        from: edge.sourceId,
                        to: edge.targetId,
                        type: edge.type,
                        semanticType: edge.type as any,
                        confidence: edge.confidence,
                        data: {
                            promotionReasons: edge.promotionReasons
                        }
                    };
                    
                    (rawGraph as any).edges.push(newGraphEdge);
                } else if (report) {
                    audit.rejectedCount++;
                    audit.rejectedByType[report.proposedEdgeType] = (audit.rejectedByType[report.proposedEdgeType] || 0) + 1;
                    if (report.rejectCategory) {
                        audit.rejectedByCategory[report.rejectCategory] = (audit.rejectedByCategory[report.rejectCategory] || 0) + 1;
                    }
                    rejectedReports.push(report);
                }
            }
        }

        return {
            enrichedGraph: rawGraph,
            rejectedReports,
            audit
        };
    }
}
