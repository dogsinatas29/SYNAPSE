import { PipelinePhase } from '../../types/metrology';

export class AmplificationTracker {
  private pipelineTraces: Map<string, PipelinePhase[]> = new Map();

  public recordTrace(traceId: string, phases: PipelinePhase[]): void {
    // A traceId might be something like "AST_TO_GRAPH" or "FULL_EXTRACTION_PIPELINE"
    this.pipelineTraces.set(traceId, phases);
  }

  public detectExplosion(traceId: string, thresholdRatio: number = 10): boolean {
    const phases = this.pipelineTraces.get(traceId);
    if (!phases || phases.length < 2) return false;

    const inputSize = phases[0].count;
    const finalSize = phases[phases.length - 1].count;

    // Avoid division by zero
    if (inputSize === 0) return finalSize > 0;

    return (finalSize / inputSize) >= thresholdRatio;
  }

  public generateAmplificationProfile(): Record<string, PipelinePhase[]> {
    return Object.fromEntries(this.pipelineTraces);
  }
}
