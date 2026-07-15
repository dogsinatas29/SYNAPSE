import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkGraphGenerator, BenchmarkTopologyProfile, TOPOLOGY_PROFILES } from './BenchmarkGraphGenerator';
import { analyzeGraph } from '../GraphAnalyzer';
import { applyLayout } from '../LayoutEngine';
import { detectCommunities } from '../CommunityDetector';
import { GhostPolicy, RawReference } from '../GhostPolicy';
import { ReferenceResolver } from '../ReferenceResolver';
import { GhostExpander } from '../GhostExpander';
import { EdgeBuilder } from '../EdgeBuilder';
import { SymbolIndex } from '../SymbolIndex';
import { CanvasPanel } from '../../webview/CanvasPanel';
import { Node, Edge, Cluster } from '../GraphModel';

export interface BenchmarkConfig {
    nodes: number;
    edges: number;
    clusters: number;
    profile: BenchmarkTopologyProfile;
    maxHubDegree: number;
}

export class BenchmarkHarness {
    public static async runSuite(panel: CanvasPanel, workspaceRoot: string) {
        const configs: BenchmarkConfig[] = [
            { nodes: 500, edges: 1500, clusters: 10, profile: TOPOLOGY_PROFILES.IDE_SMALL, maxHubDegree: 500 },
            { nodes: 1000, edges: 3000, clusters: 20, profile: TOPOLOGY_PROFILES.IDE_MEDIUM, maxHubDegree: 1000 },
            { nodes: 3000, edges: 10000, clusters: 40, profile: TOPOLOGY_PROFILES.IDE_LARGE, maxHubDegree: 2000 },
            { nodes: 5000, edges: 20000, clusters: 50, profile: TOPOLOGY_PROFILES.PATHOLOGICAL, maxHubDegree: 5000 }
        ];

        const results = [];
        for (const config of configs) {
            const runRes = await this.runBenchmarkWithRetries(config, panel);
            results.push(runRes);
        }

        this.generateReport(results, workspaceRoot);
    }

    private static async runBenchmarkWithRetries(config: BenchmarkConfig, panel: CanvasPanel) {
        console.log(`[SYNAPSE Benchmark] Starting config: ${config.nodes}N, ${config.edges}E, ${config.clusters}C (${config.profile.name})`);
        
        // Warmup
        await this.runSinglePass(config, panel, true);

        const runs = [];
        for (let i = 0; i < 2; i++) {  // [v0.3.33] 5 → 2: 회귀 탐지 목적에는 2 pass면 충분. 5 pass는 웹뷰 메모리 압력을 2.5배 증가시킴.
            const res = await this.runSinglePass(config, panel, false);
            runs.push(res);
        }

        // Aggregate runs
        const aggregated = this.aggregateResults(runs);
        aggregated.config = config;
        return aggregated;
    }

    private static getMemory() {
        const mem = process.memoryUsage();
        return {
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            rss: Math.round(mem.rss / 1024 / 1024)
        };
    }

