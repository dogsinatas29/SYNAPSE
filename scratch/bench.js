const edges = [];
for (let i = 0; i < 100000; i++) {
    edges.push({ id: `edge_${i}`, from: `node_${i}`, to: `node_${i+1}`, type: 'call' });
}
const start = Date.now();
const str = JSON.stringify(edges);
console.log(`Stringified ${edges.length} edges to ${str.length} bytes in ${Date.now() - start}ms`);
