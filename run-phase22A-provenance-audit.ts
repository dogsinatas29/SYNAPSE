import * as fs from 'fs';

const paths = [
    { name: 'Linux Kernel', path: '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json' },
    { name: 'AntennaPod', path: '/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/synapse_data/project_state.json' },
    { name: 'VSCode', path: '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json' }
];

function auditProject(name: string, dataPath: string) {
    if (!fs.existsSync(dataPath)) {
        console.log(`\n[${name}] Data file not found at: ${dataPath}`);
        return;
    }
    
    console.log(`\n=============================================`);
    console.log(`Loading ${name} project state...`);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
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

function main() {
    for (const p of paths) {
        try {
            auditProject(p.name, p.path);
        } catch (e: any) {
            console.log(`Error auditing ${p.name}: ${e.message}`);
        }
    }
}

main();
