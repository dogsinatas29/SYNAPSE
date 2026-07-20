import * as assert from 'assert';
import { detectCommunities } from './src/core/CommunityDetector';
import { Node, Edge, NodeType, EdgeType } from './src/core/GraphModel';

// Mock Random for Determinism
let seed = 1;
function seededRandom() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
const originalRandom = Math.random;

function createMockFixture() {
    const nodes: Node[] = [
        { id: 'n1', cluster_id: 'c1', type: NodeType.FILE, data: {} },
        { id: 'n2', cluster_id: 'c1', type: NodeType.FILE, data: {} },
        { id: 'n3', cluster_id: 'c1', type: NodeType.FILE, data: {} },
        { id: 'n4', cluster_id: 'c2', type: NodeType.FILE, data: {} },
        { id: 'n5', cluster_id: 'c2', type: NodeType.FILE, data: {} },
        { id: 'n6', cluster_id: 'c2', type: NodeType.SYMBOL, data: {} },
        { id: 'n7', cluster_id: 'c3', type: NodeType.FILE, data: {} }, // Single node community, should be skipped
    ];
    
    const edges: Edge[] = [
        { id: 'e1', from: 'n1', to: 'n2', type: EdgeType.DEPENDENCY },
        { id: 'e2', from: 'n2', to: 'n3', type: EdgeType.DEPENDENCY },
        { id: 'e3', from: 'n1', to: 'n3', type: EdgeType.DEPENDENCY },
        
        { id: 'e4', from: 'n4', to: 'n5', type: EdgeType.DEPENDENCY },
        { id: 'e5', from: 'n5', to: 'n6', type: EdgeType.DEPENDENCY },
        
        // Weak link between communities
        { id: 'e6', from: 'n3', to: 'n4', type: EdgeType.DEPENDENCY },
    ];

    return { nodes, edges };
}

// Deep clone to ensure mutations don't leak
function cloneNodes(nodes: Node[]): Node[] {
    return nodes.map(n => ({ ...n, data: { ...n.data } }));
}

function legacyCommunityDetection(nodes: Node[], edges: Edge[]): { nodes: Node[], communityCount: number, nodeCommunityMap: Map<string, string> } {
    const lpaLabels = new Map<string, string>();
    const neighbors = new Map<string, string[]>();
    
    // Initialize labels & neighbors
    const validNodes = nodes.filter(n => n.type === NodeType.FILE || n.type === NodeType.SYMBOL);
    for (const n of validNodes) {
        lpaLabels.set(n.id, n.id);
        neighbors.set(n.id, []);
    }
    
    // Build undirected adjacency list for LPA
    for (const e of edges) {
        if (neighbors.has(e.from) && neighbors.has(e.to)) {
            neighbors.get(e.from)!.push(e.to);
            neighbors.get(e.to)!.push(e.from);
        }
    }
    
    // Run LPA for up to 5 iterations
    for (let iter = 0; iter < 5; iter++) {
        let changed = false;
        // Randomize node order
        const nodeIds = Array.from(lpaLabels.keys()).sort(() => Math.random() - 0.5);
        
        for (const id of nodeIds) {
            const currentLabel = lpaLabels.get(id)!;
            const neighborLabels = neighbors.get(id)!.map(nId => lpaLabels.get(nId)!);
            if (neighborLabels.length === 0) continue;
            
            // Find most frequent neighbor label
            const counts = new Map<string, number>();
            let maxCount = 0;
            let bestLabel = currentLabel;
            
            for (const nl of neighborLabels) {
                const count = (counts.get(nl) || 0) + 1;
                counts.set(nl, count);
                if (count > maxCount) {
                    maxCount = count;
                    bestLabel = nl;
                } else if (count === maxCount && Math.random() < 0.5) {
                    bestLabel = nl; // Break ties randomly
                }
            }
            
            if (bestLabel !== currentLabel) {
                lpaLabels.set(id, bestLabel);
                changed = true;
            }
        }
        if (!changed) break;
    }
    
    // Rebuild Clusters based on LPA (Downgraded)
    const communityMap = new Map<string, string[]>();
    for (const [nId, cLabel] of lpaLabels.entries()) {
        if (!communityMap.has(cLabel)) communityMap.set(cLabel, []);
        communityMap.get(cLabel)!.push(nId);
    }
    
    let commIdx = 1;
    const nodeCommunityMap = new Map<string, string>();
    for (const [cLabel, memberIds] of communityMap.entries()) {
        if (memberIds.length < 2) continue; // Skip single-node communities
        const commClusterId = `community_${commIdx++}`;
        
        // Update nodes: ONLY add as community_label
        for (const mId of memberIds) {
            const n = nodes.find(n => n.id === mId);
            if (n && n.data) {
                n.data.community_label = commClusterId;
            }
            nodeCommunityMap.set(mId, commClusterId);
        }
    }
    
    return { nodes, communityCount: commIdx - 1, nodeCommunityMap };
}

function verifyStep2h() {
    const { nodes: originalNodes, edges } = createMockFixture();

    // 1. Run Legacy
    const legacyNodes = cloneNodes(originalNodes);
    seed = 42; // Reset seed
    Math.random = seededRandom;
    const legacyResult = legacyCommunityDetection(legacyNodes, edges);

    // 2. Run New
    const newNodes = cloneNodes(originalNodes);
    seed = 42; // Reset seed
    Math.random = seededRandom;
    const newResult = detectCommunities(newNodes, edges);

    // DataPipeline mock injection (to mirror new behavior)
    for (const node of newNodes) {
        const label = newResult.nodeCommunityMap.get(node.id);
        if (label) {
            if (!node.data) node.data = {};
            node.data.community_label = label;
        }
    }

    // Restore random
    Math.random = originalRandom;

    // 3. Compare Results
    console.log("=== Step 2h Regression Verification ===");
    
    assert.strictEqual(legacyResult.communityCount, newResult.communityCount, "Community Count mismatch");
    console.log(`communityCount: ${newResult.communityCount} (Match)`);

    // Compare maps
    assert.strictEqual(legacyResult.nodeCommunityMap.size, newResult.nodeCommunityMap.size, "Map size mismatch");
    for (const [id, label] of legacyResult.nodeCommunityMap.entries()) {
        assert.strictEqual(newResult.nodeCommunityMap.get(id), label, `Map mismatch for node ${id}`);
    }
    console.log(`nodeCommunityMap: ${newResult.nodeCommunityMap.size} nodes mapped (Match)`);

    // Compare node mutations
    for (let i = 0; i < legacyNodes.length; i++) {
        const ln = legacyNodes[i];
        const nn = newNodes[i];
        assert.strictEqual(ln.data?.community_label, nn.data?.community_label, `Node mutation mismatch for ${ln.id}`);
    }
    console.log(`node.data.community_label injection: (Match)`);
    
    console.log("Verification PASSED!");
}

verifyStep2h();
