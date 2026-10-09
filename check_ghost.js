const fs = require('fs');
const statePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/temp_target_state.json';
const stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));

for (const node of stateData.nodes) {
    if (node.id === 'ash/session/session_controller_impl.h') {
        console.log("NODE:", JSON.stringify(node, null, 2));
    }
}
