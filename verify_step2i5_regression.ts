import * as assert from 'assert';
import { EdgeBuilder } from './src/core/EdgeBuilder';

function createMockFixture() {
    const expandedReferences = [
        {
            sourceId: 'src/main.ts',
            targetId: 'com.google.auth',
            referenceType: 'dependency',
            isGhost: true
        },
        {
            sourceId: 'src/main.ts',
            targetId: 'README.md',
            referenceType: 'document',
            isGhost: true
        },
        {
            sourceId: 'src/main.ts',
            targetId: 'java.util.List',
            referenceType: 'dependency',
            isGhost: true
        },
        {
            sourceId: 'src/main.ts',
            targetId: 'local.resolved',
            referenceType: 'call',
            isGhost: false
        }
    ];

    return { expandedReferences };
}

function mapEdgeTypeLegacy(rawType: string): any {
    switch (rawType) {
        case 'dependency': return 'INCLUDE' as any;
        case 'api_call': return 'CALL' as any;
        case 'db_query': return 'DB_QUERY' as any;
        case 'data_flow': return 'DATA_FLOW' as any;
        case 'event': return 'EVENT' as any;
        case 'conditional': return 'CONDITIONAL' as any;
        case 'loop_back': return 'LOOP_BACK' as any;
        case 'static_unidirectional': return 'STATIC' as any;
        default: return 'REFERENCE' as any;
    }
}

function legacyEdgeBuilderLogic(expandedReferences: any[]) {
    const edges: any[] = [];
    const edgeTypeCount = new Map<string, number>();

    for (const ref of expandedReferences) {
        const targetNodeId = ref.targetId;
        const sourceFilePath = ref.sourceId;

        const mappedType = mapEdgeTypeLegacy(ref.referenceType);
        const newEdge: any = {
            id: 'MOCK_ID', // legacy used crypto.randomUUID()
            from: sourceFilePath,
            to: targetNodeId,
            type: mappedType,
            weight: 1,
            status: 'confirmed',
            is_approved: true,
            data: {},
            intelligence: {},
            visual: { color: '#888', thickness: 1 }
        };
        edges.push(newEdge);
        edgeTypeCount.set(mappedType, (edgeTypeCount.get(mappedType) || 0) + 1);
    }

    return { edges, edgeTypeCount };
}

function verifyStep2i5() {
    const { expandedReferences } = createMockFixture();

    const legacy = legacyEdgeBuilderLogic(expandedReferences);
    const newBuilder = EdgeBuilder.build(expandedReferences);

    console.log("=== Step 2i-5 Regression Verification ===");
    
    assert.strictEqual(legacy.edges.length, newBuilder.edges.length, "Edges length mismatch");
    assert.strictEqual(legacy.edgeTypeCount.size, newBuilder.edgeTypeCount.size, "EdgeTypeCount size mismatch");

    for (let i = 0; i < legacy.edges.length; i++) {
        assert.strictEqual(legacy.edges[i].from, newBuilder.edges[i].from, `Edge from mismatch at ${i}`);
        assert.strictEqual(legacy.edges[i].to, newBuilder.edges[i].to, `Edge to mismatch at ${i}`);
        assert.strictEqual(legacy.edges[i].type, newBuilder.edges[i].type, `Edge type mismatch at ${i}`);
        // We skip ID comparison because it uses randomUUID
    }

    for (const [key, val] of legacy.edgeTypeCount.entries()) {
        assert.strictEqual(newBuilder.edgeTypeCount.get(key), val, `EdgeTypeCount mismatch for ${key}`);
    }

    console.log(`edges: ${newBuilder.edges.length} passed (Match)`);
    console.log(`edgeTypeCount map: size ${newBuilder.edgeTypeCount.size} passed (Match)`);
    console.log("Verification PASSED!");
}

verifyStep2i5();
