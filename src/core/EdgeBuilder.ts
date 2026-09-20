import * as crypto from 'crypto';
import { Edge, EdgeType } from './GraphModel';
import { EdgeProvenance } from '../types/schema';
import { ExpandedReference } from './GhostExpander';

export interface EdgeBuilderResult {
    edges: Edge[];
    edgeTypeCount: Map<string, number>;
    stats: {
        totalEdgesGenerated: number;
        totalEdgesStored: number;
        droppedEdges: number;
        edgeCapTriggered: boolean;
    };
}

export class EdgeBuilder {
    public static build(expandedReferences: ExpandedReference[]): EdgeBuilderResult {
        console.log('[EDGE_BUILDER_ENTER]');
        console.error(
            '[EDGE_BUILDER_INPUT]',
            expandedReferences.reduce((acc: any, r) => {
                acc[r.referenceType] = (acc[r.referenceType] || 0) + 1;
                return acc;
            }, {})
        );
        const edgeMap = new Map<string, Edge>();
        const edgeTypeCount = new Map<string, number>();

        console.error("[EDGE_STAGE] START");
        let processedEdges = 0;
        for (const ref of expandedReferences) {
            processedEdges++;
            if (processedEdges % 1000000 === 0) {
                console.error("[EDGE_STAGE]", processedEdges);
            }
            const mappedType = EdgeBuilder.mapEdgeType(ref.referenceType);
            const edgeKey = `${ref.sourceId}::${ref.targetId}::${mappedType}`;

            if (edgeMap.has(edgeKey)) {
                edgeMap.get(edgeKey)!.weight += 1;
                continue;
            }
            
            const newEdge: Edge = {
                id: crypto.randomUUID(),
                from: ref.sourceId,
                to: ref.targetId,
                type: mappedType,
                weight: 1,
                status: 'confirmed',
                is_approved: true,
                data: {
                    originalTarget: ref.originalTarget,
                    resolvedTarget: ref.targetId,
                    resolutionKind: ref.resolutionKind,
                    candidateCount: ref.candidateCount
                },
                intelligence: {},
                visual: { color: '#888', thickness: 1 },
                provenance: ref.provenance ?? 'UNKNOWN_RUNTIME'
            };

            if (!mappedType || mappedType === 'UNKNOWN') {
                console.error('[UNKNOWN_EDGE]', { from: ref.sourceId, to: ref.targetId, rawType: ref.referenceType });
            }
            
            edgeTypeCount.set(
               mappedType,
               (edgeTypeCount.get(mappedType) || 0) + 1
            );
            edgeMap.set(edgeKey, newEdge);
        }
        
        console.error("[EDGE_STAGE] COMPLETE", edgeMap.size);

        let edges = Array.from(edgeMap.values());

        console.log(
            '[EDGE_DEDUP]',
            'raw=', expandedReferences.length,
            'unique=', edges.length
        );

        // [P-2 Observation Integrity] Audit Edge Distribution Before Cap
        const preCapCounts = new Map<string, number>();
        const preCapProvenance = new Map<string, number>();
        const verifiedCallsFreq = new Map<string, number>();
        const macroCallsFreq = new Map<string, number>();
        const dslCallsFreq = new Map<string, number>();

        for (const e of edges) {
            preCapCounts.set(e.type, (preCapCounts.get(e.type) || 0) + 1);
            const prov = e.provenance || 'UNKNOWN_RUNTIME';
            preCapProvenance.set(prov as string, (preCapProvenance.get(prov as string) || 0) + 1);

            if (e.data?.originalTarget) {
                if (prov === 'VERIFIED_FUNCTION_CALL') {
                    verifiedCallsFreq.set(e.data.originalTarget, (verifiedCallsFreq.get(e.data.originalTarget) || 0) + e.weight);
                } else if (prov === 'MACRO_CALL') {
                    macroCallsFreq.set(e.data.originalTarget, (macroCallsFreq.get(e.data.originalTarget) || 0) + e.weight);
                } else if (prov === 'DSL_CALL') {
                    dslCallsFreq.set(e.data.originalTarget, (dslCallsFreq.get(e.data.originalTarget) || 0) + e.weight);
                }
            }
        }
        
        console.log('[EDGE_AUDIT_BEFORE_CAP]', Object.fromEntries(preCapCounts));
        console.log('[EDGE_AUDIT_AFTER_CLASSIFICATION]', Object.fromEntries(preCapProvenance));

        // [P-4.0] Ponytail Data Shape Measurement
        const sortedVerified = Array.from(verifiedCallsFreq.entries()).sort((a, b) => b[1] - a[1]);
        const uniqueTargets = sortedVerified.length;
        
        let totalVerifiedCalls = 0;
        for (const [_, freq] of sortedVerified) totalVerifiedCalls += freq;
        
        const getSum = (n: number) => sortedVerified.slice(0, n).reduce((sum, [_, freq]) => sum + freq, 0);
        
        const top10Sum = getSum(10);
        const top50Sum = getSum(50);
        const top100Sum = getSum(100);
        const top500Sum = getSum(500);
        const top1000Sum = getSum(1000);
        
        const formatPct = (sum: number) => totalVerifiedCalls > 0 ? ((sum / totalVerifiedCalls) * 100).toFixed(2) : '0.00';

        const uniqueVerifiedEdges = edges.filter(e => e.provenance === 'VERIFIED_FUNCTION_CALL' || e.provenance === EdgeProvenance.FUNCTION_CALL).length;
        
        const logMessage = `
================== [P-4.0 DATA SHAPE MEASUREMENT] ==================
Total VERIFIED_FUNCTION_CALL raw events (Sum of Weights): ${totalVerifiedCalls}
Unique VERIFIED_FUNCTION_CALL edges (Caller -> Callee): ${uniqueVerifiedEdges}
Unique Target Count (Callees): ${uniqueTargets}
Top 10 Coverage (Events): ${formatPct(top10Sum)}% (${top10Sum})
Top 50 Coverage (Events): ${formatPct(top50Sum)}% (${top50Sum})
Top 100 Coverage (Events): ${formatPct(top100Sum)}% (${top100Sum})
Top 500 Coverage (Events): ${formatPct(top500Sum)}% (${top500Sum})
Top 1000 Coverage (Events): ${formatPct(top1000Sum)}% (${top1000Sum})
Remaining event calls after removing Top 1000: ${totalVerifiedCalls - top1000Sum}
====================================================================
`;
        console.log(logMessage);
        
        // [v0.3.34.40] Ponytail Solution: Cap edges to prevent JSON/WebGL OOM
        const stats = {
            totalEdgesGenerated: edges.length,
            totalEdgesStored: edges.length,
            droppedEdges: 0,
            edgeCapTriggered: false
        };

        // Architecture primarily needs INCLUDE, and the most frequent CALLs.
        if (edges.length > 150000) {
            edges.sort((a, b) => {
                if (a.type === 'INCLUDE' && b.type !== 'INCLUDE') return -1;
                if (b.type === 'INCLUDE' && a.type !== 'INCLUDE') return 1;
                return b.weight - a.weight;
            });
            console.warn(`[EDGE_LIMIT] Capping edges from ${edges.length} to 150000 to prevent OOM`);
            edges = edges.slice(0, 150000);
        }

        console.error(
            '[EDGE_BUILDER_OUTPUT]',
            Object.fromEntries(edgeTypeCount)
        );
        return { edges, edgeTypeCount, stats };
    }

    private static mapEdgeType(rawType: string): any {
        switch (rawType) {
            case 'dependency': return 'INCLUDE' as any;
            case 'api_call': return 'CALL' as any;
            case 'db_query': return 'DB_QUERY' as any;
            case 'data_flow': return 'DATA_FLOW' as any;
            case 'event': return 'EVENT' as any;
            case 'conditional': return 'CONDITIONAL' as any;
            case 'loop_back': return 'LOOP_BACK' as any;
            case 'static_unidirectional': return 'STATIC' as any;
            case 'IMPLEMENTS': return 'IMPLEMENTS' as any;
            case 'EXTENDS': return 'EXTENDS' as any;
            default: return 'REFERENCE' as any;
        }
    }
}
