import * as fs from 'fs';
import * as path from 'path';

const historyFile = path.join(__dirname, '..', 'data', 'test_harvest_history.json');

// Ensure clean start
if (fs.existsSync(historyFile)) {
    fs.unlinkSync(historyFile);
}
fs.writeFileSync(historyFile, JSON.stringify({ history: [] }));

// Generate a synthetic payload of ~500KB to simulate a real harvest snapshot
function generatePayload(i: number) {
    const nodes = Array.from({ length: 1000 }, (_, idx) => ({ id: `n_${i}_${idx}`, val: 'x'.repeat(100) }));
    const edges = Array.from({ length: 2000 }, (_, idx) => ({ id: `e_${i}_${idx}`, source: `n_${i}_0`, target: `n_${i}_1` }));
    return {
        id: `harvest_${i}`,
        timestamp: Date.now(),
        data: { nodes, edges }
    };
}

function calculatePercentile(data: number[], p: number) {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
        return sorted[base];
    }
}

async function runHarvestStorm() {
    console.log("=== Running Test D: Harvest Storm Degradation ===");
    const totalHarvests = 1000;
    
    let readTimes: number[] = [];
    let modifyTimes: number[] = [];
    let writeTimes: number[] = [];
    let totalTimes: number[] = [];

    const checkpoints = [100, 500, 1000];

    for (let i = 1; i <= totalHarvests; i++) {
        const iterStart = Date.now();
        
        // 1. Read
        const readStart = Date.now();
        const raw = fs.readFileSync(historyFile, 'utf-8');
        const historyData = JSON.parse(raw);
        const readTime = Date.now() - readStart;
        
        // 2. Modify
        const modifyStart = Date.now();
        historyData.history.push(generatePayload(i));
        const serialized = JSON.stringify(historyData);
        const modifyTime = Date.now() - modifyStart;
        
        // 3. Write
        const writeStart = Date.now();
        fs.writeFileSync(historyFile, serialized);
        const writeTime = Date.now() - writeStart;
        
        const iterTotal = Date.now() - iterStart;

        readTimes.push(readTime);
        modifyTimes.push(modifyTime);
        writeTimes.push(writeTime);
        totalTimes.push(iterTotal);

        if (checkpoints.includes(i)) {
            const stat = fs.statSync(historyFile);
            const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
            
            // Calculate metrics for the current batch
            const batchStart = i === 100 ? 0 : (i === 500 ? 100 : 500);
            const batchTotal = totalTimes.slice(batchStart, i);
            const batchRead = readTimes.slice(batchStart, i);
            const batchModify = modifyTimes.slice(batchStart, i);
            const batchWrite = writeTimes.slice(batchStart, i);

            const min = Math.min(...batchTotal);
            const max = Math.max(...batchTotal);
            const avg = batchTotal.reduce((a, b) => a + b, 0) / batchTotal.length;
            const p95 = calculatePercentile(batchTotal, 0.95);
            
            const avgRead = batchRead.reduce((a, b) => a + b, 0) / batchRead.length;
            const avgModify = batchModify.reduce((a, b) => a + b, 0) / batchModify.length;
            const avgWrite = batchWrite.reduce((a, b) => a + b, 0) / batchWrite.length;

            console.log(`\n[Harvest #${i}] File Size: ${sizeMB} MB`);
            console.log(`  Split (Avg): Read=${avgRead.toFixed(1)}ms | Modify=${avgModify.toFixed(1)}ms | Write=${avgWrite.toFixed(1)}ms`);
            console.log(`  Tail Latency : Min=${min}ms | Avg=${avg.toFixed(1)}ms | P95=${p95.toFixed(1)}ms | Max=${max}ms`);
        }
        
        // Force GC periodically to prevent memory ballooning from interfering with I/O timings
        if (i % 50 === 0 && global.gc) {
            global.gc();
        }
    }
    
    console.log("\n[TIER C2] Harvest Storm Completed.");
    try { fs.unlinkSync(historyFile); } catch (e) {}
}

runHarvestStorm().catch(console.error);
