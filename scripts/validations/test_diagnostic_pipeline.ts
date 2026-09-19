import { DiagnosticPipeline } from '../../src/core/analysis/pipeline/DiagnosticPipeline';
import { DetectorFactory } from '../../src/core/analysis/pipeline/DetectorFactory';
import { SystemCoreDetector } from '../../src/core/analysis/patterns/detectors/SystemCoreDetector';
import { EntryPointDetector } from '../../src/core/analysis/patterns/detectors/EntryPointDetector';
import { ValidationContext } from '../../src/core/validation/ValidationContext';
import { SimulationContext } from '../../src/types/schema';
import { EvidenceType } from '../../src/core/reporting/types';

function runPipelinePilotTest() {
    console.log('🚀 Running Diagnostic Pipeline Pilot Test (End-to-End)');
    console.log('---------------------------------------------------------');

    // 1. JSON Contracts Setup
    const questions = [
        {
            id: 'where_to_start',
            title: '어디서 시작해야 하는가?',
            vocabulary: ['entry_point', 'learning_path']
        },
        {
            id: 'what_is_core',
            title: '무엇이 핵심인가?',
            vocabulary: ['core_component']
        }
    ];

    const vocabularies = [
        {
            id: 'entry_point',
            patterns: ['root_entry_point']
        },
        {
            id: 'learning_path',
            patterns: ['learning_hub']
        },
        {
            id: 'core_component',
            patterns: ['system_core'] // Multiple patterns could be added here
        }
    ];

    const patterns = [
        {
            id: 'root_entry_point',
            detectorId: 'detector_entry_point'
        },
        {
            id: 'learning_hub',
            detectorId: 'detector_learning_hub'
        },
        {
            id: 'system_core',
            detectorId: 'detector_system_core'
        }
    ];

    // 2. Setup Factory and Detectors
    const factory = new DetectorFactory();
    factory.register('detector_entry_point', new EntryPointDetector());
    factory.register('detector_system_core', new SystemCoreDetector());
    // Note: LearningHub is intentionally left unregistered to verify warning output

    // 3. Mock Data Construction (100 nodes for testing System Core & Entry Point)
    const mockSimulationFindings = Array.from({ length: 100 }, (_, i) => ({
        type: 'semantic',
        evidenceType: 'BOUNDARY_NODE',
        targetId: `src/module_${i}.ts`,
        metadata: {
            fanIn: Math.floor(Math.random() * 5),
            fanOut: Math.floor(Math.random() * 10),
            blastRadius: Math.floor(Math.random() * 15)
        }
    }));

    // Inject strong Entry Point
    mockSimulationFindings.push({
        type: 'semantic',
        evidenceType: 'BOUNDARY_NODE',
        targetId: 'src/main.ts',
        metadata: { fanIn: 0, fanOut: 20, blastRadius: 100 }
    });

    // Inject strong Core
    mockSimulationFindings.push({
        type: 'semantic',
        evidenceType: 'BOUNDARY_NODE',
        targetId: 'src/core/Engine.ts',
        metadata: { fanIn: 50, fanOut: 2, blastRadius: 80 }
    });

    const mockValContext = {} as ValidationContext;
    const mockSimContext = {
        evidenceBundle: { findings: mockSimulationFindings }
    } as unknown as SimulationContext;

    // 4. Run Pipeline
    const pipeline = new DiagnosticPipeline(questions, vocabularies, patterns, factory);
    
    console.log('🔍 Executing pipeline.answerQuestion("where_to_start")...');
    const result1 = pipeline.answerQuestion('where_to_start', mockValContext, mockSimContext);

    console.log('\n✅ Result 1: "where_to_start"');
    console.log(JSON.stringify(result1, null, 2));


    console.log('\n🔍 Executing pipeline.answerQuestion("what_is_core")...');
    const result2 = pipeline.answerQuestion('what_is_core', mockValContext, mockSimContext);
    
    // Only print top findings for Result 2 to avoid flooding console
    console.log(`\n✅ Result 2: "what_is_core"`);
    if (result2) {
        console.log(`Question ID: ${result2.questionId}`);
        result2.concepts.forEach(concept => {
            console.log(`  Vocabulary: ${concept.vocabularyId}`);
            concept.patterns.forEach(pattern => {
                console.log(`    Pattern: ${pattern.patternId} (Found: ${pattern.findings.length})`);
                const topFinding = pattern.findings.sort((a, b) => b.confidence - a.confidence)[0];
                if (topFinding) {
                    console.log(`      Top Candidate: ${topFinding.targetId} (Confidence: ${topFinding.confidence})`);
                }
            });
        });
    }
}

if (require.main === module) {
    runPipelinePilotTest();
}
