/**
 * v0.3.34.24 Step 6: Verification Script
 * AnomalyCollector 실제 데이터 검증
 *
 * Usage: ts-node scripts/verify_anomaly_collector.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { StateAuditPipeline } from '../src/core/StateAuditPipeline';

const PROJECTS: { name: string; statePath: string }[] = [
    {
        name: 'AntennaPod',
        statePath: '/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod/synapse_data/project_state.json',
    },
    {
        name: 'VSCode Main',
        statePath: '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_data/project_state.json',
    },
    {
        name: 'Linux Kernel 7.2-rc3',
        statePath: '/home/dogsinatas/다운로드/linux-7.2-rc3/synapse_data/project_state.json',
    },
];

function run() {
    for (const proj of PROJECTS) {
        if (!fs.existsSync(proj.statePath)) {
            console.log(`\n[SKIP] ${proj.name}: ${proj.statePath} not found`);
            continue;
        }

        let state: any;
        try {
            state = JSON.parse(fs.readFileSync(proj.statePath, 'utf-8'));
        } catch (e) {
            console.log(`\n[ERROR] ${proj.name}: parse failed — ${e}`);
            continue;
        }

        const nodes: any[] = state.nodes || [];
        const edges: any[] = state.edges || [];

        if (nodes.length === 0) {
            console.log(`\n[SKIP] ${proj.name}: 0 nodes`);
            continue;
        }

        // ValidationEngine과 동일: 전체 그래프 기준 (rawStateNodes = allNodes)
        const pipeline = new StateAuditPipeline(nodes, nodes);

        const result = pipeline.run(nodes, edges);
        
        const metrics = result.memoryMetrics;
        const fsmDiff = (metrics.afterFsmAudit - metrics.baseline).toFixed(2);
        const propDiff = (metrics.afterPropagation - metrics.afterFsmAudit).toFixed(2);
        const totalDiff = (metrics.afterPropagation - metrics.baseline).toFixed(2);

        const summary = result.anomalySummary;
        const fsmAudit = result.fsmAudit;
        const propagation = result.failurePropagation;

        let blastRadius = 'SAFE';
        const totalImpact = propagation.totalDirect + propagation.totalIndirect + propagation.totalCascade;
        const ratio = propagation.totalNodes > 0 ? (totalImpact / propagation.totalNodes) : 0;
        if (totalImpact > 0) {
            if (ratio >= 0.10) blastRadius = 'HIGH';
            else if (ratio >= 0.02) blastRadius = 'MEDIUM';
            else blastRadius = 'LOW';
        }

        const fsmPass = summary.missingTransitions === 0 && summary.invalidTransitions === 0;

        console.log(`
════════════════════════════════════════
${proj.name}
Nodes: ${nodes.length} / Edges: ${edges.length}
Heap Baseline : ${metrics.baseline.toFixed(2)} MB
After FSM     : +${fsmDiff} MB
After Prop    : +${propDiff} MB
Total Increase: +${totalDiff} MB
════════════════════════════════════════

FSM Completeness (AnomalyCollector)
  Missing Transitions : ${summary.missingTransitions}
  Invalid Transitions : ${summary.invalidTransitions}
  State Completeness  : ${fsmPass ? '✅ PASS' : '⚠️  ISSUES'}

FSM Audit (TransitionGrammar)
  Missing   : ${fsmAudit.missing}
  Invalid   : ${fsmAudit.invalid}
  Uncharted : ${fsmAudit.uncharted}
  Violations: ${fsmAudit.violations.length}

Failure Propagation (v0.3.34.26)
  Direct Impact   : ${propagation.totalDirect}
  Indirect Impact : ${propagation.totalIndirect}
  Cascade Impact  : ${propagation.totalCascade}
  Blast Radius    : ${blastRadius} (${(ratio * 100).toFixed(2)}%)
  Total Impacts   : ${propagation.impacts.length}

HealthState
  UNCLUSTERED         : ${summary.unclustered}
  UNCLASSIFIED        : ${summary.unclassified}   ← Soft Anomaly (Role ontology gap)
  CORRUPTED           : ${summary.corrupted}

ViewState
  OUT_OF_SCOPE        : ${summary.outOfScope}  ← 전체 그래프 기준이므로 0이 정상

ReferenceState
  GHOST               : ${summary.ghost}
`);

        // AGGREGATE_unknown 잔존 확인
        const aggUnknown = nodes.filter((n: any) => n.id?.startsWith('AGGREGATE_unknown')).length;
        const aggOutOfScope = nodes.filter((n: any) => n.id?.startsWith('AGGREGATE_out_of_scope')).length;
        console.log(`  AGGREGATE_unknown   : ${aggUnknown}   ← 목표: 0`);
        console.log(`  AGGREGATE_out_scope : ${aggOutOfScope}`);
    }
}

run();
