import { ProblemGroup, RiskType, EvidenceType } from './types';
import { SimulationContext } from '../../types/schema';
import { SemanticFinding } from '../analysis/types';
import { Logger } from '../../utils/Logger';
import { BoundaryPatternDetector } from '../analysis/patterns/detectors/BoundaryPatternDetector';
import { PatternId } from '../analysis/patterns/PatternId';
import { traceDetectorExecution } from '../analysis/pipeline/DiagnosticTracer';

export class RiskClassifier {
    public classify(problemGroups: ProblemGroup[], simContext?: SimulationContext, semanticContext?: any): ProblemGroup[] {
        Logger.info(`[CLASSIFIER] start. Group count: ${problemGroups.length}, SemanticContext provided: ${!!semanticContext}`);
        
        for (const group of problemGroups) {
            const tags: RiskType[] = [];
            
            if (group.category === 'EXTERNAL') {
                tags.push(RiskType.EXTERNAL_PRESSURE);
            }
            if (group.cycleParticipation > 0) {
                tags.push(RiskType.STRUCTURAL_DEFECT);
            }
            if (group.boundaryCrossings > 0) {
                tags.push(RiskType.BOUNDARY_ISSUE);
            }
            if (group.fanOut > 0) {
                let isSystemCore = false;
                let isChangeAmplifier = false;

                if (simContext) {
                    const boundaryDetector = new BoundaryPatternDetector();
                    const boundaryFindings = traceDetectorExecution(PatternId.BOUNDARY_CANDIDATE, 'BoundaryPatternDetector', boundaryDetector, {} as any, simContext);
                    
                    const matchingBoundary = boundaryFindings.find(f => {
                        const members = f.context?.members as string[] | undefined;
                        return members && members.includes(group.id);
                    });
                    
                    if (matchingBoundary) {
                        const patternId = matchingBoundary.patternId;
                        let strength = 'Weak';
                        if (patternId === PatternId.BOUNDARY_FORTRESS) strength = 'Strong';
                        else if (patternId === PatternId.BOUNDARY_CANDIDATE) strength = 'Moderate';
                        
                        const members = matchingBoundary.context?.members as string[] || [];
                        group.boundaryContext = {
                            id: matchingBoundary.targetId as string,
                            strength: strength,
                            size: members.length,
                            internalEdges: 0,
                            externalEdges: 0,
                            inboundEdges: 0,
                            cohesion: 0
                        };

                        if (patternId === PatternId.BOUNDARY_FORTRESS || patternId === PatternId.BOUNDARY_CANDIDATE) {
                            isSystemCore = true;
                        } else {
                            isChangeAmplifier = true;
                        }
                    } else {
                        isChangeAmplifier = true;
                    }
                }

                if (isSystemCore) {
                    tags.push(RiskType.SYSTEM_CORE);
                } else if (isChangeAmplifier) {
                    tags.push(RiskType.CHANGE_AMPLIFIER);
                } else {
                    tags.push(RiskType.CASCADE_FAILURE_POINT);
                }
            }

            if (tags.length === 0) {
                tags.push(RiskType.NORMAL);
            }

            // The primary risk type is the most severe defect present, prioritizing in order of severity
            if (tags.includes(RiskType.SYSTEM_CORE)) {
                group.primaryRiskType = RiskType.SYSTEM_CORE;
            } else if (tags.includes(RiskType.CHANGE_AMPLIFIER)) {
                group.primaryRiskType = RiskType.CHANGE_AMPLIFIER;
            } else if (tags.includes(RiskType.STRUCTURAL_DEFECT)) {
                group.primaryRiskType = RiskType.STRUCTURAL_DEFECT;
            } else if (tags.includes(RiskType.BOUNDARY_ISSUE)) {
                group.primaryRiskType = RiskType.BOUNDARY_ISSUE;
            } else if (tags.includes(RiskType.CASCADE_FAILURE_POINT)) {
                group.primaryRiskType = RiskType.CASCADE_FAILURE_POINT;
            } else if (tags.includes(RiskType.EXTERNAL_PRESSURE)) {
                group.primaryRiskType = RiskType.EXTERNAL_PRESSURE;
            } else {
                group.primaryRiskType = RiskType.NORMAL;
            }

            group.riskTags = tags;
        }
        Logger.info('[RISK_CLASSIFIER] end');
        return problemGroups;
    }
}
