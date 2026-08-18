import { GraphModel, Edge, Node } from '../GraphModel';
import { ICandidateGenerator, IEvidenceEvaluator, INodeFactCandidateGenerator, INodeFactEvidenceEvaluator } from './models/GeneratorInterfaces';
import { PayloadCandidateGenerator } from './generators/PayloadCandidateGenerator';
import { PayloadEvidenceEvaluator } from './evaluators/PayloadEvidenceEvaluator';
import { StateOwnerCandidateGenerator } from './generators/StateOwnerCandidateGenerator';
import { StateOwnerEvidenceEvaluator } from './evaluators/StateOwnerEvidenceEvaluator';
import { BoundaryCandidateGenerator } from './generators/BoundaryCandidateGenerator';
import { BoundaryEvidenceEvaluator } from './evaluators/BoundaryEvidenceEvaluator';
import { ExtensionPointCandidateGenerator } from './generators/ExtensionPointCandidateGenerator';
import { ExtensionPointEvidenceEvaluator } from './evaluators/ExtensionPointEvidenceEvaluator';
import { PromotionEngine } from './promoters/PromotionEngine';
import { RejectedCandidateReport, IArchitectureIrAudit, RejectedNodeFactReport } from './models/SemanticTypes';

export class ArchitectureIrBuilder {
    private pipelines: { generator: ICandidateGenerator, evaluator: IEvidenceEvaluator }[];
    private factPipelines: { generator: INodeFactCandidateGenerator, evaluator: INodeFactEvidenceEvaluator }[];
    private promotionEngine: PromotionEngine;

