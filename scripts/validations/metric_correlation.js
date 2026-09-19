const fs = require('fs');
const path = require('path');

const projectPath = path.resolve(__dirname, '../../synapse_data/project_state.json');
const data = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

const nodes = data.nodes || [];
const edges = data.edges || [];

const fanInMap = new Map();
const fanOutMap = new Map();
const adjList = new Map();

nodes.forEach(n => {
    fanInMap.set(n.id, 0);
    fanOutMap.set(n.id, 0);
    adjList.set(n.id, []);
});

edges.forEach(e => {
    const from = e.source || e.from;
    const to = e.target || e.to;
    if (fanOutMap.has(from)) fanOutMap.set(from, fanOutMap.get(from) + 1);
    if (fanInMap.has(to)) fanInMap.set(to, fanInMap.get(to) + 1);
    
    if (adjList.has(from)) {
        adjList.get(from).push(to);
    }
});

const computeBlastRadius = (startId) => {
    const visited = new Set();
    let currentQueue = [startId];
    
    for (let hop = 0; hop < 2; hop++) {
        const nextQueue = [];
        for (const id of currentQueue) {
            const neighbors = adjList.get(id) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor) && neighbor !== startId) {
                    visited.add(neighbor);
                    nextQueue.push(neighbor);
                }
            }
        }
        currentQueue = nextQueue;
    }
    return visited.size;
};

const metrics = nodes.map(n => ({
    id: n.id,
    fanIn: fanInMap.get(n.id) || 0,
    fanOut: fanOutMap.get(n.id) || 0,
    blastRadius: computeBlastRadius(n.id)
})).filter(m => m.fanIn > 0 || m.fanOut > 0 || m.blastRadius > 0); // Ignore completely disconnected nodes

// Calculate Pearson Correlation
function getPearsonCorrelation(x, y) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    const n = x.length;
    for(let i=0; i<n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return numerator / denominator;
}

const fanInArr = metrics.map(m => m.fanIn);
const fanOutArr = metrics.map(m => m.fanOut);
const blastRadiusArr = metrics.map(m => m.blastRadius);

console.log("Total active nodes:", metrics.length);
console.log("Corr(fanIn, fanOut):", getPearsonCorrelation(fanInArr, fanOutArr).toFixed(4));
console.log("Corr(fanIn, blastRadius):", getPearsonCorrelation(fanInArr, blastRadiusArr).toFixed(4));
console.log("Corr(fanOut, blastRadius):", getPearsonCorrelation(fanOutArr, blastRadiusArr).toFixed(4));

