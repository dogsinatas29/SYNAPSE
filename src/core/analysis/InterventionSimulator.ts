import { Node, Edge, Cluster, EdgeProvenance } from '../../types/schema';
import { TarjanSCC } from './reasoning/TarjanSCC';
import { ClusterBridgeAnalyzer } from './ClusterBridgeAnalyzer';

export interface InterventionResult {
    targetEdges: string[];     // IDs of edges to cut
    
    // Cost Metrics (Cut Cost Score)
    cost: {
        affectedFiles: number;
        affectedClusters: number;
        level: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    
    // SCC Metrics
    beforeSccSize: number;
    afterSccSize: number;
    aig: number;               // Architectural Independence Gain (%)
    
    // Blast Radius Metrics
    beforeBlastRadius: number;
    afterBlastRadius: number;
    
    // Coupling Metrics
    sourceCluster: string;
    targetCluster: string;
    beforeCouplingStrength: number;
    afterCouplingStrength: number;
    
    confidence: number;        // weighted average %
    structuralCost: number;    // files + boundary crossing
    concentration: number;     // 0.0 ~ 1.0
    compositeAig: number;      // 0.5 SCC + 0.3 Blast + 0.2 Coupling
    adjustedRoi: number;       // (AIG * Conf * Conc) / Cost
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
        targetEdgeIds: string[]
    ): InterventionResult {
        // Cost 계산
        const affectedFilesSet = new Set<string>();
        const affectedClustersSet = new Set<string>();
        const targetEdges = edges.filter(e => targetEdgeIds.includes(e.id));
        
        targetEdges.forEach(e => {
            if (e.from) affectedFilesSet.add(e.from);
            if (e.to) affectedFilesSet.add(e.to);
            
            const fromNode = nodes.find(n => n.id === e.from);
            const toNode = nodes.find(n => n.id === e.to);
            if (fromNode && fromNode.cluster_id) affectedClustersSet.add(fromNode.cluster_id);
            if (toNode && toNode.cluster_id) affectedClustersSet.add(toNode.cluster_id);
        });
        
        const affectedFiles = affectedFilesSet.size;
        const affectedClusters = affectedClustersSet.size;
        
        let costLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
        if (affectedFiles <= 5 && affectedClusters <= 2) costLevel = 'LOW';
        else if (affectedFiles >= 20 || affectedClusters >= 5) costLevel = 'HIGH';

        // 1. 엣지 절단 (Virtual Cut)
        const cutEdges = edges.filter(e => !targetEdgeIds.includes(e.id));
        
        // 2. SCC 계산 (Before & After)
        const nodeIds = nodes.map(n => n.id);
        const beforeScc = TarjanSCC.extractFromSubset(nodeIds, edges);
        const afterScc = TarjanSCC.extractFromSubset(nodeIds, cutEdges);
        
        const beforeSccSize = Math.max(0, ...beforeScc.map(s => s.nodeIds.length));
        const afterSccSize = Math.max(0, ...afterScc.map(s => s.nodeIds.length));
        
        // 2. Confidence (가중 평균 신뢰도) 및 Concentration Factor 계산
        let totalConfidenceWeight = 0;
        let totalWeight = 0;
        
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
            
            // Concentration
            const file = e.from?.split('#')[0] || "unknown";
            fileEdgeCount.set(file, (fileEdgeCount.get(file) || 0) + 1);
            
            // Boundary (단순하게 파일이 다르면 횡단으로 간주. 정교화 필요)
            const fromFile = e.from?.split('#')[0] || "A";
            const toFile = e.to?.split('#')[0] || "B";
            if (fromFile !== toFile) boundaryCrossCount++;
        });
        
        const confidence = totalWeight > 0 ? Math.round(totalConfidenceWeight / totalWeight) : 0;
        
        let maxEdgesInOneFile = 0;
        fileEdgeCount.forEach(count => {
            if (count > maxEdgesInOneFile) maxEdgesInOneFile = count;
        });
        const concentration = targetEdges.length > 0 ? (maxEdgesInOneFile / targetEdges.length) : 1.0;
        
        // 3. Structural Cost
        const structuralCost = affectedFiles + boundaryCrossCount;

        // 4. Composite AIG 계산
        let sccGain = 0;
        if (beforeSccSize > 0) {
            sccGain = ((beforeSccSize - afterSccSize) / beforeSccSize) * 100;
        }
        
        // TODO: 5. Blast Radius (Hub Stability) 변화 계산
        let blastRadiusGain = 0;
        
        // TODO: 6. Coupling Drop 계산
        let couplingGain = 0;
        
        const compositeAig = (0.5 * sccGain) + (0.3 * blastRadiusGain) + (0.2 * couplingGain);
        
        // 7. Adjusted ROI Score: (AIG * (Confidence/100) * Concentration) / Cost
        const effectiveCost = Math.max(1, structuralCost);
        const adjustedRoi = parseFloat(((compositeAig * (confidence / 100) * concentration) / effectiveCost).toFixed(2));

        // 8. Decision Logic
        let decision = "⚪ Analyze Further";
        if (adjustedRoi >= 10.0 && confidence >= 70) decision = "🚀 Execute Intervention (High ROI / High Confidence)";
        else if (adjustedRoi >= 10.0 && confidence < 70) decision = "⚠ Investigate Before Action (High ROI / Low Confidence)";
        else if (adjustedRoi < 5.0 && confidence >= 70) decision = "🐢 Safe but Low Impact (Low ROI / High Confidence)";
        else decision = "❌ Discard (Low ROI / Low Confidence)";

        return {
            targetEdges: targetEdgeIds,
            cost: {
                affectedFiles,
                affectedClusters,
                level: costLevel
            },
            beforeSccSize,
            afterSccSize,
            aig,
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
