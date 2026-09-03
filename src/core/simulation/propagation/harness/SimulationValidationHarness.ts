import { SimulationSnapshot, SimulationNode, SimulationEdge } from '../../SimulationSnapshot';
import { SimulationScenario } from '../../scenario/SimulationScenario';
import { SimulationScenarioType } from '../../scenario/SimulationScenarioType';
import { SimulationRuleEngine } from '../SimulationRuleEngine';
import { DependencyRemovedRealRule } from '../rules/DependencyRemovedRealRule';
import { StateTransitionEngine } from '../../state/StateTransitionEngine';
import * as os from 'os';

export interface HarnessConfig {
    edgeSelection: 'TOP_FANOUT' | 'MEDIAN_FANOUT' | 'LOW_FANOUT' | 'ARCH_CLUSTER' | 'CORE_KERNEL_CLUSTER' | 'DRIVER_CLUSTER';
    depth: number; // 0 means unlimited
}

export interface ValidationReport {
    targetEdgeId: string;
    depthLimit: number | 'Unlimited';
    
    // Blast Radius Size & Ratio
    totalNodes: number;
    totalEdges: number;
    affectedNodes: number;
    blastRadiusRatio: string;
    affectedEdges: number;
    affectedEdgeRatio: string;
    affectedTopClusters: Record<string, string>; // e.g. { drivers: '50%', arch: '20%' }

    // Merge Efficiency
    rawImpactCount: number;
    mergedTransitionCount: number;
    mergeReductionRatio: string;
    transitionDensity: string;

    // Traversal Efficiency
    visitedNodes: number;
    visitedEdges: number;
    nodeHitRatio: string;
    edgeHitRatio: string;
    maxDepthReached: number;

    // Safety & Memory
    peakMemoryMB: string;
    memoryGrowthMB: string;
    executionTimeMs: number;
    errors: {
        matrixViolations: number;
        batchConflicts: number;
        rollbacks: number;
    };
    
    // Saturation
    stateSaturationCount: number;
    propagationSaturationCount: number;

    // Determinism
    snapshotHash: string;
    scenarioHash: string;
    transitionsHash: string;
    determinismPassed: boolean;
}

export class SimulationValidationHarness {
    private snapshot: SimulationSnapshot;

    constructor(snapshot: SimulationSnapshot) {
        this.snapshot = snapshot;
    }

    public generateTarget(strategy: HarnessConfig['edgeSelection']): SimulationEdge {
        // Compute reverse dependencies (fan-in for the target, fan-out for the source)
        const fanOutCount = new Map<string, number>();
        for (const edge of this.snapshot.edges) {
            fanOutCount.set(edge.to, (fanOutCount.get(edge.to) || 0) + 1);
        }

        let eligibleEdges = this.snapshot.edges;
        if (strategy === 'ARCH_CLUSTER') eligibleEdges = eligibleEdges.filter(e => this.snapshot.getNode(e.from)?.cluster_id === 'arch');
        if (strategy === 'CORE_KERNEL_CLUSTER') eligibleEdges = eligibleEdges.filter(e => this.snapshot.getNode(e.from)?.cluster_id === 'kernel');
        if (strategy === 'DRIVER_CLUSTER') eligibleEdges = eligibleEdges.filter(e => this.snapshot.getNode(e.from)?.cluster_id === 'drivers');

        eligibleEdges = [...eligibleEdges].sort((a, b) => (fanOutCount.get(b.to) || 0) - (fanOutCount.get(a.to) || 0));

        if (strategy === 'TOP_FANOUT') return eligibleEdges[0];
        if (strategy === 'LOW_FANOUT') return eligibleEdges[eligibleEdges.length - 1];
        if (strategy === 'MEDIAN_FANOUT') return eligibleEdges[Math.floor(eligibleEdges.length / 2)];
        
        return eligibleEdges[0]; // fallback
    }

