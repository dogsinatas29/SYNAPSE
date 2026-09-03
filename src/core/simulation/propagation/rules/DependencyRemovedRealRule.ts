import { PropagationRule } from '../PropagationRule';
import { SimulationScenario } from '../../scenario/SimulationScenario';
import { SimulationScenarioType } from '../../scenario/SimulationScenarioType';
import { SimulationSnapshot } from '../../SimulationSnapshot';
import { PropagationContext } from '../PropagationContext';
import { PropagationImpact } from '../PropagationImpact';
import { SimulationState } from '../../state/SimulationState';

import { PropagationResult } from '../PropagationResult';
import { PropagationTraceEdge } from '../PropagationTraceEdge';

export class DependencyRemovedRealRule implements PropagationRule {
    public readonly targetScenarioType = SimulationScenarioType.DEPENDENCY_REMOVED;
    public maxDepth: number;

    constructor(maxDepth: number = 3) {
        this.maxDepth = maxDepth;
    }

    evaluate(scenario: SimulationScenario, snapshot: SimulationSnapshot, context: PropagationContext): PropagationResult {
        const targetEdgeId = scenario.targetId;
        const targetEdge = snapshot.getEdge(targetEdgeId);
        
        if (!targetEdge) return { impacts: [], traces: [], stats: { maxDepthReached: 0, visitedNodes: 0, visitedEdges: 0, traceCount: 0 } };

        const impacts: PropagationImpact[] = [];
        const traces: PropagationTraceEdge[] = [];
        let maxDepthReached = 0;
        
        // 1. The Edge itself is removed/broken
        impacts.push({
            ownerId: targetEdgeId,
            ownerType: 'EDGE',
            targetState: SimulationState.BROKEN,
            causeDescriptor: {
                eventType: 'DEPENDENCY_REMOVED',
                sourceId: targetEdgeId
            }
        });

        const startNodeId = targetEdge.from; 
        const queue: { nodeId: string, currentDepth: number, causeId: string, causeType: 'NODE' | 'EDGE' }[] = [];
        
        queue.push({ nodeId: startNodeId, currentDepth: 1, causeId: targetEdgeId, causeType: 'EDGE' });
        context.visitedNodes.add(startNodeId);

        const reverseEdges = new Map<string, string[]>();
        for (const edge of snapshot.edges) {
            let callerList = reverseEdges.get(edge.to);
            if (!callerList) {
                callerList = [];
                reverseEdges.set(edge.to, callerList);
            }
            callerList.push(edge.from);
        }

        let head = 0;
        while (head < queue.length) {
            const { nodeId, currentDepth, causeId, causeType } = queue[head++];
            
            if (currentDepth > maxDepthReached) maxDepthReached = currentDepth;

            impacts.push({
                ownerId: nodeId,
                ownerType: 'NODE',
                targetState: SimulationState.BROKEN,
                causeDescriptor: {
                    eventType: 'DEPENDENCY_REMOVED',
                    sourceId: targetEdgeId
                }
            });

            traces.push({
                sourceId: causeId,
                sourceType: causeType,
                targetId: nodeId,
                targetType: 'NODE',
                depth: currentDepth
            });

            if (this.maxDepth > 0 && currentDepth >= this.maxDepth) {
                continue;
            }

            const callers = reverseEdges.get(nodeId) || [];
            
            for (const callerId of callers) {
                // To support multiple parents, we don't just skip visited for traces,
                // but if we want to avoid infinite loops, we should still only traverse once per node.
                // Wait, if a node is visited, do we add the trace? Yes!
                // But we only enqueue it if it's NOT visited to avoid cycles.
                
                // Add trace regardless of whether we explore it again (because multiple parents can point to the same node)
                // Actually, if we add trace here, it would be added on the next level. Let's do it like this:
                // When we process `nodeId`, we look at its callers. We enqueue them. 
                // Wait, the trace is from `callerId` to `nodeId`? No, backward propagation: 
                // The issue started at targetEdge. It broke. Thus `startNodeId` is dirty. 
                // Then `startNodeId` is dirty, so its caller `callerId` becomes dirty.
                // Thus the cause is `nodeId`, the target is `callerId`.
                // So trace: source: `nodeId`, target: `callerId`.
                
                if (!context.visitedNodes.has(callerId)) {
                    context.visitedNodes.add(callerId);
                    queue.push({ nodeId: callerId, currentDepth: currentDepth + 1, causeId: nodeId, causeType: 'NODE' });
                } else {
                    // It was already visited, but we still need a trace edge because this is another valid path.
                    // Wait, if it was already visited, it means it already received an impact. We just add the trace.
                    traces.push({
                        sourceId: nodeId,
                        sourceType: 'NODE',
                        targetId: callerId,
                        targetType: 'NODE',
                        depth: currentDepth + 1
                    });
                }
            }
        }

        return {
            impacts,
            traces,
            stats: {
                maxDepthReached,
                visitedNodes: context.visitedNodes.size,
                visitedEdges: context.visitedEdges.size,
                traceCount: traces.length
            }
        };
    }
}
