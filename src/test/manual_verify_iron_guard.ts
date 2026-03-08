import { LogicAnalyzer, AnalysisIssue } from '../core/LogicAnalyzer';
import { ProjectState, Node, Edge } from '../types/schema';
import * as path from 'path';
import * as fs from 'fs';

// Mock workspace root
const workspaceRoot = process.cwd();

const analyzer = new LogicAnalyzer();

const mockNodes: Node[] = [
    {
        id: 'node_shared',
        type: 'source',
        status: 'active',
        position: { x: 0, y: 0 },
        data: { label: 'SharedUtil', layer: 0, file: 'shared.ts' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_frontend',
        type: 'source',
        status: 'active',
        position: { x: 100, y: 100 },
        data: { label: 'UIComponent', layer: 1, file: 'ui.ts' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_api',
        type: 'source',
        status: 'active',
        position: { x: 200, y: 200 },
        data: { label: 'ApiClient', layer: 2, file: 'api.ts' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_service',
        type: 'source',
        status: 'active',
        position: { x: 300, y: 300 },
        data: { label: 'BusinessLogic', layer: 3, file: 'service.ts' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_service_bypass',
        type: 'source',
        status: 'active',
        position: { x: 301, y: 301 },
        data: { label: 'LegacyService', layer: 3, file: 'legacy.ts', content: '// @synapse-bypass\nimport ui from "ui"' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_db',
        type: 'source',
        status: 'active',
        position: { x: 400, y: 400 },
        data: { label: 'Database', layer: 4, file: 'db.py' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_cluster1_internal',
        type: 'source',
        status: 'active',
        position: { x: 500, y: 500 },
        data: { label: 'Internal1', layer: 3, cluster_id: 'cluster1', file: 'c1.ts' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_cluster2_internal',
        type: 'source',
        status: 'active',
        position: { x: 600, y: 600 },
        data: { label: 'Internal2', layer: 3, cluster_id: 'cluster2', file: 'c2.ts' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_cluster2_bridge',
        type: 'source',
        status: 'active',
        position: { x: 650, y: 650 },
        data: { label: 'Cluster2Bridge', layer: 3, cluster_id: 'cluster2', file: 'bridge.ts' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_unsupported',
        type: 'source',
        status: 'active',
        position: { x: 700, y: 700 },
        data: { label: 'ConfigText', layer: 0, file: 'config.txt' },
        visual: { opacity: 1 }
    },
    {
        id: 'node_global',
        type: 'source',
        status: 'active',
        position: { x: 800, y: 800 },
        data: { label: 'GlobalLogger', layer: 99, file: 'logger.ts' },
        visual: { opacity: 1 }
    }
];

const mockEdges: Edge[] = [
    // 1. Valid Gravity (L1 -> L2)
    { id: 'e1', from: 'node_frontend', to: 'node_api', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },
    
    // 2. Invalid Gravity (L3 -> L1) - Critical
    { id: 'e2', from: 'node_service', to: 'node_frontend', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },
    
    // 3. Shared Pass (L0 -> L3) - Valid
    { id: 'e3', from: 'node_shared', to: 'node_service', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },
    
    // 4. Bypass (L3 -> L1 with comment) - Warning (Medium)
    { id: 'e4', from: 'node_service_bypass', to: 'node_frontend', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },
    
    // 5. Boundary Violation (Cluster1 -> Cluster2 Internal) - Warning (Medium)
    { id: 'e5', from: 'node_cluster1_internal', to: 'node_cluster2_internal', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },
    
    // 6. Boundary Valid (Cluster1 -> Cluster2 Bridge) - Valid
    { id: 'e6', from: 'node_cluster1_internal', to: 'node_cluster2_bridge', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },
    
    // 7. Wormhole (L3 -> L1 with type 'event') - Valid
    { id: 'e7', from: 'node_service', to: 'node_frontend', type: 'event', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },
    
    // 8. Unsupported Language (.txt) - Warning (Medium)
    { id: 'e8', from: 'node_frontend', to: 'node_unsupported', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },

    // 9. Global Pass (L4 -> L99) - Valid
    { id: 'e9', from: 'node_db', to: 'node_global', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } },

    // 10. Global Pass Downstream (L99 -> L1) - Valid
    { id: 'e10', from: 'node_global', to: 'node_frontend', type: 'dependency', is_approved: true, visual: { thickness: 1, style: 'solid', color: 'green' } }
];

const state: ProjectState = {
    project_name: 'TestProject',
    gemini_md_path: 'GEMINI.md',
    canvas_state: { zoom_level: 1, offset: { x: 0, y: 0 }, visible_layers: [] },
    nodes: mockNodes,
    edges: mockEdges,
    clusters: []
};

console.log('--- Starting Architecture Guardrail Verification ---');

const issues = analyzer.analyze(state, workspaceRoot);

const architectureIssues = issues.filter((i: AnalysisIssue) => i.type === 'architecture-violation');

console.log(`\nFound ${architectureIssues.length} architecture violations.\n`);

architectureIssues.forEach((issue: AnalysisIssue, idx: number) => {
    console.log(`[${idx + 1}] Severity: ${issue.severity}`);
    console.log(`    Message: ${issue.message}`);
    console.log(`    Nodes: ${issue.nodeIds.join(' -> ')}`);
});

// Verification assertions
const expectedViolations = [
    { from: 'node_service', to: 'node_frontend', severity: 'critical', msg: 'Layer Gravity Violation' },
    { from: 'node_service_bypass', to: 'node_frontend', severity: 'medium', msg: 'Layer Gravity Bypassed' },
    { from: 'node_cluster1_internal', to: 'node_cluster2_internal', severity: 'medium', msg: 'Boundary Violation' },
    { from: 'node_frontend', to: 'node_unsupported', severity: 'medium', msg: 'Unsupported Language' }
];

let allPassed = true;

expectedViolations.forEach(exp => {
    const found = architectureIssues.find((i: AnalysisIssue) => 
        i.nodeIds.includes(exp.from) && 
        i.nodeIds.includes(exp.to) && 
        i.severity === exp.severity &&
        i.message.includes(exp.msg)
    );
    
    if (found) {
        console.log(`✅ Passed: Expected ${exp.severity} for ${exp.from}->${exp.to} (${exp.msg})`);
    } else {
        console.log(`❌ Failed: Missing or incorrect violation for ${exp.from}->${exp.to}. Expected ${exp.severity} with '${exp.msg}'`);
        allPassed = false;
    }
});

// Check if valid paths erroneously triggered violations
const unexpected = architectureIssues.filter((i: AnalysisIssue) => {
    const isExpected = expectedViolations.some(exp => 
        i.nodeIds.includes(exp.from) && i.nodeIds.includes(exp.to)
    );
    return !isExpected;
});

if (unexpected.length > 0) {
    console.log(`❌ Failed: Found ${unexpected.length} unexpected violations:`);
    unexpected.forEach((u: AnalysisIssue) => console.log(`   - ${u.message}`));
    allPassed = false;
} else {
    console.log('✅ Passed: No unexpected violations found.');
}

if (allPassed) {
    console.log('\n✨ ALL ARCHITECTURE RULES VERIFIED SUCCESSFULLY ✨');
    process.exit(0);
} else {
    console.log('\n🚨 SOME VERIFICATION STEPS FAILED 🚨');
    process.exit(1);
}
