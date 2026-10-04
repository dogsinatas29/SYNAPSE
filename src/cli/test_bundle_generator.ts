import * as fs from 'fs';
import * as path from 'path';
import { ReportBundleGenerator } from '../core/reporting/ReportBundleGenerator';

async function test() {
    const data = JSON.parse(fs.readFileSync('/home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json', 'utf8'));
    const snapshot = {
        nodes: data.nodes || (data.graph && data.graph.nodes) || [],
        edges: data.edges || (data.graph && data.graph.edges) || [],
        clusters: data.clusters || []
    };
    
    const context = { snapshot, metrics: {}, nodeStats: snapshot.nodes } as any;
    const rootPath = '/home/dogsinatas/다운로드/rustdesk-master';
    
    await ReportBundleGenerator.generateBundle(context, rootPath, { command: 'fetchArchitectureReport' });
    console.log("Bundle generated!");
}
test().catch(console.error);
