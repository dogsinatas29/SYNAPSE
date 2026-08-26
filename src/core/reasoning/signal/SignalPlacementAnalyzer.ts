import { SignalFinding } from './SignalFinding';
import { GraphSnapshot } from '../../../types/schema';

export interface SignalPlacementReport {
    signalId: string;
    nodeCount: number;
    avgNodeDegree: number;
    degreeBias: number;
    degreeHistogram: Record<string, number>;
    coOccurrence: Record<string, number>;
}

export interface SignalPlacementResult {
    globalBaseline: {
        totalNodes: number;
        avgDegree: number;
        degreeHistogram: Record<string, number>;
    };
    reports: SignalPlacementReport[];
}

export class SignalPlacementAnalyzer {
    public analyze(findings: SignalFinding[], snapshot: GraphSnapshot): SignalPlacementResult {
        // Calculate degree (fanIn + fanOut) for each node in the snapshot
        const nodeDegrees: Record<string, number> = {};
        
        for (const node of snapshot.nodes) {
            nodeDegrees[node.id] = 0;
        }

        for (const edge of snapshot.edges) {
            const fromId = (edge as any).from || (edge as any).source;
            const toId = (edge as any).to || (edge as any).target;

            if (fromId && nodeDegrees[fromId] !== undefined) {
                nodeDegrees[fromId]++;
            }
            if (toId && nodeDegrees[toId] !== undefined) {
                nodeDegrees[toId]++;
            }
        }

        // Calculate global baseline
        let globalTotalDegree = 0;
        const globalHistogram: Record<string, number> = {
            "0~5": 0,
            "6~20": 0,
            "21~100": 0,
            "100+": 0
        };

        for (const degree of Object.values(nodeDegrees)) {
            globalTotalDegree += degree;
            if (degree <= 5) globalHistogram["0~5"]++;
            else if (degree <= 20) globalHistogram["6~20"]++;
            else if (degree <= 100) globalHistogram["21~100"]++;
            else globalHistogram["100+"]++;
        }

        const globalAvgDegree = snapshot.nodes.length > 0 
            ? Math.round((globalTotalDegree / snapshot.nodes.length) * 100) / 100 
            : 0;

        const globalBaseline = {
            totalNodes: snapshot.nodes.length,
            avgDegree: globalAvgDegree,
            degreeHistogram: globalHistogram
        };

        // Group findings by signalId
        const findingsBySignal: Record<string, SignalFinding[]> = {};
        // Group findings by nodeId to compute co-occurrences
        const findingsByNode: Record<string, string[]> = {};

        for (const finding of findings) {
            if (!findingsBySignal[finding.signalId]) {
                findingsBySignal[finding.signalId] = [];
            }
            findingsBySignal[finding.signalId].push(finding);

            if (!findingsByNode[finding.nodeId]) {
                findingsByNode[finding.nodeId] = [];
            }
            // Avoid duplicate signal entries for the same node just in case
            if (!findingsByNode[finding.nodeId].includes(finding.signalId)) {
                findingsByNode[finding.nodeId].push(finding.signalId);
            }
        }

        const reports: SignalPlacementReport[] = [];

        for (const [signalId, signalFindings] of Object.entries(findingsBySignal)) {
            let totalDegree = 0;
            const degreeHistogram: Record<string, number> = {
                "0~5": 0,
                "6~20": 0,
                "21~100": 0,
                "100+": 0
            };
            const coOccurrence: Record<string, number> = {};

            const uniqueNodes = new Set(signalFindings.map(f => f.nodeId));
            const nodeCount = uniqueNodes.size;

            for (const nodeId of uniqueNodes) {
                const degree = nodeDegrees[nodeId] || 0;
                totalDegree += degree;

                if (degree <= 5) degreeHistogram["0~5"]++;
                else if (degree <= 20) degreeHistogram["6~20"]++;
                else if (degree <= 100) degreeHistogram["21~100"]++;
                else degreeHistogram["100+"]++;

                // Co-occurrence
                const coSignals = findingsByNode[nodeId] || [];
                for (const coSignal of coSignals) {
                    if (coSignal !== signalId) {
                        coOccurrence[coSignal] = (coOccurrence[coSignal] || 0) + 1;
                    }
                }
            }

            const avgNodeDegree = nodeCount > 0 ? Math.round((totalDegree / nodeCount) * 100) / 100 : 0;
            const degreeBias = globalAvgDegree > 0 ? Math.round((avgNodeDegree / globalAvgDegree) * 100) / 100 : 0;

            // Add Interpretation Forbidden warning as the first element visually (using a special key)
            const orderedCoOccurrence: Record<string, any> = {
                "_WARNING_INTERPRETATION_FORBIDDEN": "Do NOT interpret meaning from coOccurrence. Might be caused by God Classes."
            };
            Object.assign(orderedCoOccurrence, coOccurrence);
            delete orderedCoOccurrence["_WARNING"];

            reports.push({
                signalId,
                nodeCount,
                avgNodeDegree,
                degreeBias,
                degreeHistogram,
                coOccurrence: orderedCoOccurrence as any
            });
        }

        return {
            globalBaseline,
            reports
        };
    }
}
