const fs = require('fs');
const statePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/temp_target_state.json';
const stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));

let realCount = 0;
let ghostCount = 0;
for (const node of stateData.nodes) {
    if (node.id.startsWith('ash/session/')) {
        if (node.cluster_id.startsWith('cluster_ghost')) {
            ghostCount++;
        } else {
            realCount++;
        }
    }
}
console.log(`ash/session/ -> Real: ${realCount}, Ghost: ${ghostCount}`);
