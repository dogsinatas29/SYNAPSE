import { ValidationContext } from '../../validation/ValidationContext';
import { SimulationContext } from '../../../types/schema';
import { 
    QuestionDefinition, 
    VocabularyDefinition, 
    PatternDefinition, 
    QuestionResult,
    ConceptResult,
    PatternResult
} from './DiagnosticTypes';
import { DetectorFactory } from './DetectorFactory';

export class DiagnosticPipeline {
    constructor(
        private questions: QuestionDefinition[],
        private vocabularies: VocabularyDefinition[],
        private patterns: PatternDefinition[],
        private detectorFactory: DetectorFactory
    ) {}

    public answerQuestion(
        questionId: string, 
        valContext: ValidationContext, 
        simContext?: SimulationContext
    ): QuestionResult | null {
        // 1. Resolve Question
        const question = this.questions.find(q => q.id === questionId);
        if (!question) {
            console.error(`Question ${questionId} not found.`);
            return null;
        }

        const concepts: ConceptResult[] = [];

        // 2. Resolve Vocabulary
        for (const vocabId of question.vocabulary) {
            const vocab = this.vocabularies.find(v => v.id === vocabId);
            if (!vocab) {
                console.warn(`Vocabulary ${vocabId} not found for Question ${questionId}. Skipping.`);
                continue;
            }

            const patternResults: PatternResult[] = [];

            // 3. Resolve Patterns
            for (const patternId of vocab.patterns) {
                const patternDef = this.patterns.find(p => p.id === patternId);
                if (!patternDef) {
                    console.warn(`Pattern ${patternId} not found for Vocabulary ${vocabId}. Skipping.`);
                    continue;
                }

                // 4. Resolve Detector via Factory
                const detector = this.detectorFactory.getDetector(patternDef.detectorId);
                if (!detector) {
                    console.warn(`Detector ${patternDef.detectorId} not registered for Pattern ${patternId}. Skipping.`);
                    continue;
                }

                // Execute the detector
                const findings = detector.detect(valContext, simContext);
                
                // Aggregate internal pattern findings
                patternResults.push({
                    patternId: patternId,
                    findings: findings
                });
            }

            // Aggregate concept findings
            concepts.push({
                vocabularyId: vocab.id,
                patterns: patternResults
            });
        }

        // Return final QuestionResult deliverable
        return {
            questionId: question.id,
            concepts: concepts
        };
    }
}
