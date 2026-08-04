/**
 * SYNAPSE v0.3.34.13: Architectural Ecology Laboratory
 * 
 * "좋은 아키텍처 커뮤니티란 무엇인가?"를 정의하는 절대적 평가 함수.
 * 특정 시그널(알고리즘)에 종속되지 않고, 입력된 그래프의 커뮤니티 품질을 수치화한다.
 */

// ==========================================
// [Stage A & A.6] Metrics Layer (다차원 품질 평가기)
// ==========================================

export interface PurityMetric {
    dominantValue: string;
    score: number;
    entropy: number;
}

export interface NodeMetadataExtractor {
    extract(nodeId: string): Record<string, string>;
}

export interface CommunityMetrics {
    baselineCommunityId?: string; 
    communityId: string;
    dimensions: Record<string, PurityMetric>; // 예: path, language, layer 별 독립적 Purity
    stability: number;
    retention: number;
    cohesion: number;
}

export class MetricsCalculator {
    public static calculateCohesion(internalEdgeCount: number, externalEdgeCount: number): number {
        const total = internalEdgeCount + externalEdgeCount;
        if (total === 0) return 0; // 엣지가 없는 고립된 커뮤니티 (혹은 단일 노드)
        return internalEdgeCount / total;
    }

    public static calculateDimensions(nodes: string[], extractor: NodeMetadataExtractor): Record<string, PurityMetric> {
        if (nodes.length === 0) return {};
        
        const dimensionValues = new Map<string, Map<string, number>>(); 
        
        for (const n of nodes) {
            const meta = extractor.extract(n);
            for (const [dim, value] of Object.entries(meta)) {
                if (!dimensionValues.has(dim)) dimensionValues.set(dim, new Map());
                const valMap = dimensionValues.get(dim)!;
                valMap.set(value, (valMap.get(value) || 0) + 1);
            }
        }
        
        const result: Record<string, PurityMetric> = {};
        for (const [dim, valMap] of dimensionValues.entries()) {
            let maxCount = 0;
            let dominantValue = '';
            let entropy = 0;
            
            for (const [val, count] of valMap.entries()) {
                if (count > maxCount) {
                    maxCount = count;
                    dominantValue = val;
                }
                const p = count / nodes.length;
                entropy -= p * Math.log2(p);
            }
            
            result[dim] = {
                dominantValue,
                score: maxCount / nodes.length,
                entropy
            };
        }
        return result;
    }

    public static calculateRetention(baselineNodes: Set<string>, currentNodes: Set<string>): number {
        if (baselineNodes.size === 0) return 0;
        let retained = 0;
        for (const n of baselineNodes) {
            if (currentNodes.has(n)) retained++;
        }
        return retained / baselineNodes.size;
    }
}

// ==========================================
// [Stage B] Dominance Research (중력장 분해)
// ==========================================

export interface DominanceVector {
    size: number;       // 절대적 규모 비중
    traffic: number;    // 평균 트래픽 처리 강도 (Community Avg Degree / Global Avg Degree)
    dependency: number; // Kernel Gravity (PageRank 합산)
    ecosystem: number;  // Driver/Feature Gravity (Eigenvector 합산 비중)
}

export class DominanceCalculator {
    public static calculateSizeDominance(communitySize: number, totalNodes: number): number {
        if (totalNodes === 0) return 0;
        return communitySize / totalNodes;
    }

    public static calculateTrafficDominance(communityNodes: string[], getDegree: (nodeId: string) => number, globalDegreeSum: number): number {
        if (communityNodes.length === 0 || globalDegreeSum === 0) return 0;
        let sum = 0;
        for (const n of communityNodes) {
            sum += getDegree(n);
        }
        return sum / globalDegreeSum;
    }

    public static calculateDependencyDominance(communityNodes: string[], getPageRank: (nodeId: string) => number): number {
        let sum = 0;
        for (const n of communityNodes) {
            sum += getPageRank(n);
        }
        return sum; 
    }

    public static calculateEcosystemDominance(communityNodes: string[], getEigenvector: (nodeId: string) => number, globalEigenvectorSum: number): number {
        if (globalEigenvectorSum === 0) return 0;
        let sum = 0;
        for (const n of communityNodes) {
            sum += getEigenvector(n);
        }
        return sum / globalEigenvectorSum;
    }
}

// ==========================================
// [Stage C-1] Diagnosis Layer (수치 -> 범주화)
// ==========================================

export type Level = 'High' | 'Medium' | 'Low';

export interface ThresholdProfile {
    purityHigh: number;
    purityMedium: number;
    retentionHigh: number;
    retentionMedium: number;
    cohesionHigh: number;
}

export interface CommunityDiagnosis {
    purityLevels: Record<string, Level>;
    retentionLevel: Level;
    cohesionLevel: Level;
}

export class DiagnosisEngine {
    public static diagnose(metrics: CommunityMetrics, profile: ThresholdProfile): CommunityDiagnosis {
        const purityLevels: Record<string, Level> = {};
        for (const [dim, metric] of Object.entries(metrics.dimensions)) {
            purityLevels[dim] = metric.score >= profile.purityHigh ? 'High' : (metric.score >= profile.purityMedium ? 'Medium' : 'Low');
        }
        
        const retentionLevel: Level = metrics.retention >= profile.retentionHigh ? 'High' : (metrics.retention > profile.retentionMedium ? 'Medium' : 'Low');
        const cohesionLevel: Level = metrics.cohesion >= profile.cohesionHigh ? 'High' : 'Low';

        return {
            purityLevels,
            retentionLevel,
            cohesionLevel
        };
    }
}

// ==========================================
// [Stage C-2] Classifier Layer (상태 판독기)
// ⚠️ Stage A.6 결정에 따라 Classifier 규칙 하드코딩 삭제 및 보류
// ==========================================
