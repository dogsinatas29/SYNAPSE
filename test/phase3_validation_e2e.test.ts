import { GraphModel } from '../src/core/GraphModel';
import { EvidenceExtractor } from '../src/core/reasoning/evidence/EvidenceExtractor';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { StateOwnerRule } from '../src/core/reasoning/rules/roles/StateOwnerRule';
import { PolicyOwnerRule } from '../src/core/reasoning/rules/roles/PolicyOwnerRule';
import { InfluenceAnalyzer } from '../src/core/reasoning/analysis/InfluenceAnalyzer';
import { AuthorityRule } from '../src/core/reasoning/rules/authority/AuthorityRule';
import { EvidenceCategory, IStorageEvidence, IMutationEvidence, IDecisionEvidence, IValidationEvidence } from '../src/core/reasoning/evidence/Evidence';

function runPhase3E2ETest() {
    console.log('--- Starting Phase 3 Validation ---');

    // 1. Mock Graph 
    const mockGraph = new GraphModel();
    mockGraph.addNode({ id: 'node_god', type: 'class', label: 'GodObject' });
    
    // Make node_god heavily depended upon
    for (let i = 0; i < 10; i++) {
        mockGraph.addNode({ id: `client_${i}`, type: 'class', label: `Client${i}` });
        mockGraph.addEdge({ id: `e${i}`, source: `client_${i}`, target: 'node_god', type: 'call' });
    }
    
    // Make node_god reach out to multiple things
    for (let i = 0; i < 5; i++) {
        mockGraph.addNode({ id: `dep_${i}`, type: 'class', label: `Dep${i}` });
        mockGraph.addEdge({ id: `e_out_${i}`, source: 'node_god', target: `dep_${i}`, type: 'call' });
    }

    // 2. Extractor (Phase 1) creates Snapshot V1
    const extractor = new EvidenceExtractor();
    const snapshotV1 = extractor.extract(mockGraph);
    
    // Inject mock raw internal facts since we don't have a real AST parser connected
    snapshotV1.addEvidence({
        id: 'ev-storage-god', category: EvidenceCategory.STORAGE, nodeId: 'node_god', description: 'Storage', metadata: { fieldCount: 20 }
    } as IStorageEvidence);
    snapshotV1.addEvidence({
        id: 'ev-mut-god', category: EvidenceCategory.MUTATION, nodeId: 'node_god', description: 'Mutation', metadata: { mutationMethodCount: 15 }
    } as IMutationEvidence);
    snapshotV1.addEvidence({
        id: 'ev-val-god', category: EvidenceCategory.VALIDATION, nodeId: 'node_god', description: 'Validation', metadata: { validationCallCount: 5 }
    } as IValidationEvidence);
    
    snapshotV1.freeze();
    console.log('✅ Phase 1: Raw Evidence Extracted & Snapshot V1 Frozen');

    // 3. Phase 2 (Role Rules)
    const roleRegistry = new RuleRegistry();
    roleRegistry.register(new StateOwnerRule());
    roleRegistry.register(new PolicyOwnerRule());
    const roleEngine = new RuleEngine(roleRegistry);
    const roleFindings = roleEngine.execute(snapshotV1);
    
    const godRoles = roleFindings.filter(f => f.summary.includes('node_god'));
    if (godRoles.length !== 2) throw new Error('Failed to find STATE_OWNER and POLICY_OWNER for node_god');
    console.log('✅ Phase 2: Roles Classified (STATE_OWNER, POLICY_OWNER)');

    // 4. Phase 3 (Influence Analyzer creates V2)
    const analyzer = new InfluenceAnalyzer();
    const snapshotV2 = analyzer.analyze(snapshotV1, roleFindings);
    console.log('✅ Phase 3: InfluenceAnalyzer generated Snapshot V2 with Role Density');

    // 5. Phase 3 (Authority Rule)
    const authRegistry = new RuleRegistry();
    authRegistry.register(new AuthorityRule());
    const authEngine = new RuleEngine(authRegistry);
    const authFindings = authEngine.execute(snapshotV2);

    const godAuthority = authFindings.find(f => f.summary.includes('node_god'));
    if (!godAuthority) throw new Error('Failed to compute authority for node_god');
    
    console.log('✅ Phase 3: Authority Rule Executed');
    console.log('\n--- Authority Finding ---');
    console.log(`Type: ${godAuthority.type}`);
    console.log(`Explanation:\n${godAuthority.explanation}`);
    console.log('-------------------------');

    if (godAuthority.type !== 'DOMINANT_AUTHORITY') {
        throw new Error(`Expected DOMINANT_AUTHORITY, got ${godAuthority.type}`);
    }
}

runPhase3E2ETest();
