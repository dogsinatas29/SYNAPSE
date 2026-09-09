import { BaselineTruth, BaselineTruthDataset, EntryTruth, SemanticTruth } from './BaselineTruthDataset';
import { SemanticClassification } from '../analysis/semantic/SemanticClassifier';

export enum MatchResult {
    CORRECT = 'CORRECT',
    UNKNOWN = 'UNKNOWN',
    INCORRECT = 'INCORRECT'
}

export interface AccuracyReport {
    totalEvaluated: number;
    correct: number;
    unknown: number;
    incorrect: number;
    accuracy: number;
    precision: number;
    ruleAccuracy: Record<string, { correct: number; incorrect: number; unknown: number }>;
}

export class AccuracyBenchmark {
    static evaluateEntryPoint(
        truth: EntryTruth,
        detectedFile?: string,
        detectedSymbol?: string
    ): MatchResult {
        if (!detectedFile || !detectedSymbol) {
            return MatchResult.UNKNOWN; // Unknown is explicitly handled, not an incorrect failure
        }
        
        if (detectedFile === truth.expectedEntryFile && detectedSymbol === truth.expectedEntrySymbol) {
            return MatchResult.CORRECT;
        }
        
        return MatchResult.INCORRECT;
    }

    static evaluateSemanticClassification(
        truth: SemanticTruth,
        classification: SemanticClassification
    ): MatchResult {
        if (classification.semanticRole === 'UNCLASSIFIED' || classification.semanticRole === 'UNKNOWN') {
            return MatchResult.UNKNOWN;
        }
        
        if (classification.semanticRole === truth.expectedRole) {
            return MatchResult.CORRECT;
        }
        
        return MatchResult.INCORRECT;
    }
    
    static generateReport(
        profileId: string, 
        entryDetections: { file?: string, symbol?: string }[], 
        semanticDetections: { filePath: string, classification: SemanticClassification }[]
    ): AccuracyReport {
        const truth = BaselineTruthDataset.getTruth(profileId);
        
        const report: AccuracyReport = {
            totalEvaluated: 0,
            correct: 0,
            unknown: 0,
            incorrect: 0,
            accuracy: 0,
            precision: 0,
            ruleAccuracy: {}
        };
        
        if (!truth) return report;
        
        // 1. Evaluate Entry Points
        for (const entryTruth of truth.entryPoints) {
            const det = entryDetections.length > 0 ? entryDetections[0] : {};
            const result = this.evaluateEntryPoint(entryTruth, det.file, det.symbol);
            this.recordResult(report, result, 'ENTRY_POINT_DETECTOR');
        }
        
        // 2. Evaluate Semantic Classifications
        for (const semTruth of truth.semanticTruths) {
            const matches = semanticDetections.filter(d => 
                typeof semTruth.pattern === 'string' 
                    ? d.filePath.includes(semTruth.pattern)
                    : semTruth.pattern.test(d.filePath)
            );
            
            for (const match of matches) {
                const result = this.evaluateSemanticClassification(semTruth, match.classification);
                this.recordResult(report, result, match.classification.sourceRuleId || 'UNKNOWN_RULE');
            }
        }
        
        // Calculate metrics
        // accuracy = correct / total
        // precision = correct / (correct + incorrect) -> ignores unknowns
        const totalAttempts = report.correct + report.incorrect;
        report.accuracy = report.totalEvaluated > 0 ? report.correct / report.totalEvaluated : 0;
        report.precision = totalAttempts > 0 ? report.correct / totalAttempts : 0;
        
        return report;
    }
    
    private static recordResult(report: AccuracyReport, result: MatchResult, ruleId: string) {
        report.totalEvaluated++;
        
        if (!report.ruleAccuracy[ruleId]) {
            report.ruleAccuracy[ruleId] = { correct: 0, incorrect: 0, unknown: 0 };
        }
        
        if (result === MatchResult.CORRECT) {
            report.correct++;
            report.ruleAccuracy[ruleId].correct++;
        } else if (result === MatchResult.INCORRECT) {
            report.incorrect++;
            report.ruleAccuracy[ruleId].incorrect++;
        } else {
            report.unknown++;
            report.ruleAccuracy[ruleId].unknown++;
        }
    }
}
