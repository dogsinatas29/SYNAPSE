const fs = require('fs');
const readline = require('readline');
const statePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/temp_target_state.json';
const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';

async function main() {
    const nodeIds = new Set();
    const stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    for (const node of stateData.nodes) { nodeIds.add(node.id); }

    const rl = readline.createInterface({ input: fs.createReadStream(tracePath), crlfDelay: Infinity });

    const extCount = {};
    const folderCount = {};

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const obj = JSON.parse(line);
            if (obj.targetPathExists && !obj.targetNodeExists) {
                const target = obj.normalizedTarget;
                
                let isDir = false;
                try { isDir = fs.statSync('/home/dogsinatas/다운로드/chromium-main/' + target).isDirectory(); } catch(e) {}

                if (!isDir && !target.startsWith('/') && !target.includes('test') && !target.startsWith('build/') && !target.startsWith('out/')) {
                    const ext = require('path').extname(target) || '[No Ext]';
                    extCount[ext] = (extCount[ext] || 0) + 1;

                    const folder = target.split('/')[0];
                    folderCount[folder] = (folderCount[folder] || 0) + 1;
                }
            }
        } catch(e) {}
    }

    console.log("=== SCANNER_EXCLUSION_OTHER 확장자별 분류 ===");
    Object.entries(extCount).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`${k}: ${v}건`));

    console.log("\n=== SCANNER_EXCLUSION_OTHER 최상위 폴더별 분류 ===");
    Object.entries(folderCount).sort((a,b)=>b[1]-a[1]).slice(0, 10).forEach(([k,v]) => console.log(`${k}: ${v}건`));
}
main().catch(console.error);
