export interface GraphSnapshot {
  runId: number;
  nodeCount: number;
  edgeCount: number;
  validationResult: number;
  coverage: number;
  amplification: number;
  cii: number;
  edges: Set<string>; // For delta tracking
}

export class SnapshotDriftAnalyzer {
  private snapshots: GraphSnapshot[] = [];

  public recordSnapshot(snapshot: GraphSnapshot): void {
    if (snapshot.runId === 0) return; // Discard warm-up
    this.snapshots.push(snapshot);
  }

  public analyzeDrift(): string | null {
    if (this.snapshots.length < 2) return null;

    const base = this.snapshots[0];

    for (let i = 1; i < this.snapshots.length; i++) {
      const current = this.snapshots[i];

      const driftCount = 
        Math.abs(base.nodeCount - current.nodeCount) +
        Math.abs(base.edgeCount - current.edgeCount) +
        Math.abs(base.validationResult - current.validationResult);

      if (driftCount > 0 || base.coverage !== current.coverage || base.amplification !== current.amplification || base.cii !== current.cii) {
        // Drift detected! Calculate Delta
        const missingInCurrent = [...base.edges].filter(e => !current.edges.has(e));
        const missingInBase = [...current.edges].filter(e => !base.edges.has(e));
        const affected = [...missingInCurrent, ...missingInBase].slice(0, 10); // Show up to 10 for debugging

        return `Unexpected Drift Report
Artifact: graph_snapshot.json
Run A:
Node Count = ${base.nodeCount}
Edge Count = ${base.edgeCount}

Run B:
Node Count = ${current.nodeCount}
Edge Count = ${current.edgeCount}

Delta:
Node ${current.nodeCount - base.nodeCount}
Edge ${current.edgeCount - base.edgeCount}

Affected IDs:
${affected.join('\n')}`;
      }
    }

    return null; // No unexpected drift
  }

  public clear(): void {
    this.snapshots = [];
  }
}
