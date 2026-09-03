import * as fs from 'fs';

const statePath = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json';
const outPath = statePath + '.indexed';

console.log('Reading monolithic state for the last time to generate indexed version...');
const raw = fs.readFileSync(statePath, 'utf8');
const state = JSON.parse(raw);

console.log('Writing indexed state file and .idx...');
const fd = fs.openSync(outPath, 'w');
let offset = 0;

function writeStr(str: string) {
    const buf = Buffer.from(str, 'utf8');
    fs.writeSync(fd, buf);
    const start = offset;
    offset += buf.length;
    return { start, end: offset - 1 };
}

writeStr('{\n');

writeStr('"nodes": ');
const nodesSpan = writeStr(JSON.stringify(Array.isArray(state.nodes) ? state.nodes : Object.values(state.nodes || {})));
writeStr(',\n');

writeStr('"edges": ');
const edgesSpan = writeStr(JSON.stringify(Array.isArray(state.edges) ? state.edges : Object.values(state.edges || {})));
writeStr(',\n');

writeStr('"clusters": ');
const clustersSpan = writeStr(JSON.stringify(Array.isArray(state.clusters) ? state.clusters : Object.values(state.clusters || {})));
writeStr(',\n');

writeStr('"boundaries": ');
const boundariesSpan = writeStr(JSON.stringify(Array.isArray(state.boundaries) ? state.boundaries : Object.values(state.boundaries || {})));
writeStr('\n}');

fs.closeSync(fd);

const index = {
    nodes: nodesSpan,
    edges: edgesSpan,
    clusters: clustersSpan,
    boundaries: boundariesSpan
};

fs.writeFileSync(outPath + '.idx', JSON.stringify(index, null, 2));

console.log(`Successfully created:\n- ${outPath}\n- ${outPath}.idx`);
