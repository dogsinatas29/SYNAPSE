const fs = require('fs');
const state = JSON.parse(fs.readFileSync('.synapse/project_state.json', 'utf-8'));
const clientDir = '.synapse/clients';
let pushData = null;
if (fs.existsSync(clientDir)) {
    const files = fs.readdirSync(clientDir);
    if (files.length > 0) {
        pushData = JSON.parse(fs.readFileSync('.synapse/clients/' + files[0], 'utf-8'));
        console.log('Client push data found:', files[0], 'nodes:', pushData.nodes.length);
        console.log('Sample node:', pushData.nodes[0]);
    }
}
console.log('Server state nodes:', state.nodes.length);
