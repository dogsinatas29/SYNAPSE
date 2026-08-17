import { GraphModel } from '../../GraphModel';
import { ISemanticCandidate, NotCandidateReport, ICandidateEvaluation } from './SemanticTypes';

export interface ICandidateGenerator {
    readonly generatorName: string;
    generate(graph: GraphModel): { candidates: ISemanticCandidate[], notCandidates: NotCandidateReport[] };
}

export interface IEvidenceEvaluator {
    readonly evaluatorName: string;
    evaluate(candidate: ISemanticCandidate, graph: GraphModel): ICandidateEvaluation;
}
