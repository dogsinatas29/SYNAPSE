const fs = require('fs');
const state = JSON.parse(fs.readFileSync('synapse_data/project_state.json', 'utf8'));
console.log("Parsed state edges length:", state.edges ? state.edges.length : 'undefined');
const bufferEdges = new Map();
const edges = Array.isArray(state.edges) ? state.edges : Object.values(state.edges || {});
edges.forEach(e => {
    const id = e.id || `${e.from}->${e.to}`;
    bufferEdges.set(id, { ...e });
});
console.log("BufferEdges size:", bufferEdges.size);
