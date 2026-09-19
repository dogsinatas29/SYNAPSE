const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, 'top100_semantic_precision.json');
if (!fs.existsSync(dataPath)) {
    console.error('Data not found');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let csvContent = 'path,fanIn,fanOut,blastRadius,confidence\n';
data.top100.forEach(f => {
    const p = f.path;
    const fanIn = f.evidence.fanIn;
    const fanOut = f.evidence.fanOut;
    const blastRadius = f.evidence.blastRadius;
    const confidence = f.confidence;
    csvContent += `${p},${fanIn},${fanOut},${blastRadius},${confidence}\n`;
});

const outPath = path.resolve(__dirname, 'top100_evidence.csv');
fs.writeFileSync(outPath, csvContent);
console.log(`CSV created at ${outPath}`);
