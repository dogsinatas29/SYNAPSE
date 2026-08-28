import * as crypto from 'crypto';
import { Edge, EdgeType } from './GraphModel';
import { ExpandedReference } from './GhostExpander';

export interface EdgeBuilderResult {
    edges: Edge[];
    edgeTypeCount: Map<string, number>;
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

        for (const ref of expandedReferences) {
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
                    resolvedTarget: ref.targetId
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

        let edges = Array.from(edgeMap.values());

        console.log(
            '[EDGE_DEDUP]',
            'raw=', expandedReferences.length,
            'unique=', edges.length
        );

        // [v0.3.34.40] Ponytail Solution: Cap edges to prevent JSON/WebGL OOM
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
        return { edges, edgeTypeCount };
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
