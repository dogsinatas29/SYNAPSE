import * as fs from 'fs';
import * as crypto from 'crypto';
import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';
import { SimulationRuleEngine } from './src/core/simulation/propagation/SimulationRuleEngine';
import { DependencyRemovedRealRule } from './src/core/simulation/propagation/rules/DependencyRemovedRealRule';
import { RecoveryRuleEngine } from './src/core/simulation/propagation/recovery/RecoveryRuleEngine';
import { DependencyRestoredRealRule } from './src/core/simulation/propagation/recovery/rules/DependencyRestoredRealRule';
import { ValidationRuleEngine } from './src/core/simulation/propagation/validation/ValidationRuleEngine';
import { ValidationPassedRealRule } from './src/core/simulation/propagation/validation/rules/ValidationPassedRealRule';
import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';
import { RecoveryEventType } from './src/core/simulation/scenario/RecoveryEventType';
import { ValidationEventType } from './src/core/simulation/scenario/ValidationEventType';

function hashObj(obj: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').substring(0, 8);
}

function loadRealGraph(path: string): SimulationSnapshot {
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    const nodes: SimulationNode[] = [];
    const edges: SimulationEdge[] = [];

    // Parse Nodes
    if (data.nodes) {
        for (const n of data.nodes) {
            nodes.push({
                id: n.id,
                type: n.type || 'NODE',
                cluster_id: n.cluster_id || 'root',
                state: n.state || SimulationState.NORMAL
            });
        }
    }

    // Parse Edges
    if (data.edges) {
        for (const e of data.edges) {
            edges.push({
                id: e.id,
                from: e.source || e.from,
                to: e.target || e.to,
                type: e.type || e.relationType || 'EDGE',
                weight: e.weight || 1,
                state: e.state || SimulationState.NORMAL
            });
        }
    }

    return new SimulationSnapshot(nodes, edges, [], []);
}

function getFanoutTargets(snapshot: SimulationSnapshot) {
    // Calculate out-degree for each node
    const outDegree = new Map<string, number>();
    for (const e of snapshot.edges) {
        outDegree.set(e.from, (outDegree.get(e.from) || 0) + 1);
    }

    const sortedNodes = Array.from(outDegree.entries()).sort((a, b) => b[1] - a[1]);
    
    if (sortedNodes.length === 0) return [];

    const top = sortedNodes[0][0];
    const median = sortedNodes[Math.floor(sortedNodes.length / 2)][0];
    const low = sortedNodes[sortedNodes.length - 1][0];

    return [
        { name: 'TOP_FANOUT', id: top, count: outDegree.get(top) },
        { name: 'MEDIAN_FANOUT', id: median, count: outDegree.get(median) },
        { name: 'LOW_FANOUT', id: low, count: outDegree.get(low) }
    ];
}

