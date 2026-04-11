import { Intent, createIntent } from './Intent';
import { RuleEngine, FinalVerdict } from './RuleEngine';
import { StateManager, CanvasState } from './StateManager';
import { ValidationHarness } from './ValidationHarness';
import { SpatialRuleBook } from './SpatialRuleBook';
import { VisualRuleBook } from './VisualRuleBook';

import { PhaseGate } from './PhaseGate';

/**
 * 🎨 SYNAPSE Canvas Engine (v0.3.10)
 * 
 * 시스템의 전체 워크플로우를 관장하는 메인 오케스트레이터.
 * EventHandler → Intent → PhaseGate → RuleEngine → StateManager → Render 과정의 진입점을 제공한다.
 */

export class CanvasEngine {
  private ruleEngine: RuleEngine;
  private stateManager: StateManager;
  private phaseGate: PhaseGate;

  constructor() {
    this.ruleEngine = new RuleEngine();
    this.stateManager = new StateManager();
    this.phaseGate = new PhaseGate();

    // 엔진 초기화 및 규칙 서브 엔진 등록
    this.ruleEngine.register('logic', new ValidationHarness());
    this.ruleEngine.register('spatial', new SpatialRuleBook());
    this.ruleEngine.register('visual', new VisualRuleBook());
  }

  /**
   * ⚡ Core Pipeline: Intent 실행
   * @param intent 실행할 인텐트
   */
  public execute(intent: Intent): { ok: boolean; state: CanvasState; verdict: any } {
    // 1. Phase Gate 검증 (WHEN)
    if (!this.phaseGate.allow(intent)) {
      return { 
        ok: false, 
        state: this.stateManager.getSnapshot(), 
        verdict: { allowed: false, reasons: ['Phase Violation'], stage: 'gate' } 
      };
    }

    // 2. Rule Engine 검증 (IF logically valid - Veto / Priority / Scoring)
    const result = this.ruleEngine.judge(intent, this.stateManager.getSnapshot());

    if (!result.allowed) {
      return { ok: false, state: this.stateManager.getSnapshot(), verdict: result };
    }

    // 3. State Manager를 통한 상태 변이(Mutation) 수행 (DO)
    const newState = this.stateManager.apply(intent);

    return { ok: true, state: newState, verdict: result };
  }

  /**
   * 보조 메서드: Intent 생성과 실행을 한 번에 수행
   */
  public dispatch(type: Intent['type'], payload: Intent['payload']) {
    return this.execute(createIntent(type, payload));
  }

  public getFinalSnapshot(): CanvasState {
    return this.stateManager.getSnapshot();
  }

  public getRawSnapshot(): CanvasState {
    return this.stateManager.getRawSnapshot();
  }

  public loadInitialState(state: any) {
    this.stateManager.load(state);
  }

  public mergeFromScan(state: any) {
    this.stateManager.mergeFromScan(state);
  }
}

export const canvasEngine = new CanvasEngine();
