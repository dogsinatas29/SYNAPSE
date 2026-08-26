export interface StabilityRunResult {
  runId: number;
  amplificationFactor: number;
  executionTimeMs: number;
  coverageRetention: number;
  ciiReduction: number;
}

export interface StabilityReport {
  target: string;
  runs: number;
  amplification: {
    mean: number;
    stddev: number;
    cv: number; // Coefficient of Variation
    passed: boolean;
  };
  executionTime: {
    mean: number;
    stddev: number;
    cv: number;
    passed: boolean;
  };
  coverage: {
    max: number;
    min: number;
    drift: number;
    passed: boolean;
  };
  cii: {
    max: number;
    min: number;
    drift: number;
    passed: boolean;
  };
  overallPassed: boolean;
  failureReport?: string; // Failure report block
}

export class DeterministicStabilityRunner {
  private runs: Map<string, StabilityRunResult[]> = new Map();

  public recordRun(target: string, result: StabilityRunResult): void {
    if (result.runId === 0) return; // Discard Warm-up Run (Run0)

    const existing = this.runs.get(target) || [];
    existing.push(result);
    this.runs.set(target, existing);
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0;
    // Use (N - 1) for sample standard deviation
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const sumSquareDiff = squareDiffs.reduce((a, b) => a + b, 0);
    return Math.sqrt(sumSquareDiff / (values.length - 1));
  }

  public generateReport(target: string): StabilityReport | null {
    const results = this.runs.get(target);
    if (!results || results.length === 0) return null;

    const n = results.length;

    // Amplification
    const amps = results.map(r => r.amplificationFactor);
    const ampMean = this.calculateMean(amps);
    const ampStddev = this.calculateStdDev(amps, ampMean);
    const ampCv = ampMean > 0 ? (ampStddev / ampMean) : 0;

    // Execution Time
    const times = results.map(r => r.executionTimeMs);
    const timeMean = this.calculateMean(times);
    const timeStddev = this.calculateStdDev(times, timeMean);
    const timeCv = timeMean > 0 ? (timeStddev / timeMean) : 0;

    // Coverage (Drift)
    const covs = results.map(r => r.coverageRetention);
    const covMax = Math.max(...covs);
    const covMin = Math.min(...covs);
    const covDrift = covMax - covMin;

    // CII (Drift)
    const ciis = results.map(r => r.ciiReduction);
    const ciiMax = Math.max(...ciis);
    const ciiMin = Math.min(...ciis);
    const ciiDrift = ciiMax - ciiMin;

    const ampPassed = ampCv < 0.01; // < 1%
    const timePassed = timeCv < 0.05; // < 5%
    const covPassed = covDrift < 0.01; // < 1%
    const ciiPassed = ciiDrift < 0.02; // < 2%

    const overallPassed = ampPassed && timePassed && covPassed && ciiPassed;
    let failureReport: string | undefined;

    if (!overallPassed) {
      if (!ampPassed) {
        failureReport = `Deterministic Failure Report\nCategory: AMPLIFICATION_VARIANCE\nArtifact/Metric: Amplification CV\nRun: N/A\nExpected: < 1%\nActual: ${(ampCv * 100).toFixed(2)}%`;
      } else if (!timePassed) {
        failureReport = `Deterministic Failure Report\nCategory: EXECUTION_TIME_VARIANCE\nArtifact/Metric: Execution Time CV\nRun: N/A\nExpected: < 5%\nActual: ${(timeCv * 100).toFixed(2)}%`;
      } else if (!covPassed) {
        failureReport = `Deterministic Failure Report\nCategory: COVERAGE_DRIFT\nArtifact/Metric: Coverage Drift\nRun: N/A\nExpected: < 1%\nActual: ${(covDrift * 100).toFixed(2)}%`;
      } else {
        failureReport = `Deterministic Failure Report\nCategory: CII_DRIFT\nArtifact/Metric: CII Drift\nRun: N/A\nExpected: < 2%\nActual: ${(ciiDrift * 100).toFixed(2)}%`;
      }
    }

    return {
      target,
      runs: n,
      amplification: { mean: ampMean, stddev: ampStddev, cv: ampCv, passed: ampPassed },
      executionTime: { mean: timeMean, stddev: timeStddev, cv: timeCv, passed: timePassed },
      coverage: { max: covMax, min: covMin, drift: covDrift, passed: covPassed },
      cii: { max: ciiMax, min: ciiMin, drift: ciiDrift, passed: ciiPassed },
      overallPassed,
      failureReport
    };
  }
}
