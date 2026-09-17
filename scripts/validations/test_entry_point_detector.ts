import { EntryPointDetector } from '../../src/core/analysis/patterns/detectors/EntryPointDetector';
import { ValidationContext } from '../../src/core/validation/ValidationContext';
import { SimulationContext } from '../../src/types/schema';

function runPilotTest() {
    console.log('🚀 Running PatternDetector Pilot Test (Root Entry Point)');
    console.log('---------------------------------------------------------');

    // Mock Context
    const mockValidationContext = {
        metrics: {
            systemAssemblyPoints: [
                { id: 'src/utils/math.ts', fanIn: 10, fanOut: 0 },
                { id: 'src/main.ts', fanIn: 0, fanOut: 5 },
                { filePath: 'src/extension.ts', fanIn: 1, fanOut: 12 },
                { id: 'tests/main.test.ts', fanIn: 0, fanOut: 2 }
            ],
            topImpactFiles: []
        }
    } as unknown as ValidationContext;

    const mockSimulationContext = {
        evidenceBundle: {
            findings: []
        }
    } as unknown as SimulationContext;

    const detector = new EntryPointDetector();
    
    console.log('🔍 Executing EntryPointDetector.detect()...');
    const findings = detector.detect(mockValidationContext, mockSimulationContext);

    console.log('\n✅ Detection Complete. Verifying PatternFinding structure:');
    console.log(JSON.stringify(findings, null, 2));
    
    if (findings.length > 0) {
        const finding = findings[0];
        console.log('\n📊 Structural Audit:');
        console.log(`- patternId exists: ${!!finding.patternId} (${finding.patternId})`);
        console.log(`- targetId exists: ${!!finding.targetId} (${finding.targetId})`);
        console.log(`- confidence exists: ${!!finding.confidence} (${finding.confidence})`);
        console.log(`- evidence object exists: ${!!finding.evidence} (keys: ${Object.keys(finding.evidence).join(', ')})`);
    } else {
        console.log('\n❌ No findings returned.');
    }
}

if (require.main === module) {
    runPilotTest();
}
