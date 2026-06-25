import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function formatMB(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function checkAbortCondition(startTime: number, opName: string): boolean {
    const elapsed = Date.now() - startTime;
    const mem = process.memoryUsage();
    const totalRam = os.totalmem();
    
    if (elapsed > 60000) {
        console.error(`[ABORT] ${opName} took over 60s (${elapsed}ms).`);
        return true;
    }
    if (mem.rss > totalRam * 0.8) {
        console.error(`[ABORT] RSS memory exceeded 80% of system RAM. (RSS: ${formatMB(mem.rss)})`);
        return true;
    }
    return false;
}

function generateSyntheticSnapshot(id: number) {
    const nodes = Array.from({ length: 1500 }, (_, i) => ({
        id: `node_${id}_${i}`,
        type: 'file',
        path: `/src/components/Comp${i}.tsx`,
        size: Math.floor(Math.random() * 5000)
    }));
    const edges = Array.from({ length: 8000 }, (_, i) => ({
        id: `edge_${id}_${i}`,
        source: `node_${id}_${Math.floor(Math.random() * 1500)}`,
        target: `node_${id}_${Math.floor(Math.random() * 1500)}`,
        type: 'depends_on'
    }));
    return {
        id: `snap_${Date.now()}_${id}`,
        timestamp: Date.now(),
        label: `Synthetic Snapshot ${id}`,
        data: { nodes, edges, clusters: [] }
    };
}

async function buildAndMeasure(targetMB: number, mode: 'B1-A' | 'B1-B') {
    const filePath = path.join(dataDir, `test_history_${targetMB}mb_${mode}.json`);
    console.log(`\n=== Running Test B (${mode}) Target: ${targetMB} MB ===`);

    const targetBytes = targetMB * 1024 * 1024;
    let history: any = { history: [] };
    let currentBytes = 0;
    
    let nodeCount = 0;
    let edgeCount = 0;

    console.log(`[1] Generating payload...`);
    if (mode === 'B1-A') {
        const payloadStr = 'X'.repeat(targetBytes);
        history.history.push({
            id: 'snap_padding',
            timestamp: Date.now(),
            label: 'Padding Snapshot',
            data: payloadStr
        });
        currentBytes = targetBytes;
    } else {
        // Build synthetic topology until size is reached
        let snapIdx = 0;
        while (currentBytes < targetBytes) {
            const snap = generateSyntheticSnapshot(snapIdx++);
            history.history.push(snap);
            nodeCount += snap.data.nodes.length;
            edgeCount += snap.data.edges.length;
            const snapStr = JSON.stringify(snap);
            currentBytes += Buffer.byteLength(snapStr, 'utf8');
            
            if (snapIdx % 50 === 0) {
                if (checkAbortCondition(Date.now(), 'Generation')) return;
            }
        }
    }

    const snapCount = history.history.length;
    console.log(`[Topology Density] Snapshots: ${snapCount}, Nodes: ${nodeCount}, Edges: ${edgeCount}`);
    console.log(`[Topology Density] Average Snapshot Size: ${formatMB(currentBytes / snapCount)}`);

    console.log(`[2] Writing to disk...`);
    fs.writeFileSync(filePath, JSON.stringify(history));
    history = null; // Clear memory
    if (global.gc) global.gc();

    console.log(`[3] Measuring fs.readFileSync...`);
    const readStart = Date.now();
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const readTime = Date.now() - readStart;
    
    if (checkAbortCondition(readStart, 'readFileSync')) return;
    
    const preParseMem = process.memoryUsage();

    console.log(`[4] Measuring JSON.parse...`);
    const parseStart = Date.now();
    let parsedData;
    try {
        parsedData = JSON.parse(rawData);
    } catch (e: any) {
        console.error(`[ABORT] JSON.parse Failed (OOM likely):`, e.message);
        return;
    }
    const parseTime = Date.now() - parseStart;
    
    const postParseMem = process.memoryUsage();
    
    console.log(`\n[Results for ${targetMB}MB ${mode}]`);
    console.log(`Read Time: ${readTime}ms`);
    console.log(`Parse Time: ${parseTime}ms`);
    console.log(`Memory BEFORE Parse: RSS=${formatMB(preParseMem.rss)}, HeapUsed=${formatMB(preParseMem.heapUsed)}, External=${formatMB(preParseMem.external)}`);
    console.log(`Memory AFTER Parse : RSS=${formatMB(postParseMem.rss)}, HeapUsed=${formatMB(postParseMem.heapUsed)}, External=${formatMB(postParseMem.external)}`);
    
    parsedData = null;
    if (global.gc) global.gc();
    
    // Cleanup file
    try { fs.unlinkSync(filePath); } catch (e) {}
}

async function main() {
    const sizes = [50, 100, 250, 500, 1000];
    
    try {
        for (const size of sizes) {
            await buildAndMeasure(size, 'B1-A');
            await buildAndMeasure(size, 'B1-B');
        }
        console.log('\n[TIER C1] All tests completed.');
    } catch (err) {
        console.error('[FATAL]', err);
    }
}

main();
