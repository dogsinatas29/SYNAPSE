import { SignalFinding } from './SignalFinding';

export interface SignalStatistics {
    totalSignals: number;
    totalNodes: number;
    signalizedNodes: number;
    nodeCoverage: number; // signalizedNodes / totalNodes
    signalDensity: number; // totalSignals / totalNodes
    uniqueSignals: number;
    topSignals: { signalId: string; count: number }[];
    topNodes: { nodeId: string; signalCount: number }[];
    signalsPerNodeHistogram: Record<string, number>; // "1", "2", "3", "4+" 등의 라벨
    averageSignalsPerSignalizedNode: number;
    distribution: Record<string, {
        count: number;
        percent: number;
    }>;
}

/**
 * Phase 13.2: Signal Taxonomy Validation
 * 
 * 프로젝트 간 신호(Signal)의 발생 빈도와 집중도를 통계적으로 추출합니다.
 * 이 데이터는 특정 신호가 여러 프로젝트에서 안정적으로 생존하는지(Taxonomy Validation) 검증하는 데 사용됩니다.
 */
export class SignalStatisticsGenerator {
    public generateStatistics(findings: SignalFinding[], totalNodes: number): SignalStatistics {
        const totalSignals = findings.length;
        const signalDensity = totalNodes > 0 ? (Math.round((totalSignals / totalNodes) * 100) / 100) : 0;
        
        // signalId별 카운트 계산
        const signalCounts: Record<string, number> = {};
        // nodeId별 카운트 계산
        const nodeCounts: Record<string, number> = {};
        
        for (const finding of findings) {
            signalCounts[finding.signalId] = (signalCounts[finding.signalId] || 0) + 1;
            nodeCounts[finding.nodeId] = (nodeCounts[finding.nodeId] || 0) + 1;
        }

        const signalizedNodes = Object.keys(nodeCounts).length;
        const nodeCoverage = totalNodes > 0 ? (Math.round((signalizedNodes / totalNodes) * 10000) / 100) : 0; // % 표현으로

        const uniqueSignals = Object.keys(signalCounts).length;

        // topSignals 계산 (내림차순 정렬 후 상위 10개 추출)
        const topSignals = Object.entries(signalCounts)
            .map(([signalId, count]) => ({ signalId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // topNodes 계산 (내림차순 정렬 후 상위 10개 추출)
        const topNodes = Object.entries(nodeCounts)
            .map(([nodeId, signalCount]) => ({ nodeId, signalCount }))
            .sort((a, b) => b.signalCount - a.signalCount)
            .slice(0, 10);

        // distribution 계산 (백분율 포함)
        const distribution: Record<string, { count: number; percent: number }> = {};
        for (const [signalId, count] of Object.entries(signalCounts)) {
            const percent = totalSignals > 0 ? (count / totalSignals) * 100 : 0;
            distribution[signalId] = {
                count,
                // 소수점 둘째 자리까지 반올림
                percent: Math.round(percent * 100) / 100
            };
        }

        // 히스토그램 및 평균 계산
        const signalsPerNodeHistogram: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4+": 0 };
        for (const count of Object.values(nodeCounts)) {
            if (count === 1) signalsPerNodeHistogram["1"]++;
            else if (count === 2) signalsPerNodeHistogram["2"]++;
            else if (count === 3) signalsPerNodeHistogram["3"]++;
            else signalsPerNodeHistogram["4+"]++;
        }
        
        const averageSignalsPerSignalizedNode = signalizedNodes > 0 
            ? Math.round((totalSignals / signalizedNodes) * 100) / 100 
            : 0;

        return {
            totalSignals,
            totalNodes,
            signalizedNodes,
            nodeCoverage,
            signalDensity,
            uniqueSignals,
            topSignals,
            topNodes,
            signalsPerNodeHistogram,
            averageSignalsPerSignalizedNode,
            distribution
        };
    }
}
