import { CascadeFailureDetector } from '../../src/core/analysis/patterns/detectors/CascadeFailureDetector';
import { ValidationContext } from '../../src/core/validation/ValidationContext';
import { SimulationContext } from '../../src/types/schema';

function runPilotTest() {
    console.log('🚀 Running PatternDetector Pilot Test (Cascade Failure Point)');
    console.log('---------------------------------------------------------');

    // Create 100 mock simulation findings with random impact scores
    const findingsMock = Array.from({ length: 100 }, (_, i) => ({
        type: 'simulation',
        evidenceType: 'PROPAGATION',
        targetId: `src/module_${i}.ts`,
        metadata: {
            affectedNodeCount: Math.floor(Math.random() * 20),
            propagationDepth: Math.floor(Math.random() * 3),
            cascadeImpact: 0
        }
    }));

    // Add a clear "Cascade Failure Point"
    findingsMock.push({
        type: 'simulation',
        evidenceType: 'CASCADE',
        targetId: 'src/core/auth/SessionManager.ts',
        metadata: {
            affectedNodeCount: 350,
            propagationDepth: 8,
            cascadeImpact: 5
        }
    });

    const mockValidationContext = {} as ValidationContext;

    const mockSimulationContext = {
        evidenceBundle: {
            findings: findingsMock
        }
    } as unknown as SimulationContext;

    const detector = new CascadeFailureDetector();
    
    console.log('🔍 Executing CascadeFailureDetector.detect()...');
    const findings = detector.detect(mockValidationContext, mockSimulationContext);

    console.log(`\n✅ Detection Complete. Total findings: ${findingsMock.length}, Candidates returned: ${findings.length}`);
    
    // Check Top 3
    const sortedFindings = findings.sort((a, b) => b.confidence - a.confidence);
    
    console.log('\n🏆 Top 3 Cascade Failure Candidates:');
    sortedFindings.slice(0, 3).forEach((f, idx) => {
        console.log(`${idx + 1}. ${f.targetId} (Confidence: ${f.confidence}, Score: ${f.evidence.failureScore})`);
    });
    
    if (findings.length > 0) {
        const finding = findings[0];
        console.log('\n📊 Structural Audit (Top Candidate):');
        console.log(`- patternId exists: ${!!finding.patternId} (${finding.patternId})`);
        console.log(`- targetId exists: ${!!finding.targetId} (${finding.targetId})`);
        console.log(`- confidence exists: ${!!finding.confidence} (${finding.confidence})`);
        console.log(`- isCandidate is true: ${finding.isCandidate}`);
        console.log(`- evidence object exists: ${!!finding.evidence} (keys: ${Object.keys(finding.evidence).join(', ')})`);
    } else {
        console.log('\n❌ No findings returned.');
    }
}

if (require.main === module) {
    runPilotTest();
}
