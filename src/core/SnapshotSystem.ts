import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { phaseManager, Phase } from './PhaseManager';
import { graphModel, GraphSnapshot } from './GraphModel';
import { BlacklistOrchestrator } from './BlacklistOrchestrator';
import { ProjectMetadata } from './ProjectMetadata';

/**
 * 📸 SYNAPSE Snapshot System (v0.3.30)
 * 
 * 현재 그래프의 상태를 스냅샷으로 저장 및 복구한다.
 * Phase 2 (SNAPSHOT) 담당.
 * 
 * [v0.3.30] Versioned snapshots with metadata and checksum.
 */

export class SnapshotSystem {
  private lastSnapshot: GraphSnapshot | null = null;
  private historyPath: string | null = null;
  private snapshotVersion = 1;
  private static readonly MAX_HISTORY = 20;

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
   * [v0.3.30] Versioned save with metadata and checksum
   */
  public save(): GraphSnapshot {
    try {
      phaseManager.assertPhase(Phase.SNAPSHOT);
      const snapshot = graphModel.createSnapshot();

      snapshot.snapshotVersion = this.snapshotVersion;
      try {
        const meta = ProjectMetadata.getInstance().get();
        snapshot.metadata = {
          projectUUID: meta.projectUUID,
          projectName: meta.projectName,
          snapshotCount: meta.snapshotCount
        };
        ProjectMetadata.getInstance().incrementSnapshotCount();
      } catch {}

      try {
        const serialized = JSON.stringify({ nodes: snapshot.nodes, edges: snapshot.edges, clusters: snapshot.clusters });
        snapshot.checksum = crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
      } catch { snapshot.checksum = ''; }

      this.lastSnapshot = snapshot;

      if (this.historyPath) {
        let history: any[] = [];
        if (fs.existsSync(this.historyPath)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(this.historyPath, 'utf8'));
            history = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            history = [];
          }
        }
        history.push({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          version: this.snapshotVersion,
          checksum: snapshot.checksum,
          nodeCount: snapshot.nodes.length,
          edgeCount: snapshot.edges.length,
          clusterCount: snapshot.clusters.length
        });
        
        if (history.length > SnapshotSystem.MAX_HISTORY) history.shift();
        
        fs.writeFileSync(this.historyPath, JSON.stringify(history, null, 2), 'utf8');
      }

      this.snapshotVersion++;
      console.log(`[SYNAPSE] Graph Snapshot Saved (v${snapshot.snapshotVersion}, Nodes: ${snapshot.nodes.length})`);
      return snapshot;
    } catch (e: any) {
      phaseManager.lockSystem(`SNAPSHOT_SAVE FAILURE: ${e.message}`);
      throw e;
    }
  }

  /**
   * [v0.3.30] Integrity check on restore
   */
  public restore(snapshot?: GraphSnapshot): GraphSnapshot {
    try {
      phaseManager.assertPhase(Phase.SNAPSHOT);
      const target = snapshot || this.lastSnapshot;
      
      if (!target) {
        throw new Error("No snapshot available to restore.");
      }

      if (target.checksum) {
        try {
          const serialized = JSON.stringify({ nodes: target.nodes, edges: target.edges, clusters: target.clusters });
          const computed = crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
          if (computed !== target.checksum) {
            console.warn(`[SYNAPSE] Snapshot checksum mismatch (restoring anyway): ${computed} vs ${target.checksum}`);
          }
        } catch { /* checksum too large to verify */ }
      }
      
      graphModel.restoreSnapshot(target);
      this.lastSnapshot = target;
      
      console.log(`[SYNAPSE] Graph Snapshot Restored (v${target.snapshotVersion || '?'})`);
      return target;
    } catch (e: any) {
      phaseManager.lockSystem(`SNAPSHOT_RESTORE FAILURE: ${e.message}`);
      throw e;
    }
  }

  public validate(): boolean {
    return this.lastSnapshot !== null || (this.historyPath !== null && fs.existsSync(this.historyPath));
  }

  public getSnapshotVersion(): number {
    return this.snapshotVersion;
  }
}

export const snapshotSystem = new SnapshotSystem();
