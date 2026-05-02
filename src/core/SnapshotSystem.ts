import * as fs from 'fs';
import * as path from 'path';
import { phaseManager, Phase } from './PhaseManager';
import { graphModel, GraphSnapshot } from './GraphModel';
import { BlacklistOrchestrator } from './BlacklistOrchestrator';

/**
 * 📸 SYNAPSE Snapshot System (v0.3.1)
 * 
 * 현재 그래프의 상태를 스냅샷으로 저장 및 복구한다.
 * Phase 2 (SNAPSHOT) 담당.
 */

export class SnapshotSystem {
  private lastSnapshot: GraphSnapshot | null = null;
  private historyPath: string | null = null;

  /**
   * [v0.3.23] Handle blacklist change via Orchestrator
   */
  public onBlacklistChanged(orchestrator: BlacklistOrchestrator) {
    orchestrator.handleBlacklistChanged();
  }

  public setStoragePath(projectRoot: string) {
    this.historyPath = path.join(projectRoot, 'data', 'synapse_history.json');
    if (!fs.existsSync(path.dirname(this.historyPath))) {
      fs.mkdirSync(path.dirname(this.historyPath), { recursive: true });
    }
  }

  /**
   * 현재 상태를 스냅샷으로 저장
   */
  public save(): GraphSnapshot {
    try {
      phaseManager.assertPhase(Phase.SNAPSHOT);
      const snapshot = graphModel.createSnapshot();
      this.lastSnapshot = snapshot;

      if (this.historyPath) {
        let history: any[] = [];
        if (fs.existsSync(this.historyPath)) {
          try {
            history = JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
          } catch (e) {
            history = [];
          }
        }
        history.push({
          id: `snap_${Date.now()}`,
          timestamp: Date.now(),
          data: snapshot
        });
        
        // Keep only last 10 snapshots for efficiency
        if (history.length > 10) history.shift();
        
        fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2), 'utf8');
      }

      console.log(`[SYNAPSE] Graph Snapshot Saved & Persisted (Nodes: ${snapshot.nodes.length})`);
      return snapshot;
    } catch (e: any) {
      phaseManager.lockSystem(`SNAPSHOT_SAVE FAILURE: ${e.message}`);
      throw e;
    }
  }

  /**
   * 저장된 스냅샷으로 복구 (테스트 및 롤백용)
   */
  public restore(snapshot?: GraphSnapshot): GraphSnapshot {
    try {
      phaseManager.assertPhase(Phase.SNAPSHOT);
      const target = snapshot || this.lastSnapshot;
      
      if (!target) {
        throw new Error("No snapshot available to restore.");
      }
      
      graphModel.restoreSnapshot(target);
      this.lastSnapshot = target;
      
      console.log(`[SYNAPSE] Graph Snapshot Restored.`);
      return target;
    } catch (e: any) {
      phaseManager.lockSystem(`SNAPSHOT_RESTORE FAILURE: ${e.message}`);
      throw e;
    }
  }
  /**
   * 스냅샷 검증 (Phase Validation 용)
   */
  public validate(): boolean {
    return this.lastSnapshot !== null || (this.historyPath !== null && fs.existsSync(this.historyPath));
  }
}

export const snapshotSystem = new SnapshotSystem();
