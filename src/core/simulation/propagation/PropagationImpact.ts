import { SimulationState } from '../state/SimulationState';

export interface PropagationImpact {
    ownerId: string;
    ownerType: 'NODE' | 'EDGE';
    targetState: SimulationState;
    causeDescriptor?: {
        eventType: string;
        sourceId: string;
    };
}
