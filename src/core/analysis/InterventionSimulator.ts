import { Node, Edge, Cluster, EdgeProvenance } from '../../types/schema';
import { TarjanSCC } from './reasoning/TarjanSCC';
import { ClusterBridgeAnalyzer } from './ClusterBridgeAnalyzer';
import { GraphViewBuilder, GraphPolicy } from './GraphViewBuilder';
import { Logger } from '../../utils/Logger';

export interface InterventionResult {
    targetEdges: string[];     // IDs of edges to cut
    
    // Tracing fields
    targetReason: string;
    targetTier: "T0" | "T1" | "T2" | "T3";
    candidateRank: number;
    rootCauseId: string;

    // AST Microscope Tracing
    astRecommended: boolean;
    astReason: string;

    // Cost Metrics (Cut Cost Score)
    cost: {
        affectedFiles: number;
        affectedClusters: number;
        boundaryCrosses: number;
        level: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    
    // SCC Metrics
    beforeSccSize: number;
    afterSccSize: number;
    absoluteSccReduction: number;
    aig: number;               // Architectural Independence Gain (%)
    
    // Blast Radius Metrics
    beforeBlastRadius: number;
    afterBlastRadius: number;
    
    // Coupling Metrics
    sourceCluster: string;
    targetCluster: string;
    beforeCouplingStrength: number;
    afterCouplingStrength: number;
    
    confidence: {              // weighted average & minimum (weakest link)
        weighted: number;
        minimum: number;
    };
    structuralCost: {          // files + boundary crossing + clusters
        affectedFiles: number;
        affectedClusters: number;
        boundaryCrosses: number;
        totalCost: number;
    };
    concentration: number;     // 0.0 ~ 1.0
    compositeAig: number;      // 0.5 SCC + 0.3 Blast + 0.2 Coupling
    adjustedRoi: number;       // ((AIG * Conf) / Cost) * (0.5 + CF)
    decision: string;          // e.g. "⚠ Investigate Before Action"
}

export class InterventionSimulator {
    /**
     * 가상 절단 시뮬레이션을 수행하고, SCC, Blast Radius, Coupling의 변화량을 계산하여
     * AIG (Architectural Independence Gain)와 Cost를 도출합니다.
     */
    public static simulate(
        nodes: Node[],
        edges: Edge[],
        clusters: Cluster[],
        targetEdgeIds: string[],
        targetReason: string,
        targetTier: "T0" | "T1" | "T2" | "T3",
        candidateRank: number,
        rootCauseId: string,
        beforeScc: any[], // [PERF] Passed from ReasoningEngine to avoid N recomputations
        nodeMap?: Map<string, Node> // [PERF] O(1) node lookup
    ): InterventionResult {
        // --- PROVENANCE AUDIT: SIMULATOR ---
        if (candidateRank === 1) { // Only log once for the entire array
            const simProvStats: Record<string, number> = {};
            edges.forEach(e => {
                const p = e.provenance || 'UNDEFINED';
                simProvStats[p] = (simProvStats[p] || 0) + 1;
            });
            Logger.info(`[PROVENANCE_AUDIT] [SIMULATOR] Total Edges: ${edges.length} | Stats: ${JSON.stringify(simProvStats)}`);
        }
        // -----------------------------------
        
        // Cost 계산
        const affectedFilesSet = new Set<string>();
        const affectedClustersSet = new Set<string>();
        const targetEdges = edges.filter(e => targetEdgeIds.includes(e.id));
        
        console.time("TARGET_EDGE_SCAN_AND_NODE_LOOKUP");
        targetEdges.forEach(e => {
            if (e.from) affectedFilesSet.add(e.from);
            if (e.to) affectedFilesSet.add(e.to);
            
            const fromNode = nodeMap ? nodeMap.get(e.from) : nodes.find(n => n.id === e.from);
            const toNode = nodeMap ? nodeMap.get(e.to) : nodes.find(n => n.id === e.to);
            
            if (fromNode && fromNode.cluster_id) affectedClustersSet.add(fromNode.cluster_id);
            if (toNode && toNode.cluster_id) affectedClustersSet.add(toNode.cluster_id);
        });
        console.timeEnd("TARGET_EDGE_SCAN_AND_NODE_LOOKUP");
        
        const affectedFiles = affectedFilesSet.size;
        const affectedClusters = affectedClustersSet.size;
        
        let costLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
        if (affectedFiles <= 5 && affectedClusters <= 2) costLevel = 'LOW';
        else if (affectedFiles >= 20 || affectedClusters >= 5) costLevel = 'HIGH';

        const largestBeforeScc = beforeScc.length > 0 ? beforeScc.reduce((prev, current) => (prev.nodeIds.length > current.nodeIds.length) ? prev : current) : { nodeIds: [] as string[] };
        const largestBeforeSccSet = new Set(largestBeforeScc.nodeIds);
        const beforeSccSize = largestBeforeScc.nodeIds.length;
        
        let internalCuts = 0;
        let externalCuts = 0;
        
        console.time("SCC_MEMBERSHIP");
        targetEdges.forEach(e => {
            const isInside = largestBeforeSccSet.has(e.from) && largestBeforeSccSet.has(e.to);
            if (isInside) {
                internalCuts++;
            } else {
                externalCuts++;
            }
        });
        console.timeEnd("SCC_MEMBERSHIP");

        let afterSccSize = beforeSccSize;
        let afterScc = beforeScc;
        
        if (internalCuts > 0 || beforeSccSize === 0) {
            // 1. 엣지 절단 (Virtual Cut)
            const cutEdges = edges.filter(e => !targetEdgeIds.includes(e.id));
            
            // 2. SCC 계산 (Before & After)
            const executableCutEdges = GraphViewBuilder.build(cutEdges, GraphPolicy.FULL);
            const nodeIds = nodes.map(n => n.id);
            afterScc = TarjanSCC.extractFromSubset(nodeIds, executableCutEdges);
            afterSccSize = Math.max(0, ...afterScc.map(s => s.nodeIds.length));
        }
        
        console.log(`\n[SIM CUT ANALYSIS] Tier: ${targetTier} | ${targetReason}`);
        console.log(`- Edges to Cut: ${targetEdgeIds.length}`);
        
        targetEdges.forEach(e => {
            const isInside = largestBeforeSccSet.has(e.from) && largestBeforeSccSet.has(e.to);
            if (targetEdgeIds.length <= 5) {
                console.log(`  * Edge: ${e.from} -> ${e.to} | IsInsideLargestSCC: ${isInside}`);
            }
        });
        
        if (targetEdgeIds.length > 5) {
            console.log(`  * Internal Cuts (Inside Largest SCC): ${internalCuts}`);
            console.log(`  * External Cuts (Outside/Boundary): ${externalCuts}`);
        }
        
        console.log(`- Before SCC: ${beforeSccSize}`);
        console.log(`- After SCC: ${afterSccSize}`);
        
        // 2. Confidence (가중 평균 신뢰도) 및 Concentration Factor 계산
        let totalConfidenceWeight = 0;
        let totalWeight = 0;
        let minConfidence = 100;
        
        const fileEdgeCount = new Map<string, number>();
        let boundaryCrossCount = 0;

        targetEdges.forEach(e => {
            // Confidence
            let conf = 20; // Default Low
            let weight = 2; // Default weight
            switch (e.provenance) {
                case EdgeProvenance.FUNCTION_CALL:
                    conf = 95; weight = 4; break;
                case EdgeProvenance.INHERITANCE:
                    conf = 70; weight = 6; break;
                case EdgeProvenance.CONSTRUCTOR_CALL:
                    conf = 100; weight = 8; break;
                case EdgeProvenance.FRAMEWORK_REGISTRATION:
                case EdgeProvenance.DECORATOR:
                    conf = 75; weight = 3; break;
                case EdgeProvenance.UNKNOWN_RUNTIME:
                case EdgeProvenance.TYPE_ONLY:
                default:
                    conf = 20; weight = 2; break; // Regex Hypothesis
            }
            totalConfidenceWeight += (conf * weight);
            totalWeight += weight;
            if (conf < minConfidence) minConfidence = conf;
            
            // Concentration
            const file = e.from?.split('#')[0] || "unknown";
            fileEdgeCount.set(file, (fileEdgeCount.get(file) || 0) + 1);
            
            // Boundary (단순하게 파일이 다르면 횡단으로 간주. 정교화 필요)
            const fromFile = e.from?.split('#')[0] || "A";
            const toFile = e.to?.split('#')[0] || "B";
            if (fromFile !== toFile) boundaryCrossCount++;
        });
        
        const confidenceWeighted = totalWeight > 0 ? Math.round(totalConfidenceWeight / totalWeight) : 0;
        const effectiveConf = Math.min(confidenceWeighted, minConfidence + 30);
        
        const confidence = {
            weighted: confidenceWeighted,
            minimum: targetEdges.length > 0 ? minConfidence : 0,
            effective: targetEdges.length > 0 ? effectiveConf : 0
        };
        
        let maxEdgesInOneFile = 0;
        fileEdgeCount.forEach(count => {
            if (count > maxEdgesInOneFile) maxEdgesInOneFile = count;
        });
        const concentration = targetEdges.length > 0 ? (maxEdgesInOneFile / targetEdges.length) : 1.0;
        
        // 3. Structural Cost
        const COST_FILE = 1;
        const COST_CLUSTER = 2;
        const COST_BOUNDARY = 2;
        
        // Boundary > Cluster > File 순으로 무겁게 평가
        const totalStructuralCost = (affectedFiles * COST_FILE) + (affectedClusters * COST_CLUSTER) + (boundaryCrossCount * COST_BOUNDARY);
        const structuralCost = {
            affectedFiles,
            affectedClusters,
            boundaryCrosses: boundaryCrossCount,
            totalCost: totalStructuralCost
        };

        // 4. Composite AIG 계산
        let sccGain = 0;
        let absoluteSccReduction = 0;
        if (beforeSccSize > 0) {
            absoluteSccReduction = Math.max(0, beforeSccSize - afterSccSize);
            sccGain = (absoluteSccReduction / beforeSccSize) * 100;
        }

        // 5. Blast Radius & Coupling Gain (Placeholder)
        let blastRadiusGain = 0;
        let couplingGain = 0;
        const compositeAig = (0.5 * sccGain) + (0.3 * blastRadiusGain) + (0.2 * couplingGain);

        // 7. Adjusted ROI 계산 (Effective Confidence 사용)
        const adjustedRoi = totalStructuralCost > 0 ? Number((((compositeAig * (confidence.effective / 100)) / totalStructuralCost) * (0.5 + concentration)).toFixed(2)) : 0;

        // 8. Decision Logic
        let decision = "⚪ Analyze Further";
        if (adjustedRoi >= 10.0 && confidence.effective >= 70) decision = "🚀 Execute Intervention (High ROI / High Confidence)";
        else if (adjustedRoi >= 10.0 && confidence.effective < 70) decision = "⚠ Investigate Before Action (High ROI / Low Confidence)";
        else if (adjustedRoi < 5.0 && confidence.effective >= 70) decision = "🐢 Safe but Low Impact (Low ROI / High Confidence)";
        // [v0.3.34.9 FIX] SCC가 실제로 감소하는 후보는 Confidence가 낮아도 Discard 금지.
        // 탐색기가 정답을 찾았는데 평가기가 버리는 구조 방지.
        else if (absoluteSccReduction > 0) decision = "⚠ Investigate Before Action (SCC Reduction Confirmed / Verify Edge)";
        else decision = "❌ Discard (No SCC Impact / Low ROI / Low Confidence)";

        // 9. Tier 0 판별 (시뮬레이션 결과 기반 격상)
        let finalTier = targetTier;
        let largestSccShare = 0;
        if (beforeSccSize > 0) largestSccShare = absoluteSccReduction / beforeSccSize;
        
        if (sccGain >= 50 && absoluteSccReduction >= 10 && largestSccShare >= 0.5) {
            finalTier = "T0";
            decision = "🔥 Critical Intervention (Massive SCC Collapse)";
        }

        // 10. AST 34.8 연동 필드
        let astRecommended = false;
        let astReason = "";
        if (confidence.minimum <= 40 || confidence.effective < 70) {
            astRecommended = true;
            astReason = `Low Confidence (Min: ${confidence.minimum}%) - Requires AST Verification`;
        }

        return {
            targetEdges: targetEdgeIds,
            targetReason,
            targetTier: finalTier,
            candidateRank,
            rootCauseId,
            astRecommended,
            astReason,
            cost: {
                affectedFiles,
                affectedClusters,
                boundaryCrosses: boundaryCrossCount,
                level: costLevel
            },
            beforeSccSize,
            afterSccSize,
            absoluteSccReduction,
            aig: sccGain,
            beforeBlastRadius: 0, 
            afterBlastRadius: 0,  
            sourceCluster: "unknown",
            targetCluster: "unknown",
            beforeCouplingStrength: 0,
            afterCouplingStrength: 0,
            confidence,
            structuralCost,
            concentration,
            compositeAig,
            adjustedRoi,
            decision
        };
    }
}