    private static async runSinglePass(config: BenchmarkConfig, panel: CanvasPanel, isWarmup: boolean) {
        const memorySnapshots: any = {};
        const backendProfile: any = {};

        memorySnapshots.beforeGeneration = this.getMemory();

        const tScanStart = process.hrtime.bigint();
        const graphData = BenchmarkGraphGenerator.generate(
            config.nodes, config.edges, config.clusters, config.profile, config.maxHubDegree
        );
        backendProfile.scanMs = Number(process.hrtime.bigint() - tScanStart) / 1e6;

        memorySnapshots.afterGeneration = this.getMemory();

        // Convert edges to RawReferences to test the resolution pipeline
        const rawRefs: RawReference[] = graphData.edges.map(e => ({
            sourceId: e.from,
            target: e.to,
            rawText: e.to,
            type: 'import'
        }));

        // Policy
        const tPolicyStart = process.hrtime.bigint();
        const policyResult = GhostPolicy.filter([{ filePath: 'mock', summary: { references: rawRefs, functions: [], classes: [] } as any }]);
        backendProfile.policyMs = Number(process.hrtime.bigint() - tPolicyStart) / 1e6;

        // Resolve
        const tResolveStart = process.hrtime.bigint();
        const resolvedRefs = ReferenceResolver.resolve(policyResult.validReferences, graphData.nodeIds, SymbolIndex.getInstance());
        backendProfile.resolveMs = Number(process.hrtime.bigint() - tResolveStart) / 1e6;

        // Expand
        const tExpandStart = process.hrtime.bigint();
        const expansionResult = GhostExpander.expand(resolvedRefs, graphData.clusterIds, graphData.nodeIds);
        backendProfile.expandMs = Number(process.hrtime.bigint() - tExpandStart) / 1e6;

        // Build
        const tBuildStart = process.hrtime.bigint();
        const edgeBuilderResult = EdgeBuilder.build(expansionResult.expandedReferences);
        backendProfile.buildMs = Number(process.hrtime.bigint() - tBuildStart) / 1e6;

        // Analyze
        const tAnalyzeStart = process.hrtime.bigint();
        const analysis = analyzeGraph({ nodes: graphData.nodes, edges: graphData.edges, clusterIds: graphData.clusterIds, nodeIds: graphData.nodeIds });
        backendProfile.analyzeMs = Number(process.hrtime.bigint() - tAnalyzeStart) / 1e6;

        // Layout
        const tLayoutStart = process.hrtime.bigint();
        const layoutResult = applyLayout({ nodes: graphData.nodes, clusters: graphData.clusters, analysis });
        backendProfile.layoutTotalMs = Number(process.hrtime.bigint() - tLayoutStart) / 1e6;
        backendProfile.layoutMicro = layoutResult.profile;

        memorySnapshots.afterLayout = this.getMemory();

        // Community
        const tCommunityStart = process.hrtime.bigint();
        detectCommunities(graphData.nodes, graphData.edges);
        backendProfile.communityMs = Number(process.hrtime.bigint() - tCommunityStart) / 1e6;

        // Diagnostics
        const tDiagStart = process.hrtime.bigint();
        // Skip actual diagnostic string generation to save memory, just measure empty wrapper
        backendProfile.diagnosticsMs = Number(process.hrtime.bigint() - tDiagStart) / 1e6;

        if (isWarmup) return null;

        // Load into Webview
        // Load into Webview
        const tSerialize = process.hrtime.bigint();
        const payloadObj = { nodes: graphData.nodes, edges: graphData.edges, clusters: graphData.clusters };
        const dataString = JSON.stringify(payloadObj);
        backendProfile.ipcSerializeMs = Number(process.hrtime.bigint() - tSerialize) / 1e6;
        backendProfile.payloadSizeBytes = Buffer.byteLength(dataString, 'utf8');
        backendProfile.payloadBreakdown = {
            nodesBytes: Buffer.byteLength(JSON.stringify(graphData.nodes || []), 'utf8'),
            nodesCount: graphData.nodes ? graphData.nodes.length : 0,
            edgesBytes: Buffer.byteLength(JSON.stringify(graphData.edges || []), 'utf8'),
            edgesCount: graphData.edges ? graphData.edges.length : 0,
            clustersBytes: Buffer.byteLength(JSON.stringify(graphData.clusters || []), 'utf8'),
            clustersCount: graphData.clusters ? graphData.clusters.length : 0
        };
        
        const payload = {
            command: 'projectStateDataString',
            dataString: dataString,
            ipcTimestamp: Date.now()
        };
        
        const tWebviewLoad = process.hrtime.bigint();
        (panel as any)._panel.webview.postMessage(payload);

        // Wait for Init Profile
        const initProfile = await new Promise<any>((resolve) => {
            const timeout = setTimeout(() => resolve(null), 10000);
            const listener = (panel as any)._panel.webview.onDidReceiveMessage((msg: any) => {
                if (msg.command === 'benchmarkInitProfile') {
                    clearTimeout(timeout);
                    listener.dispose();
                    resolve(msg.result);
                }
            });
        });
        
        if (initProfile) {
            backendProfile.ipcTransferMs = initProfile.transferMs;
            backendProfile.ipcDeserializeMs = initProfile.deserializeMs;
            backendProfile.cacheBuildMs = initProfile.cacheBuildMs;
            backendProfile.firstPaintMs = initProfile.firstPaintMs;
            backendProfile.firstInteractiveMs = initProfile.firstInteractiveMs;
            if (initProfile.cacheBreakdown) {
                backendProfile.cacheBreakdown = initProfile.cacheBreakdown;
            }
            if (initProfile.memBreakdown) {
                backendProfile.memBreakdown = initProfile.memBreakdown;
            }
        }

        backendProfile.webviewLoadMs = Number(process.hrtime.bigint() - tWebviewLoad) / 1e6;
        memorySnapshots.afterWebviewLoad = this.getMemory();

        // Run Webview Benchmarks
        const fpsResults: any = {};
        try {
            fpsResults.static = await panel.runWebviewBenchmark('static');
            fpsResults.pan = await panel.runWebviewBenchmark('pan');
            fpsResults.zoom = await panel.runWebviewBenchmark('zoom');
        } catch (e) {
            console.error('[SYNAPSE] Webview benchmark failed', e);
        }

        memorySnapshots.afterBenchmark = this.getMemory();

        return {
            backendProfile,
            memorySnapshots,
            fpsResults,
            topologyStats: graphData.stats
        };
    }

