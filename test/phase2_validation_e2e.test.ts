import { EvidenceCategory, IStorageEvidence, IMutationEvidence, IReadEvidence, IUIOutputEvidence, IDispatchEvidence } from '../src/core/reasoning/evidence/Evidence';
import { ReasoningSnapshot } from '../src/core/reasoning/snapshot/ReasoningSnapshot';
import { RuleRegistry, RuleEngine } from '../src/core/reasoning/rules/RuleEngine';
import { StateOwnerRule } from '../src/core/reasoning/rules/roles/StateOwnerRule';
import { PolicyOwnerRule } from '../src/core/reasoning/rules/roles/PolicyOwnerRule';
import { ViewRule } from '../src/core/reasoning/rules/roles/ViewRule';
import { ControllerRule } from '../src/core/reasoning/rules/roles/ControllerRule';
import { AdapterRule } from '../src/core/reasoning/rules/roles/AdapterRule';

function runPhase2E2ETest() {
    // 1. Mock Extraction (Raw evidence only)
    const snapshot = new ReasoningSnapshot();
    
    // Node A: A pure UI component
    snapshot.addEvidence({
        id: 'ev-ui-nodeA',
        category: EvidenceCategory.UI_OUTPUT,
        nodeId: 'nodeA',
        description: 'UI rendering evidence',
        metadata: { renderCallCount: 5 }
    } as IUIOutputEvidence);

    // Node B: A stateful store that also dispatches events (STATE_OWNER + CONTROLLER)
    snapshot.addEvidence({
        id: 'ev-storage-nodeB',
        category: EvidenceCategory.STORAGE,
        nodeId: 'nodeB',
        description: 'Storage evidence',
        metadata: { fieldCount: 10 }
    } as IStorageEvidence);
    snapshot.addEvidence({
        id: 'ev-mutation-nodeB',
        category: EvidenceCategory.MUTATION,
        nodeId: 'nodeB',
        description: 'Mutation evidence',
        metadata: { mutationMethodCount: 3 }
    } as IMutationEvidence);
    snapshot.addEvidence({
        id: 'ev-dispatch-nodeB',
        category: EvidenceCategory.DISPATCH,
        nodeId: 'nodeB',
        description: 'Dispatch evidence',
        metadata: { dispatchCallCount: 2 }
    } as IDispatchEvidence);

    // 2. Freeze Snapshot
    snapshot.freeze();

    // 3. Setup Engine with R-001 to R-005
    const registry = new RuleRegistry();
    registry.register(new StateOwnerRule());
    registry.register(new PolicyOwnerRule());
    registry.register(new ViewRule());
    registry.register(new ControllerRule());
    registry.register(new AdapterRule());
    const engine = new RuleEngine(registry);

    // 4. Execute
    const findings = engine.execute(snapshot);

    // 5. Assertions
    console.log(`Generated ${findings.length} findings.`);
    
    const nodeA_Roles = findings.filter(f => f.summary.includes('nodeA')).map(f => f.type);
    console.log(`Node A Roles: ${nodeA_Roles.join(', ')}`);
    if (nodeA_Roles.length !== 1 || nodeA_Roles[0] !== 'VIEW') {
        throw new Error('Node A classification failed.');
    }

    const nodeB_Roles = findings.filter(f => f.summary.includes('nodeB')).map(f => f.type);
    console.log(`Node B Roles: ${nodeB_Roles.join(', ')}`);
    if (nodeB_Roles.length !== 2 || !nodeB_Roles.includes('STATE_OWNER') || !nodeB_Roles.includes('CONTROLLER')) {
        throw new Error('Node B classification failed (Missing overlapping roles).');
    }
    
    // Check confidence logic
    const stateOwnerFinding = findings.find(f => f.type === 'STATE_OWNER');
    if (!stateOwnerFinding || stateOwnerFinding.confidence !== 0.75) {
        throw new Error('StateOwner confidence calculation failed.');
    }

    console.log('✅ Phase 2 Role Classification E2E passed. (No Authority/Criticality leaked).');
}

runPhase2E2ETest();
