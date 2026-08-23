import { ProblemGroup, RiskType } from './types';
import { Logger } from '../../utils/Logger';

export class RiskClassifier {
    public classify(groups: ProblemGroup[]): ProblemGroup[] {
        Logger.info('[RISK_CLASSIFIER] start');
        for (const group of groups) {
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
                tags.push(RiskType.ARCHITECTURAL_HUB);
            }

            if (tags.length === 0) {
                tags.push(RiskType.NORMAL);
            }

            // The primary risk type is the most severe defect present, prioritizing in order of severity
            if (tags.includes(RiskType.STRUCTURAL_DEFECT)) {
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
        return groups;
    }
}
