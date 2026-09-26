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
            isSystemCore: g.primaryRiskType === RiskType.SYSTEM_CORE
        }));

        Logger.info(`[RISK_VECTOR_BUILDER] end. Vector count: ${vectors.length}`);
        return vectors;
    }
}
