import { PatternFinding } from '../patterns/PatternDetector';

/**
 * Open IP: User Configurable Questions
 */
export interface QuestionDefinition {
    id: string;
    title: string;
    vocabulary: string[];
}

/**
 * Open IP: Semantic Mapping (Vocabulary -> Pattern IDs)
 */
export interface VocabularyDefinition {
    id: string;
    patterns: string[];
}

/**
 * Protected IP: Internal Engine Mapping (Pattern ID -> Detector ID)
 */
export interface PatternDefinition {
    id: string;
    detectorId: string;
}

/**
 * Result Structure: Internal grouping of findings by Pattern
 */
export interface PatternResult {
    patternId: string;
    findings: PatternFinding[];
}

/**
 * Result Structure: User-facing grouping by Vocabulary Concept
 */
export interface ConceptResult {
    vocabularyId: string;
    patterns: PatternResult[]; // Kept for debugging/internal tracking as requested by user
}

/**
 * Final Deliverable for a Diagnostic Pipeline execution
 */
export interface QuestionResult {
    questionId: string;
    concepts: ConceptResult[];
}
