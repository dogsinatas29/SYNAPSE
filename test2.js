const state = {
  nodes: Array.from({length: 386210}, (_, i) => ({ id: `node${i}` })),
  edges: Array.from({length: 150000}, (_, i) => ({ id: `edge${i}`, from: `node${i}`, to: `node${i+1}` }))
};
console.log("Parsed state edges length:", state.edges.length);
const bufferEdges = new Map();
const bufferNodes = new Map();

const nodes = Array.isArray(state.nodes) ? state.nodes : Object.values(state.nodes || {});
nodes.forEach((n) => {
    bufferNodes.set(n.id, { ...n });
});

const edges = Array.isArray(state.edges) ? state.edges : Object.values(state.edges || {});
edges.forEach((e) => {
    const id = e.id || `${e.from}->${e.to}`;
    bufferEdges.set(id, { ...e });
});
console.log("BufferNodes size:", bufferNodes.size);
console.log("BufferEdges size:", bufferEdges.size);
