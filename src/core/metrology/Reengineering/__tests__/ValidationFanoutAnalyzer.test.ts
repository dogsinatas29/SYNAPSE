import { ValidationFanoutAnalyzer } from '../ValidationFanoutAnalyzer';
import { ValidationFanoutCause } from '../../../../types/metrology';

describe('ValidationFanoutAnalyzer', () => {
  let analyzer: ValidationFanoutAnalyzer;

  beforeEach(() => {
    analyzer = new ValidationFanoutAnalyzer();
  });

  test('Calculates and sorts fanout correctly', () => {
    analyzer.recordRuleFanout('Scan1', 'RuleA', 100, 450, ValidationFanoutCause.DUPLICATE_RULE_APPLICATION); // 4.5x
    analyzer.recordRuleFanout('Scan1', 'RuleB', 200, 600, ValidationFanoutCause.RECURSIVE_VALIDATION); // 3.0x
    analyzer.recordRuleFanout('Scan1', 'RuleC', 50, 50, ValidationFanoutCause.UNKNOWN); // 1.0x

    const report = analyzer.generateReport('Scan1');
    expect(report).not.toBeNull();
    
    if (report) {
      expect(report.totalValidationFanout).toBeCloseTo((450 + 600 + 50) / (100 + 200 + 50));
      expect(report.rules[0].ruleId).toBe('RuleA');
      expect(report.rules[0].fanoutFactor).toBe(4.5);
      expect(report.rules[1].ruleId).toBe('RuleB');
      expect(report.rules[1].fanoutFactor).toBe(3.0);
    }
  });

  test('Handles zero input correctly', () => {
    analyzer.recordRuleFanout('ScanEmpty', 'RuleZ', 0, 0, ValidationFanoutCause.UNKNOWN);
    const report = analyzer.generateReport('ScanEmpty');
    expect(report?.totalValidationFanout).toBe(1.0);
  });
});
