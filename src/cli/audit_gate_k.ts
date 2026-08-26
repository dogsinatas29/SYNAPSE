import { 
    ALLOWED_STATES, 
    ALLOWED_EVENTS, 
    ALLOWED_TRANSITIONS 
} from '../core/reasoning/analyzers/ArchitecturalVocabulary';

/**
 * v0.3.34.32 Phase 8.75: Gate K Audit
 * 
 * Transition Coverage Audit.
 * ArchitecturalTransitionGraph(FSM) 내에 도달 불가능한 유령역(Dead State), 
 * 아무 엣지에도 매핑되지 않은 이벤트(Dead Event), 
 * 악성 무한 루프(Cycle)가 존재하는지 수학적으로 검증합니다.
 */
export class GateKAudit {
    
    public runAudit(): string {
        let report = '# Phase 8.75: Gate K (Transition Coverage Report)\n\n';

        const rootStates = ['UNOBSERVED', 'DISCOVERED']; // 시작 지점
        let deadStates: string[] = [];
        let deadEvents: string[] = [];
        let cycles: string[][] = [];

        // =====================================
        // Test 1: Reachability & Dead State Audit
        // =====================================
        const reachable = new Set<string>(rootStates);
        let changed = true;
        
        while (changed) {
            changed = false;
            for (const t of ALLOWED_TRANSITIONS) {
                if (reachable.has(t.fromState) && !reachable.has(t.toState)) {
                    reachable.add(t.toState);
                    changed = true;
                }
            }
        }

        const RESERVED_STATES = new Set<string>([
            'CLASSIFIED', 'OWNED', 'PROPAGATED', 'BOUNDARY_CROSSING', 'OWNERSHIP_IDENTIFIED'
        ]);

        let orphanStates: string[] = [];
        let reservedStates: string[] = [];

        ALLOWED_STATES.forEach(state => {
            if (!reachable.has(state)) {
                if (RESERVED_STATES.has(state)) {
                    reservedStates.push(state);
                } else {
                    orphanStates.push(state);
                }
                deadStates.push(state);
            }
        });

        // =====================================
        // Test 2: Dead Event Audit
        // =====================================
        ALLOWED_EVENTS.forEach(event => {
            const used = ALLOWED_TRANSITIONS.some(t => t.event === event);
            if (!used) deadEvents.push(event);
        });

        // =====================================
        // Test 3: Cycle Audit (DFS)
        // =====================================
        const visited = new Set<string>();
        const stack = new Set<string>();

        const detectCycle = (state: string, path: string[]) => {
            if (stack.has(state)) {
                // Cycle found
                const cycleStart = path.indexOf(state);
                cycles.push([...path.slice(cycleStart), state]);
                return;
            }
            if (visited.has(state)) return;

            visited.add(state);
            stack.add(state);

            const neighbors = ALLOWED_TRANSITIONS.filter(t => t.fromState === state).map(t => t.toState);
            neighbors.forEach(n => {
                detectCycle(n, [...path, n]);
            });

            stack.delete(state);
        };

        rootStates.forEach(root => detectCycle(root, [root]));

        // 리포트 생성
        report += `### Test 1: Reachability & Dead State Audit\n`;
        if (deadStates.length === 0) {
            report += `> **Result: PASS** (All states are reachable from root)\n\n`;
        } else {
            if (orphanStates.length > 0) {
                report += `> **Result: FAIL** (Found ORPHAN dead states)\n`;
                report += `- Orphan States (must be removed or connected): \`${orphanStates.join(', ')}\`\n`;
            } else {
                report += `> **Result: PASS** (Dead states found, but all are RESERVED for future engines)\n`;
            }
            if (reservedStates.length > 0) {
                report += `- Reserved States: \`${reservedStates.join(', ')}\`\n`;
            }
            report += `\n`;
        }

        report += `### Test 2: Dead Event Audit\n`;
        if (deadEvents.length === 0) {
            report += `> **Result: PASS** (All events are utilized in edges)\n\n`;
        } else {
            report += `> **Result: WARN** (Found unused events/사용되지 않은 트리거)\n`;
            report += `- Dead Events: \`${deadEvents.join(', ')}\`\n\n`;
        }

        report += `### Test 3: Cycle Audit (무한 루프 탐지)\n`;
        if (cycles.length === 0) {
            report += `> **Result: PASS** (No uncontrolled cycles detected. Safe DAG structure.)\n\n`;
        } else {
            report += `> **Result: INFO** (Cycles detected, ensure they are intentional)\n`;
            cycles.forEach(c => report += `- Cycle: \`${c.join(' -> ')}\`\n`);
            report += `\n`;
        }

        return report;
    }
}

if (require.main === module) {
    const auditor = new GateKAudit();
    console.log(auditor.runAudit());
}