    constructor() {
        this.pipelines = [
            { generator: new PayloadCandidateGenerator(), evaluator: new PayloadEvidenceEvaluator() },
            { generator: new StateOwnerCandidateGenerator(), evaluator: new StateOwnerEvidenceEvaluator() },
            { generator: new BoundaryCandidateGenerator(), evaluator: new BoundaryEvidenceEvaluator() }
        ];
        this.factPipelines = [
            { generator: new ExtensionPointCandidateGenerator(), evaluator: new ExtensionPointEvidenceEvaluator() }
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

        console.log('[IR_DEBUG] build start', {
            rawGraphType: rawGraph?.constructor?.name
        });

        // GraphModel을 평가기들이 요구하는 GraphSnapshot 형태로 안전하게 변환하여 전달
        const graphTarget = typeof (rawGraph as any).createSnapshot === 'function'
            ? rawGraph.createSnapshot()
            : rawGraph;

        for (const pipeline of this.pipelines) {
            console.log('[IR_DEBUG] pipeline start', {
                generator: pipeline.generator.constructor.name,
                evaluator: pipeline.evaluator.constructor.name
            });

            // 1. Generate Candidates (타입 충돌 방지를 위해 as any 캐스팅 적용)
            const { candidates, notCandidates } = pipeline.generator.generate(rawGraph as any);

            console.log('[IR_DEBUG] candidates generated', {
                generator: pipeline.generator.constructor.name,
                count: candidates.length
            });

            audit.candidateCount += candidates.length;
            audit.notCandidateReports.push(...notCandidates);

            for (const candidate of candidates) {
                try {
                    const evaluation = pipeline.evaluator.evaluate(candidate, rawGraph as any);

                    const { edge, report } =
                        this.promotionEngine.promote(
                            candidate,
                            evaluation,
                            languageFamily
                        );

                    if (edge) {
                        audit.promotedCount++;

                        audit.promotedByType[edge.type] =
                            (audit.promotedByType[edge.type] || 0) + 1;

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

                        rawGraph.addEdge(newGraphEdge);
                    } else if (report) {
                        audit.rejectedCount++;

                        audit.rejectedByType[report.proposedEdgeType] =
                            (audit.rejectedByType[report.proposedEdgeType] || 0) + 1;

                        if (report.rejectCategory) {
                            audit.rejectedByCategory[report.rejectCategory] =
                                (audit.rejectedByCategory[report.rejectCategory] || 0) + 1;
                        }

                        rejectedReports.push(report);
                    }
                } catch (err) {
                    console.error('[IR_DEBUG] evaluator failed', {
                        generator: pipeline.generator.constructor.name,
                        evaluator: pipeline.evaluator.constructor.name,
                        candidate
                    });

                    console.error(err);

                    throw err;
                }
            }
        }

        const rejectedFactReports: RejectedNodeFactReport[] = [];

        for (const pipeline of this.factPipelines) {
            console.log('[IR_DEBUG] fact pipeline start', {
                generator: pipeline.generator.constructor.name,
                evaluator: pipeline.evaluator.constructor.name
            });

            const { candidates, notCandidates } =
                pipeline.generator.generate(rawGraph as any);

            console.log('[IR_DEBUG] fact candidates generated', {
                generator: pipeline.generator.constructor.name,
                count: candidates.length
            });

            audit.candidateCount += candidates.length;
            audit.notCandidateReports.push(...notCandidates);

            let acceptedCount = 0;
            let rejectedCount = 0;
            let promotedCount = 0;
            let promotionRejectCount = 0;

            for (const candidate of candidates) {
                try {
                    const evaluation =
                        pipeline.evaluator.evaluate(candidate, rawGraph as any);

                    if (evaluation.evidence && evaluation.evidence.length > 0) {
                        acceptedCount++;
                    } else {
                        rejectedCount++;
                    }

                    const { fact, report } =
                        this.promotionEngine.promoteFact(
                            candidate,
                            evaluation,
                            languageFamily
                        );

                    if (fact) promotedCount++;
                    if (report) promotionRejectCount++;

                    // Lookup log
                    const node = (rawGraph as any)['nodes']?.get(candidate.nodeId);
                    console.log('[NODE_LOOKUP]', {
                        nodeId: candidate.nodeId,
                        found: !!node,
                        isSymbol: candidate.nodeId && !candidate.nodeId.includes('/')
                    });

                    if (fact) {
                        console.log('[FACT_PROMOTED]', {
                            nodeId: fact.nodeId,
                            factType: fact.factType,
                            confidence: fact.confidence
                        });
                        audit.promotedCount++;

                        audit.promotedByType[fact.factType] =
                            (audit.promotedByType[fact.factType] || 0) + 1;

                        const targetNode = (rawGraph as any)['nodes']?.get(fact.nodeId);
                        if (targetNode) {
                            if (!targetNode.data) {
                                targetNode.data = {};
                            }

                            if (!targetNode.data.semanticFacts) {
                                targetNode.data.semanticFacts = [];
                            }

                            targetNode.data.semanticFacts.push({
                                type: fact.factType,
                                confidence: fact.confidence,
                                promotionReasons: fact.promotionReasons
                            });
                        } else {
                            console.warn('[IR_DEBUG] fact target node not found', {
                                nodeId: fact.nodeId
                            });
                        }
                    } else if (report) {
                        audit.rejectedCount++;
                        audit.rejectedByType[report.proposedFactType] =
                            (audit.rejectedByType[report.proposedFactType] || 0) + 1;
                        if (report.rejectCategory) {
                            audit.rejectedByCategory[report.rejectCategory] =
                                (audit.rejectedByCategory[report.rejectCategory] || 0) + 1;
                        }
                        rejectedFactReports.push(report);
                    }
                } catch (err) {
                    throw err;
                }
            }

            console.error('[EXTENSION_EVALUATOR]', {
                input: candidates.length,
                accepted: acceptedCount,
                rejected: rejectedCount
            });

            console.error('[EXTENSION_PROMOTION]', {
                promoted: promotedCount,
                rejected: promotionRejectCount
            });
        }

        console.log('[IR_DEBUG] build completed', {
            candidateCount: audit.candidateCount,
            promotedCount: audit.promotedCount,
            rejectedCount: audit.rejectedCount
        });

        return {
            enrichedGraph: rawGraph,
            rejectedReports,
            audit
        };
    }
}