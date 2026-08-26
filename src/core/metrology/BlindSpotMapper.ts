import {
  ObservabilityClass,
  CoverageSource,
  StabilityMetric
} from '../../types/metrology';

export interface CoverageData {
  expectedCount: number;
  detectedCount: number;
  coverageSource: CoverageSource;
  metricConfidence: number; // 0.0 to 1.0
  recoverySource?: string;
}

export interface BlindSpotRisk {
  observabilityClass: ObservabilityClass;
  falsePositiveCount: number;
  falseNegativeCount: number;
  blindRisk: number; // typically scales with FN
  misleadingRisk: number; // typically scales with FP, weighted higher
}

export class BlindSpotMapper {
  private stabilityRecords: Map<string, StabilityMetric> = new Map();
  private coverageData: Map<string, CoverageData> = new Map();
  private riskData: Map<string, BlindSpotRisk> = new Map();

  public recordStability(extractorId: string, stability: StabilityMetric): void {
    this.stabilityRecords.set(extractorId, stability);
  }

  public recordCoverage(targetType: string, data: CoverageData): void {
    this.coverageData.set(targetType, data);
  }

  public recordRisk(targetType: string, risk: BlindSpotRisk): void {
    this.riskData.set(targetType, risk);
  }

  public generateTopologyMap(): Record<string, any> {
    return {
      stability: Object.fromEntries(this.stabilityRecords),
      coverage: Object.fromEntries(this.coverageData),
      risk: Object.fromEntries(this.riskData)
    };
  }
}
