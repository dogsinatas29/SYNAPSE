import { PatternDetector } from '../patterns/PatternDetector';

/**
 * Maps logical detector IDs from Protected IP (patterns.json) to actual instances.
 */
export class DetectorFactory {
    private registry: Record<string, PatternDetector> = {};

    public register(detectorId: string, detector: PatternDetector): void {
        this.registry[detectorId] = detector;
    }

    public getDetector(detectorId: string): PatternDetector | null {
        return this.registry[detectorId] || null;
    }
}
