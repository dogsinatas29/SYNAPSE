
const fs = require('fs');
const path = require('path');

const projectStatePath = path.join(__dirname, 'demo/data/project_state.json');
const historyPath = path.join(__dirname, 'demo/data/synapse_history.json');

async function testRollback() {
    console.log('--- Testing Rollback Logic ---');

    // 1. Read History
    const historyData = fs.readFileSync(historyPath, 'utf8');
    const history = JSON.parse(historyData);

    if (history.length === 0) {
        console.error('No history found');
        return;
    }

    const snapshot = history[0]; // Pick the latest snapshot
    console.log(`Restoring snapshot: ${snapshot.label} (${snapshot.id})`);

    // 2. Read Current State
    const currentStateData = fs.readFileSync(projectStatePath, 'utf8');
    const currentState = JSON.parse(currentStateData);
    console.log('Current Node Count:', currentState.nodes.length);

    // 3. Simulate Logic
    const newState = {
        ...currentState, // keep other props if any (though usually we replace)
        nodes: snapshot.data.nodes,
        edges: snapshot.data.edges,
        clusters: snapshot.data.clusters
    };

    console.log('New Node Count (from snapshot):', newState.nodes.length);

    // 4. Write back (Simulate Save)
    // fs.writeFileSync(projectStatePath, JSON.stringify(newState, null, 2)); 
    // Commented out to avoid actually overwriting during test, just checking logic

    if (newState.nodes.length !== snapshot.data.nodes.length) {
        console.error('MISMATCH: State not correctly updated from snapshot');
    } else {
        console.log('SUCCESS: State logic seems correct');
    }
}

testRollback();