    private static aggregateResults(runs: any[]) {
        if (runs.length === 0) return {};
        const aggregated = JSON.parse(JSON.stringify(runs[0]));

        const getMedian = (arr: number[]) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        };

        const getP95 = (arr: number[]) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            return sorted[Math.floor(sorted.length * 0.95)];
        };

        const aggregateField = (obj: any, path: string[]) => {
            const values = runs.map(r => {
                let curr = r;
                for (const p of path) {
                    if (curr === undefined || curr === null) return undefined;
                    curr = curr[p];
                }
                return curr;
            }).filter(v => typeof v === 'number');
            
            if (values.length === 0) return { median: 0, p95: 0 };
            return {
                median: getMedian(values),
                p95: getP95(values)
            };
        };

        // Backend
        for (const k in aggregated.backendProfile) {
            if (typeof aggregated.backendProfile[k] === 'number') {
                const stats = aggregateField(aggregated, ['backendProfile', k]);
                aggregated.backendProfile[k] = stats.median; // Store median for simplicity in report
                aggregated.backendProfile[`${k}_p95`] = stats.p95;
            }
        }
        if (aggregated.backendProfile.layoutMicro) {
            for (const k in aggregated.backendProfile.layoutMicro) {
                if (typeof aggregated.backendProfile.layoutMicro[k] === 'number') {
                    const stats = aggregateField(aggregated, ['backendProfile', 'layoutMicro', k]);
                    aggregated.backendProfile.layoutMicro[k] = stats.median;
                }
            }
        }
        if (aggregated.backendProfile.cacheBreakdown) {
            for (const k in aggregated.backendProfile.cacheBreakdown) {
                if (typeof aggregated.backendProfile.cacheBreakdown[k] === 'number') {
                    const stats = aggregateField(aggregated, ['backendProfile', 'cacheBreakdown', k]);
                    aggregated.backendProfile.cacheBreakdown[k] = stats.median;
                }
            }
        }
        if (aggregated.backendProfile.memBreakdown) {
            for (const k in aggregated.backendProfile.memBreakdown) {
                if (typeof aggregated.backendProfile.memBreakdown[k] === 'number') {
                    const stats = aggregateField(aggregated, ['backendProfile', 'memBreakdown', k]);
                    aggregated.backendProfile.memBreakdown[k] = stats.median;
                }
            }
        }
        if (aggregated.backendProfile.payloadBreakdown) {
            for (const k in aggregated.backendProfile.payloadBreakdown) {
                if (typeof aggregated.backendProfile.payloadBreakdown[k] === 'number') {
                    const stats = aggregateField(aggregated, ['backendProfile', 'payloadBreakdown', k]);
                    aggregated.backendProfile.payloadBreakdown[k] = stats.median;
                }
            }
        }

        // Memory (Average is usually fine, but let's use median)
        for (const step in aggregated.memorySnapshots) {
            for (const k in aggregated.memorySnapshots[step]) {
                aggregated.memorySnapshots[step][k] = Math.round(aggregateField(aggregated, ['memorySnapshots', step, k]).median);
            }
        }

        // FPS
        for (const phase in aggregated.fpsResults) {
            if (!aggregated.fpsResults[phase]) continue;
            aggregated.fpsResults[phase].averageFps = aggregateField(aggregated, ['fpsResults', phase, 'averageFps']).median;
            aggregated.fpsResults[phase].p95FrameTime = aggregateField(aggregated, ['fpsResults', phase, 'p95FrameTime']).median;
            
            const worstFrames = runs.map(r => r.fpsResults?.[phase]?.worstFrame || 0);
            aggregated.fpsResults[phase].worstFrame = Math.max(...worstFrames);

            for (const b in aggregated.fpsResults[phase].frameBuckets) {
                aggregated.fpsResults[phase].frameBuckets[b] = Math.round(aggregateField(aggregated, ['fpsResults', phase, 'frameBuckets', b]).median);
            }
        }

        return aggregated;
    }

    private static generateReport(results: any[], workspaceRoot: string) {
        const outDir = path.join(workspaceRoot, 'benchmark');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const dateStr = new Date().toISOString().split('T')[0];

        let md = `# SYNAPSE Performance Benchmark Report\nDate: ${dateStr}\n\n`;

        for (const r of results) {
            const configName = `${r.config.nodes}N_${r.config.edges}E_${r.config.clusters}C_${r.config.profile.name}`;
            const jsonPath = path.join(outDir, `${dateStr}_${configName}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(r, null, 2));

            md += `## Configuration: ${configName}\n`;
            md += `- **Nodes**: ${r.config.nodes}\n`;
            md += `- **Edges**: ${r.config.edges}\n`;
            const density = r.config.nodes > 0 ? (r.config.edges / r.config.nodes).toFixed(2) : '0';
            md += `- **Edge Density**: ${density} edges/node\n`;
            md += `- **Clusters**: ${r.config.clusters}\n`;
            md += `- **Max Hub Degree**: ${r.config.maxHubDegree}\n`;
            md += `- **Profile**: ${r.config.profile.name}\n\n`;

            if (r.topologyStats) {
                md += `### Topology Statistics\n`;
                md += `- **Average Degree**: ${r.topologyStats.averageDegree.toFixed(2)}\n`;
                md += `- **P95 Degree**: ${r.topologyStats.p95Degree}\n`;
                md += `- **P99 Degree**: ${r.topologyStats.p99Degree}\n`;
                md += `- **Max Degree**: ${r.topologyStats.maxDegree}\n\n`;
            }

            const payloadMB = r.backendProfile.payloadSizeBytes / (1024 * 1024);
            md += `### Payload\n`;
            md += `- **JSON Payload Size**: ${payloadMB.toFixed(2)} MB\n`;
            if (r.backendProfile.payloadBreakdown) {
                const p = r.backendProfile.payloadBreakdown;
                const totalBytes = r.backendProfile.payloadSizeBytes;
                const nodeAvg = p.nodesCount > 0 ? (p.nodesBytes / p.nodesCount).toFixed(0) : 0;
                const edgeAvg = p.edgesCount > 0 ? (p.edgesBytes / p.edgesCount).toFixed(0) : 0;
                const nodePct = ((p.nodesBytes / totalBytes) * 100).toFixed(1);
                const edgePct = ((p.edgesBytes / totalBytes) * 100).toFixed(1);
                const clusterPct = ((p.clustersBytes / totalBytes) * 100).toFixed(1);
                
                md += `- **Nodes**: ${(p.nodesBytes / 1048576).toFixed(2)} MB (${nodePct}%) | Count: ${p.nodesCount} | Avg: ${nodeAvg} bytes/node\n`;
                md += `- **Edges**: ${(p.edgesBytes / 1048576).toFixed(2)} MB (${edgePct}%) | Count: ${p.edgesCount} | Avg: ${edgeAvg} bytes/edge\n`;
                md += `- **Clusters**: ${(p.clustersBytes / 1048576).toFixed(2)} MB (${clusterPct}%) | Count: ${p.clustersCount}\n`;
            }
            md += `\n`;

            md += `### 1. Memory Profile (MB) (Median)\n`;
            md += `| Phase | Heap Total | Heap Used | RSS |\n`;
            md += `|---|---|---|---|\n`;
            for (const step of ['beforeGeneration', 'afterGeneration', 'afterLayout', 'afterWebviewLoad', 'afterBenchmark']) {
                const mem = r.memorySnapshots[step];
                md += `| ${step} | ${mem.heapTotal} | ${mem.heapUsed} | ${mem.rss} |\n`;
            }
            md += '\n';

            md += `### 2. Backend Latency (ms) (Median)\n`;
            md += `- **Scan**: ${r.backendProfile.scanMs.toFixed(2)}\n`;
            md += `- **Policy**: ${r.backendProfile.policyMs.toFixed(2)}\n`;
            md += `- **Resolve**: ${r.backendProfile.resolveMs.toFixed(2)}\n`;
            md += `- **Expand**: ${r.backendProfile.expandMs.toFixed(2)}\n`;
            md += `- **Build**: ${r.backendProfile.buildMs.toFixed(2)}\n`;
            md += `- **Analyze**: ${r.backendProfile.analyzeMs.toFixed(2)}\n`;
            md += `- **Layout Total**: ${r.backendProfile.layoutTotalMs.toFixed(2)}\n`;
            if (r.backendProfile.layoutMicro) {
                md += `  - Continent Packing: ${r.backendProfile.layoutMicro.continentPackingMs.toFixed(2)}\n`;
                md += `  - Force Layout: ${r.backendProfile.layoutMicro.forceLayoutMs.toFixed(2)}\n`;
                md += `  - World Packing: ${r.backendProfile.layoutMicro.worldPackingMs.toFixed(2)}\n`;
                md += `  - Node Placement: ${r.backendProfile.layoutMicro.nodePlacementMs.toFixed(2)}\n`;
                md += `  - Bounds Calc: ${r.backendProfile.layoutMicro.boundsCalculationMs.toFixed(2)}\n`;
            }
            md += `- **Community**: ${r.backendProfile.communityMs.toFixed(2)}\n`;
            md += `- **Webview Load Total**: ${r.backendProfile.webviewLoadMs.toFixed(2)}\n`;
            if (r.backendProfile.ipcSerializeMs !== undefined) {
                md += `  - Serialize (Backend): ${r.backendProfile.ipcSerializeMs.toFixed(2)}\n`;
                md += `  - Transfer (Network/IPC): ${r.backendProfile.ipcTransferMs?.toFixed(2)}\n`;
                md += `  - Deserialize (Frontend): ${r.backendProfile.ipcDeserializeMs?.toFixed(2)}\n`;
                md += `  - Cache Build (Frontend): ${r.backendProfile.cacheBuildMs?.toFixed(2)}\n`;
                md += `  - First Paint (from payload): ${r.backendProfile.firstPaintMs?.toFixed(2)}\n`;
                md += `  - First Interactive: ${r.backendProfile.firstInteractiveMs?.toFixed(2)}\n`;
                if (r.backendProfile.cacheBreakdown) {
                    const c = r.backendProfile.cacheBreakdown;
                    const cTotal = (c.nodeCacheMs || 0) + (c.edgeCacheMs || 0) + (c.clusterCacheMs || 0) + 
                                   (c.spatialIndexMs || 0) + (c.labelCacheMs || 0) + (c.otherMs || 0);
                    
                    const pct = (val: number) => cTotal > 0 ? ((val / cTotal) * 100).toFixed(1) : '0.0';

                    md += `  - Cache Breakdown (CPU):\n`;
                    md += `    - Node Cache: ${c.nodeCacheMs?.toFixed(2)} ms (${pct(c.nodeCacheMs || 0)}%)\n`;
                    md += `    - Edge Cache: ${c.edgeCacheMs?.toFixed(2)} ms (${pct(c.edgeCacheMs || 0)}%)\n`;
                    md += `    - Cluster Cache: ${c.clusterCacheMs?.toFixed(2)} ms (${pct(c.clusterCacheMs || 0)}%)\n`;
                    md += `    - Spatial Index: ${c.spatialIndexMs?.toFixed(2)} ms (${pct(c.spatialIndexMs || 0)}%)\n`;
                    md += `    - Label Cache: ${c.labelCacheMs?.toFixed(2)} ms (${pct(c.labelCacheMs || 0)}%)\n`;
                    md += `    - [Other-Sub] Normalize: ${c.normalizeProjectStateMs?.toFixed(2)} ms (${pct(c.normalizeProjectStateMs || 0)}%)\n`;
                    md += `    - [Other-Sub] UpdateNodeStats: ${c.updateNodeStatsMs?.toFixed(2)} ms (${pct(c.updateNodeStatsMs || 0)}%)\n`;
                    md += `    - [Other-Sub] ResolveOverlaps: ${c.resolveOverlapsMs?.toFixed(2)} ms (${pct(c.resolveOverlapsMs || 0)}%)\n`;
                    md += `      - UpdateLocalLayout: ${c.updateLocalLayoutMs?.toFixed(2)} ms (${pct(c.updateLocalLayoutMs || 0)}%)\n`;
                    md += `    - [Other-Sub] RenderCall: ${c.renderCallMs?.toFixed(2)} ms (${pct(c.renderCallMs || 0)}%)\n`;
                    md += `      - BuildFrameState: ${c.buildFrameStateMs?.toFixed(2)} ms (${pct(c.buildFrameStateMs || 0)}%)\n`;
                    md += `        - PureResolveOverlaps: ${c.pureResolveOverlapsMs?.toFixed(2)} ms (${pct(c.pureResolveOverlapsMs || 0)}%)\n`;
                    md += `      - RenderFromState: ${c.renderFromStateMs?.toFixed(2)} ms (${pct(c.renderFromStateMs || 0)}%)\n`;
                    md += `    - Other: ${c.otherMs?.toFixed(2)} ms (${pct(c.otherMs || 0)}%)\n`;
                }
                if (r.backendProfile.memBreakdown) {
                    md += `  - Cache Breakdown (Memory):\n`;
                    md += `    - Node Cache: ${r.backendProfile.memBreakdown.nodeCacheMb?.toFixed(2)} MB\n`;
                    md += `    - Edge Cache: ${r.backendProfile.memBreakdown.edgeCacheMb?.toFixed(2)} MB\n`;
                    md += `    - Cluster Cache: ${r.backendProfile.memBreakdown.clusterCacheMb?.toFixed(2)} MB\n`;
                    md += `    - Spatial Index: ${r.backendProfile.memBreakdown.spatialIndexMb?.toFixed(2)} MB\n`;
                    md += `    - Label Cache: ${r.backendProfile.memBreakdown.labelCacheMb?.toFixed(2)} MB\n`;
                }
            }
            md += `\n`;

            md += `### 3. Frontend FPS Profile\n`;
            md += `| Phase | Avg FPS | P95 (ms) | Worst (ms) | <16ms | <33ms | <50ms | >50ms |\n`;
            md += `|---|---|---|---|---|---|---|---|\n`;
            for (const phase of ['static', 'pan', 'zoom']) {
                const fps = r.fpsResults[phase];
                if (fps) {
                    md += `| ${phase.toUpperCase()} | ${fps.averageFps.toFixed(1)} | ${fps.p95FrameTime.toFixed(1)} | ${fps.worstFrame.toFixed(1)} | ${fps.frameBuckets.under16ms} | ${fps.frameBuckets.under33ms} | ${fps.frameBuckets.under50ms} | ${fps.frameBuckets.over50ms} |\n`;
                }
            }
            md += '\n---\n\n';
        }

        const mdPath = path.join(outDir, `latest.md`);
        fs.writeFileSync(mdPath, md);
        console.log(`[SYNAPSE Benchmark] Report saved to ${mdPath}`);
    }
}
