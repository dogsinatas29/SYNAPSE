const fs = require('fs');
const statePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/temp_target_state.json';
const stateData = JSON.parse(fs.readFileSync(statePath, 'utf8'));

console.log("Searching for nodes containing 'session_controller_impl'...");
for (const node of stateData.nodes) {
    if (node.id.includes('session_controller_impl')) {
        console.log("FOUND NODE:", node.id);
    }
}
