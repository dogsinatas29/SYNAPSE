import * as fs from 'fs';

const DATA_PATH = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json';
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

console.log('--- Edge Samples ---');
console.log(JSON.stringify(data.edges.slice(0, 5), null, 2));

console.log('--- Edge Schema Stats ---');
let hasSemanticType = 0;
let hasProvenance = 0;
let hasType = 0;

for (const e of data.edges) {
  if (e.semanticType) hasSemanticType++;
  if (e.provenance) hasProvenance++;
  if (e.type) hasType++;
}

console.log(`Total edges: ${data.edges.length}`);
console.log(`Has semanticType: ${hasSemanticType}`);
console.log(`Has provenance: ${hasProvenance}`);
console.log(`Has type: ${hasType}`);
