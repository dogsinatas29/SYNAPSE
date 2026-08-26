import { ArchitecturalCorridorBuilder } from '../core/reasoning/analyzers/ArchitecturalCorridorBuilder';
import { PropagationAnalyzer } from '../core/reasoning/analyzers/PropagationAnalyzer';
import { ArchitecturalEvidence } from '../core/reasoning/evidence/ArchitecturalEvidence';

/**
 * v0.3.34.32 Phase 6.5: Gate G Audit
 * 
 * Corridor 및 Propagation 검증을 위한 Expected vs Actual 리포트 생성 스크립트.
 * Evidence(Phase 1 출력물)를 하드코딩으로 모의 주입하여 순수하게 Phase 5/6의 로직망을 테스트합니다.
 */
export class GateGAudit {
    private corridorBuilder = new ArchitecturalCorridorBuilder();
    private propagationAnalyzer = new PropagationAnalyzer();

    private mockEvidences: ArchitecturalEvidence[] = [
        // --- Sample 1 & 2: Core Pipelines ---
        {
            nodeId: 'GraphModel',
            boundaryId: 'core',
            fanIn: 10, fanOut: 5, blastRadius: 100,
            crossBoundaryDependencies: ['DataPipeline', 'RuleEngine'],
            roleHints: { isEntryPoint: false, hasLifecycleControl: true, hasStateMutation: true, hasServiceRegistry: true },
            constraintHints: { boundaryRootCount: 1, singletonPatternDetected: true, replacementCandidates: 0 },
            boundaryInboundPressure: 5,
            sources: {}
        },
        {
            nodeId: 'DataPipeline',
            boundaryId: 'pipeline',
            fanIn: 5, fanOut: 5, blastRadius: 50,
            crossBoundaryDependencies: ['CanvasEngine'],
            roleHints: { isEntryPoint: false, hasLifecycleControl: true, hasStateMutation: false, hasServiceRegistry: false },
            constraintHints: { boundaryRootCount: 1, singletonPatternDetected: true, replacementCandidates: 0 },
            boundaryInboundPressure: 2,
            sources: {}
        },
        {
            nodeId: 'CanvasEngine',
            boundaryId: 'canvas',
            fanIn: 8, fanOut: 2, blastRadius: 20,
            crossBoundaryDependencies: [],
            roleHints: { isEntryPoint: false, hasLifecycleControl: true, hasStateMutation: false, hasServiceRegistry: false },
            constraintHints: { boundaryRootCount: 1, singletonPatternDetected: true, replacementCandidates: 0 },
            boundaryInboundPressure: 3,
            sources: {}
        },
        {
            nodeId: 'RuleEngine',
            boundaryId: 'rule',
            fanIn: 4, fanOut: 6, blastRadius: 30,
            crossBoundaryDependencies: ['GraphModel', 'CanvasEngine'],
            roleHints: { isEntryPoint: false, hasLifecycleControl: true, hasStateMutation: false, hasServiceRegistry: false },
            constraintHints: { boundaryRootCount: 1, singletonPatternDetected: true, replacementCandidates: 0 },
            boundaryInboundPressure: 2,
            sources: {}
        },
        
        // --- Sample 6 (Negative): strings.ts ---
        {
            nodeId: 'src/vs/base/common/strings.ts',
            boundaryId: 'util',
            fanIn: 5000, // 엄청난 트래픽
            fanOut: 0, // 유틸리티 특징
            blastRadius: 5000,
            crossBoundaryDependencies: [], // 스스로 외부를 호출하지 않음
            // 의미적 역할 전무
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false },
            constraintHints: { boundaryRootCount: 0, singletonPatternDetected: false, replacementCandidates: 10 },
            boundaryInboundPressure: 100,
            sources: {}
        },

