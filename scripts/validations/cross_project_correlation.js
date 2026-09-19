const fs = require('fs');
const path = require('path');

// Calculate Pearson Correlation
function getPearson(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return numerator / denominator;
}

// Calculate Spearman Rank Correlation
function getSpearman(x, y) {
    const n = x.length;
    
    const rankX = getRanks(x);
    const rankY = getRanks(y);
    
    let sumD2 = 0;
    for (let i = 0; i < n; i++) {
        const d = rankX[i] - rankY[i];
        sumD2 += d * d;
    }
    
    return 1 - (6 * sumD2) / (n * (n * n - 1));
}

function getRanks(arr) {
    const sorted = arr.map((val, ind) => ({ val, ind })).sort((a, b) => a.val - b.val);
    const ranks = new Array(arr.length);
    let i = 0;
    while (i < sorted.length) {
        let j = i;
        while (j < sorted.length && sorted[j].val === sorted[i].val) {
            j++;
        }
        const rank = (i + 1 + j) / 2;
        for (let k = i; k < j; k++) {
            ranks[sorted[k].ind] = rank;
        }
        i = j;
    }
    return ranks;
}

function analyzeFile(name, filePath) {
    console.log(`\nAnalyzing ${name}...`);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const nodes = data.nodes || Object.values(data.nodes || {});
        
        let fanIns = [];
        let fanOuts = [];
        
        // If data is an array of nodes (depending on synapse project_state format)
        const nodeList = Array.isArray(nodes) ? nodes : Object.values(nodes);
        
        for (const node of nodeList) {
            const fanIn = node.fanIn || 0;
            const fanOut = node.fanOut || 0;
            fanIns.push(fanIn);
            fanOuts.push(fanOut);
        }
        
        console.log(`Node Count: ${fanIns.length}`);
        
        const pearson = getPearson(fanIns, fanOuts);
        const spearman = getSpearman(fanIns, fanOuts);
        
        console.log(`Pearson Correlation (fanIn vs fanOut): ${pearson.toFixed(4)}`);
        console.log(`Spearman Correlation (fanIn vs fanOut): ${spearman.toFixed(4)}`);
        
    } catch (e) {
        console.error(`Error reading ${name}: ${e.message}`);
    }
}

analyzeFile('SYNAPSE', path.resolve(__dirname, '../../synapse_data/project_state.json'));
analyzeFile('VS Code', '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json');
