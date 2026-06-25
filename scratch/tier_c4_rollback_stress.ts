import * as fs from 'fs';
import * as path from 'path';

function formatMB(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
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

function generateHistory(count: number) {
    const history = [];
    for (let i = 0; i < count; i++) {
        history.push({
            id: `snap_${i}`,
            timestamp: Date.now(),
            label: `Snap ${i}`,
            data: { nodes: [], edges: [], clusters: [] } // Lightweight to focus on Array find speed
        });
    }
    return history;
}

function runRollbackTest() {
    console.log("=== Running Test E: Rollback Stress (O(n) find) ===");
    const snapshotCounts = [5000, 10000, 50000];

    for (const count of snapshotCounts) {
        console.log(`\n[Generating History Array: ${count} items...]`);
        const history = generateHistory(count);
        
        let lookupTimes = [];
        let heapUsages = [];

        console.log(`[Testing 1000 Random Rollbacks...]`);
        for (let i = 0; i < 1000; i++) {
            const targetId = `snap_${Math.floor(Math.random() * count)}`;
            
            const start = process.hrtime.bigint();
            
            // The O(n) operation:
            const found = history.find(s => s.id === targetId);
            
            const end = process.hrtime.bigint();
            
            if (!found) throw new Error("Missing snapshot!");
            
            lookupTimes.push(Number(end - start) / 1000000); // ms
            heapUsages.push(process.memoryUsage().heapUsed);
        }

        const avgLookup = lookupTimes.reduce((a, b) => a + b, 0) / 1000;
        const maxLookup = Math.max(...lookupTimes);
        const p95Lookup = calculatePercentile(lookupTimes, 0.95);
        
        const avgHeap = heapUsages.reduce((a, b) => a + b, 0) / 1000;

        console.log(`Snapshot Count: ${count}`);
        console.log(`Lookup Time   : Avg=${avgLookup.toFixed(3)}ms | P95=${p95Lookup.toFixed(3)}ms | Max=${maxLookup.toFixed(3)}ms`);
        console.log(`Avg Heap Used : ${formatMB(avgHeap)}`);
    }
    console.log("\n[TIER C4] Rollback Stress Test Completed.");
}

runRollbackTest();
