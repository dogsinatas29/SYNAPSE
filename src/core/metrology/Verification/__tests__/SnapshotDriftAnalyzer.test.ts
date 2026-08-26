import { SnapshotDriftAnalyzer, GraphSnapshot } from '../SnapshotDriftAnalyzer';

describe('SnapshotDriftAnalyzer', () => {
  let analyzer: SnapshotDriftAnalyzer;

  beforeEach(() => {
    analyzer = new SnapshotDriftAnalyzer();
  });

  const createSnapshot = (runId: number, edgeCount: number = 100, edges: string[] = ['edge1', 'edge2']): GraphSnapshot => ({
    runId,
    nodeCount: 50,
    edgeCount,
    validationResult: 200,
    coverage: 0.96,
    amplification: 18.0,
    cii: 0.68,
    edges: new Set(edges)
  });

  test('Ignores Run0 (Warm-up)', () => {
    analyzer.recordSnapshot(createSnapshot(0, 50, ['edge3'])); // Warmup, should be ignored
    analyzer.recordSnapshot(createSnapshot(1, 100));
    analyzer.recordSnapshot(createSnapshot(2, 100));
    
    expect(analyzer.analyzeDrift()).toBeNull();
  });

  test('Detects drift and returns formatted report', () => {
    analyzer.recordSnapshot(createSnapshot(1, 100, ['edge1', 'edge2']));
    analyzer.recordSnapshot(createSnapshot(2, 98, ['edge1'])); // Missing edge2
    
    const report = analyzer.analyzeDrift();
    expect(report).not.toBeNull();
    expect(report).toContain('Unexpected Drift Report');
    expect(report).toContain('Edge -2');
    expect(report).toContain('Affected IDs:');
    expect(report).toContain('edge2');
  });

  test('Returns null when no drift occurs', () => {
    analyzer.recordSnapshot(createSnapshot(1));
    analyzer.recordSnapshot(createSnapshot(2));
    analyzer.recordSnapshot(createSnapshot(3));
    
    expect(analyzer.analyzeDrift()).toBeNull();
  });
});
