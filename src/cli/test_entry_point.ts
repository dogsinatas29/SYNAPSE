import * as fs from 'fs';
import { EntryPointDetector } from '../core/analysis/patterns/detectors/EntryPointDetector';

const data = JSON.parse(fs.readFileSync('/home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json', 'utf8'));
const snapshot = {
    nodes: data.nodes || (data.graph && data.graph.nodes) || [],
    edges: data.edges || (data.graph && data.graph.edges) || [],
    clusters: data.clusters || []
};
const detector = new EntryPointDetector();
const findings = detector.detect({ snapshot, metrics: {}, workspaceRoot: '' } as any);
console.log(JSON.stringify(findings, null, 2));
