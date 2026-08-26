import { DeterministicStabilityRunner } from '../DeterministicStabilityRunner';

describe('DeterministicStabilityRunner', () => {
  let runner: DeterministicStabilityRunner;

  beforeEach(() => {
    runner = new DeterministicStabilityRunner();
  });

  test('Fails when Amplification CV > 1%', () => {
    runner.recordRun('Linux', { runId: 1, amplificationFactor: 18.0, executionTimeMs: 1500, coverageRetention: 0.965, ciiReduction: 0.68 });
    runner.recordRun('Linux', { runId: 2, amplificationFactor: 18.5, executionTimeMs: 1510, coverageRetention: 0.965, ciiReduction: 0.68 }); // CV ~ 1.9%
    
    const report = runner.generateReport('Linux');
    expect(report?.amplification.passed).toBe(false);
    expect(report?.overallPassed).toBe(false);
  });

  test('Passes when Amplification CV < 1% and all other drifts are low', () => {
    runner.recordRun('Linux', { runId: 1, amplificationFactor: 18.0, executionTimeMs: 1500, coverageRetention: 0.965, ciiReduction: 0.68 });
    runner.recordRun('Linux', { runId: 2, amplificationFactor: 18.01, executionTimeMs: 1505, coverageRetention: 0.965, ciiReduction: 0.68 }); // Very tight
    
    const report = runner.generateReport('Linux');
    expect(report?.amplification.passed).toBe(true);
    expect(report?.overallPassed).toBe(true);
  });

  test('Fails when Coverage Drift > 1%', () => {
    runner.recordRun('VSCode', { runId: 1, amplificationFactor: 4.5, executionTimeMs: 1000, coverageRetention: 0.98, ciiReduction: 0.68 });
    runner.recordRun('VSCode', { runId: 2, amplificationFactor: 4.5, executionTimeMs: 1000, coverageRetention: 0.965, ciiReduction: 0.68 }); // Drift = 0.015 (1.5%)
    
    const report = runner.generateReport('VSCode');
    expect(report?.coverage.passed).toBe(false);
    expect(report?.overallPassed).toBe(false);
  });

  test('Fails when Execution Time CV > 5%', () => {
    runner.recordRun('Linux', { runId: 1, amplificationFactor: 18.0, executionTimeMs: 1000, coverageRetention: 0.965, ciiReduction: 0.68 });
    runner.recordRun('Linux', { runId: 2, amplificationFactor: 18.0, executionTimeMs: 1100, coverageRetention: 0.965, ciiReduction: 0.68 }); // CV = ~7%
    
    const report = runner.generateReport('Linux');
    expect(report?.executionTime.passed).toBe(false);
    expect(report?.overallPassed).toBe(false);
  });
});
