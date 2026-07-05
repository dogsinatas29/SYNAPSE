import { Intent, createIntent } from './Intent';
import { RuleEngine, FinalVerdict } from './RuleEngine';
import { StateManager, CanvasState } from './StateManager';
import { ValidationHarness } from './ValidationHarness';
import { SpatialRuleBook } from './SpatialRuleBook';
import { VisualRuleBook } from './VisualRuleBook';

import { PhaseGate } from './PhaseGate';
import { executionLayer } from '../transaction/ExecutionLayer';

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
    // [v0.3.32] 트랜잭션 오케스트레이션: CONNECT_EDGE / DELETE_EDGE에 대해 물리 파일 변이 우선 수행
    if (intent.type === 'CONNECT_EDGE' || intent.type === 'DELETE_EDGE') {
      try {
        const payload = intent.payload;
        // Payload에서 환경 정보 추출 (CanvasPanel에서 주입해야 함)
        const projectRoot = payload.projectRoot || '';
        const isEditLogicMode = payload.isEditLogicMode || false;

        let execResult;
        if (intent.type === 'CONNECT_EDGE') {
          // payload is an Edge
          execResult = executionLayer.connectEdge(payload, projectRoot, isEditLogicMode);
        } else if (intent.type === 'DELETE_EDGE') {
          // payload has { from, to, fromFile?, toFile?, toNodeId? }
          const edgeState = Object.values(this.stateManager.getSnapshot().edges).find((e: any) => e.id === payload.id || (e.from === payload.from && e.to === payload.to)) as any;
          const fromFile = payload.fromFile || edgeState?._fromFile || null;
          const toFile = payload.toFile || edgeState?._toFile || null;
          const toNodeId = payload.toNodeId || edgeState?.to || null;
          execResult = executionLayer.disconnectEdge(fromFile, toFile, projectRoot, isEditLogicMode, toNodeId);
        }

        if (execResult && !execResult.success) {
          return {
            ok: false,
            state: this.stateManager.getSnapshot(),
            verdict: { allowed: false, reasons: [execResult.message || 'ExecutionLayer Source Mutation Failed'], stage: 'execution' }
          };
        }
      } catch (e: any) {
        console.error(`[SYNAPSE] ExecutionLayer Transaction Failed:`, e);
        return {
          ok: false,
          state: this.stateManager.getSnapshot(),
          verdict: { allowed: false, reasons: [`Source Mutation Exception: ${e.message}`], stage: 'execution' }
        };
      }
    }

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
