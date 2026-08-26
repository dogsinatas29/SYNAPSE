import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalyzer } from './ProjectAnalyzer';
import { GraphSnapshot, Node, Edge } from '../core/GraphModel';
import { ArchitecturalEvidenceBuilder } from '../core/reasoning/builder/ArchitecturalEvidenceBuilder';
import { SignalRegistry } from '../core/reasoning/signal/SignalRegistry';
import { BasicSignalExtractor } from '../core/reasoning/signal/extractors/BasicSignalExtractor';
import { SignalPlacementAnalyzer } from '../core/reasoning/signal/SignalPlacementAnalyzer';

async function run() {
    const targetDir = process.argv[2] || process.cwd();
    const projectName = path.basename(path.resolve(targetDir));
    
    console.log(`🚀 Starting Signal Placement Analysis on [${projectName}] (${targetDir})...`);
    
    // 1. Project Analyzer
    const analyzer = new ProjectAnalyzer();
    console.log("Analyzing project (Parsing ASTs and Intent Edges)...");
    const result = await analyzer.analyze(targetDir);

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
    
    // 5. Run Placement Analysis
    console.log("Running Placement Analysis...");
    const placementAnalyzer = new SignalPlacementAnalyzer();
    const reports = placementAnalyzer.analyze(findings, snapshot);

    const reportData = {
        projectName,
        analyzedNodes: snapshot.nodes.length,
        reports
    };
    
    // 6. Output the Report
    const reportPath = path.join(process.cwd(), `${projectName.toLowerCase()}_signal_placement_report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
    
    console.log(`✅ Placement Analysis Complete! Report saved to ${reportPath}`);
    console.log(JSON.stringify(reportData, null, 2));
}

run().catch(console.error);
