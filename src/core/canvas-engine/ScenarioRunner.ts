import { canvasEngine } from './CanvasEngine';
import { graphModel } from '../GraphModel';
import { Intent } from './Intent';

/**
 * 🏃 SYNAPSE Scenario Runner (v0.3.10)
 * 
 * v0.3.10_forced_scenario.md 에 정의된 강제 실행 시나리오를 전수 검증한다.
 * 시스템의 결정론적(Deterministic) 동작과 파이프라인 무결성을 보장한다.
 */

export interface Scenario {
  name: string;
  intents: Intent[];
  expected: {
    nodeCount: number;
    edgeCount: number;
    success: boolean;
    failureStep?: number; // 실패가 예상되는 단계 (1-indexed)
    reason?: string;
  };
}

export class ScenarioRunner {
  /**
   * 🧪 단일 시나리오 실행 및 검증
   */
  public async runScenario(scenario: Scenario): Promise<{ ok: boolean; log: string[] }> {
    const logs: string[] = [];
    logs.push(`[Scenario] Start: ${scenario.name}`);
    
    // 1. 상태 초기화
    graphModel.reset();
    logs.push(`State reset to empty.`);

    // 2. Intent 순차 실행
    let currentStep = 0;
    for (const intent of scenario.intents) {
      currentStep++;
      const result = canvasEngine.execute(intent);

      if (!result.ok) {
        logs.push(`Step ${currentStep} (${intent.type}) FAILED: ${JSON.stringify(result.verdict.reasons)}`);
        
        // 예상된 실패인지 확인
        if (scenario.expected.failureStep === currentStep) {
          logs.push(`✓ Expected failure at step ${currentStep}.`);
          break; // 시나리오 조기 종료 (실패가 목표인 경우)
        } else if (!scenario.expected.success) {
           // success가 false 인데 failureStep이 명시 안된 경우? 일단 계속 진행 하거나 정밀 검사 필요
        } else {
          logs.push(`✗ Unexpected failure at step ${currentStep}.`);
          return { ok: false, log: logs };
        }
      } else {
        logs.push(`Step ${currentStep} (${intent.type}) SUCCESS.`);
      }
    }

    // 3. 최종 상태 검증
    const finalState = canvasEngine.getFinalSnapshot();
    const nodeCount = Object.keys(finalState.nodes).length;
    const edgeCount = Object.keys(finalState.edges).length;
    
    const nodeMatch = nodeCount === scenario.expected.nodeCount;
    const edgeMatch = edgeCount === scenario.expected.edgeCount;

    if (nodeMatch && edgeMatch) {
      logs.push(`✓ Final state matches expectations (Nodes: ${nodeCount}, Edges: ${edgeCount}).`);
      return { ok: true, log: logs };
    } else {
      logs.push(`✗ Final state mismatch: Expected (N:${scenario.expected.nodeCount}, E:${scenario.expected.edgeCount}), Got (N:${nodeCount}, E:${edgeCount})`);
      return { ok: false, log: logs };
    }
  }

  /**
   * 🚀 모든 표준 시나리오 일괄 실행
   */
  public async runAllScenarios(): Promise<boolean> {
    const scenarios = this.getStandardScenarios();
    let totalFailed = 0;

    for (const s of scenarios) {
      const result = await this.runScenario(s);
      if (!result.ok) {
        totalFailed++;
        console.error(`[Runner] Scenario '${s.name}' FAILED:\n${result.log.join('\n')}`);
      } else {
        console.log(`[Runner] Scenario '${s.name}' PASSED.`);
      }
    }

    console.log(`[Runner] Finished. Result: ${scenarios.length - totalFailed}/${scenarios.length} PASSED.`);
    return totalFailed === 0;
  }

  private getStandardScenarios(): Scenario[] {
    const timestamp = Date.now();
    return [
      {
        name: "Scenario 1: Create Single Node",
        intents: [
          { type: 'ADD_NODE', payload: { id: 'A', label: 'Node A' }, timestamp }
        ],
        expected: { nodeCount: 1, edgeCount: 0, success: true }
      },
      {
        name: "Scenario 2: Create Multiple Nodes",
        intents: [
          { type: 'ADD_NODE', payload: { id: 'A' }, timestamp },
          { type: 'ADD_NODE', payload: { id: 'B' }, timestamp }
        ],
        expected: { nodeCount: 2, edgeCount: 0, success: true }
      },
      {
        name: "Scenario 3: Duplicate Node (Rule Fail)",
        intents: [
          { type: 'ADD_NODE', payload: { id: 'A' }, timestamp },
          { type: 'ADD_NODE', payload: { id: 'A' }, timestamp }
        ],
        expected: { nodeCount: 1, edgeCount: 0, success: false, failureStep: 2 }
      },
      {
        name: "Scenario 4: Connect Valid Edge",
        intents: [
          { type: 'ADD_NODE', payload: { id: 'A' }, timestamp },
          { type: 'ADD_NODE', payload: { id: 'B' }, timestamp },
          { type: 'CONNECT_EDGE', payload: { from: 'A', to: 'B' }, timestamp }
        ],
        expected: { nodeCount: 2, edgeCount: 1, success: true }
      },
      {
         name: "Scenario 5: Connect Edge Without Nodes",
         intents: [
           { type: 'CONNECT_EDGE', payload: { from: 'A', to: 'B' }, timestamp }
         ],
         expected: { nodeCount: 0, edgeCount: 0, success: false, failureStep: 1 }
      },
      {
        name: "Scenario 6: Partial Invalid Sequence",
        intents: [
          { type: 'ADD_NODE', payload: { id: 'A' }, timestamp },
          { type: 'CONNECT_EDGE', payload: { from: 'A', to: 'B' }, timestamp }
        ],
        expected: { nodeCount: 1, edgeCount: 0, success: false, failureStep: 2 }
      },
      {
        name: "Scenario 7: Multiple Edges",
        intents: [
          { type: 'ADD_NODE', payload: { id: 'A' }, timestamp },
          { type: 'ADD_NODE', payload: { id: 'B' }, timestamp },
          { type: 'ADD_NODE', payload: { id: 'C' }, timestamp },
          { type: 'CONNECT_EDGE', payload: { from: 'A', to: 'B' }, timestamp },
          { type: 'CONNECT_EDGE', payload: { from: 'B', to: 'C' }, timestamp }
        ],
        expected: { nodeCount: 3, edgeCount: 2, success: true }
      },
      {
        name: "Scenario 8: Duplicate Edge",
        intents: [
          { type: 'ADD_NODE', payload: { id: 'A' }, timestamp },
          { type: 'ADD_NODE', payload: { id: 'B' }, timestamp },
          { type: 'CONNECT_EDGE', payload: { from: 'A', to: 'B' }, timestamp },
          { type: 'CONNECT_EDGE', payload: { from: 'A', to: 'B' }, timestamp }
        ],
        expected: { nodeCount: 2, edgeCount: 1, success: false, failureStep: 4 }
      }
    ];
  }
}

export const scenarioRunner = new ScenarioRunner();
