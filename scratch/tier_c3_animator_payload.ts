import * as os from 'os';

function formatMB(bytes: number) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function generateFrame(id: number) {
    // A frame is roughly similar to a snapshot, but maybe smaller?
    // Let's assume an average frame payload is 200KB.
    const nodes = Array.from({ length: 500 }, (_, i) => ({ id: `n_${id}_${i}`, path: `/path/to/file_${i}.ts` }));
    const edges = Array.from({ length: 1500 }, (_, i) => ({ id: `e_${id}_${i}`, source: `n_${id}_0`, target: `n_${id}_1` }));
    return {
        id: `frame_${id}`,
        timestamp: Date.now(),
        data: { nodes, edges }
    };
}

function runAnimatorTest() {
    console.log("=== Running Test C: Animator Payload Delivery ===");
    const frameCounts = [100, 500, 1000, 5000];

    for (const count of frameCounts) {
        console.log(`\n[Animator] Generating ${count} frames...`);
        const frames = [];
        for (let i = 0; i < count; i++) {
            frames.push(generateFrame(i));
        }

        const stringifyStart = Date.now();
        const payloadStr = JSON.stringify(frames);
        const stringifyTime = Date.now() - stringifyStart;
        
        const payloadBytes = Buffer.byteLength(payloadStr, 'utf8');
        const payloadMB = formatMB(payloadBytes);

        // Simulate network transfer time on a standard 100Mbps connection (12.5 MB/s)
        const networkTransferTimeMs = (payloadBytes / (12.5 * 1024 * 1024)) * 1000;

        console.log(`Frame Count    : ${count}`);
        console.log(`Payload Size   : ${payloadMB}`);
        console.log(`Stringify Time : ${stringifyTime} ms`);
        console.log(`Est. Transfer  : ${networkTransferTimeMs.toFixed(0)} ms (on 100Mbps)`);
        
        // If > 50MB, trigger chunk streaming decision
        if (payloadBytes > 50 * 1024 * 1024) {
            console.log(`[WARNING] Payload exceeds 50MB. Chunk Streaming required!`);
        }
    }
    console.log("\n[TIER C3] Animator Payload Test Completed.");
}

runAnimatorTest();
