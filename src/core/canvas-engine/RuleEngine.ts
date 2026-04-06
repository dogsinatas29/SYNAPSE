import { Intent } from './Intent';

/**
 * 🛡️ SYNAPSE Rule Engine Specification (v0.3.10)
 * 
 * 논리(Logic), 공간(Spatial), 시각(Visual) 규칙을 검증한다.
 */

export type RuleSource = 'visual' | 'spatial' | 'logic';

export interface RuleVerdict {
  readonly allowed: boolean;
  readonly severity: 'info' | 'warn' | 'critical';
  readonly priority: number;
  readonly score?: number;
  readonly reasons?: string[];
  readonly source: RuleSource;
}

export interface FinalVerdict {
  readonly allowed: boolean;
  readonly selected?: any; // Scoring 결과 선택된 최종 값
  readonly reasons?: string[];
  readonly stage: 'veto' | 'priority' | 'scoring' | 'final';
}

export abstract class RuleSubEngine {
  abstract evaluate(intent: Intent, state: any): RuleVerdict;
}

export class RuleEngine {
  private engines: Map<RuleSource, RuleSubEngine> = new Map();

  public register(source: RuleSource, engine: RuleSubEngine) {
    this.engines.set(source, engine);
  }

  /**
   * ⚖️ Veto -> Priority -> Scoring 단계별 중재(Merger) 로직 수행
   */
  public judge(intent: Intent, state: any): FinalVerdict {
    const verdicts: RuleVerdict[] = [];
    
    // 1. 모든 서브 엔진 평가 (O(1) frame loop 제약 준수 권장)
    for (const [source, engine] of this.engines) {
      verdicts.push(engine.evaluate(intent, state));
    }

    // 2. Stage 1: Veto (Critical Rejection)
    const veto = verdicts.find(v => !v.allowed && v.severity === 'critical');
    if (veto) {
      return { allowed: false, reasons: veto.reasons, stage: 'veto' };
    }

    // 3. Stage 2: Priority (Dominance Resolution)
    // Intent별 가중치가 적용된 Priority 기준 정렬
    const dominant = [...verdicts].sort((a, b) => b.priority - a.priority)[0];
    
    // 4. Stage 3: Scoring (Optimal Selection)
    const optimal = verdicts
      .filter(v => v.allowed)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

    return {
      allowed: dominant.allowed,
      selected: optimal,
      stage: 'final'
    };
  }
}
