import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalyzer } from './ProjectAnalyzer';
import { GraphSnapshot, Node, Edge } from '../core/GraphModel';
import { ArchitecturalEvidenceBuilder } from '../core/reasoning/builder/ArchitecturalEvidenceBuilder';
import { SignalRegistry } from '../core/reasoning/signal/SignalRegistry';
import { BasicSignalExtractor } from '../core/reasoning/signal/extractors/BasicSignalExtractor';
import { SignalStatisticsGenerator } from '../core/reasoning/signal/SignalStatisticsGenerator';

async function run() {
    console.log("🚀 Starting Phase 13.4 Signal Census on ACTUAL SYNAPSE Codebase...");
    
    // 1. Project Analyzer를 통해 실제 AST 및 의존성 추출
    const analyzer = new ProjectAnalyzer();
    console.log("Analyzing project (Parsing ASTs and Intent Edges)...");
    const result = await analyzer.analyze(process.cwd());

    if (result.status !== 'PASS' || !result.bundle) {
        console.error("❌ Project analysis failed or produced no bundle.");
        console.error(result.error);
        return;
    }

    console.log(`✅ Extracted ${result.bundle.intentEdgeCount} edges from ${result.metrics?.filesScanned} files.`);

    // 2. Convert IntentEdges to GraphSnapshot
    const nodesMap = new Map<string, Node>();
    const edges: Edge[] = [];
    
    for (const edge of result.bundle.intentEdges) {
        if (!nodesMap.has(edge.source)) {
            nodesMap.set(edge.source, { id: edge.source, data: {} } as Node);
        }
        if (!nodesMap.has(edge.target)) {
            nodesMap.set(edge.target, { id: edge.target, data: {} } as Node);
        }
        
        edges.push({
            id: `e_${Math.random().toString(36).substr(2, 9)}`,
            from: edge.source,
            to: edge.target,
            data: {}
        } as Edge);
    }
    
    const snapshot: GraphSnapshot = {
        nodes: Array.from(nodesMap.values()),
        edges: edges,
        clusters: [],
        timestamp: Date.now()
    };
    
    console.log(`✅ Generated GraphSnapshot with ${snapshot.nodes.length} nodes and ${snapshot.edges.length} edges.`);

    // 3. Build Architectural Evidence
    const evidenceBuilder = new ArchitecturalEvidenceBuilder();
    console.log("Building Architectural Evidence...");
    const evidences = evidenceBuilder.build(snapshot);
    
    // 4. Run Signal Registry (Extractor)
    const registry = new SignalRegistry();
    registry.registerExtractor(new BasicSignalExtractor());
    console.log("Extracting Signals...");
    const findings = registry.extractAll(evidences);
    
    // 5. Generate Statistics
    const statsGenerator = new SignalStatisticsGenerator();
    console.log("Generating Statistics...");
    const stats = statsGenerator.generateStatistics(findings, snapshot.nodes.length);
    
    // 6. Output the Report
    const reportPath = path.join(process.cwd(), 'synapse_actual_signal_census_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2), 'utf8');
    
    console.log(`✅ ACTUAL Census Complete! Report saved to ${reportPath}`);
    console.log(JSON.stringify(stats, null, 2));
}

run().catch(console.error);
