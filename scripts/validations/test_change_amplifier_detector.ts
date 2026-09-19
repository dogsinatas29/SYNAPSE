import { ChangeAmplifierDetector } from '../../src/core/analysis/patterns/detectors/ChangeAmplifierDetector';
import { ValidationContext } from '../../src/core/validation/ValidationContext';
import { SimulationContext } from '../../src/types/schema';

function runPilotTest() {
    console.log('🚀 Running PatternDetector Pilot Test (Change Amplifier)');
    console.log('---------------------------------------------------------');

    // Create 100 mock semantic boundary findings with random scores
    const findingsMock = Array.from({ length: 100 }, (_, i) => ({
        type: 'semantic',
        evidenceType: 'BOUNDARY_NODE',
        targetId: `src/module_${i}.ts`,
        metadata: {
            size: Math.floor(Math.random() * 500) + 10,
            internalEdges: Math.floor(Math.random() * 100) + 10,
            externalEdges: Math.floor(Math.random() * 50) + 5
        }
    }));

    // Add a clear "Amplifier" node
    findingsMock.push({
        type: 'semantic',
        evidenceType: 'BOUNDARY_NODE',
        targetId: 'src/utils/HugeGodClass.ts',
        metadata: {
            size: 5000,
            internalEdges: 2500, // internal density = 0.5
            externalEdges: 1000  // external density = 0.2
            // complexityScore = 5000 * 0.5 * 0.5 * 0.2 = 250
        }
    });

    const mockValidationContext = {} as ValidationContext;

    const mockSimulationContext = {
        evidenceBundle: {
            findings: findingsMock
        }
    } as unknown as SimulationContext;

    const detector = new ChangeAmplifierDetector();
    
    console.log('🔍 Executing ChangeAmplifierDetector.detect()...');
    const findings = detector.detect(mockValidationContext, mockSimulationContext);

    console.log(`\n✅ Detection Complete. Total findings: ${findingsMock.length}, Candidates returned: ${findings.length}`);
    
    // Check Top 3
    const sortedFindings = findings.sort((a, b) => b.confidence - a.confidence);
    
    console.log('\n🏆 Top 3 Amplifier Candidates:');
    sortedFindings.slice(0, 3).forEach((f, idx) => {
        console.log(`${idx + 1}. ${f.targetId} (Confidence: ${f.confidence}, Score: ${f.evidence.complexityScore})`);
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