function runMetrics(snapshot: SimulationSnapshot, targetNodeId: string, runCount: number = 100) {
    console.log(`\n\n--- Running Target: ${targetNodeId} ---`);
    
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const engine = new StateTransitionEngine();
    
    const failRuleEngine = new SimulationRuleEngine();
    failRuleEngine.registerRule(new DependencyRemovedRealRule());

    const recRuleEngine = new RecoveryRuleEngine();
    recRuleEngine.registerRule(new DependencyRestoredRealRule());

    const valRuleEngine = new ValidationRuleEngine();
    valRuleEngine.registerRule(new ValidationPassedRealRule());

    let finalStats: any = {};

    const failHashes = new Set<string>();
    const failCounts = new Set<number>();
    
    const recHashes = new Set<string>();
    const recCounts = new Set<number>();
    
    const valHashes = new Set<string>();
    const valCounts = new Set<number>();
    
    const snapHashes = new Set<string>();
    const regHashes = new Set<string>();

    for (let i = 0; i < runCount; i++) {
        // Clone for isolated run
        const currentSnapshot = snapshot.clone();

        // 1. Failure
        const targetEdge = currentSnapshot.edges.find(e => e.from === targetNodeId);
        if (!targetEdge) continue;

        const failScenario = {
            id: 'fail_1',
            type: SimulationScenarioType.DEPENDENCY_REMOVED,
            targetId: targetEdge.id,
            targetType: 'EDGE' as const,
            timestamp: 1000,
            evidenceIds: ['ev_1']
        };

        const failResult = failRuleEngine.propagate(currentSnapshot, failScenario);
        StateTransitionEngine.applyTransitions(currentSnapshot, failResult.transitions);
        
        failHashes.add(hashObj(failResult.transitions));
        failCounts.add(failResult.transitions.length);

        // 2. Recovery
        const recScenario = {
            id: 'rec_1',
            type: RecoveryEventType.DEPENDENCY_RESTORED,
            targetId: targetEdge.id,
            targetType: 'EDGE' as const,
            timestamp: 2000,
            causesToRemove: ['ev_1'],
            evidenceIds: ['ev_rec_1']
        };

        const recTransitions = recRuleEngine.evaluate(recScenario, currentSnapshot);
        StateTransitionEngine.applyTransitions(currentSnapshot, recTransitions);
        
        recHashes.add(hashObj(recTransitions));
        recCounts.add(recTransitions.length);

        // 3. Validation
        const valScenario = {
            id: 'val_1',
            type: ValidationEventType.VALIDATION_PASSED,
            targetId: targetEdge.id,
            targetType: 'EDGE' as const,
            timestamp: 3000,
            evidenceIds: ['ev_val_1']
        };

        const valTransitions = valRuleEngine.evaluate(valScenario, currentSnapshot);
        StateTransitionEngine.applyTransitions(currentSnapshot, valTransitions);

        valHashes.add(hashObj(valTransitions));
        valCounts.add(valTransitions.length);
        
        snapHashes.add(hashObj(currentSnapshot));
        regHashes.add(currentSnapshot.registry.getHash());

        if (i === 0) {
            // Collect metrics on the first run
            const depthMap = new Map<number, number>();
            for (const t of failResult.traces) {
                depthMap.set(t.depth, (depthMap.get(t.depth) || 0) + 1);
            }
            let depth1 = 0, depth2_5 = 0, depth6_10 = 0, depth10_plus = 0;
            for (const [d, c] of depthMap.entries()) {
                if (d === 1) depth1 += c;
                else if (d <= 5) depth2_5 += c;
                else if (d <= 10) depth6_10 += c;
                else depth10_plus += c;
            }

            let b = 0, d = 0, n = 0;
            for (const node of currentSnapshot.nodes) {
                if (node.state === SimulationState.BROKEN) b++;
                else if (node.state === SimulationState.DIRTY) d++;
                else n++;
            }

            let multiCauses = 0;
            let peakCauses = 0;
            let causesAdded = failResult.transitions.reduce((sum, t) => sum + (t.causesToAdd?.length || 0), 0);
            let causesRemoved = recTransitions.reduce((sum, t) => sum + (t.causesToRemove?.length || 0), 0);
            
            // To get multiCauses and peakCauses safely, we look through registry active owners
            // registry.getHash() implicitly processes them, but we can query by nodes/edges.
            // Since we can't access `causes` easily, we'll iterate impacted nodes/edges.
            const allImpacted = new Set<string>();
            failResult.transitions.forEach(t => allImpacted.add(`${t.ownerType}:${t.ownerId}`));
            
            for (const key of allImpacted) {
                const [type, id] = key.split(':');
                const causes = currentSnapshot.registry.getActiveCauses(type as any, id);
                if (causes.length > peakCauses) peakCauses = causes.length;
                if (causes.length > 1) multiCauses++;
            }

            finalStats = {
                failTransCount: failResult.transitions.length,
                impactedNodes: failResult.transitions.filter(t => t.ownerType === 'NODE').length,
                impactedEdges: failResult.transitions.filter(t => t.ownerType === 'EDGE').length,
                rawImpacts: failResult.stats ? (failResult.stats.visitedNodes + failResult.stats.visitedEdges) : failResult.transitions.length,
                maxDepth: failResult.stats?.maxDepthReached || 0,
                depthHist: { depth1, depth2_5, depth6_10, depth10_plus },
                
                causesAdded,
                causesRemoved,
                
                recTransCount: recTransitions.length,
                partialRecoveries: recTransitions.filter(t => t.to === SimulationState.BROKEN).length,
                
                valTransCount: valTransitions.length,
                
                multiCauses,
                peakCauses,
                
                dist: { b, d, n }
            };
        }
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    console.log(`\n=== FAILURE ===`);
    console.log(`Target: ${targetNodeId}`);
    console.log(`Raw Impacts (Visited): ${finalStats.rawImpacts}`);
    console.log(`Filtered Impacts (Transitions): ${finalStats.failTransCount}`);
    console.log(`Impacted Nodes: ${finalStats.impactedNodes}`);
    console.log(`Impacted Edges: ${finalStats.impactedEdges}`);

    console.log(`\n=== TRACE ===`);
    console.log(`Depth 1: ${finalStats.depthHist.depth1}`);
    console.log(`Depth 2-5: ${finalStats.depthHist.depth2_5}`);
    console.log(`Depth 6-10: ${finalStats.depthHist.depth6_10}`);
    console.log(`Depth 10+: ${finalStats.depthHist.depth10_plus}`);
    console.log(`Max Depth: ${finalStats.maxDepth}`);

    console.log(`\n=== REGISTRY ===`);
    console.log(`Causes Added: ${finalStats.causesAdded}`);
    console.log(`Causes Removed: ${finalStats.causesRemoved}`);
    console.log(`Peak Active Causes on single owner: ${finalStats.peakCauses}`);
    console.log(`Multi-Cause Owners: ${finalStats.multiCauses}`);

    console.log(`\n=== RECOVERY ===`);
    console.log(`Recovered Owners: ${finalStats.recTransCount}`);
    console.log(`Partial Recoveries (Still BROKEN): ${finalStats.partialRecoveries}`);

    console.log(`\n=== VALIDATION ===`);
    console.log(`Validated Owners (DIRTY -> NORMAL): ${finalStats.valTransCount}`);

    console.log(`\n=== DISTRIBUTION ===`);
    const total = finalStats.dist.b + finalStats.dist.d + finalStats.dist.n;
    console.log(`BROKEN: ${((finalStats.dist.b / total) * 100).toFixed(2)}%`);
    console.log(`DIRTY: ${((finalStats.dist.d / total) * 100).toFixed(2)}%`);
    console.log(`NORMAL: ${((finalStats.dist.n / total) * 100).toFixed(2)}%`);

    console.log(`\n=== DETERMINISM ===`);
    console.log(`Runs: ${runCount}`);
    console.log(`Unique Failure Counts: ${failCounts.size}`);
    console.log(`Unique Failure Hashes: ${failHashes.size}`);
    console.log(`Unique Recovery Counts: ${recCounts.size}`);
    console.log(`Unique Recovery Hashes: ${recHashes.size}`);
    console.log(`Unique Validation Counts: ${valCounts.size}`);
    console.log(`Unique Validation Hashes: ${valHashes.size}`);
    console.log(`Unique Snapshot Hashes: ${snapHashes.size}`);
    console.log(`Unique Registry Hashes: ${regHashes.size}`);

    console.log(`\n=== PERFORMANCE ===`);
    console.log(`Execution Time: ${(endTime - startTime).toFixed(2)} ms`);
    console.log(`Peak Memory Growth: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)} MB`);
}

function main() {
    const dataPath = './synapse_data/project_state.json';
    console.log(`Loading real graph from ${dataPath}...`);
    
    if (!fs.existsSync(dataPath)) {
        console.error("Data file not found.");
        return;
    }

    const snapshot = loadRealGraph(dataPath);
    console.log(`\n=== GRAPH SUMMARY ===`);
    console.log(`Nodes: ${snapshot.nodes.length}`);
    console.log(`Edges: ${snapshot.edges.length}`);

    const targets = getFanoutTargets(snapshot);
    if (targets.length === 0) {
        console.log("No edges found to calculate fanout.");
        return;
    }

    for (const t of targets) {
        console.log(`\nSelected ${t.name}: ${t.id} (Out-degree: ${t.count})`);
        runMetrics(snapshot, t.id, 100);
    }
}

main();
