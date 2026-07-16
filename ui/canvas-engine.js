/**
 * SYNAPSE Canvas Engine
 * HTML5 Canvas 기반 노드 시각화 엔진
 * 
 * [License Notice]
 * This software incorporates fzf-inspired fuzzy matching logic, which is licensed under the MIT License.
 * fzf (C) 2013-2023 Junegunn Choi
 */
console.log("SYNAPSE_BUILD_20260716_A");

/**
 * PromotionParticle - 설계 승격 효과를 위한 파티클 클래스
 */
class PromotionParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        // Parse "rgb(r, g, b)" for faster rendering
        const match = color.match(/\d+/g);
        this.rgb = match ? match.map(Number) : [184, 187, 38];
        this.size = 2 + Math.random() * 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        return this.life > 0;
    }

    render(ctx, transform) {
        const screenX = this.x * transform.zoom + transform.offsetX;
        const screenY = this.y * transform.zoom + transform.offsetY;

        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * transform.zoom, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb[0]}, ${this.rgb[1]}, ${this.rgb[2]}, ${this.life})`;
        ctx.fill();
    }
}

/**
 * SpatialGrid - O(1) Viewport Culling & HitTest 
 */
class SpatialGrid {
    constructor() {
        console.log('[RBUSH_DEBUG] window.RBush type:', typeof window.RBush);
        this.fallbackMode = typeof window.RBush === 'undefined';
        const ResolvedRBush = typeof window.RBush !== 'undefined' ? window.RBush : (typeof global !== 'undefined' && global.RBush ? global.RBush : null);
        console.log('[RBUSH_DEBUG] ResolvedRBush:', !!ResolvedRBush);
        
        if (!ResolvedRBush) {
            console.error('[SYNAPSE] RBush not found. Falling back to linear spatial queries. This will cause severe performance degradation.');
            this.fallbackMode = true;
        }

        this.nodeTree = ResolvedRBush ? new ResolvedRBush(16) : null;
        this.clusterTree = ResolvedRBush ? new ResolvedRBush(16) : null;
        this.edgeTree = ResolvedRBush ? new ResolvedRBush(16) : null;
        this.fallbackMode = !this.nodeTree;
        if (this.fallbackMode) console.warn('[SYNAPSE] rbush not loaded, SpatialGrid disabled');
    }

    clear() {
        if (this.fallbackMode) return;
        this.nodeTree.clear();
        this.clusterTree.clear();
        if (this.edgeTree) this.edgeTree.clear();
    }

    insertNode(node) {
        if (this.fallbackMode || !node.position) return;
        let px = Number(node.position.x);
        let py = Number(node.position.y);
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;

        this.nodeTree.insert({
            minX: px - 20,
            minY: py - 20,
            maxX: px + 200,
            maxY: py + 100,
            item: node
        });
    }

    insertCluster(cluster) {
        if (this.fallbackMode || !cluster.bounds) return;
        this.clusterTree.insert({
            minX: Number(cluster.bounds.minX),
            minY: Number(cluster.bounds.minY),
            maxX: Number(cluster.bounds.maxX),
            maxY: Number(cluster.bounds.maxY),
            item: cluster
        });
    }

    insertEdge(edge, nodeMap) {
        if (this.fallbackMode || !edge.from || !edge.to || !this.edgeTree) return;
        const srcNode = nodeMap.get(edge.from);
        const tgtNode = nodeMap.get(edge.to);
        if (!srcNode || !tgtNode || !srcNode.position || !tgtNode.position) return;
        
        let sx = Number(srcNode.position.x);
        let sy = Number(srcNode.position.y);
        let tx = Number(tgtNode.position.x);
        let ty = Number(tgtNode.position.y);
        if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(tx) || !Number.isFinite(ty)) return;

        this.edgeTree.insert({
            minX: Math.min(sx, tx),
            minY: Math.min(sy, ty),
            maxX: Math.max(sx, tx),
            maxY: Math.max(sy, ty),
            item: edge
        });
    }

    queryViewport(minX, minY, maxX, maxY, type) {
        if (this.fallbackMode) return null;
        
        const box = { minX, minY, maxX, maxY };
        let results = [];
        if (type === 'nodes') results = this.nodeTree.search(box);
        else if (type === 'clusters') results = this.clusterTree.search(box);
        else if (type === 'edges') {
            if (!this.edgeTree) return null;
            results = this.edgeTree.search(box);
        }
        
        return new Set(results.map(r => r.item));
    }

    queryPoint(x, y, type) {
        if (this.fallbackMode) return null;
        const pad = 50;
        return this.queryViewport(x - pad, y - pad, x + pad, y + pad, type);
    }
}

/**
 * FlowRenderer - 함수 실행 순서 플로우차트 렌더링
 */
class FlowRenderer {
    constructor(engine) {
        this.engine = engine;
        this.currentFlow = null;
    }

    buildFlow(nodes) {
        console.log("[FLOW_DEBUG] buildFlow input", nodes.length);
        console.log("[FLOW_DEBUG] node types", nodes.reduce((acc, n) => {
            const t = n.type || "undefined";
            acc[t] = (acc[t] || 0) + 1;
            return acc;
        }, {}));
        
        const clientNodes = nodes.filter(n => n.clientLayer || n.layer === "client" || (n.data && n.data.clientLayer));
        console.log("[FLOW_DEBUG] client nodes count", clientNodes.length);
        console.table(clientNodes.map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            layer: n.layer,
            clientLayer: n.clientLayer,
            status: n.status
        })));
        console.log("[FLOW_DEBUG] client node ids", clientNodes.map(n => n.id));
        console.log("[FLOW_DEBUG] client node labels", clientNodes.map(n => n.label));
        //     status: n.status
        // })), null, 2));
        const edges = this.engine.edges || [];

        // 1. Entry Point 탐색 & Root 결정
        const inDegrees = {};
        edges.forEach(e => {
            if (!e || !e.to) return;
            inDegrees[e.to] = (inDegrees[e.to] || 0) + 1;
        });

        // [v0.3.32.1] Root Investigation Logs
        const _allRoots = nodes.filter(n => !inDegrees[n.id]);
        console.log("[FLOW_DEBUG] root count", _allRoots.length);
        console.log("[FLOW_DEBUG] top indegree roots", _allRoots.slice(0, 100).map(n => n.data?.file || n.id));
        console.log("[FLOW_DEBUG] root sample", _allRoots.slice(0, 20).map(n => ({
            file: n.data?.file,
            type: n.type
        })));

        // [v0.3.32.1] Entry Point Resolver (TypeScript + Rust)
        const entryPoint = nodes.find(n => {
            const file = n.data?.file?.toLowerCase() || '';
            return file.match(/extension\.[tj]s$/);
        }) || nodes.find(n => {
            const file = n.data?.file?.toLowerCase() || '';
            return file.match(/main\.[tj]s$/) || file.match(/main\.rs$/);
        }) || nodes.find(n => {
            const file = n.data?.file?.toLowerCase() || '';
            return file.match(/lib\.rs$/);
        }) || nodes.find(n => {
            const file = n.data?.file?.toLowerCase() || '';
            return file.match(/index\.[tj]s$/);
        }) || nodes.find(n => {
            const file = n.data?.file?.toLowerCase() || '';
            return file.match(/mod\.rs$/);
        }) || null;

        let roots;
        if (entryPoint) {
            roots = [entryPoint];
        } else {
            roots = nodes.filter(n => !inDegrees[n.id] && n.type !== 'external');
            roots.sort((a, b) => {
                const fileNameA = (a.data && a.data.file) ? a.data.file.toLowerCase() : '';
                const fileNameB = (b.data && b.data.file) ? b.data.file.toLowerCase() : '';
                const isPriority = (name) => name.includes('main.') || name.includes('app.') || name.includes('index.');
                const isHelper = (name) => name.includes('validator') || name.includes('helper') || name.includes('util');
                if (isPriority(fileNameA) && !isPriority(fileNameB)) return -1;
                if (!isPriority(fileNameA) && isPriority(fileNameB)) return 1;
                if (isHelper(fileNameA) && !isHelper(fileNameB)) return 1;
                if (!isHelper(fileNameA) && isHelper(fileNameB)) return -1;
                return 0;
            });
            if (roots.length === 0 && nodes.length > 0) {
                const priorityNode = nodes.find(n => {
                    const name = (n.data && n.data.file) ? n.data.file.toLowerCase() : '';
                    return name.includes('main.') || name.includes('app.') || name.includes('index.');
                }) || (nodes.find(n => n.type !== 'external') || nodes[0]);
                roots.push(priorityNode);
            }
        }

        // [Fix] Client nodes MUST be treated as roots (entry points) so they are reachable and connected to START
        const clientRoots = nodes.filter(n => n.clientLayer || n.layer === "client" || (n.data && n.data.clientLayer));
        clientRoots.forEach(cn => {
            if (!roots.some(r => r.id === cn.id)) {
                roots.push(cn);
            }
        });

        console.log("[FLOW_DEBUG] entryPoint", entryPoint?.data?.file || "null");
        console.log("[FLOW_DEBUG] roots count", roots.length);
        console.log("[FLOW_DEBUG] roots files", roots.slice(0, 10).map(r => r.data?.file || r.id));

        // [Checkpoint A 진단] entry candidates 목록
        const _entryCandidates = nodes
            .map(n => n.data?.file)
            .filter(Boolean)
            .filter(file => {
                const f = file.toLowerCase();
                return (
                    /extension\.[tj]s$/.test(f) ||
                    /main\.[tj]s$/.test(f) ||
                    /activate\.[tj]s$/.test(f) ||
                    /server\.[tj]s$/.test(f) ||
                    /daemon\.[tj]s$/.test(f) ||
                    /index\.[tj]s$/.test(f)
                );
            });
        console.log("[FLOW_DEBUG] entry candidates", _entryCandidates);

        // [Checkpoint A 진단] edge 방향 확인
        console.log("[FLOW_DEBUG] edge sample", edges.slice(0, 30).map(e => ({
            from: nodes.find(n => n.id === e.from)?.data?.file || e.from,
            to: nodes.find(n => n.id === e.to)?.data?.file || e.to
        })));

        // [Checkpoint A 진단] index 노드 incoming/outgoing
        const _diagIndex = nodes.find(n => n.data?.file?.match(/index\.[tj]s$/));
        if (_diagIndex) {
            const _outgoing = edges.filter(e => e.from === _diagIndex.id);
            const _incoming = edges.filter(e => e.to === _diagIndex.id);
            console.log("[FLOW_DEBUG] index outgoing", _outgoing.length, _outgoing.slice(0, 5).map(e => nodes.find(n => n.id === e.to)?.data?.file || e.to));
            console.log("[FLOW_DEBUG] index incoming", _incoming.length, _incoming.slice(0, 5).map(e => nodes.find(n => n.id === e.from)?.data?.file || e.from));
        }

        // [Checkpoint A 진단] root outgoing
        const _rootId = roots[0]?.id;
        if (_rootId) {
            const _rootOut = edges.filter(e => e.from === _rootId).slice(0, 10);
            console.log("[FLOW_DEBUG] root outgoing", _rootOut.map(e => ({
                from: nodes.find(n => n.id === e.from)?.data?.file,
                to: nodes.find(n => n.id === e.to)?.data?.file
            })));
        }

        // 2. 의존성 트레이싱 (Reachability)
        const reachableIds = new Set();
        const queue = [...roots.map(r => r.id)];
        roots.forEach(r => reachableIds.add(r.id));

        while (queue.length > 0) {
            const currentId = queue.shift();
            const targets = edges.filter(e => e.from === currentId).map(e => e.to);
            for (const targetId of targets) {
                if (!reachableIds.has(targetId)) {
                    reachableIds.add(targetId);
                    queue.push(targetId);
                }
            }
        }

        // [v0.3.32.1] Reachability Investigation Logs
        console.log("[FLOW_DEBUG] reachable count", reachableIds.size);
        console.log("[FLOW_DEBUG] reachable sample", Array.from(reachableIds).slice(0, 50).map(id => {
            const n = nodes.find(x => x.id === id);
            return n ? (n.data?.file || n.label || n.id) : id;
        }));
        console.log("[FLOW_DEBUG] reachable files count", Array.from(reachableIds).filter(id => {
            const n = nodes.find(x => x.id === id);
            return n && n.type === 'source';
        }).length);

        // 3. 도달 가능한 노드 필터링 및 정렬
        // [Refine] Flow 뷰에서는 '순수 로직'만 표현하기 위해 문서(.md) 파일은 다시 제외
        // 문서 파일은 Graph 뷰의 'Documentation Shelf'에서 탐색 가능함
        
        const debugClientNodes = nodes.filter(n => n.clientLayer || n.layer === "client" || (n.data && n.data.clientLayer));
        console.log("[FLOW_DEBUG] debugClientNodes raw", debugClientNodes.length, debugClientNodes);
        for (const node of debugClientNodes) {
            const fileName = (node.data && node.data.file) ? node.data.file.toLowerCase() : '';
            const isDoc = fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.includes('license');
            const isGhost = node.status === 'ghost';
            const isUser = node.layer === 'user' || 
                           (node.data && node.data.layer === 'user') ||
                           node.status === 'pending' ||
                           (node.id && node.id.startsWith('node_manual_'));
            const reachable = reachableIds.has(node.id);
            const baseVisible = isUser || this.engine.showBaseLayer;
            const userVisible = !isUser || this.engine.showUserLayer;
            const clientVisible = !this.engine._isClientLayerVisible || this.engine._isClientLayerVisible(node);
            
            console.log("[FLOW_DEBUG] client filter reasons", node.label, {reachable, isGhost, baseVisible, userVisible, clientVisible});
        }
        
        const filteredNodes = nodes.filter(n => {
            const fileName = (n.data && n.data.file) ? n.data.file.toLowerCase() : '';
            const isDoc = fileName.endsWith('.md') || fileName.endsWith('.txt') || fileName.includes('license');
            const isGhost = n.status === 'ghost';
            const isContext = false;
            
            // [v0.3.11] 명시적 layer 속성 기반 레이어 감지
            const isUser = n.layer === 'user' || 
                           (n.data && n.data.layer === 'user') ||
                           n.status === 'pending' ||
                           (n.id && n.id.startsWith('node_manual_'));
            
            if (!isUser && !this.engine.showBaseLayer) return false;
            if (isUser && !this.engine.showUserLayer) return false;
            if (this.engine._isClientLayerVisible && !this.engine._isClientLayerVisible(n)) return false;

            const isClientNode = !!n.clientLayer || n.layer === "client" || !!(n.data && n.data.clientLayer);
            if (isClientNode) {
                return reachableIds.has(n.id) && !isDoc && !isContext;
            }

            return reachableIds.has(n.id) && n.type !== 'external' && !isDoc && !isGhost && !isContext;
        });
        
        console.log("[FLOW_DEBUG] filteredNodes count", filteredNodes.length);
        
        console.log("[FLOW_DEBUG] client reachability", debugClientNodes.map(n => ({
            label: n.label,
            id: n.id,
            reachable: reachableIds.has(n.id),
            ghost: n.status === 'ghost',
            isDoc: ((n.data && n.data.file) || '').toLowerCase().endsWith('.md')
        })));
        
        const survivingClientNodes = filteredNodes.filter(n => n.clientLayer || n.layer === "client" || (n.data && n.data.clientLayer));
        console.log("[FLOW_DEBUG] surviving client nodes", JSON.stringify(survivingClientNodes.map(n => ({
            id: n.id,
            label: n.label,
            type: n.type
        })), null, 2));
        console.log("[FLOW_DEBUG] dropped client nodes", debugClientNodes.filter(n => !filteredNodes.some(f => f.id === n.id)).map(n => ({
            label: n.label,
            id: n.id
        })));
        const dropped = nodes.filter(n => !filteredNodes.includes(n));
        console.log("[FLOW_DEBUG] dropped nodes", dropped.map(n => ({
            id: n.id,
            type: n.type,
            label: n.label,
            layer: n.layer,
            status: n.status,
            clientLayer: n.clientLayer
        })));
        
        const droppedSourceNodes = dropped.filter(n => n.type === "source");
        console.log("[FLOW_DEBUG] dropped source nodes", droppedSourceNodes.length);
        console.table(droppedSourceNodes.map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            layer: n.layer,
            clientLayer: n.clientLayer,
            status: n.status
        })));
        const sortedNodes = [...filteredNodes].sort((a, b) => {
            const layerA = a.data.layer || 0;
            const layerB = b.data.layer || 0;
            if (layerA !== layerB) return layerA - layerB;
            return (a.data.priority || 50) - (b.data.priority || 50);
        });

        // 4. 스텝 생성 (START 인젝션)
        const steps = [];
        const rootStepIds = roots.map(r => {
            const idx = sortedNodes.findIndex(sn => sn.id === r.id);
            return idx !== -1 ? `step_${idx}` : null;
        }).filter(id => id !== null);

        steps.push({
            id: 'step_start',
            type: 'terminal',
            label: 'START',
            file: 'system',
            next: rootStepIds.length > 0 ? rootStepIds[0] : (sortedNodes.length > 0 ? 'step_0' : null),
            // [Improvement] START에서 모든 루트로 향하는 연결을 명시
            allNexts: rootStepIds,
            roots: rootStepIds
        });

        sortedNodes.forEach((node, index) => {
            const outEdges = edges.filter(e => e.from === node.id);
            const nextSteps = outEdges.map(e => {
                const targetIdx = sortedNodes.findIndex(sn => sn.id === e.to);
                return targetIdx !== -1 ? `step_${targetIdx}` : null;
            }).filter(id => id !== null);

            // 로직 패턴 (router, checker 등) 확인하여 실제 Decision 여부 결정
            // v0.2.0: Scanner가 이미 type을 지정했다면 그것을 따름
            const fileName = (node.data && node.data.file) ? node.data.file.toLowerCase() : '';
            const isLogicalDecision = node.type === 'decision' ||
                fileName.includes('router') ||
                fileName.includes('checker') ||
                fileName.includes('enforcer') ||
                fileName.includes('prompt') ||
                fileName.includes('valid') ||
                fileName.startsWith('is_') ||
                fileName.includes('check') ||
                fileName.includes('verify');

            steps.push({
                id: `step_${index}`,
                type: isLogicalDecision ? 'decision' : 'process',
                label: node.data.label || node.id,
                file: node.data.file,
                node: node,
                // [Improvement] Show more branches in global flow
                next: nextSteps.length > 0 ? nextSteps[0] : null,
                alternateNext: (nextSteps.length > 1) ? nextSteps[1] : null,
                allNexts: nextSteps,
                layer: node.data.layer || 0,
                isRealDecision: isLogicalDecision,
                decisionLabel: isLogicalDecision ? `Check: ${node.data.label || node.id}` : null
            });
        });

        // END 인젝션
        steps.push({
            id: 'step_end',
            type: 'terminal',
            label: 'END',
            file: 'system'
        });

        // 마지막 일반 프로세스 노드들을 END로 연결
        steps.forEach(step => {
            if (step.id !== 'step_end' && !step.next && !step.alternateNext) {
                step.next = 'step_end';
            }
        });

        console.log("[FLOW_DEBUG] buildFlow output", steps.length);
        console.log("[FLOW_DEBUG] step labels sample", steps.slice(0, 10).map(s => s.label));

        // [Checkpoint A] START → Entry Point 흐름 검증
        const startStep = steps.find(s => s.id === 'step_start');
        const startNextLabels = (startStep?.allNexts || []).map(id => {
            const s = steps.find(x => x.id === id);
            return s ? s.label : id;
        });
        console.log("[FLOW_DEBUG] CHECKPOINT_A START.next", startNextLabels);
        // START에서 3단계까지 추적
        let traceId = startStep?.next;
        const trace = ['START'];
        for (let i = 0; i < 5 && traceId; i++) {
            const s = steps.find(x => x.id === traceId);
            if (!s) break;
            trace.push(s.label);
            traceId = s.next;
        }
        console.log("[FLOW_DEBUG] CHECKPOINT_A trace", trace.join(' → '));

        // [v0.3.32.1] Graph structure verification — topHub detail
        const topHub = steps
            .map(s => ({
                step: s,
                out: (s.allNexts?.length || 0) + (s.next ? 1 : 0)
            }))
            .sort((a, b) => b.out - a.out)[0];
        console.log("[FLOW_DEBUG] topHub detail", JSON.stringify({
            id: topHub.step.id,
            label: topHub.step.label,
            next: topHub.step.next,
            allNexts: topHub.step.allNexts
        }, null, 2));

        console.log("[FLOW_DEBUG] top hubs",
            steps
                .map(s => ({
                    id: s.id,
                    label: s.label,
                    next: s.next,
                    allNexts: s.allNexts?.length || 0
                }))
                .sort((a, b) =>
                    ((b.allNexts) + (b.next ? 1 : 0)) -
                    ((a.allNexts) + (a.next ? 1 : 0))
                )
                .slice(0, 20)
        );

        return {
            id: 'flow_main',
            type: 'global', // [New] Distinguish from 'internal' flow
            name: 'Strategic Execution Flow',
            steps: steps
        };
    }

    layoutFlow(flow) {
        const startX = 400;
        const startY = 100;
        const stepWidth = 260; // 220(node) + 40(gap) to prevent overlap, resolving the crowded feeling
        const stepHeight = 180;

        const positions = {};
        const levels = {}; // stepId -> level

        // 1. Calculate In-degree and Adjacency List
        // [PERF] Adjacency receives edges from step connections (derived from global edges).
        // For accurate tracking against Phase 2, we log the engine's edge count that drove this flow.
        console.log(`[PERF] AdjacencyInputEdges: ${this.edges ? this.edges.length : 0}`);

        const inDegree = {};
        const adj = {};
        flow.steps.forEach(step => {
            inDegree[step.id] = 0;
            adj[step.id] = [];
        });

        // [v0.3.32.1 Fix] Detect and break cycles using DFS back-edge detection
        const visited = new Set();
        const recStack = new Set();
        const backEdges = new Set();
        
        // Helper map for fast lookup
        const stepMap = {};
        flow.steps.forEach(s => { stepMap[s.id] = s; });

        const detectCycle = (u) => {
            visited.add(u);
            recStack.add(u);
            const step = stepMap[u];
            if (step) {
                const nIds = [...new Set([
                    ...(step.next ? [step.next] : []),
                    ...(step.alternateNext ? [step.alternateNext] : []),
                    ...(step.allNexts || []),
                    ...(step.roots || [])
                ])];
                nIds.forEach(v => {
                    if (!visited.has(v)) detectCycle(v);
                    else if (recStack.has(v)) backEdges.add(`${u}->${v}`);
                });
            }
            recStack.delete(u);
        };
        
        // Ensure all components are visited (prefer starting from 'step_start' if exists)
        if (stepMap['step_start']) detectCycle('step_start');
        flow.steps.forEach(s => {
            if (!visited.has(s.id)) detectCycle(s.id);
        });
        
        console.log("[FLOW_DEBUG] Detected back-edges (cycles):", Array.from(backEdges));
        this.backEdges = backEdges;

        // Build edges (ignoring back-edges to maintain DAG property for Kahn's)
        flow.steps.forEach(step => {
            const nextIdsRaw = step.allNexts || [];
            const nextIds = [...new Set([
                ...(step.next ? [step.next] : []),
                ...(step.alternateNext ? [step.alternateNext] : []),
                ...nextIdsRaw,
                ...(step.roots || [])
            ])];

            nextIds.forEach(nextId => {
                if (inDegree[nextId] !== undefined && !backEdges.has(`${step.id}->${nextId}`)) {
                    inDegree[nextId]++;
                    adj[step.id].push(nextId);
                }
            });
        });

        // [v0.3.32.1] Build parentsMap (reverse adjacency) for L3 validation
        const parentsMap = {};
        flow.steps.forEach(step => { parentsMap[step.id] = []; });
        Object.entries(adj).forEach(([parentId, childIds]) => {
            childIds.forEach(childId => {
                if (parentsMap[childId]) parentsMap[childId].push(parentId);
            });
        });

        // [v0.3.32.1] Adjacency structure diagnostics
        console.log("[FLOW_DEBUG] adjacency sample",
            Object.entries(adj).slice(0, 20).map(([k, v]) => ({
                node: k,
                outDegree: v.length
            }))
        );
        console.log("[FLOW_DEBUG] max out degree",
            Math.max(...Object.values(adj).map(v => v.length)));
        console.log("[FLOW_DEBUG] zero out degree",
            Object.values(adj).filter(v => v.length === 0).length);
        console.log("[FLOW_DEBUG] highest out degree nodes",
            Object.entries(adj)
                .map(([k, v]) => ({ node: k, outDegree: v.length }))
                .sort((a, b) => b.outDegree - a.outDegree)
                .slice(0, 10)
        );
        console.log("[FLOW_DEBUG] END inDegree", inDegree['step_end']);
        console.log("[FLOW_DEBUG] END adj out", adj['step_end']?.length);
        console.log("[FLOW_DEBUG] END incoming",
            flow.steps
                .filter(s => s.next === "step_end" || s.allNexts?.includes("step_end"))
                .map(s => s.label)
        );

        // 2. Assign Levels (Longest-path DAG layering via Kahn's algorithm)
        flow.steps.forEach(step => { levels[step.id] = 0; });

        const inDeg = {};
        flow.steps.forEach(step => { inDeg[step.id] = inDegree[step.id]; });

        const topoQueue = [];
        flow.steps.forEach(step => {
            if (inDeg[step.id] === 0) topoQueue.push(step.id);
        });

        // [v0.3.32.1] Kahn initial roots
        const _stepMapForLevel = {};
        flow.steps.forEach(s => { _stepMapForLevel[s.id] = s; });
        console.log("[FLOW_DEBUG] initial roots (inDeg=0)",
            Object.keys(inDeg).filter(id => inDeg[id] === 0).map(id => _stepMapForLevel[id]?.label || id)
        );

        let processedCount = 0;
        while (topoQueue.length > 0) {
            const current = topoQueue.shift();
            processedCount++;
            const currentLevel = levels[current] || 0;

            const neighbors = adj[current] || [];
            neighbors.forEach(neighbor => {
                levels[neighbor] = Math.max(levels[neighbor], currentLevel + 1);
                inDeg[neighbor]--;
                if (inDeg[neighbor] === 0) topoQueue.push(neighbor);
            });

            if (processedCount > 5000) {
                console.warn('[SYNAPSE] Flow layout safety break: Too many iterations (Cycle likely).');
                break;
            }
        }

        // Cycle detection: report unprocessed nodes
        const unprocessed = flow.steps
            .filter(step => inDeg[step.id] > 0)
            .map(step => ({
                id: step.id,
                label: step.label,
                remainingInDegree: inDeg[step.id]
            }));

        if (processedCount !== flow.steps.length) {
            console.warn("[FLOW_DEBUG] cycle detected", {
                processed: processedCount,
                total: flow.steps.length,
                unprocessed
            });
        }

        // [v0.3.32.1] Blocked nodes diagnostic — which nodes have inDeg > 0?
        const blocked = Object.entries(inDeg)
            .filter(([_, deg]) => deg > 0)
            .map(([id, deg]) => ({
                id,
                deg,
                label: _stepMapForLevel[id]?.label || id
            }));
        console.log("[FLOW_DEBUG] blocked nodes (inDeg > 0)", blocked.slice(0, 30));
        // [v0.3.32.1] User Requested Diagnostics
        console.log("[FLOW_DEBUG] step_57", stepMap["step_57"]);
        console.log("[FLOW_DEBUG] step_16", stepMap["step_16"]);
        console.log("[FLOW_DEBUG] cycle node indegree (step_57)", inDeg["step_57"]);
        console.log("[FLOW_DEBUG] cycle node outgoing (step_57)", adj["step_57"]);
        console.log("[FLOW_DEBUG] END level after longest-path", levels["step_end"]);

        // [v0.3.32.1] Verify longest-path actually computed correct levels
        // _stepMapForLevel is already declared above

        console.log("[FLOW_DEBUG] deepest nodes after longest-path",
            Object.entries(levels)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
        );

        console.log("[FLOW_DEBUG] END parents current levels",
            (parentsMap["step_end"] || []).map(id => ({
                id,
                label: _stepMapForLevel[id]?.label || id,
                level: levels[id]
            }))
        );

        console.log("[FLOW_DEBUG] processedCount", processedCount, "/", flow.steps.length);

        // [v0.3.32.1] Level diagnostics
        console.log("[FLOW_DEBUG] highest level nodes",
            Object.entries(levels)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
        );
        console.log("[FLOW_DEBUG] lowest level nodes",
            Object.entries(levels)
                .sort((a, b) => a[1] - b[1])
                .slice(0, 20)
        );
        console.log("[FLOW_DEBUG] node degree top20",
            Object.entries(adj)
                .map(([k, v]) => ({ node: k, out: v.length }))
                .sort((a, b) => b.out - a.out)
                .slice(0, 20)
        );

        // [FLOW_DEBUG] Connected Component Detection
        const _dbgUndirected = {};
        flow.steps.forEach(s => { _dbgUndirected[s.id] = new Set(); });
        flow.steps.forEach(step => {
            const nextIds = [...new Set([
                ...(step.next ? [step.next] : []),
                ...(step.alternateNext ? [step.alternateNext] : []),
                ...(step.allNexts || []),
                ...(step.roots || [])
            ])];
            nextIds.forEach(nid => {
                if (_dbgUndirected[nid]) {
                    _dbgUndirected[step.id].add(nid);
                    _dbgUndirected[nid].add(step.id);
                }
            });
        });

        const _dbgVisited = new Set();
        const _dbgComponents = [];
        flow.steps.forEach(step => {
            if (_dbgVisited.has(step.id)) return;
            const comp = [];
            const q = [step.id];
            while (q.length > 0) {
                const id = q.shift();
                if (_dbgVisited.has(id)) continue;
                _dbgVisited.add(id);
                comp.push(id);
                _dbgUndirected[id].forEach(n => { if (!_dbgVisited.has(n)) q.push(n); });
            }
            _dbgComponents.push(comp);
        });

        const _stepMap = {};
        flow.steps.forEach(s => { _stepMap[s.id] = s; });
        _dbgComponents.forEach((comp, i) => {
            const hasStart = comp.includes('step_start');
            const hasEnd = comp.includes('step_end');
            const labels = comp.map(id => _stepMap[id]?.label || id);
            console.log(`[FLOW_DEBUG] Component #${i} start=${hasStart} end=${hasEnd}`, labels);
        });
        console.log("[FLOW_DEBUG] component summary", _dbgComponents.map((comp, idx) => ({
            idx,
            size: comp.length,
            hasStart: comp.includes("step_start"),
            hasClient: comp.some(id => id.startsWith("client::"))
        })));

        // [v0.3.32.1 Fix] Level remapping: compress sparse levels to contiguous range
        // Without this, levels like {0,1,2,172,173,174,175} cause Y coordinates to span 31000px+
        try {
            const uniqueLevels = [...new Set(Object.values(levels))].sort((a, b) => a - b);
            console.log("[FLOW_DEBUG] uniqueLevels raw", uniqueLevels);
            const levelRemap = {};
            uniqueLevels.forEach((origLevel, newIndex) => { levelRemap[origLevel] = newIndex; });
            flow.steps.forEach(step => { levels[step.id] = levelRemap[levels[step.id]] || 0; });
            console.log("[FLOW_DEBUG] level remap OK", uniqueLevels.length, "unique -> compact 0.." + (uniqueLevels.length - 1));
        } catch(e) {
            console.error("[FLOW_DEBUG] level remap CRASH", e);
        }

        // [v0.3.32.1] END level diagnostics AFTER remap
        console.log("[FLOW_DEBUG] END level AFTER remap", levels["step_end"]);

        // [v0.3.32.1] Simplified Layout: Pure level-based grid
        // Removed: parentsMap, parentOffsetSum, offsets, occupied, spiral search, root centering
        // Goal: Predictable hierarchical layout for DAG validation
        const nodesByLevel = {};
        flow.steps.forEach(step => {
            const lvl = levels[step.id] || 0;
            if (!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
            nodesByLevel[lvl].push(step.id);
        });

        // [v0.3.32.1] nodesByLevel structure dump
        console.log("[FLOW_DEBUG] nodesByLevel",
            Object.fromEntries(
                Object.entries(nodesByLevel).map(([lvl, nodes]) => [
                    `L${lvl}`,
                    nodes.map(n => ({
                        id: n,
                        label: flow.steps.find(s => s.id === n)?.label
                    }))
                ])
            )
        );
        console.log("[FLOW_DEBUG] nodesByLevel counts",
            Object.fromEntries(
                Object.entries(nodesByLevel).map(([lvl, nodes]) => [`L${lvl}`, nodes.length])
            )
        );

        // [v0.3.32.1] L3 parents dump — verify parent relationships before Barycenter
        // stepMap is already declared above
        const level3Nodes = nodesByLevel["3"] || nodesByLevel[3] || [];
        console.log("[FLOW_DEBUG] L3 parents",
            level3Nodes.map(id => ({
                id,
                label: stepMap[id]?.label,
                parents: (parentsMap[id] || []).map(p => stepMap[p]?.label || p)
            }))
        );

        // [v0.3.32.1] END parents level check — verify END is at correct level
        const endParents = parentsMap['step_end'] || [];
        console.log("[FLOW_DEBUG] END parents",
            endParents.map(id => ({
                id,
                label: stepMap[id]?.label,
                level: levels[id]
            }))
        );

        // [v0.3.32.1] Barycenter Ordering Phase 1 (Single Pass: Top -> Bottom)
        // Removes arbitrary MAX_COLS grid and applies centered layer positioning.
        const sortedNodesByLevel = {};
        const levelKeys = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
        
        levelKeys.forEach(levelNum => {
            const nodesInLevel = nodesByLevel[levelNum];
            
            if (levelNum === 0 || !sortedNodesByLevel[levelNum - 1]) {
                sortedNodesByLevel[levelNum] = [...nodesInLevel];
            } else {
                const prevLevelNodes = sortedNodesByLevel[levelNum - 1];
                const prevIndexMap = new Map();
                prevLevelNodes.forEach((id, idx) => prevIndexMap.set(id, idx));

                const withBarycenter = nodesInLevel.map((nodeId, originalIdx) => {
                    // Filter parents to only those in the immediate previous level
                    const parents = (parentsMap[nodeId] || []).filter(p => prevIndexMap.has(p));
                    if (parents.length === 0) {
                        return { nodeId, barycenter: originalIdx, hasParents: false };
                    }
                    const sum = parents.reduce((acc, p) => acc + prevIndexMap.get(p), 0);
                    return { nodeId, barycenter: sum / parents.length, hasParents: true };
                });

                // Stable sort by barycenter
                withBarycenter.sort((a, b) => {
                    if (a.barycenter === b.barycenter) return 0;
                    return a.barycenter - b.barycenter;
                });
                sortedNodesByLevel[levelNum] = withBarycenter.map(item => item.nodeId);
            }
            
            // X Centering logic
            const sortedNodes = sortedNodesByLevel[levelNum];
            const rowWidth = (sortedNodes.length - 1) * stepWidth;
            const startXCentered = startX - (rowWidth / 2);

            sortedNodes.forEach((nodeId, idx) => {
                const x = startXCentered + (idx * stepWidth);
                const y = startY + (levelNum * stepHeight * 1.5); // Add slightly more vertical padding for readability
                positions[nodeId] = { x, y };
            });
        });

        // [v0.3.32.1] Position diagnostics
        console.log("[FLOW_DEBUG] START pos", positions["step_start"]);
        console.log("[FLOW_DEBUG] END pos", positions["step_end"]);
        console.table(
            flow.steps.map(s => ({
                id: s.id,
                label: s.label,
                level: levels[s.id],
                x: positions[s.id]?.x,
                y: positions[s.id]?.y
            }))
        );

        return positions;
    }

    renderFlow(ctx, flow) {
        if (!flow || !flow.steps) return;
        const positions = this.layoutFlow(flow);

        // [v0.3.32.1] Render diagnostics
        const renderedCount = flow.steps.filter(s => !s.hidden && positions[s.id]).length;
        const posValues = Object.values(positions);
        const yValues = posValues.map(p => p.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);
        const xValues = posValues.map(p => p.x);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        console.log("[FLOW_DEBUG] renderFlow total", flow.steps.length, "rendered", renderedCount, "hidden", flow.steps.filter(s => s.hidden).length);
        console.log("[FLOW_DEBUG] renderFlow bounds", {minX, maxX, minY, maxY, spanX: maxX-minX, spanY: maxY-minY});
        console.log("[FLOW_DEBUG] renderFlow level distribution", Object.entries(positions).reduce((acc, [id, p]) => {
            const level = Math.round((p.y - 100) / 180);
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {}));

        // [New] 노드 논리적 그룹화 (Grouping)
        // 이름의 첫 단어(prefix)가 같은 노드들을 묶어 시각적 클러스터 박스를 렌더링
        const groups = {};
        flow.steps.forEach(step => {
            const match = step.label.match(/^([a-z]+)_/i);
            if (match && match[1]) {
                const prefix = match[1].toLowerCase();
                if (!groups[prefix]) groups[prefix] = [];
                groups[prefix].push(step);
            }
        });

        // 뒷배경에 그룹 클러스터 박스 그리기
        Object.keys(groups).forEach(prefix => {
            const groupSteps = groups[prefix];
            // 2개 이상일 때만 그룹으로 시각화 (단일 노드는 무시)
            if (groupSteps.length > 1) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                groupSteps.forEach(s => {
                    const pos = positions[s.id];
                    if (!pos) return;
                    // 노드 bounds 기준 (width 220, height 65 => decision은 약간 다름)
                    minX = Math.min(minX, pos.x - 110);
                    minY = Math.min(minY, pos.y - 45);
                    maxX = Math.max(maxX, pos.x + 110);
                    maxY = Math.max(maxY, pos.y + 45);
                });

                // 여백 추가
                const pad = 30;
                const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;

                ctx.fillStyle = theme ? theme.FLOW.GROUP.bg : 'rgba(250, 189, 47, 0.03)';
                ctx.strokeStyle = theme ? theme.FLOW.GROUP.border : 'rgba(250, 189, 47, 0.4)';
                ctx.lineWidth = 1;
                ctx.setLineDash([6, 4]);

                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2, 12);
                } else {
                    ctx.rect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
                }
                ctx.fill();
                ctx.stroke();
                ctx.setLineDash([]); // reset

                // 그룹 라벨 타이틀
                ctx.fillStyle = theme ? theme.FLOW.GROUP.text : 'rgba(250, 189, 47, 0.8)';
                ctx.font = 'bold 12px Inter, Monospace';
                ctx.textAlign = 'left';
                ctx.fillText(`[ ${prefix.toUpperCase()} GROUP ]`, minX - pad + 5, minY - pad - 8);
            }
        });

        // 상위 연결선 렌더링
        for (const step of flow.steps) {
            const pos = positions[step.id];
            if (!step.hidden) {
                this.renderStep(ctx, step, pos.x, pos.y);
            }

            // [Improvement] allNexts에 포함된 모든 연결선을 렌더링
            const nextIds = step.allNexts || [];
            // next와 alternateNext가 명시적으로 있고 allNexts에 없다면 추가 (하위 호환)
            if (step.next && !nextIds.includes(step.next)) nextIds.push(step.next);
            if (step.alternateNext && !nextIds.includes(step.alternateNext)) nextIds.push(step.alternateNext);

            nextIds.forEach((nextId, idx) => {
                const nextPos = positions[nextId];
                if (!nextPos) return;

                // Decision 노드인 경우 첫 번째는 YES/TRUE, 나머지는 NO/FALSE 또는 라벨 없음
                let label = null;
                if (step.type === 'decision') {
                    if (nextId === step.next) label = 'YES';
                    else if (nextId === step.alternateNext) label = 'NO';
                    else label = `Path ${idx}`;
                }

                const edgeType = (step.data && step.data.edgeType) || null;

                // [New] Flow View Path Highlighting
                const isFromSelected = this.engine.selectedNodes.has(step.node);
                const targetNode = flow.steps.find(s => s.id === nextId)?.node;
                const isToSelected = targetNode && this.engine.selectedNodes.has(targetNode);

                // [v0.2.16] Expand highlighting to include hover state
                const isFromHovered = this.engine.hoveredNode && this.engine.hoveredNode.id === step.node?.id;
                const isToHovered = targetNode && this.engine.hoveredNode && this.engine.hoveredNode.id === targetNode.id;

                const isPathHighlighted = isFromSelected || isToSelected || isFromHovered || isToHovered;
                const isCycle = this.backEdges && this.backEdges.has(`${step.id}->${nextId}`);

                // [Fix] Client Node Edge Coloring (Magenta)
                const localClientId = (typeof window !== 'undefined' && window.connectedUser?.userId) || '';
                const fromCl = step.node && (step.node.clientLayer || (step.node.data && step.node.data.clientLayer));
                const toCl = targetNode && (targetNode.clientLayer || (targetNode.data && targetNode.data.clientLayer));
                const isClientEdge = (fromCl && fromCl !== localClientId) || (toCl && toCl !== localClientId);

                this.renderConnection(ctx, pos.x, pos.y, nextPos.x, nextPos.y, label, edgeType, isPathHighlighted, isCycle, isClientEdge);
            });

            // [New] START에서 여러 루트로 가는 멀티 연결선 지원
            if (step.id === 'step_start' && step.roots) {
                step.roots.forEach(rootId => {
                    const rootPos = positions[rootId];
                    if (rootPos) {
                        const targetNode = flow.steps.find(s => s.id === rootId)?.node;
                        const toCl = targetNode && (targetNode.clientLayer || (targetNode.data && targetNode.data.clientLayer));
                        const localClientId = (typeof window !== 'undefined' && window.connectedUser?.userId) || '';
                        const isClientEdge = toCl && toCl !== localClientId;
                        const isCycle = this.backEdges && this.backEdges.has(`step_start->${rootId}`);
                        this.renderConnection(ctx, pos.x, pos.y, rootPos.x, rootPos.y, null, null, false, isCycle, isClientEdge);
                    }
                });
            }
        }
    }

    renderStep(ctx, step, x, y) {
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        const width = 220;
        const height = 65;

        if (step.type === 'terminal') {
            ctx.fillStyle = theme.FLOW.TERMINAL.bg;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x - 80, y - 30, 160, 60, 30);
            } else {
                ctx.rect(x - 80, y - 30, 160, 60);
            }
            ctx.fill();
            ctx.fillStyle = theme.FLOW.TERMINAL.text;
            ctx.font = 'bold 16px Monospace';
            ctx.textAlign = 'center';
            ctx.fillText(step.label, x, y + 6);
            return;
        }

        const cl = step.node && (step.node.clientLayer || (step.node.data && step.node.data.clientLayer));
        const localClientId = (typeof window !== 'undefined' && window.connectedUser?.userId) || '';
        const isClientNode = cl && cl !== localClientId;

        if (step.type === 'process') {
            ctx.fillStyle = isClientNode ? '#3c0040' : theme.FLOW.PROCESS.bg;
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
            ctx.strokeStyle = isClientNode ? '#ff00ff' : theme.FLOW.PROCESS.border;
            ctx.lineWidth = isClientNode ? 3 : 2;
            ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        } else if (step.type === 'decision') {
            ctx.fillStyle = isClientNode ? '#3c0040' : theme.FLOW.DECISION.bg;
            ctx.beginPath();
            ctx.moveTo(x, y - height / 2 - 15);
            ctx.lineTo(x + width / 2 + 30, y);
            ctx.lineTo(x, y + height / 2 + 15);
            ctx.lineTo(x - width / 2 - 30, y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = isClientNode ? '#ff00ff' : theme.FLOW.DECISION.border;
            ctx.lineWidth = 3;
            ctx.stroke();

            // 상단 작은 텍스트로 타입 표시
            ctx.fillStyle = isClientNode ? '#ff88ff' : theme.FLOW.DECISION.text;
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText('DECISION', x, y - height / 2 - 2);
        }

        ctx.fillStyle = theme.COLORS.TEXT;
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 너무 긴 라벨 생략
        let displayLabel = step.label;
        if (displayLabel.length > 25) displayLabel = displayLabel.substring(0, 22) + '...';
        ctx.fillText(displayLabel, x, y);

        step._bounds = {
            x: x - width / 2,
            y: y - height / 2,
            width: width,
            height: height,
            step: step
        };
    }

    renderConnection(ctx, x1, y1, x2, y2, label, type, isHighlighted = false, isCycle = false, isClientEdge = false) {
        const isLoop = type === 'loop_back' || y2 < y1;
        const arrowSize = 10;
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);

        // [v0.3.22] Unified Edge Style Resolution (Delegated to Theme)
        const edgeStyle = theme ? (theme.getEdgeStyle ? theme.getEdgeStyle(type) : { color: '#665c54', thickness: 2, dash: [] }) : { color: '#665c54', thickness: 2, dash: [] };
        
        let strokeColor = edgeStyle.color; 
        let lineWidth = isLoop ? (edgeStyle.thickness + 1) : edgeStyle.thickness;
        let dash = edgeStyle.dash || [];

        if (isClientEdge) {
            strokeColor = '#ff00ff'; // Magenta for client nodes
            lineWidth = isLoop ? 3 : 2;
        }

        if (isCycle) {
            strokeColor = '#fb4934'; // Bright red for cycle edges
            lineWidth += 1;
            dash = [8, 4]; // Distinct dash pattern for cycles
        }

        if (isHighlighted) {
            strokeColor = (theme && theme.FLOW?.CONNECTION) ? theme.FLOW.CONNECTION.HIGHLIGHT : '#fabd2f';
            lineWidth += 5; 
            // 펄스 애니메이션 적용
            if (this.engine.isAnimating) {
                const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
                const baseBlur = theme ? theme.GLOW.BASE_BLUR : 15;
                const pulseRange = theme ? theme.GLOW.PULSE_RANGE : 5;
                const pulseSpeed = theme ? theme.GLOW.PULSE_SPEED : 200;
                const multiplier = theme ? theme.ANIMATION.DASH_OFFSET_MULTIPLIER : 2.5;
                
                ctx.shadowBlur = baseBlur + pulseRange * Math.sin(Date.now() / pulseSpeed);
                ctx.shadowColor = strokeColor;
                dash = [12, 6];
                ctx.lineDashOffset = -this.engine.animationOffset * multiplier;
            }
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;

        ctx.setLineDash(dash);
        if (isLoop) {
            // 회귀문(Loop)은 옆으로 돌아서 올라가는 아크 형태
            const offset = 150;
            ctx.moveTo(x1 - 110, y1);
            ctx.bezierCurveTo(x1 - offset, y1, x2 - offset, y2, x2 - 110, y2);
            ctx.stroke();

            // 루프 라벨
            ctx.fillStyle = strokeColor;
            ctx.font = 'bold 10px Monospace';
            ctx.fillText(label || 'LOOP', x1 - offset + 20, (y1 + y2) / 2);

            // 루프 화살표 (입력부)
            const angle = Math.PI; // pointing right
            ctx.save();
            ctx.translate(x2 - 110, y2);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(arrowSize, arrowSize / 2);
            ctx.lineTo(arrowSize, -arrowSize / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else {
            // 일반 연결 (Orthogonal / Manhattan Routing)
            const gapY = y2 - y1;
            const isBypass = gapY > 200 && Math.abs(x1 - x2) < 220; // 층을 건너뛰면서 수직으로 노드를 관통할 위험이 있는 경우

            const startY = y1 + 33;
            const endY = y2 - 33;

            // 공통 목적지를 향하는 선들을 모으는 Bus 라인 (목적지 60px 위)
            const busY = y2 - 60;

            ctx.moveTo(x1, startY);

            if (isBypass) {
                // 노드를 우회하는 경로 (바깥쪽으로 빼기)
                const bypassX = x1 > x2 ? x1 + 180 : x1 - 180;
                ctx.lineTo(x1, startY + 20);
                ctx.lineTo(bypassX, startY + 20);
                ctx.lineTo(bypassX, busY);
                ctx.lineTo(x2, busY);
            } else {
                // 일반적인 직교 경로
                const midY = (startY + endY) / 2;
                // 만약 목적지가 같은 엣지들이 모이는 곳이라면 busY를 사용해 통합(Bus) 효과
                const turnY = gapY > 150 ? busY : midY;
                ctx.lineTo(x1, turnY);
                ctx.lineTo(x2, turnY);
            }

            // 목적지로 수직 하강
            ctx.lineTo(x2, endY);
            ctx.stroke();

            // 라벨 배치
            if (label) {
                ctx.save();
                ctx.fillStyle = label === 'YES' ? theme.COLORS.SUCCESS : (label === 'NO' ? theme.COLORS.ERROR : theme.COLORS.HIGHLIGHT);
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                // 라벨은 수평 버스 라인이나 꺾이는 지점 근처에 배치
                const labelY = isBypass ? busY - 10 : (gapY > 150 ? busY - 10 : ((startY + endY) / 2) - 10);
                const labelX = isBypass ? x2 + 20 : (x1 + x2) / 2 + 20;
                ctx.fillText(label, labelX, labelY);
                ctx.restore();
            }

            // 화살표 (이제 무조건 수직 아래를 향함)
            ctx.save();
            ctx.translate(x2, endY);
            // 수직 하강이므로 각도는 90도(Math.PI/2)
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-arrowSize, -arrowSize / 2);
            ctx.lineTo(-arrowSize, arrowSize / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.setLineDash([]); // Reset
    }

    getStepAt(flow, x, y) {
        for (const step of flow.steps) {
            if (step._bounds) {
                const b = step._bounds;
                if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                    return step;
                }
            }
        }
        return null;
    }

    // v0.3.32: Contribution Entity Relationship Flow
    buildContributionFlow(contributionNodes, contributionEdges) {
        if (!contributionNodes || contributionNodes.length === 0) {
            return { id: 'flow_contribution', type: 'contribution', name: 'Contribution Flow', steps: [] };
        }

        const steps = [];
        const nodeMap = new Map();
        contributionNodes.forEach(n => nodeMap.set(n.id, n));

        // START terminal
        steps.push({
            id: 'step_contrib_start',
            type: 'terminal',
            label: 'CONTRIBUTION',
            file: 'system',
            next: null
        });

        // Group by userId for better layout
        const userGroups = new Map();
        contributionNodes.forEach(n => {
            if (!userGroups.has(n.userId)) userGroups.set(n.userId, []);
            userGroups.get(n.userId).push(n);
        });

        let prevStepId = 'step_contrib_start';
        const processedPairs = new Set();

        for (const [userId, nodes] of userGroups) {
            const comparedNodes = nodes.filter(n => n.kind === 'compared');
            const harvestedNodes = nodes.filter(n => n.kind === 'harvested');

            for (const compared of comparedNodes) {
                const stepId = `step_contrib_${compared.id}`;
                steps.push({
                    id: stepId,
                    type: 'process',
                    label: `${compared.filePath}`,
                    file: compared.filePath,
                    node: compared,
                    next: null,
                    layer: 'contribution',
                    metadata: { userId, kind: 'compared' }
                });

                // Link previous step
                const prevStep = steps.find(s => s.id === prevStepId);
                if (prevStep && !prevStep.next) {
                    prevStep.next = stepId;
                }
                prevStepId = stepId;

                // Find matching harvested node via edge
                const edge = contributionEdges.find(e => e.from === compared.id);
                if (edge) {
                    const harvested = nodeMap.get(edge.to);
                    if (harvested) {
                        const harvestStepId = `step_contrib_${harvested.id}`;
                        steps.push({
                            id: harvestStepId,
                            type: 'process',
                            label: `✓ ${harvested.filePath}`,
                            file: harvested.filePath,
                            node: harvested,
                            next: null,
                            layer: 'contribution',
                            metadata: { userId, kind: 'harvested' }
                        });

                        // Connect compared to harvested
                        const currentStep = steps.find(s => s.id === stepId);
                        if (currentStep) {
                            currentStep.next = harvestStepId;
                            currentStep.allNexts = [harvestStepId];
                        }
                        prevStepId = harvestStepId;
                        processedPairs.add(edge.id);
                    }
                }
            }
        }

        // END terminal
        steps.push({
            id: 'step_contrib_end',
            type: 'terminal',
            label: 'END',
            file: 'system'
        });

        // Connect last step to END
        steps.forEach(step => {
            if (step.id !== 'step_contrib_end' && !step.next) {
                step.next = 'step_contrib_end';
            }
        });

        return {
            id: 'flow_contribution',
            type: 'contribution',
            name: 'Contribution Entity Flow',
            steps: steps
        };
    }
}

/**
 * TreeRenderer - 파일 트리 구조 렌더링
 */
console.log('[SYNAPSE] canvas-engine.js loaded');
class TreeRenderer {
    constructor(engine) {
        this.engine = engine;
        this.expandedFolders = new Set(['.', 'src']);
        this.initializeDefaultExpansion();
    }

    initializeDefaultExpansion() {
        // Automatically expand immediate subfolders of src for better first-time visibility
        const srcSubfolders = ['src/core', 'src/bootstrap', 'src/webview', 'src/server', 'src/providers'];
        srcSubfolders.forEach(folder => this.expandedFolders.add(folder));
    }

    buildTree(nodes, projectName = 'Project') {
        const root = { name: projectName || 'Project', type: 'folder', children: {}, fullPath: '', expanded: true };

        for (const node of nodes) {
            if (!node.data || !node.data.file) continue;
            
            const file = node.data.file;
            let wsRoot = this.engine.workspaceFolder;
            let normalizedPath = file;

            // [v0.3.10 Fix] Cross-platform Path Normalized (Handle both / and \\)
            normalizedPath = normalizedPath.replace(/\\/g, '/');
            if (wsRoot) {
                wsRoot = wsRoot.replace(/\\/g, '/');
                if (!wsRoot.endsWith('/')) wsRoot += '/';
                
            }
            
            // [v0.3.20.3] Robust Path Normalization: If we still have an absolute path, try to find the projectName segment
            if (normalizedPath.startsWith('/') || normalizedPath.includes(':/')) {
                const parts = normalizedPath.split(/[/\\]/);
                const projectIdx = parts.lastIndexOf(projectName);
                if (projectIdx !== -1) {
                    normalizedPath = parts.slice(projectIdx + 1).join('/');
                } else {
                    // Fallback: use only the last 3 segments if it's too deep
                    if (parts.length > 3) {
                        if (current.type !== 'directory') {
                        console.error('[TREE_NODE_DUMP]', {
                            id: current.id,
                            name: current.name,
                            type: current.type,
                            createdBy: current.createdBy,
                            filePath: current.filePath
                        });
                        console.error(`[TREE_BUILD_FAILURE] Missing children in directory traversal:`);
                        }
                        normalizedPath = parts.slice(-3).join('/');
                    }
                }
            }
            
            // Further clean: Remove leading /
            normalizedPath = normalizedPath.replace(/^\//, '');

            // [v0.3.10] Hierarchy Preservation: If path looks like an absolute path leaked from the workspace root, fix it.
            // If the first segment is the projectName itself, skip it to avoid root-in-root
            const firstSegment = normalizedPath.split('/')[0];
            if (firstSegment === projectName || firstSegment === 'root' || firstSegment === 'name') {
                 normalizedPath = normalizedPath.substring(firstSegment.length + 1);
            }

            const parts = normalizedPath.split('/');
            let current = root;
            let currentPath = '';

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!part || part === 'root') continue; // Skip redundant root segments
                
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!current.children) {
                    if (current.type !== 'directory') {
                        console.error('[TREE_NODE_DUMP]', {
                            id: current.id,
                            name: current.name,
                            type: current.type,
                            createdBy: current.createdBy,
                            filePath: current.filePath
                        });
                        console.error(`[TREE_BUILD_FAILURE] Missing children at file assignment`);
                        console.error({
                            fileName: node.id
                        });
                    }
                    console.error('[TREE_BUILD_FAILURE] Missing children in directory traversal:', {
                        part,
                        currentName: current?.name,
                        currentType: current?.type,
                        fullPath: currentPath
                    });
                    current.children = {};
                }
                if (!current.children[part]) {
                    current.children[part] = { 
                        name: part, 
                        type: 'folder', 
                        children: {}, 
                        fullPath: currentPath,
                        expanded: this.expandedFolders.has(currentPath)
                    };
                }
                current = current.children[part];
            }

            const fileName = parts[parts.length - 1];
            if (!current.children) {
                console.error('[TREE_BUILD_FAILURE] Missing children at file assignment:', {
                    fileName,
                    normalizedPath,
                    currentName: current?.name,
                    currentType: current?.type
                });
                current.children = {};
            }
            current.children[fileName] = { name: fileName, type: 'file', node: node, fullPath: normalizedPath };
        }

        // 객체를 배열로 변환하고 정렬
        const convertToArray = (obj) => {
            const items = Object.values(obj).map(item => {
                if (item.type === 'folder') {
                    return {
                        ...item,
                        children: convertToArray(item.children)
                    };
                }
                return item;
            });

            // 폴더가 먼저 오고 그 다음 파일, 이름순 정렬
            return items.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
        };

        const treeArr = convertToArray(root.children);
        console.log(`[SYNAPSE] buildTree finished for ${projectName}. Root children count: ${treeArr.length}`);

        // [v0.3.20.5] If root is empty, try to salvage by adding nodes directly to root
        if (treeArr.length === 0 && nodes.length > 0) {
            console.warn('[SYNAPSE] Tree empty after normalization, using flat fallback');
            nodes.slice(0, 100).forEach(node => {
                const label = node.data?.label || node.id.split('/').pop();
                treeArr.push({ name: label, type: 'file', node: node, fullPath: node.id });
            });
        }

        return [{
            ...root,
            children: treeArr
        }];
    }

    toggleFolder(folderPath) {
        if (this.expandedFolders.has(folderPath)) {
            this.expandedFolders.delete(folderPath);
        } else {
            this.expandedFolders.add(folderPath);
        }
    }

    renderTree(ctx, treeData, transform) {
        if (!treeData || !Array.isArray(treeData)) return;

        const padding = 50;
        const startY = 100;
        const canvasWidth = this.engine.canvas.width / (window.devicePixelRatio || 1);
        
        this.renderTreeList(ctx, treeData, padding, startY, canvasWidth - padding * 2);
    }

    renderTreeList(ctx, items, x, y, width) {
        const itemHeight = 30;
        let currentY = y;
        
        // Vertical List Only for better scannability (Single Column)
        const colWidth = width - 40;
        
        for (const item of items) {
            this.renderTreeItem(ctx, item, x, currentY, colWidth);
            currentY += itemHeight;
            
            if (item.type === 'folder' && item.expanded && item.children) {
                currentY = this.renderTreeList(ctx, item.children, x + 20, currentY, colWidth - 20);
            }
        }
        return currentY;
    }

    renderTreeItem(ctx, item, x, y, width) {
        // 마우스 호버 효과를 위한 배경 (옵션)
        if (this.engine.lastMousePos) {
            const mx = this.engine.lastMousePos.x;
            const my = this.engine.lastMousePos.y;
            if (mx >= x && mx <= x + width && my >= y - 20 && my <= y + 10) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(x, y - 20, width, 30);
            }
        }

        ctx.fillStyle = theme ? theme.COLORS.HIGHLIGHT : '#fabd2f';
        ctx.font = '14px Inter, sans-serif';
        
        if (item.type === 'folder') {
            const isExpanded = this.expandedFolders.has(item.fullPath);
            const icon = isExpanded ? '📂' : '📁';
            ctx.fillText(`${icon} ${item.name}`, x, y);

            item._bounds = {
                x: x,
                y: y - 20,
                width: width,
                height: 30,
                item: item
            };
        } else {
            ctx.fillStyle = '#ebdbb2';
            ctx.fillText(`📄 ${item.name}`, x, y);

            item._bounds = {
                x: x,
                y: y - 20,
                width: width,
                height: 30,
                item: item
            };
        }
    }

    getItemAt(treeData, x, y) {
        if (!treeData) return null;
        for (const item of treeData) {
            const result = this.checkItemBounds(item, x, y);
            if (result) return result;
        }
        return null;
    }

    checkItemBounds(item, x, y) {
        if (item._bounds) {
            const b = item._bounds;
            if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                return item;
            }
        }

        if (item.children && item.expanded) {
            for (const child of item.children) {
                const result = this.checkItemBounds(child, x, y);
                if (result) return result;
            }
        }

        return null;
    }
}

// [v0.3.33 Phase 1] ViewStrategy Foundation
// View와 Calculation을 분리하기 위한 전략 열거형.
// 현재는 상태만 보관. 동작 분기는 Phase 3~5에서 구현.
const ViewStrategy = Object.freeze({
    Density:   'density',   // Node만 로드, Edge 생략 (대규모 초기 뷰)
    Focus:     'focus',     // 선택 노드 Neighborhood만 표시
    FullGraph: 'fullgraph'  // 전체 그래프 (현재 동작과 동일)
});

// [v0.3.34] System cluster classification — internal aggregates excluded from user-visible layers
const isSystemCluster = (clusterId) =>
    clusterId === 'cluster_ghosts' || (typeof clusterId === 'string' && clusterId.startsWith('sys_'));

// [v0.3.33 Phase 2] MaterializationPolicy
class MaterializationPolicy {
    shouldMaterializeNode(node) { return true; }
    shouldMaterializeEdge(edge) { return true; }
}

class DensityPolicy extends MaterializationPolicy {
    shouldMaterializeEdge(edge) { return false; }
}

class FocusPolicy extends MaterializationPolicy {
    // Focus skips nodes not in neighborhood (placeholder for now)
}

class FullGraphPolicy extends MaterializationPolicy {}

class PolicyFactory {
    static create(strategy) {
        switch(strategy) {
            case ViewStrategy.Density: return new DensityPolicy();
            case ViewStrategy.Focus: return new FocusPolicy();
            default: return new FullGraphPolicy();
        }
    }
}

class CanvasEngine {
    constructor(canvasId) {
        this._instanceId = Math.random().toString(36).slice(2, 8);
        this._engineId = this._instanceId;
        console.log('[ENGINE_CREATED]', this._engineId);
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('[SYNAPSE] Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // [v0.3.30] VS Code WebView Tab Restore Fix
        // When user opens a file and returns to the canvas, VS Code hides the WebView
        // (document.hidden = true) and restores it on tab switch back.
        // window.resize does NOT always fire on restore, leaving the canvas half-blank.
        // Force an immediate resize + full redraw when the WebView becomes visible again.
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Small delay to let VS Code finish layout before we measure dimensions
                setTimeout(() => {
                    this.resizeCanvas(true); // immediate = true: skip debounce
                    this.isGraphDataDirty = true;
                    this.isEdgeDirty = true;
                    this.lastActivityTime = Date.now(); // Reset idle timer
                    this.requestRender(); // Restart eco-mode loop if sleeping
                }, 100); // Increased delay slightly
            }
        });

        // [v0.3.33] Add ResizeObserver for bulletproof container tracking
        if (typeof ResizeObserver !== 'undefined' && this.canvas.parentElement) {
            const ro = new ResizeObserver(() => {
                this.resizeCanvas(true);
                this.isGraphDataDirty = true;
                this.isEdgeDirty = true;
                this.lastActivityTime = Date.now();
                this.requestRender();
            });
            ro.observe(this.canvas.parentElement);
        }

        // 변환 상태 (줌/팬)
        this.transform = {
            zoom: 1.0,
            offsetX: 0,
            offsetY: 0
        };

        // [v0.2.20] Loop guard initialization
        this.isAnimationLoopActive = false;
        this._loopRunning = false; // [v0.2.24] Robust loop protection
        this._frameCounter = 0; // [v0.2.24] Log throttling
        this.isGraphDataDirty = true;
        this.isEdgeDirty = true;
        this.isTextDirty = true;
        this.nodeMap = new Map(); // [v0.2.24] O(1) Cache
        this.edgeValidationCache = new Map(); // [v0.2.24] BFS Cache
        this.spatialIndex = new SpatialGrid(2000); // [v0.3.33] O(1) Viewport Culling
        this._lastDataHash = null; // [v0.2.24] Data integrity guard
        this._lastLoadTime = 0; // [v0.2.24] Load throttling

        // 데이터
        let _nodesBacking = [];
        Object.defineProperty(this, '_nodes', {
            configurable: true,
            enumerable: true,
            set(v) {
                if (v !== _nodesBacking) {
                    console.trace('[RAW_NODES_WRITE]', { engine: this._engineId, from: _nodesBacking?.length ?? 0, to: v?.length ?? 0 });
                }
                _nodesBacking = v;
            },
            get() {
                return _nodesBacking;
            }
        });
        Object.defineProperty(this, 'nodes', {
            configurable: true,
            enumerable: true,
            set(v) {
                if (v !== _nodesBacking) {
                    console.trace('[NODES_WRITE]', { engine: this._engineId, from: _nodesBacking?.length ?? 0, to: v?.length ?? 0 });
                }
                _nodesBacking = v;
            },
            get() {
                return _nodesBacking;
            }
        });
        this.edges = [];
        this.selectedNode = null;
        this.selectedEdge = null; // 선택된 엣지
        this.baselineNodes = null; // 비교를 위한 기준 데이터
        this.selectedNodes = new Set(); // 다중 선택 노드
        this.hoveredNode = null; // 마우스 오버된 노드
        this.hoveredEdge = null; // 마우스 오버된 엣지
        // [v0.2.17] Logic Edit Mode state
        this.isEditMode = false;
        this.isTestingLogic = false;
        this.webglEnabled = false;
        this.webglRenderer = null;
        this.pulses = [];
        // [v0.2.17] DTR State
        this.currentDTR = 0.3;
        this.clusters = []; // 클러스터 데이터
        this.docShelfNodes = []; // [v0.3.1] 문서화 전용 패널 리스트
        this.isExpectingUpdate = false; // 데이터 업데이트 시 뷰 유지 여부 플래그

        // [v0.2.20] Visual Impact State
        this.systemPressure = 0.0; // 0.0 to 1.0
        this.isRedOut = false;
        this.lastPressureUpdate = Date.now();
        this.nodeStatsMap = new Map(); // [v0.3.17] Degree & Connection Cache
        this.hideLeafNodes = false; // [v0.3.19] Noise Control Toggle
        this.focusTopNodes = 0; // [v0.3.19] Global Exploration Mode (0: OFF, 50, 100, 200)
        this.focusCoreSet = new Set(); // Top-N Core node IDs
        this.focusNodeSet = new Set(); // Core + 1-hop neighbor IDs
        this.hotspots = []; // [v0.3.20] Cached hotspot area geometries
        this.isAligning = false; // [v0.3.20] Strategic Alignment Animation state
        this.alignTimer = 0;
        this.clusterFlows = []; // [v0.3.21] Heatmap Flow Data
        this.showHeatmap = true; // [v0.3.21] Traffic Heatmap Toggle state

        // [v0.2.19] Layer Visibility State
        this.showBaseLayer = true;
        this.showUserLayer = true;
        this.showExternalLayer = true;
        this.clientLayers = {}; // { [clientId]: { visible: boolean, order: number } }

        this.showDocShelf = false;

        // 모드 및 렌더러
        this.currentMode = 'graph'; // 'graph' | 'tree' | 'flow'

        // [v0.3.33 Phase 1] ViewStrategy — 현재는 FullGraph 고정. Phase 3에서 분기 구현.
        this.viewStrategy = ViewStrategy.FullGraph;

        // [v0.3.33 Phase 3] LOD State
        this.expandedClusters = new Set();
        this.collapsedClusters = new Set();
        this.currentLODLevel = 0; // 0: Project, 1: Top Folder, 2: Folder, 3: File
        this._lodStateInitialized = false;

        this.treeRenderer = new TreeRenderer(this);
        this.treeData = [];
        this.flowRenderer = new FlowRenderer(this);
        this.flowData = { steps: [] };

        // 클러스터 색상 팔레트 (Gruvbox palette)
        this.clusterColors = [
            '#fabd2f', // Yellow
            '#fe8019', // Orange
            '#fb4934', // Red
            '#d3869b', // Magenta
            '#83a598', // Blue
            '#8ec07c', // Aqua
            '#b8bb26', // Green
            '#ebdbb2'  // Light
        ];
        this.colorCounter = 0;
        this.debugDisableOverlay = false;
        this._fpsFrames = [];

        // 인터랙션 상태
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this._isInteracting = false; // [v0.2.24] Interaction Guard
        this._isRendering = false;   // [v0.3.9] Rendering Guard: Prevent sleep during render
        this._pendingState = null;   // [v0.2.24] Queued updates
        this.animationOffset = 0;
        this.isAnimating = true;
        this.isSelecting = false; // 드래그 선택 중인지 여부
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 }; // 드래그 선택 영역
        this.wasDragging = false; // 드래그/선택 후 클릭 무시용 플래그
        this.needsUpdate = true;   // [v0.2.24] Passive rendering flag (High CPU fix)
        this._lastRenderTime = 0;
        this.GRID_SNAP_SIZE = 40;  // [v0.3.15] Visual grid sovereignty

        // 전역 엔진 등록
        window.engine = this;
        self.engine = this;
        globalThis.engine = this;
        console.log('[perf_engine]', 'expose', typeof window, typeof globalThis, typeof self);
        console.log('[perf_engine]', 'engine_exposed', !!window.engine, !!globalThis.engine);

        // [Remote Logging Bridge]
        this.log = (text, level = 'info', data = null) => {
            if (level === 'error') console.error(`[SYNAPSE] ${text}`, data || '');
            else if (level === 'warn') console.warn(`[SYNAPSE] ${text}`, data || '');
            else console.log(`[SYNAPSE] ${text}`, data || '');

            if (typeof vscode !== 'undefined') {
                vscode.postMessage({ command: 'log', level, text, data });
            }
        };

        this.log('CanvasEngine initialized');

        // [v0.2.21] WebGL Data Sync Optimization
        this.isGraphDataDirty = true;
        this.webglEnabled = false;
        this.webglRenderer = null;
        this.bootstrapMode = false; // [v0.2.28] Deterministic Bootstrap Mode (Step 4)

        this.handleOpenFile = (filePath, clientUsername = null) => {
            if (!filePath) return;
            console.log('[SYNAPSE] handleOpenFile:', filePath, clientUsername);
            if (typeof vscode !== 'undefined') {
                vscode.postMessage({
                    command: 'openFile',
                    filePath,
                    clientUsername,
                    createIfNotExists: this.isEditMode
                });
            } else if (typeof window.showFilePreview === 'function') {
                window.showFilePreview(filePath, clientUsername);
            }
        };
        this.lastMousePos = { x: 0, y: 0 };

        // 엣지 생성 상태
        this.isCreatingEdge = false;
        this.edgeSource = null; // { type: 'node'|'cluster', id: string }
        this.edgeCurrentPos = { x: 0, y: 0 };
        this.edgeTarget = null; // { type: 'node'|'cluster', id: string }

        // 노드 생성 상태
        this.isAddingNode = false;
        this.pendingNodePos = { x: 0, y: 0 };

        // 🔍 툴팁 요소 생성 (Phase 4)
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'synapse-tooltip';
        this.tooltip.style.position = 'fixed';
        this.tooltip.style.background = '#3c3836';
        this.tooltip.style.border = '1px solid #fabd2f';
        this.tooltip.style.borderRadius = '4px';
        this.tooltip.style.padding = '8px 12px';
        this.tooltip.style.color = '#ebdbb2';
        this.tooltip.style.fontSize = '12px';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.display = 'none';
        this.tooltip.style.zIndex = '10001';
        this.tooltip.style.maxWidth = '250px';
        this.tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        this.tooltip.style.fontFamily = 'Inter, sans-serif';
        document.body.appendChild(this.tooltip);

        // [v0.3.17] Node Summary Tooltip
        this.nodeSummary = document.createElement('div');
        this.nodeSummary.id = 'node-summary-tooltip';
        this.nodeSummary.style.cssText = `
            position: fixed;
            background: rgba(40, 40, 40, 0.98);
            border: 1px solid #fabd2f;
            color: #ebdbb2;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            pointer-events: none;
            z-index: 30000;
            display: none;
            box-shadow: 0 8px 25px rgba(0,0,0,0.6);
            min-width: 180px;
            max-width: 320px;
            word-wrap: break-word;
            white-space: normal;
            line-height: 1.4;
        `;
        document.body.appendChild(this.nodeSummary);


        // 이벤트 리스너 등록
        // this.setupEventListeners(); // Moved to constructor start
        // this.setupToolbarListeners(); // Moved to constructor start

        // Logic Analysis State
        this.isTestingLogic = false;
        this.analysisIssues = [];
        this.pulses = []; // [{ edgeId: string, progress: number, speed: number }]

        // [v0.3.10] Render Isolation: Ensure ALL base properties are initialized before any render trigger
        this.nodes = this.nodes || [];
        this.edges = this.edges || [];
        this.clusters = this.clusters || [];
        
        // [v0.3.10 Fix] Restore vital properties for render loop
        this.particles = [];
        this.promotionSites = []; // [{ x, y, startTime, label }]
        this.promotingNodeIds = new Set(); // Currently animating nodes

        console.log('[SYNAPSE] CanvasEngine initialized. View Isolated.');
        
        // Request initial state - Start loop ONLY when data arrives or explicitly requested
        // [v0.3.34 FIX] Removed duplicate this.getProjectState() to prevent triple-rebuild on startup.
        // We now rely solely on the 'ready' signal at the end of the script.

        this.setupToolbarListeners();
        this.setupEventListeners();
    }

    setupToolbarListeners() {
        // Add Node Button
        const btnAddNode = document.getElementById('btn-add-node');
        if (btnAddNode) {
            btnAddNode.addEventListener('click', () => {
                this.isAddingNode = !this.isAddingNode;
                this.isCreatingEdge = false; // Reset other modes
                btnAddNode.classList.toggle('active', this.isAddingNode);
                document.getElementById('btn-connect')?.classList.remove('active');

                this.canvas.style.cursor = this.isAddingNode ? 'crosshair' : 'default';
                console.log('[SYNAPSE] Add Node Mode:', this.isAddingNode);
            });
        }

        // Connect Button
        const btnConnect = document.getElementById('btn-connect');
        if (btnConnect) {
            btnConnect.addEventListener('click', () => {
                this.isCreatingEdge = !this.isCreatingEdge;
                this.isAddingNode = false; // Reset other modes
                btnConnect.classList.toggle('active', this.isCreatingEdge);
                document.getElementById('btn-add-node')?.classList.remove('active');

                // Clear any partial edge state
                this.edgeSource = null;
                this.edgeTarget = null;

                console.log('[SYNAPSE] Connect Mode:', this.isCreatingEdge);
            });
        }


        // [v0.2.21-fix] WebGL Acceleration Toggle is handled in index.html DOMContentLoaded
        // to guarantee DOM timing and avoid class initialization race conditions.
        // [v0.3.1] Documentation Shelf Toggle
        const btnToggleDocs = document.getElementById('btn-toggle-docs');
        if (btnToggleDocs) {
            btnToggleDocs.addEventListener('click', () => {
                const panel = document.getElementById('docs-shelf-panel');
                if (panel) {
                    panel.classList.toggle('visible');
                    if (panel.classList.contains('visible')) {
                        this.renderDocShelfList(document.getElementById('docs-search-input')?.value || '');
                    }
                }
            });
        }

        const docsCloseBtn = document.getElementById('docs-shelf-close');
        if (docsCloseBtn) {
            docsCloseBtn.addEventListener('click', () => {
                document.getElementById('docs-shelf-panel')?.classList.remove('visible');
            });
        }

        // [v0.3.19] Hide Leaf Nodes Toggle
        const btnToggleLeaf = document.getElementById('btn-toggle-leaf');
        if (btnToggleLeaf) {
            btnToggleLeaf.addEventListener('click', () => {
                console.log('[HIDE_NOISE_ENTER]', { nodes: this.nodes?.length ?? 0, clusters: this.clusters?.length ?? 0, on: !this.hideLeafNodes });
                this.hideLeafNodes = !this.hideLeafNodes;
                btnToggleLeaf.textContent = this.hideLeafNodes ? 'ON' : 'OFF';
                btnToggleLeaf.classList.toggle('active', this.hideLeafNodes);
                this.isGraphDataDirty = true; // [v0.3.22.2] Force cache refresh for WebGL parity
                this.isDirty = true;
                this.render();
                console.log('[HIDE_NOISE_EXIT]', { nodes: this.nodes?.length ?? 0, clusters: this.clusters?.length ?? 0 });
            });
        }

        // [v0.3.19] Focus Top Nodes (Top-N Focus View) Cycle
        const btnToggleFocus = document.getElementById('btn-toggle-focus');
        if (btnToggleFocus) {
            btnToggleFocus.addEventListener('click', () => {
                if (this.focusTopNodes === 0) this.focusTopNodes = 50;
                else if (this.focusTopNodes === 50) this.focusTopNodes = 100;
                else if (this.focusTopNodes === 100) this.focusTopNodes = 200;
                else this.focusTopNodes = 0;
                
                btnToggleFocus.textContent = this.focusTopNodes === 0 ? 'OFF' : `Top ${this.focusTopNodes}`;
                btnToggleFocus.classList.toggle('active', this.focusTopNodes > 0);
                this.isGraphDataDirty = true; // [v0.3.22.2] Force cache refresh for WebGL parity
                this.isDirty = true;
                
                // Re-run the node calculation for focus
                this.calculateNodeStats(this.nodes, this.edges);
                this.render();
                console.log('[SYNAPSE] Focus Top Nodes Mode:', this.focusTopNodes);
            });
        }

        // [v0.3.21] Traffic Heatmap Toggle
        const btnToggleHeatmap = document.getElementById('btn-toggle-heatmap');
        console.log('[HM_BOOT] btn-toggle-heatmap found=' + (!!btnToggleHeatmap) + ' showHeatmap=' + this.showHeatmap);
        if (btnToggleHeatmap) {
            btnToggleHeatmap.addEventListener('click', () => {
                this.showHeatmap = !this.showHeatmap;
                this.clusterFlows = []; // [v0.3.34] Force recalculation
                this.isGraphDataDirty = true; // [v0.3.34] Ensure cache flush
                btnToggleHeatmap.textContent = this.showHeatmap ? 'ON' : 'OFF';
                btnToggleHeatmap.classList.toggle('active', this.showHeatmap);
                console.log('[HM_TOGGLE] showHeatmap=' + this.showHeatmap +
                    ' nodes=' + (this.nodes?.length || 0) +
                    ' edges=' + (this.edges?.length || 0) +
                    ' clusters=' + (this.clusters?.length || 0) +
                    ' flows=' + (this.clusterFlows?.length || 0));
                this.render();
            });
        }

        // [v0.3.19] Auto-Align Architecture (Role-based)
        const btnAlignRole = document.getElementById('btn-align-role');
        if (btnAlignRole) {
            btnAlignRole.addEventListener('click', () => {
                this.applyRoleAlignment();
            });
        }

        const docsSearchInput = document.getElementById('docs-search-input');
        if (docsSearchInput) {
            docsSearchInput.addEventListener('input', (e) => {
                this.renderDocShelfList(e.target.value);
            });
            docsSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const firstItem = document.querySelector('#docs-shelf-list .doc-item');
                    if (firstItem) firstItem.click();
                    // Optional: Close panel after selecting? 
                    // document.getElementById('docs-shelf-panel')?.classList.remove('visible');
                }
            });
        }

        // [v0.2.19] Layer Visibility Toggles
        const btnLayerBase = document.getElementById('btn-layer-base');
        if (btnLayerBase) {
            btnLayerBase.addEventListener('click', () => {
                this.showBaseLayer = !this.showBaseLayer;
                btnLayerBase.classList.toggle('active', this.showBaseLayer);
                btnLayerBase.textContent = this.showBaseLayer ? 'ON' : 'OFF';
                this.isGraphDataDirty = true;
                this.isEdgeDirty = true;
                this.render();
            });
        }

        const btnLayerUser = document.getElementById('btn-layer-user');
        if (btnLayerUser) {
            btnLayerUser.addEventListener('click', () => {
                this.showUserLayer = !this.showUserLayer;
                btnLayerUser.classList.toggle('active', this.showUserLayer);
                btnLayerUser.textContent = this.showUserLayer ? 'ON' : 'OFF';
                this.isGraphDataDirty = true;
                this.isEdgeDirty = true;
                this.render();
            });
        }

        const btnLayerExternal = document.getElementById('btn-layer-external');
        if (btnLayerExternal) {
            btnLayerExternal.addEventListener('click', () => {
                this.showExternalLayer = !this.showExternalLayer;
                btnLayerExternal.classList.toggle('active', this.showExternalLayer);
                btnLayerExternal.textContent = this.showExternalLayer ? 'ON' : 'OFF';
                this.isGraphDataDirty = true;
                this.isEdgeDirty = true;
                this.render();
            });
        }

        // [v0.3.33.8] 4-Level Edge Visibility Control (FULL / NO_BADGES / CLUSTER / NONE)
        window.edgeVisibilityMode = 'FULL'; // 'FULL' | 'NO_BADGES' | 'CLUSTER' | 'NONE'
        const btnEdgeVisAll = document.getElementById('btn-edge-vis-all');
        const btnEdgeVisNoBadge = document.getElementById('btn-edge-vis-nobadge');
        const btnEdgeVisCluster = document.getElementById('btn-edge-vis-cluster');
        const btnEdgeVisHideEdges = document.getElementById('btn-edge-vis-none');

        const updateEdgeVisButtons = (mode) => {
            if (btnEdgeVisAll) btnEdgeVisAll.classList.toggle('active', mode === 'FULL');
            if (btnEdgeVisNoBadge) btnEdgeVisNoBadge.classList.toggle('active', mode === 'NO_BADGES');
            if (btnEdgeVisCluster) btnEdgeVisCluster.classList.toggle('active', mode === 'CLUSTER');
            if (btnEdgeVisHideEdges) btnEdgeVisHideEdges.classList.toggle('active', mode === 'NONE');
        };

        if (btnEdgeVisAll) {
            btnEdgeVisAll.addEventListener('click', () => {
                window.edgeVisibilityMode = 'FULL';
                updateEdgeVisButtons('FULL');
                this.isEdgeDirty = true;
                this.render();
            });
        }
        if (btnEdgeVisNoBadge) {
            btnEdgeVisNoBadge.addEventListener('click', () => {
                window.edgeVisibilityMode = 'NO_BADGES';
                updateEdgeVisButtons('NO_BADGES');
                this.isEdgeDirty = true;
                this.render();
            });
        }
        if (btnEdgeVisCluster) {
            btnEdgeVisCluster.addEventListener('click', () => {
                window.edgeVisibilityMode = 'CLUSTER';
                updateEdgeVisButtons('CLUSTER');
                this.isEdgeDirty = true;
                this.render();
            });
        }
        if (btnEdgeVisHideEdges) {
            btnEdgeVisHideEdges.addEventListener('click', () => {
                window.edgeVisibilityMode = 'NONE';
                updateEdgeVisButtons('NONE');
                this.isEdgeDirty = true;
                this.render();
            });
        }

        // [v0.2.28] Determinism Bootstrap Toggle
        const btnDetBootstrap = document.getElementById('btn-debug-hash');
        if (btnDetBootstrap) {
            btnDetBootstrap.addEventListener('click', () => {
                this.bootstrapMode = !this.bootstrapMode;
                btnDetBootstrap.textContent = this.bootstrapMode ? '💎 Det Bootstrap: ON' : '💎 Det Bootstrap: OFF';
                btnDetBootstrap.style.color = this.bootstrapMode ? '#b8bb26' : '#fe8019';
                this.isGraphDataDirty = true;
                this.render();
            });
        }

        // [v0.3.11 FIX] 중복 이벤트 리스너 제거 (두번 토글 → 항상 ON 고정 버그)

        // Draggable Layer Panel Logic
        const layerPanel = document.getElementById('layer-controller');
        const layerHeader = document.getElementById('layer-controller-header');
        if (layerPanel && layerHeader) {
            let isDragging = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;

            layerHeader.addEventListener('mousedown', (e) => {
                isDragging = true;
                const rect = layerPanel.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                e.preventDefault(); // Prevent text selection
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                let newLeft = e.clientX - dragOffsetX;
                let newTop = e.clientY - dragOffsetY;

                // Restrict to viewport bounds
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - layerPanel.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - layerPanel.offsetHeight));

                layerPanel.style.left = `${newLeft}px`;
                layerPanel.style.top = `${newTop}px`;
                layerPanel.style.bottom = 'auto'; // Disable bottom pinning after drag
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }

        // Node Creation Dialog
        const btnConfirmNode = document.getElementById('btn-confirm-node');
        const btnCancelNode = document.getElementById('btn-cancel-node');
        const nodeDialog = document.getElementById('node-dialog');

        if (btnConfirmNode) {
            btnConfirmNode.addEventListener('click', () => {
                const labelInput = document.getElementById('node-label-input');
                const typeInput = document.getElementById('node-type-input');

                if (labelInput && typeInput) {
                    const label = labelInput.value;
                    const type = typeInput.value;
                    const pathInput = document.getElementById('node-path-input');

                    if (label) {
                        this.createManualNode(label, type, this.pendingNodePos.x, this.pendingNodePos.y, pathInput?.value || '');

                        // Reset and hide
                        labelInput.value = '';
                        nodeDialog.style.display = 'none';
                        // Keep AddNode mode persistent
                    }
                }
            });
        }

        if (btnCancelNode) {
            btnCancelNode.addEventListener('click', () => {
                if (nodeDialog) nodeDialog.style.display = 'none';
                this.isAddingNode = false;
                document.getElementById('btn-add-node')?.classList.remove('active');
                this.canvas.style.cursor = 'default';
            });
        }

        // Delete Button (Phase 0.2.0 enhancement)
        const btnDelete = document.getElementById('btn-delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', () => {
                if (this.selectedEdge) {
                    this.deleteEdge(this.selectedEdge.id);
                } else if (this.selectedNodes.size > 0) {
                    this.deleteSelectedNodes();
                } else {
                    console.log('[SYNAPSE] Nothing selected to delete');
                }
            });
        }
        // Test Logic Button
        const btnTestLogic = document.getElementById('btn-test-logic');
        if (btnTestLogic) {
            btnTestLogic.addEventListener('click', () => {
                this.testLogic();
            });
        }

        // Edit Logic Button (Destructive Source Sync)
        const btnEditLogic = document.getElementById('btn-edit-logic');
        const btnEditLogicLabel = document.getElementById('btn-edit-logic-label');
        const _btnAddNode = document.getElementById('btn-add-node');
        const _btnConnect = document.getElementById('btn-connect');

        const toggleEditLogic = () => {
            this.isEditMode = !this.isEditMode;
            if (btnEditLogicLabel) {
                btnEditLogicLabel.textContent = `🔓 Edit Logic: ${this.isEditMode ? 'ON' : 'OFF'}`;
                btnEditLogicLabel.style.color = this.isEditMode ? '#fabd2f' : '#fb4934';
            }
            if (btnEditLogic) {
                btnEditLogic.textContent = `Turn ${this.isEditMode ? 'OFF' : 'ON'} Edit Mode`;
            }
            if (typeof window.vscode !== 'undefined') {
                vscode.postMessage({
                    command: 'setEditLogicMode',
                    enabled: this.isEditMode
                });
            }

            if (this.isEditMode) {
                this.canvas.style.boxShadow = `inset 0 0 20px ${theme.COLORS.ERROR}`;
                if (_btnAddNode) _btnAddNode.style.display = 'block';
                if (_btnConnect) _btnConnect.style.display = 'block';
            } else {
                this.canvas.style.boxShadow = 'none';
                if (_btnAddNode) _btnAddNode.style.display = 'none';
                if (_btnConnect) _btnConnect.style.display = 'none';
                this.isAddingNode = false;
                this.isCreatingEdge = false;
                this.canvas.style.cursor = 'default';

                // [FIX v0.3.09] 2D 모드 전환 시 DOM 리플로우 강제 트리거
                // 부모 컨테이너의 CSS 레이아웃이 재계산되도록 강제함
                setTimeout(() => {
                    const _ = this.canvas.parentElement.offsetHeight;  // Read to trigger reflow
                    this.resizeCanvas(true);  // Immediate synchronous resize
                    console.log('[SYNAPSE] 2D mode: forced DOM reflow and canvas resize');
                }, 50);  // 50ms 대기 후 리플로우 (레이아웃 안정화 대기)
            }
        };

        if (btnEditLogic) {
            btnEditLogic.addEventListener('click', toggleEditLogic);
        }
        if (btnEditLogicLabel) {
            btnEditLogicLabel.addEventListener('click', toggleEditLogic);
            btnEditLogicLabel.style.cursor = 'pointer';
        }

        // [v0.2.17] Scrollbar drag interaction
        this._initScrollbarDrag();
    }

    _initScrollbarDrag() {
        const thumbV = document.getElementById('thumb-v');
        const thumbH = document.getElementById('thumb-h');
        const container = document.getElementById('canvas-container');
        if (!thumbV || !thumbH || !container) return;

        let dragging = null; // 'v' | 'h' | null
        let dragStartY = 0, dragStartX = 0;
        let startOffsetY = 0, startOffsetX = 0;

        const onMouseDown = (axis) => (e) => {
            e.preventDefault();
            dragging = axis;
            dragStartY = e.clientY;
            dragStartX = e.clientX;
            startOffsetY = this.transform.offsetY;
            startOffsetX = this.transform.offsetX;
        };

        thumbV.addEventListener('mousedown', onMouseDown('v'));
        thumbH.addEventListener('mousedown', onMouseDown('h'));

        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const zoom = this.transform.zoom;

            if (dragging === 'v') {
                const dy = e.clientY - dragStartY;
                const viewHeight = container.clientHeight;
                // Max content height estimate
                const maxY = this.nodes.length > 0
                    ? Math.max(...this.nodes.map(n => n.position.y + 60)) : viewHeight * 2;
                const contentHeight = Math.max(viewHeight * 2, maxY * zoom);
                // Map thumb pixel drag to world offset change
                const worldDelta = (dy / viewHeight) * contentHeight / zoom;
                this.transform.offsetY = startOffsetY - worldDelta * zoom;
                this.render();
            } else if (dragging === 'h') {
                const dx = e.clientX - dragStartX;
                const viewWidth = container.clientWidth;
                const maxX = this.nodes.length > 0
                    ? Math.max(...this.nodes.map(n => n.position.x + 120)) : viewWidth * 2;
                const contentWidth = Math.max(viewWidth * 2, maxX * zoom);
                const worldDelta = (dx / viewWidth) * contentWidth / zoom;
                this.transform.offsetX = startOffsetX - worldDelta * zoom;
                this.render();
            }
        });

        document.addEventListener('mouseup', () => { dragging = null; });
    }

    testLogic() {
        if (typeof vscode !== 'undefined') {
            this.isTestingLogic = true;
            this.analysisIssues = [];
            this.pulses = [];
            vscode.postMessage({ command: 'testLogic' });

            // Visual feedback: clear existing state
            this.nodes.forEach(n => {
                delete n.isError;
                delete n.isBottleneck;
                delete n.isIsolated;
            });
            this.edges.forEach(e => {
                delete e.isCircular;
                delete e.isBottleneck;
            });
            this.render();
        }
    }

    createManualNode(label, type, x, y, path = '') {
        // [v0.2.20 Fix] Place manual nodes securely in the Buffer Cluster physical area
        const bufferBaseX = -1100;
        const bufferBaseY = 1000;

        // Find how many buffer nodes exist to stack them neatly
        const bufferNodes = this.nodes.filter(n => n.cluster_id === 'sys_cluster_buffer' || n.data?.cluster_id === 'sys_cluster_buffer');
        const offsetX = (bufferNodes.length % 4) * 160;
        const offsetY = Math.floor(bufferNodes.length / 4) * 100;

        const targetX = bufferBaseX + offsetX;
        const targetY = bufferBaseY + offsetY;

        const connectedUserId = window.connectedUser?.userId || '';
        const newNode = {
            id: `node_manual_${Date.now()}`,
            type: type,
            status: 'active',
            position: { x: targetX, y: targetY },
            clientLayer: connectedUserId,
            data: {
                label: label,
                description: 'Manually created node',
                cluster_id: 'sys_cluster_buffer',
                priority_cluster: 'sys_cluster_buffer',
                clientLayer: connectedUserId
            },
            cluster_id: 'sys_cluster_buffer',
            filePath: path,
            visual: {
                opacity: 1
            }
        };
        if (this.isEditMode) {
            newNode.createPhysicalFile = true;
        }

        // [v0.2.20 Fix] Frontend duplicate check
        const existingNode = this.nodes.find(n => n.data?.label === label && n.type === type);
        if (existingNode) {
            console.warn('[SYNAPSE] Duplicate node detected (Frontend):', label);
            return; // Backend will also check, but we block here for immediate feedback
        }

        console.log('[SYNAPSE] Creating manual node:', newNode);

        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'createManualNode',
                node: newNode,
                filePath: path
            });
        }

        // Optimistic update
        this.nodes.push(newNode);
        this.render();

        // [v0.2.20] Auto zoom to the new node in the buffer cluster
        setTimeout(() => {
            if (typeof this.focusNodeInGraph === 'function') {
                this.focusNodeInGraph(newNode.id);
            }
        }, 150);
    }

    async getProjectState() {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'getProjectState' });
        } else {
            console.warn('[SYNAPSE] VS Code API not available (Browser mode). Attempting to fetch state...');
            try {
                let response = await fetch('/api/state');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.state) {
                        console.log('[SYNAPSE] State loaded via /api/state');
                        this.loadProjectState(data.state);
                        return;
                    }
                }
                console.warn('[SYNAPSE] /api/state failed, trying /data/project_state.json...');
                response = await fetch('/data/project_state.json');
                if (response.ok) {
                    const state = await response.json();
                    console.log('[SYNAPSE] State loaded via /data/project_state.json');
                    this.loadProjectState(state);
                }
            } catch (error) {
                console.error('[SYNAPSE] Browser mode fetch failed:', error);
            }
        }
    }

    resizeCanvas(immediate = false) {
        const container = this.canvas.parentElement;
        if (!container) return;

        const dpr = window.devicePixelRatio || 1;
        let width = container.clientWidth;
        let height = container.clientHeight;

        // [v0.3.24 Fix] 레이아웃 붕괴 방지: clientHeight가 0인 초기 로딩 시 윈도우 크기 참조
        if (width === 0) width = window.innerWidth;
        if (height === 0) height = window.innerHeight - 100;
        height = Math.max(height, 400);

        const targetWidth = Math.floor(width * dpr);
        const targetHeight = Math.floor(height * dpr);

        if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
            // [v0.2.24] Resize Debounce
            if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
            const updateBuffer = () => {
                this.canvas.width = targetWidth;
                this.canvas.height = targetHeight;
                this.canvas.style.width = `${width}px`;
                this.canvas.style.height = `${height}px`;

                if (this.webglEnabled && this.webglRenderer) {
                    this.webglRenderer.handleResize();
                }

                console.log(`[SYNAPSE] Canvas resolution updated (${immediate ? 'Sync' : 'Async'}). Viewport: ${width}x${height}`);
                this.render();
            };

            if (immediate) {
                if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
                updateBuffer();
            } else {
                if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
                this._resizeTimeout = setTimeout(updateBuffer, 100);
            }
        }

        // [v0.2.20] Virtual Debug Button Listener
        const btnVirtualDebug = document.getElementById('btn-virtual-debug');
        if (btnVirtualDebug && !btnVirtualDebug._initialized) {
            btnVirtualDebug._initialized = true;
            btnVirtualDebug.addEventListener('click', () => {
                if (typeof vscode !== 'undefined') {
                    vscode.postMessage({ command: 'virtualDebug' });
                }
            });
        }

        // [v0.2.21] Debug Simulation Buttons
        const btnSimNecrosis = document.getElementById('btn-sim-necrosis');
        if (btnSimNecrosis) {
            btnSimNecrosis.addEventListener('click', () => {
                this.selectedNodes.forEach(node => {
                    node.status = 'error_necrosis';
                });
                this.render();
            });
        }

        const btnSimTombstone = document.getElementById('btn-sim-tombstone');
        if (btnSimTombstone) {
            btnSimTombstone.addEventListener('click', () => {
                this.selectedNodes.forEach(node => {
                    node.status = 'error_tombstone';
                });
                this.render();
            });
        }

        const btnSimClear = document.getElementById('btn-sim-clear');
        if (btnSimClear) {
            btnSimClear.addEventListener('click', () => {
                this.nodes.forEach(node => {
                    if (node.status === 'error_necrosis' || node.status === 'error_tombstone') {
                        node.status = 'active';
                    }
                    delete node.isVirtualDebugError;
                    delete node.isError;
                    delete node.isArchViolation;
                });
                this.edges.forEach(edge => {
                    delete edge.isFractured;
                });
                this.render();
            });
        }
    }

    /**
     * 프롬프트 저장 요청 (Phase 4)
     */
    requestLogPrompt() {
        console.log('[SYNAPSE] Requesting log prompt UI...');
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'requestLogPrompt' });
        } else {
            alert('Cannot log prompt in browser mode without backend connection.');
        }
    }

    /**
     * 애니메이션 토글 (Phase 3)
     */
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        if (this.isAnimating) {
            this.lastActivityTime = Date.now();
            this.startLoop();
        } else {
            this.render(); // Ensure 'IDLE' is shown immediately when stopped
        }
        console.log('[SYNAPSE] Animation toggled:', this.isAnimating);
        return this.isAnimating;
    }

    wakeUp() {
        this.lastActivityTime = Date.now();
        // [v0.2.25] Anti-Override: Do not force isAnimating=true here.
        // Screen should still update but animation state remains as set by user.
        if (typeof this.isRunning === 'undefined' || !this.isRunning) {
            this.startLoop();
        }
        this.isDirty = true;
    }

    focusNodeInGraph(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        console.log('[SYNAPSE] Focusing node:', nodeId);

        // Switch to graph mode if not already
        if (this.currentMode !== 'graph') {
            this.currentMode = 'graph';
            document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-mode="graph"]')?.classList.add('active');
        }

        // Select the node
        this.selectedNodes.clear();
        this.selectedNodes.add(node);
        this.selectedNode = node;

        // Center view on node
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);

        this.transform.zoom = 1.0; // Reset zoom for clarity
        this.transform.offsetX = canvasWidth / 2 - node.position.x;
        this.transform.offsetY = canvasHeight / 2 - node.position.y;

        this.updateZoomDisplay();
        this.render();
    }

    startLoop() {
        if (this._loopRunning) return;
        this._loopRunning = true;
        console.log("[SYNAPSE] starting main loop (eco-mode with auto-sleep)");

        const loop = () => {
            try {
                // [v0.2.24] Auto-Sleep Logic: Idle for 2 seconds -> Set isAnimating to false
                const now = Date.now();
                const idleTime = now - (this.lastActivityTime || 0);
                const hasActiveParticles = (this.particles?.length || 0) > 0 || (this.promotionSites?.length || 0) > 0;

                // [v0.2.25] Eternal Loop: No Auto-Sleep if WebGL + Graph mode
                const idleLimit = (this.webglEnabled && this.currentMode === 'graph') ? Infinity : 2000;

                // [FIX v0.3.09] 렌더링 중에는 수면에 들지 않음
                // isDirty 또는 필요한 업데이트가 있으면 렌더링이 진행되므로, 이 경우 수면 진입 금지
                const isRenderingActive = this.isDirty || this._isInteracting || this.isDragging ||
                    this.isSelecting || hasActiveParticles || this.needsUpdate ||
                    (this.isAnimating && (this.particles?.length || 0) > 0) || this._isRendering;

                if (idleTime > idleLimit && !hasActiveParticles && !this.isDragging && !this.isSelecting &&
                    !this.needsUpdate && !isRenderingActive) {
                    if (this.isAnimating) {
                        this.log('[SYNAPSE] Eco-mode: Entering Sleep (IDLE > 2s)');
                        this.isAnimating = false;
                        this.needsUpdate = true; // Final indicator draw
                        this.render();
                    }
                    this._loopRunning = false; // Stop recursive RAF
                    return; // EXIT LOOP
                }

                // [v0.3.21] Align status should also trigger render
                const shouldRender = this.isDirty || this._isInteracting || this.isDragging || this.isSelecting || 
                                     hasActiveParticles || this.needsUpdate || this.isAligning || 
                                     (this.isAnimating && (this.particles?.length || 0) > 0);

                if (shouldRender) {
                    this._isRendering = true;  // [FIX v0.3.09] Mark rendering start
                    console.time('render');
                    try {
                        this.render();
                        this.needsUpdate = false; // Reset after render
                    } finally {
                        console.timeEnd('render');
                        this._isRendering = false;  // [FIX v0.3.09] Mark rendering end
                    }
                }
            } catch (e) {
                console.error("[SYNAPSE] render crash", e);
                this._loopRunning = false;
            }
            if (this._loopRunning) {
                requestAnimationFrame(loop);
            }
        };

        requestAnimationFrame(loop);
    }

    requestRender() {
        this.needsUpdate = true;
        if (!this._loopRunning) {
            this.startLoop();
        }
    }

    updateParticles() {
        if (this.particles.length === 0 && this.promotionSites.length === 0) return;

        // Emit from sites
        const now = Date.now();
        this.promotionSites = this.promotionSites.filter(site => {
            const elapsed = now - site.startTime;
            if (elapsed < 2000) { // Emit for 2 seconds
                if (Math.random() < 0.3) {
                    this.emitPromotionParticles(site.x, site.y);
                }
                return true;
            }
            return false;
        });

        // Update existing particles
        this.particles = this.particles.filter(p => p.update());
    }

    emitPromotionParticles(x, y) {
        // Gruvbox Aqua/Greenish tones
        const colors = ['rgb(142, 192, 124)', 'rgb(184, 187, 38)', 'rgb(235, 219, 178)'];
        for (let i = 0; i < 5; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new PromotionParticle(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 30, color));
        }
    }

    renderParticles() {
        if (this.particles.length === 0) return;
        this.particles.forEach(p => p.render(this.ctx, this.transform));
    }

    /**
     * _lerpColor: 두 색상 사이를 보간 (Morphing용)
     */
    _lerpColor(a, b, amount) {
        const ah = parseInt(a.replace(/#/g, ''), 16),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
            bh = parseInt(b.replace(/#/g, ''), 16),
            br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
            rr = ar + amount * (br - ar),
            rg = ag + amount * (bg - ag),
            rb = ab + amount * (bb - ab);

        return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1);
    }

    /**
     * _showPromotionToast: 승격 완료 알림 출력
     */
    _showPromotionToast(labels) {
        const toastId = `promotion-toast-${Date.now()}`;
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = 'promotion-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#282828';
        toast.style.border = '1px solid #b8bb26';
        toast.style.borderRadius = '8px';
        toast.style.padding = '12px 24px';
        toast.style.color = '#ebdbb2';
        toast.style.zIndex = '10002';
        toast.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '12px';
        toast.style.fontFamily = 'Inter, sans-serif';
        toast.style.animation = 'toast-slide-up 0.5s ease-out';

        const icon = document.createElement('span');
        icon.textContent = '🚀';
        icon.style.fontSize = '20px';

        const content = document.createElement('div');
        const mainText = document.createElement('strong');
        mainText.textContent = '설계 승격 완료: Base Logic 통합';
        mainText.style.display = 'block';
        mainText.style.color = '#b8bb26';

        const subText = document.createElement('span');
        subText.textContent = labels.length === 1 ? `[${labels[0]}] 노드가 실체화되었습니다.` : `[${labels[0]}] 외 ${labels.length - 1}개 노드가 실체화되었습니다.`;
        subText.style.fontSize = '12px';
        subText.style.opacity = '0.8';

        content.appendChild(mainText);
        content.appendChild(subText);
        toast.appendChild(icon);
        toast.appendChild(content);

        document.body.appendChild(toast);

        // Remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toast-fade-out 0.5s ease-in forwards';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }

    /**
     * _updateLayerCounts: 레이어 패널의 노드 숫자 업데이트 및 애니메이션
     */
    _updateLayerCounts(backendCounts = null) {
        const elBase = document.getElementById('layer-count-base');
        const elUser = document.getElementById('layer-count-user');
        const elExternal = document.getElementById('layer-count-external');
        if (!elBase || !elUser) return;

        let userCount, baseCount, externalCount;
        
        const useBackend = backendCounts && 
            (backendCounts.userCount !== undefined || backendCounts.user_count !== undefined) &&
            ((backendCounts.aiCount ?? backendCounts.ai_count ?? 0) > 0 || (this.nodes && this.nodes.length === 0));

        if (useBackend) {
            // [v0.3.11] Use Authoritative Counts if provided
            userCount = backendCounts.userCount ?? backendCounts.user_count;
            baseCount = backendCounts.aiCount ?? backendCounts.ai_count;
            externalCount = backendCounts.externalCount ?? backendCounts.external_count ?? 0;
        } else {
            // Fallback to local filtering
            const userNodes = this.nodes.filter(n => 
                n.layer === 'user' || 
                (n.data && n.data.layer === 'user') ||
                (n.id && n.id.startsWith('node_manual_'))
            );
            const externalNodes = this.nodes.filter(n =>
                n.layer === 'external' ||
                (n.data && n.data.layer === 'external') ||
                n.type === 'external' ||
                n.status === 'ghost' ||
                (n.cluster_id && n.cluster_id === 'cluster_ghosts')
            );
            userCount = userNodes.length;
            externalCount = externalNodes.length;
            baseCount = this.nodes.length - userCount - externalCount;
        }

        const updateBadge = (el, newCount) => {
            if (!el) return;
            const oldCount = parseInt(el.textContent);
            if (isNaN(oldCount) || oldCount !== newCount) {
                el.textContent = newCount;
                el.classList.add('changed');
                setTimeout(() => el.classList.remove('changed'), 600);
            }
        };

        updateBadge(elBase, baseCount);
        updateBadge(elUser, userCount);
        if (elExternal) updateBadge(elExternal, externalCount);
    }

    removeDisconnectedClientLayers(connectedUserIds) {
        const connected = connectedUserIds || new Set();
        let changed = false;
        for (const clientId of Object.keys(this.clientLayers)) {
            if (clientId.startsWith('usr_') && !connected.has(clientId)) {
                delete this.clientLayers[clientId];
                changed = true;
            }
        }
        if (changed) this._updateClientLayerUI();
    }

    registerClientLayer(clientId, username) {
        if (!clientId) return;
        if (this.clientLayers[clientId]) {
            if (username) this.clientLayers[clientId].username = username;
            this.clientLayers[clientId].lastActive = Date.now();
            return;
        }
        const order = Object.keys(this.clientLayers).length;
        this.clientLayers[clientId] = { visible: true, order, username: username || '', lastActive: Date.now() };
        this._updateClientLayerUI();
    }

    refreshClientLayersFromAccounts() {
        if (typeof window.vscode !== 'undefined') return;
        const token = window._synapseToken;
        const hdrs = token ? { 'Authorization': 'Bearer ' + token } : {};
        Promise.all([
            fetch('/api/admin/accounts', { headers: hdrs }).then(r => r.json()),
            fetch('/api/admin/connected-clients', { headers: hdrs }).then(r => r.json()).catch(() => ({ success: false }))
        ]).then(([accData, connData]) => {
            if (!accData.success || !accData.accounts) return;
            const connectedIds = new Set(
                connData.success && connData.clients
                    ? connData.clients.map(function(c) { return c.userId; })
                    : []
            );
            window._connectedUserIds = connectedIds;
            this.removeDisconnectedClientLayers(connectedIds);
            for (const acc of accData.accounts) {
                if (acc.username === 'server') continue;
                if (connectedIds.has(acc.userId)) {
                    this.registerClientLayer(acc.userId, acc.username);
                }
            }
        }).catch(() => {});
    }

    setClientLayerVisibility(clientId, visible) {
        if (!this.clientLayers[clientId]) return;
        this.clientLayers[clientId].visible = visible;
        this.isGraphDataDirty = true;
        this.isEdgeDirty = true;
        this.render();
    }

    removeClientLayer(clientId) {
        if (!this.clientLayers[clientId]) return;
        delete this.clientLayers[clientId];
        this.isGraphDataDirty = true;
        this.isEdgeDirty = true;
        this.render();
    }

    syncClientLayersFromNodes() {
        // deprecated: layers are session-driven, not node-driven
    }

    getClientLayerOffset(clientId) {
        if (!clientId) return 0;
        const entry = this.clientLayers[clientId];
        if (!entry) return 0;
        const BAND_HEIGHT = 300;
        const BASE_GAP = 50;
        return (entry.order + 1) * BAND_HEIGHT + BASE_GAP;
    }

    _isClientLayerVisible(n) {
        const cl = n ? (n.clientLayer || (n.data && n.data.clientLayer)) : undefined;
        if (!cl) return true;
        const entry = this.clientLayers[cl];
        if (entry === undefined) return true;
        return entry.visible;
    }

    getVisibleClientLayerIds() {
        return Object.keys(this.clientLayers).filter(id => this.clientLayers[id].visible);
    }

    _updateClientLayerUI() {
        const container = document.getElementById('client-layer-rows');
        if (!container) return;
        container.innerHTML = '';
        const clientIds = Object.keys(this.clientLayers);
        if (clientIds.length === 0) return;
        const isServerAdmin = window.connectedUser && window.connectedUser.userId === '_server_admin_';
        const connectedIds = (typeof window !== 'undefined' && window._connectedUserIds) ? window._connectedUserIds : new Set();
        for (const clientId of clientIds) {
            const entry = this.clientLayers[clientId];
            const isConnected = isServerAdmin || connectedIds.has(clientId);
            if (!isConnected) continue;
            const displayName = entry.username || (clientId.length > 20 ? clientId.slice(0, 17) + '...' : clientId);
            const dotColor = '#8ec07c';
            const dotTitle = '접속 중';
            const row = document.createElement('div');
            row.className = 'layer-toggle-row';
            row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;';
            const left = document.createElement('div');
            left.style.cssText = 'display: flex; align-items: center; flex: 1; min-width: 0;';
            const dot = document.createElement('span');
            dot.style.cssText = 'display:inline-block;width:8px;height:8px;border-radius:50%;background:' + dotColor + ';margin-right:6px;flex-shrink:0;';
            dot.title = dotTitle;
            left.appendChild(dot);
            const nameEl = document.createElement('span');
            nameEl.style.cssText = 'font-size: 13px; color: #83a598; font-weight: 600;';
            nameEl.textContent = ' ' + displayName;
            left.appendChild(nameEl);
            row.appendChild(left);
            const btn = document.createElement('button');
            btn.className = 'layer-btn' + (entry.visible ? ' active' : '');
            btn.style.cssText = 'min-width: 50px; margin-left: 8px; flex-shrink: 0;';
            btn.textContent = entry.visible ? 'ON' : 'OFF';
            btn.addEventListener('click', () => {
                const newVisible = !this.clientLayers[clientId].visible;
                this.setClientLayerVisibility(clientId, newVisible);
                this._updateClientLayerUI();
            });
            row.appendChild(btn);
            container.appendChild(row);
        }
    }

    _formatTimeAgo(timestamp, now) {
        const diff = now - timestamp;
        if (diff < 60000) return '방금';
        if (diff < 3600000) return Math.floor(diff / 60000) + '분 전';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '시간 전';
        return Math.floor(diff / 86400000) + '일 전';
    }

    setupEventListeners() {
        // Window Resize Listener
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });

        // File Drop Support (Phase 1) - Handle GEMINI.md drop
        // Attach to document to ensure we catch drops anywhere in the webview
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.boxShadow = 'inset 0 0 50px #fabd2f'; // Stronger visual feedback
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.boxShadow = 'none';
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.canvas.style.boxShadow = 'none';

            console.log('[SYNAPSE] Drop event detected on document');

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                // Electron might not provide 'path' in restricted contexts, but let's try
                const filePath = file.path || (file.name.endsWith('.md') ? file.name : null);

                console.log('[SYNAPSE] File dropped:', file.name, file.path, file.type);

                if (filePath && filePath.endsWith('.md')) {
                    console.log('[SYNAPSE] Dropped Markdown file:', filePath);
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({
                            command: 'analyzeGemini',
                            filePath: filePath
                        });
                    }
                } else {
                    console.log('[SYNAPSE] Ignored non-md file or missing path:', file);
                }
            } else {
                // Handle VS Code explorer drag & drop (text/uri-list)
                const items = e.dataTransfer.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].kind === 'string') {
                            items[i].getAsString((s) => {
                                console.log('[SYNAPSE] Dropped string content:', s.substring(0, 50) + (s.length > 50 ? '...' : ''));
                                if (s.endsWith('.md')) {
                                    if (typeof vscode !== 'undefined') {
                                        vscode.postMessage({
                                            command: 'analyzeGemini',
                                            filePath: s
                                        });
                                    }
                                }
                            });
                        }
                    }
                }
            }
        });



        // 마우스 휠 (줌)
        this.canvas.addEventListener('wheel', (e) => {
            this.wakeUp();
            this._isInteracting = true; // [v0.2.24] Lock during interaction

            // Interaction Debounce: Reset lock after wheel activity pauses
            if (this._wheelTimeout) clearTimeout(this._wheelTimeout);
            this._wheelTimeout = setTimeout(() => {
                this._isInteracting = false;
                if (this._pendingState) {
                    this.log('[SYNAPSE] Applying deferred projectState after zoom');
                    this.loadProjectState(this._pendingState, true);
                    this._pendingState = null;
                }
            }, 600);

            e.preventDefault();
            e.stopPropagation(); // 브라우저 전체 줌 방지
            // [v0.3.33.8] Use actual deltaY for smooth zooming (fixes trackpad microscope issue)
            const wheelDelta = -e.deltaY / 100;
            this.zoom(wheelDelta, e.offsetX, e.offsetY);
        }, { passive: false });

        // 마우스 드래그 (팬, 노드 드래그, 선택, 엣지 생성)
        this.canvas.addEventListener('mousedown', (e) => {
            if (window._harvestLocked) return;
            this.wakeUp();
            this._isInteracting = true; // [v0.2.24] Lock during interaction
            // [Fix] Ensure canvas receives keyboard focus for keydown events
            this.canvas.focus();

            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            this._debugLastWorldClick = worldPos; // [v0.2.26] Debug indicator
            this.dragStart = { x: e.offsetX, y: e.offsetY };
            this.dragStartAbsolute = { x: e.offsetX, y: e.offsetY }; // [v0.2.20 Fix] Added for jitter tracking

            // 1.1 [v0.3.09_fix] Priority 1: Interactive Badges (Confirm/Delete)
            // Checked before nodes/clusters to prevent interception when badges are close/overlap.
            if (this._confirmBadgeHits) {
                const wx = worldPos.x, wy = worldPos.y;
                for (const hit of this._confirmBadgeHits) {
                    const dist = Math.sqrt((wx - hit.x) ** 2 + (wy - hit.y) ** 2);
                    if (dist <= hit.r * 2.5) {
                        if (!this.isEditMode) {
                            if (typeof vscode !== 'undefined') vscode.postMessage({ command: 'showWarning', message: 'Edit Logic 모드가 꺼져 있습니다.' });
                            return;
                        }
                        if (hit.isPending && typeof vscode !== 'undefined') {
                            vscode.postMessage({ 
                                command: 'requestConfirmEdge', 
                                edgeId: hit.edge.id,
                                fromFile: hit.edge.from,
                                toFile: hit.edge.to
                            });
                            return; // Handled hit
                        }
                    }
                }
            }
            if (this._deleteBadgeHits) {
                const wx = worldPos.x, wy = worldPos.y;
                for (const hit of this._deleteBadgeHits) {
                    const dist = Math.sqrt((wx - hit.x) ** 2 + (wy - hit.y) ** 2);
                    if (dist <= hit.r * 1.5) {
                        if (!this.isEditMode) return;
                        if (typeof vscode !== 'undefined') vscode.postMessage({ command: 'requestDeleteEdgeUI', edgeId: hit.edge.id });
                        else this.deleteEdge(hit.edge.id);
                        return;
                    }
                }
            }

            const topClickedNode = this.getNodeAt(worldPos.x, worldPos.y);

            if (e.button === 0) { // 왼쪽 버튼
                this.wasDragging = false;

                // 1. [v0.2.33] Hit Detection Hierarchy
                // [v0.3.09_fix] Priority 0: Connection Handles (Must be checked before nodes to prevent interception)
                const handle = this.getConnectionHandleAt(worldPos.x, worldPos.y);
                if ((handle && e.altKey) || (this.isCreatingEdge && handle)) {
                    this.isCreatingEdge = true;
                    this.edgeSource = handle;
                    this.edgeCurrentPos = worldPos;
                    return;
                }

                const clickedClusterHeader = this.getClusterHeaderAt(worldPos.x, worldPos.y);

                // 1.2 Cluster Header Buttons (Toggle [+] / [-])
                if (clickedClusterHeader) {
                    const b = clickedClusterHeader._headerBounds;
                    // Only toggle if clicked on the left side where [+] / [-] is drawn
                    if (b && worldPos.x >= b.x && worldPos.x <= b.x + 50) {
                        this.toggleClusterCollapse(clickedClusterHeader.id);
                        return;
                    }
                }

                // 1.3 [v0.2.33] Priority 2: Nodes
                if (topClickedNode) {
                    // [v0.3.11] Layer Filtering: Only select nodes if their layer is visible
                    this.selectedEdge = null;
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        if (this.selectedNodes.has(topClickedNode)) {
                            this.selectedNodes.delete(topClickedNode);
                        } else {
                            this.selectedNodes.add(topClickedNode);
                        }
                        this.selectedNode = null;
                    } else {
                        if (!this.selectedNodes.has(topClickedNode)) {
                            this.selectedNodes.clear();
                            this.selectedNodes.add(topClickedNode);
                        }
                        this.selectedNode = topClickedNode;
                        this._onNodeSelected(topClickedNode); // [DTR] Sync Slider
                    }
                    if (this.isEditMode || e.button === 0) {
                        this.isDragging = true;
                        this.isGraphDataDirty = true;
                    }
                    console.log('[SYNAPSE] Node selected/dragged:', topClickedNode.id);
                    return;
                }

                // 1.4 [v0.2.33] Priority 3: Cluster Header Body (Dragging)
                if (clickedClusterHeader) {
                    this.selectedEdge = null;
                    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                        this.selectedNodes.clear();
                    }
                    // 노드 유무 관계없이 draggingCluster 단일 경로로 통합
                    // mousemove에서 자식 클러스터 트리 전체 + 소속 노드 전체를 이동한다
                    this.draggingCluster = clickedClusterHeader;
                    if (this.isEditMode || e.button === 0) {
                        this.isDragging = true;
                        this.isGraphDataDirty = true;
                    }
                    this.wasDragging = true;
                    console.log('[SYNAPSE] Cluster dragged:', clickedClusterHeader.label);
                    return;
                }

                // 1.5 [v0.2.33] Priority 3: Edges
                const clickedEdge = this.findEdgeAtPoint(worldPos.x, worldPos.y);
                let edgeHit = clickedEdge;
                if (!edgeHit) {
                    for (const edge of this.edges) {
                        if (this.isPointNearCurve(worldPos.x, worldPos.y, edge, 15)) {
                            edgeHit = edge;
                            break;
                        }
                    }
                }
                if (edgeHit && !e.altKey) {
                    this.selectedEdge = edgeHit;
                    this.selectedNode = null;
                    this.selectedNodes.clear();
                    this._onNodeSelected(null);
                    this.render();
                    return;
                }

                // 1.6 Additional Interactive Modes (Add Node / Create Edge)
                if (this.isAddingNode) {
                    this.pendingNodePos = worldPos;
                    const nodeDialog = document.getElementById('node-dialog');
                    if (nodeDialog) {
                        nodeDialog.style.display = 'block';
                        document.getElementById('node-label-input')?.focus();
                    }
                    return;
                }

                // 1.7 [v0.2.33] Priority 4: Background (Box Selection/Pan)
                this.selectedEdge = null;
                this.selectedNode = null;
                this._onNodeSelected(null);
                if (e.button === 0) {
                    this.isSelecting = true;
                    this.selectionRect = { x: e.offsetX, y: e.offsetY, width: 0, height: 0 };
                    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                        this.selectedNodes.clear();
                    }
                }
            } else if (e.button === 2) { // 오른쪽 버튼
                // 오른쪽 클릭 시 노드가 있으면 자동 선택 (이미 여러 개가 선택되어 있지 않을 때만)
                if (topClickedNode && !this.selectedNodes.has(topClickedNode)) {
                    this.selectedNodes.clear();
                    this.selectedNodes.add(topClickedNode);
                    this.selectedNode = topClickedNode;
                }
                this.isPanning = true;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        // [v0.3.10 Fix Planning] Redundant listener removed. Unified into dblclick below line 2442.

        this.canvas.addEventListener('mousemove', (e) => {
            this.lastActivityTime = Date.now(); // Frequent mousemove updates timer but doesn't force wakeUp unless needed
            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            const dx = e.offsetX - this.dragStart.x;
            const dy = e.offsetY - this.dragStart.y;

            // 엣지 생성 모드
            if (this.isCreatingEdge) {
                this.edgeCurrentPos = worldPos;
                if (!this.isEdgeMenuOpen) {
                    const targetHandle = this.getConnectionHandleAt(worldPos.x, worldPos.y);
                    const targetNode = this.getNodeAt(worldPos.x, worldPos.y);
                    const targetCluster = this.getClusterAt(worldPos.x, worldPos.y);

                    if (targetHandle) {
                        this.edgeTarget = targetHandle;
                    } else if (targetNode) {
                        this.edgeTarget = { type: 'node', id: targetNode.id };
                    } else if (targetCluster) {
                        this.edgeTarget = { type: 'cluster', id: targetCluster.id };
                    } else {
                        this.edgeTarget = null;
                    }
                }
                return;
            }

            if (this.isDragging || this.isSelecting || this.isPanning) {
                // 실제 이동 거리가 짧으면 드래그로 간주하지 않음 (지터 방지)
                const totalDx = Math.abs(e.offsetX - this.dragStartAbsolute.x);
                const totalDy = Math.abs(e.offsetY - this.dragStartAbsolute.y);
                if (totalDx > 1 || totalDy > 1) {
                    this.wasDragging = true;
                }
            }

            if (this.isDragging) {
                // 노드 이동
                const worldDx = dx / this.transform.zoom;
                const worldDy = dy / this.transform.zoom;
                const affectedClusterIds = new Set();
                if (this.draggingCluster) {
                    // 어떤 클러스터든 동일: 자신 + 모든 자식·손자 클러스터 position + 소속 노드 전체 이동
                    const subtreeIds = new Set();
                    const collectIds = (cid) => {
                        subtreeIds.add(cid);
                        if (this.clusters) {
                            for (const c of this.clusters) {
                                if (c.parent_id === cid) collectIds(c.id);
                            }
                        }
                    };
                    collectIds(this.draggingCluster.id);
                    // 클러스터 position 이동
                    for (const cluster of this.clusters) {
                        if (!subtreeIds.has(cluster.id)) continue;
                        if (!cluster.position) cluster.position = { x: cluster.x || 0, y: cluster.y || 0 };
                        cluster.position.x += worldDx;
                        cluster.position.y += worldDy;
                        cluster.x = cluster.position.x;
                        cluster.y = cluster.position.y;
                        affectedClusterIds.add(cluster.id);
                    }
                    // 소속 노드 이동
                    for (const node of this.nodes) {
                        const cid = node.cluster_id || node.data?.cluster_id;
                        if (cid && subtreeIds.has(cid) && node.position) {
                            node.position.x += worldDx;
                            node.position.y += worldDy;
                        }
                    }
                } else {
                    for (const node of this.selectedNodes) {
                        node.position.x += worldDx;
                        node.position.y += worldDy;
                        const cid = node.cluster_id || (node.data && node.data.cluster_id);
                        if (cid) affectedClusterIds.add(cid);
                    }
                }
                // 실시간 클러스터 바운딩 박스 업데이트 (최상위 부모부터 재귀적 갱신)
                if (this.clusters) {
                    const topLevelIds = new Set();
                    for (let cid of affectedClusterIds) {
                        let cur = this.clusters.find(c => c.id === cid);
                        while (cur && cur.parent_id) {
                            const parent = this.clusters.find(c => c.id === cur.parent_id);
                            if (parent) cur = parent;
                            else break;
                        }
                        if (cur) topLevelIds.add(cur.id);
                    }
                    for (const cid of topLevelIds) {
                        const cluster = this.clusters.find(c => c.id === cid);
                        if (cluster) this.computeClusterBounds(cluster);
                    }
                }
                this.isGraphDataDirty = true; // Nodes moved, need buffer update in WebGL
                this.dragStart = { x: e.offsetX, y: e.offsetY };
            } else if (this.isSelecting) {
                // 드래그 선택 영역 업데이트
                this.selectionRect.width = e.offsetX - this.selectionRect.x;
                this.selectionRect.height = e.offsetY - this.selectionRect.y;
            } else if (this.isPanning) {
                // 캔버스 팬
                this.pan(dx, dy);
                this.dragStart = { x: e.offsetX, y: e.offsetY };
            } else {
                // [v0.2.24] 🚀 Throttle tooltip and hit detection logic to save CPU
                const now = Date.now();
                if (now - (this._lastHoverCheck || 0) > 50) {
                    this._lastHoverCheck = now;
                    const _perfHitStart = performance.now();
                    // 🔍 툴팁 처리 (Phase 4)
                    const edge = this.findEdgeAtPoint(worldPos.x, worldPos.y);
                    const node = this.getNodeAt(worldPos.x, worldPos.y);
                    const _perfHitEnd = performance.now();
                    
                    if (_perfHitEnd - _perfHitStart > 5) {
                        console.log(`[PERF] Interaction HitTest: ${(_perfHitEnd - _perfHitStart).toFixed(2)}ms`);
                    }

                    this.hoveredEdge = edge;
                    this.hoveredNode = node;

                    // [v0.3.17] Node Summary Logic
                    if (node) {
                        const stats = this.nodeStatsMap.get(node.id);
                        if (stats) {
                            // [v0.3.22.9] Senior's Prescription: 100ms Debounce to prevent 
                            // race conditions with Batch Validation and Flow Data refresh.
                            this._tooltipTimer = setTimeout(() => {
                                const screenX = e.clientX;
                                const screenY = e.clientY;
                                const edgeReason = (edge && edge._validationReason) ? edge._validationReason : null;
                                this.showNodeSummary(screenX, screenY, node, stats, edgeReason);
                            }, 100);
                        } else {
                            if (this._tooltipTimer) clearTimeout(this._tooltipTimer);
                            this.hideNodeSummary();
                        }
                        this.hideTooltip(); // Hide edge tooltip when node is hovered
                    } else {
                        this.hideNodeSummary();
                        if (edge && edge._validationReason) {
                            this.showTooltip(e.clientX, e.clientY, edge._validationReason);
                        } else {
                            this.hideTooltip();
                        }
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            // 엣지 생성 완료
            if (this.isCreatingEdge) {
                if (this.edgeSource && this.edgeTarget &&
                    this.edgeTarget.id !== this.edgeSource.id) {
                    this.showEdgeTypeSelector(e.clientX, e.clientY);
                } else {
                    this.isCreatingEdge = false;
                    this.edgeSource = null;
                    this.edgeTarget = null;
                }
                return;
            }
            if (this.isSelecting) {
                this.isSelecting = false;
                // 드래그 선택 영역에 포함된 노드 추가
                const rectWorldStart = this.screenToWorld(this.selectionRect.x, this.selectionRect.y);
                const rectWorldEnd = this.screenToWorld(this.selectionRect.x + this.selectionRect.width, this.selectionRect.y + this.selectionRect.height);

                const minX = Math.min(rectWorldStart.x, rectWorldEnd.x);
                const minY = Math.min(rectWorldStart.y, rectWorldEnd.y);
                const maxX = Math.max(rectWorldStart.x, rectWorldEnd.x);
                const maxY = Math.max(rectWorldStart.y, rectWorldEnd.y);

                if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                    this.selectedNodes.clear();
                }

                for (const node of this.nodes) {
                    // Check if node is hidden by a collapsed cluster or ancestor [v0.3.32.4]
                    if (node.cluster_id) {
                        const cluster = this.clusters.find(c => c.id === node.cluster_id);
                        if (cluster && cluster.collapsed) continue;
                        if (cluster && cluster.parent_id) {
                            let cur = cluster; let skip = false;
                            while (cur && cur.parent_id) {
                                const par = this.clusters.find(x => x.id === cur.parent_id);
                                if (par && par.collapsed) { skip = true; break; }
                                cur = par;
                            }
                            if (skip) continue;
                        }
                    }

                    const nodeWidth = 120;
                    const nodeHeight = 60;
                    // node.position.x/y 사용
                    if (node.position.x < maxX && node.position.x + nodeWidth > minX &&
                        node.position.y < maxY && node.position.y + nodeHeight > minY) {
                        this.selectedNodes.add(node);
                    }
                }
                this.render(); // [v0.2.34] Refresh 2D UI after box selection

                // [v0.2.20 Fix] Removed invalid saveState() call here.
                // Saving state triggers a full JSON reload which overwrote Node objects with new ones.
                // This caused 'selectedNodes' to contain dead references, breaking subsequent drag logic.
            } else if (this.isDragging) {
                const didDrag = this.wasDragging;
                if (didDrag) {
                    // [v0.3.15] Apply Snap-to-Grid during interaction (Grid Sovereignty)
                    const GRID = this.GRID_SNAP_SIZE || 20;
                    const draggedNodes = Array.from(this.selectedNodes);
                    draggedNodes.forEach(node => {
                        if (node.position) {
                            node.position.x = Math.round(node.position.x / GRID) * GRID;
                            node.position.y = Math.round(node.position.y / GRID) * GRID;
                        }
                    });

                    const clusterIds = new Set(draggedNodes.map(n => n.cluster_id).filter(id => id));
                    let movedByIntruder = false;
                    for (const cid of clusterIds) {
                        if (this.repositionIntruders(cid)) {
                            movedByIntruder = true;
                        }
                    }

                    // [v0.3.16 Fix] Scale drag dist by zoom so zooming out doesn't break drag-save
                    const totalDx = e.offsetX - this.dragStartAbsolute.x;
                    const totalDy = e.offsetY - this.dragStartAbsolute.y;
                    const absDragDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy) / (this.transform.zoom || 1.0);

                    if (absDragDist > 5 || movedByIntruder) {
                        this.saveState();
                        // Mark nodes as user-positioned
                        draggedNodes.forEach(n => n.positionSource = 'user');
                        this.saveWorkspace();
                        this.buildSpatialIndex(); // [v0.3.33] Phase 3A: Update spatial index after drag
                    }
                }
                this.isDragging = false;
                this.wasDragging = false;
                this.draggingCluster = null;
                this._lastDragEndTime = Date.now();
                this.activeNodeId = null;
                this.dragTarget = null;
                this.canvas.style.cursor = 'default';
            } else if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }

            // [v0.2.24] End Interaction Lock and apply any deferred updates
            this._isInteracting = false;
            if (this._pendingState) {
                // [v0.3.22.11] Protect manual position: 
                // If we just finished a drag (didDrag=true) OR within 300ms of end, 
                // discard pending state which is likely stale.
                const withinDragGrace = (Date.now() - (this._lastDragEndTime || 0)) < 300;
                if (didDrag || withinDragGrace) {
                    this.log('[SYNAPSE] Discarding stale pendingState after drag to preserve manual positions');
                    this._pendingState = null;
                } else {
                    this.log('[SYNAPSE] Applying deferred projectState after interaction end');
                    this.loadProjectState(this._pendingState, true);
                    this._pendingState = null;
                }
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isSelecting = false;
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        });

        // Delete 키로 선택된 노드/엣지 삭제 및 방향키 내비게이션
        document.addEventListener('keydown', (e) => {
            if (window._harvestLocked) return;

            // [v0.3.11 Fix] Input Focus Protection
            // Block canvas shortcuts if an input modal is open or an input is focused.
            const isDialogVisible = document.getElementById('input-dialog')?.style.display === 'block';
            if (isDialogVisible || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                console.log(`[SYNAPSE-FRONT] Keydown detected: ${e.key}. Selected nodes: ${this.selectedNodes.size}`);
                if (this.selectedEdge) {
                    console.log('[SYNAPSE] Deleting edge:', this.selectedEdge.id);
                    this.deleteEdge(this.selectedEdge.id);
                    return;
                }
                if (this.selectedNodes.size > 0) {
                    console.log(`[SYNAPSE] Deleting ${this.selectedNodes.size} selected nodes`);
                    this.deleteSelectedNodes();
                    return;
                }
            }

            // [v0.3.32.2] Debug Visibility Hotkeys
            if (e.shiftKey) {
                if (e.key === 'E' || e.key === 'e') {
                    window.edgeVisibilityMode = (window.edgeVisibilityMode === 'NO_EDGES') ? 'NORMAL' : 'NO_EDGES';
                    this.isGraphDataDirty = true;
                    this.log(`[DEBUG] Edge Visibility: ${window.edgeVisibilityMode}`);
                    return;
                }
                if (e.key === 'C' || e.key === 'c') {
                    this.debugClusterColorMode = !this.debugClusterColorMode;
                    this.isGraphDataDirty = true;
                    this.log(`[DEBUG] Cluster Color Mode: ${this.debugClusterColorMode}`);
                    return;
                }
                if (e.key === 'S' || e.key === 's') {
                    const uniqueX = new Set();
                    const uniqueY = new Set();
                    let atOrigin = 0;
                    this.nodes.forEach(n => {
                        if (n.position) {
                            if (n.position.x === 0 && n.position.y === 0) atOrigin++;
                            uniqueX.add(n.position.x);
                            uniqueY.add(n.position.y);
                        }
                    });
                    const clusters = new Set(this.nodes.map(n => n.cluster_id).filter(Boolean));
                    const statsMsg = `[LAYOUT STATS] Nodes: ${this.nodes.length}, Edges: ${this.edges.length}, UniqueX: ${uniqueX.size}, UniqueY: ${uniqueY.size}, Origin: ${atOrigin}, Clusters: ${clusters.size}`;
                    this.log(statsMsg, 'info');
                    alert(statsMsg);
                    return;
                }
            }

            // 방향키 내비게이션 (Phase 7)
            const panStep = e.shiftKey ? 200 : 50;
            let moved = false;

            switch (e.key) {
                case 'ArrowLeft':
                    this.pan(panStep, 0);
                    moved = true;
                    break;
                case 'ArrowRight':
                    this.pan(-panStep, 0);
                    moved = true;
                    break;
                case 'ArrowUp':
                    this.pan(0, panStep);
                    moved = true;
                    break;
                case 'ArrowDown':
                    this.pan(0, -panStep);
                    moved = true;
                    break;
            }

            if (moved) {
                e.preventDefault();
                this.render();
            }
        });

        // 컨텍스트 메뉴 제어
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            // 선택된 엣지가 있으면 엣지 컨텍스트 메뉴 표시
            if (this.selectedEdge) {
                this.showEdgeContextMenu(e.clientX, e.clientY);
                return;
            }

            // 안 선택되었어도, 우클릭 위치에 엣지가 있는지 판별
            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            let clickedEdge = this.findEdgeAtPoint(worldPos.x, worldPos.y);

            // Hit detection fallback for edge selection
            if (!clickedEdge) {
                // Try looser tolerance if not found initially
                for (const edge of this.edges) {
                    if (this.isPointNearCurve(worldPos.x, worldPos.y, edge, 25)) {
                        clickedEdge = edge;
                        break;
                    }
                }
            }

            if (clickedEdge) {
                this.selectedEdge = clickedEdge;
                this.selectedNode = null;
                this.selectedNodes.clear();
                this.render();
                this.showEdgeContextMenu(e.clientX, e.clientY);
                return;
            }

            // 아니면 노드 컨텍스트 메뉴
            const topClickedNode = this.getNodeAt(worldPos.x, worldPos.y);

            this.showContextMenu(e.clientX, e.clientY, topClickedNode);
        });
        this.canvas.addEventListener('click', (e) => {
            if (this.wasDragging) {
                this.wasDragging = false;
                return;
            }

            const worldPosClick = this.screenToWorld(e.offsetX, e.offsetY);
            this._debugLastWorldClick = worldPosClick; // [v0.2.26] Debug indicator
            const hasModifier = e.shiftKey || e.ctrlKey || e.metaKey;

            if (this.currentMode === 'tree') {
                // Tree 모드
                if (!this.treeData) return;
                const clickedItem = this.treeRenderer.getItemAt(this.treeData, worldPosClick.x, worldPosClick.y);

                if (clickedItem) {
                    if (clickedItem.type === 'folder') {
                        this.treeRenderer.toggleFolder(clickedItem.fullPath);
                        this.treeData = this.treeRenderer.buildTree(this.nodes, this.projectName || 'Project');
                    } else if (clickedItem.type === 'file' && clickedItem.node && !hasModifier) {
                        // Single click only selects in Tree mode as well to maintain consistency
                        this.selectedNodes.clear();
                        this.selectedNodes.add(clickedItem.node);
                        this.selectedNode = clickedItem.node;
                    }
                }
            } else if (this.currentMode === 'flow') {
                // Flow 모드
                if (!this.flowData) return;
                const clickedStep = this.flowRenderer.getStepAt(this.flowData, worldPosClick.x, worldPosClick.y);

                if (clickedStep && clickedStep.node && !hasModifier) {
                    this.selectedNodes.clear();
                    this.selectedNodes.add(clickedStep.node);
                    this.selectedNode = clickedStep.node;
                }
            } else {
                // Graph 모드
                const topClickedNode = this.getNodeAt(worldPosClick.x, worldPosClick.y);

                if (!topClickedNode && !hasModifier) {
                    // 빈 공간 클릭 시 선택 해제
                    this.selectedNode = null;
                    this.selectedNodes.clear();
                    this.selectedEdge = null;
                }
            }
            this.render();
        });

        // [v0.3.10 Fix] Master dblclick listener for all modes
        this.canvas.addEventListener('dblclick', (e) => {
            const worldPosDbl = this.screenToWorld(e.offsetX, e.offsetY);

            if (this.currentMode === 'tree') {
                const clickedItem = this.treeRenderer.getItemAt(this.treeData, worldPosDbl.x, worldPosDbl.y);
                if (clickedItem && clickedItem.type === 'file' && clickedItem.node) {
                    this.handleOpenFile(clickedItem.node.data.path || clickedItem.node.data.file, clickedItem.node.data.clientUsername);
                }
            } else if (this.currentMode === 'flow') {
                const clickedStep = this.flowRenderer.getStepAt(this.flowData, worldPosDbl.x, worldPosDbl.y);
                if (clickedStep && clickedStep.node) {
                    this.handleOpenFile(clickedStep.node.data.path || clickedStep.node.data.file, clickedStep.node.data.clientUsername);
                }
            } else {
                const topClickedNode = this.getNodeAt(worldPosDbl.x, worldPosDbl.y);
                if (topClickedNode) {
                    // [v0.3.10-LOCK] Robust fallback for filePath: data.path -> data.file -> node.file -> data.label -> node.id
                    const d = topClickedNode.data || {};
                    const targetFile = d.path || d.file || topClickedNode.file || d.label || 
                                      ((topClickedNode.type === 'file' || topClickedNode.type === 'logic') && !String(topClickedNode.id).startsWith('node_manual_') ? topClickedNode.id : null);
                    
                    if (targetFile) {
                        this.handleOpenFile(targetFile, d.clientUsername);
                    }
                    return; // Prevent fall-through to cluster header
                }

                // [v0.3.10 Fix] Only rename cluster if specifically double-clicking the HEADER
                const clickedClusterHeader = this.getClusterHeaderAt(worldPosDbl.x, worldPosDbl.y);
                if (clickedClusterHeader) {
                    this.renameCluster(clickedClusterHeader.id);
                    return;
                }

                // Check for edge double click
                const clickedEdge = this.findEdgeAtPoint(worldPosDbl.x, worldPosDbl.y);
                if (clickedEdge) {
                    // [v0.2.26] Edge Double Click: Logic Confirmation
                    if (clickedEdge.status === 'pending') {
                        this.requestConfirmEdge(clickedEdge.id);
                    } else {
                        // If not pending, show context menu
                        this.showEdgeContextMenu(e.clientX, e.clientY);
                    }
                } else {
                    // Empty space dblclick -> Reset View
                    this.fitView();
                }
            }
        });

        // [v0.2.21] WebGL Acceleration Toggle Moved to setupToolbarListeners
    }

    zoom(wheelDelta, centerX, centerY) {

        const oldZoom = this.transform.zoom;
        // [v0.3.33.9] Fix: Truly smooth exponential zooming for trackpads
        // Math.exp allows continuous scaling without massive jumps at tiny zoom levels
        let wDelta = wheelDelta;
        if (wheelDelta === 0.9) wDelta = -1;
        else if (wheelDelta === 1.1) wDelta = 1;

        const zoomFactor = Math.exp(wDelta * 0.15);
        this.transform.zoom *= zoomFactor;
        
        const minZoom = 0.001; // Match fitCameraToBounds
        this.transform.zoom = Math.max(minZoom, Math.min(5.0, this.transform.zoom));

        // 줌 중심점 조정
        const zoomRatio = this.transform.zoom / oldZoom;
        this.transform.offsetX = centerX - (centerX - this.transform.offsetX) * zoomRatio;
        this.transform.offsetY = centerY - (centerY - this.transform.offsetY) * zoomRatio;

        this.updateZoomDisplay();
        this.wakeUp();
    }

    pan(dx, dy) {
        this.transform.offsetX += dx;
        this.transform.offsetY += dy;
        this.wakeUp();
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.transform.offsetX) / this.transform.zoom,
            y: (screenY - this.transform.offsetY) / this.transform.zoom
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.transform.zoom + this.transform.offsetX,
            y: worldY * this.transform.zoom + this.transform.offsetY
        };
    }

    getNodeAt(worldX, worldY) {
        const _tIndex = performance.now();
        // [v0.2.16] Mode-specific hit testing for better hover support
        if (this.currentMode === 'flow' && this.flowRenderer && this.flowData) {
            const step = this.flowRenderer.getStepAt(this.flowData, worldX, worldY);
            return step ? step.node : null;
        }

        if (this.currentMode === 'tree' && this.treeRenderer && this.treeData) {
            const item = this.treeRenderer.getItemAt(this.treeData, worldX, worldY);
            return item ? item.node : null;
        }

        // [v0.3.33] Phase 3A: rbush Node Spatial Index Hit Test
        const PADDING = 15; // Max padding
        const queryRes = this.spatialIndex ? this.spatialIndex.queryViewport(worldX - PADDING, worldY - PADDING, worldX + PADDING, worldY + PADDING, 'nodes') : null;
        const searchNodes = queryRes 
            ? Array.from(queryRes)
            : ((this.bootstrapMode && this.lastFrameState) ? this.lastFrameState.nodes : this.nodes);

        // REVERSE order to hit top nodes first
        for (let i = searchNodes.length - 1; i >= 0; i--) {
            const node = searchNodes[i];
            const nodeWidth = node._width || 120;
            const nodeHeight = 60;
            const isSelected = this.selectedNodes.has(node);
            const HIT_PADDING = isSelected ? 15 : 0; // [v0.2.32] Extra 15px grab area for selected nodes

            // Check if node is hidden (collapsed cluster or ancestor collapsed) [v0.3.32.4]
            if (node.cluster_id) {
                const cluster = this.clusters?.find(c => c.id === node.cluster_id);
                if (cluster && cluster.collapsed) continue;
                // Check ancestor collapsed
                if (cluster && cluster.parent_id) {
                    let cur = cluster;
                    let hiddenByAncestor = false;
                    while (cur && cur.parent_id) {
                        const par = this.clusters.find(x => x.id === cur.parent_id);
                        if (par && par.collapsed) { hiddenByAncestor = true; break; }
                        cur = par;
                    }
                    if (hiddenByAncestor) continue;
                }
            }

            if (!node.position) continue;

            const nodeRenderY = this._getNodeRenderY ? this._getNodeRenderY(node) : node.position.y;
            const left = node.position.x - HIT_PADDING;
            const right = node.position.x + nodeWidth + HIT_PADDING;
            const top = nodeRenderY - HIT_PADDING;
            const bottom = nodeRenderY + nodeHeight + HIT_PADDING;

            if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
                if (this._frameCounter % 60 === 0) console.log(`[PERF] HitTestTime: ${(performance.now() - _tIndex).toFixed(2)}ms`);
                return node;
            }
        }
        if (this._frameCounter % 60 === 0) console.log(`[PERF] HitTestTime: ${(performance.now() - _tIndex).toFixed(2)}ms`);
        return null;
    }

    getClusterAt(worldX, worldY) {
        if (!this.clusters) return null;

        // 역순으로 검사 (위에 그려진 클러스터 우선)
        for (let i = this.clusters.length - 1; i >= 0; i--) {
            const cluster = this.clusters[i];

            // [v0.3.33] Phase 5: Cluster Render Eligibility
            if (!this._canRenderCluster(cluster)) continue;

            // _bodyBounds나 _headerBounds를 활용한 더 정확한 판별
            if (cluster._headerBounds) {
                const b = cluster._headerBounds;
                if (worldX >= b.x && worldX <= b.x + b.width &&
                    worldY >= b.y && worldY <= b.y + b.height + (cluster.collapsed ? 0 : cluster._bodyHeight || 0)) {
                    return cluster;
                }
            }

            const clusterNodes = this.nodes.filter(n => n.cluster_id === cluster.id);
            if (clusterNodes.length === 0) continue;

            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            const padding = 20;

            for (const node of clusterNodes) {
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + 120);
                maxY = Math.max(maxY, node.position.y + 60);
            }

            // 클러스터 박스 영역 (배경 또는 라벨 영역)
            if (worldX >= minX - padding && worldX <= maxX + padding &&
                worldY >= minY - padding - 30 && worldY <= maxY + padding) {
                return cluster;
            }
        }
        return null;
    }

    getClusterHeaderAt(worldX, worldY) {
        if (!this.clusters) return null;

        // 헤더가 hit된 클러스터들을 모두 수집한 뒤 depth가 가장 얕은 것을 반환한다.
        // 이렇게 해야 루트 클러스터 헤더를 클릭했을 때 자식이 아닌 루트가 선택된다.
        let best = null;
        let bestDepth = Infinity;
        for (let i = this.clusters.length - 1; i >= 0; i--) {
            const cluster = this.clusters[i];
            // Resolver 모드: _visibleGraphClusterIds 기준으로 가시성 판단
            // 일반 모드: _canRenderCluster 기준
            const isVisible = this._visibleGraphClusterIds
                ? this._visibleGraphClusterIds.has(cluster.id)
                : this._canRenderCluster(cluster);
            if (!isVisible) continue;
            if (!cluster._headerBounds) continue;
            const b = cluster._headerBounds;
            if (worldX >= b.x && worldX <= b.x + b.width &&
                worldY >= b.y && worldY <= b.y + b.height) {
                const depth = this.clusterHierarchy
                    ? this.clusterHierarchy.getDepth(cluster.id)
                    : 0;
                if (depth < bestDepth) {
                    best = cluster;
                    bestDepth = depth;
                }
            }
        }
        return best;
    }


    getConnectionHandleAt(worldX, worldY) {
        // 노드 핸들 체크
        for (const node of this.nodes) {
            if (!node.position) continue;
            const nodeRenderY = this._getNodeRenderY ? this._getNodeRenderY(node) : node.position.y;
            const centerX = node.position.x + 60;
            const centerY = nodeRenderY + 30;

            // 4방향 핸들 (상, 하, 좌, 우)
            const handles = [
                { x: centerX, y: nodeRenderY, type: 'node', id: node.id }, // 상
                { x: centerX, y: nodeRenderY + 60, type: 'node', id: node.id }, // 하
                { x: node.position.x, y: centerY, type: 'node', id: node.id }, // 좌
                { x: node.position.x + 120, y: centerY, type: 'node', id: node.id } // 우
            ];

            for (const h of handles) {
                const dist = Math.sqrt((worldX - h.x) ** 2 + (worldY - h.y) ** 2);
                if (dist < 10 / this.transform.zoom) return h;
            }
        }

        // 클러스터 핸들 체크
        if (this.clusters) {
            for (const cluster of this.clusters) {
                const clusterNodes = this.nodes.filter(n => (n.data && n.data.cluster_id === cluster.id) || n.cluster_id === cluster.id);
                if (clusterNodes.length === 0) continue;

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                const padding = 20;
                for (const node of clusterNodes) {
                    minX = Math.min(minX, node.position.x);
                    minY = Math.min(minY, node.position.y);
                    maxX = Math.max(maxX, node.position.x + 120);
                    maxY = Math.max(maxY, node.position.y + 60);
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                const handles = [
                    { x: centerX, y: minY - padding, type: 'cluster', id: cluster.id },
                    { x: centerX, y: maxY + padding, type: 'cluster', id: cluster.id },
                    { x: minX - padding, y: centerY, type: 'cluster', id: cluster.id },
                    { x: maxX + padding, y: centerY, type: 'cluster', id: cluster.id }
                ];

                for (const h of handles) {
                    const dist = Math.sqrt((worldX - h.x) ** 2 + (worldY - h.y) ** 2);
                    if (dist < 15 / this.transform.zoom) return h;
                }
            }
        }

        return null;
    }

    repositionIntruders(clusterId) {
        const cluster = this.clusters.find(c => c.id === clusterId);
        if (!cluster) return;

        const clusterNodes = this.nodes.filter(n => (n.data && n.data.cluster_id === cluster.id) || n.cluster_id === cluster.id);
        if (clusterNodes.length === 0) return;

        // 클러스터 영역 계산
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        const padding = 20;

        for (const node of clusterNodes) {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + 120);
            maxY = Math.max(maxY, node.position.y + 60);
        }

        const intruderPadding = 40; // 밀어낼 때의 추가 여백

        // 소속되지 않았으면서 영역 안에 있는 노드 찾기
        let movedAny = false;
        for (const node of this.nodes) {
            if ((node.data && node.data.cluster_id === cluster.id) || node.cluster_id === cluster.id) continue;

            const nx = node.position.x;
            const ny = node.position.y;
            const nw = 120;
            const nh = 60;

            // 충돌 검사 (AABB)
            if (nx + nw >= minX - padding && nx <= maxX + padding &&
                ny + nh >= minY - padding && ny <= maxY + padding) {

                // 침범 발생 -> 아래쪽으로 밀어내기 (가장 간단한 전략)
                node.position.y = maxY + padding + intruderPadding;
                movedAny = true;
                // console.log(`[SYNAPSE] Pushing intruder node '${node.data?.label}' out of ${cluster.label}`);
            }
        }

        return movedAny;
    }

    computeClusterBounds(cluster, visited = new Set()) {
        if (!this._lastComputedBounds) this._lastComputedBounds = new Map();
        if (visited.has(cluster.id)) return this._lastComputedBounds.get(cluster.id);
        visited.add(cluster.id);

        const directNodes = this.nodes.filter(n => {
            const cid = n.cluster_id || (n.data && n.data.cluster_id) || '';
            return cid === cluster.id && cid !== '';
        });

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        const padding = 30;
        let hasVisibleContent = false;


        for (const node of directNodes) {
            if (!node.position) continue;

            if (!this._isClientLayerVisible(node)) continue;
            
            const isExternalNode = node.layer === 'external' || (node.data && node.data.layer === 'external') || node.type === 'external' || node.status === 'ghost' || (node.cluster_id && node.cluster_id.startsWith('cluster_ghost'));
            const isUserNode = node.layer === 'user' || (node.data && node.data.layer === 'user') || (node.id && typeof node.id === 'string' && node.id.startsWith('node_manual_')) || (node.cluster_id && typeof node.cluster_id === 'string' && node.cluster_id.startsWith('sys_') && node.cluster_id !== 'sys_cluster_reserved' && node.cluster_id !== 'sys_cluster_buffer');

            if (isExternalNode && !this.showExternalLayer) continue;
            if (isUserNode && !this.showUserLayer) continue;
            if (!isExternalNode && !isUserNode && !this.showBaseLayer) continue;

            if (this.hideLeafNodes) {
                const stats = this.nodeStatsMap.get(node.id);
                if (stats && stats.primaryRole === 'Leaf node') continue;
            }

            if (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)) continue;

            hasVisibleContent = true;
            const nodeRenderY = node.position.y + this.getClientLayerOffset(node.clientLayer || (node.data && node.data.clientLayer));
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, nodeRenderY);
            maxX = Math.max(maxX, node.position.x + 120);
            maxY = Math.max(maxY, nodeRenderY + 60);
        }

        const childClusters = this.clusters.filter(c => c.parent_id === cluster.id);
        for (const child of childClusters) {
            const b = this.computeClusterBounds(child, visited);
            if (b && b.minX !== Infinity && !b.isEmpty) {
                hasVisibleContent = true;
                minX = Math.min(minX, b.minX - padding);
                minY = Math.min(minY, b.minY - padding);
                maxX = Math.max(maxX, b.maxX + padding);
                maxY = Math.max(maxY, b.maxY + padding);
            }
        }

        if (!hasVisibleContent) {
            this._lastComputedBounds?.delete(cluster.id);
            cluster.bounds = null;
            return null;
        }
        const bounds = { minX, minY, maxX, maxY, isEmpty: false };
        this._lastComputedBounds.set(cluster.id, bounds);
        cluster.bounds = bounds;
        return bounds;
    }

    showContextMenu(x, y, node) {
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // 노드 관련 메뉴 필터링
        const copyIdItem = document.getElementById('menu-copy-id');
        const inspectNodeItem = document.getElementById('menu-inspect-node');
        const inspectEdgeItem = document.getElementById('menu-inspect-edge');

        if (node) {
            copyIdItem.style.display = 'block';
            inspectNodeItem.style.display = 'block';
            inspectEdgeItem.style.display = 'none';

            copyIdItem.onclick = () => {
                navigator.clipboard.writeText(node.id).then(() => {
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({ command: 'showMessage', text: `Node ID copied: ${node.id}` });
                    }
                });
            };

            inspectNodeItem.onclick = () => {
                const info = `ID: ${node.id}\nLabel: ${node.data?.label || 'N/A'}\nFile: ${node.data?.file || 'None'}\nType: ${node.type || 'N/A'}\nCluster: ${node.data?.cluster_id || 'Root'}`;
                if (typeof vscode !== 'undefined') {
                    vscode.postMessage({ command: 'showMessage', text: `[NODE INSPECT]\n${info}` });
                } else {
                    alert(`[NODE INSPECT]\n${info}`);
                }
            };
        } else if (this.selectedEdge) {
            copyIdItem.style.display = 'none';
            inspectNodeItem.style.display = 'none';
            inspectEdgeItem.style.display = 'block';

            inspectEdgeItem.onclick = () => {
                const edge = this.selectedEdge;
                const info = `ID: ${edge.id}\nFrom: ${edge.source || edge.from}\nTo: ${edge.target || edge.to}\nType: ${edge.type || 'N/A'}`;
                if (typeof vscode !== 'undefined') {
                    vscode.postMessage({ command: 'showMessage', text: `[EDGE INSPECT]\n${info}` });
                } else {
                    alert(`[EDGE INSPECT]\n${info}`);
                }
            };
        } else {
            copyIdItem.style.display = 'none';
            inspectNodeItem.style.display = 'none';
            inspectEdgeItem.style.display = 'none';
        }

        const openItem = document.getElementById('menu-open');
        if (node) {
            openItem.style.display = 'block';
            openItem.onclick = () => {
                if (node.data.file) {
                    const filePath = node.data.file;
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({ command: 'openFile', filePath });
                    } else if (typeof window.showFilePreview === 'function') {
                        window.showFilePreview(filePath);
                    }
                }
            };
        } else {
            openItem.style.display = 'none';
        }

        const flowItem = document.getElementById('menu-generate-flow');
        if (node) {
            flowItem.style.display = 'block';
            flowItem.onclick = () => {
                this.generateFlow(node);
            };
        } else {
            flowItem.style.display = 'none';
        }

        document.getElementById('menu-group').onclick = () => {
            this.groupSelection();
        };

        document.getElementById('menu-ungroup').onclick = () => {
            this.ungroupSelection();
        };

        const deleteItem = document.getElementById('menu-delete-node');
        if (node || this.selectedNodes.size > 0 || this.selectedEdge) {
            deleteItem.style.display = 'block';

            // Context-aware label
            const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
            const deleteIcon = theme ? theme.STATUS.DELETED.icon : '❌';
            if (this.selectedEdge) {
                deleteItem.textContent = `${deleteIcon} Delete Edge`;
            } else if (this.selectedNodes.size > 1) {
                deleteItem.textContent = `${deleteIcon} Delete ${this.selectedNodes.size} Nodes`;
            } else {
                deleteItem.textContent = `${deleteIcon} Delete Node`;
            }

            deleteItem.onclick = () => {
                if (this.selectedEdge) {
                    this.deleteEdge(this.selectedEdge.id);
                } else if (this.selectedNodes.size > 1) {
                    this.deleteSelectedNodes();
                } else if (node) {
                    this.deleteNode(node.id);
                }
                this.hideContextMenu();
            };
        } else {
            deleteItem.style.display = 'none';
        }

        document.getElementById('menu-snapshot').onclick = () => {
            const label = prompt('Snapshot label:', 'Manual Snapshot');
            if (label) this.takeSnapshot(label);
        };
    }

    /**
     * 엣지 검증 로직 - 논리적 정합성 체크
     * @param {Object} edge - 검증할 엣지 객체
     * @param {Object} sourceNode - 소스 노드
     * @param {Object} targetNode - 타겟 노드
     * @returns {Object} { valid: boolean, color: string, reason: string }
     */
    validateEdge(edge, sourceNode, targetNode) {
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        if (!sourceNode || !targetNode) {
            return { valid: true, color: edge.visual?.color || (theme ? theme.EDGES.DEPENDENCY.color : '#83a598'), reason: 'Unknown nodes' };
        }

        // 파일 확장자 추출
        const getFileExt = (node) => {
            const filePath = node.data?.file || node.data?.path || '';
            const match = filePath.match(/\.([^.]+)$/);
            return match ? match[1].toLowerCase() : '';
        };

        const sourceExt = getFileExt(sourceNode);
        const targetExt = getFileExt(targetNode);
        const edgeType = edge.type || 'dependency';

        // 규칙 1: 타입 불일치 감지
        // SQL 파일을 "호출"하는 것은 논리적으로 불가능
        if (edgeType === 'call' && (targetExt === 'sql' || targetExt === 'json')) {
            return {
                valid: false,
                color: '#fb4934', // 빨간색 (에러)
                reason: `Cannot call ${targetExt.toUpperCase()} file`
            };
        }

        // 규칙 2: 방향성 검증
        // 스키마 파일(.sql, .json)이 소스인 경우 경고
        const schemaExtensions = ['sql', 'json', 'yaml', 'yml'];
        const codeExtensions = ['py', 'js', 'ts', 'jsx', 'tsx'];

        if (schemaExtensions.includes(sourceExt) && codeExtensions.includes(targetExt)) {
            // 스키마 → 코드 방향은 의심스러움
            if (edgeType === 'dependency' || edgeType === 'call') {
                return {
                    valid: true,
                    color: '#fabd2f', // 노란색 (경고)
                    reason: `Unusual: Schema file referencing code`
                };
            }
        }

        // 규칙 3: Data Flow 방향 검증
        // 코드 → 스키마로 데이터가 흐르는 것은 부자연스러움
        if (edgeType === 'data_flow') {
            if (codeExtensions.includes(sourceExt) && schemaExtensions.includes(targetExt)) {
                return {
                    valid: true,
                    color: '#fabd2f', // 노란색 (경고)
                    reason: `Unusual data flow: Code → Schema`
                };
            }
        }

        // 규칙 4: 순환 참조 감지 (간단한 버전)
        const circularCheck = this.detectCircularDependency(sourceNode.id, targetNode.id);
        if (circularCheck) {
            return {
                valid: false,
                color: '#fb4934',
                reason: 'Circular dependency detected'
            };
        }

        // 규칙 5: AI 지능형 검증 (Phase 4)
        // 백엔드(LLM)에서 받은 검증 결과가 있으면 적용
        if (edge.validation) {
            return {
                valid: edge.validation.valid,
                color: edge.validation.valid ? (edge.validation.confidence > 0.9 ? (edge.visual?.color || '#83a598') : '#fabd2f') : '#fb4934',
                reason: edge.validation.reason,
                isAi: true
            };
        }

        // 기본값: 정상
        return {
            valid: true,
            color: edge.visual?.color || '#83a598',
            reason: 'Valid relationship'
        };
    }

    /**
     * 순환 참조 감지 (간단한 BFS)
     * @param {string} sourceId - 소스 노드 ID
     * @param {string} targetId - 타겟 노드 ID
     * @returns {boolean} 순환 참조 여부
     */
    detectCircularDependency(sourceId, targetId) {
        // targetId에서 시작해서 sourceId로 돌아오는 경로가 있는지 확인
        const visited = new Set();
        const queue = [targetId];

        while (queue.length > 0) {
            const currentId = queue.shift();

            if (currentId === sourceId) {
                return true; // 순환 발견!
            }

            if (visited.has(currentId)) continue;
            visited.add(currentId);

            // 현재 노드에서 나가는 엣지 찾기
            const outgoingEdges = this.edges.filter(e =>
                (e.from === currentId || e.fromCluster === currentId) &&
                !e.id.startsWith('edge_auto_') // 자동 엣지는 제외
            );

            outgoingEdges.forEach(edge => {
                const nextId = edge.to || edge.toCluster;
                if (nextId && !visited.has(nextId)) {
                    queue.push(nextId);
                }
            });
        }

        return false;
    }

    showEdgeTypeSelector(x, y) {
        this.isEdgeMenuOpen = true;

        // 엣지 타입 선택 메뉴 생성
        const existingMenu = document.getElementById('edge-type-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'edge-type-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.background = '#3c3836';
        menu.style.border = '2px solid #fabd2f';
        menu.style.borderRadius = '8px';
        menu.style.padding = '8px';
        menu.style.zIndex = '10000';
        menu.style.fontFamily = 'Inter, sans-serif';
        menu.style.fontSize = '12px';
        menu.style.color = '#ebdbb2';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        const options = [
            { label: `${theme ? theme.EDGES.DEPENDENCY.icon : '🔗'} Dependency`, type: 'dependency', color: theme ? theme.EDGES.DEPENDENCY.color : '#83a598' },
            { label: `${theme ? theme.EDGES.DATA_FLOW.icon : '📊'} Data Flow`, type: 'data_flow', color: theme ? theme.EDGES.DATA_FLOW.color : '#fabd2f' },
            { label: `${theme ? theme.EDGES.REFERENCE.icon : '📝'} Reference`, type: 'reference', color: theme ? theme.EDGES.REFERENCE.color : '#b8bb26' },
        ];

        options.forEach(t => {
            const item = document.createElement('div');
            item.textContent = t.label;
            item.style.padding = '6px 12px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '4px';
            item.style.transition = 'background 0.2s';
            item.onmouseenter = () => item.style.background = theme.UI.MENU.hover;
            item.onmouseleave = () => item.style.background = 'transparent';
            item.onclick = () => {
                this.isEdgeMenuOpen = false;
                this.createManualEdge(t.type, t.color);
                menu.remove();
            };
            menu.appendChild(item);
        });

        // 취소 버튼
        const cancel = document.createElement('div');
        cancel.textContent = '❌ Cancel';
        cancel.style.padding = '6px 12px';
        cancel.style.cursor = 'pointer';
        cancel.style.borderTop = '1px solid #665c54';
        cancel.style.marginTop = '4px';
        cancel.style.paddingTop = '8px';
        cancel.style.borderRadius = '4px';
        cancel.onmouseenter = () => cancel.style.background = '#504945';
        cancel.onmouseleave = () => cancel.style.background = 'transparent';
        cancel.onclick = () => {
            this.isEdgeMenuOpen = false;
            this.edgeSource = null;
            this.edgeTarget = null;
            this.isCreatingEdge = false;
            this.render();
            menu.remove();
        };
        menu.appendChild(cancel);

        document.body.appendChild(menu);

        // 외부 클릭 시 메뉴 닫기
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    this.isEdgeMenuOpen = false;
                    this.edgeSource = null;
                    this.edgeTarget = null;
                    this.isCreatingEdge = false;
                    this.render();
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    /**
     * 선택된 엣지에 대한 컨텍스트 메뉴 표시
     * @param {number} x - 화면 X 좌표
     * @param {number} y - 화면 Y 좌표
     */
    showEdgeContextMenu(x, y) {
        // 기존 메뉴 제거
        const existingMenu = document.getElementById('edge-context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'edge-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.background = '#3c3836';
        menu.style.border = '2px solid #fabd2f';
        menu.style.borderRadius = '8px';
        menu.style.padding = '8px';
        menu.style.zIndex = '10000';
        menu.style.fontFamily = 'Inter, sans-serif';
        menu.style.fontSize = '12px';
        menu.style.color = '#ebdbb2';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

        // [v0.3.09_fix] Only show edit options if Edit Logic is ON
        if (this.isEditMode) {
            // [v0.3.09_fix] 추가: 확정(Confirm) 옵션 (Pending 상태일 때만)
            if (this.selectedEdge && (this.selectedEdge.status === 'pending' || this.selectedEdge.status === 'pending_confirm')) {
                const confirmOption = document.createElement('div');
                confirmOption.textContent = '✅ Confirm Connection';
                confirmOption.style.padding = '6px 12px';
                confirmOption.style.cursor = 'pointer';
                confirmOption.style.borderRadius = '4px';
                confirmOption.style.color = '#fabd2f';
                confirmOption.style.fontWeight = 'bold';
                confirmOption.style.transition = 'background 0.2s';
                confirmOption.onmouseenter = () => confirmOption.style.background = '#504945';
                confirmOption.onmouseleave = () => confirmOption.style.background = 'transparent';
                confirmOption.onclick = () => {
                    menu.remove();
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({ 
                            command: 'requestConfirmEdge', 
                            edgeId: this.selectedEdge.id,
                            fromFile: this.selectedEdge.from,
                            toFile: this.selectedEdge.to
                        });
                    }
                };
                menu.appendChild(confirmOption);
            }

            // Change Type 옵션
            const changeType = document.createElement('div');
            changeType.textContent = '🔄 Change Type';
            changeType.style.padding = '6px 12px';
            changeType.style.cursor = 'pointer';
            changeType.style.borderRadius = '4px';
            changeType.style.transition = 'background 0.2s';
            changeType.onmouseenter = () => changeType.style.background = '#504945';
            changeType.onmouseleave = () => changeType.style.background = 'transparent';
            changeType.onclick = () => {
                menu.remove();
                this.showEdgeTypeChangeMenu(x, y);
            };
            menu.appendChild(changeType);

            // Delete 옵션
            const deleteOption = document.createElement('div');
            deleteOption.textContent = '❌ Delete';
            deleteOption.style.padding = '6px 12px';
            deleteOption.style.cursor = 'pointer';
            deleteOption.style.borderRadius = '4px';
            deleteOption.style.borderTop = '1px solid #665c54';
            deleteOption.style.marginTop = '4px';
            deleteOption.style.paddingTop = '8px';
            deleteOption.style.transition = 'background 0.2s';
            deleteOption.onmouseenter = () => deleteOption.style.background = '#504945';
            deleteOption.onmouseleave = () => deleteOption.style.background = 'transparent';
            deleteOption.onclick = () => {
                menu.remove();
                this.deleteEdge(this.selectedEdge.id);
            };
            menu.appendChild(deleteOption);
        } else {
            // Edit Logic: OFF 일 때는 수정 불가 안내
            const notAllowed = document.createElement('div');
            notAllowed.textContent = '🔒 Edit Logic: OFF';
            notAllowed.style.padding = '6px 12px';
            notAllowed.style.color = '#a89984';
            notAllowed.style.cursor = 'not-allowed';
            menu.appendChild(notAllowed);
        }

        document.body.appendChild(menu);

        // 외부 클릭 시 메뉴 닫기
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    /**
     * 엣지 타입 변경 메뉴 표시
     * @param {number} x - 화면 X 좌표
     * @param {number} y - 화면 Y 좌표
     */
    showEdgeTypeChangeMenu(x, y) {
        // 기존 메뉴 제거
        const existingMenu = document.getElementById('edge-type-change-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'edge-type-change-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.background = '#3c3836';
        menu.style.border = '2px solid #fabd2f';
        menu.style.borderRadius = '8px';
        menu.style.padding = '8px';
        menu.style.zIndex = '10000';
        menu.style.fontFamily = 'Inter, sans-serif';
        menu.style.fontSize = '12px';
        menu.style.color = '#ebdbb2';
        menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';

        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        const options = [
            { label: `${theme ? theme.EDGES.DEPENDENCY.icon : '🔗'} Dependency`, type: 'dependency', color: theme ? theme.EDGES.DEPENDENCY.color : '#83a598' },
            { label: `${theme ? theme.EDGES.DATA_FLOW.icon : '📊'} Data Flow`, type: 'data_flow', color: theme ? theme.EDGES.DATA_FLOW.color : '#fabd2f' },
            { label: `${theme ? theme.EDGES.REFERENCE.icon : '📝'} Reference`, type: 'reference', color: theme ? theme.EDGES.REFERENCE.color : '#b8bb26' },
        ];

        options.forEach(t => {
            const item = document.createElement('div');
            item.textContent = t.label;
            item.style.padding = '6px 12px';
            item.style.cursor = 'pointer';

            // 현재 타입 강조
            if (this.selectedEdge && this.selectedEdge.type === t.type) {
                item.style.background = '#504945';
                item.textContent += ' ✓';
            }

            item.onmouseenter = () => item.style.background = '#504945';
            item.onmouseleave = () => {
                if (this.selectedEdge && this.selectedEdge.type === t.type) {
                    item.style.background = '#504945';
                } else {
                    item.style.background = 'transparent';
                }
            };
            item.onclick = () => {
                this.changeEdgeType(t.type, t.color);
                menu.remove();
            };
            menu.appendChild(item);
        });

        // 취소 버튼
        const cancel = document.createElement('div');
        cancel.textContent = '❌ Cancel';
        cancel.style.padding = '6px 12px';
        cancel.style.cursor = 'pointer';
        cancel.style.borderTop = '1px solid #665c54';
        cancel.style.marginTop = '4px';
        cancel.style.paddingTop = '8px';
        cancel.style.borderRadius = '4px';
        cancel.onmouseenter = () => cancel.style.background = '#504945';
        cancel.onmouseleave = () => cancel.style.background = 'transparent';
        cancel.onclick = () => menu.remove();
        menu.appendChild(cancel);

        document.body.appendChild(menu);

        // 외부 클릭 시 메뉴 닫기
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    createManualEdge(type, color) {
        if (!this.edgeSource || !this.edgeTarget) return;

        const fromId = this.edgeSource.type === 'node' ? this.edgeSource.id : undefined;
        const fromClusterId = this.edgeSource.type === 'cluster' ? this.edgeSource.id : undefined;
        const toId = this.edgeTarget.type === 'node' ? this.edgeTarget.id : undefined;
        const toClusterId = this.edgeTarget.type === 'cluster' ? this.edgeTarget.id : undefined;

        // [v0.2.20 Fix] Prevent creating logically identical edges
        const isDuplicate = this.edges.some(e =>
            e.from === fromId && e.to === toId && e.type === type &&
            e.fromCluster === fromClusterId && e.toCluster === toClusterId
        );

        if (isDuplicate) {
            console.warn('[SYNAPSE] Logically identical edge already exists in UI, skipping creation.');
            if (typeof vscode !== 'undefined') {
                vscode.postMessage({ command: 'showWarning', message: 'A connection between these nodes already exists.' });
            } else {
                alert('A connection between these nodes already exists.');
            }
            this.edgeSource = null;
            // Persistent connect mode
            // this.edgeTarget = null;
            this.render();
            return;
        }

        const _fromNode = this.nodes.find(n => n.id === (this.edgeSource.type === 'node' ? this.edgeSource.id : null));
        const _toNode = this.nodes.find(n => n.id === (this.edgeTarget.type === 'node' ? this.edgeTarget.id : null));

        // [v0.2.24] Block Edge Connections to Document Nodes
        if ((_fromNode && _fromNode.type === 'documentation') || (_toNode && _toNode.type === 'documentation')) {
            console.warn('[SYNAPSE] Documentation nodes cannot have logical edges.');
            if (typeof vscode !== 'undefined') {
                vscode.postMessage({ command: 'showWarning', message: '문서 노드에는 엣지를 연결할 수 없습니다.' });
            } else {
                alert('문서 노드에는 엣지를 연결할 수 없습니다.');
            }
            this.edgeSource = null;
            this.edgeTarget = null;
            this.render();
            return;
        }

        const newEdge = {
            id: `edge_${this.edgeSource.id}_${this.edgeTarget.id}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            from: fromId,
            fromCluster: fromClusterId,
            to: toId,
            toCluster: toClusterId,
            type: type,
            label: type.replace('_', ' '),
            status: 'pending_confirm',  // [v0.2.17] awaits source confirmation
            _fromFile: _fromNode?.data?.file || null,
            _toFile: _toNode?.data?.file || null,
            visual: {
                color: color,
                dashArray: type === 'dependency' ? '5,5' : undefined
            }
        };

        // [v0.3.32 SSoT Refactoring] 낙관적 업데이트(this.edges.push 등) 및 로컬 상태 변경 완전히 제거
        // 오직 백엔드에 의도(Intent)만 전달하고, 백엔드의 성공 브로드캐스트를 기다립니다.
        console.log('[SYNAPSE] Dispatching manual edge creation to backend:', newEdge);

        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'createManualEdge',
                edge: newEdge
            });
        }

        // 엣지 생성 완료 후 상태 초기화
        this.edgeSource = null;
        // Persistent connect mode: don't clear target so we can connect from target to next? Actually, user wants continuous connect mode, so we keep mode active but reset source/target
        this.edgeTarget = null;
        this.isCreatingEdge = false;
        
        // Remove: document.getElementById('btn-connect')?.classList.remove('active');
        this.render();
    }




    saveWorkspace() {
        if (this._saveWorkspaceTimeout) {
            clearTimeout(this._saveWorkspaceTimeout);
        }
        this._saveWorkspaceTimeout = setTimeout(() => {
            const layout_state = {
                version: 1,
                nodePositions: {},
                clusterPositions: {},
                layerAssignments: {},
                layers: [] // TODO: Semantic Layers
            };
            this.nodes.forEach(n => {
                layout_state.nodePositions[n.id] = {
                    x: n.position ? n.position.x : 0,
                    y: n.position ? n.position.y : 0,
                    confidence: n.confidence || (n.positionSource === 'user' ? 1.0 : 0.2),
                    source: n.positionSource || 'auto'
                };
            });
            this.clusters.forEach(c => {
                layout_state.clusterPositions[c.id] = {
                    x: c.position ? c.position.x : 0,
                    y: c.position ? c.position.y : 0,
                    confidence: c.confidence || (c.positionSource === 'user' ? 1.0 : 0.2),
                    source: c.positionSource || 'auto'
                };
            });
            
            const workspace_state = {
                version: 1,
                camera: { 
                    zoom: this.transform.zoom, 
                    x: this.transform.offsetX, 
                    y: this.transform.offsetY 
                },
                visibility: { 
                    visibleLayers: this.visibleLayers ? Array.from(this.visibleLayers) : [], 
                    hiddenClusters: [] // TODO
                },
                filters: {},
                bookmarks: {}
            };

            if (typeof vscode !== 'undefined') {
                vscode.postMessage({
                    command: 'saveWorkspace',
                    data: {
                        layout_state,
                        workspace_state
                    }
                });
            }
        }, 500);
    }

    takeSnapshot(label) {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'takeSnapshot',
                data: {
                    label: label,
                    data: {
                        nodes: this.nodes,
                        edges: this.edges,
                        clusters: this.clusters,
                        transform: this.transform
                    }
                }
            });
        } else {
            console.log('[SYNAPSE] Browser mode: taking snapshot', label);
            fetch('/api/snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: label,
                    data: {
                        nodes: this.nodes,
                        edges: this.edges,
                        clusters: this.clusters
                    }
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log('Snapshot saved');
                        this.getHistory(); // Refresh history
                    }
                });
        }
    }

    getHistory() {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'getHistory' });
        } else {
            fetch('/api/history')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        this.updateHistoryUI(data.history);
                    }
                });
        }
    }

    rollback(snapshotId) {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'rollback',
                snapshotId: snapshotId
            });
        } else {
            fetch('/api/rollback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ snapshotId })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log('Rollback successful');
                        this.getProjectState();
                    }
                });
        }
    }

    updateEdgeValidation(edgeId, result) {
        const edge = this.edges.find(e => e.id === edgeId);
        if (edge) {
            edge.validation = result;
            edge._validationReason = result.reason;
            edge.isValid = result.valid;

            if (result.visual) {
                edge.visual = { ...edge.visual, ...result.visual };
                result.color = result.visual.color; // renderEdge 호환성 브릿지
            }

            // [v0.2.24] 캐시 직접 주입 (이후 renderEdge()가 캐시히트하여 빨간색 등 정상출력 가능)
            this.edgeValidationCache.set(edgeId, result);

            // 단건마다 synchronous `this.render()` 호출하지 않고 loop flag 점화
            this.requestRender();
        }
    }

    // [v0.3.33 Phase 0 fix] clusterLayerMap 선택 사용 시 O(1), 미제공 시 clusters.find() O(C)
    getSemanticGroup(node, clusterLayerMap) {
        if (!node) return 'unknown';
        
        const clusterId = node.cluster_id || (node.data && node.data.cluster_id);
        if (clusterId) {
            // O(1) if map provided, O(C) fallback
            const layer = clusterLayerMap
                ? clusterLayerMap.get(clusterId)
                : (() => {
                    const cluster = (this.clusters || []).find(c => c.id === clusterId);
                    return cluster?.layer || (cluster?.data?.layer) || (clusterId.startsWith('sys_') ? 'ai' : (clusterId === 'doc_shelf' ? 'doc' : null));
                })();
            if (layer && layer !== 'user') return layer;
            
            if (clusterId === 'sys_cluster_buffer') return 'buffer';
            if (clusterId === 'sys_cluster_reserved') return 'reserved';
            if (clusterId === 'doc_shelf') return 'doc';
            
            if (!clusterLayerMap) {
                const cluster = (this.clusters || []).find(c => c.id === clusterId);
                if (cluster && cluster.label) return cluster.label.replace(/[📂☁️🛡️🕒]/g, '').trim().toLowerCase();
            }
        }

        if (node.type === 'external') return 'external';
        if (node.status === 'ghost') return 'ghost';
        if (node.type === 'documentation') return 'doc';

        return 'unmapped';
    }

    updateHistoryUI(history) {
        const list = document.getElementById('history-list');
        list.innerHTML = '';

        history.forEach(snap => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-info">
                    <div class="history-label">${snap.label}</div>
                    <div class="history-time">${new Date(snap.timestamp).toLocaleString()}</div>
                </div>
                <div class="history-actions">
                    <button class="btn-history-compare" title="Compare visually">🔍</button>
                    <button class="btn-history-rollback" title="Rollback to this state">↩️</button>
                </div>
            `;

            item.querySelector('.btn-history-compare').onclick = (e) => {
                e.stopPropagation();
                if (typeof vscode !== 'undefined') {
                    vscode.postMessage({ command: 'setBaseline', snapshotId: snap.id });
                }
            };

            item.querySelector('.btn-history-rollback').onclick = (e) => {
                e.stopPropagation();
                // Request confirmation from backend
                if (typeof vscode !== 'undefined') {
                    vscode.postMessage({
                        command: 'requestRollback',
                        snapshotId: snap.id,
                        label: snap.label
                    });
                } else {
                    if (confirm(`Rollback to "${snap.label}"? Unsaved changes will be lost.`)) {
                        this.rollback(snap.id);
                    }
                }
            };

            list.appendChild(item);
        });
    }



    showTooltip(x, y, content) {
        if (!this.tooltip || !this.tooltip.style) return;
        this.tooltip.innerHTML = `
            <div style="font-weight: bold; color: #fabd2f; margin-bottom: 4px;">🤖 AI Architectural Reasoning</div>
            <div style="line-height: 1.4;">${content}</div>
        `;
        this.tooltip.style.display = 'block';

        // 툴팁 위치 조정 (화면 밖으로 나가지 않게)
        const rect = this.tooltip.getBoundingClientRect();
        let left = x + 15;
        let top = y + 15;

        if (left + rect.width > window.innerWidth) left = x - rect.width - 15;
        if (top + rect.height > window.innerHeight) top = y - rect.height - 15;

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    hideTooltip() {
        if (!this.tooltip || !this.tooltip.style) return;
        this.tooltip.style.display = 'none';
        this.needsUpdate = true; // [v0.2.24] Ensure first draw after clear
    }

    // [v0.3.18] Node Summary Implementation: Distribution & Hints
    updateNodeStats() {
        this.nodeStatsMap.clear();
        const nodes = this.nodes || [];
        const edges = this.edges || [];

        console.log(`[PERF] UpdateNodeStatsInputEdges: ${edges.length}`);

        // Build cluster-to-layer map for fast lookup
        const clusterLayerMap = new Map();
        (this.clusters || []).forEach(c => {
            const layer = c.layer || (c.data && c.data.layer) || (c.id === 'cluster_ghosts' ? 'external' : c.id.startsWith('sys_') ? 'ai' : (c.id === 'doc_shelf' ? 'doc' : 'user'));
            clusterLayerMap.set(c.id, layer);
        });

        // Initialize Map in O(N)
        const nodeMap = new Map();
        for (const node of nodes) {
            nodeMap.set(node.id, node);
            this.nodeStatsMap.set(node.id, {
                id: node.id, // [v0.3.22.12] Store ID for reverse lookup
                in: 0,
                out: 0,
                connected: new Set(),
                distribution: {},
                representatives: {} // [v0.3.22.12] Group -> Array of labels
            });
        }


        // Single pass over edges O(E)
        for (const e of edges) {
            const srcStats = this.nodeStatsMap.get(e.from);
            const tgtStats = this.nodeStatsMap.get(e.to);
            const srcNode = nodeMap.get(e.from);
            const tgtNode = nodeMap.get(e.to);

            if (srcStats && tgtNode) {
                srcStats.out++;
                srcStats.connected.add(e.to);
                
                // O(1) via clusterLayerMap
                const tgtGroup = this.getSemanticGroup(tgtNode, clusterLayerMap);
                srcStats.distribution[tgtGroup] = (srcStats.distribution[tgtGroup] || 0) + 1;
                
                // [v0.3.22.12] Bind identity sample immediately
                if (!srcStats.representatives[tgtGroup]) srcStats.representatives[tgtGroup] = [];
                if (srcStats.representatives[tgtGroup].length < 5) {
                    const icon = this.getTheme()?.getNodeIcon(tgtNode.type, tgtNode.data?.file || '') || '📄';
                    const name = tgtNode.data?.label || (tgtNode.id.includes('/') ? tgtNode.id.split('/').pop() : tgtNode.id);
                    const label = `${icon} ${name}`;
                    if (!srcStats.representatives[tgtGroup].includes(label)) srcStats.representatives[tgtGroup].push(label);
                }
            }
            if (tgtStats && srcNode) {
                tgtStats.in++;
                tgtStats.connected.add(e.from);

                // O(1) via clusterLayerMap
                const srcGroup = this.getSemanticGroup(srcNode, clusterLayerMap);
                tgtStats.distribution[srcGroup] = (tgtStats.distribution[srcGroup] || 0) + 1;

                // [v0.3.22.12] Bind identity sample immediately
                if (!tgtStats.representatives[srcGroup]) tgtStats.representatives[srcGroup] = [];
                if (tgtStats.representatives[srcGroup].length < 5) {
                    const icon = this.getTheme()?.getNodeIcon(srcNode.type, srcNode.data?.file || '') || '📄';
                    const name = srcNode.data?.label || (srcNode.id.includes('/') ? srcNode.id.split('/').pop() : srcNode.id);
                    const label = `${icon} ${name}`;
                    if (!tgtStats.representatives[srcGroup].includes(label)) tgtStats.representatives[srcGroup].push(label);
                }
            }
        }

        // Finalize stats
        for (const [id, stats] of this.nodeStatsMap) {
            stats.connectedNodes = stats.connected.size;
            stats.total = stats.in + stats.out;
            
            // [v0.3.19] Role & Priority caching for performance
            const diag = this.generateDiagnosticHints(stats);
            stats.primaryRole = diag.roles[0] || null;
            stats.priority = diag.priority;
        }

        // [v0.3.19] Top-N Focus Analysis (Global Exploration)
        this.focusNodeSet.clear();
        this.focusCoreSet.clear();
        if (nodes.length > 0) {
            // Sort by priority (4 -> 0), then by connectivity
            const sortedNodes = [...this.nodeStatsMap.entries()]
                .sort((a, b) => (b[1].priority - a[1].priority) || (b[1].connectedNodes - a[1].connectedNodes))
                .map(entry => entry[0]);

            // Pick Top N cores
            const limit = this.focusTopNodes > 0 ? this.focusTopNodes : 10; // default 10
            const topN = sortedNodes.slice(0, limit);
            topN.forEach(id => {
                this.focusCoreSet.add(id);
                this.focusNodeSet.add(id);
            });

            // Include 1-hop neighbors for context expansion
            for (const edge of edges) {
                if (this.focusCoreSet.has(edge.from)) this.focusNodeSet.add(edge.to);
                if (this.focusCoreSet.has(edge.to)) this.focusNodeSet.add(edge.from);
            }
            console.log(`[SYNAPSE] Focus Top-N calculated: ${topN.length} cores, ${this.focusNodeSet.size} total context nodes.`);
        }

        console.log(`[SYNAPSE] Node stats & roles updated for ${nodes.length} nodes.`);
        this.updateHotspots(); // [v0.3.20] Recompute functional areas
        this.needsUpdate = true; // Refresh display
    }

    /**
     * [v0.3.20] Semantic Hotspot Area Generation
     * Automatically identifies meaningful node clusters using top cores as anchors.
     */
    updateHotspots() {
        if (!this.nodes || !this.focusCoreSet.size) {
            this.hotspots = [];
            return;
        }

        const PADDING = 60; 
        const newHotspots = [];
        const nodeMap = this.nodeMap;

        // Step 1: Build Clusters around Cores (Anchors)
        for (const anchorId of this.focusCoreSet) {
            const anchor = nodeMap.get(anchorId);
            const stats = this.nodeStatsMap.get(anchorId);
            if (!anchor || !stats) continue;

            // Anchor + Non-leaf neighbors (Filtered by horizontal distance to prevent lane-spanning boxes)
            const clusterNodes = [anchor];
            const MAX_CLUSTERING_DISTANCE = 800; // Do not include neighbors in distant lanes in the same box

            for (const neighborId of stats.connected) {
                const neighbor = nodeMap.get(neighborId);
                const nStats = this.nodeStatsMap.get(neighborId);
                if (neighbor && nStats && nStats.primaryRole !== 'Leaf node') {
                    // [v0.3.20] Check both horizontal and vertical distance for better cluster cohesion
                    const xDist = Math.abs(neighbor.position.x - anchor.position.x);
                    const yDist = Math.abs(neighbor.position.y - anchor.position.y);
                    if (xDist < MAX_CLUSTERING_DISTANCE && yDist < 600) {
                        clusterNodes.push(neighbor);
                    }
                }
            }

            // Step 2: Compute Bounding Box for the cluster
            if (clusterNodes.length >= 2) {
                const xs = clusterNodes.map(n => n.position.x);
                const ys = clusterNodes.map(n => n.position.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                newHotspots.push({
                    id: `hs_${anchorId}`,
                    coreId: anchorId,
                    role: stats.primaryRole,
                    x: minX - PADDING,
                    y: minY - PADDING,
                    width: (maxX - minX) + PADDING * 2,
                    height: (maxY - minY) + PADDING * 2
                });
            }
        }

        // Step 3: Simple Overlap Merging (v0.3.20)
        const combinedHotspots = [];
        const usedIds = new Set();

        for (let i = 0; i < newHotspots.length; i++) {
            if (usedIds.has(newHotspots[i].id)) continue;
            
            let current = newHotspots[i];
            usedIds.add(current.id);

            for (let j = i + 1; j < newHotspots.length; j++) {
                if (usedIds.has(newHotspots[j].id)) continue;
                
                const other = newHotspots[j];
                
                // Intersection check
                const overlapX = Math.max(0, Math.min(current.x + current.width, other.x + other.width) - Math.max(current.x, other.x));
                const overlapY = Math.max(0, Math.min(current.y + current.height, other.y + other.height) - Math.max(current.y, other.y));
                
                if (overlapX > 0 && overlapY > 0) {
                    const areaA = current.width * current.height;
                    const areaB = other.width * other.height;
                    const overlapArea = overlapX * overlapY;
                    
                    // If swap/merge is needed (overlap > 50% of either)
                    if (overlapArea > areaA * 0.5 || overlapArea > areaB * 0.5) {
                        const minX = Math.min(current.x, other.x);
                        const minY = Math.min(current.y, other.y);
                        const maxX = Math.max(current.x + current.width, other.x + other.width);
                        const maxY = Math.max(current.y + current.height, other.y + other.height);
                        
                        current = {
                            ...current,
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY
                        };
                        usedIds.add(other.id);
                        // Restart search with merged box
                        j = i; 
                    }
                }
            }
            combinedHotspots.push(current);
        }

        this.hotspots = combinedHotspots;
        console.log(`[SYNAPSE] Hotspots generated: ${this.hotspots.length} hotspots.`);
    }

    /**
     * [v0.3.20] Render Semantic Hotspot Areas
     * Draws soft backgrounds and dashed boundaries for node clusters.
     */
    renderHotspots2D() {
        if (!this.hotspots || this.hotspots.length === 0) return;

        this.ctx.save();
        
        for (const hs of this.hotspots) {
            // Use anchor's role color for identity
            const anchor = this.nodeMap.get(hs.coreId);
            const baseColor = anchor?.visual?.color || '#fabd2f';
            
            // 1. Soft Fill (Area)
            // [v0.3.20] Standard fallback for invalid color strings
            const safeColor = (typeof baseColor === 'string') ? baseColor : '#fabd2f';
            this.ctx.fillStyle = safeColor.includes('rgba') ? safeColor.replace(/, [0-9.]+\)$/, ', 0.05)') : safeColor + '0d'; 
            
            if (safeColor.startsWith('#')) {
                this.ctx.fillStyle = safeColor + '1a'; // ~0.1 opacity hex
            }

            this.ctx.fillRect(hs.x, hs.y, hs.width, hs.height);
            
            // 2. Dashed Boundary
            this.ctx.setLineDash([12, 6]);
            this.ctx.strokeStyle = baseColor.startsWith('#') ? baseColor + '4d' : baseColor; // ~0.3 opacity hex
            this.ctx.lineWidth = 1.2;
            this.ctx.strokeRect(hs.x, hs.y, hs.width, hs.height);
            
            // 3. Cluster Label (Only when zoomed in)
            if (this.transform.zoom > 0.4) {
                this.ctx.setLineDash([]); // Reset for text
                this.ctx.fillStyle = baseColor;
                this.ctx.font = 'bold 10px "JetBrains Mono", monospace';
                this.ctx.globalAlpha = 0.6;
                const roleLabel = (hs.role || 'Unmapped').replace(' node', '').toUpperCase();
                this.ctx.fillText(`[${roleLabel}]`, hs.x + 8, hs.y + 18);
                this.ctx.globalAlpha = 1.0;
            }
        }
        
        this.ctx.restore();
    }

    /**
     * [v0.3.20] Strategic Architecture Alignment (Spring Bias Revision)
     * Triggers a smooth simulation that drifts nodes into their lanes without destroying the graph structure.
     */
    applyRoleAlignment() {
        if (!this.nodes || this.nodes.length === 0) return;
        this.isAligning = true;
        this.alignTimer = 120; // Run simulation for ~2 seconds
        console.log('[SYNAPSE] Spring-based Alignment Triggered.');
        
        // [v0.3.31] Reduce spacing to make the architecture fit nicely on screen
        const COLUMN_WIDTH = 150; // 노드 너비(120) + 여백(30)
        const ROW_HEIGHT = 70;  // 노드 높이(60) + 여백(10)
        
        // 1. Calculate Cluster Centers (ONCE)
        const clusterCenters = {};
        for (const node of this.nodes) {
            const cid = node.cluster_id || 'unclustered';
            if (!clusterCenters[cid]) clusterCenters[cid] = { x: 0, y: 0, count: 0 };
            clusterCenters[cid].x += node.position.x;
            clusterCenters[cid].y += node.position.y;
            clusterCenters[cid].count++;
        }
        for (const cid in clusterCenters) {
            clusterCenters[cid].x /= clusterCenters[cid].count;
            clusterCenters[cid].y /= clusterCenters[cid].count;
        }

        // 2. Group nodes by Cluster, then by Role
        const groups = {};
        for (const node of this.nodes) {
            const cid = node.cluster_id || 'unclustered';
            if (!groups[cid]) {
                groups[cid] = { 'Leaf': [], 'Hub': [], 'Orchestrator': [], 'Controller': [], 'Other': [] };
            }
            
            node.targetX = undefined;
            node.targetY = undefined;

            const stats = this.nodeStatsMap.get(node.id);
            if (!stats || !stats.primaryRole) {
                groups[cid]['Other'].push(node);
                continue;
            }
            
            const pRole = stats.primaryRole;
            if (pRole.startsWith('Leaf')) groups[cid]['Leaf'].push(node);
            else if (pRole.startsWith('Hub')) groups[cid]['Hub'].push(node);
            else if (pRole.startsWith('Orchestrator')) groups[cid]['Orchestrator'].push(node);
            else if (pRole.startsWith('Controller')) groups[cid]['Controller'].push(node);
            else groups[cid]['Other'].push(node);
        }

        // 3. Compute Fixed Targets to prevent overlapping and oscillation
        // [v0.3.31.2] Apply Boundary Constraints (Max Width Wrapper)
        const MAX_CLUSTER_WIDTH = 1200; // 최대 너비 제한 (화면 축소 한계 고려)

        for (const [cid, clusterRoles] of Object.entries(groups)) {
            const center = clusterCenters[cid];
            
            let curX = 0;
            let curY = 0;
            let maxRowHeightInBlock = 0;
            let currentLineWidth = 0;
            
            const nodeTargets = [];
            
            for (const [roleName, list] of Object.entries(clusterRoles)) {
                if (list.length === 0) continue;
                list.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
                
                const maxCols = Math.max(1, Math.floor(MAX_CLUSTER_WIDTH / COLUMN_WIDTH));
                const cols = Math.min(maxCols, Math.max(1, Math.ceil(Math.sqrt(list.length))));
                const rows = Math.ceil(list.length / cols);
                const roleBlockWidth = cols * COLUMN_WIDTH;
                const roleBlockHeight = rows * ROW_HEIGHT;
                
                if (currentLineWidth > 0 && currentLineWidth + roleBlockWidth > MAX_CLUSTER_WIDTH) {
                    curX = 0;
                    curY += maxRowHeightInBlock + (ROW_HEIGHT / 2);
                    currentLineWidth = 0;
                    maxRowHeightInBlock = 0;
                }
                
                list.forEach((node, i) => {
                    const colIndex = i % cols;
                    const rowIndex = Math.floor(i / cols);
                    nodeTargets.push({
                        node: node,
                        tx: curX + colIndex * COLUMN_WIDTH,
                        ty: curY + rowIndex * ROW_HEIGHT
                    });
                });
                
                curX += roleBlockWidth + (COLUMN_WIDTH / 2);
                currentLineWidth += roleBlockWidth + (COLUMN_WIDTH / 2);
                maxRowHeightInBlock = Math.max(maxRowHeightInBlock, roleBlockHeight);
            }
            
            if (nodeTargets.length === 0) continue;
            
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const item of nodeTargets) {
                minX = Math.min(minX, item.tx);
                minY = Math.min(minY, item.ty);
                maxX = Math.max(maxX, item.tx);
                maxY = Math.max(maxY, item.ty);
            }
            
            const blockCenterX = (minX + maxX) / 2;
            const blockCenterY = (minY + maxY) / 2;
            
            const offsetX = center.x - blockCenterX;
            const offsetY = center.y - blockCenterY;
            
            for (const item of nodeTargets) {
                item.node.targetX = item.tx + offsetX;
                item.node.targetY = item.ty + offsetY;
                
                // [v0.3.34] Cluster Size Freeze Rule: Clamp target within cluster local bounds!
                const cl = this.clusters.find(c => c.id === cid);
                if (cl && cl._absCX !== undefined) {
                    const pad = 60;
                    const minX = cl._absCX - cl._absWidth / 2 + pad;
                    const maxX = cl._absCX + cl._absWidth / 2 - pad;
                    const minY = cl._absCY - cl._absHeight / 2 + pad;
                    const maxY = cl._absCY + cl._absHeight / 2 - pad;
                    
                    item.node.targetX = Math.max(minX, Math.min(item.node.targetX, maxX));
                    item.node.targetY = Math.max(minY, Math.min(item.node.targetY, maxY));
                }
            }
        }
        
        this.requestRender();
    }

    /**
     * Physical update logic for soft alignment.
     * Complies with Performance Rule 1: No dynamic allocations, sorting, or complex grouping in frame path.
     */
    updateAlignmentSimulation() {
        if (!this.nodes || !this.isAligning) return;
        
        if (this.alignTimer > 0) {
            this.alignTimer--;
        } else {
            this.isAligning = false;
            console.log('[SYNAPSE] Alignment Simulation Settled.');
            this.resolveClusterOverlaps(); // [v0.3.29] Push apart overlapping clusters after alignment
            this.updateHotspots(); // Final precision update
            return;
        }

        const ALIGN_STRENGTH = 0.05; // Slightly stronger to reach targets faster
        const DAMPING = 0.75;
        const MAX_VELOCITY = 100;
        
        // Simple O(N) integration loop
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            if (node.targetX === undefined || node.targetY === undefined) continue;
            
            const fx = (node.targetX - node.position.x) * ALIGN_STRENGTH;
            const fy = (node.targetY - node.position.y) * ALIGN_STRENGTH;

            node.vx = (node.vx || 0) + fx;
            node.vy = (node.vy || 0) + fy;
            
            node.vx *= DAMPING;
            node.vy *= DAMPING;
            
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (speed > MAX_VELOCITY) {
                const ratio = MAX_VELOCITY / speed;
                node.vx *= ratio;
                node.vy *= ratio;
            }
            
            node.position.x += node.vx;
            node.position.y += node.vy;
        }
        
        // [v0.3.20.2] Throttle hotspot updates during animation to save CPU and reduce jitter
        if (this.alignTimer % 5 === 0) {
            this.updateHotspots();
        }
    }

    /**
     * [v0.3.20] Semantic Hotspot Area Generation (A-1)
     */

    generateDiagnosticHints(stats) {
        const { in: inCount, out, connectedNodes, distribution, total } = stats;
        const groups = Object.keys(distribution);
        const values = Object.values(distribution);
        const outRatioVal = total > 0 ? out / total : 0;
        const inRatioVal = total > 0 ? inCount / total : 0;
        const maxVal = Math.max(...values, 0);
        const maxRatio = total > 0 ? maxVal / total : 0;

        const roles = [];
        const hints = [];

        // --- Role Detection (Priority Order) ---
        if (connectedNodes <= 3) {
            roles.push("Leaf node");
        } else if (outRatioVal >= 0.7 && connectedNodes >= 5) {
            roles.push("Orchestrator (fan-out)");
        } else if (inRatioVal >= 0.7 && connectedNodes >= 5) {
            roles.push("Controller (fan-in)");
        } else if (connectedNodes >= 15) {
            roles.push("Hub (high connectivity)");
        } else if (connectedNodes > 0) {
            roles.push("Standard component");
        }

        // --- Architectural Hints (Facts & Nuances) ---
        const SUPER_NODE_LIMIT = 30;
        const CONCENTRATION_STRONG = 0.8;
        const CONCENTRATION_MODERATE = 0.6;
        const FAN_RATIO = 0.7;
        const MIN_CONNECTIONS = 5;

        if (connectedNodes >= MIN_CONNECTIONS) {
            const getRatioText = (val) => Math.round((val / total) * 100);

            // Rule 1: Multi-Domain (진짜 분산된 경우만 제안)
            if (groups.length >= 3 && maxRatio < 0.6) {
                hints.push(`!! 다중 도메인 분산 소통 (${groups.length}개 그룹). 책임 분리 검토 권장.`);
            }

            // Rule 2: Concentration (강도 세분화)
            if (total > 0) {
                const ratioVal = getRatioText(maxVal);
                const dominant = groups[values.indexOf(maxVal)];
                if (maxRatio >= CONCENTRATION_STRONG) {
                    hints.push(`!! ${dominant} 레이어 집중 결합 (${ratioVal}%). 강력한 종속성 형성.`);
                } else if (maxRatio >= CONCENTRATION_MODERATE) {
                    hints.push(`! ${dominant} 레이어 중심 결합 (${ratioVal}%).`);
                }

                const otherCount = total - maxVal;
                if (otherCount > 0 && maxRatio >= CONCENTRATION_MODERATE) {
                    const otherRatio = getRatioText(otherCount);
                    hints.push(`- 일부 타 레이어 연결 존재 (${otherCount}/total, ${otherRatio}%).`);
                }
            }

            // Rule 3: High Outbound
            if (total > 0 && outRatioVal >= FAN_RATIO) {
                const ratio = getRatioText(out);
                hints.push(`! 높은 출력 비율 (${ratio}%).`);
            }

            // Rule 4: High Inbound
            if (total > 0 && inRatioVal >= FAN_RATIO) {
                const ratio = getRatioText(inCount);
                hints.push(`! 높은 입력 비율 (${ratio}%). 시스템 핫스팟 가능성.`);
            }

            // Rule 5: Super Node
            if (connectedNodes >= SUPER_NODE_LIMIT) {
                hints.push(`!!! 슈퍼 노드 감지 (${connectedNodes}/30). 로직 분해 권장.`);
            }
        }

        // --- Priority Calculation (v0.3.19) ---
        let priority = 0;
        if (connectedNodes >= 20) priority += 2;
        if (total > 0 && outRatioVal >= 0.8) priority += 1;
        if (total > 0 && inRatioVal >= 0.8) priority += 1;
        priority = Math.min(priority, 4);

        return { roles, hints, priority };
    }

    getTheme() {
        return (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
    }

    showNodeSummary(x, y, node, stats, edgeReason) {
        // [v0.3.22.9] Diagnostic position trace
        if (x < 50 && y < 50) {
            console.warn(`[SYNAPSE] Tooltip Position Warning: (${x}, ${y}) - Attempting auto-correction`);
        }
        console.log(`[SYNAPSE] Tooltip Node=${node.id}, CalcPos=(${Math.round(x)}, ${Math.round(y)})`);
        if (!node || !this.nodeSummary) return;

        // [v0.3.22.9] Define nodeName for the tooltip header
        const nodeName = node.data?.label || (node.id.includes('/') ? node.id.split('/').pop() : node.id);

        const getStem = (id) => {
            if (!id || typeof id !== 'string') return '';
            const parts = id.includes('/') ? id.split('/') : [id];
            const lastPart = parts[parts.length - 1];
            return lastPart.split('.')[0].toLowerCase();
        };

        if (!stats) {
            stats = this.nodeStatsMap.get(node.id);
            if (!stats) {
                const stem = getStem(node.id);
                stats = Array.from(this.nodeStatsMap.values()).find(s => getStem(s.id) === stem);
            }
        }

        // [v0.3.22.9] Emergency Fallback: Even without stats, show basic node identity
        if (!stats) {
            stats = { id: node.id, connectedNodes: 0, in: 0, out: 0, distribution: {} };
        }
        
        // Ensure tooltip is visible
        this.nodeSummary.style.display = 'block';
        const nodes = this.nodes || [];
        const clusters = this.clusters || [];
        const clusterLayerMap = new Map();
        clusters.forEach(c => {
            const layer = c.layer || (c.data && c.data.layer) || (c.id === 'cluster_ghosts' ? 'external' : c.id.startsWith('sys_') ? 'ai' : (c.id === 'doc_shelf' ? 'doc' : 'user'));
            clusterLayerMap.set(c.id, layer);
        });

        const groupDetails = {};
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        
        // [v0.3.22.9] Ultra-Resilient Stem-based ID Extraction helper
        const stemMap = new Map();

        nodes.forEach(n => {
            const stem = getStem(n.id);
            if (stem && !stemMap.has(stem)) stemMap.set(stem, n);
        });

        const myId = stats.id;
        const myStem = getStem(myId);
        
        const nodeEdges = (this.edges || []).filter(e => {
            if (!e.from || !e.to) return false;
            // Robust match: Exact ID only
            const fromMatch = (e.from === myId);
            const toMatch = (e.to === myId);
            return fromMatch || toMatch;
        });

        nodeEdges.forEach(e => {
            const isOut = (e.from === myId);
            const targetId = isOut ? e.to : e.from;
            
            // [v0.3.33] Strict Identity Binding (Removed Stem fallback)
            let targetNode = nodeMap.get(targetId);

            // Fallback for icons/names if node is missing from current pool (Ghost/Filtered)
            const theme = this.getTheme() || window.SYNAPSE_THEME;
            if (!theme) console.warn('[SYNAPSE] Theme Engine not detected in Tooltip loop');

            const group = targetNode ? this.getSemanticGroup(targetNode) : 'unmapped';
            if (!groupDetails[group]) groupDetails[group] = [];
            
            const fileName = targetNode?.data?.file || (targetId.includes('.') ? targetId : '');
            const type = targetNode?.type || (targetId.includes('/') ? 'source' : 'external');
            
            const icon = theme ? theme.getNodeIcon(type, fileName) : '📄';
            const name = targetNode ? (targetNode.data?.label || targetNode.id.split('/').pop()) : targetId.split('/').pop();
            const label = `${icon} ${name}`;
            
            if (name && !groupDetails[group].includes(label)) {
                groupDetails[group].push(label);
            }
        });

        const distributionEntries = Object.entries(stats.distribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const diag = this.generateDiagnosticHints(stats);
        const { roles, hints, priority } = diag;

        const ROLE_COLOR = {
            'Orchestrator (fan-out)': '#FF8C00',
            'Controller (fan-in)':   '#4CAF50',
            'Hub (high connectivity)': '#2196F3',
            'Leaf node':         '#9E9E9E',
            'Standard component': '#ebdbb2'
        };

        const stars = '★'.repeat(priority) + '☆'.repeat(4 - priority);

        // [v0.3.22.9] Senior's Prescription: LOD Guard
        // Only show detailed lists if zoom level > 0.4 (Detail View)
        const isDetailView = (this.transform?.zoom || 1.0) > 0.4;

        const distHtml = (distributionEntries.length > 0 && isDetailView) ? `
            <div style="margin-top: 10px; border-top: 1px solid #504945; padding-top: 6px;">
                <div style="font-size: 10px; color: #928374; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>Top Connections:</span>
                    ${window.engine?.isBatchValidating ? '<span style="color: #fe8019; font-style: italic; font-size: 9px;">📡 Validating...</span>' : ''}
                </div>
                ${distributionEntries.map(([group, count]) => {
                    // [v0.3.22.12] SSoT: Prioritize pre-calculated representatives from Stats
                    let representatives = stats.representatives ? (stats.representatives[group] || []) : [];
                    
                    // Fallback to dynamic loop results if stats are missing
                    if (representatives.length === 0) {
                        representatives = groupDetails[group] || [];
                    }
                    
                    // Final safety for pending/ghost nodes
                    if (representatives.length === 0 && count > 0) {
                        representatives = [`👻 (Pending Identity: ${count} nodes)`];
                    }

                    const topNodes = representatives.slice(0, 3).join(', ');
                    const more = representatives.length > 3 ? '...' : '';
                    return `
                        <div style="margin-bottom: 5px;">
                            <div style="display: flex; justify-content: space-between; font-size: 11px;">
                                <span style="color: #8ec07c; font-weight: bold;">${group} (${count})</span>
                            </div>
                            <div style="color: #ebdbb2; font-size: 10px; padding-left: 6px; opacity: 0.8; line-height: 1.3;">
                                └ ${topNodes}${more}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div style="margin-top: 8px; border-top: 1px solid #504945; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-size: 10px; color: #928374; text-transform: uppercase; margin-bottom: 2px;">Role:</div>
                    ${roles.map(role => `
                        <div style="font-size: 11px; color: ${ROLE_COLOR[role] || '#b8bb26'}; font-weight: bold;">${role}</div>
                    `).join('') || '<div style="font-size: 11px; color: #928374;">-</div>'}
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 10px; color: #928374; text-transform: uppercase; margin-bottom: 2px;">Priority:</div>
                    <div style="font-size: 12px; color: #fabd2f; letter-spacing: 1px;">${stars}</div>
                </div>
            </div>

            ${hints.length > 0 ? `
            <div style="margin-top: 8px; border-top: 1px solid #504945; padding-top: 6px;">
                <div style="font-size: 10px; color: #928374; text-transform: uppercase; margin-bottom: 4px;">Architectural Hints:</div>
                ${hints.map(hint => {
                    let color = '#d3869b'; 
                    if (hint.startsWith('!!!')) color = '#fb4934'; 
                    else if (hint.startsWith('!!')) color = '#fe8019'; 
                    return `<div style="font-size: 11px; color: ${color}; line-height: 1.4; margin-bottom: 2px;">${hint}</div>`;
                }).join('')}
            </div>
            ` : ''}
        ` : '';


        const clientTimestamp = node.clientTimestamp || node.data?.clientTimestamp;
        let updateInfoHtml = '';
        if (clientTimestamp) {
            const diffMs = Date.now() - clientTimestamp;
            const diffMins = Math.floor(diffMs / 60000);
            const user = node.clientUsername || node.data?.clientUsername || node.clientLayer || node.data?.clientLayer || 'User';
            updateInfoHtml = `
            <div style="font-size: 10px; color: #a89984; font-style: italic; margin-bottom: 4px;">
                👤 ${user} <span style="margin-left: 4px; color: #928374;">Updated ${diffMins}m ago</span>
            </div>
            `;
        }

        this.nodeSummary.innerHTML = `
            <div style="color: #fabd2f; font-weight: bold; border-bottom: 1px solid #fabd2f; margin-bottom: ${updateInfoHtml ? '4px' : '8px'}; padding-bottom: 4px; font-size: 13px;">${nodeName}</div>
            ${updateInfoHtml}
            <div style="display: flex; gap: 15px; font-size: 11px; margin-bottom: 2px;">
                <div style="color: #b8bb26;">Conn: <span style="color: #ebdbb2;">${stats.connectedNodes}</span></div>
                <div style="color: #83a598;">In: <span style="color: #ebdbb2;">${stats.in}</span></div>
                <div style="color: #fe8019;">Out: <span style="color: #ebdbb2;">${stats.out}</span></div>
            </div>
            ${distHtml}
            ${edgeReason ? `
            <div style="margin-top: 8px; border-top: 1px dashed #fabd2f; padding-top: 6px;">
                <div style="font-size: 10px; color: #fabd2f; text-transform: uppercase; margin-bottom: 4px;">[Edge] Validation:</div>
                <div style="font-size: 11px; color: #ebdbb2; line-height: 1.4; white-space: pre-wrap;">${edgeReason}</div>
            </div>
            ` : ''}
        `;
        
        // [v0.3.22.9] Forced display enforcement BEFORE positioning to ensure rect calculation is valid
        this.nodeSummary.style.display = 'block';
        this.nodeSummary.style.opacity = '1';
        this.nodeSummary.style.visibility = 'visible';

        const rect = this.nodeSummary.getBoundingClientRect();
        let left = x + 20;
        let top = y + 20;

        // Viewport clamping logic
        if (left + rect.width > window.innerWidth) {
            left = x - rect.width - 20;
        }
        if (top + rect.height > window.innerHeight) {
            top = y - rect.height - 20;
        }

        // Safety clamp to prevent negative coordinates
        left = Math.max(10, left);
        top = Math.max(10, top);

        // Ensure no external styles interfere with positioning
        this.nodeSummary.style.margin = '0';
        this.nodeSummary.style.transform = 'none';
        this.nodeSummary.style.left = `${left}px`;
        this.nodeSummary.style.top = `${top}px`;
    }


    hideNodeSummary() {
        if (this.nodeSummary) this.nodeSummary.style.display = 'none';
    }

    getOrCreateSystemClusters() {
        const createSysCluster = (id, label, x, y, color) => {
            const hasNodes = this.nodes.some(n => n.cluster_id === id || n.data?.cluster_id === id);
            let cluster = this.clusters.find(c => c.id === id);
            
            // 사용자가 의도하지 않은 빈 시스템 클러스터는 노출하지 않음
            if (!hasNodes) {
                if (cluster) {
                    this.clusters = this.clusters.filter(c => c.id !== id);
                }
                return null;
            }

            if (!cluster) {
                cluster = {
                    id: id,
                    label: label,
                    position: { x, y },
                    width: 300,
                    height: 200,
                    color: color,
                    collapsed: false,
                    isSystem: true
                };
                this.clusters.push(cluster);
                console.log(`[SYNAPSE] Initialized System Cluster: ${label}`);
            }
            return cluster;
        };

        // UI placement for System Clusters. We'll put them firmly on the left bottom side.
        createSysCluster('sys_cluster_reserved', '🕒 Reserved Cluster', -1500, 1000, '#fabd2f'); // Yellow-ish
        createSysCluster('sys_cluster_buffer', '🛡️ Buffer Cluster', -1100, 1000, '#83a598'); // Blue-ish
    }

    // [v0.2.26] 🚀 Deterministic Fingerprinting (Precision: 2 decimal places)
    getFingerprint(items) {
        if (!items || !Array.isArray(items)) return "empty";
        return items
            .map(n => `${n.id}:${(n.position?.x || 0).toFixed(2)},${(n.position?.y || 0).toFixed(2)}:${n.status || 'none'}`)
            .sort() // Essential for deterministic identity
            .join('|');
    }

    // [v0.2.26] 🛡️ Normalization Pass (Isolation & Sort)
    normalizeProjectState(state) {
        if (!state) return null;
        // 1. Sort Nodes & Edges to guarantee iteration order
        if (state.nodes) state.nodes.sort((a, b) => a.id.localeCompare(b.id));
        if (state.edges) state.edges.sort((a, b) => (a.id || "").localeCompare(b.id || "") || a.from.localeCompare(b.from));
        if (state.clusters) state.clusters.sort((a, b) => a.id.localeCompare(b.id));

        // 2. Return a Deep Clone to prevent in-place mutation of incoming data
        return JSON.parse(JSON.stringify(state));
    }

    // [v0.3.33] Phase 3A: Explicit Spatial Index Build
    buildSpatialIndex() {
        if (!this.spatialIndex || !this.nodes || !this.clusters) return;
        const _tIndex = performance.now();

        // [P0] RBush 독립 검증 테스트
        console.log('[RBUSH_TEST] window.RBush:', window.RBush);
        this.spatialIndex.clear();
        
        console.log('[RBUSH_DEBUG] nodes.length', this.nodes.length);
        if (this.nodes.length > 0) {
            console.log('[RBUSH_DEBUG] first node', this.nodes[0]);
        }

        // 1. Insert Nodes
        let inserted = 0;
        for (const n of this.nodes) {
            this.spatialIndex.insertNode(n);
            inserted++;
        }
        console.log('[RBUSH_DEBUG] inserted', inserted);
        console.log('[RBUSH_DEBUG] tree count', this.spatialIndex.nodeTree ? this.spatialIndex.nodeTree.all().length : 'null');
        console.log('[RBUSH_DEBUG] spatialIndex ref === this.spatialIndex?', this.spatialIndex === this.spatialIndex); // sanity check

        // [v0.3.35] Insert Edges
        if (this.edges) {
            this.edges.forEach(e => this.spatialIndex.insertEdge(e, this.nodeMap));
        }

        // 2. Compute Cluster Bounds & Insert
        if (!this._lastComputedBounds) this._lastComputedBounds = new Map();
        
        this.clusters.forEach(c => {
            const bounds = this.computeClusterBounds(c);
            if (bounds) this.spatialIndex.insertCluster(c);
        });

        // Store computed bounds for use in flows/edges
        // this._lastComputedBounds is updated inside computeClusterBounds

        // [v0.3.33.2] Cluster Bounds Audit
        if (this._lastComputedBounds && this.clusters.length > 0) {
            const auditList = [];
            for (const c of this.clusters) {
                const b = this._lastComputedBounds.get(c.id);
                if (b) {
                    const width = b.maxX - b.minX;
                    const height = b.maxY - b.minY;
                    const directNodesCount = this.nodes.filter(n => (n.cluster_id === c.id || (n.data && n.data.cluster_id === c.id))).length;
                    const childClustersCount = this.clusters.filter(x => x.parent_id === c.id).length;
                    
                    // [v0.3.33.3] Requested BOUND_COMPARE log
                    if (height > 50000 || c.label === 'vs' || c.label === 'src' || c.id.includes('sys_cluster_buffer')) {
                        console.log('[BOUND_COMPARE]', {
                            id: c.id,
                            label: c.label || c.id,
                            minY: Math.round(b.minY),
                            maxY: Math.round(b.maxY),
                            computedHeight: Math.round(height),
                            directNodes: directNodesCount,
                            childClusters: childClustersCount
                        });
                    }

                    auditList.push({ id: c.id, name: c.label || c.id, directNodesCount, childClustersCount, width: Math.round(width), height: Math.round(height), minX: Math.round(b.minX), maxX: Math.round(b.maxX), minY: Math.round(b.minY), maxY: Math.round(b.maxY) });
                }
            }
            auditList.sort((a, b) => b.height - a.height);
            console.log('[CLUSTER_BOUNDS_AUDIT] Top 10 largest clusters by HEIGHT:');
            console.table(auditList.slice(0, 10));

            // Clean up any existing debug overlay
            const debugDivId = 'synapse-debug-audit-div';
            const existingDebugDiv = document.getElementById(debugDivId);
            if (existingDebugDiv) {
                existingDebugDiv.remove();
            }
        }

        console.log(`[PERF] SpatialIndexBuildTime: ${(performance.now() - _tIndex).toFixed(1)}ms (nodes=${this.nodes.length}, clusters=${this.clusters.length})`);
        console.log(`[DEBUG] buildSpatialIndex nodeTree count inside: `, this.spatialIndex.nodeTree ? this.spatialIndex.nodeTree.all().length : 'null');
        console.log(`[DEBUG] buildSpatialIndex fallbackMode: `, this.spatialIndex.fallbackMode);
        if (this.nodes.length > 0 && this.spatialIndex.nodeTree && this.spatialIndex.nodeTree.all().length === 0) {
            console.log(`[DEBUG] First node position: `, this.nodes[0].position);
            console.log(`[DEBUG] Is first node position finite? `, Number.isFinite(this.nodes[0].position?.x), Number.isFinite(this.nodes[0].position?.y));
        }
    }

    buildHierarchy() {
        if (!this.clusters) return;
        this.clusterHierarchy = new ClusterHierarchy(this.clusters);
    }

    initLODState() {
        if (!this.clusterHierarchy) return;
        this.expandedClusters = new Set();
        if (this.clusters) {
            // [v0.3.33.4 Fix] Unify expandedClusters with c.collapsed for all clusters
            // System A (c.collapsed) and System B (expandedClusters) must be strictly synchronized
            for (const c of this.clusters) {
                if (!c.collapsed) {
                    this.expandedClusters.add(c.id);
                }
            }
        }
        this.collapsedClusters = new Set();
        this.currentLODLevel = 1;
        console.log('[perf_engine]', 'event=init', 'expanded=' + this.expandedClusters.size, 'clusters=' + (this.clusters?.length ?? 0));
    }

    expandCluster(id) {
        // console.log('[perf_engine_debug]', 'expandCluster CALL START', id, 'hierarchy exists?', !!this.clusterHierarchy);
        if (!this.clusterHierarchy) return;
        const node = this.clusterHierarchy.get(id);
        if (!node || node.children.length === 0) return;
        this.expandedClusters.add(id);
        // console.log('[perf_engine]', 'event=expand', 'cluster=' + id, 'expanded=' + this.expandedClusters.size);
    }

    collapseCluster(id) {
        // console.log('[perf_engine_debug]', 'collapseCluster CALL START', id, 'hierarchy exists?', !!this.clusterHierarchy);
        if (!this.clusterHierarchy) return;
        this.expandedClusters.delete(id);
        const node = this.clusterHierarchy.get(id);
        if (node) {
            const descendants = this.clusterHierarchy.getDescendants(id);
            for (const d of descendants) {
                this.expandedClusters.delete(d.id);
            }
        }
        // console.log('[perf_engine]', 'event=collapse', 'cluster=' + id, 'expanded=' + this.expandedClusters.size);
    }

    isClusterExpanded(id) {
        return this.expandedClusters && this.expandedClusters.has(id);
    }

    setLODLevel(level) {
        this.currentLODLevel = Math.max(0, Math.min(3, level));
    }

    loadProjectState(projectState, preserveView = false) {
        console.time('loadProjectState');
        console.log('[LOAD_STATE_ENGINE]', this._instanceId);
        console.log('[LOAD_STATE]', { nodes: projectState?.nodes?.length ?? 0, clusters: projectState?.clusters?.length ?? 0, preserveView });
        if (!projectState) { console.timeEnd('loadProjectState'); return; }
        const loadingEl = document.getElementById('loading');

        // [v0.3.10] Runtime Data Sanitization
        const ghostBlacklist = [
            'os', 'sys', 'math', 'json', 'datetime', 'sqlite3', 'pandas', 'rich', 'numpy',
            'command', 'snap_', 'test_doc', 'untitled', 'request', 'urllib', 'dateutil', 're',
            'analysis', 'report', 'logic'
        ];

        const rawNodes = projectState.nodes || [];
        const rawEdges = projectState.edges || [];

        const bad = rawNodes.filter(n => {
            const f = (n.data && n.data.file) ? n.data.file : (n.filePath || n.id || '');
            return f.startsWith('./') || f.startsWith('../') || f === '.' || f === '..';
        });
        if (bad.length > 0) {
            console.error('[BAD_PATHS]', bad.slice(0, 20).map(n => ({ id: n.id, file: n.data?.file, filePath: n.filePath, type: n.type })));
        }

        console.log("[FLOW_DEBUG] loadProjectState raw nodes", rawNodes.length, "raw edges", rawEdges.length);

        // 1. Separate nodes into Canvas pool and Documentation/Blacklist pool
        const canvasNodes = [];
        const documentationNodes = [];

        rawNodes.forEach(node => {
            const lowerId = node.id.toLowerCase();
            const isBlacklisted = ghostBlacklist.some(b => lowerId === b || lowerId.startsWith(b + ':') || lowerId.startsWith(b + '.'));
            
            // Skip blacklisted ghosts entirely
            if ((node.status === 'ghost' || node.type === 'external') && isBlacklisted) return;
            if (lowerId.includes('report') && (node.status === 'ghost' || node.type === 'external')) return;
            if (lowerId.includes('untitled') || lowerId.includes('command:')) return;

            // Mark or Move Documentation (Refined Pattern)
            const type = (node.type || '').toString().toLowerCase();
            const nodeId = (node.id || '').toLowerCase();
            const filePath = (node.data?.file || '').toLowerCase();

            const isDoc = type === 'documentation' || 
                          filePath.endsWith('.md') || 
                          nodeId.includes('report') || 
                          node.data?.hiddenOnCanvas;

            if (isDoc) {
                documentationNodes.push(node);
            } else {
                canvasNodes.push(node);
            }
        });

        console.log("[FLOW_DEBUG] loadProjectState canvasNodes", canvasNodes.length, "docNodes", documentationNodes.length);

        // [v0.3.33 Phase 2] Apply Materialization Policy at the very beginning of the pipeline
        const policy = PolicyFactory.create(this.viewStrategy);
        // 2. Filter Edges to only connect visible or documentation nodes, AND apply policy
        const activeIds = new Set([...canvasNodes, ...documentationNodes].map(n => n.id));
        const canvasEdges = rawEdges.filter(e => 
            activeIds.has(e.from) && 
            activeIds.has(e.to) && 
            policy.shouldMaterializeEdge(e)
        );

        // 1. 파이프라인 초입 필터링 직후 로깅
        console.log(`[PERF] RawEdgeCount: ${rawEdges.length}`);
        console.log(`[PERF] MaterializedEdgeCount: ${canvasEdges.length}`);

        // Use CLEAN data for the rest of the method
        const sanitizedProjectState = {
            ...projectState,
            nodes: canvasNodes,
            edges: canvasEdges
        };
        this.docShelfNodes = documentationNodes;
        this.renderDocShelfList('', documentationNodes);

        // [v0.3.10] FORCE RE-RENDER on state update to prevent edge flickering
        this.isGraphDataDirty = true;
        this.isEdgeDirty = true;
        this.isTextDirty = true;

        // [v0.2.24] Throttling & Data Integrity Guard
        const now = Date.now();
        const dataHash = `n${canvasNodes.length}e${canvasEdges.length}c${projectState.clusters?.length}`;

        if (this._lastDataHash === dataHash && (now - this._lastLoadTime < 1000) && preserveView) {
            return;
        }

        this._lastDataHash = dataHash;
        this._lastLoadTime = now;

        // [v0.2.26] 🛡️ STEP 1: Normalize and Clone Input (Isolation)
        const baseState = this.normalizeProjectState(sanitizedProjectState);
        this.log(`[STATE-DETERMINISM] Hash Before: ${this.getFingerprint(baseState.nodes).substring(0, 60)}...`);

        // [v0.2.24] Selection Preservation
        const selectedIds = new Set(Array.from(this.selectedNodes).map(n => n.id));
        const oldSelectedNodeId = this.selectedNode?.id;

        this.log(`loadProjectState triggered. Nodes: ${baseState.nodes?.length}, Edges: ${baseState.edges?.length}`);
        // [v0.3.34] Disabled expensive string concat
        // this.log(`[DEBUG_NODES] Nodes survived normalizeProjectState: ${baseState.nodes?.map(n => n.id).join(', ')}`);
        const promotedLabels = [];

        // [v0.3.33 Phase 0] Baseline Measurement
        const _perf = {
            t0: performance.now(),
            t0wall: Date.now(),
            ipcTimestamp: projectState._ipcTimestamp || null
        };
        if (projectState._msgReceiveT != null) {
            // TransferTime: IPC message receive → loadProjectState entry (same process, reliable)
            console.log(`[PERF] TransferTime (IPC→entry): ${(_perf.t0 - projectState._msgReceiveT).toFixed(2)}ms`);
        }

        try {
            // [v0.3.11] 명시적 데이터 정제 제거 (백엔드 SSoT에서 처리됨)
            if (!baseState.nodes || baseState.nodes.length === 0) {
                console.warn('[SYNAPSE] loadProjectState: Received empty nodes list.');
            }

            // [Fix] Capture manual nodes before overriding this.nodes
            const oldManualNodes = (this.nodes || []).filter(n => n.id.startsWith('node_manual_'));
            const oldNodes = this.nodes || [];

            // [v0.3.16] docShelfNodes are already separated and set in step 1 (line 3652)
            this.nodes = baseState.nodes || [];
            console.log('[AFTER_ASSIGN]', this.nodes.length);

            // [v0.3.33] CLUSTER_WATCH: track cluster_id reassignment timing
            if (!window.__cluster_watch && this.nodes) {
                window.__cluster_watch = true;
                let _prevCid = null, _prevDataCid = null;
                window.__cluster_watch_id = setInterval(() => {
                    const n = this.nodes?.find(x => x.id && typeof x.id === 'string' && x.id.includes('MainActivity'));
                    if (!n) return;
                    if (_prevCid !== n.cluster_id || _prevDataCid !== n.data?.cluster_id) {
                        console.log('[CLUSTER_WATCH]', 'cluster_id=' + n.cluster_id, 'data.cluster_id=' + n.data?.cluster_id, 'visibleHas=' + (this._visibleClusterIds?.has(n.cluster_id) ?? 'no_cache'));
                        _prevCid = n.cluster_id;
                        _prevDataCid = n.data?.cluster_id;
                    }
                }, 100);
            }

            this._debugNodesRef = this.nodes;

            // [v0.3.33.3] BYPASS STALE CACHE
            // The layout_state cache is overriding backend LayoutEngine with old bugged coordinates (e.g., Y=752000).
            // We temporarily bypass this to verify if the Backend layout is correct.
            if (projectState.synapse_workspace && projectState.synapse_workspace.layout_state) {
                const layout = projectState.synapse_workspace.layout_state;
                this.nodes.forEach(n => {
                    const pos = layout.nodePositions[n.id];
                    // Sanity check against old bugged coordinates
                    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && Math.abs(pos.x) < 500000 && Math.abs(pos.y) < 500000) {
                        n.position = { x: pos.x, y: pos.y };
                        n.positionSource = pos.source || 'auto';
                        n.confidence = pos.confidence || 0.2;
                    } else {
                        if (!n.position || Math.abs(n.position.x) > 500000 || Math.abs(n.position.y) > 500000) {
                            n.position = { x: 0, y: 0 };
                        }
                        n.positionSource = 'auto';
                        n.confidence = 0.2;
                    }
                });
            } else {
                this.nodes.forEach(n => {
                    if (!n.position || Math.abs(n.position.x) > 500000 || Math.abs(n.position.y) > 500000) {
                        n.position = { x: 0, y: 0 };
                    }
                    if (!n.positionSource) {
                        n.positionSource = 'auto';
                        n.confidence = 0.2;
                    }
                });
            }

            // [v0.3.22.11] Position Persistence Guard:
            // When preserving view (e.g. incremental update or post-save sync), 
            // prioritize existing UI coordinates over backend defaults to prevent jumping.
            if (preserveView && oldNodes.length > 0) {
                const oldPosMap = new Map(oldNodes.map(n => [n.id, n.position]));
                this.nodes.forEach(n => {
                    const oldPos = oldPosMap.get(n.id);
                    if (oldPos && oldPos.x !== undefined && oldPos.y !== undefined) {
                        n.position = { x: oldPos.x, y: oldPos.y };
                    }
                });
            }

            this.edges = baseState.edges || [];

            // [v0.2.18.2] Detect matches between old manual nodes and new solid nodes
            oldManualNodes.forEach(oldNode => {
                const label = oldNode.data?.label || oldNode.id;
                // Find a real node (not manual) with the same label
                const solidMatch = this.nodes.find(n => !n.id.startsWith('node_manual_') && n.data?.label === label);
                if (solidMatch) {
                    this.log(`[SYNAPSE] Promotion detected for: ${label}`, 'info');
                    this.promotionSites.push({
                        x: solidMatch.position.x + 60,
                        y: solidMatch.position.y + 30,
                        startTime: Date.now(),
                        label: label
                    });
                    this.promotingNodeIds.add(solidMatch.id);
                    promotedLabels.push(label);

                    // Trigger particles immediately
                    this.emitPromotionParticles(solidMatch.position.x + 60, solidMatch.position.y + 30);
                }
            });

            if (promotedLabels.length > 0) {
                // Show toast (Simple implementation for now)
                this._showPromotionToast(promotedLabels);
            }

            this._updateLayerCounts(projectState);

            const rawClusters = projectState.clusters || [];
            // [v0.3.11] 레이어 속성 정규화 (백엔드 layer 속성 우선)
            this.clusters = rawClusters
                .filter(c => c.id !== 'context_vault' && c.id !== 'doc_shelf')
                .map(c => {
                    const layer = c.layer || (c.data && c.data.layer) || (c.id === 'cluster_ghosts' ? 'external' : c.id.startsWith('sys_') ? 'ai' : 'user');
                    const clientLayer = c.clientLayer || (c.data && c.data.clientLayer);

                    // [v0.3.34] Default collapsed to false to ensure initLODState captures them
                    return { ...c, layer, clientLayer, collapsed: c.collapsed === true ? true : false };
                });
            // [v0.3.33 Phase 2] Build ClusterHierarchy runtime index
            this.clusterHierarchy = new ClusterHierarchy(this.clusters);

            // [DESKTOP_TRACK] 1. AFTER_LAYOUT (백엔드에서 막 넘어온 직후)
            const trackDesktop1 = this.clusters.find(c => c.id.includes('desktop'));
            if (trackDesktop1) console.log('[DESKTOP_TRACK] AFTER_LAYOUT', trackDesktop1.id, trackDesktop1.y || (trackDesktop1.position ? trackDesktop1.position.y : 'none'));

            // [Phase 2C] Apply Workspace Cluster Positions
            if (projectState.synapse_workspace && projectState.synapse_workspace.layout_state) {
                const layout = projectState.synapse_workspace.layout_state;
                this.clusters.forEach(c => {
                    const pos = layout.clusterPositions[c.id];
                    // Sanity check against the old Y=752000 bug
                    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && Math.abs(pos.x) < 500000 && Math.abs(pos.y) < 500000) {
                        c.position = { x: pos.x, y: pos.y }; 
                        c.positionSource = pos.source || 'auto';
                        c.confidence = pos.confidence || 0.2;
                        c.x = pos.x;
                        c.y = pos.y;
                    } else {
                        if (c.position && (Math.abs(c.position.x) > 500000 || Math.abs(c.position.y) > 500000)) {
                            c.position = { x: 0, y: 0 };
                            c.x = 0; c.y = 0;
                        }
                        c.positionSource = 'auto';
                        c.confidence = 0.2;
                    }
                });
            } else {
                this.clusters.forEach(c => {
                    if (c.position && (Math.abs(c.position.x) > 500000 || Math.abs(c.position.y) > 500000)) {
                        c.position = { x: 0, y: 0 };
                        c.x = 0; c.y = 0;
                    }
                });
            }

            // [DESKTOP_TRACK] 2. AFTER_WORKSPACE_RESTORE (캐시 복원 직후)
            const trackDesktop2 = this.clusters.find(c => c.id.includes('desktop'));
            if (trackDesktop2) console.log('[DESKTOP_TRACK] AFTER_WORKSPACE_RESTORE', trackDesktop2.id, trackDesktop2.y || (trackDesktop2.position ? trackDesktop2.position.y : 'none'));

            // [v0.3.21] Heatmap Data Sync
            this.clusterFlows = projectState.cluster_flows || [];
            
            // [Phase 2B.13] Edge Bundle Data Sync
            this.metaEdges = projectState.metaEdges || [];

            // [v0.3.34 Fix] Initial camera restore removed from here.
            // Camera init is now handled in a single unified path at the bottom of loadProjectState,
            // after all data (nodes, clusters, edges) and spatial index are ready.

            // 외부 패널 UI 즉시 렌더링
            this.renderDocShelfList();

            // [v0.2.22] System Clusters initialization
            this.getOrCreateSystemClusters();

            // [v0.3.33.6] Define hasWorkspaceLayout earlier to prevent layout reset
            const hasWorkspaceLayout = !!(projectState.synapse_workspace && projectState.synapse_workspace.layout_state && Object.keys(projectState.synapse_workspace.layout_state.nodePositions || {}).length > 0);

            // [v0.3.33.1] 3. Hierarchical Grid Distribution
            if (!hasWorkspaceLayout) {
                this.distributeClustersHierarchically();
            } else {
                console.log('[LAYOUT_SKIP] distributeClustersHierarchically skipped due to saved workspace layout');
            }

            // [v0.3.29] Cluster-level push-apart (runs after system clusters are placed, before node overlap resolution)
            if (!preserveView && !hasWorkspaceLayout) {
                try {
                    // [v0.3.34] Re-enable resolveClusterOverlaps with new Spatial Grid (O(N)) implementation
                    this.resolveClusterOverlaps();
                } catch (clusterErr) {
                    this.log('resolveClusterOverlaps failed but continuing', 'error', clusterErr.message);
                }
            }

            // [v0.2.24 New Rule] Documentation Shelf is collapsed by default
            // [v0.3.33.1] Cluster Collapse Depth: Expand only up to Depth 2 by default
            const depthMap = new Map();
            const setDepth = (cId, depth) => {
                depthMap.set(cId, depth);
                const children = this.clusters.filter(c => c.parent_id === cId);
                children.forEach(child => setDepth(child.id, depth + 1));
            };
            this.clusters.filter(c => !c.parent_id).forEach(root => setDepth(root.id, 1));

            this.clusters.forEach(cluster => {
                if (cluster.id === 'doc_shelf') {
                    if (cluster.collapsed === undefined) {
                        cluster.collapsed = true; // Collapse by default
                    }
                } else if (cluster.id.startsWith('sys_cluster_')) {
                    if (cluster.collapsed === undefined) {
                        cluster.collapsed = false; // System clusters are expanded by default
                    }
                } else {
                    if (cluster.collapsed === undefined) {
                        const depth = depthMap.get(cluster.id) || 1;
                        cluster.collapsed = depth >= 2; // Show only up to Depth 2
                    }
                }
            });

            // Reset transient states
            this.baselineNodes = null; // Clear comparison artifacts
            this.selectedNodes = new Set(); // Clear selection
            this.selectedEdge = null;

            // 🔍 데이터 무결성 보정 (Data Hygiene)
            // node.data.cluster_id와 node.cluster_id 동기화 + clientLayer
            this.nodes.forEach(node => {
                // 1. data.cluster_id -> cluster_id
                if (node.data && node.data.cluster_id && !node.cluster_id) {
                    node.cluster_id = node.data.cluster_id;
                }
                // 2. cluster_id -> data.cluster_id
                if (node.cluster_id && (!node.data || !node.data.cluster_id)) {
                    if (!node.data) node.data = {};
                    node.data.cluster_id = node.cluster_id;
                }
                // 3. clientLayer 동기화
                const cl = node.clientLayer || (node.data && node.data.clientLayer);
                if (cl) {
                    node.clientLayer = cl;
                    if (node.data) node.data.clientLayer = cl;
                    const username = node.clientUsername || (node.data && node.data.clientUsername);
                    this.registerClientLayer(cl, username);
                }
            });


            // Tree 데이터 빌드
            try {
                if (this.treeRenderer) {
                    this.treeData = this.treeRenderer.buildTree(this.nodes, this.projectName || 'Project') || [];
                }
            } catch (treeErr) {
                this.log('Tree build failed but continuing', 'error', treeErr.message);
            }

            // Flow 데이터 빌드
            try {
                if (this.flowRenderer) {
                    // [Fix] 기존 데이터가 'internal'(상세 로직)인 경우 덮어쓰지 않음
                    const needsReset = !this.flowData || this.flowData.type === 'global' || !this.flowData.steps || this.flowData.steps.length === 0;
                    if (needsReset) {
                        this.flowData = this.flowRenderer.buildFlow(this.nodes) || { steps: [] };
                        this.log('Refreshed Global Flow data');
                    } else {
                        this.log('Preserved Internal Flow data during state load');
                    }
                }
            } catch (flowErr) {
                this.log('Flow build failed but continuing', 'error', flowErr.message);
            }

            // [v0.3.32.3] Fix: MUST resolve overlaps if positions are missing or all nodes are at (0,0), regardless of preserveView
            const hasValidPositions = this.nodes.length > 0 && this.nodes.every(n => n.position && Number.isFinite(n.position.x));
            const allAtOrigin = this.nodes.length > 1 && this.nodes.every(n => n.position && n.position.x === 0 && n.position.y === 0);
            
            // [v0.3.33 Phase B] Coordinate trace before resolveOverlaps (position init done)
            { const _n = this.nodes; let _mnX=Infinity,_mxX=-Infinity,_mnY=Infinity,_mxY=-Infinity; for(let _i=0;_i<_n.length;_i++){const p=_n[_i].position;if(p){if(p.x<_mnX)_mnX=p.x;if(p.x>_mxX)_mxX=p.x;if(p.y<_mnY)_mnY=p.y;if(p.y>_mxY)_mxY=p.y}} console.log('[COORD_TRACE] beforeResolveOverlaps minX=' + _mnX + ' maxX=' + _mxX + ' minY=' + _mnY + ' maxY=' + _mxY); }

            // [DESKTOP_TRACK] 3. BEFORE_RENDER (모든 전처리 끝난 직후)
            const trackDesktop3 = this.clusters.find(c => c.id.includes('desktop'));
            if (trackDesktop3) console.log('[DESKTOP_TRACK] BEFORE_RENDER', trackDesktop3.id, trackDesktop3.y || (trackDesktop3.position ? trackDesktop3.position.y : 'none'));

            if (!hasWorkspaceLayout && (!preserveView || !hasValidPositions || allAtOrigin)) {
                try {
                    this.resolveOverlaps();
                    // [v0.3.33.5] Fix: Must rebuild spatial index after layout moves nodes, otherwise edges remain indexed at (0,0) and disappear!
                    this.buildSpatialIndex();
                } catch (overlapErr) {
                    this.log('resolveOverlaps failed but continuing', 'error', overlapErr.message);
                }
            } else {
                this.log(`Skipping overlap resolution (preserveView: ${preserveView}, hasWorkspaceLayout: ${hasWorkspaceLayout}, hasValidPositions: ${hasValidPositions})`);
            }

            // UI 업데이트
            const nodeCountEl = document.getElementById('node-count');
            const edgeCountEl = document.getElementById('edge-count');
            if (nodeCountEl) nodeCountEl.textContent = this.nodes.length;
            if (edgeCountEl) edgeCountEl.textContent = this.edges.length;

            // [v0.2.24] Selection Recovery: Re-link selected nodes to NEW objects
            if (selectedIds && selectedIds.size > 0) {
                this.selectedNodes.clear();
                this.nodes.forEach(node => {
                    if (selectedIds.has(node.id)) {
                        this.selectedNodes.add(node);
                        if (node.id === oldSelectedNodeId) {
                            this.selectedNode = node;
                        }
                    }
                });
                this.log(`Recovered selection for ${this.selectedNodes.size} nodes.`);
            }

            // Fit view or Restore transform
            this.resizeCanvas(!preserveView); // [v0.2.24] Force immediate resize before fitView
            
            // [v0.3.22.10] Finalizing Node Stats AFTER all sync/normalization
            const _tNodeCache = performance.now();
            this.updateNodeStats();
            console.log(`[PERF] NodeCacheTime: ${(performance.now() - _tNodeCache).toFixed(1)}ms (nodes=${this.nodes.length}, edges=${this.edges.length})`);
            
            console.time('AFTER_NODE_CACHE');
            console.log('[PERF] BeforeValidationPrep');

            // 데이터 준비 후 항상 LOD State 초기화 + SpatialIndex 구축
            if (this.clusters && this.clusters.length > 0) {
                this.buildHierarchy();
                this.initLODState();
                this._lodStateInitialized = true;
            }
            try { this.buildSpatialIndex(); } catch(e) { console.error('[FATAL] buildSpatialIndex crashed:', e); }

            if (!preserveView) {
                // [v0.3.34 Fix] Single camera init path: always fitView() on first load.
                // Camera restore for subsequent loads is handled separately.
                if (this._lastDataHash == null) {
                    try {
                        this.fitView();
                        console.log('[SYNAPSE] Camera fit to graph (first load)');
                    } catch(e) { console.error('[FATAL] fitView crashed:', e); this.render(); }
                } else {
                    // Subsequent load with saved camera state
                    this.render();
                }
            } else {
                this.render();
            }

            // [v0.3.20.5] Aggressive Loading UI cleanup
            if (loadingEl) {
                console.log('[SYNAPSE] Removing loading overlay');
                loadingEl.remove();
                // [v0.3.33 Phase 0] FirstInteractive = time from IPC arrival to UI ready
                const _tFirstInteractive = performance.now() - _perf.t0;
                console.log(`[PERF] FirstInteractive: ${_tFirstInteractive.toFixed(1)}ms`);
                console.log(`[PERF] GraphBuildTimeMs: ${_tFirstInteractive.toFixed(1)}`);
            }

            // [v0.2.24] IPC Optimization: Batched Architecture Validation (O(1) Message count)
            // [v0.3.33 Phase 2 Fix] Disable background validation for large graphs to prevent 10-minute IPC freeze
            if (typeof vscode !== 'undefined' && this.edges.length > 0 && this.edges.length < 5000) {
                const edgesToValidate = this.edges.filter(edge => {
                    if (!edge || !edge.from || !edge.to) return false;
                    // Skip if already has AI validation or logic validation is unchanged
                    return !edge.validation;
                });

                console.log('[PERF] ValidationInputEdges:', edgesToValidate.length);
                console.log('[PERF] BeforeValidateEdgesBatch');
                console.timeEnd('AFTER_NODE_CACHE');

                if (edgesToValidate.length > 0) {
                    console.log(`[SYNAPSE] Requesting batched validation for ${edgesToValidate.length} edges...`);

                    // Group edges with their node context to save backend lookup time
                    const validationPayload = edgesToValidate.map(edge => {
                        const fromNode = this.nodeMap.get(edge.from);
                        const toNode = this.nodeMap.get(edge.to);
                        return fromNode && toNode ? {
                            edgeId: edge.id,
                            fromNode,
                            toNode,
                            type: edge.type
                        } : null;
                    }).filter(Boolean);

                    if (validationPayload.length > 0) {
                        const _tEdgeCache = performance.now();
                        vscode.postMessage({
                            command: 'validateEdgesBatch', // [v0.2.24] New Batched Command
                            batch: validationPayload
                        });
                        console.log(`[PERF] EdgeCacheTime (validateEdgesBatch prep): ${(performance.now() - _tEdgeCache).toFixed(1)}ms (edges=${validationPayload.length})`);
                    }
                }
            }

            console.log('[SYNAPSE] Loaded project state with', this.nodes.length, 'nodes');

            // Critical check for positions
            const validPositions = this.nodes.filter(n => n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number').length;
            const invalidPositions = this.nodes.length - validPositions;
            console.log(`[SYNAPSE] Valid positions: ${validPositions} / ${this.nodes.length}`);
            if (invalidPositions > 0) {
                console.warn(`[SYNAPSE] Invalid positions: ${invalidPositions} nodes missing position data`);
            }

            console.log('[SYNAPSE] Tree data:', this.treeData);
            console.log('[SYNAPSE] Flow data:', this.flowData);
            console.log('[SYNAPSE] Clusters:', this.clusters);
        } catch (error) {
            console.error('[SYNAPSE] loadProjectState error:', error);
        } finally {
            // 로딩 숨기기 (무조건 실행)
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.remove(); // Force remove to prevent blocking

            // [v0.2.24] 데이터 로드 후 강제 렌더링 및 WebGL 버퍼 갱신 플래그 설정
            this.isDirty = true;
            this.isGraphDataDirty = true;
            this.isEdgeDirty = true;
            this.isTextDirty = true;

            console.log('[STATE_SIZE]', this.nodes?.length, this.edges?.length, this.clusters?.length);
            console.timeEnd('loadProjectState');

            this.render();
        }
    }

    // [v0.3.2] Fuzzy Match Helper (fzf-style)
    // Characters must appear in order, but not necessarily consecutively.
    // [v0.3.15] Inspired by or using fzf logic (MIT)
    // IMPORTANT: Do NOT remove this licensing notice.
    /*
     * fzf (C) 2013-2023 Junegunn Choi
     * MIT License
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    fuzzyMatch(text, query) {
        if (!query) return true;
        text = text.toLowerCase();
        query = query.toLowerCase();
        let queryIdx = 0;
        for (let i = 0; i < text.length && queryIdx < query.length; i++) {
            if (text[i] === query[queryIdx]) {
                queryIdx++;
            }
        }
        return queryIdx === query.length;
    }


    // [v0.3.1] 문서 노드들을 외부 패널 UI로 렌더링 (Documentation Shelf)
    renderDocShelfList(filterQuery = '') {
        const listEl = document.getElementById('docs-shelf-list');
        if (!listEl) return;

        listEl.innerHTML = '';
        const search = filterQuery.toLowerCase();

        const filtered = this.docShelfNodes.filter(n => {
            if (!search) return true;
            const text = (n.data?.label || n.id || '') + ' ' + (n.data?.description || '') + ' ' + (n.data?.file || '');
            return this.fuzzyMatch(text, search);
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<div style="color:var(--fg-dim); padding:10px;">No documentation matches found.</div>';
            return;
        }

        filtered.forEach(node => {
            const item = document.createElement('div');
            item.className = 'doc-item';

            const title = document.createElement('div');
            title.className = 'doc-item-title';
            title.textContent = node.data?.label || node.id;

            const preview = document.createElement('div');
            preview.className = 'doc-item-preview';
            preview.textContent = node.data?.file || 'Structural documentation file.';

            item.appendChild(title);
            item.appendChild(preview);

            item.addEventListener('click', () => {
                // [v0.3.15] Center-on and Highlight
                this.focusNodeInGraph(node.id);
                
                // Highlight pulse effect (using temporary state)
                node.isHighlighted = true;
                setTimeout(() => {
                    node.isHighlighted = false;
                    this.render();
                }, 2000);

                // Optional: Close search panel if desired, or keep open for multiple results
                // document.getElementById('docs-shelf-panel').classList.remove('visible');
            });

            // Double click to open file
            item.addEventListener('dblclick', () => {
                if (typeof vscode !== 'undefined' && node.data?.file) {
                    vscode.postMessage({ command: 'openFile', filePath: node.data.file });
                }
            });

            listEl.appendChild(item);
        });
    }

    updateClusterLayout() {
        if (!this.clusters || this.clusters.length === 0) return;
        const ITERATIONS = 3;
        const CONSTANT = 180; // Base spacing multiplier
        
        for (let iter = 0; iter < ITERATIONS; iter++) {
            const clusterStats = new Map();
            for (const cluster of this.clusters) {
                const nodesInCluster = this.nodes.filter(n => n.cluster_id === cluster.id);
                if (nodesInCluster.length === 0) continue;
                
                let cx = 0, cy = 0;
                let validCount = 0;
                for (const n of nodesInCluster) {
                    if (n.position) {
                        cx += n.position.x;
                        cy += n.position.y;
                        validCount++;
                    }
                }
                if (validCount > 0) {
                    cx /= validCount;
                    cy /= validCount;
                }
                
                // clusterRadius = sqrt(nodeCount) * constant
                const radius = Math.sqrt(nodesInCluster.length) * CONSTANT;
                clusterStats.set(cluster.id, { cx, cy, radius, nodes: nodesInCluster });
            }

            let moved = false;
            const clusterIds = Array.from(clusterStats.keys());
            const forces = new Map();
            for (const id of clusterIds) forces.set(id, { x: 0, y: 0 });

            for (let i = 0; i < clusterIds.length; i++) {
                for (let j = i + 1; j < clusterIds.length; j++) {
                    const cA = clusterStats.get(clusterIds[i]);
                    const cB = clusterStats.get(clusterIds[j]);
                    
                    let dx = cB.cx - cA.cx;
                    let dy = cB.cy - cA.cy;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    const minDist = cA.radius + cB.radius;
                    
                    if (dist < 0.01) {
                        dx = Math.random() * 2 - 1;
                        dy = Math.random() * 2 - 1;
                        dist = Math.sqrt(dx*dx + dy*dy);
                    }

                    if (dist < minDist) {
                        moved = true;
                        const force = (minDist - dist) / 2;
                        const cA_weight = cA.confidence || (cA.source === 'user' ? 1.0 : 0.2);
                        const cB_weight = cB.confidence || (cB.source === 'user' ? 1.0 : 0.2);
                        const total_weight = cA_weight + cB_weight;
                        
                        // Push based on inverse weight (heavier moves less)
                        const shiftA = force * (cB_weight / total_weight);
                        const shiftB = force * (cA_weight / total_weight);
                        
                        forces.get(clusterIds[i]).x -= (dx / dist) * shiftA;
                        forces.get(clusterIds[i]).y -= (dy / dist) * shiftA;
                        forces.get(clusterIds[j]).x += (dx / dist) * shiftB;
                        forces.get(clusterIds[j]).y += (dy / dist) * shiftB;
                    }
                }
            }

            const MAX_PUSH = 2000;
            for (const id of clusterIds) {
                const f = forces.get(id);
                if (Math.abs(f.x) < 0.1 && Math.abs(f.y) < 0.1) continue;
                
                if (Math.abs(f.x) > MAX_PUSH) f.x = Math.sign(f.x) * MAX_PUSH;
                if (Math.abs(f.y) > MAX_PUSH) f.y = Math.sign(f.y) * MAX_PUSH;
                
                const c = clusterStats.get(id);
                for (const n of c.nodes) {
                    if (n.positionSource !== 'user') {
                        n.position.x += f.x;
                        n.position.y += f.y;
                    }
                }
            }
            if (!moved) break;
        }
    }

    updateLocalLayout() {
        // [P1] Bounds logger helper
        const getBounds = (nodes) => {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const n of nodes) {
                if (n.position?.x < minX) minX = n.position.x;
                if (n.position?.x > maxX) maxX = n.position.x;
                if (n.position?.y < minY) minY = n.position.y;
                if (n.position?.y > maxY) maxY = n.position.y;
            }
            return { minX, maxX, minY, maxY };
        };
        console.log("[LAYOUT_STAGE]", "BeforeLocalLayout", getBounds(this.nodes));

        const MIN_DISTANCE_X = 130; // [v0.3.33.2 Fix] Must be <= 140 (LayoutEngine's NODE_SPACING_X)
        const MIN_DISTANCE_Y = 70;  // [v0.3.33.2 Fix] Must be <= 80 (LayoutEngine's NODE_SPACING_Y)
        const ITERATIONS = 4;

        // [v0.3.34] Optimization: Group by cluster to reduce O(N^2) to sum(O(K^2))
        const nodesByCluster = new Map();
        const posSnapshot = new Map();
        const exactOverlapGroups = new Map();
        
        this.nodes.forEach(n => {
            if (n.position) {
                const key = `${n.position.x},${n.position.y}`;
                if (!exactOverlapGroups.has(key)) exactOverlapGroups.set(key, []);
                exactOverlapGroups.get(key).push(n);

                const cid = n.cluster_id || 'unassigned';
                if (!nodesByCluster.has(cid)) nodesByCluster.set(cid, []);
                nodesByCluster.get(cid).push(n);
            }
        });

        // [v0.3.33.5] Anti-Explosion: Distribute nodes at EXACTLY the same position into a grid
        for (const [key, group] of exactOverlapGroups.entries()) {
            if (group.length > 1) {
                const cols = Math.ceil(Math.sqrt(group.length));
                const startX = group[0].position.x;
                const startY = group[0].position.y;
                for (let i = 0; i < group.length; i++) {
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    group[i].position.x = startX + col * MIN_DISTANCE_X;
                    group[i].position.y = startY + row * MIN_DISTANCE_Y;
                }
            }
        }

        // Populate snapshot AFTER grid distribution
        this.nodes.forEach(n => {
            if (n.position) posSnapshot.set(n.id, { x: n.position.x, y: n.position.y });
        });

        const clusterHiddenState = new Map();
        if (this.clusters) {
            this.clusters.forEach(c => clusterHiddenState.set(c.id, c.collapsed));
        }

        // [P1] Cluster Size Debug
        let maxClusterSize = 0;
        let largestCluster = '';
        for (const [cid, clusterNodes] of nodesByCluster.entries()) {
            if (clusterNodes.length > maxClusterSize) {
                maxClusterSize = clusterNodes.length;
                largestCluster = cid;
            }
        }
        console.log("[LAYOUT_DEBUG] maxClusterSize:", maxClusterSize, "in cluster:", largestCluster);
        console.log("[LAYOUT_DEBUG] cluster sample", largestCluster, maxClusterSize);

        for (let iter = 0; iter < ITERATIONS; iter++) {
            let movedTotal = false;

            for (const [cid, clusterNodes] of nodesByCluster.entries()) {
                if (clusterNodes.length < 2) continue;
                if (clusterHiddenState.get(cid)) continue; // Skip hidden clusters

                for (let i = 0; i < clusterNodes.length; i++) {
                    for (let j = i + 1; j < clusterNodes.length; j++) {
                        const nodeA = clusterNodes[i];
                        const nodeB = clusterNodes[j];

                        const pA = posSnapshot.get(nodeA.id);
                        const pB = posSnapshot.get(nodeB.id);

                        const dx = pB.x - pA.x;
                        const dy = pB.y - pA.y;
                        const adx = Math.abs(dx);
                        const ady = Math.abs(dy);

                        if (adx < MIN_DISTANCE_X && ady < MIN_DISTANCE_Y) {
                            movedTotal = true;
                            
                            const SNAP = this.GRID_SNAP_SIZE || 40;
                            let shiftX = (MIN_DISTANCE_X - adx) / 2;
                            let shiftY = (MIN_DISTANCE_Y - ady) / 2;
                            
                            shiftX = Math.max(SNAP, Math.ceil(shiftX / SNAP) * SNAP);
                            shiftY = Math.max(SNAP, Math.ceil(shiftY / SNAP) * SNAP);

                            const wA = nodeA.confidence || (nodeA.positionSource === 'user' ? 1.0 : 0.2);
                            const wB = nodeB.confidence || (nodeB.positionSource === 'user' ? 1.0 : 0.2);
                            const totalW = wA + wB;
                            
                            const shiftXA = shiftX * 2 * (wB / totalW);
                            const shiftXB = shiftX * 2 * (wA / totalW);
                            const shiftYA = shiftY * 2 * (wB / totalW);
                            const shiftYB = shiftY * 2 * (wA / totalW);

                            if (dx >= 0) {
                                nodeA.position.x -= shiftXA;
                                nodeB.position.x += shiftXB;
                            } else {
                                nodeA.position.x += shiftXA;
                                nodeB.position.x -= shiftXB;
                            }

                            if (dy >= 0) {
                                nodeA.position.y -= shiftYA;
                                nodeB.position.y += shiftYB;
                            } else {
                                nodeA.position.y += shiftYA;
                                nodeB.position.y -= shiftYB;
                            }
                        }
                    }
                }
            }
            if (!movedTotal) break;
            
            // Update snapshot for next iteration
            this.nodes.forEach(n => {
                if (n.position) posSnapshot.set(n.id, { x: n.position.x, y: n.position.y });
            });
        }
        console.log("[LAYOUT_STAGE]", "AfterLocalLayout", getBounds(this.nodes));
    }

    resolveOverlaps() {
        if (!this.nodes || this.nodes.length < 2) return;

        // [v0.3.33.2 Phase A] We NO LONGER run updateClusterLayout() because distributeClustersHierarchically() 
        // already guarantees perfect, non-overlapping physical bounds for all clusters! 
        // Running physics simulations on top of it will only destroy the grid and cause random overlaps.
        this.updateLocalLayout();

        // [v0.3.15] Re-snap to grid after overlap resolution to maintain Grid Sovereignty
        this.nodes.forEach(node => {
            if (node.position) {
                node.position.x = Math.round(node.position.x / this.GRID_SNAP_SIZE) * this.GRID_SNAP_SIZE;
                node.position.y = Math.round(node.position.y / this.GRID_SNAP_SIZE) * this.GRID_SNAP_SIZE;
            }
        });

        this.log(`[STATE-DETERMINISM] Hash After Layout: ${this.getFingerprint(this.nodes).substring(0, 60)}...`);

        // [LAYOUT_DEBUG] Output coordinates range to detect physics explosion
        const xs = this.nodes.map(n => n.position?.x).filter(x => typeof x === 'number');
        const ys = this.nodes.map(n => n.position?.y).filter(y => typeof y === 'number');
        if (xs.length > 0 && ys.length > 0) {
            console.log(`[LAYOUT_DEBUG] xRange: ${Math.min(...xs)} to ${Math.max(...xs)}, yRange: ${Math.min(...ys)} to ${Math.max(...ys)}`);
        }
    }

    computeWorldBounds() {
        if (this.renderMode === 'flow' && this.flowData && this.flowData.steps && this.flowData.steps.length > 0) {
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            for (const step of this.flowData.steps) {
                if (!step.position || typeof step.position.x !== 'number' || typeof step.position.y !== 'number') continue;
                if (Number.isNaN(step.position.x) || Number.isNaN(step.position.y)) continue;
                minX = Math.min(minX, step.position.x);
                minY = Math.min(minY, step.position.y);
                maxX = Math.max(maxX, step.position.x + 220); // Flow node width
                maxY = Math.max(maxY, step.position.y + 100); // Flow node height
            }
            if (minX !== Infinity) {
                return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
            }
        }

        if (!this.nodes || this.nodes.length === 0) {
            return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        const nodesToMeasure = this._visibleNodesCache || this.nodes;
        for (const node of nodesToMeasure) {
            if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') continue;
            if (Number.isNaN(node.position.x) || Number.isNaN(node.position.y)) continue;
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + 120);
            maxY = Math.max(maxY, node.position.y + 60);
        }

        // [v0.3.33.2 Fix] Include visible clusters in world bounds so collapsed clusters don't get cut off in FIT view
        const clustersToMeasure = this._visibleGraphClusters || this.clusters || [];
        for (const cluster of clustersToMeasure) {
            if (cluster.bounds && cluster.bounds.minX !== Infinity) {
                minX = Math.min(minX, cluster.bounds.minX);
                minY = Math.min(minY, cluster.bounds.minY);
                maxX = Math.max(maxX, cluster.bounds.maxX);
                maxY = Math.max(maxY, cluster.bounds.maxY);
            }
        }

        if (minX === Infinity || minY === Infinity) {
            minX = 0; minY = 0; maxX = 100; maxY = 100;
        }

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }

    fitCameraToBounds(bounds) {
        const padding = 100;
        const availableWidth = this.canvas.clientWidth - padding;
        const availableHeight = this.canvas.clientHeight - padding;

        const zoomX = availableWidth / Math.max(bounds.width, 1);
        const zoomY = availableHeight / Math.max(bounds.height, 1);

        let newZoom = Math.min(zoomX, zoomY);
        // [v0.3.33.1] Allow zooming out infinitely for massive graphs
        newZoom = Math.min(Math.max(newZoom, 0.001), 2.0);

        this.transform.zoom = newZoom;
        this.transform.offsetX = (this.canvas.clientWidth - bounds.width * this.transform.zoom) / 2 - bounds.minX * this.transform.zoom;
        this.transform.offsetY = (this.canvas.clientHeight - bounds.height * this.transform.zoom) / 2 - bounds.minY * this.transform.zoom;

        console.log('[DEBUG] fitCameraToBounds applied:', {
            bounds, zoom: this.transform.zoom, offsetX: this.transform.offsetX, offsetY: this.transform.offsetY
        });

        this.updateZoomDisplay();
        this.isDirty = true;
        this.requestRender();
    }

    fitView() {
        if (!this.nodes || this.nodes.length === 0) {
            this.transform = { zoom: 1.0, offsetX: 0, offsetY: 0 };
            this.updateZoomDisplay();
            return;
        }
        const bounds = this.computeWorldBounds();
        this.fitCameraToBounds(bounds);
    }

    updateZoomDisplay() {
        if (document.getElementById('zoom-level')) {
            document.getElementById('zoom-level').textContent = Math.round(this.transform.zoom * 100) + '%';
        }
    }


    /**
     * [v0.2.26] GPU 및 WebGL 상태 강제 초기화 (Isolation Guard)
     */
    forceResetGLState() {
        if (!this.webglEnabled || !this.webglRenderer) return;
        const gl = this.webglRenderer.gl;
        if (!gl) return;

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 2D 캔버스 초기화 (Flicker 방지용)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    // [v0.2.26.5] Deeply freeze an object recursively to ensure immutability
    deepFreeze(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        Object.freeze(obj);
        Object.values(obj).forEach(v => {
            if (v && typeof v === 'object' && !Object.isFrozen(v)) {
                this.deepFreeze(v);
            }
        });
        return obj;
    }

    // [v0.2.26.5] Deterministic Hash based on rounded positions
    generateStateFingerprint(nodes) {
        // Must be sorted to be deterministic
        const sorted = [...nodes].sort((a, b) => (a.id || '').localeCompare(b.id || ''));
        return sorted.map(n => {
            const x = Math.round((n.position?.x || 0) * 100) / 100;
            const y = Math.round((n.position?.y || 0) * 100) / 100;
            return `${n.id}:${x},${y}`;
        }).join('|');
    }

    /**
     * [v0.2.26.5] Pure Overlap Resolution with Spatial Hashing (Grid Optimization)
     * O(N) average performance, perfectly deterministic.
     */
    pureResolveOverlaps(nodes) {
        if (!nodes || nodes.length < 2) return nodes;

        const ITERATIONS = 3; // 3 passes for convergence
        const GRID_SIZE = 160; // Grid cell size
        const MIN_DIST = 160;
        const MIN_DIST_SQ = MIN_DIST * MIN_DIST;
        const round = v => Math.round(v * 1000) / 1000;

        let currentNodes = nodes;

        for (let step = 0; step < ITERATIONS; step++) {
            // 1. Build Spatial Hash (Grid)
            const grid = new Map();
            currentNodes.forEach(n => {
                const gx = Math.floor(n.position.x / GRID_SIZE);
                const gy = Math.floor(n.position.y / GRID_SIZE);
                const key = `${gx},${gy}`;
                if (!grid.has(key)) grid.set(key, []);
                grid.get(key).push(n);
            });

            // 2. Compute Shifts using the Grid
            currentNodes = currentNodes.map(target => {
                const p1 = target.position;
                let dx = 0, dy = 0;
                let collisions = 0;

                const gx = Math.floor(p1.x / GRID_SIZE);
                const gy = Math.floor(p1.y / GRID_SIZE);

                // Check 3x3 neighbor cells
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
                                collisions++;
                            }
                        }
                    }
                }

                // 3. Return NEW Object for ALL nodes (Stability)
                return {
                    ...target,
                    position: {
                        x: round(p1.x + dx),
                        y: round(p1.y + dy)
                    }
                };
            });
        }

        // [v0.3.15] Force Snap-to-Grid at the absolute end for Grid Sovereignty
        const SNAP = this.GRID_SNAP_SIZE || 40;
        return currentNodes.map(n => ({
            ...n,
            position: {
                x: Math.round(n.position.x / SNAP) * SNAP,
                y: Math.round(n.position.y / SNAP) * SNAP
            }
        }));
    }

    /**
     * [v0.2.26.5] Build a Deeply Isolated, Immutable Frame State
     */
    buildFrameState(context) {
        // 1. Filter Nodes based on Context Layers
        const filtered = this.nodes.filter(n => {
            const isUser = n.layer === 'user' || 
                (n.data && n.data.layer === 'user') ||
                n.status === 'pending' ||
                (n.id && n.id.startsWith('node_manual_')) ||
                (n.cluster_id && n.cluster_id.startsWith('sys_') && n.cluster_id !== 'sys_cluster_reserved' && n.cluster_id !== 'sys_cluster_buffer');

            const isExternal = n.layer === 'external' ||
                (n.data && n.data.layer === 'external') ||
                n.type === 'external' ||
                n.status === 'ghost' ||
                (n.cluster_id && n.cluster_id === 'cluster_ghosts');

            const cl = n.clientLayer || (n.data && n.data.clientLayer);
            if (cl) {
                if (context.clientLayers && context.clientLayers[cl] !== undefined && !context.clientLayers[cl].visible) return false;
            } else {
                if (isExternal && !context.showExternalLayer) return false;
                if (isUser && !context.showUserLayer) return false;
                if (!isUser && !isExternal && !context.showBaseLayer) return false;
            }
            return true;
        });

        // 2. ISO/DEEP CLONE (Physical Reference Detachment)
        // Manually clone fields to ensure nested stability
        const isolatedNodes = filtered.map(n => ({
            id: n.id,
            category: n.category || 'base',
            status: n.status,
            data: n.data ? { ...n.data, meta: n.data.meta ? { ...n.data.meta } : undefined } : {},
            position: { x: n.position?.x || 0, y: (n.position?.y || 0) + this.getClientLayerOffset(n.clientLayer || (n.data && n.data.clientLayer)) },
            intelligence: n.intelligence ? { dtr: n.intelligence.dtr } : { dtr: 0.3 }
        }));

        // 3. Normalization (Deterministic Sorting)
        isolatedNodes.sort((a, b) => a.id.localeCompare(b.id) || (a.category || '').localeCompare(b.category || ''));

        // 4. Pure Computation (Layout)
        const computedNodes = this.pureResolveOverlaps(isolatedNodes);

        // 5. Deep Freezing (Securing the Pipeline)
        const frozenNodes = this.deepFreeze(computedNodes);

        // 6. Visible Edge Extraction
        const visibleIds = new Set(frozenNodes.map(n => n.id));
        const frozenEdges = this.deepFreeze(
            this.edges
                .filter(e => visibleIds.has(e.from) && visibleIds.has(e.to))
                .map(e => ({ id: e.id, from: e.from, to: e.to, type: e.type, status: e.status }))
        );

        // [v0.3.34] Disable expensive stringify for thousands of nodes
        // this.log(`[DEBUG_RENDER_NODES] Final visible nodes: ${JSON.stringify(frozenNodes.map(n => ({
        //     id: n.id,
        //     label: n.data?.label || n.id,
        //     cluster: n.cluster_id,
        //     x: n.position?.x,
        //     y: n.position?.y
        // })))}`);

        return {
            nodes: frozenNodes,
            edges: frozenEdges,
            fingerprint: this.generateStateFingerprint(frozenNodes),
            context
        };
    }


    /**
     * [v0.2.28] Bootstrap: Render from a deterministic frame state
     * @param {Object} frameState 
     */
    renderFromState(frameState) {
        if (!frameState || !this.ctx) return;

        const zoom = frameState.context.zoom;
        const offsetX = frameState.context.offsetX;
        const offsetY = frameState.context.offsetY;

        // 1. Grid (Standard Canvas)
        this.renderGrid();

        // 2. Transformation
        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(zoom, zoom);

        // [v0.2.28] Render Clusters first (inside transform so it scales correctly)
        this.renderClusters();

        if (this._frameCounter < 3 || this._frameCounter % 60 === 0) {
            console.log(
                '[DRAW] bootstrapMode=true',
                'nodes=', frameState.nodes?.length,
                'edges=', frameState.edges?.length,
                'clusters=', this.clusters?.length
            );
        }

        // 3. Edges
        for (const edge of frameState.edges) {
            this.renderEdge(edge);
        }

        // 4. Nodes
        for (const node of frameState.nodes) {
            this.renderNode(node, zoom);
        }

        this.ctx.restore();
        const hash = calculateFrameHash(frameState);
        console.log(`[SYNAPSE 2D] Frame Rendered. Hash: ${hash}`);
    }

    render() {
        const _perfRenderStart = performance.now();
        
        if (this._frameCounter < 3 || this._frameCounter % 60 === 0) {
            console.log(
                '[RENDER_SOURCE]',
                'this.nodes=', this.nodes?.length,
                'this.edges=', this.edges?.length,
                'this._visibleNodesCache=', this._visibleNodesCache?.length,
                'this._visibleEdgesCache=', this._visibleEdgesCache?.length
            );
        }

        // [v0.3.33.7] Fix: Removed Automatic Overlap Resolution on every dirty flag.
        // Toggling filters (like Hide Noise Nodes) should NOT trigger a complete auto-layout 
        // that destroys the user's manual cluster positioning.
        // if (this.isGraphDataDirty && this.nodes.length > 2) {
        //     this.resolveOverlaps();
        // }

        // [v0.2.28] Bootstrap Bypass (Step 4/5/6)
        // Use REAL data but in a pure, deterministic way.
        if (this.bootstrapMode) {
            const contextSnapshot = {
                zoom: this.transform.zoom,
                offsetX: this.transform.offsetX,
                offsetY: this.transform.offsetY,
                showBaseLayer: this.showBaseLayer,
                showUserLayer: this.showUserLayer,
                showExternalLayer: this.showExternalLayer,
                clientLayers: this.clientLayers,
                selectedNodeIds: new Set(Array.from(this.selectedNodes).map(n => n.id)),
                selectedEdgeId: this.selectedEdge ? this.selectedEdge.id : null
            };

            // [v0.3.32.3] Safety check: NaN corruption guard
            if (Number.isNaN(this.transform.zoom) || !Number.isFinite(this.transform.zoom) || 
                Number.isNaN(this.transform.offsetX) || Number.isNaN(this.transform.offsetY)) {
                console.error("[SYNAPSE 2D] CAMERA CORRUPTED", this.transform);
                // Recover to safe defaults
                this.transform.zoom = 1.0;
                this.transform.offsetX = 0;
                this.transform.offsetY = 0;
                this.updateZoomDisplay();
            }

            const frameState = this.buildFrameState(contextSnapshot);
            this.lastFrameState = frameState; // Save for hit testing


            // 2D Redraw
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.renderFromState(frameState);

            // 3D Redraw (Atomic update)
            if (this.webglRenderer && this.webglEnabled) {
                this.webglRenderer.renderFromState(frameState);
            }
            return;
        }


        this._frameCounter++;
        const shouldLog = this._frameCounter % 120 === 0;

        // [v0.2.28] Trace UI Interaction for Selection Updates
        const currentSelectionHash = Array.from(this.selectedNodes).map(n => n.id).sort().join(',') + (this.selectedEdge?.id || '');
        if (this._lastSelectionHash !== currentSelectionHash) {
            this.isEdgeDirty = true; // Force WebGL Buffer Refresh
            this.isTextDirty = true;
            this._lastSelectionHash = currentSelectionHash;
        }

        // [v0.2.31] Explicit Rendering Boundary: Start
        if (this.webglRenderer) {
            this.webglRenderer.beginFrame();
        }

        // [v0.2.24] Strategic Cache Invalidation (Validate Map & Edge Cache)
        const nodeCount = (this.nodes ? this.nodes.length : 0);
        if (this.isGraphDataDirty || this.nodeMap.size !== nodeCount) {
            this.nodeMap.clear();
            if (this.nodes) {
                for (const n of this.nodes) this.nodeMap.set(n.id, n);
            }
            this.edgeValidationCache.clear(); // Clear heavy validation results
            
            // [v0.3.33] Spatial Index is now explicitly rebuilt via buildSpatialIndex()
            this.buildSpatialIndex();
        }

        // [v0.2.24] Unified Animation Updates (Eco-mode aware)
        if (this.isAnimating || this.isTestingLogic || this.isAligning) {
            const hasActivity = this._isInteracting || this.isDragging || (this.particles?.length || 0) > 0;
            if (hasActivity || (this._frameCounter % 2 === 0)) { // Half-rate if idle
                const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
                const speed = theme ? theme.ANIMATION.EDGE_FLOW_SPEED : 0.5;
                this.animationOffset = (this.animationOffset + speed) % 40;
            }
            if (this.isTestingLogic && (this.edges?.length || 0) > 0) {
                if (Math.random() < 0.05 && (this.pulses?.length || 0) < 20) {
                    const randomEdge = this.edges[Math.floor(Math.random() * (this.edges?.length || 0))];
                    if (randomEdge) {
                        this.pulses.push({ edgeId: randomEdge.id, progress: 0, speed: 0.01 + Math.random() * 0.02 });
                    }
                }
                this.pulses = (this.pulses || []).filter(p => {
                    p.progress += p.speed;
                    return p.progress < 1;
                });
            }
            this.updateParticles();
            
            // [v0.3.21] Architecture Alignment Physical Step
            if (this.isAligning) {
                this.updateAlignmentSimulation();
            }
        }

        // [v0.2.32] Power-Saving (Sleeping) Logic: Move ABOVE clear to prevent screen flickering/disappearance
        // If not dirty and not animating, NO NEED to clear or redraw.
        if (!this.isDirty && !this.isAnimating && !this._isInteracting && !this.isDragging) {
            return;
        }

        if (!this.ctx) return;

        // [v0.2.24] Move background clear to TOP — ensures WebGL is visible even if IDLE
        const ctx = this.ctx;
        const canvas = this.canvas;
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // [FIX v0.3.09] Eco-mode 수면 중 업데이트 방지
        // 렌더링이 시작되었다는 신호를 보내서 Eco-mode가 수면에 들지 않게 함
        this.lastActivityTime = Date.now();

        // [v0.3.4 - Fix 2D Ghosting] ALWAYS clear the entire pixel buffer before drawing.
        // Even in 2D mode, clearRect ensures no leftover alpha or pixels.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!this.webglEnabled) {
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (this.isRendering) return;
        this.isRendering = true;
        this.isDirty = false;
        console.time('render');

        const now = performance.now();
        if (!this._fpsFrames) this._fpsFrames = [];
        this._fpsFrames.push(now);
        if (this._fpsFrames.length > 30) this._fpsFrames.shift();
        if (this._fpsFrames.length >= 2) {
            const elapsed = this._fpsFrames[this._fpsFrames.length - 1] - this._fpsFrames[0];
            const fps = Math.round((this._fpsFrames.length - 1) / (elapsed / 1000));
            const fpsEl = document.getElementById('fps-display');
            if (fpsEl) {
                const suffix = (this.webglEnabled && this.currentMode === 'graph') ? ' (3D)' : '';
                fpsEl.textContent = fps + suffix;
                fpsEl.style.color = fps >= 50 ? '#b8bb26' : fps >= 30 ? '#fabd2f' : '#fb4934';
            }
        }

        // [v0.3.4 Fix] 🛡️ Rendering Safety: Reset critical context state before frame wipe.
        // This prevents "Ghosting" artifacts caused by leaked Alpha or Composition state.
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        try {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Ensure DPR scale for base logic

            ctx.save();
            // [v0.3.32.3] Safety check: NaN corruption guard
            if (Number.isNaN(this.transform.zoom) || !Number.isFinite(this.transform.zoom) || 
                Number.isNaN(this.transform.offsetX) || Number.isNaN(this.transform.offsetY)) {
                console.error("[SYNAPSE 2D] CAMERA CORRUPTED in main render", this.transform);
                this.transform.zoom = 1.0;
                this.transform.offsetX = 0;
                this.transform.offsetY = 0;
                this.updateZoomDisplay();
            }

            ctx.translate(this.transform.offsetX, this.transform.offsetY);
            ctx.scale(this.transform.zoom, this.transform.zoom);

            const zoom = this.transform.zoom;

            if (this.currentMode === 'tree') {
                this.treeRenderer.renderTree(this.ctx, this.treeData, this.transform);
                this.isGraphDataDirty = false;
            } else if (this.currentMode === 'flow') {
                this.flowRenderer.renderFlow(this.ctx, this.flowData);

                // [New] Render Flow Type Indicator
                const type = this.flowData.type === 'internal' ? '🔍 INTERNAL LOGIC' : '🌐 GLOBAL ARCHITECTURE';
                const color = this.flowData.type === 'internal' ? '#b8bb26' : '#83a598';
                this.ctx.fillStyle = color;
                this.ctx.font = 'bold 16px Inter, sans-serif';
                this.ctx.fillText(`MODE: ${type}`, 20, 40);
                this.isGraphDataDirty = false;
            } else {
                // Graph 모드: 그리드 -> 클러스터 -> 엣지 -> 노드 순으로 렌더링
                // [v0.3.27-edge-fix] Unify Node and Edge Visibility Filtering and Cache
                console.log('[PERF] renderNodes2D() entered. TotalNodes:', this.nodes ? this.nodes.length : 0);

                if (this.isGraphDataDirty || !this._visibleNodesCache) {
                    console.time('buildVisibleCaches');
                    const isUserLogic = (n) => 
                        n.layer === 'user' || 
                        (n.data && n.data.layer === 'user') || 
                        (n.id && typeof n.id === 'string' && n.id.startsWith('node_manual_')) ||
                        (n.cluster_id && typeof n.cluster_id === 'string' && n.cluster_id.startsWith('sys_') && n.cluster_id !== 'sys_cluster_reserved' && n.cluster_id !== 'sys_cluster_buffer');

                    const isExternalLogic = (n) =>
                        n.layer === 'external' ||
                        (n.data && n.data.layer === 'external') ||
                        n.type === 'external' ||
                        n.status === 'ghost' ||
                        (n.cluster_id && n.cluster_id === 'cluster_ghosts');

                    // [v0.3.33 Phase 4-D-1] Visible Graph from Resolver (cluster-driven) computed BEFORE node filtering
                    console.log('[VISIBLE_GRAPH_BUILD]', performance.now(), 'expanded', this.expandedClusters?.size);
                    this._visibleGraphClusters = null;
                    if (this.clusterHierarchy && this.expandedClusters) {
                        const _visIds = this._computeResolverVisibleIds();
                        if (_visIds) {
                            this._visibleGraphClusters = Array.from(_visIds)
                                .map(id => this.clusterHierarchy.get(id)?.cluster)
                                .filter(Boolean);
                            this._visibleGraphClusterIds = new Set(_visIds);
                            console.log('[VISIBLE_GRAPH_CLUSTERS]', performance.now(), this._visibleGraphClusters.length);
                        }
                    }

                    console.time('updateLOD'); // overall cache building
                    console.time('LOD:visibleNodes');
                    this._visibleNodesCache = this.nodes.filter(n => {
                        const isUser = isUserLogic(n);
                        const isExternal = isExternalLogic(n);
                        const isActivity = n.cluster_id && typeof n.cluster_id === 'string' && n.cluster_id.includes('activity');

                        const cl = n.clientLayer || (n.data && n.data.clientLayer);
                        if (cl) {
                            if (!this._isClientLayerVisible(n)) { if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=client_layer'); return false; }
                        } else {
                            if (isExternal && !this.showExternalLayer) { if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=layer_external'); return false; }
                            if (isUser && !this.showUserLayer) { if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=layer_user'); return false; }
                            if (!isUser && !isExternal && !this.showBaseLayer) { if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=layer_base'); return false; }
                        }

                        // [v0.3.22.2] Noise Control: Hide Leaf Nodes (WebGL Parity)
                        if (this.hideLeafNodes) {
                            const stats = this.nodeStatsMap.get(n.id);
                            if (stats && stats.connectedNodes < 3) { if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=hide_leaf', 'connectedNodes=' + stats.connectedNodes); return false; }
                        }

                        // [v0.3.22.2] Strategic Visibility: Top-N Focus View (WebGL Parity)
                        if (this.focusTopNodes) {
                            const isEssential = this.selectedNodes.has(n.id) || (this.hoveredNode && this.hoveredNode.id === n.id);
                            if (!this.focusNodeSet.has(n.id) && !isEssential) { if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=focus'); return false; }
                        }

                        const clusterId = n.cluster_id || n.data?.cluster_id;

                        // [v0.3.33 Phase 5] LOD System A (Zoom LOD) Check
                        if (this._visibleGraphClusterIds && clusterId) {
                            if (!this._visibleGraphClusterIds.has(clusterId)) {
                                if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=lod_system_a');
                                return false;
                            }
                        }

                        // [v0.3.33 Phase 4-D-1] LOD Dematerialization: Telescope LOD (System B) Hierarchy Check
                        let isTelescopeCollapsed = false;
                        if (this.clusterHierarchy && this.expandedClusters) {
                            let currNode = this.clusterHierarchy.get(clusterId);
                            let hDepth = 0;
                            while (currNode && hDepth < 100) {
                                const hasChildren = currNode.children && currNode.children.length > 0;
                                if (hasChildren && !this.expandedClusters.has(currNode.id)) {
                                    isTelescopeCollapsed = true;
                                    break;
                                }
                                currNode = currNode.parentId ? this.clusterHierarchy.get(currNode.parentId) : null;
                                hDepth++;
                            }
                        }

                        if (isTelescopeCollapsed) {
                            if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=lod_dematerialized');
                            return false;
                        }

                        // [v0.2.27] Sync: Skip nodes in collapsed clusters (matches 2D behavior - System A)
                        if (clusterId && this.clusterHierarchy) {
                            let curId = clusterId;
                            let limit = 0;
                            while (curId && limit++ < 100) {
                                const hNode = this.clusterHierarchy.get(curId);
                                if (hNode && hNode.cluster && hNode.cluster.collapsed) { 
                                    if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=collapsed_sys_a'); 
                                    return false; 
                                }
                                curId = hNode ? hNode.parentId : null;
                            }
                        }
                        if (isActivity) console.log('[ACTIVITY_REJECT]', n.id, 'reason=PASS');
                        return true;
                    });
                    console.timeEnd('LOD:visibleNodes');

                    // [v0.3.33] Phase 1: Visible Cluster Registry
                    console.time('LOD:visibleClusters');
                    this._visibleClusterIds = new Set();
                    for (const n of this._visibleNodesCache) {
                        const cid = n.cluster_id || n.data?.cluster_id;
                        if (cid) this._visibleClusterIds.add(cid);
                        if (cid) this._visibleClusterIds.add(cid);
                    }
                    console.timeEnd('LOD:visibleClusters');

                    console.log('[ACTIVITY_CLUSTER_VISIBLE]', this._visibleClusterIds.has('folder_app_src_main_java_de_danoeh_antennapod_activity'));
                    // [v0.3.33] Step 7: cluster registry vs node cluster_id sync check
                    console.log('[CLUSTER_COUNT]', this.clusters?.length);
                    console.log('[ACTIVITY_CLUSTER_IDS]', this.clusters?.filter(c => c.id.includes('activity')).map(c => c.id));
                    console.log('[CLUSTER_EXISTS]', this.clusters?.some(c => c.id === 'folder_app_src_main_java_de_danoeh_antennapod_activity'));
                    // [v0.3.33] Probe ⑥: activity node cluster_id dump at build time
                    for (const n of this.nodes) {
                        if (n.id && typeof n.id === 'string' && n.id.includes('MainActivity')) {
                            console.log('[NODE_CLUSTER_ID]', n.id, 'cluster_id=', n.cluster_id, 'data_cluster_id=', n.data?.cluster_id);
                        }
                    }

                    console.time('LOD:visibleEdges');
                    const visibleNodeIds = new Set(this._visibleNodesCache.map(n => n.id));
                    this._visibleNodesSet = new Set(this._visibleNodesCache);
                    this._visibleEdgesCache = this.edges.filter(e => {
                        if (!visibleNodeIds.has(e.from) || !visibleNodeIds.has(e.to)) return false;
                        if (this._visibleGraphClusterIds) {
                            const fn = this.nodeMap.get(e.from);
                            const tn = this.nodeMap.get(e.to);
                            const fc = fn?.cluster_id ?? fn?.data?.cluster_id;
                            const tc = tn?.cluster_id ?? tn?.data?.cluster_id;
                            if (fc) {
                                const matched = this._visibleGraphClusterIds.has(fc);
                                if (!matched) return false;
                            }
                            if (tc) {
                                const matched = this._visibleGraphClusterIds.has(tc);
                                if (!matched) return false;
                            }
                        }
                        return true;
                    });
                    console.timeEnd('LOD:visibleEdges');

                    // [v0.3.33] Phase 2: Dynamic Aggregate Edge Generation (LOD)
                    if (this._visibleGraphClusterIds && this.clusters) {
                        console.time('LOD:aggregateEdges');
                        const edgeMap = new Map();
                        const findVisibleRep = (cid) => {
                            let curId = cid;
                            let depth = 0;
                            while (curId && depth < 100) {
                                if (this._visibleGraphClusterIds.has(curId)) return curId;
                                if (this.clusterHierarchy) {
                                    const hNode = this.clusterHierarchy.get(curId);
                                    if (!hNode || !hNode.parentId || hNode.parentId === curId) break;
                                    curId = hNode.parentId;
                                } else {
                                    const c = this.clusters.find(c => c.id === curId);
                                    if (!c || !c.parent_id || c.parent_id === curId) break;
                                    curId = c.parent_id;
                                }
                                depth++;
                            }
                            return null;
                        };

                        for (const edge of this.edges) {
                            const fn = this.nodeMap.get(edge.from);
                            const tn = this.nodeMap.get(edge.to);
                            if (!fn || !tn) continue;

                            const fc = fn.cluster_id || fn.data?.cluster_id;
                            const tc = tn.cluster_id || tn.data?.cluster_id;
                            if (!fc || !tc) continue;

                            const fromRep = findVisibleRep(fc);
                            const toRep = findVisibleRep(tc);

                            if (fromRep && toRep && fromRep !== toRep) {
                                const key = `${fromRep}→${toRep}`;
                                edgeMap.set(key, (edgeMap.get(key) || 0) + (edge.weight || 1));
                            }
                        }

                        this.metaEdges = [];
                        for (const [key, weight] of edgeMap) {
                            const sep = key.indexOf('→');
                            this.metaEdges.push({ source: key.slice(0, sep), target: key.slice(sep + 1), weight });
                        }
                        console.timeEnd('LOD:aggregateEdges');
                    }
                    console.timeEnd('updateLOD');

                    // [v0.3.34] Invalidate Heatmap Cache on Graph Data Dirty
                    this.clusterFlows = [];

                    // [v0.3.34] Disabled expensive stringify
                    // this.log(`[DEBUG_RENDER_NODES] Final visible nodes: ${JSON.stringify(this._visibleNodesCache.map(n => ({
                    //     id: n.id,
                    //     label: n.data?.label || n.id,
                    //     cluster: n.cluster_id,
                    //     x: Math.round(n.position?.x),
                    //     y: Math.round(n.position?.y)
                    // })))}`);

                    // [v0.3.34] NodeBounds Logging for extreme coordinate detection
                    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                    for (const n of this._visibleNodesCache) {
                        if (n.position?.x < minX) minX = n.position.x;
                        if (n.position?.x > maxX) maxX = n.position.x;
                        if (n.position?.y < minY) minY = n.position.y;
                        if (n.position?.y > maxY) maxY = n.position.y;
                    }
                    console.log(`[PERF] NodeBounds: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
                    console.log(`[PERF] Camera: x=${this.transform?.offsetX}, y=${this.transform?.offsetY}, zoom=${this.transform?.zoom}`);
                    
                    console.log('[PERF] VisibleNodes', this._visibleNodesCache ? this._visibleNodesCache.length : 0);
                    

                    console.log('[PERF] VisibleEdges', this._visibleEdgesCache ? this._visibleEdgesCache.length : 0);
                    console.log('[PERF] First10NodePositions', (this._visibleNodesCache || []).slice(0,10).map(n => ({
                        id: n.id,
                        x: n.position?.x,
                        y: n.position?.y
                    })));
                    console.log('[PERF] LayoutBounds', { minX, maxX, minY, maxY });
                    
                    const dpr = window.devicePixelRatio || 1;
                    const zoom = this.transform.zoom;
                    const viewWidth = this.canvas.width / dpr;
                    const viewHeight = this.canvas.height / dpr;
                    const cMinX = -this.transform.offsetX / zoom - 200;
                    const cMinY = -this.transform.offsetY / zoom - 100;
                    const cMaxX = cMinX + viewWidth / zoom + 400;
                    const cMaxY = cMinY + viewHeight / zoom + 200;
                    const viewportBBox = { minX: cMinX, minY: cMinY, maxX: cMaxX, maxY: cMaxY };

                    let searchCount = 0;
                    if (this.spatialIndex && this.spatialIndex.nodeTree) {
                        searchCount = this.spatialIndex.nodeTree.search(viewportBBox).length;
                    }
                    console.log('[PERF] nodeTree.search(viewportBBox).length:', searchCount);

                    console.log('[PERF] NodeTreeCount', (this.spatialIndex && this.spatialIndex.nodeTree) ? this.spatialIndex.nodeTree.all().length : 0);
                    const visibleNodesCount = this._visibleNodesCache ? this._visibleNodesCache.length : 0;
                    console.log('[PERF] VisibleNodes', visibleNodesCount);
                    console.log('[PERF] Viewport', viewportBBox);
                    console.log('[PERF] FirstNodeBBox', (this.spatialIndex && this.spatialIndex.nodeTree && this.spatialIndex.nodeTree.all().length > 0) ? this.spatialIndex.nodeTree.all()[0] : null);

                    // [P2] RENDER PATH TRACKING
                    console.log("[RENDER_PATH]", {
                        fallbackMode: this.spatialIndex ? this.spatialIndex.fallbackMode : true,
                        searchCount: searchCount,
                        visibleNodesCount: visibleNodesCount,
                        source: this._visibleNodesCache === this.nodes ? "FULL" : "SEARCH"
                    });


                    // [v0.3.30-webgl-fix] Build WebGL-ready cache: bake clientLayerOffset into position.y
                    // so WebGL renderer sees the same absolute Y as the 2D canvas path.
                    // Host nodes pass through by reference (no allocation).
                    this._webglVisibleNodesCache = this._visibleNodesCache.map(n => {
                        const cl = n.clientLayer || (n.data && n.data.clientLayer);
                        if (!cl) return n; // Host node — no offset needed
                        const offsetY = this.getClientLayerOffset(cl);
                        if (!offsetY) return n;
                        return { ...n, position: { x: n.position?.x || 0, y: (n.position?.y || 0) + offsetY } };
                    });
                    console.timeEnd('buildVisibleCaches');
                }

                // [v0.3.28-fix] Cache selectedNodeIds as Set<string> ONCE per frame for O(1) lookup in renderEdge()
                this._selectedNodeIds = new Set(Array.from(this.selectedNodes).map(n => n.id));

                // [v0.2.25] Forced 2D layer for clusters (Option 4)
                this.renderGrid();
                this.renderClusters();
                this.renderTrafficHeatmap(); // [v0.3.21] Heatmap Layer
                this.renderScrollbars();

                // [v0.2.25] Accel Mode (WebGL) - Iron Shell Synergy Check
                if (this.webglRenderer) {
                    const glCanvas = this.webglRenderer.glCanvas;
                    if (this.webglEnabled && this.currentMode === 'graph') {
                        if (glCanvas && glCanvas.style.display !== 'block') {
                            glCanvas.style.display = 'block';
                            glCanvas.style.zIndex = '5';
                            glCanvas.style.opacity = '1';
                        }
                    } else {
                        // [v0.2.25] Physical Isolation: Hide immediately when mode changes
                        if (glCanvas && glCanvas.style.display !== 'none') {
                            glCanvas.style.display = 'none';
                            glCanvas.style.zIndex = '-9999';
                        }
                    }
                }

                // [v0.2.25] Accel Mode (Accel: ON) Constant Rendering Fix
                // Force isDirty to true when Accel is ON to prevent disappearing/flickering
                if (this.webglEnabled && this.currentMode === 'graph') {
                    this.isDirty = true;
                }

                if (!this.debugDisableOverlay) {
                    const dpr = window.devicePixelRatio || 1;
                    
                    if (this.webglEnabled && this.webglRenderer && this.currentMode === 'graph') {
                        // [v0.3.20] Render Hotspots (Background areas) as a transformed 2D overlay underneath WebGL nodes
                        // Since WebGL is on another canvas or layer, we need to ensure this matches exactly.
                        this.ctx.save();
                        this.ctx.setTransform(this.transform.zoom * dpr, 0, 0, this.transform.zoom * dpr, this.transform.offsetX * dpr, this.transform.offsetY * dpr);
                        this.renderHotspots2D();
                        this.ctx.restore();

                        // [v0.2.31] Final Consolidated WebGL Render call (Unified cache is precomputed)

                        const selectedIds = new Set(Array.from(this.selectedNodes).map(n => n.id));

                        // [v0.3.2] Ensure overlay is visible and active only in graph mode
                        const overlay = document.getElementById('webgl-overlay-canvas');
                        if (overlay && overlay.style.display === 'none') {
                            overlay.style.display = 'block';
                            this.isGraphDataDirty = true;
                        }

                        // [v0.3.30-webgl-fix] Use offset-corrected cache for client node Y parity
                        const webglNodes = this._webglVisibleNodesCache || this._visibleNodesCache;
                        
                        if (this._frameCounter < 3 || this._frameCounter % 60 === 0) {
                            console.log(
                                '[WEBGL_DRAW]',
                                'nodesToRender=', webglNodes ? webglNodes.length : 0,
                                'edgesToRender=', this._visibleEdgesCache ? this._visibleEdgesCache.length : 0
                            );
                        }

                        this.webglRenderer.render(
                            webglNodes,
                            this.transform,
                            this.isGraphDataDirty,
                            this._visibleEdgesCache,
                            this.nodeMap,
                            this.isEdgeDirty,
                            this.isTextDirty,
                            selectedIds
                        );

                        // [v0.3.22] 🚀 Hybrid Rendering Upgrade: Render Node & Edge Badges on 2D Overlay
                        const overlayCtx = overlay.getContext('2d');
                        if (overlayCtx) {
                            overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
                            // [v0.3.30-webgl-fix] Badge overlay must use same offset-corrected positions as WebGL
                            const webglNodes = this._webglVisibleNodesCache || this._visibleNodesCache;
                            const projectedPosMap = this.webglRenderer.getProjectedNodePositions(webglNodes, this.transform);
                            const dpr = window.devicePixelRatio || 1;
                        // [v0.3.33 Phase 2 Fix] Optimize Edge Badge Loop (Avoid O(E) per frame)
                        // We only iterate over edges that ACTUALLY have badges. 
                        const badgeEdges = this._badgeEdgesCache || [];
                        for (const edge of badgeEdges) {
                                 try {
                                     // [v0.3.22] Project edge midpoint for 3D alignment
                                     const src = this.nodeMap.get(edge.from);
                                     const tgt = this.nodeMap.get(edge.to);
                                     if (src && tgt && src.position && tgt.position) {
                                         const midX = (src.position.x + tgt.position.x) / 2;
                                         const midY = (src.position.y + tgt.position.y) / 2;
                                         const projectedMidX = midX * this.transform.zoom + this.transform.offsetX;
                                         const projectedMidY = midY * this.transform.zoom + this.transform.offsetY;
                                         
                                         // Use screen space (overlayCtx without transform)
                                         this.renderEdgeBadges(overlayCtx, edge, undefined, undefined, projectedMidX / dpr, projectedMidY / dpr);
                                     }
                                 } catch (e) {
                                     console.error(`[SYNAPSE] Hybrid Edge Badge render error:`, e);
                                 }
                             }

                            // [v0.3.34] Viewport Culling for 2D Badges (CPU Relief)
                            const viewportNodes = (this.spatialIndex && this.spatialIndex.nodeTree) 
                                ? (this.spatialIndex.queryViewport(cMinX, cMinY, cMaxX, cMaxY, 'nodes') || this._visibleNodesCache)
                                : this._visibleNodesCache;

                            for (const node of viewportNodes) {
                                const pos = projectedPosMap.get(node.id);
                                if (pos) {
                                    try {
                                        this.renderNodeBadges(node, pos.x / dpr, pos.y / dpr, this.transform.zoom, overlayCtx);
                                    } catch (e) {
                                        console.error(`[SYNAPSE] Hybrid Node Badge render error:`, e);
                                    }
                                }
                            }
                        }

                        this.isGraphDataDirty = false;
                        this.isEdgeDirty = false;
                        this.isTextDirty = false;
                    } else {
                        // [v0.3.2] View Isolation (Rule 08): Hide WebGL overlay if not in graph mode or disabled
                        if (this.webglRenderer) {
                            const overlay = document.getElementById('webgl-overlay-canvas');
                            if (overlay && overlay.style.display !== 'none') {
                                overlay.style.display = 'none';
                                this.webglRenderer.reset(); // Pure isolation
                                console.log("[SYNAPSE] WebGL Overlay Hidden (View Isolation)");
                            }
                        }

                        // [v0.3.20] Fix: Apply Camera Transform to 2D context before rendering
                        // This was missing, causing nodes/edges to disappear at high zoom/offset
                        this.ctx.save();
                        this.ctx.setTransform(
                            this.transform.zoom * dpr, 0, 0, 
                            this.transform.zoom * dpr, 
                            this.transform.offsetX * dpr, 
                            this.transform.offsetY * dpr
                        );

                        // [v0.3.20] Background areas first
                        this.renderHotspots2D();

                        // [v0.3.9] Fixed 2D Mode: Render graph on transformed context
                        if (this.currentMode !== 'cluster') {
                            this.renderEdges2D();
                            this.renderNodes2D(this.transform.zoom);
                            this.renderLabels2D();
                        }

                        this.ctx.restore();

                        // [v0.3.28-fix] Reset dirty flags in 2D path — mirrors WebGL path at L5614
                        this.isGraphDataDirty = false;
                        this.isEdgeDirty = false;
                        this.isTextDirty = false;
                    }
                    this.renderGhostNodes(this.transform.zoom);
                }

                // 드래그 선택 영역 표시 (Always on top of overlay)
                // [v0.2.33] 드래그 선택 영역 표시 (Safe transformation handling)
                if (this.isSelecting) {
                    this.ctx.save();
                    const dpr = window.devicePixelRatio || 1;
                    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Revert to Screen space (scaled by DPR)

                    this.ctx.fillStyle = 'rgba(69, 133, 136, 0.25)';
                    this.ctx.strokeStyle = '#458588';
                    this.ctx.lineWidth = 1;
                    this.ctx.fillRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height);
                    this.ctx.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height);

                    this.ctx.restore();
                }

                this.renderConnectionHandles();
                if (this.isCreatingEdge && this.edgeSource) this.renderGhostEdge();
                this.renderParticles();
            }

            this.ctx.restore();

            // 상태바 업데이트
            if (document.getElementById('selected-count')) {
                document.getElementById('selected-count').textContent = this.selectedNodes.size;
                document.getElementById('node-count').textContent = this.nodes.length;
                document.getElementById('edge-count').textContent = this.edges.length;
                if (document.getElementById('cluster-count')) {
                    document.getElementById('cluster-count').textContent = this.clusters ? this.clusters.length : 0;
                }
                document.getElementById('zoom-level').textContent = `${(this.transform.zoom * 100).toFixed(0)}%`;
                document.getElementById('current-mode').textContent = this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1);
            }

            // LOD 상태 업데이트
            const lodStatusEl = document.getElementById('lod-status');
            if (lodStatusEl) {
                let lodText = "NORMAL";
                const zoom = this.transform.zoom;
                if (zoom < 0.4) lodText = "SATELLITE";
                else if (zoom > 1.5) lodText = "DETAIL";
                lodStatusEl.textContent = lodText;
            }

            // [v0.2.24] Real-time Diagnostic HUD (Performance Measuring)
            this._renderDiagnosticHUD();

            // Debug Overlay: Draw click point to verify world coordinates
            if (this._debugLastWorldClick) {
                this.ctx.fillStyle = '#fb4934';
                this.ctx.beginPath();
                this.ctx.arc(this._debugLastWorldClick.x, this._debugLastWorldClick.y, 5 / this.transform.zoom, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1 / this.transform.zoom;
                this.ctx.stroke();
            }

            this.renderDebugInfo();

        } catch (e) {
            console.error('[SYNAPSE_RENDER_CRASH]', e);
        } finally {
            if (this.webglRenderer) {
                this.webglRenderer.endFrame();
            }
            this.isRendering = false;
            
            const _perfRenderEnd = performance.now();
            const elapsed = _perfRenderEnd - _perfRenderStart;
            
            if (this._frameCounter < 3 || elapsed > 16 || this._frameCounter % 60 === 0) {
                console.log(`[FRAME] ${elapsed.toFixed(2)}ms`);
                console.log(
                  '[RENDER_STATS]',
                  'visibleNodes=', this._visibleNodesCache ? this._visibleNodesCache.length : 0,
                  'visibleEdges=', this._visibleEdgesCache ? this._visibleEdgesCache.length : 0,
                  'visibleClusters=', this._visibleClusterIds ? this._visibleClusterIds.size : 0
                );
            }

            if (elapsed > 5) {
                console.log(`[PERF] Interaction Render: ${elapsed.toFixed(2)}ms`);
            }
        }
    }

    renderEdges2D() {
        if (window.edgeVisibilityMode === 'NO_EDGES') return;

        if (this.edges && this.edges.length > 50000) {
            // [v0.3.33.9] Removed hard cutoff. Allow Spatial Hashing to cull edges.
            // console.log('[PERF] Edge rendering SKIPPED due to limit (> 50000)');
            // return;
        }

        // [v0.3.35] Temporary Diagnostic: Check Node Bounds vs Edge Bounds
        if (this.nodes && this.nodes.length > 0 && this.edges && this._frameCounter % 60 === 0) {
            let minNodeX = Infinity, maxNodeX = -Infinity;
            for (const n of this.nodes) {
                if (n.position) {
                    minNodeX = Math.min(minNodeX, n.position.x);
                    maxNodeX = Math.max(maxNodeX, n.position.x);
                }
            }
            console.log('[NODE_BOUNDS]', minNodeX, maxNodeX);

            let minEdgeX = Infinity, maxEdgeX = -Infinity;
            for (const e of this.edges) {
                const src = this.nodeMap.get(e.from);
                const tgt = this.nodeMap.get(e.to);
                if (src && src.position && tgt && tgt.position) {
                    minEdgeX = Math.min(minEdgeX, src.position.x, tgt.position.x);
                    maxEdgeX = Math.max(maxEdgeX, src.position.x, tgt.position.x);
                }
            }
            console.log('[EDGE_BOUNDS]', minEdgeX, maxEdgeX);
        }
        const zoom = this.transform.zoom;
        // [v0.3.33.9] Removed strict Visibility Floor (0.05) as per user request
        // We now rely solely on edgeVisibilityMode for LOD.

        this._confirmBadgeHits = [];
        this._deleteBadgeHits = [];

        // [v0.3.33] Viewport Culling for Edges
        const dpr = window.devicePixelRatio || 1;
        const viewWidth = this.canvas.width / dpr;
        const viewHeight = this.canvas.height / dpr;
        const minX = -this.transform.offsetX / zoom;
        const minY = -this.transform.offsetY / zoom;
        const maxX = minX + viewWidth / zoom;
        const maxY = minY + viewHeight / zoom;
        
        // Edge buffer needs to be large enough to catch long edges that cross the screen
        const buffer = 1000;
        const cMinX = minX - buffer;
        const cMinY = minY - buffer;
        const cMaxX = maxX + buffer;
        const cMaxY = maxY + buffer;

        // Step 3: Draw the edges
        const targetEdges = (this.spatialIndex ? this.spatialIndex.queryViewport(cMinX, cMinY, cMaxX, cMaxY, 'edges') : null) || this._visibleEdgesCache || [];
        const targetEdgesCount = targetEdges instanceof Set ? targetEdges.size : targetEdges.length;

        if (this._frameCounter < 3 || this._frameCounter % 60 === 0) {
            console.log(`[CULLING]\nTotal Nodes: ${this.nodes ? this.nodes.length : 0}\nVisible Nodes: ${this._lastCulledNodesCount || 0}\nTotal Edges: ${this.edges ? this.edges.length : 0}\nVisible Edges: ${targetEdgesCount}`);
            console.log(`[AGG_EDGE]\nreal=${this.edges ? this.edges.length : 0}\naggregate=${this.metaEdges ? this.metaEdges.length : 0}`);
            
            // USER REQUESTED PROBES
            console.log("[EDGE_STATS]", "zoom=", this.transform.zoom, "edges=", targetEdgesCount);
            console.log("[BUNDLE_STATS]", "bundles=", this.metaEdges ? this.metaEdges.length : 0);
            console.log("[EDGE_MODE]", window.edgeVisibilityMode);
        }

        // [Phase 2B.13] Edge Bundling LOD
        const hasMetaEdges = this.metaEdges && this.metaEdges.length > 0;

        // [v0.3.33.8] Explicit Edge Visibility Control (FULL, CLUSTER, NONE)
        // Completely removed automatic LOD based on zoom.
        if (window.edgeVisibilityMode === 'NONE') return;

        if (window.edgeVisibilityMode === 'CLUSTER') {
            if (hasMetaEdges) {
                this.renderEdgeBundles(zoom);
            }
            return; // Skip rendering individual physical edges
        }

        // If mode is 'FULL', we render all physical edges regardless of zoom level.
        // (Removed zoom <= 0.10 override logic)

        for (const edge of targetEdges) {
            const srcNode = this.nodeMap.get(edge.from);
            const tgtNode = this.nodeMap.get(edge.to);
            if (!srcNode || !tgtNode || !srcNode.position || !tgtNode.position) continue;

            // [v0.3.33 Phase 4-D-2] Cluster LOD filter: skip edges between hidden clusters
            if (this._visibleGraphClusterIds) {
                const fc = srcNode.cluster_id ?? srcNode.data?.cluster_id;
                const tc = tgtNode.cluster_id ?? tgtNode.data?.cluster_id;
                if (fc && !this._visibleGraphClusterIds.has(fc)) continue;
                if (tc && !this._visibleGraphClusterIds.has(tc)) continue;
            }
            
            // Note: We still do precise box checking because SpatialGrid returns objects
            // inside overlapping grid cells, some might technically be slightly outside cMin/cMax.
            const minEx = Math.min(srcNode.position.x, tgtNode.position.x);
            const maxEx = Math.max(srcNode.position.x, tgtNode.position.x);
            const minEy = Math.min(srcNode.position.y, tgtNode.position.y);
            const maxEy = Math.max(srcNode.position.y, tgtNode.position.y);
            
            if (maxEx < cMinX || minEx > cMaxX || maxEy < cMinY || minEy > cMaxY) {
                continue; // Entire edge is outside the viewport
            }

            this.renderEdge(edge);
        }
    }

    // [Phase 2B.13] Render Edge Bundles (Meta Edges)
    renderEdgeBundles(zoom) {
        if (!this.metaEdges || this.metaEdges.length === 0) return;

        const ctx = this.ctx;
        ctx.save();

        this.metaEdges.forEach(flow => {
            const srcCluster = this.clusters.find(c => c.id === flow.source);
            const tgtCluster = this.clusters.find(c => c.id === flow.target);

            if (srcCluster && tgtCluster && srcCluster.id !== tgtCluster.id) {
                const getCenter = (cluster) => {
                    const b = this._lastComputedBounds?.get(cluster.id);
                    if (b) {
                        return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
                    }
                    return cluster.position || { x: 0, y: 0 };
                };

                const p1 = getCenter(srcCluster);
                const p2 = getCenter(tgtCluster);
                
                // [v0.3.35] Viewport Culling for Meta Edges
                const dpr = window.devicePixelRatio || 1;
                const viewWidth = this.canvas.width / dpr;
                const viewHeight = this.canvas.height / dpr;
                const minX = -this.transform.offsetX / zoom;
                const minY = -this.transform.offsetY / zoom;
                const maxX = minX + viewWidth / zoom;
                const maxY = minY + viewHeight / zoom;
                
                const buffer = 1000;
                const cMinX = minX - buffer;
                const cMinY = minY - buffer;
                const cMaxX = maxX + buffer;
                const cMaxY = maxY + buffer;
                
                const minEx = Math.min(p1.x, p2.x);
                const maxEx = Math.max(p1.x, p2.x);
                const minEy = Math.min(p1.y, p2.y);
                const maxEy = Math.max(p1.y, p2.y);
                
                if (maxEx < cMinX || minEx > cMaxX || maxEy < cMinY || minEy > cMaxY) {
                    return; // Skip drawing this meta edge
                }

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 10) return;

                const intensity = Math.min(flow.weight / 50, 1.0);
                const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
                const color = theme ? theme.EDGES.REFERENCE.color : 'rgba(200, 200, 200, 0.5)';
                
                ctx.beginPath();
                ctx.strokeStyle = color;
                // Base opacity + dynamic opacity based on weight
                ctx.globalAlpha = 0.2 + (intensity * 0.6); 
                // Bundled lines are thicker
                ctx.lineWidth = 2 + (Math.sqrt(flow.weight) * 1.5) / zoom;
                ctx.lineCap = 'round';

                // Quadratic curve for bundled feel
                const cx = (p1.x + p2.x) / 2 - dy * 0.15;
                const cy = (p1.y + p2.y) / 2 + dx * 0.15;

                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
                ctx.stroke();

                // Draw traffic count badge
                if (flow.weight > 3 && zoom > 0.15) {
                    const midX = (p1.x + 2 * cx + p2.x) / 4;
                    const midY = (p1.y + 2 * cy + p2.y) / 4;

                    ctx.fillStyle = theme ? theme.SURFACE.DEEP : '#1a1a1a';
                    ctx.globalAlpha = 0.8;
                    const badgeW = 24 + (flow.weight.toString().length * 6);
                    const badgeH = 16;
                    ctx.fillRect(midX - badgeW/2, midY - badgeH/2, badgeW, badgeH);
                    
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1 / zoom;
                    ctx.strokeRect(midX - badgeW/2, midY - badgeH/2, badgeW, badgeH);

                    ctx.fillStyle = '#ffffff';
                    ctx.globalAlpha = 1.0;
                    ctx.font = '10px "Geist Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(flow.weight.toString(), midX, midY);
                }
            }
        });

        ctx.restore();
    }

    // [v0.3.9] Dedicated 2D Node Rendering function to prevent blank screen
    renderNodes2D(zoom) {
        console.log('[RENDER_ENGINE]', this._instanceId);
        console.log('[RENDER_STATE]', { nodes: this.nodes.length, clusters: this.clusters.length, dirty: this.isDirty, loop: this._loopRunning });

        const dpr = window.devicePixelRatio || 1;
        let canvasWidth = this.canvas.width / dpr;
        let canvasHeight = this.canvas.height / dpr;

        // [FIX v0.3.09] Safety check: invalid canvas dimensions
        if (canvasWidth === 0 || canvasHeight === 0) {
            console.warn('[SYNAPSE] renderNodes2D: invalid canvas dimensions detected',
                `${canvasWidth}x${canvasHeight}, forcing resize`);
            this.resizeCanvas(true);  // Force immediate resize and retry next frame
            return;  // Skip rendering this frame to avoid errors
        }

        // [v0.3.33] Viewport Culling for Nodes
        const minX = -this.transform.offsetX / zoom;
        const minY = -this.transform.offsetY / zoom;
        const maxX = minX + canvasWidth / zoom;
        const maxY = minY + canvasHeight / zoom;
        const bufferX = 200; // Node width is ~120
        const bufferY = 100; // Node height is ~60
        const cMinX = minX - bufferX;
        const cMinY = minY - bufferY;
        const cMaxX = maxX + bufferX;
        const cMaxY = maxY + bufferY;
        const viewportBBox = { minX: cMinX, minY: cMinY, maxX: cMaxX, maxY: cMaxY };

        let targetNodes = this.spatialIndex 
            ? this.spatialIndex.queryViewport(cMinX, cMinY, cMaxX, cMaxY, 'nodes') 
            : this._visibleNodesCache;

        const targetLength = targetNodes ? (targetNodes instanceof Set ? targetNodes.size : targetNodes.length) : 0;
        this._lastCulledNodesCount = targetLength;
        if (this._frameCounter % 60 === 0) {
            console.log('[RBUSH] viewportBBox', viewportBBox);
            console.log('[RBUSH] visibleNodes.length (culled)', targetLength);
            console.log('[RBUSH] this.nodes.length', this.nodes ? this.nodes.length : 0);
        }

        // [v0.3.34] Temporary Fallback requested by user
        if (targetLength === 0) {
            if (this._frameCounter % 60 === 0) console.log('[RBUSH] Fallback triggered: visibleNodes is empty, using full nodes array');
            targetNodes = this.nodes;
        }

        if (!window.__drawProbe) {
            window.__drawProbe = true;
            console.log('[NODES_REF_VISIBLE]', this.nodes, this.nodes.length);
            console.log('[NODES_SAME]', this.nodes === this._debugNodesRef);
            console.log('[VISIBLE_SOURCE]', { nodes: this.nodes.length, visible: this._visibleNodesCache?.length ?? -1, hasSpatial: !!this.spatialIndex, target: targetNodes?.length ?? -1 });
        }

        if (!window.__drawLoopProbe) {
            window.__drawLoopProbe = true;
            console.log('[DRAW_LOOP]', targetNodes?.length ?? 0);
        }

        let visibleCount = 0;
        for (const node of targetNodes) {
            if (!node.position) continue;
            const px = node.position.x;
            const py = node.position.y;
            
            if (px < cMinX || px > cMaxX || py < cMinY || py > cMaxY) {
                continue; // Node is outside the viewport
            }

            // Also check if node is in _visibleNodesCache to respect LOD/filters
            if (this.spatialIndex && this._visibleNodesSet && !this._visibleNodesSet.has(node)) {
                continue;
            }

            if (!window.__drawNodeProbe) {
                window.__drawNodeProbe = true;
                console.log('[DRAW_NODE]', node.id, node.position?.x, node.position?.y);
            }
            visibleCount++;
            this.renderNode(node, zoom);
        }

        if (this._frameCounter % 60 === 0) {
            console.log(`[PERF] VisibleNodes: ${visibleCount}`);
        }
    }

    renderLabels2D() {
        const zoom = this.transform.zoom;
    }


    showInputModal(title, defaultValue, callback) {
        const dialog = document.getElementById('input-dialog');
        const titleEl = document.getElementById('input-dialog-title');
        const inputEl = document.getElementById('input-dialog-value');
        const btnConfirm = document.getElementById('btn-confirm-input');
        const btnCancel = document.getElementById('btn-cancel-input');

        if (!dialog || !inputEl || !btnConfirm || !btnCancel) {
            console.error('[SYNAPSE] Input dialog elements not found');
            return;
        }

        titleEl.textContent = title;
        inputEl.value = defaultValue;
        dialog.style.display = 'block';
        inputEl.focus();
        inputEl.select();

        const close = (val) => {
            btnConfirm.removeEventListener('click', handleConfirm);
            btnCancel.removeEventListener('click', handleCancel);
            inputEl.removeEventListener('keyup', handleKey);
            dialog.style.display = 'none';
            if (callback) callback(val);
        };

        const handleConfirm = () => close(inputEl.value);
        const handleCancel = () => close(null);
        const handleKey = (e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') handleCancel();
        };

        btnConfirm.addEventListener('click', handleConfirm);
        btnCancel.addEventListener('click', handleCancel);
        inputEl.addEventListener('keyup', handleKey);
    }

    groupSelection() {
        if (this.selectedNodes.size < 2) {
            console.warn('[SYNAPSE] Select at least 2 nodes to group');
            return;
        }

        // 이미 모두 같은 클러스터에 속해 있는지 확인
        const nodeArray = Array.from(this.selectedNodes);
        const firstClusterId = nodeArray[0].data?.cluster_id || nodeArray[0].cluster_id;
        const allInSameCluster = firstClusterId && nodeArray.every(n => (n.data?.cluster_id === firstClusterId) || n.cluster_id === firstClusterId);

        if (allInSameCluster) {
            // 선택된 모든 노드가 이미 동일한 클러스터에 있고, 
            // 그 클러스터에 다른 노드가 없다면 새로 생성할 필요 없음
            const nodesInCluster = this.nodes.filter(n => (n.data?.cluster_id === firstClusterId) || n.cluster_id === firstClusterId);
            if (nodesInCluster.length === this.selectedNodes.size) {
                console.log('[SYNAPSE] Selection already forms a unique cluster:', firstClusterId);
                return;
            }
        }

        this.showInputModal("Enter group name:", `Group ${this.clusters.length + 1}`, (label) => {
            if (label === null) return; // Cancelled

            const clusterId = `cluster_${Date.now()}`;
            const color = this.clusterColors[this.colorCounter % this.clusterColors.length];
            this.colorCounter++;

            const newCluster = {
                id: clusterId,
                label: label || `Group ${this.clusters.length + 1}`,
                color: color,
                collapsed: false
            };

            this.clusters.push(newCluster);
            for (const node of this.selectedNodes) {
                if (!node.data) node.data = {};
                node.data.cluster_id = clusterId;
                node.cluster_id = clusterId; // 하위 호환성 유지
            }

            console.log('[SYNAPSE] Created cluster:', clusterId);

            // 침범한 노드(소속되지 않은 노드) 밀어내기
            this.repositionIntruders(clusterId);

            // [v0.3.34] Fix Cluster ID Mutation Cache bug
            this.isGraphDataDirty = true;

            this.saveState(); // 클러스터 생성 후 저장
            this.takeSnapshot(`Group Created: ${newCluster.label}`);
        });
    }

    ungroupSelection() {
        if (this.selectedNodes.size === 0) return;

        const nodesToUngroup = Array.from(this.selectedNodes);
        // Ensure robust ID extraction
        const nodeIds = nodesToUngroup
            .map(n => n.id)
            .filter(id => id && (typeof id === 'string' || typeof id === 'number'));

        console.log(`[SYNAPSE] Ungrouping ${nodeIds.length} nodes:`, nodeIds);

        // Optimistic UI Update
        for (const node of this.selectedNodes) {
            if (node.data) node.data.cluster_id = null;
            node.cluster_id = null;
            node._ungrouped = true; // [v0.2.20 Fix] Prevent FlowRenderer from snapping this back to default cluster
        }

        // 사용되지 않는 클러스터 정리 (Local)
        this.clusters = this.clusters.filter(c => {
            return this.nodes.some(n => (n.data?.cluster_id === c.id) || n.cluster_id === c.id);
        });

        // [v0.3.34] Fix Cluster ID Mutation Cache bug (Update LOD Hierarchy + Flush Cache)
        if (this.initLODState) {
            this.initLODState();
        }
        this.isGraphDataDirty = true;

        // Force render immediately to update visuals (pop out)
        this.render();

        // Backend Update (New 'ungroup' command avoids race condition with concurrent delete)
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'ungroup',
                nodeIds: nodeIds
            });
        }
    }


    setAllClustersCollapsedState(isCollapsed, rootsOnly = false) {
        if (!this.clusters || this.clusters.length === 0) return;

        if (rootsOnly) {
            // [루트만 보기]
            // 루트 클러스터: expanded (박스 + 직속 노드 표시)
            // 1단계 자식 클러스터: collapsed 타이틀바로 표시
            // 손자 이하: _isAncestorCollapsed에 의해 자동으로 숨겨짐
            this.expandedClusters.clear();

            // [v0.3.33.1] Fix Roots Only level (Continent Level instead of World Level)
            const allIds = new Set(this.clusters.map(c => c.id));
            
            // 1. Identify true roots (World level)
            const trueRoots = new Set();
            for (const cluster of this.clusters) {
                if (!cluster.parent_id || cluster.parent_id === cluster.id || !allIds.has(cluster.parent_id) || cluster.parent_id === 'world') {
                    trueRoots.add(cluster.id);
                }
            }

            for (const cluster of this.clusters) {
                // Determine if this is a Continent (World level or child of World level)
                const isRoot = trueRoots.has(cluster.id) || trueRoots.has(cluster.parent_id);
                
                if (isRoot) {
                    // Roots must be expanded so their children are visible
                    cluster.collapsed = false;
                    cluster.uiCollapsed = false;
                    this.expandedClusters.add(cluster.id);
                } else {
                    // Level 2+ clusters are collapsed
                    cluster.collapsed = true;
                    cluster.uiCollapsed = true;
                }
            }
        } else {
            // 전체 열기/닫기: 기존 동작 유지
            for (const cluster of this.clusters) {
                cluster.collapsed = isCollapsed;
                cluster.uiCollapsed = isCollapsed;
                if (isCollapsed) {
                    this.expandedClusters.delete(cluster.id);
                } else {
                    this.expandedClusters.add(cluster.id);
                }
            }
        }

        this.isGraphDataDirty = true;
        this.render();
        this.saveState();
        if (document.getElementById('cluster-visibility-panel')?.classList.contains('visible')) {
            const searchEl = document.getElementById('cluster-vis-search');
            this.renderClusterVisibilityPanel(searchEl ? searchEl.value : '');
        }
    }

    collapseAllClusters() {
        this.setAllClustersCollapsedState(true, false);
    }

    expandAllClusters() {
        this.setAllClustersCollapsedState(false, false);
    }

    expandRootsOnly() {
        console.log('[DEBUG_ROOTS_ONLY] expandRootsOnly called. BEFORE state:');
        console.log('[DEBUG_ROOTS_ONLY] Total clusters:', this.clusters?.length);
        if (this.clusterHierarchy) {
            const roots = this.clusterHierarchy.getRoots();
            console.log('[DEBUG_ROOTS_ONLY] Hierarchy Roots:', roots.length, roots.map(r => r.id));
        }

        this.setAllClustersCollapsedState(null, true);

        console.log('[DEBUG_ROOTS_ONLY] AFTER state:');
        console.log('[DEBUG_ROOTS_ONLY] Visible graph cluster IDs:', this._visibleGraphClusterIds?.size);
    }

    toggleClusterCollapse(clusterId) {
        // console.log('[perf_engine_debug]', 'toggleClusterCollapse CALLED', clusterId);
        const cluster = this.clusters.find(c => c.id === clusterId);
        if (cluster) {
            cluster.collapsed = !cluster.collapsed;
            cluster.uiCollapsed = cluster.collapsed;
            
            let descendantIds = new Set();
            if (this.clusterHierarchy) {
                descendantIds = new Set(this.clusterHierarchy.getDescendants(cluster.id).map(n => n.id));
            } else {
                // Fallback for extreme cases where hierarchy isn't built yet
                const getDescendants = (parentId) => {
                    const children = this.clusters.filter(c => c.parent_id === parentId);
                    let all = [...children];
                    children.forEach(c => all = all.concat(getDescendants(c.id)));
                    return all;
                };
                descendantIds = new Set(getDescendants(cluster.id).map(c => c.id));
            }

            // Sync legacy properties
            for (let i = 0; i < this.clusters.length; i++) {
                const c = this.clusters[i];
                if (descendantIds.has(c.id)) {
                    c.collapsed = cluster.collapsed;
                    c.uiCollapsed = cluster.collapsed;
                }
            }

            // Sync Phase 4 State Manager (this.expandedClusters)
            if (cluster.collapsed) {
                // Collapse: Remove parent and all descendants
                this.collapseCluster(cluster.id); 
                // Note: this.collapseCluster already removes descendants internally, but we'll do a safe manual pass just in case
                for (const dId of descendantIds) {
                    this.expandedClusters.delete(dId);
                }
            } else {
                // Expand: Add parent and all descendants
                this.expandCluster(cluster.id);
                for (const dId of descendantIds) {
                    this.expandedClusters.add(dId);
                }
            }
            
            console.log(`[SYNAPSE] Toggled cluster ${cluster.label || cluster.id}: ${cluster.collapsed ? 'Collapsed' : 'Expanded'} (Cascaded to ${descendantIds.size} descendants)`);
            
            // Recalculate layout dynamically!
            this.distributeClustersHierarchically();
            
            this.isGraphDataDirty = true; // [v0.2.27] Sync WebGL visibility
            this.render();
            this.saveState();
        }
    }

    // [v0.3.32.4 improved] Cluster Visibility Panel
    // - Hierarchy: depth-based indentation (16px per level)
    // - parent_id 없는 경우 id 경로 패턴으로 추론
    // - 검색 시 첫 매칭 클러스터로 자동 카메라 이동
    renderClusterVisibilityPanel(filterText) {
        filterText = filterText || '';
        const tree = document.getElementById('cluster-vis-tree');
        if (!tree || !this.clusters) return;
        const q = filterText.trim().toLowerCase();

        // Node count per cluster
        const nodeCountMap = new Map();
        (this.nodes || []).forEach(function(n) {
            const cid = n.cluster_id || (n.data && n.data.cluster_id);
            if (cid) nodeCountMap.set(cid, (nodeCountMap.get(cid) || 0) + 1);
        });

        // Build idMap for fast lookup
        const idMap = new Map();
        this.clusters.forEach(function(c) { idMap.set(c.id, c); });

        // Build childMap from parent_id
        const childMap = new Map();
        this.clusters.forEach(function(c) {
            if (c.parent_id && c.parent_id !== c.id && idMap.has(c.parent_id)) {
                if (!childMap.has(c.parent_id)) childMap.set(c.parent_id, []);
                childMap.get(c.parent_id).push(c);
            }
        });

        // Roots = clusters with no parent_id (or parent not in idMap)
        const roots = this.clusters.filter(function(c) {
            return (!c.parent_id || c.parent_id === c.id || !idMap.has(c.parent_id)) && c.id !== '__unclustered__';
        });

        const totalNodeCountMap = new Map(nodeCountMap);
        const visited = new Set();
        const accumulate = (clusterId) => {
            if (visited.has(clusterId)) return totalNodeCountMap.get(clusterId) || 0;
            visited.add(clusterId);
            const children = childMap.get(clusterId) || [];
            let total = nodeCountMap.get(clusterId) || 0;
            children.forEach(c => total += accumulate(c.id));
            totalNodeCountMap.set(clusterId, total);
            return total;
        };
        roots.forEach(r => accumulate(r.id));

        const self = this;
        function matches(c) {
            if (!q) return true;
            const nq = q.replace(/[-_]/g, '');
            const nl = (c.label || c.id).toLowerCase().replace(/[-_]/g, '');
            return nl.indexOf(nq) !== -1;
        }

        const subtreeVisited = new Set();
        function subtreeHasMatch(c) { 
            if (subtreeVisited.has(c.id)) return false;
            subtreeVisited.add(c.id);
            const res = matches(c) || (childMap.get(c.id) || []).some(subtreeHasMatch); 
            subtreeVisited.delete(c.id);
            return res;
        }

        tree.innerHTML = '';
        let firstMatchId = null;

        const appendVisited = new Set();
        function appendRow(cluster, depth) {
            if (appendVisited.has(cluster.id)) return;
            // [Fix] Hide empty system clusters (buffer, reserved)
            if (cluster.id.startsWith('sys_') && (totalNodeCountMap.get(cluster.id) || 0) === 0) return;
            appendVisited.add(cluster.id);

            if (!subtreeHasMatch(cluster)) return;
            const isOn = !cluster.collapsed;
            const totalCount = totalNodeCountMap.get(cluster.id) || 0;
            let label = cluster.label || cluster.id;
            const username = cluster.clientUsername || (cluster.data && cluster.data.clientUsername);
            if (username && !label.includes(`[${username}]`)) {
                label = `[${username}] ${label}`;
            }
            const isMatch = matches(cluster);
            if (q && isMatch && !firstMatchId) firstMatchId = cluster.id;

            const row = document.createElement('div');
            row.className = 'cv-item';
            row.style.paddingLeft = (8 + depth * 16) + 'px';
            row.dataset.clusterId = cluster.id;

            const children = childMap.get(cluster.id) || [];
            const hasChildren = children.length > 0;

            if (cluster.uiCollapsed === undefined) cluster.uiCollapsed = !!cluster.collapsed;

            // Toggle button for expand/collapse
            const toggleBtn = document.createElement('span');
            toggleBtn.style.cssText = 'width:12px; height:12px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; font-size:10px; color:#a89984; flex-shrink:0; margin-right:4px;';
            if (hasChildren) {
                toggleBtn.textContent = cluster.uiCollapsed ? '▶' : '▼';
                toggleBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    console.log('[perf_engine_debug]', 'toggleBtn clicked', cluster.id, 'current uiCollapsed:', cluster.uiCollapsed);
                    cluster.uiCollapsed = !cluster.uiCollapsed;
                    cluster.collapsed = cluster.uiCollapsed; // [Fix] System A sync
                    console.log('[perf_engine_debug]', 'calling expand/collapse, hierarchy exists?', !!self.clusterHierarchy);
                    if (!cluster.uiCollapsed) {
                        self.expandCluster(cluster.id);
                    } else {
                        self.collapseCluster(cluster.id);
                    }
                    self.isGraphDataDirty = true; // [v0.3.33 Phase 4] Trigger resolver
                    self.render();
                    const searchEl = document.getElementById('cluster-vis-search');
                    self.renderClusterVisibilityPanel(searchEl ? searchEl.value : '');
                });
            } else {
                toggleBtn.innerHTML = '&nbsp;'; // spacing for leaf nodes
            }

            const cb = document.createElement('input');
            cb.type = 'checkbox'; cb.className = 'cv-checkbox'; cb.checked = isOn;
            cb.addEventListener('change', function() { self._clusterVisToggle(cluster.id, cb.checked); });
            cb.addEventListener('click', function(e) { e.stopPropagation(); });

            const lbl = document.createElement('span');
            lbl.className = 'cv-label';
            lbl.textContent = label; lbl.title = label;
            lbl.style.cursor = 'pointer';
            if (!isMatch && q) lbl.style.opacity = '0.45';

            const cnt = document.createElement('span');
            cnt.className = 'cv-count';
            if (totalCount > 0) cnt.textContent = '(' + totalCount + ')';

            const reveal = document.createElement('button');
            reveal.className = 'cv-reveal'; reveal.textContent = '→'; reveal.title = 'Reveal in canvas';
            reveal.addEventListener('click', function(e) { e.stopPropagation(); self._clusterVisReveal(cluster.id); });
            
            // Click on row to reveal
            row.addEventListener('click', function() { self._clusterVisReveal(cluster.id); });

            row.appendChild(toggleBtn); row.appendChild(cb); row.appendChild(lbl); row.appendChild(cnt); row.appendChild(reveal);
            tree.appendChild(row);

            if (hasChildren && !cluster.uiCollapsed) {
                children.forEach(function(ch) { appendRow(ch, depth + 1); });
            }
        }

        roots.forEach(function(r) { appendRow(r, 0); });

        // [개선3] 검색 시 첫 매칭 클러스터로 자동 카메라 이동
        if (q && firstMatchId) self._clusterVisReveal(firstMatchId);
    }
    _clusterVisToggle(clusterId, visible) {
        const cluster = this.clusters.find(function(c) { return c.id === clusterId; });
        if (!cluster) return;
        cluster.collapsed = !visible;
        
        // Cascade to children
        const toggleVisited = new Set();
        const getDescendants = (parentId) => {
            if (toggleVisited.has(parentId)) return [];
            toggleVisited.add(parentId);
            const children = this.clusters.filter(c => c.parent_id === parentId);
            let all = [...children];
            children.forEach(c => all = all.concat(getDescendants(c.id)));
            return all;
        };
        const descendants = getDescendants(cluster.id);
        descendants.forEach(d => d.collapsed = !visible);
        
        this.isGraphDataDirty = true;
        this.render();
        this.saveState();
        const searchEl = document.getElementById('cluster-vis-search');
        this.renderClusterVisibilityPanel(searchEl ? searchEl.value : '');
    }
    // [v0.3.32.4 fix2] Reveal — clientWidth 기준, requestRender() 사용 (fitView 공식 동일)
    _clusterVisReveal(clusterId) {
        // Get all descendant cluster IDs to reveal nodes in subfolders too
        const getDescendantIds = (targetId) => {
            const subClusters = (this.clusters || []).filter(c => c.parent_id === targetId);
            let all = [targetId];
            subClusters.forEach(c => all = all.concat(getDescendantIds(c.id)));
            return all;
        };
        const targetClusterIds = new Set(getDescendantIds(clusterId));

        const nodes = (this.nodes || []).filter(function(n) {
            const cid = n.cluster_id || (n.data && n.data.cluster_id);
            return targetClusterIds.has(cid);
        });
        if (!nodes.length) {
            console.log('[CV Reveal] no nodes for', clusterId);
            return;
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(function(n) {
            const px = n.x != null ? n.x : ((n.position && n.position.x) || 0);
            const py = n.y != null ? n.y : ((n.position && n.position.y) || 0);
            minX = Math.min(minX, px);
            minY = Math.min(minY, py);
            maxX = Math.max(maxX, px + 120);
            maxY = Math.max(maxY, py + 60);
        });
        const w = maxX - minX;
        const h = maxY - minY;
        const zoom = this.transform.zoom;
        // 중앙 정렬 (fitView 공식과 동일)
        this.transform.offsetX = (this.canvas.clientWidth  - w * zoom) / 2 - minX * zoom;
        this.transform.offsetY = (this.canvas.clientHeight - h * zoom) / 2 - minY * zoom;
        this.isDirty = true;
        this.requestRender();
    }

    renameCluster(clusterId) {
        const cluster = this.clusters.find(c => c.id === clusterId);
        if (!cluster) return;

        // [v0.3.09_fix] prompt() is BLOCKED in VS Code Sandbox. Use DOM dialog.
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100%'; overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '100000';
        overlay.style.display = 'flex'; overlay.style.justifyContent = 'center'; overlay.style.alignItems = 'center';

        const dialog = document.createElement('div');
        dialog.style.background = '#282828';
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '8px';
        dialog.style.border = '1px solid #fabd2f';
        dialog.style.width = '300px';

        const label = document.createElement('div');
        label.textContent = 'Rename Group:';
        label.style.marginBottom = '10px';
        label.style.color = '#ebdbb2';
        dialog.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = cluster.label || '';
        input.style.width = '100%';
        input.style.background = '#1d2021';
        input.style.color = '#ebdbb2';
        input.style.border = '1px solid #504945';
        input.style.padding = '8px';
        input.style.boxSizing = 'border-box';
        dialog.appendChild(input);

        const btnRow = document.createElement('div');
        btnRow.style.marginTop = '15px';
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'flex-end';
        btnRow.style.gap = '10px';

        const cancel = document.createElement('button');
        cancel.textContent = 'Cancel';
        cancel.onclick = () => overlay.remove();
        btnRow.appendChild(cancel);

        const save = document.createElement('button');
        save.textContent = 'Save';
        save.style.background = '#b8bb26';
        save.style.color = '#282828';
        save.style.fontWeight = 'bold';
        save.onclick = () => {
            const val = input.value.trim();
            if (val) {
                cluster.label = val;
                this.render();
                this.saveState();
            }
            overlay.remove();
        };
        btnRow.appendChild(save);

        dialog.appendChild(btnRow);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        input.focus();
        input.select();
        input.onkeydown = (e) => {
            if (e.key === 'Enter') save.click();
            if (e.key === 'Escape') cancel.click();
        };
    }

    saveState() {
        this._lastSaveTime = Date.now();
        // VS Code 환경이면 저장을 위해 익스텐션으로 메시지 전송
        if (typeof vscode !== 'undefined') {
            const projectState = {
                nodes: this.nodes,
                edges: this.edges,
                clusters: this.clusters,
                view: this.transform // [v0.2.36] Persist camera view
            };
            console.log('[SYNAPSE] Saving state to VS Code...');
            vscode.postMessage({
                command: 'saveState',
                data: projectState
            });
        } else {
            // 브라우저 환경 - 스탠드얼론 서버에 저장 요청
            const projectState = {
                nodes: this.nodes,
                edges: this.edges,
                clusters: this.clusters
            };
            this.callStandaloneApi('/api/save-state', projectState)
                .then(res => {
                    if (res?.success) console.log('[SYNAPSE] State saved to standalone server');
                });
        }
    }

    async callStandaloneApi(endpoint, data) {
        try {
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error(`[SYNAPSE] Standalone API error (${endpoint}):`, error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * 엣지 삭제
     * @param {string} edgeId - 삭제할 엣지 ID
     */
    deleteEdge(edgeId) {
        // [v0.3.32 SSoT Refactoring] 낙관적 업데이트 완전 제거
        const edgeIndex = this.edges.findIndex(e => e.id === edgeId);
        if (edgeIndex === -1) {
            console.warn('[SYNAPSE] Edge not found:', edgeId);
            return;
        }

        const edge = this.edges[edgeIndex];

        // Edit Mode: intercept and send to backend for destructive source sync
        if (this.isEditMode && typeof vscode !== 'undefined') {
            const fromLabel = edge._fromFile || edge.from || '(unknown)';
            const toLabel = edge._toFile || edge.to || '(unknown)';
            vscode.postMessage({
                command: 'requestDeleteEdgeSource',
                edgeId: edge.id,
                fromFile: edge._fromFile,
                toFile: edge._toFile,
                fromLabel, toLabel
            });
            return;
        }

        // Normal View mode: safe visual-only delete (의도 전달만 수행)
        console.log('[SYNAPSE] Dispatching logical edge deletion to backend:', edgeId);
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'deleteEdge',
                edgeId: edgeId
            });
        }
    }

    deleteNode(nodeId) {
        // 1. 로컬 상태에서 노드 제거
        const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) {
            console.warn('[SYNAPSE] Node not found:', nodeId);
            return;
        }

        const deletedNode = this.nodes[nodeIndex];
        this.nodes.splice(nodeIndex, 1);

        // 2. 연결된 엣지들 제거
        this.edges = this.edges.filter(e => e.from !== nodeId && e.to !== nodeId);

        // 3. 선택 해제
        this.selectedNodes.delete(deletedNode);
        if (this.selectedNode === deletedNode) {
            this.selectedNode = null;
        }

        // 4. 백엔드에 삭제 메시지 전송
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'deleteNodes',
                nodeId: nodeId,
                deleteFiles: this.isEditMode
            });
        }

        console.log('[SYNAPSE] Node deleted:', nodeId);
        this.saveState(); // [v0.2.18] Ensure state is saved after deletion so it doesn't revert
        if (this.initLODState) this.initLODState(); // [v0.3.34] Rebuild LOD on node delete
        this.isGraphDataDirty = true; // [v0.3.34] Invalidate cache on node delete
        this.isDirty = true;
        this.render();
    }

    deleteSelectedNodes() {
        const nodesToDelete = Array.from(this.selectedNodes)
            .filter(n => {
                if (n.data && n.data.readOnly) {
                    console.warn('[SYNAPSE] Cannot delete read-only node:', n.id);
                    return false;
                }
                return true;
            });
        console.log(`[SYNAPSE-FRONT] deleteSelectedNodes called. IDs:`, nodesToDelete.map(n => n.id));

        if (nodesToDelete.length === 0) {
            console.warn('[SYNAPSE] No (deletable) nodes selected for deletion.');
            return;
        }

        // Confirmation for multiple nodes
        if (nodesToDelete.length > 1) {
            console.log(`[SYNAPSE] Skipping confirmation dialog for ${nodesToDelete.length} nodes to force deletion.`);
            // [Fix] Removed blocking confirm dialog to ensure deletion proceeds
            // const confirmMsg = `Are you sure you want to delete ${nodesToDelete.length} nodes and their connections?`;
            // if (!confirm(confirmMsg)) {
            //     return;
            // }
        }

        // Ensure we are getting valid IDs (Sanitization)
        const nodeIds = nodesToDelete
            .map(n => n.id)
            .filter(id => id && (typeof id === 'string' || typeof id === 'number')); // Strict type check

        console.log(`[SYNAPSE] IDs to delete (Sanitized):`, nodeIds);

        if (nodeIds.length === 0) {
            console.error('[SYNAPSE] Failed to extract node IDs from selection.');
            return;
        }

        // 1. 로컬 상태 일괄 업데이트
        this.nodes = this.nodes.filter(n => !nodeIds.includes(n.id));
        this.edges = this.edges.filter(e => !nodeIds.includes(e.from) && !nodeIds.includes(e.to));

        // 1.5. 빈 클러스터 정리 (Garbage Collection)
        const activeClusterIds = new Set(this.nodes.map(n => n.cluster_id).filter(id => id));
        const initialClusterCount = this.clusters.length;
        this.clusters = this.clusters.filter(c => {
            // 클러스터에 속한 노드가 하나라도 남아있는지 확인
            // (방금 삭제된 노드들은 이미 this.nodes에서 제거됨)
            return activeClusterIds.has(c.id);
        });

        const removedClusters = initialClusterCount - this.clusters.length;
        if (removedClusters > 0) {
            console.log(`[SYNAPSE] Cleaned up ${removedClusters} empty clusters`);
        }

        // 2. 선택 해제
        this.selectedNodes.clear();
        this.selectedNode = null;

        // 3. 백엔드에 일괄 삭제 메시지 전송
        if (typeof vscode !== 'undefined') {
            console.log(`[SYNAPSE] Sending deleteNodes command. IDs:`, nodeIds);
            vscode.postMessage({
                command: 'deleteNodes',
                nodeIds: nodeIds,
                deleteFiles: this.isEditMode
            });
            console.log(`[SYNAPSE] Sent deleteNodes command for ${nodeIds.length} nodes`);
        } else {
            console.warn('[SYNAPSE] VS Code API not available, deletion limited to frontend.');
        }

        console.log(`[SYNAPSE] ${nodeIds.length} nodes deleted.`);
        this.saveState(); // [v0.2.18] Ensure state is saved after batch deletion so it doesn't revert
        if (this.initLODState) this.initLODState(); // [v0.3.34] Rebuild LOD on batch node delete
        this.isGraphDataDirty = true; // [v0.3.34] Invalidate cache on node delete
        this.isDirty = true;
        this.render();
    }

    generateFlow(node) {
        console.log('[SYNAPSE] Generating flow for node:', node.id);
        if (typeof vscode !== 'undefined') {
            document.getElementById('loading').style.display = 'flex';
            vscode.postMessage({
                command: 'generateFlow',
                nodeId: node.id,
                filePath: node.data.file || node.data.path
            });
        } else {
            // Standalone API 호출
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.style.display = 'flex';

            this.callStandaloneApi('/api/scan', {
                filePath: node.data.file || node.data.path
            }).then(res => {
                if (loadingEl) loadingEl.style.display = 'none';
                if (res?.success) {
                    console.log('[SYNAPSE] Flow scan complete (Standalone):', res.flowData);
                    this.flowData = res.flowData;
                    if (this.flowData) this.flowData.type = 'internal'; // Mark as high-precision logic
                    // 결과 반영 (Mock UI 상단 표시)
                    this.currentMode = 'flow';
                    this.render();
                } else {
                    // Fallback to Mock if API fails
                    console.warn('[SYNAPSE] falling back to mock flow scan');
                    this.flowData = this.flowRenderer.buildFlow([node, ...this.nodes.slice(0, 3)]);
                    this.currentMode = 'flow';
                    this.render();
                }
            });
        }
    }

    /**
     * 엣지 타입 변경
     * @param {string} newType - 새로운 엣지 타입
     * @param {string} newColor - 새로운 엣지 색상
     */
    changeEdgeType(newType, newColor) {
        if (!this.selectedEdge) {
            console.warn('[SYNAPSE] No edge selected');
            return;
        }

        const edge = this.selectedEdge;
        const oldType = edge.type;

        // 로컬 상태 업데이트
        edge.type = newType;
        edge.label = newType.replace('_', ' ');
        if (!edge.visual) edge.visual = {};
        edge.visual.color = newColor;

        // 백엔드에 업데이트 메시지 전송
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'updateEdge',
                edgeId: edge.id,
                updates: {
                    type: newType,
                    label: edge.label,
                    visual: edge.visual
                }
            });

            // 🔍 타입 변경 시 아키텍처 재검증 요청 (Phase 4)
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            if (fromNode && toNode) {
                vscode.postMessage({
                    command: 'validateEdge',
                    edgeId: edge.id,
                    fromNode: fromNode,
                    toNode: toNode,
                    type: newType
                });
            }
        }

        console.log(`[SYNAPSE] Edge type changed: ${oldType} → ${newType}`);
        this.render();
    }

    // [v0.2.17] DTR UI Sync — global value from CanvasPanel
    handleDTRChange(value) {
        this.currentDTR = value;
        this._updateDTRDisplay(value);
        this.render();
    }

    // Shared display updater (nodeLabel: string shows slider; undefined hides it)
    _updateDTRDisplay(value, nodeLabel) {
        const display = document.getElementById('dtr-value-display');
        const fill = document.getElementById('dtr-gauge-fill');
        const nSpan = document.getElementById('dtr-stat-n');
        const costSpan = document.getElementById('dtr-stat-cost');
        const nodeLabelEl = document.getElementById('dtr-node-label');
        const slider = document.getElementById('dtr-slider');

        if (display) display.textContent = value.toFixed(2);
        if (fill) fill.style.width = `${value * 100}%`;

        const n = value < 0.4 ? 1 : (value < 0.8 ? 4 : 8);
        if (nSpan) nSpan.textContent = n;
        if (costSpan) costSpan.textContent = value < 0.4 ? 'Low' : (value < 0.8 ? 'Mid' : 'High');

        if (nodeLabel !== undefined) {
            if (nodeLabelEl) {
                nodeLabelEl.textContent = `📄 ${nodeLabel}`;
                nodeLabelEl.style.display = 'block';
            }
            if (slider) {
                slider.value = value;
                slider.style.display = 'block';
                slider.style.visibility = 'visible'; // Extra safety
            }
        } else {
            if (nodeLabelEl) nodeLabelEl.style.display = 'none';
            if (slider) {
                slider.style.display = 'none';
                slider.style.visibility = 'hidden';
            }
        }
    }

    // Called on single-node selection — reads node DTR and wires slider to edit it
    _onNodeSelected(node) {
        if (!node) {
            this._updateDTRDisplay(this.currentDTR);
            return;
        }
        const dtr = (node.intelligence && node.intelligence.dtr != null)
            ? node.intelligence.dtr
            : (node.data && node.data.intelligence && node.data.intelligence.dtr != null
                ? node.data.intelligence.dtr : this.currentDTR);
        const label = (node.data && node.data.label) ? node.data.label : node.id;
        this._updateDTRDisplay(dtr, label);

        const slider = document.getElementById('dtr-slider');
        if (!slider) return;
        if (this._dtrSliderHandler) slider.removeEventListener('input', this._dtrSliderHandler);
        this._dtrSliderHandler = (e) => {
            const newDTR = parseFloat(e.target.value);
            if (!node.intelligence) node.intelligence = {};
            node.intelligence.dtr = newDTR;
            if (!node.data) node.data = {};
            if (!node.data.intelligence) node.data.intelligence = {};
            node.data.intelligence.dtr = newDTR;
            this._updateDTRDisplay(newDTR, (node.data && node.data.label) ? node.data.label : node.id);
            vscode.postMessage({ command: 'updateNodeDTR', nodeId: node.id, dtr: newDTR });
            this.render();
        };
        slider.addEventListener('input', this._dtrSliderHandler);
    }

    // [v0.2.17] Canvas Scrollbars Logic
    renderScrollbars() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        const thumbV = document.getElementById('thumb-v');
        const thumbH = document.getElementById('thumb-h');

        // Simple heuristic for scrollbar position based on transform
        // transform.x/y is offset, transform.k is zoom
        const zoom = this.transform.zoom; // Use this.transform.zoom
        const offsetX = this.transform.offsetX;
        const offsetY = this.transform.offsetY;

        // Vertical scrollbar
        if (thumbV) {
            const viewHeight = container.clientHeight;
            // Estimate content height based on max Y of nodes, or a large multiple of viewHeight
            let maxY = 0;
            if (this.nodes.length > 0) {
                const positionedNodes = this.nodes.filter(n => n.position && typeof n.position.y === 'number');
                maxY = positionedNodes.length > 0 ? Math.max(...positionedNodes.map(n => n.position.y + 60)) : 0;
            }
            const contentHeight = Math.max(viewHeight * 2, maxY * zoom); // At least 2x viewHeight, or based on content

            // Calculate scroll percentage
            // The canvas origin (0,0) is at offsetX, offsetY in screen space.
            // So, the top of the world view is at -offsetY / zoom.
            const worldViewTop = -offsetY / zoom;

            // Map worldViewTop to a percentage of the total scrollable content
            // Assuming the scrollable area starts at some negative world Y and ends at contentHeight
            // This is a simplified model. A more accurate one would involve min/max world bounds.
            const scrollRange = contentHeight - viewHeight / zoom;
            let scrollPercent = 0;
            if (scrollRange > 0) {
                scrollPercent = (worldViewTop / scrollRange) * 100;
            }

            // Clamp to 0-100
            scrollPercent = Math.max(0, Math.min(100, scrollPercent));

            // Thumb height should be proportional to the visible content vs total content
            const thumbHeightPercent = Math.max(10, (viewHeight / zoom / contentHeight) * 100);

            thumbV.style.top = `${scrollPercent}%`;
            thumbV.style.height = `${thumbHeightPercent}%`;
        }

        // Horizontal scrollbar
        if (thumbH) {
            const viewWidth = container.clientWidth;
            // Estimate content width
            let maxX = 0;
            if (this.nodes.length > 0) {
                const positionedNodes = this.nodes.filter(n => n.position && typeof n.position.x === 'number');
                maxX = positionedNodes.length > 0 ? Math.max(...positionedNodes.map(n => n.position.x + 120)) : 0;
            }
            const contentWidth = Math.max(viewWidth * 2, maxX * zoom);

            const worldViewLeft = -offsetX / zoom;
            const scrollRange = contentWidth - viewWidth / zoom;
            let scrollPercent = 0;
            if (scrollRange > 0) {
                scrollPercent = (worldViewLeft / scrollRange) * 100;
            }
            scrollPercent = Math.max(0, Math.min(100, scrollPercent));

            const thumbWidthPercent = Math.max(10, (viewWidth / zoom / contentWidth) * 100);

            thumbH.style.left = `${scrollPercent}%`;
            thumbH.style.width = `${thumbWidthPercent}%`;
        }
    }

    renderGrid() {
        const gridSize = this.GRID_SNAP_SIZE || 40;
        const zoom = this.transform.zoom;
        if (zoom < 0.2) return; // 너무 작으면 그리드 생략

        this.ctx.beginPath();
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        const gridColor = (theme && theme.COLORS && theme.COLORS.GRID) ? theme.COLORS.GRID : '#333333';
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = Math.max(1 / zoom, 0.5);

        // 화면 영역 계산 (CSS 픽셀 단위 기준)
        const viewWidth = this.canvas.clientWidth;
        const viewHeight = this.canvas.clientHeight;

        const startX = Math.floor((-this.transform.offsetX / zoom) / gridSize) * gridSize;
        const startY = Math.floor((-this.transform.offsetY / zoom) / gridSize) * gridSize;
        const endX = startX + (viewWidth / zoom) + gridSize;
        const endY = startY + (viewHeight / zoom) + gridSize;

        // Offset for sharp lines
        const offset = (1 / zoom) / 2;

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x + offset, startY);
            this.ctx.lineTo(x + offset, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y + offset);
            this.ctx.lineTo(endX, y + offset);
        }
        this.ctx.stroke();
    }
    /**
     * [v0.3.21] Traffic Heatmap Rendering
     * Visualizes connection density between clusters using weighted arcs.
     */
    renderTrafficHeatmap() {
        if (!this.showHeatmap) return;

        // [v0.3.22.2] Dynamic Heatmap Calculation (if project data is missing or invalidated)
        if (!this.clusterFlows || this.clusterFlows.length === 0) {
            const flows = new Map();
            const activeEdges = this._visibleEdgesCache || this.edges; // [v0.3.34] Use visible edges!
            activeEdges.forEach(e => {
                const srcNode = this.nodeMap.get(e.from);
                const tgtNode = this.nodeMap.get(e.to);
                if (srcNode && tgtNode && srcNode.cluster_id && tgtNode.cluster_id && srcNode.cluster_id !== tgtNode.cluster_id) {
                    const key = `${srcNode.cluster_id}->${tgtNode.cluster_id}`;
                    flows.set(key, (flows.get(key) || 0) + 1);
                }
            });
            this.clusterFlows = Array.from(flows.entries()).map(([key, count]) => {
                const [source, target] = key.split('->');
                return { source, target, count };
            });
        }

        if (this.clusterFlows.length === 0) return;

        // [v0.3.33] Heatmap Bounds vs Node Bounds diagnostic
        {
            let hmMinX = Infinity, hmMaxX = -Infinity, hmMinY = Infinity, hmMaxY = -Infinity, hmArc = 0;
            let srcBoundsCount = 0, srcPosCount = 0;
            this.clusterFlows.forEach(flow => {
                const srcCluster = this.clusters.find(c => c.id === flow.source);
                const tgtCluster = this.clusters.find(c => c.id === flow.target);
                if (!srcCluster || !tgtCluster) return;
                [srcCluster, tgtCluster].forEach(cl => {
                    const b = this._lastComputedBounds?.get(cl.id);
                    let cx, cy;
                    if (b) { cx = (b.minX + b.maxX) / 2; cy = (b.minY + b.maxY) / 2; srcBoundsCount++; }
                    else { cx = cl.position?.x || 0; cy = cl.position?.y || 0; srcPosCount++; }
                    if (cx < hmMinX) hmMinX = cx;
                    if (cx > hmMaxX) hmMaxX = cx;
                    if (cy < hmMinY) hmMinY = cy;
                    if (cy > hmMaxY) hmMaxY = cy;
                });
                hmArc++;
            });
            if (hmArc > 0) {
                let ndMinX = Infinity, ndMaxX = -Infinity, ndMinY = Infinity, ndMaxY = -Infinity;
                (this.nodes || []).forEach(n => {
                    const px = n.position?.x, py = n.position?.y;
                    if (typeof px === 'number' && Number.isFinite(px)) { if (px < ndMinX) ndMinX = px; if (px > ndMaxX) ndMaxX = px; }
                    if (typeof py === 'number' && Number.isFinite(py)) { if (py < ndMinY) ndMinY = py; if (py > ndMaxY) ndMaxY = py; }
                });
                console.log('[HM_BOUNDS]',
                    'hmArcs=' + hmArc,
                    'hmX=[' + Math.round(hmMinX) + '..' + Math.round(hmMaxX) + ']',
                    'hmY=[' + Math.round(hmMinY) + '..' + Math.round(hmMaxY) + ']',
                    'ndX=[' + Math.round(ndMinX) + '..' + Math.round(ndMaxX) + ']',
                    'ndY=[' + Math.round(ndMinY) + '..' + Math.round(ndMaxY) + ']',
                    'boundsUsed=' + srcBoundsCount + ' posFallback=' + srcPosCount);
            }

            // [PROBE v0.3.33] _lastComputedBounds integrity + extreme center dump
            {
                const activeIds = new Set(this.clusters.map(c => c.id));
                for (const [id] of (this._lastComputedBounds || [])) {
                    if (!activeIds.has(id)) {
                        const b = this._lastComputedBounds.get(id);
                        console.warn('[STALE_BOUNDS]', id, '_lastComputedBounds but NOT in this.clusters',
                            { center: `(${Math.round((b.minX+b.maxX)/2)},${Math.round((b.minY+b.maxY)/2)})` });
                    }
                }
                for (const c of this.clusters) {
                    const b = this._lastComputedBounds?.get(c.id);
                    if (!b) continue;
                    const cx = (b.minX + b.maxX) / 2;
                    const cy = (b.minY + b.maxY) / 2;
                    
                    const nodeCount = this.nodes.filter(
                        n => (n.cluster_id || n.data?.cluster_id) === c.id
                    ).length;

                    if (nodeCount === 0) {
                        console.error('[EMPTY_CLUSTER]', {
                            id: c.id,
                            centerX: Math.round(cx),
                            centerY: Math.round(cy),
                            bounds: b
                        });
                    }

                    if (Math.abs(cx) > 30000 || Math.abs(cy) > 30000) {
                        console.error('[EXTREME_CLUSTER_TRACE]', {
                            id: c.id,
                            nodeCount: nodeCount,
                            childClusterCount: c.children?.length,
                            bounds: b,
                            centerX: Math.round(cx),
                            centerY: Math.round(cy)
                        });
                    }
                }
            }
        }

        const ctx = this.ctx;
        ctx.save();

        this.clusterFlows.forEach(flow => {
            const srcCluster = this.clusters.find(c => c.id === flow.source);
            const tgtCluster = this.clusters.find(c => c.id === flow.target);

            if (srcCluster && tgtCluster && srcCluster.id !== tgtCluster.id) {
                if (!this._visibleClusterIds || !this._visibleClusterIds.has(srcCluster.id) || !this._visibleClusterIds.has(tgtCluster.id)) return;
                // [v0.3.34] Defensive: skip system clusters even if they sneak into _visibleClusterIds
                if (isSystemCluster(srcCluster.id) || isSystemCluster(tgtCluster.id)) return;

                // [v0.3.33] PROBE: actual draw targets (top-N)
                if ((window.__probe_draw_arcs || 0) < 10) {
                    console.log('[DRAW_ARC]',
                        'src=' + srcCluster.id,
                        'tgt=' + tgtCluster.id,
                        'tgtInVis=' + this._visibleClusterIds?.has(tgtCluster.id),
                        'count=' + flow.count);
                    window.__probe_draw_arcs = (window.__probe_draw_arcs || 0) + 1;
                }

                // Get cluster bounds to find center
                const getCenter = (cluster) => {
                    const b = this._lastComputedBounds?.get(cluster.id);
                    if (b) {
                        return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
                    }
                    return cluster.position || { x: 0, y: 0 };
                };

                const p1 = getCenter(srcCluster);
                const p2 = getCenter(tgtCluster);

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 50) return;

                // Heatmap logic: intensity based on count
                const intensity = Math.min(flow.count / 20, 1.0);
                const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
                const color = intensity > 0.7 ? theme.STATUS.WARNING.border : (intensity > 0.3 ? theme.EDGES.EVENT.color : theme.STATUS.PROPOSED.border);
                
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.1 + intensity * 0.4; // [v0.3.21] Subtle background
                ctx.lineWidth = 2 + intensity * 8;
                ctx.lineCap = 'round';

                // Draw quadratic curve for a "flow" look
                const cx = (p1.x + p2.x) / 2 - dy * 0.2;
                const cy = (p1.y + p2.y) / 2 + dx * 0.2;

                ctx.moveTo(p1.x, p1.y);
                ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
                ctx.stroke();

                // Add small flow particles/arrows if intense
                if (intensity > 0.4) {
                    const t = (Date.now() % 1500) / 1500;
                    const invT = 1 - t;
                    const px = invT * invT * p1.x + 2 * invT * t * cx + t * t * p2.x;
                    const py = invT * invT * p1.y + 2 * invT * t * cy + t * t * p2.y;
                    
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });

        ctx.restore();
    }

    // [v0.3.33] Cluster Render Eligibility — 단일 진실 공급원
    _canRenderCluster(cluster) {
        if (!cluster) return false;
        if (this._visibleClusterIds?.has(cluster.id)) return true;
        if (cluster.collapsed) return true;
        return false;
    }

    // [v0.3.33 Phase 4-D-1] Resolver: Telescope expansion → visible cluster IDs
    _computeResolverVisibleIds() {
        const hierarchy = this.clusterHierarchy;
        if (!hierarchy) return null;
        const expanded = this.expandedClusters;
        if (!expanded) return null;
        const roots = hierarchy.getRoots();
        if (!roots || roots.length === 0) return null;
        // [v0.3.33 Phase 4-D-1] Diagnostic: verify state before Resolver
        console.log('[ALL_CLUSTERS]', performance.now(), this.clusters?.length);
        console.log('[ROOTS]', roots.map(r => ({ id: r.id, label: r.cluster?.label })));
        console.log('[EXPANDED]', expanded.size, Array.from(expanded).slice(0, 20));
        console.log('[HIERARCHY_NODE_COUNT]', performance.now(), hierarchy.nodes?.size);
        const visible = new Set();
        for (const r of roots) visible.add(r.id);
        const queue = roots.map(r => r.id);
        while (queue.length > 0) {
            const current = queue.shift();
            if (!expanded.has(current)) continue;
            const children = hierarchy.getChildren(current);
            if (!children) continue;
            for (const child of children) {
                if (!visible.has(child.id)) {
                    visible.add(child.id);
                    queue.push(child.id);
                }
            }
        }
        console.log('[perf_engine]', 'event=resolver', 'expanded=' + expanded.size, 'visible=' + visible.size);
        console.log('[LOD_VERIFY]', 'expanded=', expanded.size, 'visible=', visible.size);
        console.log('[RESOLVER_RESULT]', performance.now(), 'visible', visible.size, 'expanded', expanded.size);
        return visible;
    }

    renderClusters() {
        if (!this.clusters || this.clusters.length === 0) return;
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);

        // [v0.3.33] Phase 3A: Viewport Culling for Clusters using pre-computed bounds
        const dpr = window.devicePixelRatio || 1;
        const zoom = this.transform.zoom;
        const viewWidth = this.canvas.width / dpr;
        const viewHeight = this.canvas.height / dpr;
        const minX = -this.transform.offsetX / zoom;
        const minY = -this.transform.offsetY / zoom;
        const maxX = minX + viewWidth / zoom;
        const maxY = minY + viewHeight / zoom;
        const buffer = 200;
        const cMinX = minX - buffer;
        const cMinY = minY - buffer;
        const cMaxX = maxX + buffer;
        const cMaxY = maxY + buffer;

        // [v0.3.33 Phase 4-D-1] Use Resolver output as cluster source when available
        let clusterSource;
        if (this._visibleGraphClusters) {
            clusterSource = this._visibleGraphClusters;
            console.log('[VISIBLE_GRAPH_SOURCE] resolver:', clusterSource.length);
        } else {
            const targetClustersSet = this.spatialIndex
                ? this.spatialIndex.queryViewport(cMinX, cMinY, cMaxX, cMaxY, 'clusters')
                : new Set(this.clusters);
            clusterSource = targetClustersSet ? Array.from(targetClustersSet) : this.clusters;
        }
        const targetClustersArray = clusterSource;
        console.log('[TARGET_ACTIVITY_IDS]', targetClustersArray.filter(c => c.id.includes('activity')).map(c => c.id));

        // [USER_REQUEST] Log Roots Only details
        if (this.expandedClusters && this.expandedClusters.size === 0) {
            console.log(
                '[ROOTS]', 
                targetClustersArray.length, // visibleClusters.length
                this.clusterHierarchy?.getRoots()?.length || 0 // rootClusters.length
            );
            if (targetClustersArray) {
                targetClustersArray.forEach(c => {
                    console.log(
                        c.id, 
                        c.parent_id,
                        c.bounds ? { width: c.bounds.maxX - c.bounds.minX, height: c.bounds.maxY - c.bounds.minY } : null
                    );
                });
            }
        }

        if (this._frameCounter % 60 === 0) {
            console.log(
                '[DEBUG]',
                'clusters=', this.clusters ? this.clusters.length : 0,
                'visibleClusters=', targetClustersArray.length,
                'nodes=', this.nodes ? this.nodes.length : 0,
                'visibleNodes=', this._visibleNodesCache ? this._visibleNodesCache.length : 0
            );
            console.log('[DEBUG] first cluster bounds', this.clusters && this.clusters.length > 0 ? this.clusters[0].bounds : null);
        }

        // 깊이(계층 수)에 따라 정렬하여 큰 부모부터 렌더링
        const getDepth = (c) => {
            let depth = 0;
            let curr = c;
            while (curr && curr.parent_id) {
                depth++;
                curr = this.clusters.find(p => p.id === curr.parent_id);
            }
            return depth;
        };

        const sortedClusters = targetClustersArray.slice().sort((a, b) => getDepth(a) - getDepth(b));
        console.log('[RBUSH_CLUSTER_COUNT]', this.spatialIndex?.clusterTree?.all()?.length || 0);
        console.log('[NULL_BOUNDS_COUNT]', this.clusters.filter(c => !c.bounds).length);
        console.log('[NULL_BOUNDS_ACTIVITY]', this.clusters.filter(c => !c.bounds && c.id.includes('activity')).map(c => c.id));
        console.log('[VIEWPORT_QUERY]', { cMinX, cMinY, cMaxX, cMaxY });
        const _ac = this.clusters.find(c => c.id === 'folder_app_src_main_java_de_danoeh_antennapod_activity');
        if (_ac?.bounds) {
            const _vs = this.spatialIndex?.clusterTree?.search({
                minX: cMinX, minY: cMinY, maxX: cMaxX, maxY: cMaxY
            });
            const _targetSet = this.spatialIndex?.queryViewport(cMinX, cMinY, cMaxX, cMaxY, 'clusters');
            console.log('[FRAME_DIAG]', {
                activityBounds: _ac.bounds,
                viewportBox: { cMinX, cMinY, cMaxX, cMaxY },
                viewportContains: (
                    cMinX <= _ac.bounds.minX && cMinY <= _ac.bounds.minY &&
                    cMaxX >= _ac.bounds.maxX && cMaxY >= _ac.bounds.maxY
                ),
                viewportSearchCount: _vs?.length,
                viewportSearchHasActivity: _vs?.some(r => r.item?.id === _ac.id),
                queryViewportSetHas: _targetSet?.has(_ac)
            });
        }
        console.log('[GRAPH_BOUNDS]', {
            minX: Math.min(...this.clusters.map(c => c.bounds?.minX).filter(Number.isFinite)),
            maxX: Math.max(...this.clusters.map(c => c.bounds?.maxX).filter(Number.isFinite)),
            minY: Math.min(...this.clusters.map(c => c.bounds?.minY).filter(Number.isFinite)),
            maxY: Math.max(...this.clusters.map(c => c.bounds?.maxY).filter(Number.isFinite)),
        });
        console.log('[SORTED_CLUSTER_COUNT]', sortedClusters.length);
        console.log('[SORTED_ACTIVITY_IDS]', sortedClusters.filter(c => c.id.includes('activity')).map(c => c.id));
        console.log('[SORTED_ACTIVITY]', sortedClusters.filter(c => c.id.includes('activity')).map(c => c.id));
        // [v0.3.32.4] Build parent-collapsed lookup for fast skip
        const _collapsedParents = new Set();
        this.clusters.forEach(c => { if (c.collapsed) _collapsedParents.add(c.id); });
        const _isAncestorCollapsed = (c) => {
            let cur = c;
            while (cur && cur.parent_id) {
                if (_collapsedParents.has(cur.parent_id)) return true;
                cur = this.clusters.find(x => x.id === cur.parent_id);
            }
            return false;
        };

        this._clusterIDsWithNodes = new Set();
        for (const n of this.nodes) { const cid = n.cluster_id || n.data?.cluster_id; if (cid) this._clusterIDsWithNodes.add(cid); }

        let visibleClusterCount = 0;
        const _fc = { canRender:0, ancestor:0, empty:0, vault:0, layer:0, clientLayer:0, bounds:0, viewport:0 };
        for (const cluster of sortedClusters) {
            if (cluster.id.includes('activity')) console.log('[ACTIVITY_LOOP]', cluster.id);
            const _isActivityCluster = cluster.id.includes('activity');
            // PROBE: 전체 filter trace
            if (cluster.id.includes('transcript') || cluster.id.includes('folder_app_src_main') || _isActivityCluster) {
                let skipReason = null;
                if (_isAncestorCollapsed(cluster)) skipReason = 'ancestor_collapsed';
                else if (!this._clusterIDsWithNodes.has(cluster.id) && (!cluster.children || cluster.children.length === 0)) skipReason = 'empty_no_nodes';
                else if (cluster.id === 'context_vault' && !this.showContextVault) skipReason = 'context_vault';
                else {
                    const _isExt = cluster.layer === 'external' || (cluster.data?.layer === 'external') || cluster.id.startsWith('cluster_ghost');
                    const _isUsr = cluster.layer === 'user' || (cluster.data?.layer === 'user') || (cluster.id.startsWith('sys_') && cluster.id !== 'sys_cluster_reserved' && cluster.id !== 'sys_cluster_buffer');
                    const _cl = cluster.clientLayer || cluster.data?.clientLayer;
                    if (!_cl) {
                        if (_isExt && !this.showExternalLayer) skipReason = 'layer_external';
                        else if (_isUsr && !this.showUserLayer) skipReason = 'layer_user';
                        else if (!_isExt && !_isUsr && !this.showBaseLayer && cluster.id !== 'context_vault') skipReason = 'layer_base';
                    }
                    if (!skipReason && !this._isClientLayerVisible(cluster)) skipReason = 'client_layer';
                    if (!skipReason) {
                        const _b = cluster.bounds;
                        if (!_b || _b.minX === Infinity) skipReason = 'bounds_infinity';
                        else if (_b.maxX < cMinX || _b.minX > cMaxX || _b.maxY < cMinY || _b.minY > cMaxY) skipReason = 'viewport_culled';
                    }
                }
                console.log('[RENDER_CLUSTER_TRACE]', cluster.id, skipReason || 'PASS', {
                    inIDs: this._clusterIDsWithNodes.has(cluster.id),
                    children: cluster.children?.length,
                    bounds: cluster.bounds
                });
            }

            // [v0.3.33] Probe ④: _canRenderCluster 진입 직전
            if (_isActivityCluster) {
                console.log('[CAN_RENDER_ACTIVITY]', cluster.id,
                    'visibleIdsHas=', this._visibleClusterIds?.has(cluster.id),
                    'collapsed=', cluster.collapsed);
            }

            // [v0.3.33] Phase 2: Cluster Render Eligibility
            // Phase 4-D-1: Resolver-based clusters skip _canRenderCluster (already resolved)
            if (!this._visibleGraphClusters) {
                if (!this._canRenderCluster(cluster)) { _fc.canRender++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=can_render'); continue; }
            }

            // [v0.3.32.4] Skip if any ancestor cluster is collapsed
            if (_isAncestorCollapsed(cluster)) { _fc.ancestor++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=ancestor_collapsed'); continue; }

            // [v0.3.34] Skip empty clusters (no direct nodes + no children)
            // Exception: Resolver-visible clusters (e.g. roots in expandRootsOnly) must never be empty-skipped
            const isResolverVisible = this._visibleGraphClusterIds?.has(cluster.id);
            if (!isResolverVisible && !this._clusterIDsWithNodes.has(cluster.id) && (!cluster.children || cluster.children.length === 0)) { _fc.empty++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=empty'); continue; }

            // [v0.2.18.3] Isolate Context Vault unless toggled ON
            if (cluster.id === 'context_vault' && !this.showContextVault) { _fc.vault++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=context_vault'); continue; }

            // [v0.3.11] Layer Visibility - Use EXPLICIT layer tag from backend
            const isClusterExternal = cluster.layer === 'external' || (cluster.data && cluster.data.layer === 'external') || cluster.id.startsWith('cluster_ghost');
            const isClusterUser = cluster.layer === 'user' || (cluster.data && cluster.data.layer === 'user') || (cluster.id.startsWith('sys_') && cluster.id !== 'sys_cluster_reserved' && cluster.id !== 'sys_cluster_buffer');
            
            const cl = cluster.clientLayer || (cluster.data && cluster.data.clientLayer);
            if (cl) {
                // Client cluster visibility is already checked by `_isClientLayerVisible(cluster)` above.
            } else {
                if (isClusterExternal && !this.showExternalLayer) { _fc.layer++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=layer_external'); continue; }
                if (isClusterUser && !this.showUserLayer) { _fc.layer++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=layer_user'); continue; }
                if (!isClusterExternal && !isClusterUser && !this.showBaseLayer) {
                    // UI Filter: AI clusters hidden (Project Root, etc)
                    if (cluster.id !== 'context_vault') {
                        _fc.layer++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=layer_base'); continue;
                    }
                }
            }
            if (!this._isClientLayerVisible(cluster)) { _fc.clientLayer++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=client_layer'); continue; }

            const b = cluster.bounds;
            if (!b || b.minX === Infinity) { _fc.bounds++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=bounds_invalid', 'bounds=', b); continue; }
            
            // Fast bounding box culling for cluster
            if (b.maxX < cMinX || b.minX > cMaxX || b.maxY < cMinY || b.minY > cMaxY) {
                _fc.viewport++; if (_isActivityCluster) console.log('[ACTIVITY_SKIP]', cluster.id, 'reason=viewport_culled', 'bounds=', b, 'viewport=', {cMinX, cMinY, cMaxX, cMaxY});
                continue; // Cluster is entirely outside the viewport
            }

            // PROBE: visible node count per cluster (Hide Noise aware)
            const visibleNodeCount = this._visibleNodesCache 
                ? this._visibleNodesCache.filter(n => (n.cluster_id || n.data?.cluster_id) === cluster.id).length 
                : 0;
            console.log('[CLUSTER_VISIBLE_NODES]', cluster.id, visibleNodeCount);

            // Generate a consistent color based on cluster ID
            let hash = 0;
            for (let i = 0; i < cluster.id.length; i++) {
                hash = cluster.id.charCodeAt(i) + ((hash << 5) - hash);
            }
            const colorIndex = Math.abs(hash) % this.clusterColors.length;
            cluster.color = this.clusterColors[colorIndex];

            const { minX, minY, maxX, maxY } = b;
            const padding = 20;

            // 클러스터 박스 그리기
            this.ctx.beginPath();

            if (cluster.collapsed) {
                const headerHeight = 30;
                this.ctx.fillStyle = cluster.color || (theme ? theme.COLORS.INFO : '#458588');
                this.ctx.fillRect(minX - padding, minY - padding - headerHeight, (maxX - minX) + padding * 2, headerHeight);

                this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.BG_DARK : '#282828';
                this.ctx.font = `bold ${14 / this.transform.zoom}px Inter, sans-serif`;
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`[+] ${cluster.label}`, minX - padding + 10, minY - padding - headerHeight / 2);
            } else {
                // Expanded
                const headerHeight = 30;

                const baseColor = cluster.color || (theme ? theme.COLORS.HIGHLIGHT : '#458588');

                // Header
                this.ctx.fillStyle = baseColor;
                this.ctx.fillRect(minX - padding, minY - padding - headerHeight, (maxX - minX) + padding * 2, headerHeight);

                // Body background
                this.ctx.fillStyle = baseColor + '10'; // 6% alpha
                this.ctx.fillRect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);

                // Border
                this.ctx.strokeStyle = baseColor;
                this.ctx.lineWidth = 1.5 / this.transform.zoom;
                this.ctx.strokeRect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);

                // Label
                this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.BG_DARK : '#282828';
                this.ctx.font = `bold ${14 / this.transform.zoom}px Inter, sans-serif`;
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`[-] ${cluster.label}`, minX - padding + 10, minY - padding - headerHeight / 2);
            }

            cluster._headerBounds = {
                x: minX - padding,
                y: minY - padding - 30,
                width: (maxX - minX) + padding * 2,
                height: 30
            };
            cluster._bodyHeight = (maxY - minY) + padding * 2;
            visibleClusterCount++;
        }

        if (this._frameCounter % 60 === 0) {
            console.log(`[PERF] VisibleClusters: ${visibleClusterCount}`);
            console.log('[RC_FILTER]', JSON.stringify({ drawn: visibleClusterCount, ..._fc }));
        }
    }

    renderGhostNodes(zoom) {
        if (!this.baselineNodes) return;
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);

        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.setLineDash([5, 5]);

        const nodeWidth = 120;
        const nodeHeight = 60;

        // [v0.2.19] Ghost Nodes belong to Base Logic. If Base Logic is off, hide them.
        if (!this.showBaseLayer) {
            this.ctx.restore();
            return;
        }

        // [v0.3.33] Viewport Culling for Ghost Nodes
        const dpr = window.devicePixelRatio || 1;
        const viewWidth = this.canvas.width / dpr;
        const viewHeight = this.canvas.height / dpr;
        const minX = -this.transform.offsetX / zoom;
        const minY = -this.transform.offsetY / zoom;
        const maxX = minX + viewWidth / zoom;
        const maxY = minY + viewHeight / zoom;
        const buffer = 200;
        const cMinX = minX - buffer;
        const cMinY = minY - buffer;
        const cMaxX = maxX + buffer;
        const cMaxY = maxY + buffer;

        for (const ghost of this.baselineNodes) {
            // Culling for ghosts
            const px = ghost.position.x;
            const py = ghost.position.y;
            if (px < cMinX || px > cMaxX || py < cMinY || py > cMaxY) {
                continue; // Ghost node is outside the viewport
            }

            const currentNode = this.nodes.find(n => n.id === ghost.id);

            // 1. 사라진 노드 (Ghost) - [v0.2.17] Disabled as it adds visual clutter for explicitly deleted nodes
            /*
            if (!currentNode) {
                this.ctx.strokeStyle = '#928374';
                this.ctx.fillStyle = '#282828';
                this.ctx.strokeRect(ghost.position.x, ghost.position.y, nodeWidth, nodeHeight);
                this.ctx.font = '10px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`(Removed: ${ghost.data.label})`, ghost.position.x + nodeWidth / 2, ghost.position.y + nodeHeight / 2);
            }
            */
            // 2. 위치가 바뀐 노드 (Origin point ghost)
            if (currentNode.position.x !== ghost.position.x || currentNode.position.y !== ghost.position.y) {
                this.ctx.strokeStyle = '#458588';
                this.ctx.strokeRect(ghost.position.x, ghost.position.y, nodeWidth, nodeHeight);

                // 이동 경로 표시 (선)
                this.ctx.beginPath();
                this.ctx.moveTo(ghost.position.x + nodeWidth / 2, ghost.position.y + nodeHeight / 2);
                this.ctx.lineTo(currentNode.position.x + nodeWidth / 2, currentNode.position.y + nodeHeight / 2);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    /**
     * Draw specific shape based on typeLabel
     */
    drawNodeShape(ctx, x, y, width, height, shape = 'box', typeLabel = 'source', node = null) {
        ctx.beginPath();
        if (shape === 'diamond') {
            // Decision Diamond
            ctx.moveTo(x + width / 2, y);
            ctx.lineTo(x + width, y + height / 2);
            ctx.lineTo(x + width / 2, y + height);
            ctx.lineTo(x, y + height / 2);
        } else if (shape === 'hexagon') {
            // Hexagon (Loop)
            const offset = 20;
            ctx.moveTo(x + offset, y);
            ctx.lineTo(x + width - offset, y);
            ctx.lineTo(x + width, y + height / 2);
            ctx.lineTo(x + width - offset, y + height);
            ctx.lineTo(x + offset, y + height);
            ctx.lineTo(x, y + height / 2);
        } else if (shape === 'parallelogram') {
            // Parallelogram (Output)
            const offset = 20;
            ctx.moveTo(x + offset, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width - offset, y + height);
            ctx.lineTo(x, y + height);
        } else if (typeLabel === 'Entry' || typeLabel === 'Data' || typeLabel === 'Test') {
            // Rounded Rectangle
            const radius = 10;
            if (ctx.roundRect) {
                ctx.roundRect(x, y, width, height, radius);
            } else {
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
            }
        } else {
            // Standard Box
            ctx.rect(x, y, width, height);
        }
        ctx.closePath();
    }

    /**
     * 노드 타입별 스타일 가져오기 (Phase 3.5: Identity)
     */
    getNodeStyle(node) {
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
        const stats = this.nodeStatsMap.get(node.id);
        
        if (theme && theme.getFullNodeStyle) {
            return theme.getFullNodeStyle(node, stats);
        }

        let bgColor = node.data?.color || '#3c3836';
        if (this.debugClusterColorMode && node.cluster_id) {
            // Simple string hash to color
            let hash = 0;
            for (let i = 0; i < node.cluster_id.length; i++) {
                hash = node.cluster_id.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            bgColor = '#' + '00000'.substring(0, 6 - c.length) + c;
        }

        // Legacy Fallback
        return {
            borderColor: '#a89984',
            bgColor: bgColor,
            icon: '📄',
            lineWidth: 2,
            shape: 'box',
            opacity: 0.98,
            typeLabel: node.type || 'Logic'
        };
    }

    /**
     * [v0.3.22] Unified Node Badge Rendering
     * Handles status indicators like Approval, Lock, Hazard, and Necrosis.
     */
    renderNodeBadges(node, x, y, zoom, ctx = null) {
        const renderCtx = ctx || this.ctx;
        // [v0.3.22] Enhanced Visibility: Show badges earlier during zoom-in
        if (!node || zoom < 0.1) return;
        
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        if (!theme) return;

        const nodeWidth = 120;
        const iconSize = 18;
        
        // 1. Proposed / Pending Approval (Bottom Right)
        if (node.status === 'proposed' || node.state === 'pending') {
            renderCtx.fillStyle = theme.STATUS.WARNING.border || '#fb4934';
            renderCtx.font = `${iconSize}px Inter`;
            renderCtx.fillText(theme.STATUS.PROPOSED.icon, x + nodeWidth - 15, y + 55);
        }

        // 2. Locked Architecture (Top Right)
        if (node.data?.isLocked) {
            renderCtx.fillStyle = theme.COLORS.TEXT;
            renderCtx.font = `${iconSize}px Inter`;
            renderCtx.fillText(theme.STATUS.LOCKED.icon, x + nodeWidth - 15, y + 15);
        }

        // 3. Necrosis / Tombstone (Center)
        if (node.status === 'error_necrosis' || node.status === 'error_tombstone') {
            if (zoom > 0.8) {
                renderCtx.fillStyle = theme.STATUS.WARNING.border;
                renderCtx.font = 'bold 28px Inter';
                renderCtx.textAlign = 'center';
                const statusIcon = node.status === 'error_tombstone' ? theme.STATUS.TOMBSTONE.icon : theme.STATUS.NECROSIS.icon;
                renderCtx.fillText(statusIcon, x + nodeWidth / 2, y + 35);
            }
        }
    }

    _getNodeRenderY(node) {
        if (!node || !node.position) return 0;
        const clientLayer = node.clientLayer || (node.data && node.data.clientLayer);
        return node.position.y + this.getClientLayerOffset(clientLayer);
    }

    renderNode(node, zoom) {
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
        if (!node || !node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
            return;
        }
        const renderY = this._getNodeRenderY(node);

        // [v0.3.19] Noise Control: Hide Leaf Nodes
        if (this.hideLeafNodes) {
            const stats = this.nodeStatsMap.get(node.id);
            if (stats && stats.primaryRole === 'Leaf node') return;
        }

        // [v0.3.19] Strategic Visibility: Top-N Focus View
        if (this.focusTopNodes > 0) {
            const isEssential = this.selectedNodes.has(node.id) || (this.hoveredNode && this.hoveredNode.id === node.id);
            if (!this.focusNodeSet.has(node.id) && !isEssential) return;
        }

        // 1.5. 클러스터 접힘 체크
        const clusterId = node.cluster_id || node.data?.cluster_id;
        if (clusterId) {
            const cluster = this.clusters?.find(c => c.id === clusterId);
            if (cluster && cluster.collapsed) {
                if (clusterId !== 'doc_shelf') return;
            }
        }

        this.ctx.save();

        // Apply visual differentiation for Context nodes in Focus View
        if (this.focusTopNodes > 0) {
            const isEssential = this.selectedNodes.has(node.id) || (this.hoveredNode && this.hoveredNode.id === node.id);
            if (!this.focusCoreSet.has(node.id) && !isEssential) {
                this.ctx.globalAlpha = 0.4;
            }
        }

        let jitterX = 0, jitterY = 0;
        if (node.isArchViolation && this.isAnimating) {
            jitterX = (Math.random() - 0.5) * 2.5;
            jitterY = (Math.random() - 0.5) * 2.5;
        }
        this.ctx.translate(node.position.x + jitterX, renderY + jitterY);

        const x = 0;
        const y = 0;
        const nodeWidth = 120;
        const nodeHeight = 60;

        // Level 1: Satellite View (Lowered from 0.4 to 0.2 for shape persistence, or dynamically forced by LOD)
        const isDynamicLOD = this.nodes.length > 5000 && zoom < 0.3;
        if (zoom < 0.2 || isDynamicLOD) {
            let satColor = node.data.color || SYNAPSE_THEME.STATUS.ACTIVE.color;
            if (node.status === 'ghost' || node.state === 'pending') {
                satColor = SYNAPSE_THEME.STATUS.GHOST.color;
            } else if (node.status === 'necrosis') {
                satColor = SYNAPSE_THEME.STATUS.NECROSIS.color;
            }
            
            this.ctx.fillStyle = satColor;
            this.ctx.beginPath();
            const radius = isDynamicLOD && zoom >= 0.2 ? 12 / zoom : 8 / zoom;
            this.ctx.arc(nodeWidth / 2, nodeHeight / 2, radius, 0, Math.PI * 2);
            this.ctx.fill();

            if (this.selectedNodes && this.selectedNodes.has(node)) {
                this.ctx.strokeStyle = '#fabd2f';
                this.ctx.lineWidth = 4 / zoom;
                this.ctx.stroke();
            }
            this.ctx.restore();
            return;
        }

        const style = this.getNodeStyle(node);
        const isSelected = this.selectedNodes.has(node);
        const isHovered = this.hoveredNode === node;

        const isPartofActivePath = isSelected || isHovered || Array.from(this.selectedNodes).some(n => {
            return this.edges.some(e => (e.from === n.id && e.to === node.id) || (e.from === node.id && e.to === n.id));
        }) || (this.hoveredEdge && (this.hoveredEdge.from === node.id || this.hoveredEdge.to === node.id));

        let opacity = node.visual?.opacity || 0.4;

        // [v0.3.31] Time-based Stale Diagnostics
        const clientTimestamp = node.clientTimestamp || node.data?.clientTimestamp;
        if (clientTimestamp) {
            const diffMins = (Date.now() - clientTimestamp) / 60000;
            if (diffMins <= 5) {
                opacity = 1.0; // Active
            } else if (diffMins <= 15) {
                opacity = 0.7; // Stale
            } else {
                opacity = 0.4; // Offline Candidate
            }
        }

        if (isPartofActivePath) opacity = 1.0;
        this.ctx.globalAlpha = opacity;

        // 1. 상태별 특수 효과 계산
        const isTombstone = node.status === 'error_tombstone' || (node.data?.issues?.some(i => i.includes('Tombstone')));

        if ((node.status === 'error_necrosis' || isTombstone) && zoom > 0.4) {
            style.bgColor = '#1d2021'; // Dark Necrosis Base
            style.borderColor = '#fb4934'; // Red Border
        }

        // [v0.2.21] Tombstone Rendering (묘비)
        if (isTombstone) {
            this.renderTombstone(nodeWidth, nodeHeight, style);
            this.ctx.restore();
            return;
        }

        let borderColor = style.borderColor;
        let lineWidth = style.lineWidth;
        let bgColor = style.bgColor;
        let dash = style.dash || [];
        let glowColor = null;

        const baseBlur = theme ? theme.GLOW.BASE_BLUR : 15;
        const pulseRange = theme ? theme.GLOW.PULSE_RANGE : 5;
        const pulseSpeed = theme ? theme.GLOW.PULSE_SPEED : 200;
        const pulse = Math.abs(Math.sin(Date.now() / pulseSpeed));

        // [v0.3.22] Unified Node Status Style Resolution (Theme-Driven)
        if (theme) {
            if (node.status === 'active') {
                borderColor = theme.STATUS.ACTIVE.border || theme.STATUS.ACTIVE.color;
                if (node.visual) node.visual.opacity = 1.0;
            } else if (node.status === 'ghost') {
                borderColor = theme.STATUS.GHOST.border;
                dash = theme.STATUS.GHOST.dash || [5, 5];
            } else if (node.status === 'deleted') {
                borderColor = theme.STATUS.DELETED.border;
                bgColor = theme.STATUS.DELETED.color + '66'; // 0.4 alpha
            } else if (node.status === 'warning' || node.isError) {
                borderColor = theme.STATUS.WARNING.border;
                glowColor = theme.STATUS.WARNING.glow;
            } else if (node.status === 'error_necrosis' || node.status === 'error_tombstone') {
                const ns = theme.STATUS.NECROSIS;
                borderColor = ns.border;
                bgColor = ns.color;
            } else if (style.statusType >= 6.0) {
                // [v0.3.22] External nodes parity: Dashed border
                dash = [5, 5];
            }

            // High DTR Logic Pulse (Overwrites status glow if significant)
            const dtr = (node.intelligence && node.intelligence.dtr !== undefined) ? node.intelligence.dtr : this.currentDTR;
            if (dtr >= 0.7) {
                glowColor = (theme.STATUS.HIGH_DTR && theme.STATUS.HIGH_DTR.glow) ? theme.STATUS.HIGH_DTR.glow : '#8a2be2';
            }
        }
        // [v0.2.18.2] Promotion Awareness: node is currently in promotion animation
        const isPromoting = this.promotingNodeIds && this.promotingNodeIds.has(node.id);

        // 🩸 System Red-out Effect (Visual Stress)
        if (node.system_pressure > 70) {
            this.ctx.save();
            this.ctx.globalAlpha = (node.system_pressure - 70) / 30 * (0.3 + 0.2 * Math.sin(Date.now() / 150));
            this.ctx.fillStyle = '#fb4934';
            this.ctx.fillRect(-5, -5, nodeWidth + 10, nodeHeight + 10);
            this.ctx.restore();
        }
        if (isPromoting) {
            const promotionElapsed = Date.now() - (this.promotionSites.find(s => s.label === node.data?.label)?.startTime || 0);
            if (promotionElapsed < 3000) { // 3 seconds phase
                const ratio = Math.min(1, promotionElapsed / 3000);
                // Morph from Yellow to Green
                bgColor = this._lerpColor(theme.SPECIAL.HIGHLIGHTED.border, theme.UI.TOAST.success, ratio);
                borderColor = theme.UI.TOAST.success;
                glowColor = theme.UI.FPS.webgl; // Aqua glow
                if (!this.isDragging) {
                    this.ctx.shadowBlur = 20 * (1 - ratio) + 10;
                    this.ctx.shadowColor = glowColor;
                }
            } else {
                this.promotingNodeIds.delete(node.id);
            }
        }

        if (node.state === 'error') {
            borderColor = theme.STATUS.WARNING.border;
            lineWidth += 1.5;
            glowColor = theme.STATUS.WARNING.border;
        } else if (node.state === 'pending' || node.status === 'proposed') {
            dash = [5, 5];
            const pulse = 0.4 + 0.6 * Math.sin(Date.now() / 400);
            borderColor = `rgba(235, 219, 178, ${pulse})`;
            glowColor = `rgba(235, 219, 178, ${pulse * 0.3})`;
        } else if (node.status === 'ghost' || node.data?.status === 'ghost') {
            // [v0.2.19] Ghost Node style: dashed border, lower opacity, no glow
            dash = [4, 4];
            borderColor = theme.STATUS.GHOST.border;
            opacity *= 0.6; // Apply to the calculated opacity
        }

        let dtrPulse = null;

        if (style.glow) {
            glowColor = style.borderColor;
        }

        // [v0.2.17] DTR Glow Intensity (Highest Priority for Glow)
        let isDtrGlow = false;
        if (node.intelligence && node.intelligence.dtr !== undefined && node.intelligence.dtr >= 0.7) {
            isDtrGlow = true;
            dtrPulse = 0.8 + 0.2 * Math.sin(Date.now() / 250);
            glowColor = theme.SPECIAL.NECROSIS_GRADIENT.mid; // Reuse purple mid
        }

        if (isSelected) {
            borderColor = '#fabd2f';
            lineWidth = 3;
            // Only set glow to yellow if it's not a DTR glowing node
            if (!isDtrGlow) {
                glowColor = theme.STATUS.WARNING.border;
            }
        }

        // Logic Analysis Auras
        if (theme && theme.SPECIAL) {
            if (node.isVirtualDebugError) {
                const scanPhase = Date.now() / (theme.ANIMATION.SCAN_SPEED || 120);
                borderColor = theme.SPECIAL.VIRTUAL_DEBUG.border;
                lineWidth = 3;
                glowColor = `rgba(131, 165, 152, ${0.5 + 0.4 * Math.abs(Math.sin(scanPhase))})`;
                this.ctx.shadowOffsetY = Math.sin(scanPhase) * 3;
            } else if (node.isError) {
                borderColor = theme.STATUS.WARNING.border;
                lineWidth = 3;
                glowColor = theme.STATUS.WARNING.glow;
            } else if (node.isBottleneck) {
                borderColor = theme.SPECIAL.BOTTLENECK.border;
                lineWidth = 3;
                glowColor = theme.SPECIAL.BOTTLENECK.border;
            } else if (node.isArchViolation) {
                const jitterPhase = Date.now() / (theme.ANIMATION.JITTER_SPEED || 180);
                const jitter = Math.sin(jitterPhase) * 2;
                borderColor = theme.SPECIAL.ARCH_VIOLATION.border;
                lineWidth = 2;
                glowColor = `rgba(250, 189, 47, ${0.4 + 0.3 * Math.abs(Math.sin(jitterPhase))})`;
                this.ctx.shadowOffsetX = jitter;
                this.ctx.shadowOffsetY = jitter * 0.5;
            }

            if (node.isHighlighted) {
                const hPulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
                const high = theme.SPECIAL.HIGHLIGHTED;
                this.ctx.shadowBlur = 40 + 20 * hPulse;
                this.ctx.shadowColor = high.border;
                borderColor = high.border;
                lineWidth += 4;
                opacity = 1.0;
                this.ctx.globalAlpha = 1.0;
            }
        }

        // 2. 배경 및 글로우 렌더링
        this.ctx.save();

        // [v0.2.21 Fix] Reset shadow offset before applying (prevent bleed)
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Apply Glow logic (priority order: DTR > VirtualDebug > Promoting > ArchViolation > Selected/Error)
        if (!this.isDragging) {
            if (isDtrGlow) {
                this.ctx.shadowBlur = (baseBlur * theme.GLOW.DTR_MULTIPLIER) + (pulseRange * 2) * pulse * (node.visual?.glow_intensity || 1);
                this.ctx.shadowColor = glowColor;
            } else if (node.isVirtualDebugError && glowColor) {
                // [v0.2.21 Fix B1] Virtual Debug: pulsing Cyan scanner beam
                const scanPhase = Date.now() / 120;
                this.ctx.shadowBlur = baseBlur + pulseRange * Math.abs(Math.sin(scanPhase));
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowOffsetY = Math.sin(scanPhase) * 3;
            } else if (isPromoting) {
                // Shadow already set in promotion block above
            } else if (node.isArchViolation && glowColor) {
                const jitterPhase = Date.now() / 180;
                this.ctx.shadowBlur = baseBlur + pulseRange * Math.abs(Math.sin(jitterPhase));
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowOffsetX = Math.sin(jitterPhase) * 2;
                this.ctx.shadowOffsetY = Math.sin(jitterPhase * 0.7) * 1;
            } else if (glowColor && (isSelected || node.isError || node.isBottleneck || (isPartofActivePath && this.isAnimating))) {
                this.ctx.shadowBlur = baseBlur;
                this.ctx.shadowColor = glowColor;
            }
        }

        this.ctx.fillStyle = bgColor;
        this.drawNodeShape(this.ctx, x, y, nodeWidth, nodeHeight, style.shape, style.typeLabel, node);
        this.ctx.fill();

        // 🎨 [v0.2.20] Necrosis Overlay (Necrotic Core & Static Noise)
        if (node.status === 'error_necrosis') {
            const centerX = x;
            const centerY = y;
            const radius = Math.min(nodeWidth, nodeHeight) * 0.45;

            this.ctx.save();
            // 1. Necrotic Core (Radial Gradient)
            const ng = theme.SPECIAL.NECROSIS_GRADIENT;
            const grad = this.ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius);
            grad.addColorStop(0, ng.start);
            grad.addColorStop(0.6, ng.mid);
            grad.addColorStop(1, ng.end);

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. High-intensity Static Noise (Digital Decay)
            this.ctx.globalAlpha = 0.3 * (0.8 + 0.2 * Math.sin(Date.now() / 50)); // Flickering noise
            this.ctx.fillStyle = theme.SHADERS.NOISE || '#ebdbb2'; 
            for (let i = 0; i < 60; i++) {
                const rx = x - nodeWidth / 2 + Math.random() * nodeWidth;
                const ry = y - nodeHeight / 2 + Math.random() * nodeHeight;
                const rSize = 1 + Math.random() * 2;
                this.ctx.fillRect(rx, ry, rSize, rSize);
            }
            this.ctx.restore();

            // Highlight the necrotic state further
            borderColor = theme.STATUS.NECROSIS.border;
            lineWidth = 4;
        }

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = lineWidth;

        // [New] Documentation Shelf 노드는 항상 은은한 노란색 아우라 부여
        if (node.cluster_id === 'doc_shelf' && !isSelected) {
            glowColor = theme.SPECIAL.ARCH_VIOLATION.border;
            if (isPartofActivePath && this.isAnimating) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = glowColor;
            }
        }

        // 테두리 대시 설정
        if (dash.length > 0) {
            this.ctx.setLineDash(dash);
            if ((node.state === 'pending' || node.status === 'proposed') && this.isAnimating) {
                this.ctx.lineDashOffset = -this.animationOffset;
            }
        }

        this.drawNodeShape(this.ctx, x, y, nodeWidth, nodeHeight, style.shape, style.typeLabel, node);
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;

        // [v0.3.21] Use Centralized Badge Rendering for Parity
        this.renderNodeBadges(node, x, y, zoom);

        // [v0.3.22] Draw Identity Icon (Top-Left)
        if (zoom > 1.2 && style.icon) {
            const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
            const placement = (theme && theme.UI?.ICON_PLACEMENT) ? theme.UI.ICON_PLACEMENT : { x: 8, y: 8 };
            
            this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.TEXT : '#ebdbb2';
            this.ctx.font = '14px Inter, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(style.icon, x + placement.x, y + placement.y);
        }

        // Level 2: Normal View
        if (zoom >= 0.4 && zoom <= 1.5) {
            this.ctx.fillStyle = '#ebdbb2';
            this.ctx.font = 'bold 13px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            let label = node.data.label;
            const textY = node.state === 'error' ? y + nodeHeight / 2 + 15 : y + nodeHeight / 2 + 5;
            this.ctx.fillText(label, x + nodeWidth / 2, textY);

            // Proposed 안내문 (높은 줌레벨에서만)
            if ((node.status === 'proposed' || node.state === 'pending') && zoom > 1.2) {
                this.ctx.font = 'italic 9px Inter, sans-serif';
                this.ctx.fillStyle = 'rgba(235, 219, 178, 0.7)';
                this.ctx.fillText(`${theme ? theme.STATUS.APPROVAL.icon : '⚡'} Awaiting Approval`, x + nodeWidth / 2, y + nodeHeight - 8);
            }
        }

        // Level 3: Detail View & Deep LOD
        if (zoom > 1.5) {
            this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.TEXT : '#ebdbb2';
            this.ctx.font = 'bold 11px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.data.label, x + nodeWidth / 2, y + 15);

            // 구분선
            this.ctx.strokeStyle = theme.DETAILS.DIVIDER;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 10, y + 25);
            this.ctx.lineTo(x + nodeWidth - 10, y + 25);
            this.ctx.stroke();

            // 타입별 Deep LOD 정보 (Priority-based)
            let offsetY = y + 35;
            this.ctx.textAlign = 'left';
            this.ctx.font = '9px Inter, sans-serif';

            // 1. Logic Node: Functions/Classes
            if ((node.type === 'logic' || node.type === 'source') && node.data.summary) {
                const { functions, classes } = node.data.summary;
                this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.ROLE.Logic : '#83a598';
                const items = [...(classes || []), ...(functions || [])];
                items.slice(0, 3).forEach(item => {
                    this.ctx.fillText(`• ${item}`, x + 10, offsetY);
                    offsetY += 10;
                });
            }
            // 2. Data Node: Tables/Schema Keys
            else if ((node.type === 'data' || node.type === 'config') && node.data.summary) {
                const { tables, keys } = node.data.summary;
                this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.ROLE.Data : '#fabd2f';
                const items = [...(tables || []), ...(keys || [])];
                items.slice(0, 3).forEach(item => {
                    this.ctx.fillText(`◆ ${item}`, x + 10, offsetY);
                    offsetY += 10;
                });
            }
            // 3. External Node: Status/Latency
            else if (node.type === 'external' && node.data.summary) {
                const { status, latency } = node.data.summary;
                this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.ROLE.External : '#fe8019';
                if (status) {
                    this.ctx.fillText(`Status: ${status}`, x + 10, offsetY);
                    offsetY += 10;
                }
                if (latency) {
                    this.ctx.fillText(`Latency: ${latency}ms`, x + 10, offsetY);
                    offsetY += 10;
                }
            } else if (node.status === 'proposed' || node.state === 'pending') {
                this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.BORDER : '#a89984';
                this.ctx.fillText('⚡ Awaiting Approval', x + 10, offsetY);
                offsetY += 12;
                this.ctx.font = '8px Inter, sans-serif';
                this.ctx.fillText('Click [V] to start deep scan', x + 10, offsetY);
            } else {
                this.ctx.fillStyle = (theme && theme.COLORS) ? theme.COLORS.BORDER : '#a89984';
                const desc = node.data.description || 'No detailed analysis available.';
                this.ctx.fillText(desc.substring(0, 30) + (desc.length > 30 ? '...' : ''), x + 10, offsetY);
            }
        }

        // 6. [v0.2.32] Corner Handles (꼭지점) for Easier Movement
        if (isSelected && zoom > 0.6) {
            this.ctx.fillStyle = '#fabd2f';
            this.ctx.globalAlpha = 1.0;
            const hSize = 8 / zoom; // Handle size

            // Draw a subtle border around the whole box
            this.ctx.strokeStyle = '#fabd2f';
            this.ctx.lineWidth = 1.5 / zoom;
            this.ctx.strokeRect(0, 0, nodeWidth, nodeHeight);

            // Handle Boxes at corners
            this.ctx.fillRect(-hSize / 2, -hSize / 2, hSize, hSize); // TL
            this.ctx.fillRect(nodeWidth - hSize / 2, -hSize / 2, hSize, hSize); // TR
            this.ctx.fillRect(-hSize / 2, nodeHeight - hSize / 2, hSize, hSize); // BL
            this.ctx.fillRect(nodeWidth - hSize / 2, nodeHeight - hSize / 2, hSize, hSize); // BR
        }

        this.ctx.restore(); // [CRITICAL] Matches ctx.save() at the start of node rendering
    }

    /**
     * 노드 승인/취소 버튼 렌더링
     */
    renderNodeButtons(node, x, y, width, height) {
        const btnSize = 20;
        const spacing = 4;
        const zoom = this.transform.zoom;

        // 버튼 위치 (우측 상단 위로 배치)
        const vBtnX = x + width - (btnSize * 2) - spacing;
        const xBtnX = x + width - btnSize;
        const btnY = y - btnSize - 5;

        // [V] 버튼 (Approve)
        this.ctx.fillStyle = '#b8bb26';
        this.ctx.fillRect(vBtnX, btnY, btnSize, btnSize);
        this.ctx.fillStyle = '#282828';
        this.ctx.font = 'bold 12px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('V', vBtnX + btnSize / 2, btnY + btnSize / 2);

        // [X] 버튼 (Reject)
        this.ctx.fillStyle = '#fb4934';
        this.ctx.fillRect(xBtnX, btnY, btnSize, btnSize);
        this.ctx.fillStyle = '#282828';
        this.ctx.fillText('X', xBtnX + btnSize / 2, btnY + btnSize / 2);
    }

    /**
     * 노드 버튼 클릭 체크
     */
    checkNodeButtonClick(worldX, worldY) {
        const nodeWidth = 120;
        const btnSize = 20;
        const spacing = 4;

        for (const node of this.nodes) {
            if (node.status !== 'proposed' && node.state !== 'pending') continue;

            const x = node.position.x;
            const y = this._getNodeRenderY(node);
            const vBtnX = x + nodeWidth - (btnSize * 2) - spacing;
            const xBtnX = x + nodeWidth - btnSize;
            const btnY = y - btnSize - 5;

            // [V] 버튼 클릭 검사
            if (worldX >= vBtnX && worldX <= vBtnX + btnSize &&
                worldY >= btnY && worldY <= btnY + btnSize) {
                this.approveNode(node.id);
                return true;
            }

            // [X] 버튼 클릭 검사
            if (worldX >= xBtnX && worldX <= xBtnX + btnSize &&
                worldY >= btnY && worldY <= btnY + btnSize) {
                this.rejectNode(node.id);
                return true;
            }
        }
        return false;
    }

    approveNode(nodeId) {
        console.log('[SYNAPSE] Approving node:', nodeId);
        if (typeof vscode !== 'undefined') {
            this.isExpectingUpdate = true; // 응답으로 올 상태 업데이트에서 뷰 유지
            vscode.postMessage({ command: 'approveNode', nodeId });
        } else {
            // Standalone API 호출 (분석 요청)
            const node = this.nodes.find(n => n.id === nodeId);
            if (node) {
                const loadingEl = document.getElementById('loading');
                if (loadingEl) loadingEl.style.display = 'flex';

                this.callStandaloneApi('/api/analyze', {
                    filePath: node.data.file || node.data.path
                }).then(res => {
                    if (loadingEl) loadingEl.style.display = 'none';
                    if (res?.success) {
                        node.status = 'active';
                        node.state = 'active';
                        node.visual.opacity = 1.0;
                        delete node.visual.dashArray;
                        this.saveState();
                        this.render();
                    }
                });
            }
        }
    }

    rejectNode(nodeId) {
        console.log('[SYNAPSE] Rejecting node:', nodeId);
        if (typeof vscode !== 'undefined') {
            this.isExpectingUpdate = true; // 응답으로 올 상태 업데이트에서 뷰 유지
            vscode.postMessage({ command: 'rejectNode', nodeId });
        } else {
            // Mock behavior for browser
            this.nodes = this.nodes.filter(n => n.id !== nodeId);
            this.edges = this.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
            this.render();
        }
    }

    /**
     * 엣지 타입별 시각적 스타일 반환
     * @param {Object} edge - 엣지 객체
     * @returns {Object} { color, dashPattern, lineWidth, arrowStyle }
     */
    getEdgeStyle(edge) {
        // [v0.3.22.9] SSoT Integration: Use SYNAPSE_THEME for all styling decisions
        const type = edge.type || 'dependency';
        const weight = typeof edge.weight === 'number' ? edge.weight : 0;
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        
        if (theme && theme.getEdgeStyle) {
            const themeStyle = theme.getEdgeStyle(type);
            let lineWidth = themeStyle.thickness || 2;
            if (weight > 0) lineWidth += (weight * 0.8);
            
            const dtr = (edge.intelligence && edge.intelligence.dtr !== undefined) ? edge.intelligence.dtr : 0.0;
            if (dtr > 0) lineWidth += (dtr * 1.5);

            const res = {
                color: themeStyle.color || '#ebdbb2',
                dashPattern: dtr > 0 ? [4, 2] : (themeStyle.dash || []),
                lineWidth: lineWidth,
                icon: themeStyle.icon || '➤',
                arrowStyle: 'standard'
            };

            // [v0.3.22.9] Re-apply DTR Visual Tension (Violet Glow)
            if (dtr >= 0.7) {
                res.borderColor = '#8A2BE2'; // Violet for Deep Thinking
                res.glow = true;
                res.glowIntensity = (dtr - 0.7) * 2;
            }
            return res;
        }
        return { color: '#ebdbb2', dashPattern: [], lineWidth: 2.0 + (weight * 0.8), icon: '➤' };
    }

    /**
     * 노드 직사각형과 선분의 교점 계산
     * @param {number} centerX - 노드 중심 X
     * @param {number} centerY - 노드 중심 Y
     * @param {number} angle - 엣지 각도 (라디안)
     * @returns {Object} {x, y} 교점 좌표
     */
    getNodeBoundaryPoint(centerX, centerY, angle) {
        const nodeWidth = 120;
        const nodeHeight = 60;
        const halfWidth = nodeWidth / 2;
        const halfHeight = nodeHeight / 2;

        // 각도를 기준으로 어느 면과 만나는지 계산
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        // 각 면과의 교점 계산
        let intersectX, intersectY;

        // 좌우 면 체크
        if (Math.abs(dx) > 0.001) {
            const t = (dx > 0 ? halfWidth : -halfWidth) / dx;
            const y = t * dy;
            if (Math.abs(y) <= halfHeight) {
                intersectX = centerX + (dx > 0 ? halfWidth : -halfWidth);
                intersectY = centerY + y;
                return { x: intersectX, y: intersectY };
            }
        }

        // 상하 면 체크
        if (Math.abs(dy) > 0.001) {
            const t = (dy > 0 ? halfHeight : -halfHeight) / dy;
            const x = t * dx;
            if (Math.abs(x) <= halfWidth) {
                intersectX = centerX + x;
                intersectY = centerY + (dy > 0 ? halfHeight : -halfHeight);
                return { x: intersectX, y: intersectY };
            }
        }

        // 기본값 (중심)
        return { x: centerX, y: centerY };
    }

    /**
     * 점이 화살표 근처에 있는지 확인
     * @param {number} px - 클릭 포인트 X
     * @param {number} py - 클릭 포인트 Y
     * @param {number} arrowX - 화살표 X
     * @param {number} arrowY - 화살표 Y
     * @param {number} threshold - 거리 임계값 (기본 20px)
     * @returns {boolean}
     */
    isPointNearArrow(px, py, arrowX, arrowY, threshold = 20) {
        const dx = px - arrowX;
        const dy = py - arrowY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= threshold;
    }

    /**
     * 점이 베지어 곡선 근처에 있는지 확인
     * @param {number} px - 클릭 포인트 X
     * @param {number} py - 클릭 포인트 Y
     * @param {Object} edge - 엣지 객체
     * @param {number} threshold - 거리 임계값 (기본 10px)
     * @returns {boolean}
     */
    isPointNearCurve(px, py, edge, threshold = 10) {
        const fromNode = this.nodeMap.get(edge.from);
        const toNode = this.nodeMap.get(edge.to);

        if (!fromNode || !toNode) return false;

        const fromX = fromNode.position.x + 60;
        const fromY = fromNode.position.y + 30;
        const toX = toNode.position.x + 60;
        const toY = toNode.position.y + 30;
        const cpX = (fromX + toX) / 2;
        const cpY = (fromY + toY) / 2 - 30;

        // [v0.2.24] Hit Detection Optimization - O(1) Bounding Box Prefilter
        // 50px buffer for control curve bending distance
        const minX = Math.min(fromX, toX, cpX) - threshold - 50;
        const maxX = Math.max(fromX, toX, cpX) + threshold + 50;
        const minY = Math.min(fromY, toY, cpY) - threshold - 50;
        const maxY = Math.max(fromY, toY, cpY) + threshold + 50;

        if (px < minX || px > maxX || py < minY || py > maxY) {
            return false; // Point is outside bounding box, skip expensive O(Segments) Math
        }

        // 베지어 곡선 상의 여러 점을 샘플링하여 최소 거리 계산
        let minDistance = Infinity;
        for (let t = 0; t <= 1; t += 0.05) {
            const x = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * cpX + t * t * toX;
            const y = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * cpY + t * t * toY;
            const dx = px - x;
            const dy = py - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            minDistance = Math.min(minDistance, distance);
        }

        return minDistance <= threshold;
    }

    /**
     * 클릭 위치에서 엣지 찾기 (화살표 우선, 그 다음 곡선)
     * @param {number} px - 클릭 포인트 X
     * @param {number} py - 클릭 포인트 Y
     * @returns {Object|null} 찾은 엣지 또는 null
     */
    findEdgeAtPoint(px, py) {
        const targetEdges = (this.spatialIndex ? this.spatialIndex.queryPoint(px, py, 'edges') : null) || this.edges || [];

        for (const edge of targetEdges) {
            const fromNode = this.nodeMap.get(edge.from);
            const toNode = this.nodeMap.get(edge.to);
            if (!fromNode || !toNode || !fromNode.position || !toNode.position) continue;
            const fRenderY = this._getNodeRenderY(fromNode);
            const tRenderY = this._getNodeRenderY(toNode);
            const fromX = fromNode.position.x + 60;
            const fromY = fRenderY + 30;
            const toX = toNode.position.x + 60;
            const toY = tRenderY + 30;

            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2 - 30;
            if (this.isPointNearArrow(px, py, midX, midY, 20)) return edge;
        }

        for (const edge of targetEdges) {
            if (this.isPointNearCurve(px, py, edge, 30)) return edge;
        }
        return null;
    }

    renderEdge(edge) {
        const fromNode = this.nodeMap.get(edge.from);
        const toNode = this.nodeMap.get(edge.to);
        if (!fromNode || !toNode) return;

        // [v0.0.37.1] Check node visibility based on showUserLayer, showBaseLayer & showExternalLayer
        const isUserNode = (n) => n.layer === 'user' || (n.data && n.data.layer === 'user') || n.status === 'pending';
        const isExternalNode = (n) => n.layer === 'external' || (n.data && n.data.layer === 'external') || n.type === 'external' || n.status === 'ghost' || (n.cluster_id && n.cluster_id === 'cluster_ghosts');
        const isFromClient = fromNode.clientLayer || (fromNode.data && fromNode.data.clientLayer);
        const isToClient = toNode.clientLayer || (toNode.data && toNode.data.clientLayer);

        const isFromVisible = isFromClient ? this._isClientLayerVisible(fromNode) : (isUserNode(fromNode) ? this.showUserLayer : (isExternalNode(fromNode) ? this.showExternalLayer : this.showBaseLayer));
        const isToVisible = isToClient ? this._isClientLayerVisible(toNode) : (isUserNode(toNode) ? this.showUserLayer : (isExternalNode(toNode) ? this.showExternalLayer : this.showBaseLayer));
        
        if (!isFromVisible || !isToVisible) return;

        // [v0.3.19] Hide Edges connected to filtered Leaf nodes
        if (this.hideLeafNodes) {
            const fromStats = this.nodeStatsMap.get(fromNode.id);
            const toStats = this.nodeStatsMap.get(toNode.id);
            if ((fromStats && fromStats.primaryRole === 'Leaf node') || 
                (toStats && toStats.primaryRole === 'Leaf node')) return;
        }

        const isSelected = this.selectedEdge && this.selectedEdge.id === edge.id;
        const isHovered = this.hoveredEdge && this.hoveredEdge.id === edge.id;
        // [v0.3.28-fix] O(1) lookup — _selectedNodeIds is pre-cached once per frame in render()
        const selectedIds = this._selectedNodeIds || new Set();
        const isPathSelected = isSelected || isHovered ||
            selectedIds.has(edge.from) || selectedIds.has(edge.to) ||
            (this.hoveredNode && (this.hoveredNode.id === edge.from || this.hoveredNode.id === edge.to));

        const isEdgeHidden = window.edgeVisibilityMode === 'NO_EDGES';
        if (isEdgeHidden && !isPathSelected) return;

        if (this.focusTopNodes > 0 && !isPathSelected) {
            if (!this.focusNodeSet.has(fromNode.id) || !this.focusNodeSet.has(toNode.id)) return;
        }

        // --- 🎨 Style & Data Resolution ---
        let validation = this.edgeValidationCache.get(edge.id) || { valid: true };
        const style = this.getEdgeStyle(edge);
        const fromRenderY = this._getNodeRenderY(fromNode);
        const toRenderY = this._getNodeRenderY(toNode);
        const fromX = fromNode.position.x + 60;
        const fromY = fromRenderY + 30;
        const toX = toNode.position.x + 60;
        const toY = toRenderY + 30;
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;

        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let cpX = midX;
        let cpY = midY;
        let isBundled = false;

        // [v0.3.29] Mathematical Parity with WebGL Bundling (Perpendicular Normal Vector)
        const isBundlingEnabled = window.enableEdgeBundling !== false && !window.forceStraightEdges;
        const edgeCountThreshold = 20; 
        const safeDist = Math.max(dist, 1.0); 
        
        // Normal vector for perpendicular offset
        const nx = -dy / safeDist;
        const ny = dx / safeDist;

        if (isBundlingEnabled && this._visibleEdgesCache && this._visibleEdgesCache.length >= edgeCountThreshold && dist > 50) {
            const bundleStrength = Math.min(dist * 0.15, 40);
            
            // Direction quantization (16 buckets)
            const angle = Math.atan2(dy, dx);
            const bucket = Math.round(angle / (Math.PI / 8));
            const groupOffset = (bucket % 8) * 3; 

            cpX += nx * (bundleStrength + groupOffset);
            cpY += ny * (bundleStrength + groupOffset);
            isBundled = true;
        } else {
            // Default arch: Use normal vector for consistency (Perfect WebGL parity)
            const archStrength = (dist < 10) ? 0 : -5; 
            cpX += nx * archStrength;
            cpY += ny * archStrength;
        }

        // [v0.3.21.1] NaN/Infinity Resilience
        if (!isFinite(cpX) || !isFinite(cpY)) {
            cpX = midX;
            cpY = midY;
        }

        let edgeColor = validation.valid ? style.color : validation.color;
        
        // [v0.3.28-fix] Enforce Minimum Screen-Space Thickness to prevent edges from becoming invisible when zooming out (Zoom < 1.0)
        let baseLineWidth = (isBundled ? 1.5 : style.lineWidth);
        let minWorldWidth = 2.0 / Math.max(0.01, this.transform.zoom); // Requires 2.0 pixel equivalent in screen space to survive anti-aliasing
        let calculatedLineWidth = Math.max(baseLineWidth, minWorldWidth);

        this.ctx.setLineDash(style.dashPattern || []);

        // Store CP for badge rendering sync
        edge.lastCPX = cpX;
        edge.lastCPY = cpY;

        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        if (edge.isCircular) {
            edgeColor = theme ? theme.STATUS.WARNING.border : '#fb4934';
            calculatedLineWidth += 2;
        }

        // --- 1단계: 선 렌더링 ---
        this.ctx.beginPath();
        // [v0.3.28-fix] Corrected: Use calculatedLineWidth instead of raw style.lineWidth, which was causing visual loss!
        this.ctx.lineWidth = isSelected || isHovered ? (calculatedLineWidth + 2.5) : calculatedLineWidth;
        // [v0.3.28-fix] Aggressive alpha boost. Anti-aliasing reduces perceived opacity significantly.
        // Base WebGL alpha is 0.5, but WebGL doesn't AA. In Canvas2D we need at least 0.85 to see it clearly against dark bg.
        let baseAlpha = this.transform.zoom < 0.8 ? 0.95 : 0.75;
        let finalAlpha = isSelected || isHovered ? 1.0 : (isBundled ? Math.max(0.4, baseAlpha - 0.2) : (isPathSelected ? Math.min(1.0, baseAlpha + 0.1) : baseAlpha));
        
        // [v0.3.32.2 Phase B] External Edge Stratification
        if (fromNode.cluster_id && toNode.cluster_id && fromNode.cluster_id !== toNode.cluster_id) {
            finalAlpha = (isSelected || isHovered || isPathSelected) ? 1.0 : 0.15;
        }

        if (isEdgeHidden && isPathSelected) finalAlpha = 0.3;
        if (this.focusTopNodes && !isPathSelected) {
            if (!this.focusCoreSet.has(fromNode.id) || !this.focusCoreSet.has(toNode.id)) finalAlpha *= 0.2;
        }
        
        // USER REQUESTED PROBE
        if (this._frameCounter % 60 === 0 && Math.random() < 0.02) {
            console.log("[ARC_DRAW]", "lineWidth=", calculatedLineWidth, "alpha=", finalAlpha);
        }

        this.ctx.globalAlpha = finalAlpha;
        this.ctx.strokeStyle = isSelected || isHovered ? (theme ? theme.STATUS.WARNING.border : '#fabd2f') : edgeColor;
        this.ctx.moveTo(fromX, fromY);
        this.ctx.quadraticCurveTo(cpX, cpY, toX, toY);
        this.ctx.stroke();

        // [v0.3.15] Pulse Animation
        if (this.pulses && this.pulses.length > 0) {
            const activePulses = this.pulses.filter(p => p.edgeId === edge.id);
            activePulses.forEach(p => {
                const t = p.progress;
                const px = (1 - t) * (1 - t) * fromX + 2 * (1 - t) * t * cpX + t * t * toX;
                const py = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * cpY + t * t * toY;
                this.ctx.fillStyle = theme ? theme.STATUS.WARNING.border : '#fabd2f';
                this.ctx.beginPath();
                this.ctx.arc(px, py, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });
            // [v0.3.28-fix] Restore globalAlpha after pulse draw to prevent alpha leak into renderNode()
            this.ctx.globalAlpha = 1.0;
        }

        // --- 2단계: 화살표 렌더링 ---
        const angle = Math.atan2(toY - cpY, toX - cpX);
        const arrowPoint = this.getNodeBoundaryPoint(toX, toY, angle + Math.PI);
        const edgeIcon = edge.visual?.icon || '';
        this.renderArrow(arrowPoint.x, arrowPoint.y, angle, edgeColor, style.arrowStyle, '');

        const bMidX = 0.25 * fromX + 0.5 * cpX + 0.25 * toX;
        const bMidY = 0.25 * fromY + 0.5 * cpY + 0.25 * toY;
        const midAngle = Math.atan2(toY - cpY, cpX - fromX);
        this.renderArrow(bMidX, bMidY, midAngle, edgeColor, style.arrowStyle, edgeIcon);

        // --- 3단계: 배지 렌더링 ---
        const isBadgeHidden = window.edgeVisibilityMode === 'NO_BADGES' || window.edgeVisibilityMode === 'NO_EDGES';
        if (!isBadgeHidden && this.transform.zoom > 0.2) {
            this.renderEdgeBadges(this.ctx, edge, cpX, cpY);
        }
    }


    /**
     * [v0.2.33] Hybrid Badge Rendering
     * 분리된 엣지 배지 렌더링 (2D/3D 공통 사용)
     */
    renderEdgeBadges(ctx, edge, cpX, cpY, explicitX = null, explicitY = null) {
        // [v0.3.16] Edge Visibility Control
        const isBadgeHidden = window.edgeVisibilityMode === 'NO_BADGES' || window.edgeVisibilityMode === 'NO_EDGES';
        if (isBadgeHidden) return;

        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
        const fromNode = edge.srcNode || this.nodeMap.get(edge.from);
        const toNode = edge.tgtNode || this.nodeMap.get(edge.to);
        if (!fromNode || !toNode) return;

        const fromX = fromNode.position.x + 60;
        const fromY = fromNode.position.y + 30;
        const toX = toNode.position.x + 60;
        const toY = toNode.position.y + 30;

        // [v0.3.21] Calculate position ON the quadratic Bezier curve for accurate bundling placement
        // Formula: B(t=0.5) = 0.25*P0 + 0.5*CP + 0.25*P2
        let bMidX, bMidY;
        if (explicitX !== null && explicitY !== null) {
            bMidX = explicitX;
            bMidY = explicitY;
        } else if (Number.isFinite(cpX) && Number.isFinite(cpY)) {
            bMidX = 0.25 * fromX + 0.5 * cpX + 0.25 * toX;
            bMidY = 0.25 * fromY + 0.5 * cpY + 0.25 * toY;
        } else {
            bMidX = (fromX + toX) / 2;
            bMidY = (fromY + toY) / 2;
        }

        // Final safety check to prevent rendering crashes
        if (!Number.isFinite(bMidX) || !Number.isFinite(bMidY)) return;

        // Apply visual vertical offset
        bMidY -= (this.transform.zoom > 1.0 ? 35 : 25);
        const badgeSize = Math.max(14, 22 / this.transform.zoom);

        // [v0.3.22] Unified Edge Badge Specification (Delegated to Theme)
        const badgeStyle = theme ? (theme.getEdgeBadgeStyle ? theme.getEdgeBadgeStyle(edge) : { text: '➤ ✅', bgColor: 'rgba(40,40,40,0.9)', borderColor: '#83a598', textColor: '#ebdbb2' }) : { text: '➤ ✅', bgColor: 'rgba(40,40,40,0.9)', borderColor: '#83a598', textColor: '#ebdbb2' };
        
        const combinedText = badgeStyle.text;
        const isPending = badgeStyle.isPending;

        // [v0.3.21] Defensive Rendering Block
        try {
            if (this.transform.zoom > 0.2) {
                ctx.save();
                // Use Emoji Font Stack from Conventions
                ctx.font = `bold ${badgeSize}px "Inter", "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
                const metrics = ctx.measureText(combinedText);
                const bw = metrics.width + 12 / this.transform.zoom;
                const bh = badgeSize * 1.5;

                // 1. Badge Background (Using Safe Fallback for roundRect)
                ctx.beginPath();
                const rx = bMidX - bw/2;
                const ry = bMidY - bh/2;
                const radius = 6 / this.transform.zoom;
                
                // Safe Round Rect Path
                ctx.moveTo(rx + radius, ry);
                ctx.lineTo(rx + bw - radius, ry);
                ctx.quadraticCurveTo(rx + bw, ry, rx + bw, ry + radius);
                ctx.lineTo(rx + bw, ry + bh - radius);
                ctx.quadraticCurveTo(rx + bw, ry + bh, rx + bw - radius, ry + bh);
                ctx.lineTo(rx + radius, ry + bh);
                ctx.quadraticCurveTo(rx, ry + bh, rx, ry + bh - radius);
                ctx.lineTo(rx, ry + radius);
                ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
                ctx.closePath();

                ctx.fillStyle = badgeStyle.bgColor;
                ctx.fill();
                ctx.strokeStyle = badgeStyle.borderColor;
                
                ctx.lineWidth = 1.5 / this.transform.zoom;
                ctx.stroke();

                // 2. Text Rendering
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = theme ? theme.COLORS.TEXT : '#ebdbb2';
                ctx.fillText(combinedText, bMidX, bMidY);

                // [v0.3.13] Legacy Icon Restoration: B and D badges
                if (edge.type === 'dependency' || edge.isDeterministicFracture) {
                    const legacyChar = edge.isDeterministicFracture ? 'B' : 'D';
                    const lx = bMidX - bw / 2 - 10 / this.transform.zoom;
                    const ly = bMidY;
                    const ls = badgeSize * 0.7;
                    
                    ctx.beginPath();
                    ctx.arc(lx, ly, ls * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = edge.isDeterministicFracture ? (theme ? theme.STATUS.ERROR.color : '#fb4934') : (theme ? theme.STATUS.WARNING.border : '#fabd2f');
                    ctx.fill();
                    ctx.fillStyle = theme ? theme.COLORS.BACKGROUND : '#1d2021';
                    ctx.font = `bold ${ls}px Monospace`;
                    ctx.fillText(legacyChar, lx, ly);
                }

                ctx.restore();

                // Hit tracking for interaction
                if (ctx === this.ctx && isPending) {
                    if (!this._confirmBadgeHits) this._confirmBadgeHits = [];
                    this._confirmBadgeHits.push({
                        x: bMidX, y: bMidY, r: bw / 2, edge: edge, isPending
                    });
                }
            }
        } catch (e) {
            // Fail silently to preserve the rest of the frame
            console.error("[SYNAPSE] Badge Rendering Failed:", e);
        }

        // [v0.2.17-patch6] ❌ Delete Badge (Only in Edit Logic mode)
        if (this.isEditMode) {
            const deleteX = bMidX + 25 / this.transform.zoom + 10;
            const deleteY = bMidY;
            const delSize = badgeSize * 0.8;
            
            ctx.save();
            ctx.font = `bold ${delSize}px Inter, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.beginPath();
            ctx.arc(deleteX, deleteY, delSize * 0.75, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 73, 52, 0.9)'; // Red
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillText('❌', deleteX, deleteY);
            ctx.restore();

            if (ctx === this.ctx) {
                if (!this._deleteBadgeHits) this._deleteBadgeHits = [];
                this._deleteBadgeHits.push({
                    x: deleteX, y: deleteY, r: delSize * 0.75, edge: edge
                });
            }
        }
    }

    /**
     * 화살표 렌더링 (타입별 스타일)
     * @param {number} x - 화살표 끝점 X
     * @param {number} y - 화살표 끝점 Y
     * @param {number} angle - 화살표 각도
     * @param {string} color - 화살표 색상
     * @param {string} style - 'standard', 'thick', 'double'
     * @param {string} text - 화살표 내부에 표시할 아이콘 (D, C, F, B 등)
     */
    renderArrow(x, y, angle, color, style = 'standard', text = '') {
        // 화살표 크기 최적화 (Sustainable Beauty)
        const baseSize = style === 'thick' ? 24 : 18;
        const minSize = 14;
        const arrowSize = Math.max(minSize, baseSize / Math.sqrt(this.transform.zoom));

        // Canvas 상태 저장
        this.ctx.save();

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - arrowSize * Math.cos(angle - Math.PI / 6),
            y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x - arrowSize * Math.cos(angle + Math.PI / 6),
            y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();

        // 화살표 채우기
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // 화살표 테두리 (가시성 향상)
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 아이콘 텍스트 추가 (Phase 3)
        if (text) {
            this.ctx.save();
            // 텍스트 위치 계산: 화살표 중심부 근처
            // 화살표 끝(x,y)에서 약간 뒤로 이동
            const textDist = arrowSize * 0.6;
            const tx = x - textDist * Math.cos(angle);
            const ty = y - textDist * Math.sin(angle);

            this.ctx.translate(tx, ty);

            // 텍스트 색상: 완벽한 임포트 가시성을 위해 밝은색(#f9f5d7 - Gruvbox light) 사용
            this.ctx.fillStyle = '#f9f5d7';
            this.ctx.font = `bold ${Math.max(10, arrowSize * 0.45)}px Inter, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(text, 0, 0);
            this.ctx.restore();
        }

        // Canvas 상태 복원
        this.ctx.restore();
    }

    renderConnectionHandles() {
        // 선택된 노드의 연결 핸들 렌더링
        for (const node of this.selectedNodes) {
            const renderY = this._getNodeRenderY(node);
            const centerX = node.position.x + 60;
            const centerY = renderY + 30;
            const handleSize = 8 / this.transform.zoom;

            const handles = [
                { x: centerX, y: renderY }, // 상
                { x: centerX, y: renderY + 60 }, // 하
                { x: node.position.x, y: centerY }, // 좌
                { x: node.position.x + 120, y: centerY } // 우
            ];

            handles.forEach(h => {
                this.ctx.fillStyle = '#fabd2f';
                this.ctx.strokeStyle = '#3c3836';
                this.ctx.lineWidth = 2 / this.transform.zoom;

                // 광택/발광 효과
                if (this.isAnimating && !this.isDragging) {
                    this.ctx.shadowBlur = 10 / this.transform.zoom;
                    this.ctx.shadowColor = '#fabd2f';
                }

                this.ctx.beginPath();
                this.ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.shadowBlur = 0; // 리셋
            });
        }

        // 선택된 클러스터의 연결 핸들 렌더링
        if (this.clusters) {
            const selectedClusterIds = new Set();
            for (const node of this.selectedNodes) {
                if (node.cluster_id) selectedClusterIds.add(node.cluster_id);
            }

            for (const clusterId of selectedClusterIds) {
                const cluster = this.clusters.find(c => c.id === clusterId);
                if (!cluster) continue;
                if (cluster.collapsed) continue; // 접힌 클러스터는 핸들 표시 안 함

                const clusterNodes = this.nodes.filter(n => n.cluster_id === clusterId);
                if (clusterNodes.length === 0) continue;

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                const padding = 20;
                for (const node of clusterNodes) {
                    minX = Math.min(minX, node.position.x);
                    minY = Math.min(minY, node.position.y);
                    maxX = Math.max(maxX, node.position.x + 120);
                    maxY = Math.max(maxY, node.position.y + 60);
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                const handleSize = 10 / this.transform.zoom;

                const handles = [
                    { x: centerX, y: minY - padding },
                    { x: centerX, y: maxY + padding },
                    { x: minX - padding, y: centerY },
                    { x: maxX + padding, y: centerY }
                ];

                handles.forEach(h => {
                    const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
                    this.ctx.fillStyle = cluster.color || (theme ? theme.COLORS.HIGHLIGHT : '#fabd2f');
                    this.ctx.strokeStyle = theme ? theme.COLORS.BORDER : '#3c3836';
                    this.ctx.lineWidth = 2 / this.transform.zoom;

                    // 광택/발광 효과 (드래그 중 임시 차단)
                    if (this.isAnimating && !this.isDragging) {
                        this.ctx.shadowBlur = 10 / this.transform.zoom;
                        this.ctx.shadowColor = theme ? theme.COLORS.HIGHLIGHT : '#fabd2f';
                    }

                    this.ctx.beginPath();
                    this.ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();

                    this.ctx.shadowBlur = 0; // 리셋
                });
            }
        }
    }

    renderGhostEdge() {
        if (!this.edgeSource) return;

        // 소스 위치 계산
        let fromX, fromY;
        if (this.edgeSource.type === 'node') {
            const sourceNode = this.nodes.find(n => n.id === this.edgeSource.id);
            if (!sourceNode) return;
            fromX = sourceNode.position.x + 60;
            fromY = sourceNode.position.y + 30;
        } else if (this.edgeSource.type === 'cluster') {
            const clusterNodes = this.nodes.filter(n => n.cluster_id === this.edgeSource.id);
            if (clusterNodes.length === 0) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const node of clusterNodes) {
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + 120);
                maxY = Math.max(maxY, node.position.y + 60);
            }
            fromX = (minX + maxX) / 2;
            fromY = (minY + maxY) / 2;
        }

        // 타겟 위치 계산
        let toX = this.edgeCurrentPos.x;
        let toY = this.edgeCurrentPos.y;

        if (this.edgeTarget) {
            if (this.edgeTarget.type === 'node') {
                const targetNode = this.nodes.find(n => n.id === this.edgeTarget.id);
                if (targetNode) {
                    toX = targetNode.position.x + 60;
                    toY = targetNode.position.y + 30;
                }
            } else if (this.edgeTarget.type === 'cluster') {
                const clusterNodes = this.nodes.filter(n => n.cluster_id === this.edgeTarget.id);
                if (clusterNodes.length > 0) {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    for (const node of clusterNodes) {
                        minX = Math.min(minX, node.position.x);
                        minY = Math.min(minY, node.position.y);
                        maxX = Math.max(maxX, node.position.x + 120);
                        maxY = Math.max(maxY, node.position.y + 60);
                    }
                    toX = (minX + maxX) / 2;
                    toY = (minY + maxY) / 2;
                }
            }
        }

        // 유령 엣지 그리기
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        this.ctx.strokeStyle = this.edgeTarget ? (theme ? theme.COLORS.SUCCESS : '#b8bb26') : (theme ? theme.COLORS.TEXT_MUTED : '#928374');
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);

        // 곡선
        const cpX = (fromX + toX) / 2;
        const cpY = (fromY + toY) / 2 - 30;
        this.ctx.quadraticCurveTo(cpX, cpY, toX, toY);

        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 화살표
        if (this.edgeTarget) {
            const angle = Math.atan2(toY - cpY, toX - cpX);
            const arrowSize = 10 / this.transform.zoom;

            this.ctx.beginPath();
            this.ctx.moveTo(toX, toY);
            this.ctx.lineTo(
                toX - arrowSize * Math.cos(angle - Math.PI / 6),
                toY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.lineTo(
                toX - arrowSize * Math.cos(angle + Math.PI / 6),
                toY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.closePath();

            // 타겟 중심부의 그림자/글로우 연산도 드래그 중 오프 처리
            if (!this.isDragging) {
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = theme ? theme.COLORS.SUCCESS : '#b8bb26';
            }

            this.ctx.fillStyle = theme ? theme.COLORS.SUCCESS : '#b8bb26';
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // 리셋
        }
    }

    // [v0.2.20] Deleted duplicate resizeCanvas definition

    /**
     * Send current context data to extension
     */
    sendContextData() {
        const context = {
            selectedNode: this.selectedNode ? {
                id: this.selectedNode.id,
                label: this.selectedNode.data.label,
                file: this.selectedNode.data.file,
                type: this.selectedNode.type
            } : null,
            viewState: {
                zoom: this.transform.zoom,
                offsetX: this.transform.offsetX,
                offsetY: this.transform.offsetY
            }
        };
        console.log('[SYNAPSE] Sending context data:', context);
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'contextData', data: context });
        }
    }

    renderDebugInfo() {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for HUD
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        ctx.font = '12px monospace';
        ctx.fillStyle = theme ? theme.UI.FPS.high : 'lime';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const info = [
            `Nodes: ${this.nodes.length}`,
            `Clusters: ${this.clusters ? this.clusters.length : 0}`,
            `Edges: ${this.edges.length}`,
            `Zoom: ${this.transform.zoom.toFixed(2)}`,
            `Offset: ${this.transform.offsetX.toFixed(0)}, ${this.transform.offsetY.toFixed(0)}`,
            `Canvas: ${this.canvas.width}x${this.canvas.height}`,
            `Last Input: ${this.lastInputTime ? new Date(this.lastInputTime).toLocaleTimeString() : 'None'}`
        ];

        info.forEach((text, i) => {
            ctx.fillText(text, 10, 10 + (i * 15));
        });
        ctx.restore();
    }

    /**
     * [v0.2.24] Real-time Diagnostic HUD
     * Shows detailed stats about FPS, WebGL, and Caching.
     */
    _renderDiagnosticHUD() {
        const fpsEl = document.getElementById('fps-display');
        if (!fpsEl) return;

        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        const now = performance.now();
        if (!this._fpsHistory) this._fpsHistory = [];
        this._fpsHistory.push(now);
        while (this._fpsHistory.length > 0 && now - this._fpsHistory[0] > 1000) this._fpsHistory.shift();
        const fps = this._fpsHistory.length;

        const webglStatus = this.webglEnabled ? 'ACTIVE' : 'OFF';
        const cacheSize = this.edgeValidationCache ? this.edgeValidationCache.size : 0;
        
        let color = '#fb4934';
        if (theme) {
            color = fps > 55 ? theme.UI.FPS.high : (fps > 30 ? theme.UI.FPS.mid : theme.UI.FPS.low);
            const wColor = theme.UI.FPS.webgl;
            const cColor = theme.UI.FPS.cache;
            fpsEl.innerHTML = `<span style="color: ${color}">${fps} FPS</span> | <span style="color: ${wColor}">WebGL: ${webglStatus}</span> | <span style="color: ${cColor}">Cache: ${cacheSize}</span>`;
        } else {
            color = fps > 55 ? '#b8bb26' : (fps > 30 ? '#fabd2f' : '#fb4934');
            fpsEl.innerHTML = `<span style="color: ${color}">${fps} FPS</span> | <span style="color: #83a598">WebGL: ${webglStatus}</span> | <span style="color: #d3869b">Cache: ${cacheSize}</span>`;
        }

        // [v0.3.33.8] FPS Verification Logger for LOD modes
        if (this._frameCounter % 60 === 0) {
            console.log(`[LOD_FPS_VERIFY] Mode: ${window.edgeVisibilityMode} | FPS: ${fps}`);
        }
    }

    // [v0.2.21] Tombstone Visual (Sovereign Quality)
    renderTombstone(width, height, style) {
        this.ctx.save();
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;

        // Tombstone Shape
        this.ctx.beginPath();
        this.ctx.moveTo(10, height);
        this.ctx.lineTo(10, 25);
        this.ctx.arc(width / 2, 25, width / 2 - 10, Math.PI, 0);
        this.ctx.lineTo(width - 10, height);
        this.ctx.closePath();

        this.ctx.fillStyle = theme ? theme.STATUS.NECROSIS.color : '#1d2021';
        this.ctx.fill();
        this.ctx.strokeStyle = theme ? theme.STATUS.NECROSIS.border : '#fb4934';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Cracks
        this.ctx.strokeStyle = theme ? (theme.STATUS.NECROSIS.border + '4D') : 'rgba(251, 73, 52, 0.3)'; // 4D = 0.3 alpha
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 25);
        this.ctx.lineTo(width / 2 + 10, 45);
        this.ctx.lineTo(width / 2 - 5, 60);
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = theme ? theme.STATUS.NECROSIS.border : '#fb4934';
        this.ctx.font = 'bold 18px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🪦', width / 2, 38);
        this.ctx.font = 'bold 9px Inter, sans-serif';
        this.ctx.fillText('DETERMINISTIC', width / 2, 52);
        this.ctx.fillText('FAILURE', width / 2, 63);

        this.ctx.restore();
    }

    /**
     * [v0.2.21] Virtual Debug HUD Toast
     * Displays a compact diagnostic panel after VirtualDebug completes.
     * @param {Object} data - { necroCount, fractureCount, errorCount, warnCount, pressure }
     */
    _showVirtualDebugHUD(data) {
        // Remove any existing HUD
        const existing = document.getElementById('vd-hud-panel');
        if (existing) existing.remove();

        const { necroCount, fractureCount, errorCount, warnCount, pressure } = data;
        const isClean = necroCount === 0 && fractureCount === 0;

        const panel = document.createElement('div');
        panel.id = 'vd-hud-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 20px;
            min-width: 260px;
            background: rgba(29, 32, 33, 0.97);
            border: 1px solid ${isClean ? '#b8bb26' : '#83a598'};
            border-radius: 10px;
            padding: 14px 18px;
            color: #ebdbb2;
            font-family: 'Inter', 'JetBrains Mono', monospace;
            font-size: 12px;
            z-index: 10050;
            box-shadow: 0 6px 32px rgba(0,0,0,0.85), 0 0 18px ${isClean ? 'rgba(184,187,38,0.2)' : 'rgba(131,165,152,0.25)'};
            animation: vd-hud-in 0.35s cubic-bezier(0.22,1,0.36,1);
            line-height: 1.7;
        `;

        // Pressure bar
        const barFill = Math.min(100, pressure);
        const barColor = pressure >= 70 ? '#fb4934' : pressure >= 40 ? '#fabd2f' : '#b8bb26';

        panel.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <span style="font-size:16px;">${isClean ? '✅' : '🔍'}</span>
                <span style="font-weight:bold;color:${isClean ? '#b8bb26' : '#83a598'};font-size:13px;">
                    VIRTUAL DEBUG ${isClean ? 'CLEAN' : 'SCAN COMPLETE'}
                </span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-bottom:10px;">
                <span style="color:#a89984;">☣ Necrotic Nodes</span>
                <span style="color:${necroCount > 0 ? '#fb4934' : '#b8bb26'};font-weight:bold;">${necroCount}</span>
                <span style="color:#a89984;">⚡ Fractured Edges</span>
                <span style="color:${fractureCount > 0 ? '#d3869b' : '#b8bb26'};font-weight:bold;">${fractureCount}</span>
                <span style="color:#a89984;">🔴 Errors</span>
                <span style="color:${errorCount > 0 ? '#fb4934' : '#b8bb26'};font-weight:bold;">${errorCount}</span>
                <span style="color:#a89984;">⚠ Warnings</span>
                <span style="color:${warnCount > 0 ? '#fabd2f' : '#b8bb26'};font-weight:bold;">${warnCount}</span>
            </div>
            <div style="margin-bottom:6px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="color:#a89984;font-size:10px;">SYSTEM PRESSURE</span>
                    <span style="color:${barColor};font-size:10px;font-weight:bold;">${pressure}%</span>
                </div>
                <div style="background:#3c3836;border-radius:3px;height:5px;overflow:hidden;">
                    <div style="width:${barFill}%;height:100%;background:${barColor};border-radius:3px;
                        transition:width 0.6s ease;box-shadow:0 0 6px ${barColor};"></div>
                </div>
            </div>
            <div style="color:#665c54;font-size:10px;text-align:right;margin-top:6px;">
                ${isClean ? 'No physical errors detected.' : 'Cyan nodes = VD affected. Purple edges = fractured.'}
            </div>
        `;

        // Close on click
        panel.addEventListener('click', () => panel.remove());

        // Add CSS animation if not already present
        if (!document.getElementById('vd-hud-style')) {
            const style = document.createElement('style');
            style.id = 'vd-hud-style';
            style.textContent = `
                @keyframes vd-hud-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(panel);

        // Auto-dismiss after 7 seconds
        setTimeout(() => {
            if (document.body.contains(panel)) {
                panel.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                panel.style.opacity = '0';
                panel.style.transform = 'translateY(8px)';
                setTimeout(() => panel.remove(), 500);
            }
        }, 7000);
    }

    /**
     * [v0.3.13] Grid-based Overlap Resolution
     * Efficiently nudges nodes apart when they overlap.
     */
    resolveOverlaps() {
        if (!this.nodes || this.nodes.length < 2) return;
        // [v0.3.33 Phase 2 Fix] Disable O(N^2) physics for FullGraph scale to prevent 10-minute freezes
        if (this.nodes.length > 1000) return;
        
        const nodeRadius = 80; 
        const iterations = 3;
        const damping = 0.5;

        for (let it = 0; it < iterations; it++) {
            let moved = false;
            for (let i = 0; i < this.nodes.length; i++) {
                const a = this.nodes[i];
                if (a.isDragging) continue;
                
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const b = this.nodes[j];
                    if (b.isDragging) continue;
                    
                    if (!a.position || !b.position) continue;

                    const dx = a.position.x - b.position.x;
                    const dy = a.position.y - b.position.y;
                    const distSq = dx * dx + dy * dy;
                    const minDistSq = nodeRadius * nodeRadius * 4; 

                    if (distSq < minDistSq && distSq > 1) {
                        const dist = Math.sqrt(distSq);
                        const force = (nodeRadius * 2 - dist) / dist * damping;
                        const nx = dx * force;
                        const ny = dy * force;

                        a.position.x += nx;
                        a.position.y += ny;
                        b.position.x -= nx;
                        b.position.y -= ny;
                        moved = true;
                    }
                }
            }
            if (!moved) break;
        }
    }

    // [v0.3.34] Hierarchical Grid Distribution (Cluster-First)
    distributeClustersHierarchically() {
        console.log("DISTRIBUTE_HIT");
        if (!this.clusters || this.clusters.length === 0) return;
        
        console.log('[SYNAPSE][distributeClustersHierarchically] Starting Hierarchical Grid Distribution...');
        
        const childrenMap = new Map();
        const roots = [];
        
        for (const c of this.clusters) {
            if (c.parent_id) {
                if (!childrenMap.has(c.parent_id)) childrenMap.set(c.parent_id, []);
                childrenMap.get(c.parent_id).push(c);
            } else {
                roots.push(c);
            }
        }
        
        const nodesByCluster = new Map();
        for (const n of this.nodes) {
            const cid = n.cluster_id || (n.data && n.data.cluster_id);
            if (!cid) continue;
            if (!nodesByCluster.has(cid)) nodesByCluster.set(cid, []);
            nodesByCluster.get(cid).push(n);
        }
        
        const clusterBounds = new Map();

        const layoutBottomUp = (cluster) => {
            const children = childrenMap.get(cluster.id);
            const directNodes = nodesByCluster.get(cluster.id) || [];
            
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            // Frontend assumes 100% layout authority. Ignore backend initial coordinates.
            const nodeCount = directNodes.length;
            const nCols = Math.max(1, Math.ceil(Math.sqrt(nodeCount)));
            const nRows = Math.ceil(nodeCount / nCols);
            const wNodes = nodeCount === 0 ? 0 : nCols * 120 + 100;
            const hNodes = nodeCount === 0 ? 0 : nRows * 80 + 100;

            if (cluster.collapsed) {
                // Return fixed tiny size for collapsed clusters
                const w = 250;
                const h = 60; // 30px header + padding
                clusterBounds.set(cluster.id, { width: w, height: h });
                cluster._localTargetCX = 0;
                cluster._localTargetCY = 0;
                cluster._currentCX = 0;
                cluster._currentCY = 0;
                return { width: w, height: h };
            }

            if (!children || children.length === 0) {
                if (wNodes === 0 && hNodes === 0) {
                    clusterBounds.set(cluster.id, { width: 0, height: 0 });
                    cluster._localTargetCX = 0;
                    cluster._localTargetCY = 0;
                    cluster._currentCX = 0;
                    cluster._currentCY = 0;
                    return { width: 0, height: 0 };
                }
                const w = wNodes;
                const h = hNodes;
                clusterBounds.set(cluster.id, { width: w, height: h });
                
                cluster._localTargetCX = 0;
                cluster._localTargetCY = 0;
                cluster._currentCX = 0;
                cluster._currentCY = 0;
                
                return { width: w, height: h };
            }
            
            for (const child of children) {
                layoutBottomUp(child);
            }
            
            children.sort((a, b) => a.id.localeCompare(b.id));
            
            let totalArea = 0;
            let activeChildCount = 0;
            for (const child of children) {
                const size = clusterBounds.get(child.id);
                if (size.width === 0 && size.height === 0) continue;
                totalArea += (size.width + 150) * (size.height + 150);
                activeChildCount++;
            }
            const targetWidth = Math.max(500, Math.ceil(Math.sqrt(totalArea) * 1.5));
            
            let currentX = 0, currentY = 0, rowHeight = 0, maxRowWidth = 0;
            
            for (const child of children) {
                const size = clusterBounds.get(child.id);
                if (size.width === 0 && size.height === 0) {
                    child._localX_tl = 0;
                    child._localY_tl = 0;
                    continue;
                }
                const w = size.width + 150;
                const h = size.height + 150;
                
                if (currentX + w > targetWidth && currentX > 0) {
                    currentX = 0;
                    currentY += rowHeight;
                    rowHeight = 0;
                }
                
                child._localX_tl = currentX;
                child._localY_tl = currentY;
                
                currentX += w;
                if (h > rowHeight) rowHeight = h;
                if (currentX > maxRowWidth) maxRowWidth = currentX;
            }
            currentY += rowHeight;
            
            const childGridWidth = maxRowWidth;
            const childGridHeight = currentY;
            
            const HEADER_PADDING = 80;
            const SECTION_GAP = 100;
            const FOOTER_PADDING = 80;
            const contentWidth = Math.max(wNodes, childGridWidth);
            const contentHeight = (hNodes > 0 ? hNodes + SECTION_GAP : 0) + childGridHeight;
            
            if (contentWidth === 0 && contentHeight === 0) {
                clusterBounds.set(cluster.id, { width: 0, height: 0 });
                cluster._localTargetCX = 0;
                cluster._localTargetCY = 0;
                cluster._currentCX = 0;
                cluster._currentCY = 0;
                return { width: 0, height: 0 };
            }
            
            const totalWidth = contentWidth + 150;
            const totalHeight = HEADER_PADDING + contentHeight + FOOTER_PADDING;
            
            clusterBounds.set(cluster.id, { width: totalWidth, height: totalHeight });
            
            if (totalWidth > 1000 || totalHeight > 1000) {
                const ratio = totalWidth / (wNodes || 1); // Comparing to direct node width
                console.log("[CLUSTER_BOUNDS_PROBE]", cluster.id, 
                    "directNodes=", directNodes.length, 
                    "childClusters=", children.length, 
                    "wNodes=", wNodes, "hNodes=", hNodes,
                    "childGridW=", childGridWidth, "childGridH=", childGridHeight,
                    "totalWidth=", totalWidth, "totalHeight=", totalHeight,
                    "ratio (Total/wNodes)=", ratio.toFixed(2));
            }
            
            if (hNodes > 0) {
                cluster._currentCX = 0;
                cluster._currentCY = 0;
                cluster._localTargetCX = 0;
                cluster._localTargetCY = -totalHeight / 2 + HEADER_PADDING + hNodes / 2;
            } else {
                cluster._currentCX = 0;
                cluster._currentCY = 0;
                cluster._localTargetCX = 0;
                cluster._localTargetCY = 0;
            }
            
            const childGridStartY = -totalHeight / 2 + HEADER_PADDING + (hNodes > 0 ? hNodes + SECTION_GAP : 0);
            const startX = -childGridWidth / 2;
            const startY = childGridStartY;
            
            for (const child of children) {
                const size = clusterBounds.get(child.id);
                const w = size.width + 150;
                const h = size.height + 150;
                
                child._localX = startX + child._localX_tl + w / 2;
                child._localY = startY + child._localY_tl + h / 2;
            }
            
            return { width: totalWidth, height: totalHeight };
        };

        for (const root of roots) {
            layoutBottomUp(root);
        }

        const applyTopDown = (cluster, dx, dy) => {
            const size = clusterBounds.get(cluster.id);
            if (size) {
                cluster._absCX = dx;
                cluster._absCY = dy;
                cluster._absWidth = size.width;
                cluster._absHeight = size.height;
            }

            const oldX = cluster.position ? cluster.position.x : 0;
            const oldY = cluster.position ? cluster.position.y : 0;
            const absX = dx;
            const absY = dy;
            
            if (!cluster.position) cluster.position = { x: absX, y: absY };
            else {
                cluster.position.x = absX;
                cluster.position.y = absY;
            }

            const directNodes = nodesByCluster.get(cluster.id) || [];
            const children = childrenMap.get(cluster.id) || [];
            
            console.log("PACK", cluster.id, "cluster CX", cluster._currentCX, "CY", cluster._currentCY, "targetCX", cluster._localTargetCX, "targetCY", cluster._localTargetCY);
            console.log(cluster.id, "directNodes", directNodes.length, "children", children.length);

            if (directNodes.length > 0) {
                const targetCX = absX + (cluster._localTargetCX || 0);
                const targetCY = absY + (cluster._localTargetCY || 0);
                
                const nodeCount = directNodes.length;
                const nCols = Math.max(1, Math.ceil(Math.sqrt(nodeCount)));
                
                // 120 and 80 are the grid cell sizes used in wNodes/hNodes
                const gridW = nCols * 120;
                const gridH = Math.ceil(nodeCount / nCols) * 80;
                const startX = targetCX - gridW / 2 + 60; // 60 is half cell width
                const startY = targetCY - gridH / 2 + 40; // 40 is half cell height
                
                console.log("CONTENT_ORIGIN", cluster.id, "startX", startX, "startY", startY, "targetCX", targetCX, "targetCY", targetCY);
                
                let i = 0;
                for (const n of directNodes) {
                    if (!n.position) n.position = { x: 0, y: 0 };
                    n.position.x = startX + (i % nCols) * 120;
                    n.position.y = startY + Math.floor(i / nCols) * 80;
                    
                    if (i === 0) {
                        console.log("FIRST_PACKED_NODE", n.id, n.position.x, n.position.y);
                    }
                    i++;
                }
                console.log(cluster.id, "PACK_APPLIED", i, "nodes");
            }

            if (children.length > 0) {
                for (const child of children) {
                    applyTopDown(child, absX + (child._localX || 0), absY + (child._localY || 0));
                }
            }
        };

        const count = roots.length;
        console.log("ROOTS", count);
        for (const root of roots) {
            const children = childrenMap.get(root.id) || [];
            console.log(root.id, "children:", children.length);
        }
        let totalRootArea = 0;
        for (const root of roots) {
            const size = clusterBounds.get(root.id);
            totalRootArea += (size.width + 400) * (size.height + 400);
        }
        const targetRootWidth = Math.max(1000, Math.ceil(Math.sqrt(totalRootArea) * 1.5));
        
        let rootX = 0, rootY = 0, rootRowH = 0, maxRootRowW = 0;
        for (const root of roots) {
            const size = clusterBounds.get(root.id);
            const w = size.width + 400;
            const h = size.height + 400;
            
            if (rootX + w > targetRootWidth && rootX > 0) {
                rootX = 0; rootY += rootRowH; rootRowH = 0;
            }
            root._localX_tl = rootX;
            root._localY_tl = rootY;
            rootX += w;
            if (h > rootRowH) rootRowH = h;
            if (rootX > maxRootRowW) maxRootRowW = rootX;
        }
        rootY += rootRowH;
        
        const totalGridW = maxRootRowW;
        const totalGridH = rootY;
        const startX = -totalGridW / 2;
        const startY = -totalGridH / 2;
        
        for (const root of roots) {
            const size = clusterBounds.get(root.id);
            const w = size.width + 400;
            const h = size.height + 400;
            const cx = startX + root._localX_tl + w / 2;
            const cy = startY + root._localY_tl + h / 2;
            applyTopDown(root, cx, cy);
        }
        
        console.log('[SYNAPSE][distributeClustersHierarchically] Completed Hierarchical Grid.');

        let gMinX = Infinity, gMaxX = -Infinity, gMinY = Infinity, gMaxY = -Infinity;
        for (const node of this.nodes) {
            if (node.position) {
                if (node.position.x < gMinX) gMinX = node.position.x;
                if (node.position.x > gMaxX) gMaxX = node.position.x;
                if (node.position.y < gMinY) gMinY = node.position.y;
                if (node.position.y > gMaxY) gMaxY = node.position.y;
            }
        }
        console.log("NODE_BOUNDS", gMinX, gMaxX, gMinY, gMaxY);
        
        for (const cluster of this.clusters.slice(0, 20)) {
            let cx = 0, cy = 0;
            const directNodes = nodesByCluster.get(cluster.id) || [];
            if (directNodes.length > 0) {
                let cmx = Infinity, cmxx = -Infinity, cmy = Infinity, cmyy = -Infinity;
                for (const n of directNodes) {
                    if (n.position) {
                        if (n.position.x < cmx) cmx = n.position.x;
                        if (n.position.x > cmxx) cmxx = n.position.x;
                        if (n.position.y < cmy) cmy = n.position.y;
                        if (n.position.y > cmyy) cmyy = n.position.y;
                    }
                }
                cx = (cmx + cmxx) / 2;
                cy = (cmy + cmyy) / 2;
            }
            const bounds = clusterBounds.get(cluster.id);
            console.log("CLUSTER_BOUNDS", cluster.id, cx, cy, bounds ? bounds.width : 0, bounds ? bounds.height : 0);
        }

        if (this.nodes.length > 0) {
            console.log("FIRST_NODE", this.nodes[0].id, this.nodes[0].position?.x, this.nodes[0].position?.y);
        }
        if (this.clusters.length > 0) {
            const cluster = this.clusters[0];
            const size = clusterBounds.get(cluster.id);
            console.log("FIRST_CLUSTER", cluster.id, cluster.cx, cluster.cy, "width:", size ? size.width : 0, "height:", size ? size.height : 0);
        }
    }


    // [v0.3.34] Cluster-level overlap resolution using Spatial Grid (O(N) Push-Apart)
    resolveClusterOverlaps() {
        const USE_HIERARCHICAL_GRID = true;
        if (USE_HIERARCHICAL_GRID) return; // Legacy Disabled

        if (!this.clusters || this.clusters.length < 2) return;
        const PADDING = 20; 
        const ITERATIONS = 30;
        const CELL_SIZE = 4000; // Spatial Grid cell size

        console.log('[SYNAPSE][resolveClusterOverlaps] Starting O(N) Spatial Grid Overlap Resolution...');

        // [Performance Fix] Pre-compute nodes by cluster BEFORE the iteration loop
        const nodesByCluster = new Map();
        for (const n of this.nodes) {
            const cid = n.cluster_id || (n.data && n.data.cluster_id);
            if (!cid) continue;
            let arr = nodesByCluster.get(cid);
            if (!arr) {
                arr = [];
                nodesByCluster.set(cid, arr);
            }
            arr.push(n);
        }

        // [v0.3.33.1] Golden Spiral Seed is removed here. Hierarchical Grid Distribution is now responsible for initial separation.
        // Golden Spiral is reserved ONLY as an escape route for zero-distance overlaps (dist < 0.001) in the relaxation phase.

        for (let iter = 0; iter < ITERATIONS; iter++) {
            const bounds = new Map();
            const centroids = new Map();
            const grid = new Map();

            // 1. Build Grid
            for (const cluster of this.clusters) {
                const nodes = nodesByCluster.get(cluster.id) || [];
                if (nodes.length === 0) continue;
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                let cx = 0, cy = 0;
                for (const node of nodes) {
                    if (!node.position) continue;
                    const px = node.position.x;
                    const py = node.position.y;
                    if (px < minX) minX = px;
                    if (py < minY) minY = py;
                    if (px + 120 > maxX) maxX = px + 120;
                    if (py + 60 > maxY) maxY = py + 60;
                    cx += px;
                    cy += py;
                }
                
                if (minX === Infinity) continue; // FIX: Prevent NaN bounds from collapsing into 'NaN,NaN' cell

                // [v0.3.33.1] Dynamic Padding
                const diag = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2));
                const dynamicPadding = Math.max(100, diag * 0.15); // Scale padding with cluster size

                const b = {
                    id: cluster.id,
                    minX: minX - dynamicPadding, minY: minY - dynamicPadding,
                    maxX: maxX + dynamicPadding, maxY: maxY + dynamicPadding,
                    mass: nodes.length + 1
                };
                bounds.set(cluster.id, b);
                centroids.set(cluster.id, { x: cx / nodes.length, y: cy / nodes.length });
                
                // Add to spatial grid (based on centroid)
                const gridX = Math.floor((b.minX + b.maxX) / 2 / CELL_SIZE);
                const gridY = Math.floor((b.minY + b.maxY) / 2 / CELL_SIZE);
                const cellKey = `${gridX},${gridY}`;
                if (!grid.has(cellKey)) grid.set(cellKey, []);
                grid.get(cellKey).push(cluster.id);
            }

            let moved = false;
            const ids = Array.from(bounds.keys());
            
            // 2. Query neighbors and resolve overlaps
            for (const idA of ids) {
                const bA = bounds.get(idA);
                
                const cx = Math.floor((bA.minX + bA.maxX) / 2 / CELL_SIZE);
                const cy = Math.floor((bA.minY + bA.maxY) / 2 / CELL_SIZE);
                
                const neighborIds = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const cell = grid.get(`${cx + dx},${cy + dy}`);
                        if (cell) neighborIds.push(...cell);
                    }
                }
                
                for (const idB of neighborIds) {
                    if (idA >= idB) continue; // Prevent double checking and self checking
                    
                    // [v0.3.33.2 Fix] Prevent Ancestor-Descendant Collision!
                    // Parent and child clusters SHOULD overlap. Pushing them apart rips the graph apart.
                    if (this.clusterHierarchy) {
                        const ancestorsA = this.clusterHierarchy.getAncestors(idA);
                        if (ancestorsA.some(anc => anc.id === idB)) continue; // idB is ancestor of idA
                        const ancestorsB = this.clusterHierarchy.getAncestors(idB);
                        if (ancestorsB.some(anc => anc.id === idA)) continue; // idA is ancestor of idB
                    }

                    const bB = bounds.get(idB);
                    if (!bA || !bB) continue;

                    const overlapX = Math.min(bA.maxX, bB.maxX) - Math.max(bA.minX, bB.minX);
                    const overlapY = Math.min(bA.maxY, bB.maxY) - Math.max(bA.minY, bB.minY);
                    if (overlapX <= 0 || overlapY <= 0) continue;

                    moved = true;

                    // Sign Guard: direction from centroid delta
                    const cA = centroids.get(idA), cB = centroids.get(idB);
                    let dx = cB.x - cA.x, dy = cB.y - cA.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Zero-Divide Guard (Deterministic Direction)
                    if (dist < 0.001) { 
                        // If they perfectly overlap, use a deterministic angle derived from their IDs
                        let hash = 0;
                        const combinedId = idA + idB;
                        for (let i = 0; i < combinedId.length; i++) {
                            hash = Math.imul(31, hash) + combinedId.charCodeAt(i) | 0;
                        }
                        const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
                        dx = Math.cos(angle); 
                        dy = Math.sin(angle); 
                    }

                    const totalMass = bA.mass + bB.mass;
                    
                    // [v0.3.33.1] Iterative Relaxation: Early iterations push harder, later ones stabilize
                    const relaxation = 1.0 - (iter / ITERATIONS) * 0.5; 
                    const pushA = (bB.mass / totalMass) * relaxation;
                    const pushB = (bA.mass / totalMass) * relaxation;

                    let pushX = 0, pushY = 0;
                    if (overlapX < overlapY) { pushX = overlapX * 0.8 + 20; }
                    else { pushY = overlapY * 0.8 + 20; }

                    const MAX_PUSH = 10000; // Increased to allow clusters to escape
                    if (Math.abs(pushX) > MAX_PUSH) pushX = Math.sign(pushX) * MAX_PUSH;
                    if (Math.abs(pushY) > MAX_PUSH) pushY = Math.sign(pushY) * MAX_PUSH;

                    const sX = dx >= 0 ? 1 : -1;
                    const sY = dy >= 0 ? 1 : -1;

                    const aNodes = nodesByCluster.get(idA) || [];
                    const bNodes = nodesByCluster.get(idB) || [];

                    for (const node of aNodes) {
                        if (!node.position) continue;
                        node.position.x -= pushX * pushA * sX;
                        node.position.y -= pushY * pushA * sY;
                    }
                    for (const node of bNodes) {
                        if (!node.position) continue;
                        node.position.x += pushX * pushB * sX;
                        node.position.y += pushY * pushB * sY;
                    }

                    const saX = pushX * pushA * sX, saY = pushY * pushA * sY;
                    const sbX = pushX * pushB * sX, sbY = pushY * pushB * sY;
                    bA.minX -= saX; bA.maxX -= saX;
                    bA.minY -= saY; bA.maxY -= saY;
                    bB.minX += sbX; bB.maxX += sbX;
                    bB.minY += sbY; bB.maxY += sbY;

                    cA.x -= saX; cA.y -= saY;
                    cB.x += sbX; cB.y += sbY;
                }
            }
            if (!moved) break;
        }
        
        // Recompute final cluster bounds so rendering is correct
        this._lastComputedBounds = new Map();
        for (const cluster of this.clusters) {
            this.computeClusterBounds(cluster);
        }

        console.log('[SYNAPSE][resolveClusterOverlaps] Completed.');
    }
}

// 초기화
var engine;

function initCanvas() {
    if (engine) return;

    // index.html의 <canvas id="canvas">와 일치해야 함
    engine = new CanvasEngine('canvas');
    window.engine = engine; // [v0.2.25] Expose to global for button clicks
    self.engine = engine;
    globalThis.engine = engine;
    console.log('[SYNAPSE] Engine initialized:', engine);

    // Failsafe: Remove loading overlay after 3 seconds no matter what
    setTimeout(() => {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            console.warn('[SYNAPSE] Force removing loading overlay via timeout');
            loadingEl.remove();
        }
    }, 3000);

    // DEBUG: Global Input Logger
    window.addEventListener('mousedown', (e) => {

        if (engine) {
            engine.lastInputTime = Date.now();
            engine.render(); // Force render to update debug info
        }
    }, true); // Capture phase

    // VS Code API 연동 확인
    if (typeof acquireVsCodeApi !== 'undefined' && typeof window.vscode === 'undefined') {
        window.vscode = acquireVsCodeApi();
    }

    // [v0.2.25] 메시지 처리 통합 및 핸들러 등록
    engine.handleMessage = (message) => {
        if (!message) return;
        console.log('[SYNAPSE] Processing incoming message:', message.command);

        switch (message.command) {
            case 'validationProgress': {
                const loadingText = document.getElementById('loading-text');
                if (loadingText) loadingText.textContent = `검증 중 ${message.progress}%...`;
                break;
            }
            case 'projectStateChunkStart': {
                engine._chunkedNodes = [];
                engine._chunkedEdges = [];
                break;
            }
            case 'projectStateNodesChunk': {
                if (engine._chunkedNodes && message.data) {
                    engine._chunkedNodes.push(...message.data);
                }
                break;
            }
            case 'projectStateEdgesChunk': {
                if (engine._chunkedEdges && message.data) {
                    engine._chunkedEdges.push(...message.data);
                }
                break;
            }
            case 'projectStateChunkEnd': {
                if (message.data) {
                    message.data.nodes = engine._chunkedNodes || [];
                    message.data.edges = engine._chunkedEdges || [];
                    console.log('[CHUNK_END_NODES]', engine._chunkedNodes?.length ?? 0);
                    engine._chunkedNodes = null;
                    engine._chunkedEdges = null;
                    
                    if (message.data._ipcTimestamp) {
                        const transferTime = Date.now() - message.data._ipcTimestamp;
                        console.log(`[PERF] IPCTransferTimeMs: ${transferTime}ms`);
                    }
                }
                // Re-route to projectState
                message.command = 'projectState';
                engine.handleMessage(message);
                break;
            }
            case 'projectStateData':
            case 'projectState': {
                if (message.state) {
                    message.data = message.state; // normalize for logic below
                }
                if (message.data && message.data.project_name) {
                    engine.projectName = message.data.project_name;
                    console.log(`[SYNAPSE] Project Name Synchronized: ${engine.projectName}`);
                }
                if (message.workspaceFolder) {
                    engine.workspaceFolder = message.workspaceFolder;
                }
                
                // [v0.3.11] Authoritative Sync: Direct user actions bypass interaction lock
                if (message.isAuthoritative) {
                    console.log('[SYNAPSE] Authoritative projectState received. Bypassing interaction lock.');
                    if (message.data) message.data._msgReceiveT = performance.now(); // [v0.3.33 Phase 0]
                    engine.loadProjectState(message.data, true);
                    engine.updateNodeStats(); // [v0.3.22.9] Force stats update for tooltips
                    engine._pendingState = null;
                    // [v0.3.32.4] Refresh cluster visibility panel if open
                    if (document.getElementById('cluster-visibility-panel')?.classList.contains('visible')) engine.renderClusterVisibilityPanel(''); // Clear any stale deferred updates
                    return;
                }

                if (engine.isDragging || engine._isInteracting) {
                    engine._pendingState = message.data;
                    return;
                }
                
                // [v0.3.22.11] Race Condition Protection: 
                // If a save happened very recently (within 500ms), we assume any incoming 
                // non-authoritative state might be a stale result from a scan that started before the save.
                const isFreshSaveResponse = (Date.now() - (engine._lastSaveTime || 0)) < 500;
                const preserve = isFreshSaveResponse || (!message.forceReset && engine.nodes && engine.nodes.length > 0);
                
                if (message.data) message.data._msgReceiveT = performance.now(); // [v0.3.33 Phase 0]
                engine.loadProjectState(message.data, preserve);
                engine.updateNodeStats(); // [v0.3.22.9] Force stats update for tooltips
                engine.isExpectingUpdate = false;
                // [v0.3.32.4] Refresh cluster visibility panel if open
                if (document.getElementById('cluster-visibility-panel')?.classList.contains('visible')) engine.renderClusterVisibilityPanel('');
                
                // [v0.3.10] Auto-Start Engine Loop upon first state arrival
                if (!engine._loopRunning) {
                    engine.startLoop();
                }
                // Dismiss loading overlay
                const loader = document.getElementById('loading');
                if (loader) loader.style.display = 'none';
                break;
            }
            case 'clientLayerUpdate': {
                if (message.layers && message.layers.length > 0) {
                    const now = Date.now();
                    // _connectedUserIds 자동 생성/갱신
                    if (!window._connectedUserIds) {
                        window._connectedUserIds = new Set();
                    }
                    for (const layer of message.layers) {
                        window._connectedUserIds.add(layer.clientId);
                        if (!engine.clientLayers[layer.clientId]) {
                            const order = Object.keys(engine.clientLayers).length;
                            engine.clientLayers[layer.clientId] = { visible: true, order, username: layer.username || '', lastActive: now };
                        } else {
                            if (layer.username) engine.clientLayers[layer.clientId].username = layer.username;
                            engine.clientLayers[layer.clientId].lastActive = now;
                        }
                    }
                    engine._updateClientLayerUI();
                    engine.isDirty = true;
                    engine.requestRender();
                }
                break;
            }
            case 'connectedClientsResult': {
                if (message.clients) {
                    window._connectedUserIds = new Set(
                        message.clients.map(function(c) { return c.userId; })
                    );
                    message.clients.forEach(c => {
                        engine.registerClientLayer(c.userId, c.username);
                    });
                    engine._updateClientLayerUI();
                }
                break;
            }
            case 'resetCanvas': {
                engine.nodes = [];
                engine.edges = [];
                engine.clusters = [];
                engine.selectedNodes = new Set();
                engine.selectedEdge = null;
                engine.transform = { zoom: 1.0, offsetX: 0, offsetY: 0 };
                engine.updateZoomDisplay();
                const nodeCountEl = document.getElementById('node-count');
                const edgeCountEl = document.getElementById('edge-count');
                if (nodeCountEl) nodeCountEl.textContent = '0';
                if (edgeCountEl) edgeCountEl.textContent = '0';
                engine.isDirty = true;
                engine.render();
                console.log('[SYNAPSE] RESET_CANVAS received. Canvas cleared.');
                break;
            }
            case 'clearCanvas': {
                // [v0.3.09_fix] Rendering Isolation - Wipe buffers on Phase transitions
                if (engine.webglEnabled && engine.webglRenderer) {
                    engine.webglRenderer.clear();
                }
                if (engine.ctx && engine.canvas) {
                    engine.ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
                }
                console.log('[SYNAPSE] clearCanvas message received. WebGL/2D buffers safely wiped.');
                break;
            }
            case 'analysisProgress': {
                const loadingText = document.querySelector('#loading div:not(.spinner)');
                if (loadingText) {
                    loadingText.textContent = message.message || '프로젝트 분석 중...';
                }
                break;
            }
            case 'projectProposal':
                engine.loadProjectState(message.data);
                engine.fitView();
                break;
            case 'history':
                engine.updateHistoryUI(message.data);
                break;
            case 'rollbackComplete':
                // [v0.3.11 FIX] getProjectState() 재호출 제거
                // 백엔드가 이미 forceReset:true로 롤백 데이터를 전송했으므로
                // 여기서 재호출하면 현재 디스크 상태(롤백 전)로 덮어씌워짐
                engine.requestRender();
                break;
            case 'fitView':
                engine.fitView();
                engine.isDirty = true;
                engine.requestRender();
                break;
            case 'updateNode': {
                const node = engine.nodes.find(n => n.id === message.data.id);
                if (node) {
                    Object.assign(node, message.data.updates);
                    if (message.data.updates.data) {
                       node.data = { ...(node.data || {}), ...message.data.updates.data };
                    }
                    // [v0.3.10-LOCK] Guarantee file availability for clicks
                    if (message.data.updates.file) {
                        node.file = message.data.updates.file;
                        if (!node.data) node.data = {};
                        node.data.file = message.data.updates.file;
                    }
                    
                    // [v0.3.10] Auto-Cluster Migration: Jump to target cluster instantly
                    const targetClusterId = message.data.updates.cluster_id || (node.data && node.data.cluster_id);
                    if (targetClusterId) {
                        node.cluster_id = targetClusterId;
                        if (engine.addToCluster) {
                            engine.addToCluster(node.id, targetClusterId);
                        }
                    }

                    console.log(`[SYNAPSE] UI Node updated: ${node.id} -> ${targetClusterId}`, message.data.updates);
                    // [v0.3.34] Fix Heatmap Ghost Cache Bug: Rebuild LOD hierarchy
                    if (engine.initLODState) {
                        engine.initLODState();
                    }
                    engine.isGraphDataDirty = true; // [v0.3.34] Cache invalidation on mutation
                    engine.isDirty = true;
                    engine.render();
                }
                break;
            }
            case 'focusNode':
                if (engine.focusNodeInGraph) {
                    engine.focusNodeInGraph(message.nodeId);
                }
                break;
            case 'edgeConfirmed': {
                const edge = engine.edges.find(e => e.id === message.edgeId);
                if (edge) {
                    edge.status = 'confirmed';
                    engine.render();
                }
                break;
            }
            case 'edgeDeletedSource':
                if (message.success) {
                    const edgeIdx = engine.edges.findIndex(e => e.id === message.edgeId);
                    if (edgeIdx !== -1) {
                        engine.edges.splice(edgeIdx, 1);
                        engine.selectedEdge = null;

                        // [v0.2.17] Refresh flowchart on deletion
                        if (engine.flowRenderer) {
                            engine.flowData = engine.flowRenderer.buildFlow(engine.nodes) || { steps: [] };
                        }

                        engine.isGraphDataDirty = true; // [v0.3.34] Invalidate cache on edge deletion
                        engine.saveState();
                        engine.isDirty = true;
                        engine.render();
                    }
                }
                break;
            case 'dtrChanged':
                engine.handleDTRChange(message.value);
                break;
            case 'setBaseline':
                engine.baselineNodes = message.data.nodes;
                engine.render();
                break;
            case 'requestContext':
                engine.sendContextData();
                break;
            case 'clearBaseline':
                engine.baselineNodes = null;
                engine.render();
                break;
            case 'recordingState': {
                // REC 버튼 시각적 상태 동기화
                const recBtn = document.getElementById('btn-record');
                if (recBtn) {
                    if (message.isRecording) {
                        recBtn.classList.add('recording');
                        recBtn.textContent = '⏹ STOP';
                        recBtn.title = '레코딩 중... (클릭하여 저장)';
                    } else {
                        recBtn.classList.remove('recording');
                        recBtn.textContent = '⏺ REC';
                        recBtn.title = 'Context 레코딩 토글 (CTRL+ALT+M)';
                    }
                }
                break;
            }
            case 'edgeValidationResult':
                engine.updateEdgeValidation(message.edgeId, message.result);
                break;
            case 'edgeValidationResultsBatch': // [v0.2.24] Batched Response Handling
                if (message.results && Array.isArray(message.results)) {
                    console.log(`[SYNAPSE] Applying batched validation for ${message.results.length} edges...`);
                    message.results.forEach(res => {
                        engine.updateEdgeValidation(res.edgeId, res.result);
                    });
                    
                    // [v0.3.21.3] Authoritative Render Trigger
                    engine.isDirty = true;
                    engine.isEdgeDirty = true;
                    engine.render();
                }
                break;
            case 'analysisResults':
                console.time('analysisResults');
                console.log('[ANALYSIS]', 'issues=', message.issues?.length || 0, 'edges=', engine.edges.length);
                engine.isTestingLogic = false;
                engine.analysisIssues = message.issues;

                // [v0.2.20 Visual Impact] 초기화: 기존 상태 제거
                engine.nodes.forEach(n => {
                    delete n.status;
                    n.isError = false;
                    n.isDeadEnd = false;
                    n.isBottleneck = false;
                    n.isIsolated = false;
                });
                engine.edges.forEach(e => {
                    e.isCircular = false;
                    if (e.type === 'broken_fracture') e.type = 'dependency';
                });

                // 시스템 압박도 계산 (이슈 개수에 비례)
                engine.systemPressure = Math.min(1.0, (message.issues?.length || 0) * 0.15);
                engine.isRedOut = engine.systemPressure > 0.7;

                // 이슈를 노드/엣지에 매핑
                if (message.issues) {
                    message.issues.forEach(issue => {
                        issue.nodeIds.forEach(nodeId => {
                            const node = engine.nodes.find(n => n.id === nodeId);
                            if (node) {
                                // [v0.2.21] 결정론적 위반 → Tombstone
                                if (issue.message && issue.message.includes('Tombstone')) {
                                    node.status = 'error_tombstone';
                                    // Store issues on node for dblclick display
                                    if (!node.data.issues) node.data.issues = [];
                                    node.data.issues.push(issue.message);
                                } else if (issue.type === 'circular' || issue.type === 'schema-violation') {
                                    // 순환/스키마 위반 → 괴사(Necrosis)
                                    node.isError = true;
                                    node.status = 'error_necrosis';
                                } else if (issue.type === 'architecture-violation') {
                                    // 아키텍처 위반 → 경고 상태 (Ghost Jitter 발동)
                                    node.isArchViolation = true;
                                }
                                if (issue.type === 'dead-end') node.isDeadEnd = true;
                                if (issue.type === 'bottleneck') node.isBottleneck = true;
                                if (issue.type === 'isolated') node.isIsolated = true;
                            }

                            // 심각한 구조적 결함은 '엣지 파손(Fracture)'으로 표현
                            if (issue.type === 'circular' || issue.type === 'schema-violation') {
                                engine.edges.forEach(e => {
                                    if (issue.nodeIds.includes(e.from) && issue.nodeIds.includes(e.to)) {
                                        e.isCircular = true;
                                        e.type = 'broken_fracture';
                                    }
                                });
                            }
                            // [v0.2.21] 결정론적 위반 노드의 출력 엣지도 Fracture
                            if (issue.message && issue.message.includes('Tombstone')) {
                                engine.edges.forEach(e => {
                                    if (e.from === nodeId) {
                                        e.isDeterministicFracture = true;
                                    }
                                });
                            }
                        });
                    });
                }

                console.timeEnd('analysisResults');
                engine.render();
                break;
            case 'virtualDebugImpact': {
                // [v0.2.21 Fix] Apply VirtualDebugger results to visual state
                const impact = message.impact;
                if (!impact) break;

                // [Fix B4] Safe Reset: only reset VD-specific flags, don't stomp LogicAnalyzer state
                engine.nodes.forEach(n => {
                    // Only clear states that were set by a previous VD run
                    if (n.isVirtualDebugError) {
                        n.isVirtualDebugError = false;
                        // Restore status if it was VD-set (not from logic analyzer)
                        if (n.status === 'error_necrosis' && !n._logicAnalyzerError) {
                            n.status = undefined;
                        }
                    }
                });
                engine.edges.forEach(e => {
                    if (e.isVirtualDebugFracture) {
                        e.isVirtualDebugFracture = false;
                        e.isDeterministicFracture = false;
                    }
                });

                // Apply necrosis + cyan scanner aura to VS Code error nodes
                impact.necrosisNodeIds.forEach(nid => {
                    const node = engine.nodes.find(n => n.id === nid);
                    if (node) {
                        node.status = 'error_necrosis';
                        node.isVirtualDebugError = true;
                    }
                });

                // [Fix B2] Apply VD Fracture (Ghost Purple) to broken edges
                impact.fractureEdgeIds.forEach(eid => {
                    const edge = engine.edges.find(e => e.id === eid);
                    if (edge) {
                        edge.isVirtualDebugFracture = true;
                        edge.isDeterministicFracture = true; // Reuse Ghost Purple fracture path
                    }
                });

                // System pressure = ratio of necrotic nodes
                const pressureRatio = engine.nodes.length > 0
                    ? impact.necrosisNodeIds.length / engine.nodes.length
                    : 0;
                engine.systemPressure = Math.min(1.0, pressureRatio * 3.0);
                engine.isRedOut = engine.systemPressure > 0.7;

                // [Fix B3] Virtual Debug HUD: Result summary toast
                const necroCount = impact.necrosisNodeIds.length;
                const fractureCount = impact.fractureEdgeIds.length;
                const errorCount = (impact.reports || []).filter(r => r.severity === 0).length; // 0 = Error
                const warnCount = (impact.reports || []).filter(r => r.severity === 1).length;  // 1 = Warning
                engine._showVirtualDebugHUD({
                    necroCount,
                    fractureCount,
                    errorCount,
                    warnCount,
                    pressure: Math.round(engine.systemPressure * 100)
                });

                engine.wakeUp();
                engine.render();
                console.log(`[SYNAPSE] Virtual Debug Impact applied: ${necroCount} necrotic, ${fractureCount} fractured.`);
                break;
            }
            case 'flowData':
                engine.flowData = message.data;
                if (engine.flowData) engine.flowData.type = 'internal'; // [New] Mark as internal
                engine.currentMode = 'flow';
                document.getElementById('loading').style.display = 'none';
                engine.render();

                // Update UI buttons for flow mode
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-mode="flow"]')?.classList.add('active');
                document.getElementById('current-mode').textContent = 'Flow';
                break;
            case 'toggleSearch':
                this.toggleSearchShelf();
                break;
            case 'focusNode':
                engine.focusNodeInGraph(message.nodeId);
                break;
        }
    };

    // [v0.3.15] Documentation Shelf Shortcut (fzf-style)
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            engine.toggleSearchShelf();
        }
        if (e.key === 'Escape') {
            const panel = document.getElementById('docs-shelf-panel');
            if (panel && panel.classList.contains('visible')) {
                panel.classList.remove('visible');
                engine.render();
            }
        }
    });

    // [v0.3.15] Toggle Search Shelf Method
    engine.toggleSearchShelf = () => {
        const panel = document.getElementById('docs-shelf-panel');
        if (!panel) return;
        
        const isVisible = panel.classList.contains('visible');
        if (isVisible) {
            panel.classList.remove('visible');
        } else {
            panel.classList.add('visible');
            engine.renderDocShelfList(''); // Initial full list
            const searchInput = document.getElementById('docs-search-input');
            if (searchInput) {
                searchInput.value = '';
                setTimeout(() => searchInput.focus(), 100);
            }
        }
        engine.render();
    };

    // [v0.2.25] 버퍼링된 메시지 즉시 처리 (Flush message queue)
    if (window._synapseMessageQueue && window._synapseMessageQueue.length > 0) {
        console.log(`[SYNAPSE] Draining ${window._synapseMessageQueue.length} buffered messages...`);
        while (window._synapseMessageQueue.length > 0) {
            engine.handleMessage(window._synapseMessageQueue.shift());
        }
    }
    // [v0.3.34 FIX] Removed engine.getProjectState() to prevent redundant startup rebuilds.
    engine.refreshClientLayersFromAccounts();

    // Toolbar Event Listeners
    document.getElementById('btn-fit')?.addEventListener('click', () => {
        engine.fitView();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
        engine.transform = { zoom: 1.0, offsetX: 0, offsetY: 0 };
        engine.updateZoomDisplay();
        engine.isDirty = true;
        engine.requestRender();
    });

    document.querySelectorAll('#strategy-menu .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#strategy-menu .btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const strategy = e.target.getAttribute('data-strategy');
            
            engine.viewStrategy = strategy;
            if (engine.lastFrameState && engine.lastFrameState.raw) {
                // 재배치 시 MaterializationPolicy 적용
                engine.loadProjectState(engine.lastFrameState.raw, true);
                engine.fitView();
            }
        });
    });

    document.getElementById('btn-rebootstrap')?.addEventListener('click', () => {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'reBootstrap' });
        } else {
            alert('Deep Reset is only available in VS Code mode.');
        }
    });

    document.getElementById('btn-reset-state')?.addEventListener('click', () => {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'resetProjectState' });
        }
    });

    document.getElementById('btn-group')?.addEventListener('click', () => {
        engine.groupSelection();
    });

    document.getElementById('btn-ungroup')?.addEventListener('click', () => {
        engine.ungroupSelection();
    });

    // [v0.3.32.4] Cluster Visibility Panel events
    document.getElementById('btn-cluster-vis')?.addEventListener('click', () => {
        const panel = document.getElementById('cluster-visibility-panel');
        if (!panel) return;
        const isVisible = panel.classList.toggle('visible');
        if (isVisible) engine.renderClusterVisibilityPanel('');
    });
    document.getElementById('cluster-vis-close')?.addEventListener('click', () => {
        document.getElementById('cluster-visibility-panel')?.classList.remove('visible');
    });
    document.getElementById('cluster-vis-search')?.addEventListener('input', (e) => {
        engine.renderClusterVisibilityPanel(e.target.value);
    });
    document.getElementById('btn-cluster-collapse-all')?.addEventListener('click', () => {
        engine.collapseAllClusters();
    });
    document.getElementById('btn-cluster-expand-roots')?.addEventListener('click', () => {
        engine.expandRootsOnly();
    });
    document.getElementById('btn-cluster-expand-all')?.addEventListener('click', () => {
        engine.expandAllClusters();
    });

    document.getElementById('btn-snapshot')?.addEventListener('click', () => {
        // Request UI from backend (VS Code InputBox)
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'requestSnapshot' });
        }
    });

    document.getElementById('btn-history')?.addEventListener('click', () => {
        engine.getHistory();
        const panel = document.getElementById('history-panel');
        if (panel) panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });

    document.getElementById('history-panel-close')?.addEventListener('click', () => {
        const panel = document.getElementById('history-panel');
        if (panel) panel.style.display = 'none';
    });

    document.getElementById('side-panel-close')?.addEventListener('click', () => {
        document.getElementById('side-panel')?.classList.remove('visible');
    });

    // [v0.2.20 Fix] Duplicate btn-animate listener removed.
    // The correct handler is in index.html DOMContentLoaded → calls engine.toggleAnimation()

    // Protocol & Context Listeners
    document.getElementById('btn-master-hub')?.addEventListener('click', () => {
        engine.handleOpenFile('architecture.md');
    });

    document.getElementById('btn-modular-specs')?.addEventListener('click', () => {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'openModularSpecs' });
        }
    });

    document.getElementById('btn-rules')?.addEventListener('click', () => {
        vscode?.postMessage({ command: 'openRules' });
    });


    document.getElementById('btn-record')?.addEventListener('click', () => {
        // Toggle recording state
        engine.isRecording = !engine.isRecording;
        const btn = document.getElementById('btn-record-label');
        if (btn) {
            btn.textContent = engine.isRecording ? '🔴 Recording' : '⏺ Context';
            btn.style.color = engine.isRecording ? '#fb4934' : '';
        }
        vscode?.postMessage({ command: 'showMessage', text: `Context Recording: ${engine.isRecording ? 'STARTED' : 'STOPPED'}` });
    });

    // Mode Switcher
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;

            // Update UI
            document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('current-mode').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

            // Switch Mode
            engine.currentMode = mode;
            engine.canvas.dataset.mode = mode; // Ensure WebGL isolation condition checks match mode
            engine.canvas2d.dataset.mode = mode; // Fix: WebGL checks this canvas dataset!
            console.log('[SYNAPSE] Switched to mode:', mode);

            // [v0.3.09] Rule 8. [Rendering Isolation] 강제 WebGL 초기화 (Force flush WebGL state during view transition)
            if (engine.webglRenderer) {
                try {
                    engine.webglRenderer.drawCalls = 0;
                    if (mode !== 'graph') {
                        engine.webglRenderer.endFrame(); // Ensure clean state when switching away
                        engine.webglRenderer.clear(); // [v0.3.09_fix] Force wipe on view transition
                    } else {
                        // Switching back to graph mode, force full buffer rebuild
                        engine.webglRenderer.charCount = 0; // Force text rebuild
                        engine.webglRenderer.lastEdgeCount = -1; // Force edge rebuild
                        engine.webglRenderer.isDataDirty = true;
                    }
                } catch (e) {
                    console.error('[SYNAPSE] WebGL isolation reset failed:', e);
                }
            }

            // Rebuild tree if needed
            if (mode === 'tree') {
                engine.treeData = engine.treeRenderer.buildTree(engine.nodes);
            }
            if (mode === 'flow') {
                engine.flowData = engine.flowRenderer.buildFlow(engine.nodes);
            }

            engine.render();
        });
    });

    // [v0.3.10 Fix] Redundant listener removed (merged into main loop at line 2442)

    // [v0.2.20] Make DTR Controller draggable
    const dtrController = document.getElementById('dtr-controller');
    if (dtrController) {
        let isDraggingDtr = false;
        let dtrDragStartX, dtrDragStartY;

        dtrController.addEventListener('mousedown', (e) => {
            // Only allow dragging from the header area to not break slider interaction
            if (e.target.closest('.dtr-header') || e.target === dtrController) {
                isDraggingDtr = true;
                dtrDragStartX = e.clientX - dtrController.offsetLeft;
                dtrDragStartY = e.clientY - dtrController.offsetTop;
                dtrController.style.cursor = 'grabbing';
                // Remove bottom/right positioning to allow arbitrary top/left movement
                dtrController.style.bottom = 'auto';
                dtrController.style.right = 'auto';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDraggingDtr) return;
            e.preventDefault();

            // Constrain to window bounds
            let newX = e.clientX - dtrDragStartX;
            let newY = e.clientY - dtrDragStartY;

            const maxX = window.innerWidth - dtrController.offsetWidth;
            const maxY = window.innerHeight - dtrController.offsetHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            dtrController.style.left = `${newX}px`;
            dtrController.style.top = `${newY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDraggingDtr) {
                isDraggingDtr = false;
                dtrController.style.cursor = 'grab';
            }
        });

        // Initial cursor style for the draggable area
        const dtrHeader = dtrController.querySelector('.dtr-header');
        if (dtrHeader) {
            dtrHeader.style.cursor = 'grab';
        }
    }

    // [v0.2.16 Handshake] Signal readiness to the extension
    if (typeof vscode !== 'undefined') {
        console.log('[SYNAPSE] UI Ready. Sending handshake to extension...');
        vscode.postMessage({ command: 'ready' });
    }
}

// Ensure DOM is ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvas);
} else {
    initCanvas();
}
