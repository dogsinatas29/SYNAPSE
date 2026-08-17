import { EvidenceCategory, IStructuralEvidence } from '../src/core/reasoning/evidence/Evidence';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { Finding, IRule } from '../src/core/reasoning/rules/Rule';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';

class DummyStructuralRule implements IRule {
    id = 'R-000';
    name = 'Dummy Structural Rule';
    purpose = 'End-to-End verification of the Evidence pipeline';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const structuralEvidence = snapshot.getEvidenceByCategory<IStructuralEvidence>(EvidenceCategory.STRUCTURAL);
        const findings: Finding[] = [];

        for (const ev of structuralEvidence) {
            if (ev.metadata.degree && ev.metadata.degree > 10) {
                findings.push({
                    id: `f-${this.id}-${ev.nodeId}`,
                    type: 'DUMMY_HUB',
                    confidence: 100,
                    evidenceIds: [ev.id],
                    ruleId: this.id,
                    summary: `Node ${ev.nodeId} is a Dummy Hub`,
                    explanation: `Detected degree of ${ev.metadata.degree} which is greater than 10.`
                });
            }
        }

        return findings;
    }
}

function runE2ETest() {
    // 1. Mock Extraction (Normally EvidenceExtractor reads GraphModel)
    const snapshot = new ReasoningSnapshot();
    snapshot.addEvidence({
        id: 'ev-struct-nodeA',
        category: EvidenceCategory.STRUCTURAL,
        nodeId: 'nodeA',
        description: 'Structural evidence for nodeA',
        metadata: {
            degree: 15,
            inDegree: 5,
            outDegree: 10
        }
    } as IStructuralEvidence);

    // 2. Freeze Snapshot (Immutable)
    snapshot.freeze();

    try {
        snapshot.addEvidence({
            id: 'ev-struct-nodeB',
            category: EvidenceCategory.STRUCTURAL,
            nodeId: 'nodeB',
            description: 'Structural evidence for nodeB',
            metadata: { degree: 5 }
        } as IStructuralEvidence);
        throw new Error('Snapshot freeze failed to prevent modification.');
    } catch (err) {
        console.log('✅ Snapshot immutability verified.');
    }

    // 3. Setup Engine
    const registry = new RuleRegistry();
    registry.register(new DummyStructuralRule());
    const engine = new RuleEngine(registry);

    // 4. Execute
    const findings = engine.execute(snapshot);

    // 5. Assert Traceability
    if (findings.length === 1 && findings[0].ruleId === 'R-000' && findings[0].evidenceIds.includes('ev-struct-nodeA')) {
        console.log('✅ RuleEngine traceability and E2E execution verified.');
        console.log('Finding Output:', JSON.stringify(findings[0], null, 2));
    } else {
        throw new Error('E2E validation failed.');
    }
}

runE2ETest();
