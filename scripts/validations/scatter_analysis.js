const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'top100_semantic_precision.json'), 'utf8'));

// 1. BlastRadius Ratio Analysis
console.log("=== BlastRadius / FanOut Ratio Analysis ===");
const ratios = [];
data.top100.forEach(f => {
    const fanOut = f.evidence.fanOut;
    const blastRadius = f.evidence.blastRadius;
    if (fanOut > 0) {
        const ratio = blastRadius / fanOut;
        ratios.push({ path: f.path, fanOut, blastRadius, ratio });
    }
});
ratios.sort((a, b) => b.ratio - a.ratio);
console.log("Top 10 High Ratios:");
ratios.slice(0, 10).forEach(r => console.log(`- ${r.path}: fanOut=${r.fanOut}, blastRadius=${r.blastRadius}, ratio=${r.ratio.toFixed(2)}`));

const medianRatio = ratios.map(r => r.ratio).sort((a,b)=>a-b)[Math.floor(ratios.length/2)];
console.log(`\nMedian Ratio: ${medianRatio.toFixed(2)}`);

let ratio1to2 = 0;
let ratioOver2 = 0;
ratios.forEach(r => {
    if (r.ratio >= 1.0 && r.ratio <= 2.0) ratio1to2++;
    else if (r.ratio > 2.0) ratioOver2++;
});
console.log(`Ratio 1.0~2.0 (same info): ${ratio1to2} (${(ratio1to2/ratios.length*100).toFixed(1)}%)`);
console.log(`Ratio > 2.0 (multi-hop amplification): ${ratioOver2} (${(ratioOver2/ratios.length*100).toFixed(1)}%)`);

// 2. Scatter Plot (Text Based or Markdown Table)
console.log("\n=== FanIn / FanOut Scatter Data (Top 30 + Outliers) ===");
data.top100.forEach((f, idx) => {
    if (idx < 30 || f.evidence.fanIn > 20 || f.evidence.fanOut > 10) {
        console.log(`[${f.evidence.fanIn.toString().padStart(3)}, ${f.evidence.fanOut.toString().padStart(3)}] : ${f.path}`);
    }
});

