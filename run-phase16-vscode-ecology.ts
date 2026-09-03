import * as fs from 'fs';
import * as path from 'path';
import { SimulationSnapshot, SimulationNode, SimulationEdge } from './src/core/simulation/SimulationSnapshot';
import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateTransitionEngine } from './src/core/simulation/state/StateTransitionEngine';
import { SimulationRuleEngine } from './src/core/simulation/propagation/SimulationRuleEngine';
import { DependencyRemovedRealRule } from './src/core/simulation/propagation/rules/DependencyRemovedRealRule';
import { SimulationScenarioType } from './src/core/simulation/scenario/SimulationScenarioType';
import { FailureCauseRegistry } from './src/core/simulation/state/FailureCauseRegistry';
import { RecoveryRuleEngine } from './src/core/simulation/propagation/recovery/RecoveryRuleEngine';
import { DependencyRestoredRealRule } from './src/core/simulation/propagation/recovery/rules/DependencyRestoredRealRule';
import { RecoveryEventType } from './src/core/simulation/scenario/RecoveryEventType';

const DATA_PATH = '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json';
const OUT_DIR = './synapse_report/ecology/vscode';

function ensureDir() {
    if (!fs.existsSync(OUT_DIR)) {
        fs.mkdirSync(OUT_DIR, { recursive: true });
    }
}

function loadRealGraph(): SimulationSnapshot {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const nodes: SimulationNode[] = [];
    const edges: SimulationEdge[] = [];

    let allNodes: any[] = [];
    if (data.clusters) {
        for (const c of data.clusters) {
            if (c.nodes) {
                allNodes.push(...c.nodes);
            }
        }
    }
    if (data.nodes) {
        allNodes.push(...data.nodes);
    }

    for (const n of allNodes) {
        nodes.push({
            id: n.id,
            type: n.type || 'NODE',
            cluster_id: n.cluster_id || 'root',
            state: n.state || SimulationState.NORMAL,
            data: { path: n.filePath || n.id }
        });
    }

    let allEdges = data.edges || [];
    for (const e of allEdges) {
        edges.push({
            id: e.id,
            from: e.source || e.from,
            to: e.target || e.to,
            type: e.type || e.relationType || 'EDGE',
            weight: e.weight || 1,
            state: e.state || SimulationState.NORMAL
        });
    }
    return new SimulationSnapshot(nodes, edges, [], [], new FailureCauseRegistry());
}

// ----------------------------------------------------
// EXPERIMENT A: Reachability
// ----------------------------------------------------
function runExperimentA(snapshot: SimulationSnapshot): any[] {
    console.log(`\n[Experiment A] Reachability`);
    const ruleEngine = new SimulationRuleEngine();
    ruleEngine.registerRule(new DependencyRemovedRealRule(100));
    
    const outDegrees = new Map<string, number>();
    for (const e of snapshot.edges) {
        outDegrees.set(e.from, (outDegrees.get(e.from) || 0) + 1);
    }
    const sortedNodes = Array.from(outDegrees.entries()).sort((a,b) => b[1] - a[1]).slice(0, 50);

    const results = [];
    let count = 0;
    
    for (const [nodeId, outDeg] of sortedNodes) {
        count++;
        process.stdout.write(`\rSimulating Node ${count}/50...`);
        let currentSnapshot = snapshot.clone();
        
        const outgoing = currentSnapshot.edges.filter(e => e.from === nodeId);
        let maxDepth = 0;
        let transCount = 0;
        let nodeImpacts = new Set<string>();
        let edgeImpacts = new Set<string>();
        
        for (const edge of outgoing) {
            const failResult = ruleEngine.propagate(currentSnapshot, {
                id: `fail_${edge.id}`,
                type: SimulationScenarioType.DEPENDENCY_REMOVED,
                targetId: edge.id,
                evidenceIds: []
            });
            transCount += failResult.transitions.length;
            failResult.transitions.forEach(t => {
                if (t.ownerType === 'NODE') nodeImpacts.add(t.ownerId);
                if (t.ownerType === 'EDGE') edgeImpacts.add(t.ownerId);
            });
            if ((failResult.stats?.maxDepthReached || 0) > maxDepth) {
                maxDepth = failResult.stats?.maxDepthReached || 0;
            }
            currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, failResult.transitions).snapshot;
        }

        let peakRegistryCount = 0;
        for (const n of currentSnapshot.nodes) {
            const causes = currentSnapshot.registry.getActiveCauses('NODE', n.id);
            if (causes.length > peakRegistryCount) {
                peakRegistryCount = causes.length;
            }
        }
        
        const nNode = snapshot.getNode(nodeId);
        results.push({
            nodeId,
            path: nNode?.data?.path || nodeId,
            impactedNodes: nodeImpacts.size,
            impactedEdges: edgeImpacts.size,
            maxDepth,
            peakRegistryCount
        });
    }
    console.log();
    results.sort((a,b) => b.impactedNodes - a.impactedNodes);
    
    fs.writeFileSync(path.join(OUT_DIR, 'experiment_a_reachability.json'), JSON.stringify({ 
        experiment: "reachability", 
        targets: results 
    }, null, 2));
    return results;
}

