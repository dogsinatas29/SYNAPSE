const fs = require('fs');
const path = require('path');
const readline = require('readline');
const stream = require('stream/promises');

const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';
const statePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/temp_target_state.json';
const projectRoot = '/home/dogsinatas/다운로드/chromium-main';

async function main() {
    console.log("1. 노드 ID 로딩 중...");
    const nodeIds = new Set();
    
    // Using a lightweight parser for the huge temp_target_state.json
    // We only need the node IDs, but parsing 335MB JSON might be okay in Node.js
    const stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    for (const node of stateData.nodes) {
        nodeIds.add(node.id);
    }
    console.log(`-> 총 ${nodeIds.size}개의 노드 ID 확보 완료.`);

    const traceStream = fs.createReadStream(tracePath);
    const rl = readline.createInterface({ input: traceStream, crlfDelay: Infinity });

    const causes = {
        PATH_NORMALIZATION: 0,
        DIRECTORY_REFERENCE: 0,
        TEST_FILE_EXCLUSION: 0,
        BUILD_FOLDER_EXCLUSION: 0,
        SCANNER_EXCLUSION_OTHER: 0,
        UNKNOWN: 0
    };
    
    const sampleCases = {
        PATH_NORMALIZATION: [],
        DIRECTORY_REFERENCE: [],
        TEST_FILE_EXCLUSION: [],
        BUILD_FOLDER_EXCLUSION: [],
        SCANNER_EXCLUSION_OTHER: []
    };

    let totalMissing = 0;

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const obj = JSON.parse(line);
            if (obj.targetPathExists && !obj.targetNodeExists) {
                totalMissing++;
                const target = obj.normalizedTarget;
                const absolutePath = path.join(projectRoot, target);
                
                let isDir = false;
                try {
                    isDir = fs.statSync(absolutePath).isDirectory();
                } catch(e) {}

                let cause = 'UNKNOWN';
                
                if (target.startsWith('/') && nodeIds.has(target.substring(1))) {
                    cause = 'PATH_NORMALIZATION';
                } else if (isDir) {
                    cause = 'DIRECTORY_REFERENCE';
                } else if (target.includes('test') || target.includes('unittest') || target.includes('browsertest')) {
                    cause = 'TEST_FILE_EXCLUSION';
                } else if (target.startsWith('build/') || target.startsWith('/build/') || target.startsWith('out/') || target.startsWith('/out/')) {
                    cause = 'BUILD_FOLDER_EXCLUSION';
                } else {
                    cause = 'SCANNER_EXCLUSION_OTHER';
                }

                causes[cause]++;
                if (sampleCases[cause] && sampleCases[cause].length < 3) {
                    sampleCases[cause].push(`Source: ${obj.source} -> Target: ${target}`);
                }
            }
        } catch(e) {}
    }

    console.log(`\n=== 4,172건 상세 원인 분석 (총 ${totalMissing}건) ===`);
    for (const [cause, count] of Object.entries(causes)) {
        console.log(`- ${cause}: ${count}건`);
        if (sampleCases[cause] && sampleCases[cause].length > 0) {
            console.log(`  [샘플]`);
            sampleCases[cause].forEach(s => console.log(`    ${s}`));
        }
    }
}

main().catch(console.error);