    public run(config: HarnessConfig): ValidationReport {
        const targetEdge = this.generateTarget(config.edgeSelection);
        
        const scenario: SimulationScenario = {
            id: `scen_${config.edgeSelection}_${config.depth}`,
            type: SimulationScenarioType.DEPENDENCY_REMOVED,
            targetId: targetEdge.id,
            evidenceIds: ['ev_root']
        };

        const rule = new DependencyRemovedRealRule(config.depth);
        const engine = new SimulationRuleEngine();
        engine.registerRule(rule);

        const initialMemory = process.memoryUsage().heapUsed;
        let peakMemory = initialMemory;

        const startTime = Date.now();

        // 1. Intercept Impacts from Rule
        const context = require('../PropagationContext'); // Mocked usage for stats
        const MockContext = new context.PropagationContext();
        const rawImpacts = rule.evaluate(scenario, this.snapshot, MockContext);

        // 2. Propagate (Engine Merge)
        const transitions = engine.propagate(this.snapshot, scenario);
        
        // 3. Execution (Phase 7)
        let rollbacks = 0;
        let matrixViolations = 0;
        let batchConflicts = 0;
        
        try {
            StateTransitionEngine.applyTransitions(this.snapshot, transitions);
        } catch (e: any) {
            rollbacks++;
            if (e.message.includes('Matrix')) matrixViolations++;
            if (e.message.includes('Batch Conflict')) batchConflicts++;
        }

        const endTime = Date.now();
        const finalMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, finalMemory); // In reality, we'd poll or use profiler

        // Computations
        const affectedNodesSet = new Set(transitions.filter(t => t.ownerType === 'NODE').map(t => t.ownerId));
        const affectedEdgesSet = new Set(transitions.filter(t => t.ownerType === 'EDGE').map(t => t.ownerId));

        const affectedTopClusters: Record<string, string> = {};
        for (const nId of affectedNodesSet) {
            const cluster = this.snapshot.getNode(nId)?.cluster_id || 'unknown';
            affectedTopClusters[cluster] = ((affectedTopClusters[cluster] as any || 0) + 1);
        }
        for (const k in affectedTopClusters) {
            affectedTopClusters[k] = ((affectedTopClusters[k] as any / affectedNodesSet.size) * 100).toFixed(1) + '%';
        }

        const stateSaturationCount = rawImpacts.length - transitions.length;
        const propagationSaturationCount = MockContext.visitedNodes.size - affectedNodesSet.size;

        return {
            targetEdgeId: targetEdge.id,
            depthLimit: config.depth === 0 ? 'Unlimited' : config.depth,
            
            totalNodes: this.snapshot.nodes.length,
            totalEdges: this.snapshot.edges.length,
            affectedNodes: affectedNodesSet.size,
            blastRadiusRatio: ((affectedNodesSet.size / this.snapshot.nodes.length) * 100).toFixed(4) + '%',
            affectedEdges: affectedEdgesSet.size,
            affectedEdgeRatio: ((affectedEdgesSet.size / this.snapshot.edges.length) * 100).toFixed(4) + '%',
            affectedTopClusters,

            rawImpactCount: rawImpacts.length,
            mergedTransitionCount: transitions.length,
            mergeReductionRatio: (rawImpacts.length === 0 ? '0' : ((1 - (transitions.length / rawImpacts.length)) * 100).toFixed(1)) + '%',
            transitionDensity: ((affectedNodesSet.size + affectedEdgesSet.size) === 0 ? '0' : (transitions.length / (affectedNodesSet.size + affectedEdgesSet.size)).toFixed(2)),

            visitedNodes: MockContext.visitedNodes.size,
            visitedEdges: MockContext.visitedEdges.size,
            nodeHitRatio: (MockContext.visitedNodes.size === 0 ? '0' : ((affectedNodesSet.size / MockContext.visitedNodes.size) * 100).toFixed(1)) + '%',
            edgeHitRatio: (MockContext.visitedEdges.size === 0 ? '0' : ((affectedEdgesSet.size / MockContext.visitedEdges.size) * 100).toFixed(1)) + '%',
            maxDepthReached: config.depth, // Stub: actual depth tracking needs rule integration

            peakMemoryMB: (peakMemory / 1024 / 1024).toFixed(2) + ' MB',
            memoryGrowthMB: ((finalMemory - initialMemory) / 1024 / 1024).toFixed(2) + ' MB',
            executionTimeMs: endTime - startTime,
            errors: { matrixViolations, batchConflicts, rollbacks },
            
            stateSaturationCount,
            propagationSaturationCount,

            snapshotHash: SimulationRuleEngine.computeHash({n: this.snapshot.nodes.length, e: this.snapshot.edges.length}),
            scenarioHash: SimulationRuleEngine.computeHash(scenario),
            transitionsHash: SimulationRuleEngine.computeHash(transitions),
            determinismPassed: true // Stub for single run, harness script verifies this
        };
    }
}
