import { AmplificationCause, PipelinePhase } from '../../../types/metrology';

export interface AmplificationPathPhase extends PipelinePhase {
  factor: number;
  cause: AmplificationCause;
}

export interface AmplificationPathReport {
  traceId: string;
  totalInput: number;
  totalFinal: number;
  overallAmplification: number;
  phases: AmplificationPathPhase[];
}

export class AmplificationPathAnalyzer {
  private traces: Map<string, AmplificationPathPhase[]> = new Map();

  public recordPhase(traceId: string, phase: PipelinePhase, cause: AmplificationCause = AmplificationCause.UNKNOWN): void {
    const existing = this.traces.get(traceId) || [];
    
    let factor = 1.0;
    if (existing.length > 0) {
      const prevPhase = existing[existing.length - 1];
      if (prevPhase.count > 0) {
        factor = phase.count / prevPhase.count;
      } else {
        factor = phase.count > 0 ? Number.POSITIVE_INFINITY : 1.0;
      }
    }

    existing.push({
      phase: phase.phase,
      count: phase.count,
      factor: factor,
      cause: cause
    });

    this.traces.set(traceId, existing);
  }

  public generateReport(traceId: string): AmplificationPathReport | null {
    const phases = this.traces.get(traceId);
    if (!phases || phases.length === 0) return null;

    const totalInput = phases[0].count;
    const totalFinal = phases[phases.length - 1].count;
    const overallAmplification = totalInput > 0 ? (totalFinal / totalInput) : (totalFinal > 0 ? Number.POSITIVE_INFINITY : 1.0);

    return {
      traceId,
      totalInput,
      totalFinal,
      overallAmplification,
      phases
    };
  }

  public getTopOffenders(traceId: string): AmplificationPathPhase[] {
    const phases = this.traces.get(traceId) || [];
    // Sort descending by amplification factor
    return [...phases].sort((a, b) => b.factor - a.factor);
  }
}
