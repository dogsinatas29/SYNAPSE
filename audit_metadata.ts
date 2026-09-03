import * as fs from 'fs';
import { SimulationProjectionBuilder } from './src/core/simulation/SimulationProjectionBuilder';
import { SimulationScopeResolver } from './src/core/simulation/SimulationScopeResolver';

async function runAudit() {
    const statePath = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json.indexed';
    const scope = SimulationScopeResolver.resolve([], 'PROJECT');
    const snapshot = await SimulationProjectionBuilder.build(statePath, scope);

    // Node types
    const nodeTypes = new Map<string, number>();
    const nodeDataKeys = new Map<string, number>();
    const apiEvidence = new Map<string, number>();
    const controlEvidence = new Map<string, number>();

    snapshot.nodes.forEach(n => {
        nodeTypes.set(n.type, (nodeTypes.get(n.type) || 0) + 1);
        if (n.data) {
            Object.keys(n.data).forEach(k => {
                nodeDataKeys.set(k, (nodeDataKeys.get(k) || 0) + 1);
            });
            // Try to find evidence of API
            if (n.data.label && String(n.data.label).toLowerCase().includes('api')) {
                apiEvidence.set('label_contains_api', (apiEvidence.get('label_contains_api') || 0) + 1);
            }
            if (n.data.hasAtomicSignature) {
                apiEvidence.set('hasAtomicSignature', (apiEvidence.get('hasAtomicSignature') || 0) + 1);
            }
            if (n.data.hasImportSignature) {
                apiEvidence.set('hasImportSignature', (apiEvidence.get('hasImportSignature') || 0) + 1);
            }
            
            // Try to find evidence of Control Node
            if (n.data.role) {
                controlEvidence.set(`role:${n.data.role}`, (controlEvidence.get(`role:${n.data.role}`) || 0) + 1);
            }
            if (n.data.category) {
                controlEvidence.set(`category:${n.data.category}`, (controlEvidence.get(`category:${n.data.category}`) || 0) + 1);
            }
        }
    });

    // Edge types
    const edgeTypes = new Map<string, number>();
    snapshot.edges.forEach(e => {
        edgeTypes.set(e.type, (edgeTypes.get(e.type) || 0) + 1);
    });

    // Boundary schemas
    const boundaryTypes = new Map<string, number>();
    let boundaryMaxMembers = 0;
    snapshot.boundaries.forEach(b => {
        boundaryTypes.set(b.type, (boundaryTypes.get(b.type) || 0) + 1);
        boundaryMaxMembers = Math.max(boundaryMaxMembers, b.members.length);
    });

    console.log("=== Node Type Distribution ===");
    console.log(Object.fromEntries(nodeTypes));

    console.log("\n=== Edge Type Distribution ===");
    console.log(Object.fromEntries(edgeTypes));
    
    console.log("\n=== Boundary Types ===");
    console.log(Object.fromEntries(boundaryTypes));
    console.log(`Max Boundary Members: ${boundaryMaxMembers}`);

    console.log("\n=== Available Node Data Keys ===");
    console.log(Object.fromEntries(nodeDataKeys));

    console.log("\n=== API Node Detection Evidence ===");
    console.log(Object.fromEntries(apiEvidence));

    console.log("\n=== Control Node Detection Evidence ===");
    console.log(Object.fromEntries(controlEvidence));
}

runAudit().catch(console.error);
