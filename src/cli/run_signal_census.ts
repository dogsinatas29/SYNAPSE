import * as fs from 'fs';
import * as path from 'path';
import { SignalRegistry } from '../core/reasoning/signal/SignalRegistry';
import { BasicSignalExtractor } from '../core/reasoning/signal/extractors/BasicSignalExtractor';
import { SignalStatisticsGenerator } from '../core/reasoning/signal/SignalStatisticsGenerator';
import { ArchitecturalEvidence } from '../core/reasoning/evidence/ArchitecturalEvidence';

// Dummy data for SYNAPSE census until we wire up the real graph parser
const mockEvidences: ArchitecturalEvidence[] = [
    {
        nodeId: 'GraphModel',
        boundaryId: 'core',
        fanIn: 12,
        fanOut: 5,
        blastRadius: 0.8,
        roleHints: { hasStateMutation: true, hasLifecycleControl: true, hasFactoryPattern: false, hasServiceRegistry: false, isEntryPoint: false },
        constraintHints: { inboundDependencyCount: 12, outboundDependencyCount: 5, boundaryRootCount: 1, singletonPatternDetected: true, uniqueImplementationCount: 1, replacementCandidates: 0 },
        crossBoundaryDependencies: ['ui', 'extension'],
        boundaryInboundPressure: 5,
        sources: { hasStateMutation: 'MockEngine', hasLifecycleControl: 'MockEngine' }
    },
    {
        nodeId: 'MemoryManager',
        boundaryId: 'core',
        fanIn: 8,
        fanOut: 2,
        blastRadius: 0.9,
        roleHints: { hasStateMutation: false, hasLifecycleControl: false, hasFactoryPattern: true, hasServiceRegistry: true, isEntryPoint: false },
        constraintHints: { inboundDependencyCount: 8, outboundDependencyCount: 2, boundaryRootCount: 1, singletonPatternDetected: true, uniqueImplementationCount: 1, replacementCandidates: 0 },
        crossBoundaryDependencies: [],
        boundaryInboundPressure: 2,
        sources: { hasFactoryPattern: 'MockEngine' }
    },
    {
        nodeId: 'CanvasEngine',
        boundaryId: 'ui',
        fanIn: 3,
        fanOut: 15,
        blastRadius: 0.3,
        roleHints: { hasStateMutation: true, hasLifecycleControl: false, hasFactoryPattern: false, hasServiceRegistry: false, isEntryPoint: false },
        constraintHints: { inboundDependencyCount: 3, outboundDependencyCount: 15, boundaryRootCount: 0, singletonPatternDetected: false, uniqueImplementationCount: 1, replacementCandidates: 2 },
        crossBoundaryDependencies: ['core'],
        boundaryInboundPressure: 1,
        sources: { hasStateMutation: 'MockEngine' }
    }
];

async function run() {
    console.log("🚀 Starting Phase 13.4 Signal Census on SYNAPSE...");
    
    // 1. 레지스트리 초기화 및 Extractor 등록
    const registry = new SignalRegistry();
    registry.registerExtractor(new BasicSignalExtractor());
    
    // 2. 증거 수집 (실제 환경에서는 FileScanner -> GraphBuilder -> EvidenceBuilder 파이프라인 구동)
    console.log("Loading Architectural Evidence...");
    const evidences = mockEvidences; // TODO: Wire up actual SYNAPSE evidence generator
    
    // 3. 기계적 Signal 추출
    console.log("Extracting Signals...");
    const findings = registry.extractAll(evidences);
    
    // 4. 통계 산출
    console.log("Generating Statistics...");
    const statsGenerator = new SignalStatisticsGenerator();
    const totalNodes = mockEvidences.length;
    const stats = statsGenerator.generateStatistics(findings, totalNodes);
    
    // 5. 보고서 출력
    const reportPath = path.join(process.cwd(), 'synapse_signal_census_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2), 'utf8');
    
    console.log(`✅ Census Complete! Report saved to ${reportPath}`);
    console.log(JSON.stringify(stats, null, 2));
}

run().catch(console.error);
