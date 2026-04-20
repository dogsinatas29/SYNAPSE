/**
 * SYNAPSE Engine Core (v0.2.28)
 * @file engine-core.js
 * @description Pure, deterministic rendering pipeline core.
 * Goal: Same input -> identical 2D / 3D output.
 */

/**
 * Builds a deterministic frame state from raw data.
 * @param {Array} nodes - Raw nodes array
 * @param {Array} edges - Raw edges array
 * @param {Array} clusters - Raw clusters array
 * @param {Object} context - Rendering context (zoom, offset, showBaseLayer, showUserLayer, selectedNodeIds, selectedEdgeId)
 * @returns {Object} Deeply cloned, frozen frame state
 */
function buildFrameState(nodes, edges, clusters, context) {
    if (!nodes) return { nodes: [], edges: [], context };

    const selectedNodeIds = context.selectedNodeIds || new Set();
    const selectedEdgeId = context.selectedEdgeId || null;

    // 1. Visibility Filtering (Sync with 2D/3D requirements)
    const filteredNodes = nodes.filter(n => {
        // [v0.3.10] Explicitly hidden from canvas (e.g., Documentation Shelf)
        if (n.data?.hiddenOnCanvas) return false;

        // [v0.2.27] Cluster Collapse Check
        const clusterId = n.cluster_id || n.data?.cluster_id;
        if (clusterId) {
            const cluster = clusters?.find(c => c.id === clusterId);
            if (cluster && cluster.collapsed) return false;
        }

        // Layer Visibility Check
        const isUser = (n.category === 'user') || 
                       (n.id && typeof n.id === 'string' && n.id.startsWith('node_manual_')) ||
                       (clusterId && typeof clusterId === 'string' && clusterId.startsWith('sys_'));
        
        if (!isUser && !context.showBaseLayer) return false;
        if (isUser && !context.showUserLayer) return false;

        return true;
    });

    // 2. ISO/DEEP CLONE (Physical Reference Detachment)
    const isolatedNodes = filteredNodes.map(n => ({
        id: n.id,
        category: n.category || 'base',
        status: n.status,
        type: n.type,
        data: n.data ? { ...n.data } : {},
        position: { x: n.position?.x || 0, y: n.position?.y || 0 },
        visual: { opacity: n.visual?.opacity || 1.0 },
        cluster_id: n.cluster_id || n.data?.cluster_id,
        isSelected: selectedNodeIds.has(n.id)
    }));

    // 3. Normalization (Deterministic Sorting)
    isolatedNodes.sort((a, b) => a.id.localeCompare(b.id));

    // 4. Pure Computation (Layout)
    const computedNodes = pureResolveOverlaps(isolatedNodes);

    // 5. Visible Edge Extraction
    const visibleIds = new Set(computedNodes.map(n => n.id));
    const frozenEdges = edges
        .filter(e => visibleIds.has(e.from) && visibleIds.has(e.to))
        .map(e => ({ 
            id: e.id, 
            from: e.from, 
            to: e.to, 
            type: e.type, 
            status: e.status,
            isSelected: (e.id === selectedEdgeId)
        }))
        .sort((a, b) => a.id.localeCompare(b.id));

    // 6. Final Freeze
    const frameState = {
        nodes: Object.freeze(computedNodes),
        edges: Object.freeze(frozenEdges),
        context: Object.freeze({ ...context }),
        timestamp: Date.now(),
        version: '0.2.28-bootstrap'
    };

    return Object.freeze(frameState);
}

/**
 * [v0.2.26.5] Pure Overlap Resolution with Spatial Hashing (Grid Optimization)
 */
function pureResolveOverlaps(nodes) {
    if (!nodes || nodes.length < 2) return nodes;

    const ITERATIONS = 3; 
    const GRID_SIZE = 150; 
    const MIN_DIST = 140; 
    const MIN_DIST_SQ = MIN_DIST * MIN_DIST;
    const round = v => Math.round(v * 1000) / 1000;

    let currentNodes = nodes;

    for (let step = 0; step < ITERATIONS; step++) {
        const grid = new Map();
        currentNodes.forEach(n => {
            const gx = Math.floor(n.position.x / GRID_SIZE);
            const gy = Math.floor(n.position.y / GRID_SIZE);
            const key = `${gx},${gy}`;
            if (!grid.has(key)) grid.set(key, []);
            grid.get(key).push(n);
        });

        currentNodes = currentNodes.map(target => {
            const p1 = target.position;
            let dx = 0, dy = 0;

            const gx = Math.floor(p1.x / GRID_SIZE);
            const gy = Math.floor(p1.y / GRID_SIZE);

            for (let ix = gx - 1; ix <= gx + 1; ix++) {
                for (let iy = gy - 1; iy <= gy + 1; iy++) {
                    const cellNodes = grid.get(`${ix},${iy}`);
                    if (!cellNodes) continue;

                    for (const other of cellNodes) {
                        if (target.id === other.id) continue;
                        const p2 = other.position;
                        const diffX = p1.x - p2.x;
                        const diffY = p1.y - p2.y;
                        const dSq = diffX * diffX + diffY * diffY;

                        if (dSq < MIN_DIST_SQ && dSq > 0.01) {
                            const dist = Math.sqrt(dSq);
                            const force = (MIN_DIST - dist) / dist;
                            dx += diffX * force * 0.5;
                            dy += diffY * force * 0.5;
                        }
                    }
                }
            }

            return {
                ...target,
                position: {
                    x: round(p1.x + dx),
                    y: round(p1.y + dy)
                }
            };
        });
    }
    return currentNodes;
}

/**
 * Utility for frame validation.
 */
function calculateFrameHash(frameState) {
    if (!frameState || !frameState.nodes) return '0';
    const data = frameState.nodes.map(n => `${n.id}:${n.position?.x.toFixed(2)},${n.position?.y.toFixed(2)}`).join('|');
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(16);
}

/**
 * Step 3: Inject Test Data (Deterministic)
 */
function getBootstrapTestData() {
    return {
        nodes: [
            { id: 'node_1', position: { x: 100, y: 100 }, data: { label: 'Core A', type: 'source' } },
            { id: 'node_2', position: { x: 300, y: 150 }, data: { label: 'Logic B', type: 'logic' } },
            { id: 'node_3', position: { x: 200, y: 300 }, data: { label: 'Data C', type: 'data' } }
        ],
        edges: [
            { id: 'edge_1_2', from: 'node_1', to: 'node_2' },
            { id: 'edge_2_3', from: 'node_2', to: 'node_3' }
        ]
    };
}
