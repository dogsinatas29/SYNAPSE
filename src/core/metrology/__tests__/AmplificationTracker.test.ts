import { AmplificationTracker } from '../AmplificationTracker';

describe('AmplificationTracker', () => {
  let tracker: AmplificationTracker;

  beforeEach(() => {
    tracker = new AmplificationTracker();
  });

  test('Detects amplification explosion correctly', () => {
    tracker.recordTrace('LinuxKernelScan', [
      { phase: 'Input', count: 100 },
      { phase: 'Signals', count: 200 },
      { phase: 'VirtualEdges', count: 2000 }
    ]);

    // Input is 100, Final is 2000. Ratio is 20x.
    // If threshold is 10x, it should detect an explosion.
    const isExplosion = tracker.detectExplosion('LinuxKernelScan', 10);
    expect(isExplosion).toBe(true);
  });

  test('Does not detect explosion when below threshold', () => {
    tracker.recordTrace('TinyProjectScan', [
      { phase: 'Input', count: 100 },
      { phase: 'VirtualEdges', count: 500 }
    ]);

    // Ratio is 5x. Threshold is 10x.
    const isExplosion = tracker.detectExplosion('TinyProjectScan', 10);
    expect(isExplosion).toBe(false);
  });
});
