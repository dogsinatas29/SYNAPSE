import { Node } from '../../../types/schema';
import { CompositionMetrics } from '../types';

export class DependencyClassifier {
    
    /**
     * Classifies a set of target nodes into UI, Core, Infra, Types to determine Fan-out composition.
     * @param targetIds Array of node IDs representing the Fan-out targets
     * @param nodeMap Fast lookup map for nodes
     * @returns CompositionMetrics with a calculated confidence score
     */
    public static classify(targetIds: string[], nodeMap: Map<string, Node>): CompositionMetrics {
        const metrics: CompositionMetrics = {
            uiCount: 0,
            coreCount: 0,
            infraCount: 0,
            typesCount: 0,
            total: targetIds.length,
            confidence: 50 // Base confidence
        };

        if (targetIds.length === 0) {
            metrics.confidence = 100;
            return metrics;
        }

        let strongSignals = 0;

        for (const id of targetIds) {
            const node = nodeMap.get(id);
            if (!node) continue;

            const pathStr = (node.data?.file || node.label || id).toLowerCase();

            // 1. Types/Interfaces
            if (pathStr.includes('types.ts') || pathStr.includes('interfaces.ts') || pathStr.includes('/types/') || pathStr.includes('/interfaces/')) {
                metrics.typesCount++;
                strongSignals++;
            }
            // 2. UI / Presentation
            else if (pathStr.includes('/ui/') || pathStr.includes('/view/') || pathStr.includes('/browser/') || pathStr.includes('widget') || pathStr.endsWith('.tsx') || pathStr.endsWith('.jsx')) {
                metrics.uiCount++;
                strongSignals++;
            }
            // 3. Infrastructure / External
            else if (pathStr.includes('/infra/') || pathStr.includes('/database/') || pathStr.includes('/network/') || pathStr.includes('fs') || pathStr.includes('ipc')) {
                metrics.infraCount++;
                strongSignals++;
            }
            // 4. Core / Domain
            else if (pathStr.includes('/core/') || pathStr.includes('/domain/') || pathStr.includes('/services/') || pathStr.includes('/models/')) {
                metrics.coreCount++;
                strongSignals++;
            }
            // Fallback: If it's a test file, it doesn't strictly count against confidence, but we ignore it in core stats
            else if (pathStr.includes('.test.') || pathStr.includes('.spec.')) {
                // Ignore test files in composition counts
            }
        }

        // Calculate confidence based on how many targets hit a strong signal
        // If the project doesn't follow standard naming conventions, strongSignals will be low.
        const hitRatio = strongSignals / metrics.total;
        
        if (hitRatio > 0.8) metrics.confidence = 95;
        else if (hitRatio > 0.5) metrics.confidence = 70;
        else metrics.confidence = 40; // Low confidence if naming convention is unknown

        return metrics;
    }
}
