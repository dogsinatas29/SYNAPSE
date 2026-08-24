import { ProblemGroup, RiskType, EvidenceType } from './types';
import { SimulationContext } from '../../types/schema';
import { SemanticFinding } from '../analysis/types';
import { Logger } from '../../utils/Logger';

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
                let isIntendedHub = false;
                let isUnknownHub = false;

                if (semanticContext) {
                    const keys = semanticContext.getAllBoundaries().map((b: any) => b.id);
                    Logger.info(`[SEMANTIC_LOOKUP_DUMP] Available boundaries: ${JSON.stringify(keys)}`);
                    
                    const boundary = semanticContext.getBoundaryForNode(group.id);
                    Logger.info(`[SEMANTIC_LOOKUP] ${group.id} => ${boundary?.id ?? 'MISS'}`);
                    
                    if (boundary) {
                        const strength = boundary.strength;
                        
                        group.boundaryContext = {
                            id: boundary.id,
                            strength: strength,
                            size: boundary.size
                        };

                        if (strength === 'Strong' || strength === 'Moderate') {
                            isIntendedHub = true;
                        } else {
                            isUnknownHub = true;
                        }
                    }
                }

                if (isIntendedHub) {
                    tags.push(RiskType.INTENDED_HUB);
                } else if (isUnknownHub) {
                    tags.push(RiskType.UNKNOWN_HUB);
                } else {
                    tags.push(RiskType.ARCHITECTURAL_HUB);
                }
            }

            if (tags.length === 0) {
                tags.push(RiskType.NORMAL);
            }

            // The primary risk type is the most severe defect present, prioritizing in order of severity
            if (tags.includes(RiskType.INTENDED_HUB)) {
                group.primaryRiskType = RiskType.INTENDED_HUB;
            } else if (tags.includes(RiskType.UNKNOWN_HUB)) {
                group.primaryRiskType = RiskType.UNKNOWN_HUB;
            } else if (tags.includes(RiskType.STRUCTURAL_DEFECT)) {
                group.primaryRiskType = RiskType.STRUCTURAL_DEFECT;
            } else if (tags.includes(RiskType.BOUNDARY_ISSUE)) {
                group.primaryRiskType = RiskType.BOUNDARY_ISSUE;
            } else if (tags.includes(RiskType.ARCHITECTURAL_HUB)) {
                group.primaryRiskType = RiskType.ARCHITECTURAL_HUB;
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
