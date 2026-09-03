export enum SimulationState {
    NORMAL = 'NORMAL',       // 정상 상태 (Baseline)
    DIRTY = 'DIRTY',         // 간접적인 영향을 받은 상태 (Impacted)
    BROKEN = 'BROKEN'        // 제약 조건 위반 등 명확히 파손된 상태
}
