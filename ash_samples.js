const fs = require('fs');
const readline = require('readline');
const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';

async function main() {
    const rl = readline.createInterface({ input: fs.createReadStream(tracePath), crlfDelay: Infinity });
    let count = 0;
    console.log("=== ash/ 20건 샘플 추적 ===");
    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const obj = JSON.parse(line);
            if (obj.targetPathExists && !obj.targetNodeExists && obj.normalizedTarget.startsWith('ash/')) {
                console.log(`[${count+1}] source: ${obj.source}`);
                console.log(`    rawTarget: ${obj.rawTarget}`);
                console.log(`    normalizedTarget: ${obj.normalizedTarget}`);
                console.log(`    resolutionKind: ${obj.resolutionKind}`);
                count++;
                if (count >= 20) break;
            }
        } catch(e) {}
    }
}
main().catch(console.error);
