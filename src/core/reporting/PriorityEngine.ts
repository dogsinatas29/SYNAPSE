import { PriorityLevel, ProblemGroup, RiskType } from './types';
import { Logger } from '../../utils/Logger';

export class PriorityEngine {
    
    // Configurable priority weights
    private readonly WEIGHTS = {
        cycleParticipation: 5.0,  // Cycles are structurally dangerous
        blastRadius: 1.0,         // Base weight per affected downstream file
        boundaryCrossings: 2.0,   // Architecture violation penalty
        fanOut: 0.5               // Maintenance burden
    };

    private readonly THRESHOLDS = {
        CRITICAL: 100,
        HIGH: 50,
        WATCH: 10
    };

    public assignPriorities(groups: ProblemGroup[]): ProblemGroup[] {
        Logger.info('[PRIORITY] start');
        for (const group of groups) {
            const score = this.calculateScore(group);
            if (group.primaryRiskType === RiskType.INTENDED_HUB) {
                // INTENDED_HUB is downgraded to INFO so it is reported but not as a risk
                group.priority = PriorityLevel.INFO;
            } else if (group.primaryRiskType === RiskType.UNKNOWN_HUB) {
                // UNKNOWN_HUB is downgraded to WATCH (it is a hub in a boundary, but the boundary is weak)
                group.priority = score >= this.THRESHOLDS.CRITICAL ? PriorityLevel.WATCH : 
                                 score >= this.THRESHOLDS.HIGH ? PriorityLevel.WATCH : 
                                 score >= this.THRESHOLDS.WATCH ? PriorityLevel.WATCH : PriorityLevel.IGNORE;
            } else {
                if (score >= this.THRESHOLDS.CRITICAL) {
                    group.priority = PriorityLevel.CRITICAL;
                } else if (score >= this.THRESHOLDS.HIGH) {
                    group.priority = PriorityLevel.HIGH;
                } else if (score >= this.THRESHOLDS.WATCH) {
                    group.priority = PriorityLevel.WATCH;
                } else {
                    group.priority = PriorityLevel.IGNORE;
                }
            }
        }
        
        // Sort by priority score descending
        const result = groups.sort((a, b) => this.calculateScore(b) - this.calculateScore(a));
        Logger.info('[PRIORITY] end');
        return result;
    }

    private calculateScore(group: ProblemGroup): number {
        const scaledBlastRadius = Math.log10(group.blastRadius + 1);
        return (group.cycleParticipation * this.WEIGHTS.cycleParticipation) +
               (scaledBlastRadius * this.WEIGHTS.blastRadius) +
               (group.boundaryCrossings * this.WEIGHTS.boundaryCrossings) +
               (group.fanOut * this.WEIGHTS.fanOut);
    }
}
