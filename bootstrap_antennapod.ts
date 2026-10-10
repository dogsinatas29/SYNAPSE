import { BootstrapEngine } from './src/bootstrap/BootstrapEngine';
import * as fs from 'fs';
import * as path from 'path';
import { snapshotSystem } from './src/core/SnapshotSystem';

const projectRoot = '/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod';
const geminiMdPath = '/tmp/GEMINI_ANTENNAPOD.md';

async function run() {
    console.log(`Starting bootstrap on ${projectRoot}`);
    fs.writeFileSync(geminiMdPath, '# AntennaPod\n## Auto Discover\n');

    const engine = new BootstrapEngine();
    
    // override SnapshotSystem.save
    snapshotSystem.save = () => { console.log('Mocked snapshotSystem.save'); };
    
    try {
        const result = await engine.liteBootstrap(projectRoot, (msg) => {});
        console.log(`Bootstrap completed. Final Nodes: ${result.nodes?.length || result.initial_nodes?.length}`);
        
        const projectStateFile = '/tmp/synapse_data/../../../../../../tmp/project_state.json';
        if (fs.existsSync(projectStateFile)) {
            const data = JSON.parse(fs.readFileSync(projectStateFile, 'utf8'));
            const nodes = data.nodes || [];
            const edges = data.edges || [];

            // Metrics requested by user
            const ghostNodes = nodes.filter((n: any) => n.id && n.id.startsWith('ghost://'));
            console.log(`Ghost nodes in project_state: ${ghostNodes.length}`);
            
            // Check specific nodes
            const checkPaths = [
                'modules/navigation_2d/2d/nav_map_builder_2d.h',
                'thirdparty/freetype/src/pcf/pcfutil.c',
                'core/variant/variant_construct.inc'
            ];

            checkPaths.forEach(p => {
                const asGhost = nodes.find((n: any) => n.id === `ghost://${p}`);
                const asReal = nodes.find((n: any) => n.id === p);
                console.log(`Path ${p}: Real=${!!asReal}, Ghost=${!!asGhost}`);
                
                const edgesToGhost = edges.filter((e: any) => e.target === `ghost://${p}`);
                const edgesToReal = edges.filter((e: any) => e.target === p);
                console.log(`  Edges pointing to Real: ${edgesToReal.length}, to Ghost: ${edgesToGhost.length}`);
            });
            
            console.log(`Total Graph Nodes (Real + Ghost): ${nodes.length}`);
            
            const ghost2d = nodes.find((n: any) => n.id === `ghost://2d/nav_map_builder_2d.h`);
            console.log(`Alternative ID ghost://2d/nav_map_builder_2d.h exists? ${!!ghost2d}`);
            const ghostpcf = nodes.find((n: any) => n.id === `ghost://pcfutil.c`);
            console.log(`Alternative ID ghost://pcfutil.c exists? ${!!ghostpcf}`);
            
        } else {
            console.log("Could not find ../../../../../../tmp/project_state.json");
        }
    } catch(e) {
        console.error("Bootstrap error:", e);
    }
}
run().catch(console.error);
