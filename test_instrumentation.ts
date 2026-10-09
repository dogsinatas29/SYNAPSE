import * as fs from 'fs';
import * as readline from 'readline';

async function runTest() {
    console.log("=== P1 Instrumentation Verification Gate ===");
    
    // 1. Mock Data
    const projectRoot = process.cwd();
    const traceItems = [];
    for (let i = 0; i < 5000; i++) {
        traceItems.push({
            source: 'src/a.ts',
            rawTarget: './b',
            normalizedTarget: `src/b_${i}.ts`,
            resolutionKind: i % 2 === 0 ? 'direct' : 'unresolved',
            isGhost: false,
            targetPathExists: i % 2 === 0,
            targetNodeExists: i % 2 === 0,
            resolverMatched: i % 2 === 0
        });
    }

    const actualEdgeSet = new Set<string>();
    for (let i = 0; i < 2000; i++) {
        actualEdgeSet.add(`src/a.ts::src/b_${i}.ts`);
    }
    
    // Memory before
    const memBefore = process.memoryUsage();
    const start = Date.now();
    
    // 2. Run instrumentation logic
    const tracePath = 'test_trace.ndjson';
    const traceStream = fs.createWriteStream(tracePath, { flags: 'w' });
    let traceCount = 0;
    const maxTraces = 3000;
    let skippedCount = 0;
    
    for (const item of traceItems) {
        if (traceCount >= maxTraces) {
            skippedCount++;
            continue;
        }
        const edgeCreated = actualEdgeSet.has(`${item.source}::${item.normalizedTarget}`);
        const outObj = { ...item, edgeCreated };
        
        const canWrite = traceStream.write(JSON.stringify(outObj) + '\n');
        if (!canWrite) {
            await new Promise(r => traceStream.once('drain', () => r(undefined)));
        }
        traceCount++;
    }
    
    traceStream.write(JSON.stringify({ 
        _metadata: { 
            totalAttempted: traceItems.length,
            totalRecorded: traceCount,
            totalSkipped: skippedCount,
            capReached: skippedCount > 0,
            limitations: "edgeCreated is based on source->target signature."
        }
    }) + '\n');
    
    traceStream.end();
    await new Promise(r => traceStream.once('finish', () => r(undefined)));
    
    const end = Date.now();
    const memAfter = process.memoryUsage();
    
    console.log(`- Time taken: ${end - start}ms`);
    console.log(`- Memory RSS Diff: ${Math.round((memAfter.rss - memBefore.rss) / 1024 / 1024)}MB`);
    console.log(`- Memory Heap Diff: ${Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024)}MB`);
    
    // 3. Validation
    console.log("Validating generated file...");
    const rl = readline.createInterface({ input: fs.createReadStream(tracePath) });
    let parsedCount = 0;
    let metadata = null;
    
    for await (const line of rl) {
        const obj = JSON.parse(line);
        if (obj._metadata) {
            metadata = obj._metadata;
        } else {
            parsedCount++;
        }
    }
    
    console.log(`- Parsed Traces: ${parsedCount}`);
    console.log(`- Metadata:`, metadata);
    console.log(`[PASS] JSON validation complete`);
}

runTest().catch(console.error);
