import { SignalFinding } from './SignalFinding';

export interface RawSignalReport {
    /** 
     * Key: Node ID, Value: Array of Signal IDs
     * e.g., { "GraphModel": ["owns_state", "lifecycle_controller"] }
     */
    [nodeId: string]: string[];
}

/**
 * Phase 13.1: Signal Discovery Core
 * 
 * 어떠한 중간 모델(Model Builder)이나 창발(Emergence) 평가도 없이, 
 * 레지스트리가 수집한 날것의 신호들(SignalFinding)을 가감없이 덤프하는 역할을 수행합니다.
 * 
 * 인간은 이 덤프 결과를 모니터링하여, 어떠한 Constraint(STO, RSO 등)가 실재하는지 
 * 사후적으로 관찰/군집화해야 합니다.
 */
export class SignalReportGenerator {
    public generate(findings: SignalFinding[]): RawSignalReport {
        const report: RawSignalReport = {};
        
        for (const finding of findings) {
            if (!report[finding.nodeId]) {
                report[finding.nodeId] = [];
            }
            
            // 중복 방지 로직 (Set 활용)
            if (!report[finding.nodeId].includes(finding.signalId)) {
                report[finding.nodeId].push(finding.signalId);
            }
        }
        
        // 디버깅 및 리뷰 편의를 위해 nodeId 기준으로 알파벳 정렬할 수 있습니다.
        const sortedReport: RawSignalReport = {};
        Object.keys(report)
            .sort()
            .forEach(key => {
                sortedReport[key] = report[key].sort();
            });
            
        return sortedReport;
    }
}
