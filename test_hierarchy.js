const fs = require('fs');
const statePath = '/home/dogsinatas/TypeScript_project/antigravity-extension-vis/report/temp_target_state.json';
if (!fs.existsSync(statePath)) {
    console.log('File not found');
    process.exit(1);
}
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const clusters = state.clusters;
const clusterArray = Array.isArray(clusters) ? clusters : Object.values(clusters);
let noParent = 0;
let withParent = 0;
const ids = new Set(clusterArray.map(c => c.id));
let missingParentId = 0;
for (const c of clusterArray) {
    if (!c.parent_id) {
        noParent++;
    } else {
        withParent++;
        if (!ids.has(c.parent_id)) {
            missingParentId++;
        }
    }
}
console.log(`Total: ${clusterArray.length}, No parent: ${noParent}, With parent: ${withParent}, Missing parent in array: ${missingParentId}`);
