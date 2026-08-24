import { CompressionResult, PriorityLevel, ProblemGroup } from './types';
import { Logger } from '../../utils/Logger';

export class CompressionEngine {
    
    public compress(groups: ProblemGroup[]): CompressionResult {
        Logger.info('[COMPRESSION] start');
        const result: CompressionResult = {
            immediateActions: [],
            watchList: [],
            infoList: [],
            externalPressures: [],
            ignoredNoiseCount: 0
        };

        for (const group of groups) {
            if (group.category === 'EXTERNAL' || group.category === 'PLATFORM') {
                result.externalPressures.push(group);
                continue;
            }
            if (group.category === 'TESTS' || group.category === 'DOCS') {
                result.ignoredNoiseCount += group.totalImpact;
                continue;
            }

            if (group.priority === PriorityLevel.CRITICAL) {
                // Ensure immediate actions stay focused (e.g. max 3-5)
                if (result.immediateActions.length < 5) {
                    result.immediateActions.push(group);
                } else {
                    result.watchList.push(group);
                }
            } else if (group.priority === PriorityLevel.HIGH || group.priority === PriorityLevel.WATCH) {
                // Cap watchlist to prevent noise
                if (result.watchList.length < 15) {
                    result.watchList.push(group);
                } else {
                    result.ignoredNoiseCount += group.totalImpact;
                }
            } else if (group.priority === PriorityLevel.INFO) {
                // Ensure info list does not become a dump
                if (result.infoList.length < 20) {
                    result.infoList.push(group);
                } else {
                    result.ignoredNoiseCount += group.totalImpact;
                }
            } else {
                result.ignoredNoiseCount += group.totalImpact;
            }
        }

        Logger.info('[COMPRESSION] end');
        return result;
    }
}
