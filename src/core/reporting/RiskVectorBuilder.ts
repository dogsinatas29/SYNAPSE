import { ProblemGroup, RiskType, RiskVector } from './types';
import { Logger } from '../../utils/Logger';

export class RiskVectorBuilder {
    public build(groups: ProblemGroup[]): RiskVector[] {
        Logger.info(`[RISK_VECTOR_BUILDER] start. Group count: ${groups.length}`);
        
        const vectors = groups.map(g => ({
            sourceGroup: g,
            boundary: g.boundaryCrossings,
            cycle: g.cycleParticipation,
            coupling: g.fanOut,
            authority: g.blastRadius,
            isIntendedHub: g.primaryRiskType === RiskType.INTENDED_HUB
        }));

        Logger.info(`[RISK_VECTOR_BUILDER] end. Vector count: ${vectors.length}`);
        return vectors;
    }
}
