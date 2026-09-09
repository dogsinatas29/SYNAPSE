import { ProjectContextDetector, ProfileResolutionResult } from './ProjectContextDetector';

export interface SemanticClassification {
    semanticRole: string;
    confidence: number;
    evidence: { source: string; score: number }[];
    sourceRuleId: string;
}

export class SemanticClassifier {
    static getProfile(resolution: ProfileResolutionResult): any | null {
        return null;
    }

    static classify(filePath: string, profile: any | null): SemanticClassification {
        if (!profile) {
            return {
                semanticRole: 'UNKNOWN',
                confidence: 0,
                evidence: [{ source: 'No Profile', score: 0 }],
                sourceRuleId: 'NONE'
            };
        }

        // Apply rules in order
        for (const rule of profile.semanticRules) {
            const isMatch = typeof rule.pattern === 'string' 
                ? filePath.includes(rule.pattern)
                : rule.pattern.test(filePath);
                
            if (isMatch) {
                return {
                    semanticRole: rule.targetRole,
                    confidence: 1.0,
                    evidence: [{ source: `Matched rule pattern: ${rule.pattern}`, score: 1.0 }],
                    sourceRuleId: rule.ruleId
                };
            }
        }

        return {
            semanticRole: 'UNCLASSIFIED',
            confidence: 0,
            evidence: [{ source: 'No rule matched', score: 0 }],
            sourceRuleId: 'NONE'
        };
    }
}
