import { FrontierResult, RiskVector, PartitionResult } from './types';
import { Logger } from '../../utils/Logger';

export class FrontierPartitioner {
    public partition(
        result: FrontierResult,
        allVectors: RiskVector[]
    ): PartitionResult {
        Logger.info(`[FRONTIER_PARTITIONER] start. Frontier: ${result.frontier.length}, Dominated: ${result.dominated.length}`);

        // Frontier: NEVER truncated (Preservation Invariant)
        // Display window applied at Report Layer only
        const frontier = result.frontier;

        // WatchList: non-frontier with any signal, capped at 15
        const watchList = result.dominated
            .filter(v => v.boundary > 0 || v.cycle > 0 || v.coupling > 0 || v.authority > 0)
            .slice(0, 15);

        // InfoList: INTENDED_HUB groups, capped at 20
        const infoList = allVectors.filter(v => v.isIntendedHub).slice(0, 20);

        // ExternalPressures: handled separately by category
        const externalPressures: RiskVector[] = [];

        Logger.info(`[FRONTIER_PARTITIONER] end. Frontier: ${frontier.length}, WatchList: ${watchList.length}, InfoList: ${infoList.length}`);
        return { frontier, watchList, infoList, externalPressures };
    }
}
