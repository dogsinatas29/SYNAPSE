import { SimulationState } from './src/core/simulation/state/SimulationState';
import { StateMatrixValidator } from './src/core/simulation/state/SimulationStateMatrix';

function runStateMatrixTest() {
    console.log('[Test] Phase 6.5: State Matrix & Ownership Rules');

    const tryTransition = (from: SimulationState, to: SimulationState, expectSuccess: boolean) => {
        try {
            StateMatrixValidator.assertTransition(from, to);
            if (!expectSuccess) {
                console.error(`❌ FAIL: Transition ${from} -> ${to} should have been rejected!`);
            } else {
                console.log(`✅ PASS: Transition ${from} -> ${to} allowed.`);
            }
        } catch (e: any) {
            if (expectSuccess) {
                console.error(`❌ FAIL: Transition ${from} -> ${to} should have been allowed! Error: ${e.message}`);
            } else {
                console.log(`✅ PASS: Transition ${from} -> ${to} correctly rejected.`);
            }
        }
    };

    console.log('\n--- 1. Valid Transitions ---');
    tryTransition(SimulationState.NORMAL, SimulationState.DIRTY, true);
    tryTransition(SimulationState.NORMAL, SimulationState.BROKEN, true);
    tryTransition(SimulationState.DIRTY, SimulationState.BROKEN, true);

    console.log('\n--- 2. Invalid Transitions (Recovery Disabled) ---');
    tryTransition(SimulationState.DIRTY, SimulationState.NORMAL, false);
    tryTransition(SimulationState.BROKEN, SimulationState.NORMAL, false);
    tryTransition(SimulationState.BROKEN, SimulationState.DIRTY, false);

    console.log('\n[Test] Phase 6.5 Validation Complete.');
}

runStateMatrixTest();
