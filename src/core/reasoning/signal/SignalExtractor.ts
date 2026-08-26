import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';
import { SignalFinding } from './SignalFinding';

/**
 * Phase 13.1: Signal Discovery Core
 * 
 * 구체적인 관측(Signal Extraction) 로직을 담당합니다.
 * 어떠한 아키텍처적 해석(Constraint, Authority 등)도 배제하고 기계적인 행동 탐지에 집중합니다.
 */
export interface SignalExtractor {
    /**
     * e.g., 'extractor_state_mutation_v1'
     */
    id: string;
    
    /**
     * 입력된 증거(Evidence)로부터 기계적 신호(Signal)들을 추출합니다.
     */
    extract(evidences: ArchitecturalEvidence[]): SignalFinding[];
}
