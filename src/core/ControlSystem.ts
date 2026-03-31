import { phaseManager, Phase } from './PhaseManager';
import { snapshotSystem } from './SnapshotSystem';
import { graphModel } from './GraphModel';

/**
 * 🕹️ SYNAPSE Control System (v0.3.1)
 * 
 * 이벤트 루프, 틱 안정성 및 사용자 인터렉션을 제어한다.
 * "Sovereign Control" 원칙에 따라 모든 상태 변경 명령을 검증한다.
 * Phase 3 (CONTROL) 담당.
 */

export class ControlSystem {
  private isRunning: boolean = false;
  private tickCount: number = 0;
  private lastTickTime: number = 0;
  private readonly MAX_TICK_DURATION = 1000 / 60; // 60 FPS (approx 16.6ms)

  /**
   * 이벤트 루프 초기화 및 실행 (Sovereign Control 시그널 활성화)
   */
  public runEventLoop() {
    try {
      // 1. Snapshot이 선행되어야 함 (Phase 2 확인)
      if (!snapshotSystem.validate()) {
        throw new Error("No valid snapshot before running event loop.");
      }

      // 2. Phase 3 진입
      if (phaseManager.getCurrentPhase() < Phase.CONTROL) {
        phaseManager.advancePhase(Phase.CONTROL);
      }
      
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastTickTime = Date.now();
      
      console.log(`[SYNAPSE] Sovereign Control System Active.`);
      this.tick();
    } catch (e: any) {
      phaseManager.lockSystem(`CONTROL FAILURE: ${e.message}`);
      throw e;
    }
  }

  /**
   * 사용자 인터렉션 검증 (Gatekeeper)
   * @param command 실행하려는 명령 (예: 'createEdge', 'moveNode')
   */
  public verifyInteraction(command: string): boolean {
    if (phaseManager.isLocked()) {
      console.error(`[SYNAPSE] Interaction BLOCKED: System is LOCKED.`);
      return false;
    }

    // Phase 3 (CONTROL) 이상에서만 인터렉션 허용
    if (phaseManager.getCurrentPhase() < Phase.CONTROL) {
      console.error(`[SYNAPSE] Interaction BLOCKED: Current Phase is ${phaseManager.getCurrentPhase()}. Need Phase 3 (CONTROL).`);
      return false;
    }

    console.log(`[SYNAPSE] Interaction APPROVED: ${command}`);
    return true;
  }

  /**
   * 단일 틱 수행 (순차적 실행 및 시간 제한)
   */
  private tick() {
    if (!this.isRunning || phaseManager.isLocked()) return;
    
    const startTime = Date.now();
    this.tickCount++;

    // [v0.3.1] Control Logic: Stability Check
    // 여기서 비주얼 틱과 로직 틱의 동기화를 관리함
    
    const duration = Date.now() - startTime;
    this.lastTickTime = Date.now();

    // 60fps 유지 시도
    const timeout = Math.max(0, this.MAX_TICK_DURATION - duration);
    setTimeout(() => this.tick(), timeout);
  }

  public stop() {
    this.isRunning = false;
    console.log(`[SYNAPSE] Sovereign Control Stopped.`);
  }

  public getTickCount(): number {
    return this.tickCount;
  }
}

export const controlSystem = new ControlSystem();
