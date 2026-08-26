/**
 * Phase 13.1: Signal Discovery Core
 * 
 * YAGNI 원칙에 입각한 극단적 미니멀리즘 인터페이스입니다.
 * version, description, tags 등 아직 필요하지 않은 미래 대비용 메타데이터를 전면 삭제했습니다.
 */

export interface SignalDefinition {
    /** 
     * e.g., 'state_mutation', 'lifecycle_control'
     * 주의: Signal Naming Rule 문서의 관측 가능한 행동 원칙을 준수해야 합니다.
     */
    id: string;
}
