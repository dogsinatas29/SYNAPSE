import * as os from 'os';

function formatMB(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function runSnapshotVolumeTest() {
    console.log("=== Running Test A: Snapshot Volume (Memory/Load) ===");
    const snapshotCounts = [1000, 5000, 10000];

    for (const count of snapshotCounts) {
        console.log(`\n[Generating Snapshot Array: ${count} items...]`);
        
        const genStart = Date.now();
        const history = [];
        for (let i = 0; i < count; i++) {
            history.push({
                id: `snap_${i}`,
                timestamp: Date.now(),
                label: `Snap ${i}`,
                data: { nodes: [{ id: 'n1', val: 'x'.repeat(100) }], edges: [], clusters: [] } 
            });
        }
        const genTime = Date.now() - genStart;
        
        // Simulate stringify and parse (Load Time)
        const stringifyStart = Date.now();
        const raw = JSON.stringify({ history });
        const stringifyTime = Date.now() - stringifyStart;
        
        const parseStart = Date.now();
        const parsed = JSON.parse(raw);
        const parseTime = Date.now() - parseStart;
        
        const mem = process.memoryUsage();

        console.log(`Snapshot Count  : ${count}`);
        console.log(`Gen/Boot Time   : ${genTime} ms`);
        console.log(`Stringify Time  : ${stringifyTime} ms`);
        console.log(`JSON Parse Time : ${parseTime} ms`);
        console.log(`Memory Usage    : RSS=${formatMB(mem.rss)}, HeapUsed=${formatMB(mem.heapUsed)}`);
    }
    console.log("\n[TIER C5] Snapshot Volume Test Completed.");
}

runSnapshotVolumeTest();