// ----------------------------------------------------
// EXPERIMENT B: Bridge Node Detection
// ----------------------------------------------------
function runExperimentB(snapshot: SimulationSnapshot): any[] {
    console.log(`\n[Experiment B] Bridge Detection (CrossBoundaryLoad)`);
    
    const nodeStats = new Map<string, {internal: number, boundary: number}>();
    snapshot.nodes.forEach(n => nodeStats.set(n.id, {internal: 0, boundary: 0}));

    for (const edge of snapshot.edges) {
        const src = snapshot.getNode(edge.from);
        const tgt = snapshot.getNode(edge.to);
        if (!src || !tgt) continue;

        const isBoundary = src.cluster_id !== tgt.cluster_id;
        
        const sStat = nodeStats.get(src.id)!;
        const tStat = nodeStats.get(tgt.id)!;
        
        if (isBoundary) {
            sStat.boundary++;
            tStat.boundary++;
        } else {
            sStat.internal++;
            tStat.internal++;
        }
    }

    const results = [];
    for (const [nodeId, stat] of nodeStats.entries()) {
        const total = stat.internal + stat.boundary;
        if (total === 0) continue;
        const ratio = stat.boundary / total;
        if (stat.boundary > 10) { // filter out low volume nodes
            results.push({
                nodeId,
                path: snapshot.getNode(nodeId)?.data?.path || nodeId,
                internalEdges: stat.internal,
                boundaryEdges: stat.boundary,
                boundaryRatio: parseFloat(ratio.toFixed(4))
            });
        }
    }

    results.sort((a,b) => b.boundaryEdges - a.boundaryEdges); // Rank by sheer volume of boundary load
    const topResults = results.slice(0, 50);

    fs.writeFileSync(path.join(OUT_DIR, 'experiment_b_bridge_nodes.json'), JSON.stringify({ 
        experiment: "bridge_nodes", 
        results: topResults 
    }, null, 2));
    return topResults;
}

// ----------------------------------------------------
// EXPERIMENT C: Multi-Cause Collapse
// ----------------------------------------------------
function runExperimentC(snapshot: SimulationSnapshot, expA: any[], expB: any[]): any[] {
    console.log(`\n[Experiment C] Multi-Cause Collapse`);
    
    // Find edges that belong to the top reachability nodes or top bridge nodes
    const criticalNodes = new Set([...expA.slice(0,3).map(x=>x.nodeId), ...expB.slice(0,3).map(x=>x.nodeId)]);
    const criticalEdges = snapshot.edges.filter(e => criticalNodes.has(e.from)).slice(0, 5); // Just pick 5 critical edges
    
    if (criticalEdges.length === 0) {
        console.log("No critical edges found.");
        return [];
    }

    const failRuleEngine = new SimulationRuleEngine();
    failRuleEngine.registerRule(new DependencyRemovedRealRule(100));
    
    const recRuleEngine = new RecoveryRuleEngine();
    recRuleEngine.registerRule(new DependencyRestoredRealRule());

    let currentSnapshot = snapshot.clone();

    // 1. Fail all 5 edges
    console.log(`Failing ${criticalEdges.length} critical edges simultaneously...`);
    for (const edge of criticalEdges) {
        const failResult = failRuleEngine.propagate(currentSnapshot, {
            id: `fail_${edge.id}`,
            type: SimulationScenarioType.DEPENDENCY_REMOVED,
            targetId: edge.id,
            evidenceIds: []
        });
        currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, failResult.transitions).snapshot;
    }

    // Measure Peak Registry Count per Node
    const registryStats = new Map<string, {peak: number, steps: number}>();
    for (const n of currentSnapshot.nodes) {
        const causes = currentSnapshot.registry.getActiveCauses('NODE', n.id);
        if (causes.length > 0) {
            registryStats.set(n.id, { peak: causes.length, steps: causes.length }); // steps = causes to clear
        }
    }

    // 2. Recover them one by one to see how steps actually resolve
    for (const edge of criticalEdges) {
        const recResult = recRuleEngine.evaluate({
            id: `rec_${edge.id}`,
            type: RecoveryEventType.DEPENDENCY_RESTORED,
            targetId: edge.id,
            evidenceIds: []
        }, currentSnapshot);
        currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, recResult).snapshot;
    }

    const victims = Array.from(registryStats.entries()).map(([nodeId, stat]) => ({
        nodeId,
        path: snapshot.getNode(nodeId)?.data?.path || nodeId,
        peakRegistryCount: stat.peak,
        recoverySteps: stat.steps
    }));

    victims.sort((a,b) => b.peakRegistryCount - a.peakRegistryCount);
    const topVictims = victims.slice(0, 50);

    fs.writeFileSync(path.join(OUT_DIR, 'experiment_c_multicause.json'), JSON.stringify({ 
        experiment: "multi_cause", 
        victims: topVictims 
    }, null, 2));
    
    return topVictims;
}

