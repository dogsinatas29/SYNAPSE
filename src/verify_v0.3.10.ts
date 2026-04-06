import { scenarioRunner } from './core/canvas-engine/ScenarioRunner';
import { phaseManager, Phase } from './core/PhaseManager';

/**
 * 🛠️ SYNAPSE v0.3.10 Integrity Verification Script
 */

async function main() {
  console.log('🚀 Starting v0.3.10 System Integrity Check...');

  // [중요] Phase를 최소 GRAPH(1) 이상으로 설정해야 실행 가능함 (PhaseGate 제약)
  console.log('[Setup] Setting Phase to GRAPH(1) for validation...');
  phaseManager.setPhase(Phase.GRAPH);

  // 시나리오 러너 실행
  const success = await scenarioRunner.runAllScenarios();

  if (success) {
    console.log('\n✅ ALL SCENARIOS PASSED. The v0.3.10 core is stable.');
    process.exit(0);
  } else {
    console.error('\n❌ SCENARIO FAILURE DETECTED. Please check the logs.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
