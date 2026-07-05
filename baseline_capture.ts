/**
 * Baseline Capture for v0.3.32.3
 * 
 * Measures Quantitative + Behavioral baselines before structural decoupling.
 * 
 * Usage: npx ts-node baseline_capture.ts
 */

import * as path from 'path';
import * as fs from 'fs';
import { BootstrapEngine } from './src/bootstrap/BootstrapEngine';
import { graphModel } from './src/core/GraphModel';
import { snapshotSystem } from './src/core/SnapshotSystem';

interface BaselineData {
    project: string;
    nodeCount: number;
    edgeCount: number;
    ghostCount: number;
    clusterCount: number;
    clusterIds: string[];
    ghostClusters: string[];
    rootClusterExists: boolean;
    remoteGhostClusterExists: boolean;
    bufferClusterExists: boolean;
    reservedClusterExists: boolean;
    extensionStats: Record<string, number>;
}

async function captureBaseline(projectRoot: string, projectName: string): Promise<BaselineData> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Baseline Capture: ${projectName}`);
    console.log(`📂 Project: ${projectRoot}`);
    console.log(`${'='.repeat(60)}\n`);

    // [v0.3.32.3] Pre-create project_metadata.json to pass security boundary check
    const dataDir = path.join(projectRoot, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    const metadataPath = path.join(dataDir, 'project_metadata.json');
    if (!fs.existsSync(metadataPath)) {
        const metadata = {
            projectUUID: `baseline_${Date.now()}`,
            projectName,
            version: '0.3.32.2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            snapshotCount: 0,
            metadataVersion: 1
        };
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log(`📝 Created temporary project_metadata.json`);
    }

    // [v0.3.32.3] Initialize ProjectMetadata so security boundary check passes
    const { ProjectMetadata } = require('./src/core/ProjectMetadata');
    try {
        ProjectMetadata.getInstance().initialize(projectRoot, projectName);
    } catch (e) {
        // Already initialized, ignore
    }

    // [v0.3.32.3] Pre-create synapse_history.json with correct array format
    const historyPath = path.join(dataDir, 'synapse_history.json');
    if (!fs.existsSync(historyPath)) {
        fs.writeFileSync(historyPath, JSON.stringify([], null, 2), 'utf-8');
    } else {
        // Fix legacy object format if present
        try {
            const raw = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
            if (!Array.isArray(raw) && raw.history !== undefined) {
                fs.writeFileSync(historyPath, JSON.stringify(raw.history, null, 2), 'utf-8');
                console.log(`📝 Fixed legacy object-format synapse_history.json`);
            }
        } catch (e) {
            // Corrupted, recreate
            fs.writeFileSync(historyPath, JSON.stringify([], null, 2), 'utf-8');
        }
    }

    const engine = new BootstrapEngine();
    
    try {
        const result = await engine.liteBootstrap(projectRoot);
        
        if (!result.success) {
            console.error(`❌ Bootstrap failed: ${result.error}`);
            process.exit(1);
        }

        const nodes = result.initial_nodes || [];
        const edges = result.initial_edges || [];
        const clusters = graphModel.createSnapshot().clusters || [];

        // Ghost count
        const ghostNodes = nodes.filter((n: any) => 
            n.status === 'ghost' || 
            n.type === 'EXTERNAL' || 
            n.type === 'SYMBOL' ||
            (n.id && (n.id.startsWith('external://') || n.id.startsWith('ghost://')))
        );

        // Cluster analysis
        const clusterIds = clusters.map((c: any) => c.id);
        const ghostClusters = clusterIds.filter((id: string) => id.startsWith('cluster_ghost'));
        const rootClusterExists = clusters.some((c: any) => c.id === '__unclustered__' || c.label?.includes('Root'));
        const remoteGhostClusterExists = clusterIds.includes('cluster_ghost_network_remote');
        const bufferClusterExists = clusterIds.includes('sys_cluster_buffer');
        const reservedClusterExists = clusterIds.includes('sys_cluster_reserved');

        // Extension stats
        const extensionStats: Record<string, number> = {};
        for (const node of nodes) {
            const filePath = (node as any).data?.file || (node as any).filePath || '';
            if (filePath) {
                const ext = path.extname(filePath).toLowerCase() || '(no ext)';
                extensionStats[ext] = (extensionStats[ext] || 0) + 1;
            }
        }

        const baseline: BaselineData = {
            project: projectName,
            nodeCount: nodes.length,
            edgeCount: edges.length,
            ghostCount: ghostNodes.length,
            clusterCount: clusters.length,
            clusterIds,
            ghostClusters,
            rootClusterExists,
            remoteGhostClusterExists,
            bufferClusterExists,
            reservedClusterExists,
            extensionStats
        };

        // Output
        console.log(`\n📈 QUANTITATIVE BASELINE`);
        console.log(`  Node Count:    ${baseline.nodeCount}`);
        console.log(`  Edge Count:    ${baseline.edgeCount}`);
        console.log(`  Ghost Count:   ${baseline.ghostCount}`);
        console.log(`  Cluster Count: ${baseline.clusterCount}`);

        console.log(`\n📂 CLUSTER ANALYSIS`);
        console.log(`  📁 Root Cluster:          ${baseline.rootClusterExists ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  🌐 Remote Ghost Cluster:  ${baseline.remoteGhostClusterExists ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  🟢 Buffer Cluster:        ${baseline.bufferClusterExists ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  🟡 Reserved Cluster:      ${baseline.reservedClusterExists ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`  Ghost Clusters (${baseline.ghostClusters.length}):`);
        for (const gc of baseline.ghostClusters) {
            console.log(`    - ${gc}`);
        }

        console.log(`\n📊 EXTENSION STATS`);
        const sortedExts = Object.entries(baseline.extensionStats).sort((a, b) => b[1] - a[1]);
        for (const [ext, count] of sortedExts.slice(0, 15)) {
            console.log(`  ${ext.padEnd(10)} ${count}`);
        }
        if (sortedExts.length > 15) {
            console.log(`  ... and ${sortedExts.length - 15} more`);
        }

        // Save to file for later comparison
        const outputPath = path.join(__dirname, `baseline_${projectName.replace(/\s+/g, '_')}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(baseline, null, 2), 'utf-8');
        console.log(`\n💾 Baseline saved to: ${outputPath}`);

        return baseline;

    } catch (error: any) {
        console.error(`❌ Baseline capture failed: ${error.message}`);
        throw error;
    }
}

async function main() {
    console.log('🚀 SYNAPSE v0.3.32.3 Baseline Capture');
    console.log('   Phase 0 — Quantitative + Behavioral Baseline\n');

    const baselines: BaselineData[] = [];

    // Project A: AntennaPod (Java/Kotlin/Ghost/Resolver)
    const antennaPodPath = '/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod';
    if (fs.existsSync(antennaPodPath)) {
        try {
            const ap = await captureBaseline(antennaPodPath, 'AntennaPod');
            baselines.push(ap);
        } catch (e: any) {
            console.error(`⚠️  AntennaPod baseline failed: ${e.message}`);
        }
    } else {
        console.log(`⚠️  AntennaPod not found at: ${antennaPodPath}`);
    }

    // Project B: antigravity-extension-vis (Node CRUD/Buffer/Reserved/Snapshot)
    const synapsePath = '/home/dogsinatas/TypeScript_project/antigravity-extension-vis';
    try {
        const sv = await captureBaseline(synapsePath, 'Synapse');
        baselines.push(sv);
    } catch (e: any) {
        console.error(`⚠️  Synapse baseline failed: ${e.message}`);
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 BASELINE SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`${'Project'.padEnd(20)} ${'Nodes'.padEnd(8)} ${'Edges'.padEnd(8)} ${'Ghosts'.padEnd(8)} ${'Clusters'.padEnd(8)}`);
    console.log('-'.repeat(60));
    for (const b of baselines) {
        console.log(`${b.project.padEnd(20)} ${String(b.nodeCount).padEnd(8)} ${String(b.edgeCount).padEnd(8)} ${String(b.ghostCount).padEnd(8)} ${String(b.clusterCount).padEnd(8)}`);
    }
    console.log(`${'='.repeat(60)}\n`);

    console.log('✅ Phase 0 Baseline Capture Complete');
    console.log('   Next: Record results in mile_stone/v0.3.32.3.md');
}

main().catch(console.error);
