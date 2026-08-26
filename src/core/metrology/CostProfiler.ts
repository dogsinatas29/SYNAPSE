import {
  CostType,
  SurvivabilityClass
} from '../../types/metrology';

export interface ExecutionCost {
  costOwner: string;
  costType: CostType;
  selfCostMs: number;
  inclusiveCostMs: number;
  inputSize: number;
  memoryUsageMb: number;
  survivabilityClass: SurvivabilityClass;
}

export class CostProfiler {
  private profiles: Map<string, ExecutionCost> = new Map();

  public recordCost(profile: ExecutionCost): void {
    // We use a composite key to uniquely identify the exact bottleneck point
    const key = `${profile.costOwner}_${profile.costType}`;
    this.profiles.set(key, profile);
  }

  public generateCostProfile(): Record<string, ExecutionCost> {
    return Object.fromEntries(this.profiles);
  }
}
