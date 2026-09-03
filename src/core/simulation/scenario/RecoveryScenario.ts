import { RecoveryEventType } from './RecoveryEventType';

export interface RecoveryScenario {
    id: string;
    type: RecoveryEventType;
    targetId: string;
    evidenceIds: readonly string[];
}
