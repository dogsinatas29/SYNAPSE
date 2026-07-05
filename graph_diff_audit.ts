/**
 * Graph Diff Audit for Phase 3 Verification
 * 
 * Compares baseline graph with current graph at node/edge level.
 * Uses project_state.json as baseline and re-scans filesystem as current.
 * 
 * Usage: npx ts-node graph_diff_audit.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { FileScanner } from './src/core/FileScanner';
import { dataPipeline, PipelineResult } from './src/core/DataPipeline';
import { buildGraph } from './src/core/graphBuilder';
import { RuleEngine } from './src/core/RuleEngine';
import { isIgnoredFolder, isIgnoredFile } from './src/utils/exclusionRules';
import { ProjectMetadata } from './src/core/ProjectMetadata';

interface DiffReport {
    baseline_node_count: number;
    current_node_count: number;
    baseline_edge_count: number;
    current_edge_count: number;
    added_nodes: string[];
    removed_nodes: string[];
    added_edges: string[];
    removed_edges: string[];
    added_node_details: { id: string; file?: string; type?: string }[];
    added_edge_details: { from: string; to: string; type?: string }[];
}

function getDiscoverableFiles(projectRoot: string): string[] {
    const fileList: string[] = [];
    const scanDir = (dir: string, relPath: string = '', depth: number = 0) => {
        if (!fs.existsSync(dir) || depth > 10) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const currentRelPath = path.join(relPath, file).replace(/\\/g, '/');
            if (isIgnoredFolder(currentRelPath)) continue;
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDir(fullPath, currentRelPath, depth + 1);
            } else {
                const ext = path.extname(file).toLowerCase();
                const fileName = file.toLowerCase();
                const isProtocol = fileName === 'rules.md' || fileName === 'gemini.md' || fileName === 'architecture.md' || fileName.includes('report');
                if (isIgnoredFile(currentRelPath)) continue;
                const scanExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.cc', '.rs', '.sh', '.sql', '.md', '.csv', '.yaml', '.yml', '.java', '.kt', '.kts', '.swift', '.go'];
                if (scanExtensions.includes(ext) || isProtocol) {
                    fileList.push(currentRelPath);
                }
            }
        }
    };
    scanDir(projectRoot);
    return fileList;
}

async function runGraphDiffAudit(): Promise<DiffReport> {
    const projectRoot = '/home/dogsinatas/TypeScript_project/antigravity-extension-vis';
    
    // 1. Load existing state (baseline)
    const statePath = path.join(projectRoot, 'data', 'project_state.json');
    const existingState = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    
    const baselineNodes = (existingState.nodes || []).map((n: any) => ({
        id: n.id,
        file: n.data?.file || n.filePath || '',
        type: n.type || 'unknown'
    }));
    const baselineEdges = (existingState.edges || []).map((e: any) => ({
        from: e.from,
        to: e.to,
        type: e.type || 'unknown'
    }));
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 GRAPH DIFF AUDIT');
    console.log(`${'='.repeat(60)}\n`);
    
    console.log(`📂 Baseline (from project_state.json):`);
    console.log(`  Nodes: ${baselineNodes.length}`);
    console.log(`  Edges: ${baselineEdges.length}`);
    
    // 2. Re-scan filesystem (current)
    console.log(`\n🔄 Re-scanning filesystem...`);
    RuleEngine.getInstance().loadRules(projectRoot);
    // Initialize ProjectMetadata for security boundary check
    ProjectMetadata.getInstance().initialize(projectRoot, 'Synapse');
    // Add .backup to ignore folders for this audit
    (RuleEngine.getInstance() as any).ignoreFolders.add('.backup');
    const discoveredFiles = getDiscoverableFiles(projectRoot);
    console.log(`  Discovered files: ${discoveredFiles.length}`);
    
    const pipelineResult = dataPipeline.processFiles(discoveredFiles, projectRoot);
    const frozenGraph = buildGraph(pipelineResult.nodes, pipelineResult.edges, pipelineResult.clusters);
    
    const currentNodes = frozenGraph.nodes.map((n: any) => ({
        id: n.id,
        file: n.data?.file || n.filePath || '',
        type: n.type || 'unknown'
    }));
    const currentEdges = frozenGraph.edges.map((e: any) => ({
        from: e.from,
        to: e.to,
        type: e.type || 'unknown'
    }));
    
    console.log(`\n📂 Current (from fresh scan):`);
    console.log(`  Nodes: ${currentNodes.length}`);
    console.log(`  Edges: ${currentEdges.length}`);
    
    // 3. Compute diff
    const baselineNodeIds = new Set(baselineNodes.map((n: any) => n.id));
    const currentNodeIds = new Set(currentNodes.map((n: any) => n.id));
    const baselineEdgeKeys = new Set(baselineEdges.map((e: any) => `${e.from}->${e.to}`));
    const currentEdgeKeys = new Set(currentEdges.map((e: any) => `${e.from}->${e.to}`));
    
    const addedNodes = currentNodes.filter((n: any) => !baselineNodeIds.has(n.id));
    const removedNodes = baselineNodes.filter((n: any) => !currentNodeIds.has(n.id));
    const addedEdges = currentEdges.filter((e: any) => !baselineEdgeKeys.has(`${e.from}->${e.to}`));
    const removedEdges = baselineEdges.filter((e: any) => !currentEdgeKeys.has(`${e.from}->${e.to}`));
    
    // 4. Output diff report
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 DIFF REPORT');
    console.log(`${'='.repeat(60)}\n`);
    
    console.log(`Added Nodes: ${addedNodes.length}`);
    for (const n of addedNodes) {
        console.log(`  + ${n.id} (${n.file || 'no file'})`);
    }
    
    console.log(`\nRemoved Nodes: ${removedNodes.length}`);
    for (const n of removedNodes) {
        console.log(`  - ${n.id} (${n.file || 'no file'})`);
    }
    
    console.log(`\nAdded Edges: ${addedEdges.length}`);
    for (const e of addedEdges) {
        console.log(`  + ${e.from} -> ${e.to} (${e.type || 'unknown'})`);
    }
    
    console.log(`\nRemoved Edges: ${removedEdges.length}`);
    for (const e of removedEdges) {
        console.log(`  - ${e.from} -> ${e.to} (${e.type || 'unknown'})`);
    }
    
    // 5. Save diff files
    const outputDir = path.join(projectRoot, 'scratch');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(outputDir, 'baseline_nodes.txt'), baselineNodes.map((n: any) => n.id).sort().join('\n'));
    fs.writeFileSync(path.join(outputDir, 'current_nodes.txt'), currentNodes.map((n: any) => n.id).sort().join('\n'));
    fs.writeFileSync(path.join(outputDir, 'baseline_edges.txt'), baselineEdges.map((e: any) => `${e.from}->${e.to}`).sort().join('\n'));
    fs.writeFileSync(path.join(outputDir, 'current_edges.txt'), currentEdges.map((e: any) => `${e.from}->${e.to}`).sort().join('\n'));
    
    const diffReport: DiffReport = {
        baseline_node_count: baselineNodes.length,
        current_node_count: currentNodes.length,
        baseline_edge_count: baselineEdges.length,
        current_edge_count: currentEdges.length,
        added_nodes: addedNodes.map((n: any) => n.id),
        removed_nodes: removedNodes.map((n: any) => n.id),
        added_edges: addedEdges.map((e: any) => `${e.from}->${e.to}`),
        removed_edges: removedEdges.map((e: any) => `${e.from}->${e.to}`),
        added_node_details: addedNodes,
        added_edge_details: addedEdges,
    };
    
    fs.writeFileSync(path.join(outputDir, 'graph_diff_report.json'), JSON.stringify(diffReport, null, 2));
    
    console.log(`\n💾 Diff files saved to: ${outputDir}`);
    console.log(`  - baseline_nodes.txt`);
    console.log(`  - current_nodes.txt`);
    console.log(`  - baseline_edges.txt`);
    console.log(`  - current_edges.txt`);
    console.log(`  - graph_diff_report.json`);
    
    // 6. Verdict
    console.log(`\n${'='.repeat(60)}`);
    console.log('⚖️ VERDICT');
    console.log(`${'='.repeat(60)}\n`);
    
    if (addedNodes.length === 0 && removedNodes.length === 0 && addedEdges.length === 0 && removedEdges.length === 0) {
        console.log('✅ LOCKED PASS: Graph is identical to baseline.');
    } else if (removedNodes.length === 0 && removedEdges.length === 0) {
        console.log('⚠️ CONDITIONAL PASS: Only additions detected.');
        console.log('   Verify that added nodes/edges match expected new Scanner files.');
    } else {
        console.log('❌ FAIL: Graph has unexpected changes.');
    }
    
    return diffReport;
}

runGraphDiffAudit().catch(console.error);
