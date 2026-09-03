import { SimulationTransition } from '../../state/SimulationTransition';
import { SimulationState } from '../../state/SimulationState';

export interface RecoveryTraceEdge {
    sourceId: string;
    targetId: string;
    ownerType: 'NODE' | 'EDGE';
    evidenceId: string;
    isPartialRecovery: boolean; // True if it stayed BROKEN (only removed some causes)
}

export class RecoveryTraceGraph {
    private traces: RecoveryTraceEdge[] = [];

    public buildFromTransitions(transitions: SimulationTransition[]): void {
        for (const t of transitions) {
            if (!t.causesToRemove || t.causesToRemove.length === 0) continue;

            const isPartial = t.to === SimulationState.BROKEN;

            for (const causeId of t.causesToRemove) {
                for (const ev of t.evidenceIds) {
                    this.traces.push({
                        sourceId: causeId, // What we removed
                        targetId: t.ownerId, // What got recovered (or partially recovered)
                        ownerType: t.ownerType,
                        evidenceId: ev,
                        isPartialRecovery: isPartial
                    });
                }
            }
        }
    }

    public getTraces(): readonly RecoveryTraceEdge[] {
        return this.traces;
    }
}