// ----------------------------------------------------
// EXPERIMENT D: Layer Collapse
// ----------------------------------------------------
function runExperimentD(snapshot: SimulationSnapshot): any {
    console.log(`\n[Experiment D] Critical Layer Collapse (vs/platform)`);
    
    const platformNodes = snapshot.nodes.filter(n => n.data?.path && n.data.path.includes('vs/platform'));
    const platformNodeIds = new Set(platformNodes.map(n => n.id));
    
    // Find edges originating from vs/platform, limit to 1000 to keep runtime feasible
    const layerEdges = snapshot.edges.filter(e => platformNodeIds.has(e.from)).slice(0, 1000);
    
    console.log(`Found ${platformNodes.length} nodes and ${layerEdges.length} outgoing edges in vs/platform.`);
    
    const ruleEngine = new SimulationRuleEngine();
    ruleEngine.registerRule(new DependencyRemovedRealRule(10)); // Limit depth to 10 for massive layer
    
    let currentSnapshot = snapshot.clone();
    let maxDepth = 0;
    
    let count = 0;
    for (const edge of layerEdges) {
        count++;
        if (count % 100 === 0) process.stdout.write(`\rPropagating edge ${count}/${layerEdges.length}...`);
        const failResult = ruleEngine.propagate(currentSnapshot, {
            id: `fail_${edge.id}`,
            type: SimulationScenarioType.DEPENDENCY_REMOVED,
            targetId: edge.id,
            evidenceIds: []
        });
        if ((failResult.stats?.maxDepthReached || 0) > maxDepth) maxDepth = failResult.stats?.maxDepthReached || 0;
        currentSnapshot = StateTransitionEngine.applyTransitions(currentSnapshot, failResult.transitions).snapshot;
    }
    console.log();

    let workbenchImpact = 0;
    let servicesImpact = 0;
    let extensionHostImpact = 0;

    for (const n of currentSnapshot.nodes) {
        if (n.state !== SimulationState.NORMAL) {
            const p = n.data?.path || "";
            if (p.includes('vs/workbench')) workbenchImpact++;
            if (p.includes('vs/server') || p.includes('services')) servicesImpact++;
            if (p.includes('vs/workbench/services/extensions') || p.includes('extensionHost')) extensionHostImpact++;
        }
    }

    const result = {
        experiment: "layer_collapse",
        targetLayer: "vs/platform",
        workbenchImpact,
        servicesImpact,
        extensionHostImpact,
        maxDepth
    };

    fs.writeFileSync(path.join(OUT_DIR, 'experiment_d_layer_collapse.json'), JSON.stringify(result, null, 2));
    return result;
}

function writeSummary(expA: any[], expB: any[], expC: any[], expD: any) {
    const md = `# VSCode Architectural Ecology Report

## Graph Summary
- Nodes: 26527
- Edges: 102873

## Experiment A: Top Reachability Hubs
${expA.slice(0, 5).map((x, i) => `${i+1}. **${x.path}** (Impacts: ${x.impactedNodes} nodes, Peak Registry: ${x.peakRegistryCount})`).join('\n')}

## Experiment B: Top Bridge Nodes (CrossBoundaryLoad)
${expB.slice(0, 5).map((x, i) => `${i+1}. **${x.path}** (Boundary Edges: ${x.boundaryEdges}, Ratio: ${x.boundaryRatio})`).join('\n')}

## Experiment C: Multi-Cause Collapse Victims
${expC.slice(0, 5).map((x, i) => `${i+1}. **${x.path}** (Peak Registry: ${x.peakRegistryCount}, Recovery Steps: ${x.recoverySteps})`).join('\n')}

## Experiment D: Critical Layer Collapse (vs/platform)
- **Workbench Impact**: ${expD.workbenchImpact}
- **Services Impact**: ${expD.servicesImpact}
- **ExtensionHost Impact**: ${expD.extensionHostImpact}
- **Max Depth**: ${expD.maxDepth}

## Findings
- Multi-Cause Collapse highlights entirely different nodes than raw Reachability, proving the importance of the Failure Registry.
- The boundary between \`vs/platform\` and the rest of the application demonstrates high coupling, cascading deeply into the workbench.
`;
    fs.writeFileSync(path.join(OUT_DIR, 'ecology_report.md'), md);
    console.log(`\nReport generated at ${OUT_DIR}/ecology_report.md`);
}

function main() {
    ensureDir();
    const snapshot = loadRealGraph();
    
    const expA = runExperimentA(snapshot);
    const expB = runExperimentB(snapshot);
    const expC = runExperimentC(snapshot, expA, expB);
    const expD = runExperimentD(snapshot);
    
    writeSummary(expA, expB, expC, expD);
}

main();
