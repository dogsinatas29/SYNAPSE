import { RecoveryEventType } from './src/core/simulation/scenario/RecoveryEventType';
import { RecoveryScenario } from './src/core/simulation/scenario/RecoveryScenario';
import { ValidationEventType } from './src/core/simulation/scenario/ValidationEventType';
import { ValidationScenario } from './src/core/simulation/scenario/ValidationScenario';
import { DependencyRestoredPolicy, ValidationPassedPolicy } from './src/core/simulation/propagation/policies/RecoveryPolicies';
import { SimulationState } from './src/core/simulation/state/SimulationState';

function verifySpecification() {
    console.log('🚀 Phase 9.8: Event Catalog & Contract Verification\n');

    const recScenario: RecoveryScenario = {
        id: 'rec_001',
        type: RecoveryEventType.DEPENDENCY_RESTORED,
        targetId: 'edge_123',
        evidenceIds: ['ev_commit_456']
    };

    const valScenario: ValidationScenario = {
        id: 'val_001',
        type: ValidationEventType.VALIDATION_PASSED,
        targetId: 'node_789',
        evidenceIds: ['ev_test_success_999']
    };

    const recPolicy = new DependencyRestoredPolicy();
    const valPolicy = new ValidationPassedPolicy();

    const recImpact = recPolicy.evaluate(recScenario);
    const valImpact = valPolicy.evaluate(valScenario);

    console.log('Recovery Scenario Initialized:', recScenario);
    console.log(`Recovery Contract Check: Result should be DIRTY => ${recImpact === SimulationState.DIRTY ? 'PASS ✅' : 'FAIL ❌'}`);
    
    console.log('\nValidation Scenario Initialized:', valScenario);
    console.log(`Validation Contract Check: Result should be NORMAL => ${valImpact === SimulationState.NORMAL ? 'PASS ✅' : 'FAIL ❌'}`);
}

verifySpecification();
