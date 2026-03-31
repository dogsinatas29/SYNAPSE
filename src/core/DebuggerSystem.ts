import { phaseManager, Phase } from './PhaseManager';
import { controlSystem } from './ControlSystem';
import { rendererCore } from './RendererCore';

/**
 * 🔍 SYNAPSE Debugger System (v0.3.1)
 * 
 * 시스템의 전체적인 상태(Phase, Performance, Stability)를 진단하고
 * 시각적 오버레이를 위한 데이터를 집계한다.
 * Phase 6 (DEBUG) 담당.
 */

export interface DebuggerState {
  currentPhase: string;
  isLocked: boolean;
  lockReason: string | null;
  tickCount: number;
  renderBudget: any;
  timestamp: number;
  performanceMode: 'Normal' | 'Degraded';
}

export class DebuggerSystem {
  /**
   * 최신 시스템 진단 데이터 생성
   */
  public getSnapshot(): DebuggerState {
    const phaseInt = phaseManager.getCurrentPhase();
    const phaseName = Phase[phaseInt] || 'UNKNOWN';
    
    // Renderer 정보 (마지막 결과 기반이나 직접 조회)
    // 여기서는 간단하게 RendererCore의 상태를 가져옴
    const budget = (rendererCore as any).lastBudgetReport || { threshold: 0.5 };

    return {
      currentPhase: `PHASE ${phaseInt}: ${phaseName}`,
      isLocked: phaseManager.isLocked(),
      lockReason: (phaseManager as any).lockReason || null,
      tickCount: controlSystem.getTickCount(),
      renderBudget: budget,
      timestamp: Date.now(),
      performanceMode: budget.threshold > 0.6 ? 'Degraded' : 'Normal'
    };
  }

  /**
   * DEBUG Phase 진입 및 도구 실행 (Phase 6 강제)
   */
  public runDebugTools() {
    phaseManager.assertPhase(Phase.RENDER); // Render 이후여야 함
    if (phaseManager.getCurrentPhase() < Phase.DEBUG) {
      phaseManager.advancePhase(Phase.DEBUG);
    }
    console.log('[SYNAPSE] Debug Tools Running...');
  }
}

export const debuggerSystem = new DebuggerSystem();
