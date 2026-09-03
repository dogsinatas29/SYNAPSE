import * as fs from 'fs';

const DATA_PATH = '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json';

function main() {
    console.log('Loading Linux Kernel project state...');
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const edges = data.edges || [];
    
    console.log(`Total Edges: ${edges.length}`);
    
    const provenanceCount = new Map<string, number>();
    const typeCount = new Map<string, number>();

    for (const e of edges) {
        const prov = e.provenance || 'MISSING_PROVENANCE';
        const type = e.type || 'MISSING_TYPE';
        
        provenanceCount.set(prov, (provenanceCount.get(prov) || 0) + 1);
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
    }
    
    console.log('\n--- Provenance Distribution ---');
    const sortedProv = Array.from(provenanceCount.entries()).sort((a,b) => b[1] - a[1]);
    for (const [p, c] of sortedProv) {
        console.log(`${p}: ${c} (${((c/edges.length)*100).toFixed(2)}%)`);
    }

    console.log('\n--- Edge Type Distribution ---');
    const sortedType = Array.from(typeCount.entries()).sort((a,b) => b[1] - a[1]);
    for (const [t, c] of sortedType) {
        console.log(`${t}: ${c} (${((c/edges.length)*100).toFixed(2)}%)`);
    }
}

main();
