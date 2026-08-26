import { ValidationFanoutCause } from '../../../types/metrology';

export interface ValidationFanoutEntry {
  ruleId: string;
  inputEdges: number;
  validationChecks: number;
  fanoutFactor: number;
  cause: ValidationFanoutCause;
}

export interface ValidationFanoutReport {
  traceId: string;
  totalValidationFanout: number;
  rules: ValidationFanoutEntry[];
}

export class ValidationFanoutAnalyzer {
  private records: Map<string, ValidationFanoutEntry[]> = new Map();

  public recordRuleFanout(
    traceId: string, 
    ruleId: string, 
    inputEdges: number, 
    validationChecks: number, 
    cause: ValidationFanoutCause
  ): void {
    const existing = this.records.get(traceId) || [];
    const factor = inputEdges > 0 ? (validationChecks / inputEdges) : 1.0;
    
    existing.push({
      ruleId,
      inputEdges,
      validationChecks,
      fanoutFactor: factor,
      cause
    });

    this.records.set(traceId, existing);
  }

  public generateReport(traceId: string): ValidationFanoutReport | null {
    const rules = this.records.get(traceId);
    if (!rules || rules.length === 0) return null;

    const totalInput = rules.reduce((sum, r) => sum + r.inputEdges, 0);
    const totalChecks = rules.reduce((sum, r) => sum + r.validationChecks, 0);
    const overallFanout = totalInput > 0 ? (totalChecks / totalInput) : 1.0;

    // Sort by fanout factor descending
    rules.sort((a, b) => b.fanoutFactor - a.fanoutFactor);

    return {
      traceId,
      totalValidationFanout: overallFanout,
      rules
    };
  }
}
