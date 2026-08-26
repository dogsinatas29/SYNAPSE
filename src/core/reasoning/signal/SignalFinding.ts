/**
 * Phase 13.1: Signal Discovery Core
 * 
 * 아키텍처적 해석(Constraint, Authority 등)을 배제하고,
 * 오직 기계적으로 관측된 날것의 '신호(Signal)'만을 정의합니다.
 */

export interface SignalFinding {
    /** 
     * 신호가 관측된 노드의 ID
     */
    nodeId: string;
    
    /** 
     * 관측된 신호의 종류 (Signal Naming Rule 준수)
     * e.g., 'state_mutation', 'lifecycle_control', 'write_access'
     */
    signalId: string;
    
    /**
     * AI 확률(Confidence)을 철저히 배제하고, 
     * 해당 신호가 발현된 증거(코드 라인, 레퍼런스 등)의 ID만을 배열로 추적합니다.
     */
    evidenceIds: string[];
}
