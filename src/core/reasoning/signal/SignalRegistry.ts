import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';
import { SignalDefinition } from './SignalDefinition';
import { SignalExtractor } from './SignalExtractor';
import { SignalFinding } from './SignalFinding';

/**
 * Phase 13.1: Signal Discovery Core
 * 
 * 기계적 신호(Signal)에 대한 메타데이터 정의와 추출 로직을 결합하고 관리합니다.
 * 어떠한 아키텍처적 군집화(Clustering/Constraint)도 수행하지 않는 순수 레지스트리입니다.
 */
export class SignalRegistry {
    private definitions: Map<string, SignalDefinition> = new Map();
    private extractors: SignalExtractor[] = [];

    /**
     * 신호 정의(메타데이터)를 등록합니다.
     */
    public registerSignal(definition: SignalDefinition): void {
        this.definitions.set(definition.id, definition);
    }

    /**
     * 신호 추출 로직(Extractor)을 등록합니다.
     */
    public registerExtractor(extractor: SignalExtractor): void {
        this.extractors.push(extractor);
    }

    /**
     * 등록된 모든 Extractor를 구동하여, 입력된 Evidence로부터 신호를 수집합니다.
     */
    public extractAll(evidences: ArchitecturalEvidence[]): SignalFinding[] {
        const allFindings: SignalFinding[] = [];
        
        for (const extractor of this.extractors) {
            const findings = extractor.extract(evidences);
            allFindings.push(...findings);
        }
        
        // 주의: 여기서는 신호를 찾기만 할 뿐, 중복 제거나 필터링 외의 
        // 아키텍처적 해석(Constraint 매핑 등)은 절대 수행하지 않습니다.
        return allFindings;
    }
}
