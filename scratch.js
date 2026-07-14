const fs = require('fs');
console.log("Reading project_state.json...");
const data = fs.readFileSync('/home/dogsinatas/TypeScript_project/antigravity-extension-vis/demo/data/project_state.json', 'utf-8');
const state = JSON.parse(data);
console.log(`Nodes: ${state.nodes.length}, Edges: ${state.edges.length}`);
