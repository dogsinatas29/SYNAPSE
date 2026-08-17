import { GraphModel } from '../../GraphModel';
import { ISemanticCandidate, NotCandidateReport, ICandidateEvaluation, INodeFactCandidate } from './SemanticTypes';

export interface ICandidateGenerator {
    readonly generatorName: string;
    generate(graph: GraphModel): { candidates: ISemanticCandidate[], notCandidates: NotCandidateReport[] };
}

export interface IEvidenceEvaluator {
    readonly evaluatorName: string;
    evaluate(candidate: ISemanticCandidate, graph: GraphModel): ICandidateEvaluation;
}

export interface INodeFactCandidateGenerator {
    readonly generatorName: string;
    generate(graph: GraphModel): { candidates: INodeFactCandidate[], notCandidates: NotCandidateReport[] };
}

export interface INodeFactEvidenceEvaluator {
    readonly evaluatorName: string;
    evaluate(candidate: INodeFactCandidate, graph: GraphModel): ICandidateEvaluation;
}
