import { ValidationEventType } from './ValidationEventType';

export interface ValidationScenario {
    id: string;
    type: ValidationEventType;
    targetId: string;
    targetType: 'NODE' | 'EDGE';
    evidenceIds: readonly string[];
    causedByScenarioId?: string;
}
