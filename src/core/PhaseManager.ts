/**
 * 🚀 SYNAPSE Phase Manager (v0.3.1)
 * 
 * 정적 상수와 상태를 통해 시스템의 실행 순서를 강제하고 검증한다.
 * Bootstrap Locked의 핵심 구현체.
 */

export enum Phase {
  DATA = 0,
  GRAPH = 1,
  SNAPSHOT = 2,
  CONTROL = 3,
  GRID = 4,
  RENDER = 5,
  DEBUG = 6,
  FINAL = 7
}

class PhaseManager {
  private currentPhase: Phase = Phase.DATA;
  private locked: boolean = false;
  private lockReason: string | null = null;
  public onPhaseAdvance: ((phase: Phase) => void) | null = null;

  public getCurrentPhase(): Phase {
    return this.currentPhase;
  }

  public isLocked(): boolean {
    return this.locked;
  }

  public getLockReason(): string | null {
    return this.lockReason;
  }

  /**
   * 요구되는 Phase 이상인지 확인. 아니면 Exception 발생.
   */
  public assertPhase(required: Phase) {
    if (this.locked) {
      throw new Error(`[SYNAPSE] SYSTEM LOCKED: ${this.lockReason}`);
    }

    if (this.currentPhase < required) {
      throw new Error(
        `[SYNAPSE] PHASE VIOLATION: required=${Phase[required]}, current=${Phase[this.currentPhase]}`
      );
    }
  }

  /**
   * 다음 단계로 전이. 순서가 맞지 않거나 시스템이 locked 상태면 거부.
   */
  public advancePhase(next: Phase) {
    // 🔍 Call Site Identification
    console.trace(
        '[ADVANCE_PHASE_TRACE]',
        {
            current: this.currentPhase,
            target: next
        }
    );

    if (this.locked) return;

    // [v0.3.09_fix] Relaxed transition for recovery
    if (next <= this.currentPhase && next !== Phase.DATA) {
        return; 
    }

    if (next !== this.currentPhase + 1 && next !== Phase.DATA) {
      console.warn(`[SYNAPSE] Non-sequential phase transition: from ${Phase[this.currentPhase]} to ${Phase[next]}`);
    }

    this.currentPhase = next;
    console.log(`[SYNAPSE] Advancing to Phase: ${Phase[next]}`);
    if (this.onPhaseAdvance) {
      this.onPhaseAdvance(next);
    }
  }

  /**
   * [v0.3.09_fix] 강제 Phase 설정 (복구용)
   */
  public setPhase(phase: Phase) {
    this.currentPhase = phase;
    this.locked = false;
    this.lockReason = null;
    console.log(`[SYNAPSE] Phase Force Set: ${Phase[phase]}`);
  }

  /**
   * 치명적 오류 발생 시 시스템을 LOCKED 상태로 전환
   */
  public lockSystem(reason: string) {
    console.error(`[SYNAPSE] !!! SYSTEM LOCK !!! Reason: ${reason}`);
    this.locked = true;
    this.lockReason = reason;
  }

  /**
   * 시스템 리셋 (수동 필요)
   */
  public reset() {
    this.currentPhase = Phase.DATA;
    this.locked = false;
    this.lockReason = null;
    console.log(`[SYNAPSE] System Reset.`);
  }
}

export const phaseManager = new PhaseManager();
