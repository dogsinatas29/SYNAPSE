const fs = require('fs');
const readline = require('readline');
const statePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/temp_target_state.json';
const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';

const stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const nodeIds = new Set();
for (const node of stateData.nodes) {
    nodeIds.add(node.id);
}
console.log("nodeIds.has('ash/session/session_controller_impl.h') =", nodeIds.has('ash/session/session_controller_impl.h'));

let foundInTrace = false;
const rl = readline.createInterface({ input: fs.createReadStream(tracePath), crlfDelay: Infinity });
rl.on('line', line => {
    if (line.includes('ash/session/session_controller_impl.h')) {
        const obj = JSON.parse(line);
        if (obj.normalizedTarget === 'ash/session/session_controller_impl.h') {
            console.log("TRACE ENTRY:", obj);
            foundInTrace = true;
            process.exit(0);
        }
    }
});
