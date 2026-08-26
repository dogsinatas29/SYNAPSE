import { BenchmarkSnapshot } from '../../types/metrology';
import { BlindSpotMapper } from './BlindSpotMapper';
import { AgreementMatrixBuilder } from './AgreementMatrixBuilder';
import { CostProfiler } from './CostProfiler';
import { AmplificationTracker } from './AmplificationTracker';

export class BenchmarkSnapshotter {
  public createSnapshot(
    benchmarkName: string,
    version: string,
    blindSpotMapper: BlindSpotMapper,
    agreementMatrixBuilder: AgreementMatrixBuilder,
    costProfiler: CostProfiler,
    amplificationTracker: AmplificationTracker,
    primaryTraceId: string // The main trace to extract amplification from
  ): BenchmarkSnapshot {
    return {
      benchmark: benchmarkName,
      version: version,
      timestamp: new Date().toISOString(),
      coverage: {
        topology: blindSpotMapper.generateTopologyMap(),
        agreement: agreementMatrixBuilder.generateMatrix()
      },
      amplification: amplificationTracker.generateAmplificationProfile()[primaryTraceId] || [],
      cost: costProfiler.generateCostProfile()
    };
  }

  public exportSnapshot(snapshot: BenchmarkSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
  }
}
