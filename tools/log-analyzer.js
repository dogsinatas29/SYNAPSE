/* tools/log-analyzer.js [v0.2.28.1 Diagnostic Power Tool] */
const fs = require('fs');
const path = require('path');

function analyze(logPath) {
    if (!fs.existsSync(logPath)) return console.error("Log file not found: " + logPath);
    const lines = fs.readFileSync(logPath, 'utf-8').split('\n');

    const stats = {
        nodeScores: [], createCount: 0, appendCount: 0,
        densities: [], deltas: [], strengths: [],
        spikes: [] 
    };

    lines.forEach((line, idx) => {
        const json = extractJSON(line);
        if (!json) return;

        if (line.includes('[NodeDecision]')) {
            stats.nodeScores.push(json.score);
            json.op === 'CREATE' ? stats.createCount++ : stats.appendCount++;
        } else if (line.includes('[GraphStats]')) {
            const density = parseFloat(json.density);
            const delta = parseFloat(json.delta);
            stats.densities.push(density);
            stats.deltas.push(delta);
            
            if (delta > 0.5) stats.spikes.push({ line: idx + 1, delta, density });
        } else if (line.includes('[ContextShift]')) {
            stats.strengths.push(json.strength);
        }
    });

    return printReport(stats);
}

function extractJSON(line) {
    const start = line.indexOf('{');
    if (start === -1) return null;
    try { return JSON.parse(line.slice(start)); } catch { return null; }
}

function printReport(stats) {
    const avg = arr => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = arr => arr.length === 0 ? 0 : Math.max(...arr);

    const report = {
        createRatio: stats.createCount / (stats.createCount + stats.appendCount || 1),
        avgScore: avg(stats.nodeScores),
        avgDensity: avg(stats.densities),
        maxDensity: max(stats.densities),
        maxDelta: max(stats.deltas),
        avgStrength: avg(stats.strengths)
    };

    console.log('\n=== [SYNAPSE] DIAGNOSTIC REPORT ===');
    console.log(`[Nodes] C/A Ratio: ${report.createRatio.toFixed(2)} | Score Avg: ${report.avgScore.toFixed(2)}`);
    console.log(`[Graph] Density Max: ${report.maxDensity.toFixed(2)} | Delta Max: ${report.maxDelta.toFixed(3)}`);
    console.log(`[Shift] Strength Avg: ${report.avgStrength.toFixed(2)}`);

    console.log('\n[🚨 Pathological Spikes]');
    if (stats.spikes.length === 0) console.log('None detected. System stable.');
    else stats.spikes.forEach(s => console.log(`- Line ${s.line}: Delta ${s.delta.toFixed(3)} (Density: ${s.density})`));

    // Save for config-generator
    fs.writeFileSync('synapse.stats.json', JSON.stringify(report, null, 2));
    return report;
}

const targetLog = process.argv[2] || 'synapse.log';
analyze(targetLog);
