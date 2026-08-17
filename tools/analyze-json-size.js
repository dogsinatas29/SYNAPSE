const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || path.join(process.cwd(), 'synapse_report', 'b5_validation_layer.latest.json');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const stats = fs.statSync(filePath);
const totalSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`Analyzing: ${filePath}`);
console.log(`Total Size: ${totalSizeMB} MB`);
console.log(`Reading JSON...\n`);

const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function getBytes(obj) {
    if (obj === undefined) return 0;
    return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

const breakdown = [];

// Determine where the data lives
const nodes = data.nodes || (data.snapshot && data.snapshot.nodes) || (data.graph && data.graph.nodes) || [];
const edges = data.edges || (data.snapshot && data.snapshot.edges) || (data.graph && data.graph.edges) || [];
const clusters = data.clusters || (data.snapshot && data.snapshot.clusters) || (data.graph && data.graph.clusters) || [];
const metadata = data.metadata || (data.snapshot && data.snapshot.metadata) || {};

breakdown.push({ Name: 'nodes', Size: getBytes(nodes) });
breakdown.push({ Name: 'edges', Size: getBytes(edges) });
breakdown.push({ Name: 'clusters', Size: getBytes(clusters) });
breakdown.push({ Name: 'metadata', Size: getBytes(metadata) });

if (data.metrics) {
    for (const key of Object.keys(data.metrics)) {
        breakdown.push({ Name: `metrics.${key}`, Size: getBytes(data.metrics[key]) });
    }
}

// Sort by size DESC
breakdown.sort((a, b) => b.Size - a.Size);

console.log(`--- Report Size Breakdown ---`);
for (const item of breakdown) {
    const mb = (item.Size / (1024 * 1024)).toFixed(2);
    if (parseFloat(mb) > 0.01) { // Only show > 10KB
        console.log(`${item.Name.padEnd(30)} : ${mb.padStart(8)} MB`);
    }
}

// Sample Node
if (nodes && nodes.length > 0) {
    const sampleNode = nodes[0];
    console.log(`\n--- Node Internal Breakdown (Sample 1 Node) ---`);
    for (const key of Object.keys(sampleNode)) {
        const bytes = getBytes(sampleNode[key]);
        console.log(`${key.padEnd(20)} : ${bytes.toString().padStart(6)} bytes`);
    }
}

// Sample Edge
if (edges && edges.length > 0) {
    const sampleEdge = edges.find(e => e.type === 'CALL') || edges[0];
    console.log(`\n--- Edge Internal Breakdown (Sample 1 Edge, Type: ${sampleEdge.type}) ---`);
    for (const key of Object.keys(sampleEdge)) {
        const bytes = getBytes(sampleEdge[key]);
        console.log(`${key.padEnd(20)} : ${bytes.toString().padStart(6)} bytes`);
    }
}
