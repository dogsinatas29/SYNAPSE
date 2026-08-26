import { AmplificationPathAnalyzer } from '../AmplificationPathAnalyzer';
import { AmplificationCause } from '../../../../types/metrology';

describe('AmplificationPathAnalyzer', () => {
  let analyzer: AmplificationPathAnalyzer;

  beforeEach(() => {
    analyzer = new AmplificationPathAnalyzer();
  });

  test('Tracks phases, calculates factors correctly, and tags cause', () => {
    analyzer.recordPhase('LinuxScan', { phase: 'InputNodes', count: 100 }, AmplificationCause.UNKNOWN);
    analyzer.recordPhase('LinuxScan', { phase: 'SignalNodes', count: 150 }, AmplificationCause.UNKNOWN); // 1.5x
    analyzer.recordPhase('LinuxScan', { phase: 'VirtualEdges', count: 3000 }, AmplificationCause.CROSS_PRODUCT); // 20x
    analyzer.recordPhase('LinuxScan', { phase: 'ValidationEdges', count: 15000 }, AmplificationCause.VALIDATION_FANOUT); // 5x
    analyzer.recordPhase('LinuxScan', { phase: 'FinalObjects', count: 19000 }, AmplificationCause.UNKNOWN); // ~1.26x

    const report = analyzer.generateReport('LinuxScan');
    expect(report).not.toBeNull();
    if (report) {
      expect(report.totalInput).toBe(100);
      expect(report.totalFinal).toBe(19000);
      expect(report.overallAmplification).toBe(190);

      const topOffenders = analyzer.getTopOffenders('LinuxScan');
      expect(topOffenders[0].phase).toBe('VirtualEdges');
      expect(topOffenders[0].factor).toBe(20);
      expect(topOffenders[0].cause).toBe(AmplificationCause.CROSS_PRODUCT);
      
      expect(topOffenders[1].phase).toBe('ValidationEdges');
      expect(topOffenders[1].factor).toBe(5);
      expect(topOffenders[1].cause).toBe(AmplificationCause.VALIDATION_FANOUT);
    }
  });

  test('Gracefully handles zero input count', () => {
    analyzer.recordPhase('EmptyScan', { phase: 'Input', count: 0 });
    analyzer.recordPhase('EmptyScan', { phase: 'Signals', count: 0 });
    const report = analyzer.generateReport('EmptyScan');
    expect(report?.overallAmplification).toBe(1);
  });
});
