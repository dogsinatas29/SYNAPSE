import { SimulationTransition } from '../state/SimulationTransition';
import { PropagationTraceEdge } from './PropagationTraceEdge';
import { PropagationResult } from './PropagationResult';

export interface SimulationPropagationResult {
    transitions: SimulationTransition[];
    traces: PropagationTraceEdge[];
    stats?: PropagationResult['stats'];
}
