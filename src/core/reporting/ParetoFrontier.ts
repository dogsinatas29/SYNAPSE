import { RiskVector, FrontierResult } from './types';
import { Logger } from '../../utils/Logger';

export class ParetoFrontier {
    private readonly DIMS = ['boundary', 'cycle', 'coupling', 'authority'] as const;

    public compute(vectors: RiskVector[]): FrontierResult {
        Logger.info(`[PARETO_FRONTIER] start. Vector count: ${vectors.length}`);
        
        // INTENDED_HUB excluded from frontier computation
        const eligible = vectors.filter(v => !v.isIntendedHub);
        // DO NOT SORT FRONTIER
        // Pareto Frontier is an unordered set.
        // Any ordering implies priority ranking and violates
        // Governance Engine design constraints.
        const frontier: RiskVector[] = [];

        for (const a of eligible) {
            const dominated = eligible.some(b => this.dominates(b, a));
            if (!dominated) {
                frontier.push(a);
            }
        }

        const dominated = eligible.filter(v => !frontier.includes(v));
        
        Logger.info(`[PARETO_FRONTIER] end. Frontier size: ${frontier.length}, Dominated size: ${dominated.length}`);
        return { frontier, dominated };
    }

    private dominates(a: RiskVector, b: RiskVector): boolean {
        const allGte = this.DIMS.every(d => a[d] >= b[d]);
        const anyGt = this.DIMS.some(d => a[d] > b[d]);
        return allGte && anyGt;
    }
}