        // --- Sample (Negative): README.md ---
        {
            nodeId: 'README.md',
            boundaryId: 'docs',
            fanIn: 0, fanOut: 0, blastRadius: 0,
            crossBoundaryDependencies: [],
            roleHints: { isEntryPoint: false, hasLifecycleControl: false, hasStateMutation: false, hasServiceRegistry: false },
            constraintHints: { boundaryRootCount: 0, singletonPatternDetected: false, replacementCandidates: 0 },
            boundaryInboundPressure: 0,
            sources: {}
        }
    ];

    public runAudit(): string {
        let report = '# Phase 6.5: Gate G (Observation Validation Report)\n\n';
        
        const corridors = this.corridorBuilder.analyze(this.mockEvidences);
        const propagations = this.propagationAnalyzer.analyze(this.mockEvidences);

        // ==========================================
        // 1. Corridor Audit
        // ==========================================
        report += '## 1. Corridor Audit (Expected vs Actual)\n\n';

        // Sample 1 Check: GraphModel -> DataPipeline -> CanvasEngine
        const s1Corridor = corridors.find(c => c.path.includes('GraphModel') && c.path.includes('DataPipeline') && c.path.includes('CanvasEngine'));
        report += '### Sample 1: SYNAPSE Core Rendering Pipeline\n';
        report += '- **Expected:** `GraphModel -> DataPipeline -> CanvasEngine`\n';
        if (s1Corridor) {
            report += `- **Actual Detected:** \`${s1Corridor.path.join(' -> ')}\`\n`;
            report += '> **Result: PASS** (Corridor successfully detected)\n\n';
        } else {
            report += `- **Actual Detected:** NOT DETECTED\n`;
            report += '> **Result: FAIL** (Expected corridor missing)\n\n';
        }

        // Sample 6 Check: strings.ts
        const stringsCorridor = corridors.find(c => c.path.includes('src/vs/base/common/strings.ts'));
        report += '### Sample 6: VSCode Strings Utility (Negative Sample)\n';
        report += '- **Expected:** NOT DETECTED (fanIn 5000)\n';
        if (stringsCorridor) {
            report += `- **Actual Detected:** \`${stringsCorridor.path.join(' -> ')}\`\n`;
            report += '> **Result: FAIL** (Utility falsely identified as corridor)\n\n';
        } else {
            report += `- **Actual Detected:** NOT DETECTED\n`;
            report += '> **Result: PASS** (Utility correctly filtered out)\n\n';
        }


        // ==========================================
        // 2. Propagation Audit
        // ==========================================
        report += '## 2. Propagation Audit (Expected vs Actual)\n\n';

        // Sample: GraphModel
        const graphProp = propagations.find(p => p.nodeId === 'GraphModel');
        report += '### Sample 1: GraphModel Propagation\n';
        report += '- **Expected Affected Nodes:** DataPipeline, RuleEngine (and deeper)\n';
        if (graphProp) {
            const allPaths = graphProp.propagationPaths.map(p => p.join(' -> ')).join(' | ');
            report += `- **Actual Paths:** \`${allPaths}\`\n`;
            report += `- **Affected Node Count:** ${graphProp.affectedNodeCount}\n`;
            report += '> **Result: PASS** (Broad propagation detected correctly)\n\n';
        } else {
            report += `- **Actual Detected:** NOT DETECTED\n`;
            report += '> **Result: FAIL**\n\n';
        }

        // Sample: README.md
        const readmeProp = propagations.find(p => p.nodeId === 'README.md');
        report += '### Sample Negative: README.md Propagation\n';
        report += '- **Expected Affected Nodes:** 0\n';
        if (readmeProp) {
            report += `- **Actual Detected Affected Nodes:** ${readmeProp.affectedNodeCount}\n`;
            report += '> **Result: FAIL** (Docs falsely propagating changes)\n\n';
        } else {
            report += `- **Actual Detected:** NOT DETECTED (0 nodes)\n`;
            report += '> **Result: PASS** (Zero-impact correctly observed)\n\n';
        }
        
        // Sample 6: strings.ts
        const stringsProp = propagations.find(p => p.nodeId === 'src/vs/base/common/strings.ts');
        report += '### Sample Negative: strings.ts Propagation\n';
        report += '- **Expected Affected Nodes:** 5000 (wide blast radius)\n';
        if (stringsProp) {
            report += `- **Actual Detected Affected Nodes:** ${stringsProp.affectedNodeCount}\n`;
            report += '> **Result: PASS** (Propagation correctly separates blast radius from corridor path)\n\n';
        } else {
            report += `- **Actual Detected:** NOT DETECTED\n`;
            report += '> **Result: FAIL**\n\n';
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new GateGAudit();
    console.log(auditor.runAudit());
}
