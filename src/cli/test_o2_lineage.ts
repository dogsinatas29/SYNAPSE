import * as fs from 'fs';
import * as path from 'path';
import { ValidationContext, GraphSnapshot } from '../core/validation/ValidationContext';
import { EntryPointDetector } from '../core/analysis/patterns/detectors/EntryPointDetector';
import { OnboardingAnalyzer } from '../core/reporting/OnboardingAnalyzer';
import { InsightEngine } from '../core/reporting/InsightEngine';
import { EvidenceViewerBuilder } from '../core/reporting/EvidenceViewerBuilder';

function traceO2() {
    console.log("[O2 TRACE]");
    
    // 1. Snapshot
    const data = JSON.parse(fs.readFileSync('/home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json', 'utf8'));
    const snapshot: GraphSnapshot = {
        nodes: data.nodes || (data.graph && data.graph.nodes) || [],
        edges: data.edges || (data.graph && data.graph.edges) || [],
        clusters: data.clusters || []
    };
    
    const context: any = {
        snapshot,
        metrics: { topImpactFiles: [], systemAssemblyPoints: [] }
    };
    
    // 2. Simulation Context
    const bundleDir = '/home/dogsinatas/다운로드/rustdesk-master/synapse_report/surgery';
    const simContextStr = fs.readFileSync(path.join(bundleDir, 'simulation_evidence.json'), 'utf-8');
    const simContext = JSON.parse(simContextStr);
    
    // 3. Detector Level (EntryPointDetector)
    const detector = new EntryPointDetector();
    const detectorFindings = detector.detect(context, simContext);
    console.log(`detectorFindings = ${detectorFindings.length}`);
    if (detectorFindings.length > 0) {
        console.log(`  -> e.g., ${detectorFindings[0].targetId}`);
    }

    // 4. OnboardingAnalyzer Level
    const analyzer = new OnboardingAnalyzer();
    const pathData = analyzer.extractPath(context, simContext);
    const onboardingFindings = (pathData.findings || []).filter(f => f.patternId === 'DEPENDENCY_ROOT');
    console.log(`onboardingFindings = ${onboardingFindings.length}`);

    // 5. InsightEngine Level
    const insight = new InsightEngine();
    const onboardInsight = insight.buildOnboardingInsight(context, simContext);
    const reportFindings = (onboardInsight.findings || []).filter(f => f.patternId === 'DEPENDENCY_ROOT');
    console.log(`reportFindings = ${reportFindings.length}`);

    // 6. Evidence Viewer Level
    const allFindings = [
        ...(onboardInsight.findings || [])
    ];
    const html = EvidenceViewerBuilder.buildHtml(allFindings, bundleDir);
    const hasO2 = html.includes('DEPENDENCY_ROOT (');
    console.log(`evidenceViewer html contains DEPENDENCY_ROOT: ${hasO2}`);
}

traceO2();
