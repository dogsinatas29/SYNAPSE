import { SignalStatistics } from './SignalStatisticsGenerator';

export interface SignalSurvivability {
    signalId: string;
    projectPresence: number; // 0 ~ 1 (비율) 또는 1~3 (개수) - 여기선 %로 표기하거나 갯수로 표기. 개수로 합시다.
    meanPercent: number;
    variance: number;
}

export interface SignalStabilityReport {
    projectsAnalyzed: string[];
    survivability: SignalSurvivability[];
    tier1: string[];
    tier2: string[];
    tier3: string[];
    rejected: string[];
}

/**
 * Phase 13.3: Signal Survivability Analysis
 * 
 * 여러 프로젝트(SYNAPSE, AntennaPod, VSCode 등)에서 추출된 Signal Census(통계)를 교차 분석하여,
 * 도메인(Web, App, IDE)이 바뀌어도 안정적으로 살아남는 Universal Signal을 식별합니다.
 */
export class SignalStabilityAnalyzer {
    public analyze(reports: Record<string, SignalStatistics>): SignalStabilityReport {
        const projects = Object.keys(reports);
        if (projects.length === 0) {
            return {
                projectsAnalyzed: [],
                survivability: [],
                tier1: [], tier2: [], tier3: [], rejected: []
            };
        }

        const signalStatsMap: Record<string, number[]> = {};

        // 1. Collect all signal percentages
        for (const [project, stats] of Object.entries(reports)) {
            // distribution = { signalId: { count: number, percent: number } }
            const distribution = (stats as any).distribution || {};
            for (const [signalId, data] of Object.entries(distribution)) {
                if (!signalStatsMap[signalId]) {
                    signalStatsMap[signalId] = new Array(projects.length).fill(0);
                }
                const projIndex = projects.indexOf(project);
                signalStatsMap[signalId][projIndex] = (data as any).percent || 0;
            }
        }

        const survivability: SignalSurvivability[] = [];
        const tier1: string[] = [];
        const tier2: string[] = [];
        const tier3: string[] = [];
        const rejected: string[] = [];

        // 2. Calculate survivability metrics
        for (const [signalId, percentages] of Object.entries(signalStatsMap)) {
            const presentCount = percentages.filter(p => p > 0).length;
            const sum = percentages.reduce((a, b) => a + b, 0);
            const meanPercent = sum / projects.length;

            const squaredDiffs = percentages.map(p => Math.pow(p - meanPercent, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / projects.length;

            survivability.push({
                signalId,
                projectPresence: presentCount,
                meanPercent: Math.round(meanPercent * 100) / 100,
                variance: Math.round(variance * 100) / 100
            });
        }

        // 3. Sort and classify Tiers
        // Sort by Presence DESC, Mean DESC
        survivability.sort((a, b) => {
            if (a.projectPresence !== b.projectPresence) {
                return b.projectPresence - a.projectPresence;
            }
            return b.meanPercent - a.meanPercent;
        });

        for (const s of survivability) {
            if (s.projectPresence < projects.length) {
                rejected.push(s.signalId);
            } else {
                if (s.variance < 10 && s.meanPercent >= 10) {
                    tier1.push(s.signalId); // 고르게 높게 등장 (variance 낮음)
                } else if (s.meanPercent >= 20) {
                    tier2.push(s.signalId); // 높게 등장하지만 variance 있음
                } else {
                    tier3.push(s.signalId); // 생존하긴 하나, 수치가 낮음
                }
            }
        }

        return {
            projectsAnalyzed: projects,
            survivability,
            tier1,
            tier2,
            tier3,
            rejected
        };
    }
}
