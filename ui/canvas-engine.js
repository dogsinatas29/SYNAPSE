/**
 * SYNAPSE Canvas Engine
 * HTML5 Canvas 기반 노드 시각화 엔진
 * 
 * [License Notice]
 * This software incorporates fzf-inspired fuzzy matching logic, which is licensed under the MIT License.
 * fzf (C) 2013-2023 Junegunn Choi
 */

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
 * FlowRenderer - 함수 실행 순서 플로우차트 렌더링
 */
class FlowRenderer {
    constructor(engine) {
        this.engine = engine;
        this.currentFlow = null;
    }

    buildFlow(nodes) {
        const edges = this.engine.edges || [];

        // 1. 진짜 실행 루트 탐색 (실제 그래프 상의 Root: In-degree가 0인 노드들)
        // [Fix] External 노드는 루트에서 제외 (로직의 시작점이 될 수 없음)
        const inDegrees = {};
        edges.forEach(e => {
            if (!e || !e.to) return;
            inDegrees[e.to] = (inDegrees[e.to] || 0) + 1;
        });

        // [Fix] Root 우선순위 부여: main, app, index 등이 최상단에 오도록 하며, helper/util 등은 후순위
        const roots = nodes.filter(n => !inDegrees[n.id] && n.type !== 'external');

        // Root 정렬: main을 가장 앞으로, validators/helpers 등은 뒤로
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

        // 3. 도달 가능한 노드 필터링 및 정렬
        // [Refine] Flow 뷰에서는 '순수 로직'만 표현하기 위해 문서(.md) 파일은 다시 제외
        // 문서 파일은 Graph 뷰의 'Documentation Shelf'에서 탐색 가능함
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

            return reachableIds.has(n.id) && n.type !== 'external' && !isDoc && !isGhost && !isContext;
        });
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
        const inDegree = {};
        const adj = {};
        flow.steps.forEach(step => {
            inDegree[step.id] = 0;
            adj[step.id] = [];
        });

        // Build edges
        flow.steps.forEach(step => {
            const nextIdsRaw = step.allNexts || [];
            const nextIds = [...new Set([
                ...(step.next ? [step.next] : []),
                ...(step.alternateNext ? [step.alternateNext] : []),
                ...nextIdsRaw,
                ...(step.roots || [])
            ])];

            nextIds.forEach(nextId => {
                if (inDegree[nextId] !== undefined) {
                    inDegree[nextId]++;
                    adj[step.id].push(nextId);
                }
            });
        });

        // 2. Assign Levels (Topological-based Longest Path)
        // [Opt] Initial queue: nodes with in-degree 0
        const queue = [];
        flow.steps.forEach(step => {
            if (inDegree[step.id] === 0) {
                queue.push(step.id);
                levels[step.id] = 0;
            }
        });

        // Use a simple BFS but WITHOUT re-evaluating visited nodes to prevent cycles from hanging
        // Cycles are handled by the rank comparison (currentLevel + 1 > existingLevel)
        let processedCount = 0;
        while (queue.length > 0) {
            const current = queue.shift();
            processedCount++;
            const currentLevel = levels[current] || 0;

            const neighbors = adj[current] || [];
            neighbors.forEach(neighbor => {
                const existingLevel = levels[neighbor];
                if (existingLevel === undefined || currentLevel + 1 > existingLevel) {
                    levels[neighbor] = currentLevel + 1;
                    queue.push(neighbor);
                }
            });

            if (processedCount > 5000) {
                console.warn('[SYNAPSE] Flow layout safety break: Too many iterations (Cycle likely).');
                break;
            }
        }

        // 3. X-Axis Balancing (Group by level)
        const nodesByLevel = {};
        flow.steps.forEach(step => {
            const lvl = levels[step.id] || 0;
            if (!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
            nodesByLevel[lvl].push(step.id);
        });

        const offsets = {};

        // [Opt] Build reverse-adjacency map (children -> parents) for O(1) parent lookup
        const parentsMap = {};
        Object.entries(adj).forEach(([parentId, childIds]) => {
            childIds.forEach(childId => {
                if (!parentsMap[childId]) parentsMap[childId] = [];
                parentsMap[childId].push(parentId);
            });
        });

        // Root nodes center
        const rootsInLevel0 = nodesByLevel[0] || [];
        rootsInLevel0.forEach((rootId, idx) => {
            const shift = (idx % 2 === 0 ? 1 : -1) * Math.ceil(idx / 2);
            offsets[rootId] = shift;
        });

        // Flow downwards, place children near parents
        Object.keys(nodesByLevel).sort((a, b) => a - b).forEach(lvl => {
            const levelNum = parseInt(lvl);
            if (levelNum === 0) return;

            const nodesInLevel = nodesByLevel[lvl];
            const occupied = new Set();

            nodesInLevel.forEach(nodeId => {
                // Find parent(s) to align X coordinate - [Opt] using parentsMap instead of iterating all keys
                let parentOffsetSum = 0;
                let parentCount = 0;

                const parents = parentsMap[nodeId] || [];
                parents.forEach(parentId => {
                    if (offsets[parentId] !== undefined) {
                        parentOffsetSum += offsets[parentId];
                        parentCount++;
                    }
                });

                let idealOffset = parentCount > 0 ? Math.round(parentOffsetSum / parentCount) : 0;

                // Spiral out to find empty slot
                let actualOffset = idealOffset;
                let shift = 0;
                while (occupied.has(actualOffset)) {
                    shift = (shift <= 0) ? -shift + 1 : -shift;
                    actualOffset = idealOffset + shift;
                }

                occupied.add(actualOffset);
                offsets[nodeId] = actualOffset;
            });
        });

        // 4. Final Position Assignment
        flow.steps.forEach(step => {
            const level = levels[step.id] || 0;
            const offset = offsets[step.id] || 0;

            const x = startX + (offset * stepWidth);
            const y = startY + (level * stepHeight);

            // [v0.2.16 Safety] Guard against NaN/Infinity to prevent UI freeze
            if (Number.isFinite(x) && Number.isFinite(y)) {
                positions[step.id] = { x, y };
            } else {
                console.error(`[SYNAPSE] Invalid coordinates for node ${step.id}: (${x}, ${y})`);
                positions[step.id] = { x: startX, y: startY + (level * stepHeight) }; // Fallback
            }
        });

        return positions;
    }

    renderFlow(ctx, flow) {
        if (!flow || !flow.steps) return;
        const positions = this.layoutFlow(flow);

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
                ctx.fillStyle = 'rgba(250, 189, 47, 0.03)';
                ctx.strokeStyle = 'rgba(250, 189, 47, 0.4)';
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
                ctx.fillStyle = 'rgba(250, 189, 47, 0.8)';
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

                this.renderConnection(ctx, pos.x, pos.y, nextPos.x, nextPos.y, label, edgeType, isPathHighlighted);
            });

            // [New] START에서 여러 루트로 가는 멀티 연결선 지원
            if (step.id === 'step_start' && step.roots) {
                step.roots.forEach(rootId => {
                    const rootPos = positions[rootId];
                    if (rootPos) {
                        this.renderConnection(ctx, pos.x, pos.y, rootPos.x, rootPos.y);
                    }
                });
            }
        }
    }

    renderStep(ctx, step, x, y) {
        const width = 220;
        const height = 65;

        if (step.type === 'terminal') {
            ctx.fillStyle = '#b8bb26';
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x - 80, y - 30, 160, 60, 30);
            } else {
                ctx.rect(x - 80, y - 30, 160, 60);
            }
            ctx.fill();
            ctx.fillStyle = '#1d2021';
            ctx.font = 'bold 16px Monospace';
            ctx.textAlign = 'center';
            ctx.fillText(step.label, x, y + 6);
            return;
        }

        if (step.type === 'process') {
            ctx.fillStyle = '#3c3836';
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
            ctx.strokeStyle = '#ebdbb2';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        } else if (step.type === 'decision') {
            ctx.fillStyle = '#1d2021'; // 다크 바디
            ctx.beginPath();
            ctx.moveTo(x, y - height / 2 - 15);
            ctx.lineTo(x + width / 2 + 30, y);
            ctx.lineTo(x, y + height / 2 + 15);
            ctx.lineTo(x - width / 2 - 30, y);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#fabd2f'; // Gold Border
            ctx.lineWidth = 3;
            ctx.stroke();

            // 상단 작은 텍스트로 타입 표시
            ctx.fillStyle = '#fabd2f';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText('DECISION', x, y - height / 2 - 2);
        }

        ctx.fillStyle = '#ebdbb2';
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

    renderConnection(ctx, x1, y1, x2, y2, label, type, isHighlighted = false) {
        const isLoop = type === 'loop_back' || y2 < y1;
        const arrowSize = 10;

        // Semantic Colors
        let strokeColor = '#665c54'; // Default
        let lineWidth = isLoop ? 3 : 2;
        let dash = [];

        if (type === 'api_call') {
            strokeColor = '#8ec07c'; // Aqua/Cyan
            dash = [4, 4];
        } else if (type === 'db_query') {
            strokeColor = '#d3869b'; // Magenta
            lineWidth = 3;
        } else if (isLoop) {
            strokeColor = '#fe8019'; // Orange
        }

        if (isHighlighted) {
            strokeColor = '#fabd2f'; // Highlight color
            lineWidth += 5; // [v0.2.16] Dramatically increased thickness (+2 -> +5)
            // 펄스 애니메이션 적용
            if (this.engine.isAnimating) {
                ctx.shadowBlur = 15 + 5 * Math.sin(Date.now() / 200);
                ctx.shadowColor = strokeColor;
                dash = [12, 6];
                ctx.lineDashOffset = -this.engine.animationOffset * 2.5;
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
                ctx.fillStyle = label === 'YES' ? '#b8bb26' : (label === 'NO' ? '#fb4934' : '#fabd2f');
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
                
                // Aggressive stripping of common Linux root patterns
                if (normalizedPath.startsWith(wsRoot)) {
                    normalizedPath = normalizedPath.substring(wsRoot.length);
                } else if (normalizedPath.includes(wsRoot)) {
                    // Pivot point stripping: Find the last occurrence of wsRoot name
                    const pivot = wsRoot.split('/').filter(Boolean).pop();
                    if (pivot && normalizedPath.includes(`/${pivot}/`)) {
                        normalizedPath = normalizedPath.split(`/${pivot}/`).pop() || '';
                    } else {
                        normalizedPath = normalizedPath.split(wsRoot).pop() || '';
                    }
                } else if (normalizedPath.startsWith('/home/')) {
                    // Fail-safe for Linux absolute paths when wsRoot mismatch
                    const parts = normalizedPath.split('/');
                    const wsNameMatchIdx = parts.lastIndexOf(projectName || 'name');
                    if (wsNameMatchIdx !== -1) {
                        normalizedPath = parts.slice(wsNameMatchIdx + 1).join('/');
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

        ctx.fillStyle = '#fabd2f';
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

class CanvasEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('[SYNAPSE] Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

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
        this._lastDataHash = null; // [v0.2.24] Data integrity guard
        this._lastLoadTime = 0; // [v0.2.24] Load throttling

        // 데이터
        this.nodes = [];
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
        this.focusTopNodes = false; // [v0.3.19] Global Exploration Mode
        this.focusCoreSet = new Set(); // Top-N Core node IDs
        this.focusNodeSet = new Set(); // Core + 1-hop neighbor IDs
        this.hotspots = []; // [v0.3.20] Cached hotspot area geometries
        this.isAligning = false; // [v0.3.20] Strategic Alignment Animation state
        this.alignTimer = 0;

        // [v0.2.19] Layer Visibility State
        this.showBaseLayer = true;
        this.showUserLayer = true;

        this.showDocShelf = false;

        // 모드 및 렌더러
        this.currentMode = 'graph'; // 'graph' | 'tree' | 'flow'
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

        this.handleOpenFile = (filePath) => {
            if (!filePath) return;
            console.log('[SYNAPSE] handleOpenFile:', filePath);
            if (typeof vscode !== 'undefined') {
                vscode.postMessage({
                    command: 'openFile',
                    filePath,
                    createIfNotExists: this.isEditMode
                });
            } else if (typeof window.showFilePreview === 'function') {
                window.showFilePreview(filePath);
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
        this.nodeSummary.style.position = 'fixed';
        this.nodeSummary.style.background = 'rgba(40, 40, 40, 0.95)';
        this.nodeSummary.style.border = '1px solid #b8bb26';
        this.nodeSummary.style.borderRadius = '4px';
        this.nodeSummary.style.padding = '8px 12px';
        this.nodeSummary.style.color = '#ebdbb2';
        this.nodeSummary.style.fontSize = '12px';
        this.nodeSummary.style.pointerEvents = 'none';
        this.nodeSummary.style.display = 'none';
        this.nodeSummary.style.zIndex = '10002';
        this.nodeSummary.style.fontFamily = "'Fira Code', monospace";
        this.nodeSummary.style.lineHeight = '1.6';
        this.nodeSummary.style.boxShadow = '0 6px 16px rgba(0,0,0,0.6)';
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
        this.getProjectState();

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
                this.hideLeafNodes = !this.hideLeafNodes;
                btnToggleLeaf.textContent = this.hideLeafNodes ? 'ON' : 'OFF';
                btnToggleLeaf.classList.toggle('active', this.hideLeafNodes);
                this.needsUpdate = true;
            });
        }

        // [v0.3.19] Focus Top Nodes (Top-N Focus View)
        const btnToggleFocus = document.getElementById('btn-toggle-focus');
        if (btnToggleFocus) {
            btnToggleFocus.addEventListener('click', () => {
                this.focusTopNodes = !this.focusTopNodes;
                btnToggleFocus.textContent = this.focusTopNodes ? 'ON' : 'OFF';
                btnToggleFocus.classList.toggle('active', this.focusTopNodes);
                this.needsUpdate = true; 
                console.log('[SYNAPSE] Focus Top Nodes Mode:', this.focusTopNodes);
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

        // [v0.3.16] Edge Visibility Control
        window.edgeVisibilityMode = 'ALL'; // 'ALL' | 'NO_BADGES' | 'NO_EDGES'
        const btnEdgeVisAll = document.getElementById('btn-edge-vis-all');
        const btnEdgeVisHideBadge = document.getElementById('btn-edge-vis-hide-badge');
        const btnEdgeVisHideEdges = document.getElementById('btn-edge-vis-hide-edges');

        const updateEdgeVisButtons = (mode) => {
            if (btnEdgeVisAll) btnEdgeVisAll.classList.toggle('active', mode === 'ALL');
            if (btnEdgeVisHideBadge) btnEdgeVisHideBadge.classList.toggle('active', mode === 'NO_BADGES');
            if (btnEdgeVisHideEdges) btnEdgeVisHideEdges.classList.toggle('active', mode === 'NO_EDGES');
        };

        if (btnEdgeVisAll) {
            btnEdgeVisAll.addEventListener('click', () => {
                window.edgeVisibilityMode = 'ALL';
                updateEdgeVisButtons('ALL');
                this.isEdgeDirty = true;
                this.render();
            });
        }
        if (btnEdgeVisHideBadge) {
            btnEdgeVisHideBadge.addEventListener('click', () => {
                window.edgeVisibilityMode = 'NO_BADGES';
                updateEdgeVisButtons('NO_BADGES');
                this.isEdgeDirty = true;
                this.render();
            });
        }
        if (btnEdgeVisHideEdges) {
            btnEdgeVisHideEdges.addEventListener('click', () => {
                window.edgeVisibilityMode = 'NO_EDGES';
                updateEdgeVisButtons('NO_EDGES');
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

                    if (label) {
                        this.createManualNode(label, type, this.pendingNodePos.x, this.pendingNodePos.y);

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

            if (this.isEditMode) {
                this.canvas.style.boxShadow = 'inset 0 0 20px #fb4934';
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

    createManualNode(label, type, x, y) {
        // [v0.2.20 Fix] Place manual nodes securely in the Buffer Cluster physical area
        const bufferBaseX = -1100;
        const bufferBaseY = 1000;

        // Find how many buffer nodes exist to stack them neatly
        const bufferNodes = this.nodes.filter(n => n.cluster_id === 'sys_cluster_buffer' || n.data?.cluster_id === 'sys_cluster_buffer');
        const offsetX = (bufferNodes.length % 4) * 160;
        const offsetY = Math.floor(bufferNodes.length / 4) * 100;

        const targetX = bufferBaseX + offsetX;
        const targetY = bufferBaseY + offsetY;

        const newNode = {
            id: `node_manual_${Date.now()}`,
            type: type,
            status: 'active', // Manually added nodes are already approved
            position: { x: targetX, y: targetY },
            data: {
                label: label,
                description: 'Manually created node',
                cluster_id: 'sys_cluster_buffer', // Assign to Buffer Cluster
                priority_cluster: 'sys_cluster_buffer' // [v0.2.19] Lock prevent unassignment if dragged out
            },
            cluster_id: 'sys_cluster_buffer', // Backend compat

            visual: {
                opacity: 1 // Make it fully visible immediately
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
                node: newNode
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
                const response = await fetch('/data/project_state.json');
                if (response.ok) {
                    const state = await response.json();
                    console.log('[SYNAPSE] State loaded via fetch:', state);
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
        const width = container.clientWidth;
        let height = container.clientHeight;

        // [FIX v0.3.09] clientHeight가 0이면 강제 최소값 설정
        // Canvas height가 0이면 렌더링 공간이 없어 모든 노드가 표시 안됨
        if (height === 0 || height < 100) {
            height = 400;  // 기본 최소 높이
            console.warn('[SYNAPSE] Canvas height was 0 or invalid, forcing minimum height: 400px');
        }

        const targetWidth = Math.floor(width * dpr);
        const targetHeight = Math.floor(height * dpr);

        if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
            // [v0.2.24] Resize Debounce: Wait for resize to settle before heavy buffer reset
            if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
            const updateBuffer = () => {
                this.canvas.width = targetWidth;
                this.canvas.height = targetHeight;
                this.canvas.style.width = `${width}px`;
                this.canvas.style.height = `${height}px`;

                if (this.webglEnabled && this.webglRenderer) {
                    this.webglRenderer.handleResize();
                }

                console.log(`[SYNAPSE] Canvas stabilized (${immediate ? 'Sync' : 'Async'}). Size: ${width}x${height}`);
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

                // [v0.2.24] Demand-driven rendering: Only draw if needed
                const shouldRender = this.isDirty || this._isInteracting || this.isDragging || this.isSelecting || hasActiveParticles || this.needsUpdate || (this.isAnimating && (this.particles?.length || 0) > 0);

                if (shouldRender) {
                    this._isRendering = true;  // [FIX v0.3.09] Mark rendering start
                    try {
                        this.render();
                        this.needsUpdate = false; // Reset after render
                    } finally {
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
        if (!elBase || !elUser) return;

        let userCount, baseCount;
        
        if (backendCounts && (backendCounts.userCount !== undefined || backendCounts.user_count !== undefined)) {
            // [v0.3.11] Use Authoritative Counts if provided
            userCount = backendCounts.userCount ?? backendCounts.user_count;
            baseCount = backendCounts.aiCount ?? backendCounts.ai_count;
        } else {
            // Fallback to local filtering
            const userNodes = this.nodes.filter(n => 
                n.layer === 'user' || 
                (n.data && n.data.layer === 'user') ||
                (n.id && n.id.startsWith('node_manual_'))
            );
            userCount = userNodes.length;
            baseCount = this.nodes.length - userCount;
        }

        const updateBadge = (el, newCount) => {
            const oldCount = parseInt(el.textContent);
            if (isNaN(oldCount) || oldCount !== newCount) {
                el.textContent = newCount;
                el.classList.add('changed');
                setTimeout(() => el.classList.remove('changed'), 600);
            }
        };

        updateBadge(elBase, baseCount);
        updateBadge(elUser, userCount);
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
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta, e.offsetX, e.offsetY);
        }, { passive: false });

        // 마우스 드래그 (팬, 노드 드래그, 선택, 엣지 생성)
        this.canvas.addEventListener('mousedown', (e) => {
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
                    if (b && worldPos.x >= b.x && worldPos.x <= b.x + 60) {
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
                    const getAllNodes = (clusterId) => {
                        let res = this.nodes.filter(n => n.cluster_id === clusterId || n.data?.cluster_id === clusterId);
                        if (this.clusters) {
                            const childClusters = this.clusters.filter(c => c.parent_id === clusterId);
                            for (const child of childClusters) {
                                res = res.concat(getAllNodes(child.id));
                            }
                        }
                        return res;
                    };
                    const clusterNodes = getAllNodes(clickedClusterHeader.id);
                    if (clusterNodes.length > 0) {
                        if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                            this.selectedNodes.clear();
                        }
                        clusterNodes.forEach(n => this.selectedNodes.add(n));
                        if (this.isEditMode || e.button === 0) {
                            this.isDragging = true;
                            this.isGraphDataDirty = true;
                        }
                        this.wasDragging = true;
                        console.log('[SYNAPSE] Cluster header dragged:', clickedClusterHeader.label);
                    }
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
                // 타겟 감지
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
                return;
            }

            if (this.isDragging || this.isSelecting || this.isPanning) {
                // 실제 이동 거리가 짧으면 드래그로 간주하지 않음 (지터 방지)
                const totalDx = e.offsetX - this.dragStartAbsolute.x;
                const totalDy = e.offsetY - this.dragStartAbsolute.y;
                if (Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5) {
                    this.wasDragging = true;
                }
            }

            if (this.isDragging) {
                // 노드 이동
                const worldDx = dx / this.transform.zoom;
                const worldDy = dy / this.transform.zoom;
                for (const node of this.selectedNodes) {
                    node.position.x += worldDx;
                    node.position.y += worldDy;
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
                    // 🔍 툴팁 처리 (Phase 4)
                    const edge = this.findEdgeAtPoint(worldPos.x, worldPos.y);
                    const node = this.getNodeAt(worldPos.x, worldPos.y);

                    this.hoveredEdge = edge;
                    this.hoveredNode = node;

                    // [v0.3.17] Node Summary Logic
                    if (node) {
                        const stats = this.nodeStatsMap.get(node.id);
                        if (stats) {
                            this.showNodeSummary(e.clientX, e.clientY, node, stats);
                        } else {
                            this.hideNodeSummary();
                        }
                    } else {
                        this.hideNodeSummary();
                    }

                    if (edge && edge._validationReason) {
                        this.showTooltip(e.clientX, e.clientY, edge._validationReason);
                    } else {
                        this.hideTooltip();
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
                    // Check if node is hidden by a collapsed cluster
                    if (node.cluster_id) {
                        const cluster = this.clusters.find(c => c.id === node.cluster_id);
                        if (cluster && cluster.collapsed) continue;
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
                if (this.wasDragging) {
                    // [v0.3.15] Apply Snap-to-Grid during interaction (Grid Sovereignty)
                    const draggedNodes = Array.from(this.selectedNodes);
                    draggedNodes.forEach(node => {
                        if (node.position) {
                            node.position.x = Math.round(node.position.x / this.GRID_SNAP_SIZE) * this.GRID_SNAP_SIZE;
                            node.position.y = Math.round(node.position.y / this.GRID_SNAP_SIZE) * this.GRID_SNAP_SIZE;
                        }
                    });

                    const clusterIds = new Set(draggedNodes.map(n => n.cluster_id).filter(id => id));
                    let movedByIntruder = false;
                    for (const cid of clusterIds) {
                        if (this.repositionIntruders(cid)) {
                            movedByIntruder = true;
                        }
                    }

                    // [v0.3.16 Fix] Scale drag dist by zoom so zooming out (for long edges) doesn't break drag-save
                    const absDragDist = Math.sqrt(
                        Math.pow(this.dragStartAbsolute.x - (this.dragStart?.x ?? 0), 2) +
                        Math.pow(this.dragStartAbsolute.y - (this.dragStart?.y ?? 0), 2)
                    ) / (this.transform.zoom || 1.0);

                    if (absDragDist > 15 || movedByIntruder) {
                        this.saveState();
                        if (movedByIntruder) {
                            this.takeSnapshot(`Auto Push (after drag)`);
                        }
                    }
                }
                this.isDragging = false;
                this.wasDragging = false;
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
                this.log('[SYNAPSE] Applying deferred projectState after interaction end');
                this.loadProjectState(this._pendingState, true);
                this._pendingState = null;
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
                    this.handleOpenFile(clickedItem.node.data.path || clickedItem.node.data.file);
                }
            } else if (this.currentMode === 'flow') {
                const clickedStep = this.flowRenderer.getStepAt(this.flowData, worldPosDbl.x, worldPosDbl.y);
                if (clickedStep && clickedStep.node) {
                    this.handleOpenFile(clickedStep.node.data.path || clickedStep.node.data.file);
                }
            } else {
                const topClickedNode = this.getNodeAt(worldPosDbl.x, worldPosDbl.y);
                if (topClickedNode) {
                    // [v0.3.10-LOCK] Robust fallback for filePath: data.path -> data.file -> node.file -> data.label -> node.id
                    const d = topClickedNode.data || {};
                    const targetFile = d.path || d.file || topClickedNode.file || d.label || 
                                      ((topClickedNode.type === 'file' || topClickedNode.type === 'logic') && !String(topClickedNode.id).startsWith('node_manual_') ? topClickedNode.id : null);
                    
                    if (targetFile) {
                        this.handleOpenFile(targetFile);
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

    zoom(delta, centerX, centerY) {

        const oldZoom = this.transform.zoom;
        this.transform.zoom *= delta;
        this.transform.zoom = Math.max(0.1, Math.min(5.0, this.transform.zoom));

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
        // [v0.2.16] Mode-specific hit testing for better hover support
        if (this.currentMode === 'flow' && this.flowRenderer && this.flowData) {
            const step = this.flowRenderer.getStepAt(this.flowData, worldX, worldY);
            return step ? step.node : null;
        }

        if (this.currentMode === 'tree' && this.treeRenderer && this.treeData) {
            const item = this.treeRenderer.getItemAt(this.treeData, worldX, worldY);
            return item ? item.node : null;
        }

        // Default Graph Mode hit testing (REVERSE order to hit top nodes first)
        const nodes = (this.bootstrapMode && this.lastFrameState) ? this.lastFrameState.nodes : this.nodes;
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            const nodeWidth = node._width || 120;
            const nodeHeight = 60;
            const isSelected = this.selectedNodes.has(node);
            const HIT_PADDING = isSelected ? 15 : 0; // [v0.2.32] Extra 15px grab area for selected nodes

            // Check if node is hidden (collapsed cluster)
            if (node.cluster_id) {
                const cluster = this.clusters?.find(c => c.id === node.cluster_id);
                if (cluster && cluster.collapsed) continue;
            }

            const left = node.position.x - HIT_PADDING;
            const right = node.position.x + nodeWidth + HIT_PADDING;
            const top = node.position.y - HIT_PADDING;
            const bottom = node.position.y + nodeHeight + HIT_PADDING;

            if (worldX >= left && worldX <= right && worldY >= top && worldY <= bottom) {
                return node;
            }
        }
        return null;
    }

    getClusterAt(worldX, worldY) {
        if (!this.clusters) return null;

        // 역순으로 검사 (위에 그려진 클러스터 우선)
        for (let i = this.clusters.length - 1; i >= 0; i--) {
            const cluster = this.clusters[i];

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

        // 역순으로 검사 (위에 그려진 클러스터 우선)
        for (let i = this.clusters.length - 1; i >= 0; i--) {
            const cluster = this.clusters[i];
            if (cluster._headerBounds) {
                const b = cluster._headerBounds;
                // 헤더 바운딩 박스 내부인지 확인
                if (worldX >= b.x && worldX <= b.x + b.width &&
                    worldY >= b.y && worldY <= b.y + b.height) {
                    return cluster;
                }
            }
        }
        return null;
    }

    getConnectionHandleAt(worldX, worldY) {
        // 노드 핸들 체크
        for (const node of this.nodes) {
            const centerX = node.position.x + 60;
            const centerY = node.position.y + 30;

            // 4방향 핸들 (상, 하, 좌, 우)
            const handles = [
                { x: centerX, y: node.position.y, type: 'node', id: node.id }, // 상
                { x: centerX, y: node.position.y + 60, type: 'node', id: node.id }, // 하
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
            if (this.selectedEdge) {
                deleteItem.textContent = '❌ Delete Edge';
            } else if (this.selectedNodes.size > 1) {
                deleteItem.textContent = `❌ Delete ${this.selectedNodes.size} Nodes`;
            } else {
                deleteItem.textContent = '❌ Delete Node';
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
        if (!sourceNode || !targetNode) {
            return { valid: true, color: edge.visual?.color || '#83a598', reason: 'Unknown nodes' };
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

        const types = [
            { label: '🔗 Dependency', type: 'dependency', color: '#83a598' },
            { label: '📞 Call', type: 'call', color: '#b8bb26' },
            { label: '📊 Data Flow', type: 'data_flow', color: '#fabd2f' },
            { label: '📝 Reference', type: 'reference', color: '#b8bb26' },
            { label: '↔️ Bidirectional', type: 'bidirectional', color: '#d3869b' }
        ];

        types.forEach(t => {
            const item = document.createElement('div');
            item.textContent = t.label;
            item.style.padding = '6px 12px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '4px';
            item.style.transition = 'background 0.2s';
            item.onmouseenter = () => item.style.background = '#504945';
            item.onmouseleave = () => item.style.background = 'transparent';
            item.onclick = () => {
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

        const types = [
            { label: '🔗 Dependency', type: 'dependency', color: '#83a598' },
            { label: '📞 Call', type: 'call', color: '#b8bb26' },
            { label: '📊 Data Flow', type: 'data_flow', color: '#fabd2f' },
            { label: '📝 Reference', type: 'reference', color: '#b8bb26' },
            { label: '↔️ Bidirectional', type: 'bidirectional', color: '#d3869b' }
        ];

        types.forEach(t => {
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

        this.edges.push(newEdge);
        console.log('[SYNAPSE] Manual edge created:', newEdge);
        if (this.flowRenderer) {
            this.flowData = this.flowRenderer.buildFlow(this.nodes) || { steps: [] };
        }

        // 백엔드에 저장
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'createManualEdge',
                edge: newEdge
            });

            // 🔍 즉시 아키텍처 검증 요청 (Phase 4)
            const fromNode = this.nodes.find(n => n.id === newEdge.from);
            const toNode = this.nodes.find(n => n.id === newEdge.to);
            if (fromNode && toNode) {
                vscode.postMessage({
                    command: 'validateEdge',
                    edge: newEdge,
                    sourceStr: JSON.stringify(fromNode),
                    targetStr: JSON.stringify(toNode)
                });
            }

            // Move from Buffer to Reserved if applicable
            if (fromNode && (fromNode.cluster_id === 'sys_cluster_buffer' || fromNode.data?.cluster_id === 'sys_cluster_buffer')) {
                fromNode.cluster_id = 'sys_cluster_reserved';
                if (fromNode.data) fromNode.data.cluster_id = 'sys_cluster_reserved';
                // Send node update to backend if necessary
                vscode.postMessage({
                    command: 'updateNodeData',
                    node: fromNode
                });
            }
            if (toNode && (toNode.cluster_id === 'sys_cluster_buffer' || toNode.data?.cluster_id === 'sys_cluster_buffer')) {
                toNode.cluster_id = 'sys_cluster_reserved';
                if (toNode.data) toNode.data.cluster_id = 'sys_cluster_reserved';
                vscode.postMessage({
                    command: 'updateNodeData',
                    node: toNode
                });
            }
        }

        // [v0.3.09 Fix] Phase lock 이후로 지연하여 RENDER 단계 중 saveState 방지
        setTimeout(() => this.saveState(), 100);

        // 엣지 생성 완료 후 상태 초기화
        this.edgeSource = null;
        // Persistent connect mode: don't clear target so we can connect from target to next? Actually, user wants continuous connect mode, so we keep mode active but reset source/target
        this.edgeTarget = null;

        // Remove: this.isCreatingEdge = false; 
        // Remove: document.getElementById('btn-connect')?.classList.remove('active');
        this.render();
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

        // Build cluster-to-layer map for fast lookup
        const clusterLayerMap = new Map();
        (this.clusters || []).forEach(c => {
            const layer = c.layer || (c.data && c.data.layer) || (c.id.startsWith('sys_') ? 'ai' : (c.id === 'doc_shelf' ? 'doc' : 'user'));
            clusterLayerMap.set(c.id, layer);
        });

        // Initialize Map in O(N)
        const nodeMap = new Map();
        for (const node of nodes) {
            nodeMap.set(node.id, node);
            this.nodeStatsMap.set(node.id, {
                in: 0,
                out: 0,
                connected: new Set(),
                distribution: {}
            });
        }

        // Helper to get semantic group label (Zero-Unknown Principle)
        const getGroupLabel = (node) => {
            if (!node) return 'unknown';
            
            // 1. Recognized layer from clusters
            const layer = clusterLayerMap.get(node.cluster_id);
            if (layer && layer !== 'user') return layer;

            // 2. System clusters with specific logic
            if (node.cluster_id === 'sys_cluster_buffer') return 'buffer';
            if (node.cluster_id === 'sys_cluster_reserved') return 'reserved';
            if (node.cluster_id === 'doc_shelf') return 'doc';

            // 3. Identification by Node Type & Status
            if (node.type === 'external') return 'external';
            if (node.status === 'ghost') return 'ghost';
            if (node.type === 'documentation') return 'doc';

            // 4. Fallback to cluster label or unmapped
            const cluster = this.clusters.find(c => c.id === node.cluster_id);
            if (cluster) return cluster.label.replace(/[📂☁️🛡️🕒]/g, '').trim().toLowerCase();

            return 'unmapped';
        };

        // Single pass over edges O(E)
        for (const e of edges) {
            const srcStats = this.nodeStatsMap.get(e.from);
            const tgtStats = this.nodeStatsMap.get(e.to);
            const srcNode = nodeMap.get(e.from);
            const tgtNode = nodeMap.get(e.to);

            if (srcStats && tgtNode) {
                srcStats.out++;
                srcStats.connected.add(e.to);
                
                // Track semantic distribution
                const tgtGroup = getGroupLabel(tgtNode);
                srcStats.distribution[tgtGroup] = (srcStats.distribution[tgtGroup] || 0) + 1;
            }
            if (tgtStats && srcNode) {
                tgtStats.in++;
                tgtStats.connected.add(e.from);

                // Track semantic distribution
                const srcGroup = getGroupLabel(srcNode);
                tgtStats.distribution[srcGroup] = (tgtStats.distribution[srcGroup] || 0) + 1;
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

            // Pick Top 10 cores
            const topN = sortedNodes.slice(0, 10);
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
            // Convert any format to semi-transparent rgba
            this.ctx.fillStyle = baseColor.includes('rgba') ? baseColor.replace(/, [0-9.]+\)$/, ', 0.05)') : baseColor + '0d'; 
            // Handle hex or named colors by a simpler way if needed, but here baseColor is usually #RRGGBB or rgba
            if (baseColor.startsWith('#')) {
                this.ctx.fillStyle = baseColor + '1a'; // ~0.1 opacity hex
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
                this.ctx.fillText(`[${hs.role.replace(' node', '').toUpperCase()}]`, hs.x + 8, hs.y + 18);
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
        this.isAligning = true;
        this.alignTimer = 120; // Run simulation for ~2 seconds
        console.log('[SYNAPSE] Spring-based Alignment Triggered.');
        this.needsUpdate = true;
    }

    /**
     * Physical update logic for soft alignment.
     */
    updateAlignmentSimulation() {
        if (!this.nodes) return;
        const ALIGN_STRENGTH = 0.05; // Slightly stronger for faster settling
        const FRICTION = 0.82;
        const COLUMN_WIDTH = 350; // Widened for horizontal aesthetics
        const ROW_HEIGHT = 160;  // Slightly compressed vertically
        
        // Group by role to find sub-column indices
        const groups = { 'Leaf': [], 'Hub': [], 'Orchestrator': [], 'Controller': [] };
        for (const node of this.nodes) {
            const stats = this.nodeStatsMap.get(node.id);
            if (!stats || !stats.primaryRole) continue;
            const pRole = stats.primaryRole;
            if (pRole.startsWith('Leaf')) groups['Leaf'].push(node);
            else if (pRole.startsWith('Hub')) groups['Hub'].push(node);
            else if (pRole.startsWith('Orchestrator')) groups['Orchestrator'].push(node);
            else if (pRole.startsWith('Controller')) groups['Controller'].push(node);
        }

        const targets = { 'Leaf': -1500, 'Hub': -500, 'Orchestrator': 500, 'Controller': 1500 };

        for (const [roleName, list] of Object.entries(groups)) {
            const baseX = targets[roleName];
            list.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
            
            list.forEach((node, i) => {
                const colIndex = i % 3;
                const rowIndex = Math.floor(i / 3);
                
                const targetX = baseX + (colIndex - 1) * COLUMN_WIDTH;
                const targetY = (rowIndex * ROW_HEIGHT) - (Math.ceil(list.length / 3) * ROW_HEIGHT / 2);

                // Apply Spring Forces to velocity
                node.vx = (node.vx || 0) + (targetX - node.position.x) * ALIGN_STRENGTH;
                node.vy = (node.vy || 0) + (targetY - node.position.y) * ALIGN_STRENGTH;
                
                // Diminish velocity over time
                node.vx *= FRICTION;
                node.vy *= FRICTION;
                
                // Integrate velocity to position
                node.position.x += node.vx;
                node.position.y += node.vy;
            });
        }
        
        this.updateHotspots();
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
        if (connectedNodes <= 2) {
            roles.push("Leaf node");
        } else if (outRatioVal >= 0.8 && connectedNodes >= 10) {
            roles.push("Orchestrator (fan-out)");
        } else if (inRatioVal >= 0.8 && connectedNodes >= 10) {
            roles.push("Controller (fan-in)");
        } else if (connectedNodes >= 20) {
            roles.push("Hub (high connectivity)");
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

    showNodeSummary(x, y, node, stats) {
        if (!this.nodeSummary) return;
        
        const nodeName = node.data?.label || node.id;
        const nodes = this.nodes || [];
        const clusters = this.clusters || [];
        const clusterLayerMap = new Map();
        clusters.forEach(c => {
            const layer = c.layer || (c.data && c.data.layer) || (c.id.startsWith('sys_') ? 'ai' : (c.id === 'doc_shelf' ? 'doc' : 'user'));
            clusterLayerMap.set(c.id, layer);
        });

        const getGroupLabel = (n) => {
            if (!n) return 'unknown';
            const layer = clusterLayerMap.get(n.cluster_id);
            if (layer && layer !== 'user') return layer;
            if (n.cluster_id === 'sys_cluster_buffer') return 'buffer';
            if (n.cluster_id === 'sys_cluster_reserved') return 'reserved';
            if (n.cluster_id === 'doc_shelf') return 'doc';
            if (n.type === 'external') return 'external';
            if (n.status === 'ghost') return 'ghost';
            if (n.type === 'documentation') return 'doc';
            const cluster = clusters.find(c => c.id === n.cluster_id);
            if (cluster && cluster.label) return cluster.label.replace(/[📂☁️🛡️🕒]/g, '').trim().toLowerCase();
            return 'unmapped';
        };

        const groupDetails = {};
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        stats.connected.forEach(targetId => {
            const targetNode = nodeMap.get(targetId);
            if (targetNode) {
                const group = getGroupLabel(targetNode);
                if (!groupDetails[group]) groupDetails[group] = [];
                groupDetails[group].push(targetNode.data?.label || targetNode.id);
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
            'Leaf node':         '#9E9E9E'
        };

        const stars = '★'.repeat(priority) + '☆'.repeat(4 - priority);

        const distHtml = distributionEntries.length > 0 ? `
            <div style="margin-top: 10px; border-top: 1px solid #504945; padding-top: 6px;">
                <div style="font-size: 10px; color: #928374; text-transform: uppercase; margin-bottom: 4px;">Top Connections:</div>
                ${distributionEntries.map(([group, count]) => {
                    const topNodes = groupDetails[group] ? groupDetails[group].slice(0, 3).join(', ') : '';
                    const more = groupDetails[group] && groupDetails[group].length > 3 ? '...' : '';
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


        this.nodeSummary.innerHTML = `
            <div style="color: #fabd2f; font-weight: bold; border-bottom: 1px solid #fabd2f; margin-bottom: 8px; padding-bottom: 4px; font-size: 13px;">${nodeName}</div>
            <div style="display: flex; gap: 15px; font-size: 11px; margin-bottom: 2px;">
                <div style="color: #b8bb26;">Conn: <span style="color: #ebdbb2;">${stats.connectedNodes}</span></div>
                <div style="color: #83a598;">In: <span style="color: #ebdbb2;">${stats.in}</span></div>
                <div style="color: #fe8019;">Out: <span style="color: #ebdbb2;">${stats.out}</span></div>
            </div>
            ${distHtml}
        `;
        
        this.nodeSummary.style.display = 'block';
        if (this.tooltip) this.tooltip.style.display = 'none';

        const rect = this.nodeSummary.getBoundingClientRect();
        let left = x + 20;
        let top = y + 20;
        if (left + rect.width > window.innerWidth) left = x - rect.width - 20;
        if (top + rect.height > window.innerHeight) top = y - rect.height - 20;

        this.nodeSummary.style.left = `${left}px`;
        this.nodeSummary.style.top = `${top}px`;
    }


    hideNodeSummary() {
        if (this.nodeSummary) this.nodeSummary.style.display = 'none';
    }

    getOrCreateSystemClusters() {
        const createSysCluster = (id, label, x, y, color) => {
            let cluster = this.clusters.find(c => c.id === id);
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

    loadProjectState(projectState, preserveView = false) {
        if (!projectState) return;

        // [v0.3.10] Runtime Data Sanitization
        const ghostBlacklist = [
            'os', 'sys', 'math', 'json', 'datetime', 'sqlite3', 'pandas', 'rich', 'numpy',
            'command', 'snap_', 'test_doc', 'untitled', 'request', 'urllib', 'dateutil', 're',
            'analysis', 'report', 'logic'
        ];

        const rawNodes = projectState.nodes || [];
        const rawEdges = projectState.edges || [];

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

        // 2. Filter Edges to only connect visible nodes
        const activeIds = new Set(canvasNodes.map(n => n.id));
        const canvasEdges = rawEdges.filter(e => activeIds.has(e.from) && activeIds.has(e.to));

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
        const promotedLabels = [];

        try {
            // [v0.3.11] 명시적 데이터 정제 제거 (백엔드 SSoT에서 처리됨)
            if (!baseState.nodes || baseState.nodes.length === 0) {
                console.warn('[SYNAPSE] loadProjectState: Received empty nodes list.');
            }

            // [Fix] Capture manual nodes before overriding this.nodes
            const oldManualNodes = (this.nodes || []).filter(n => n.id.startsWith('node_manual_'));

            // [v0.3.16] docShelfNodes are already separated and set in step 1 (line 3652)
            this.nodes = baseState.nodes || [];

            const docIds = new Set(this.docShelfNodes.map(n => n.id));
            const rawEdges = projectState.edges || [];
            this.edges = rawEdges.filter(e => !docIds.has(e.from) && !docIds.has(e.to));

            // [v0.3.17] Update Node Stats Cache
            this.updateNodeStats();

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
                    const layer = c.layer || (c.data && c.data.layer) || (c.id.startsWith('sys_') ? 'ai' : 'user');
                    return { ...c, layer };
                });

            // [v0.2.36] Restore View (Camera) if available and not preserving
            if (!preserveView && projectState.view) {
                this.transform.zoom = projectState.view.zoom || this.transform.zoom;
                this.transform.offsetX = projectState.view.offsetX ?? this.transform.offsetX;
                this.transform.offsetY = projectState.view.offsetY ?? this.transform.offsetY;
                this.updateZoomDisplay();
            }

            // 외부 패널 UI 즉시 렌더링
            this.renderDocShelfList();

            // [v0.2.22] System Clusters initialization
            this.getOrCreateSystemClusters();

            // [v0.2.24 New Rule] Documentation Shelf is collapsed by default
            this.clusters.forEach(cluster => {
                if (cluster.id === 'doc_shelf') {
                    if (cluster.collapsed === undefined) {
                        cluster.collapsed = true; // Collapse by default
                    }
                } else if (cluster.id.startsWith('sys_cluster_')) {
                    if (cluster.collapsed === undefined) {
                        cluster.collapsed = false; // System clusters are expanded by default
                    }
                }
            });

            // Reset transient states
            this.baselineNodes = null; // Clear comparison artifacts
            this.selectedNodes = new Set(); // Clear selection
            this.selectedEdge = null;

            // 🔍 데이터 무결성 보정 (Data Hygiene)
            // node.data.cluster_id와 node.cluster_id 동기화
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

            // [v0.3.11] Prevent layout jitter: Skip overlap resolution if nodes already have valid positions
            const hasValidPositions = this.nodes.every(n => n.position && Number.isFinite(n.position.x));
            if (!preserveView && !hasValidPositions) {
                try {
                    this.resolveOverlaps();
                } catch (overlapErr) {
                    this.log('resolveOverlaps failed but continuing', 'error', overlapErr.message);
                }
            } else {
                this.log(`Skipping overlap resolution (preserveView: ${preserveView}, hasValidPositions: ${hasValidPositions})`);
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
            if (!preserveView) {
                if (projectState.transform) {
                    this.transform = { ...projectState.transform };
                    this.updateZoomDisplay();
                    this.render();
                    console.log('[SYNAPSE] View restored from snapshot:', this.transform);
                } else {
                    this.fitView();
                }
            } else {
                // 뷰를 유지하더라도 렌더링은 해야 함
                this.render();
            }

            // 로딩 오버레이 제거
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
                console.log('[SYNAPSE] Removing loading overlay after data load');
                loadingEl.remove();
            }

            // [v0.2.24] IPC Optimization: Batched Architecture Validation (O(1) Message count)
            if (typeof vscode !== 'undefined' && this.edges.length > 0) {
                const edgesToValidate = this.edges.filter(edge => {
                    if (!edge || !edge.from || !edge.to) return false;
                    // Skip if already has AI validation or logic validation is unchanged
                    return !edge.validation;
                });

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
                        vscode.postMessage({
                            command: 'validateEdgesBatch', // [v0.2.24] New Batched Command
                            batch: validationPayload
                        });
                    }
                }
            }

            console.log('[SYNAPSE] Loaded project state with', this.nodes.length, 'nodes');

            // Critical check for positions
            const validPositions = this.nodes.filter(n => n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number').length;
            console.log(`[SYNAPSE] Valid positions: ${validPositions} / ${this.nodes.length}`);

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

    resolveOverlaps() {
        if (!this.nodes || this.nodes.length < 2) return;

        const MIN_DISTANCE_X = 160; // 40px grid multiple
        const MIN_DISTANCE_Y = 80;  // 40px grid multiple (Tighter vertical spacing)
        const ITERATIONS = 4; // Allow layout to spread gracefully before snapping

        // [v0.2.26] 🛡️ Deterministic Layout: Read from Snapshot, Write to Current
        // This prevents "Chain Reaction" where order of nodes determines who moves first
        for (let iter = 0; iter < ITERATIONS; iter++) {
            let movedTotal = false;

            // Take a position snapshot of all nodes at the START of this iteration
            const posSnapshot = new Map();
            this.nodes.forEach(n => {
                if (n.position) posSnapshot.set(n.id, { x: n.position.x, y: n.position.y });
            });

            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const nodeA = this.nodes[i];
                    const nodeB = this.nodes[j];

                    // Read from STATIC snapshots for consistency
                    const pA = posSnapshot.get(nodeA.id);
                    const pB = posSnapshot.get(nodeB.id);
                    if (!pA || !pB) continue;

                    // Visibility Guard (Skip collapsed)
                    const isHidden = (n) => {
                        if (!n.cluster_id) return false;
                        const c = this.clusters?.find(cl => cl.id === n.cluster_id);
                        return c && c.collapsed;
                    };
                    if (isHidden(nodeA) || isHidden(nodeB)) continue;

                    const dx = pB.x - pA.x;
                    const dy = pB.y - pA.y;
                    const adx = Math.abs(dx);
                    const ady = Math.abs(dy);

                    if (adx < MIN_DISTANCE_X && ady < MIN_DISTANCE_Y) {
                        movedTotal = true;
                        
                        // [v0.3.16] Grid Sovereignty (Snap-back Stalemate Fix)
                        // 강제로 40px(SNAP) 배수 단위 이상으로 밀어내어 반올림에 의한 자리복귀 차단
                        const SNAP = this.GRID_SNAP_SIZE || 40;
                        let shiftX = (MIN_DISTANCE_X - adx) / 2;
                        let shiftY = (MIN_DISTANCE_Y - ady) / 2;
                        
                        shiftX = Math.max(SNAP, Math.ceil(shiftX / SNAP) * SNAP);
                        shiftY = Math.max(SNAP, Math.ceil(shiftY / SNAP) * SNAP);

                        // Mutate CURRENT node position based on STATIC snapshot relationship
                        if (dx >= 0) {
                            nodeA.position.x -= shiftX;
                            nodeB.position.x += shiftX;
                        } else {
                            nodeA.position.x += shiftX;
                            nodeB.position.x -= shiftX;
                        }

                        if (dy >= 0) {
                            nodeA.position.y -= shiftY;
                            nodeB.position.y += shiftY;
                        } else {
                            nodeA.position.y += shiftY;
                            nodeB.position.y -= shiftY;
                        }
                    }
                }
            }
            if (!movedTotal) break;
        }

        // [v0.3.15] Re-snap to grid after overlap resolution to maintain Grid Sovereignty
        this.nodes.forEach(node => {
            if (node.position) {
                node.position.x = Math.round(node.position.x / this.GRID_SNAP_SIZE) * this.GRID_SNAP_SIZE;
                node.position.y = Math.round(node.position.y / this.GRID_SNAP_SIZE) * this.GRID_SNAP_SIZE;
            }
        });

        this.log(`[STATE-DETERMINISM] Hash After Layout: ${this.getFingerprint(this.nodes).substring(0, 60)}...`);
    }

    fitView() {
        if (!this.nodes || this.nodes.length === 0) {
            this.transform = { zoom: 1.0, offsetX: 0, offsetY: 0 };
            this.updateZoomDisplay();
            return;
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const node of this.nodes) {
            if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') continue;
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + 120);
            maxY = Math.max(maxY, node.position.y + 60);
        }

        const width = maxX - minX;
        const height = maxY - minY;

        // 캔버스에 맞게 줌 조정
        // Padding 100px
        const padding = 100;
        const availableWidth = this.canvas.clientWidth - padding;
        const availableHeight = this.canvas.clientHeight - padding;

        const zoomX = availableWidth / Math.max(width, 1);
        const zoomY = availableHeight / Math.max(height, 1);

        let newZoom = Math.min(zoomX, zoomY);
        newZoom = Math.min(Math.max(newZoom, 0.1), 2.0);

        this.transform.zoom = newZoom;

        // 중앙 정렬
        this.transform.offsetX = (this.canvas.clientWidth - width * this.transform.zoom) / 2 - minX * this.transform.zoom;
        this.transform.offsetY = (this.canvas.clientHeight - height * this.transform.zoom) / 2 - minY * this.transform.zoom;

        console.log('[DEBUG] fitView calculated:', {
            minX, minY, width, height,
            canvasWidth: this.canvas.width,
            canvasHeight: this.canvas.height,
            zoom: this.transform.zoom,
            offsetX: this.transform.offsetX,
            offsetY: this.transform.offsetY
        });

        this.updateZoomDisplay();
        this.isDirty = true;
        this.requestRender();
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
            // [v0.3.11] 명시적 layer 속성 기반
            const isUser = n.layer === 'user' || 
                (n.data && n.data.layer === 'user') ||
                n.status === 'pending' ||
                (n.id && n.id.startsWith('node_manual_')) ||
                (n.cluster_id && n.cluster_id.startsWith('sys_'));

            if (isUser && !context.showUserLayer) return false;
            if (!isUser && !context.showBaseLayer) return false;
            return true;
        });

        // 2. ISO/DEEP CLONE (Physical Reference Detachment)
        // Manually clone fields to ensure nested stability
        const isolatedNodes = filtered.map(n => ({
            id: n.id,
            category: n.category || 'base',
            status: n.status,
            data: n.data ? { ...n.data, meta: n.data.meta ? { ...n.data.meta } : undefined } : {},
            position: { x: n.position?.x || 0, y: n.position?.y || 0 },
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

        // [v0.2.28] Render Clusters first
        this.renderClusters();

        // 2. Transformation
        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(zoom, zoom);

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
        // [v0.3.13] Automatic Overlap Resolution
        if (this.isGraphDataDirty && this.nodes.length > 2 && this.nodes.length < 500) {
            this.resolveOverlaps();
        }

        // [v0.2.28] Bootstrap Bypass (Step 4/5/6)
        // Use REAL data but in a pure, deterministic way.
        if (this.bootstrapMode) {
            const contextSnapshot = {
                zoom: this.transform.zoom,
                offsetX: this.transform.offsetX,
                offsetY: this.transform.offsetY,
                showBaseLayer: this.showBaseLayer,
                showUserLayer: this.showUserLayer,
                selectedNodeIds: new Set(Array.from(this.selectedNodes).map(n => n.id)),
                selectedEdgeId: this.selectedEdge ? this.selectedEdge.id : null
            };

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
        }

        // [v0.2.24] Unified Animation Updates (Eco-mode aware)
        if (this.isAnimating || this.isTestingLogic) {
            const hasActivity = this._isInteracting || this.isDragging || (this.particles?.length || 0) > 0;
            if (hasActivity || (this._frameCounter % 2 === 0)) { // Half-rate if idle
                this.animationOffset = (this.animationOffset + 0.5) % 40;
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
            ctx.translate(this.transform.offsetX, this.transform.offsetY);
            ctx.scale(this.transform.zoom, this.transform.zoom);

            const zoom = this.transform.zoom;

            if (this.currentMode === 'tree') {
                this.treeRenderer.renderTree(this.ctx, this.treeData, this.transform);
            } else if (this.currentMode === 'flow') {
                this.flowRenderer.renderFlow(this.ctx, this.flowData);

                // [New] Render Flow Type Indicator
                const type = this.flowData.type === 'internal' ? '🔍 INTERNAL LOGIC' : '🌐 GLOBAL ARCHITECTURE';
                const color = this.flowData.type === 'internal' ? '#b8bb26' : '#83a598';
                this.ctx.fillStyle = color;
                this.ctx.font = 'bold 16px Inter, sans-serif';
                this.ctx.fillText(`MODE: ${type}`, 20, 40);

            } else {
                // Graph 모드: 그리드 -> 클러스터 -> 엣지 -> 노드 순으로 렌더링
                // [v0.2.25] Forced 2D layer for clusters (Option 4)
                this.renderGrid();
                this.renderClusters();
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
                    // [v0.2.25] Final Logic: Use WebGL only in Graph mode IF Accel is ON
                    if (this.webglEnabled && this.webglRenderer && this.currentMode === 'graph') {
                        // [v0.2.31] Final Consolidated WebGL Render call
                        if (this.isGraphDataDirty || !this._visibleNodesCache) {
                            const isUserLogic = (n) => 
                                n.layer === 'user' || 
                                (n.data && n.data.layer === 'user') || 
                                (n.id && typeof n.id === 'string' && n.id.startsWith('node_manual_'));

                            this._visibleNodesCache = this.nodes.filter(n => {
                                const isUser = isUserLogic(n);
                                // If base layer is hidden, and node is NOT user logic, skip.
                                if (!isUser && !this.showBaseLayer) return false;
                                // If user layer is hidden, and node IS user logic, skip.
                                if (isUser && !this.showUserLayer) return false;

                                // [v0.2.27] Sync: Skip nodes in collapsed clusters (matches 2D behavior)
                                const clusterId = n.cluster_id || n.data?.cluster_id;
                                if (clusterId) {
                                    const cluster = this.clusters?.find(c => c.id === clusterId);
                                    if (cluster && cluster.collapsed) return false;
                                }
                                return true;
                            });

                            const visibleNodeIds = new Set(this._visibleNodesCache.map(n => n.id));
                            this._visibleEdgesCache = this.edges.filter(e => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to));
                        }

                        const selectedIds = new Set(Array.from(this.selectedNodes).map(n => n.id));

                        // [v0.3.2] Ensure overlay is visible and active only in graph mode
                        const overlay = document.getElementById('webgl-overlay-canvas');
                        if (overlay && overlay.style.display === 'none') {
                            overlay.style.display = 'block';
                            this.isGraphDataDirty = true;
                        }

                        this.webglRenderer.render(
                            this._visibleNodesCache,
                            this.transform,
                            this.isGraphDataDirty,
                            this._visibleEdgesCache,
                            this.nodeMap,
                            this.isEdgeDirty,
                            this.isTextDirty,
                            selectedIds
                        );

                        // [v0.2.33] 🚀 Hybrid Rendering: Render badges and interactive markers on 2D ctx ON TOP of WebGL
                        // This ensures information parity for Badges/Arrows/Glow that WebGL lacks.
                        this.ctx.save();
                        // [v0.3.2] Align coordinates with DPR scaling (matches 2D background)
                        const dpr = window.devicePixelRatio || 1;
                        this.ctx.setTransform(this.transform.zoom * dpr, 0, 0, this.transform.zoom * dpr, this.transform.offsetX * dpr, this.transform.offsetY * dpr);
                        for (const edge of this._visibleEdgesCache) {
                            this.renderEdgeBadges(this.ctx, edge); // Only the numbers/badges
                        }
                        this.ctx.restore();

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
                        // [v0.3.9] Fixed 2D Mode: Explicitly call Node rendering
                        this.renderHotspots2D(); // [v0.3.20] Background functional areas
                        this.renderEdges2D();
                        this.renderNodes2D(zoom);
                        this.renderLabels2D();
                    }

                    this.renderGhostNodes(zoom);
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
                document.getElementById('zoom-level').textContent = `${(zoom * 100).toFixed(0)}%`;
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
                this.ctx.arc(this._debugLastWorldClick.x, this._debugLastWorldClick.y, 5 / zoom, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1 / zoom;
                this.ctx.stroke();
            }

            this.renderDebugInfo();

        } finally {
            if (this.webglRenderer) {
                this.webglRenderer.endFrame();
            }
            this.isRendering = false;
        }
    }

    renderEdges2D() {
        const zoom = this.transform.zoom;
        // [v0.3.20] Allow extreme zoom levels to still show edges with simplified rendering
        // using a lower threshold. This avoids a blank-edges state where only validation icons appear.
        if (zoom <= 0.15) return;

        const offsetX = this.transform.offsetX;
        const offsetY = this.transform.offsetY;
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);

        // Pre-calculate viewport bounds in world coordinates
        const worldLeft = -offsetX / zoom;
        const worldTop = -offsetY / zoom;
        const worldRight = (canvasWidth - offsetX) / zoom;
        const worldBottom = (canvasHeight - offsetY) / zoom;
        const nodeSizePadding = 150; // Use a bit of padding for safety

        this._confirmBadgeHits = [];
        this._deleteBadgeHits = [];
        this._visibleEdgesCache = []; // Reset for this frame

        // Step 1: Destination-based Bundling Grouping
        const bundles = new Map();
        for (const edge of this.edges) {
            const srcNode = this.nodeMap.get(edge.from);
            const tgtNode = this.nodeMap.get(edge.to);
            if (srcNode && tgtNode) {
                // Culling Check
                const srcVisible = !(srcNode.position.x + 120 < worldLeft || srcNode.position.x > worldRight || srcNode.position.y + 60 < worldTop || srcNode.position.y > worldBottom);
                const tgtVisible = !(tgtNode.position.x + 120 < worldLeft || tgtNode.position.x > worldRight || tgtNode.position.y + 60 < worldTop || tgtNode.position.y > worldBottom);
                if (!srcVisible && !tgtVisible) continue;

                this._visibleEdgesCache.push(edge);
                
                // Group by Target Cluster
                const targetClusterId = tgtNode.cluster_id || 'unmapped';
                if (!bundles.has(targetClusterId)) bundles.set(targetClusterId, []);
                bundles.get(targetClusterId).push(edge);
            }
        }

        // Step 2: Pre-calculate Cluster-weighted Control Points
        // We calculate one center point for each target cluster group
        this.edgeGroupsCP = new Map();
        for (const [clusterId, group] of bundles.entries()) {
            if (group.length < 4) continue; // Threshold for bundling
            
            const cluster = this.clusters.find(c => c.id === clusterId);
            if (!cluster || !cluster.position) continue;

            const clusterCenterX = cluster.position.x + cluster.width / 2;
            const clusterCenterY = cluster.position.y + cluster.height / 2;

            this.edgeGroupsCP.set(clusterId, { x: clusterCenterX, y: clusterCenterY });
        }

        // Step 3: Draw the edges
        for (const edge of this._visibleEdgesCache) {
            const srcNode = this.nodeMap.get(edge.from);
            const tgtNode = this.nodeMap.get(edge.to);
            if (!srcNode || !tgtNode) continue;

            const isUserLogic = (n) => 
                n.layer === 'user' || 
                (n.data && n.data.layer === 'user') || 
                n.id.startsWith('node_manual_');

            if ((isUserLogic(srcNode) && !this.showUserLayer) || (!isUserLogic(srcNode) && !this.showBaseLayer)) continue;
            if ((isUserLogic(tgtNode) && !this.showUserLayer) || (!isUserLogic(tgtNode) && !this.showBaseLayer)) continue;
            
            this.renderEdge(edge);
        }
    }

    // [v0.3.9] Dedicated 2D Node Rendering function to prevent blank screen
    renderNodes2D(zoom) {
        const dpr = window.devicePixelRatio || 1;
        let canvasWidth = this.canvas.width / dpr;
        let canvasHeight = this.canvas.height / dpr;

        // [FIX v0.3.09] Safety check: invalid canvas dimensions
        // Canvas height가 0이면 이후 모든 계산이 0으로 고정되어 노드가 범위 밖으로 인식됨
        if (canvasWidth === 0 || canvasHeight === 0) {
            console.warn('[SYNAPSE] renderNodes2D: invalid canvas dimensions detected',
                `${canvasWidth}x${canvasHeight}, forcing resize`);
            this.resizeCanvas(true);  // Force immediate resize and retry next frame
            return;  // Skip rendering this frame to avoid errors
        }

        const worldLeft = -this.transform.offsetX / zoom;
        const worldTop = -this.transform.offsetY / zoom;
        const worldRight = (canvasWidth - this.transform.offsetX) / zoom;
        const worldBottom = (canvasHeight - this.transform.offsetY) / zoom;
        const margin = 200; // Increased safety margin for culling

        // [v0.3.20 Fix] Viewport culling disabled for absolute safety in v0.3.20
        for (const node of this.nodes) {
            if (!node.position) continue;

            // Temporary Bypass of Culling to ensure all nodes (External Ghosts, etc) are visible
            // if (node.position.x + 120 + margin < worldLeft || node.position.x - margin > worldRight || ...)


            const isUserCustom = 
                node.layer === 'user' || 
                (node.data && node.data.layer === 'user') || 
                (node.id && node.id.startsWith('node_manual_'));

            if (isUserCustom && !this.showUserLayer) continue;
            if (!isUserCustom && !this.showBaseLayer) continue;

            if (node.cluster_id) {
                const cluster = this.clusters.find(c => c.id === node.cluster_id);
                if (cluster && cluster.collapsed) continue;
            }
            this.renderNode(node, zoom);
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


    toggleClusterCollapse(clusterId) {
        const cluster = this.clusters.find(c => c.id === clusterId);
        if (cluster) {
            cluster.collapsed = !cluster.collapsed;
            console.log(`[SYNAPSE] Toggled cluster ${cluster.label}: ${cluster.collapsed ? 'Collapsed' : 'Expanded'}`);
            this.isGraphDataDirty = true; // [v0.2.27] Sync WebGL visibility
            this.render();
            this.saveState();
        }
    }

    renameCluster(clusterId) {
        const cluster = this.clusters.find(c => c.id === clusterId);
        if (cluster) {
            const newName = prompt("Rename group:", cluster.label);
            if (newName !== null && newName.trim() !== "") {
                cluster.label = newName;
                this.render();
                this.saveState();
            }
        }
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
        // 로컬 상태에서 엣지 객체 찾기
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
            return; // Only delete locally if the backend says so later
        }

        // Normal View mode: safe visual-only delete
        this.edges.splice(edgeIndex, 1);
        this.selectedEdge = null;

        // 백엔드에 삭제 메시지 전송
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'deleteEdge',
                edgeId: edgeId
            });
        }

        console.log('[SYNAPSE] Edge deleted:', edgeId);
        this.saveState(); // [v0.2.18] Ensure state is saved after deletion so it doesn't revert
        this.render();
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
                maxY = Math.max(...this.nodes.map(n => n.position.y + 60));
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
                maxX = Math.max(...this.nodes.map(n => n.position.x + 120));
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
        this.ctx.strokeStyle = '#333333'; // Contrast increase
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
    renderClusters() {
        if (!this.clusters || this.clusters.length === 0) return;

        // 계층 구조에 따른 그리기 순서 결정 (부모를 먼저 그려서 자식이 위에 오게 함)
        // 하지만 실제로는 바운딩 박스를 자식 노드+자식 클러스터 기준으로 먼저 계산해야 함

        // 1. 모든 클러스터의 '계산된 바운드' 초기화
        const computedBounds = new Map();

        // 2. 바닥 수준(자식 클러스터가 없는)부터 위로 올라가며 바운드 계산
        // (단순화를 위해 여기서는 매 프레임 노드 위치 기준으로 재계산)
        const getClusterBounds = (cluster) => {
            if (computedBounds.has(cluster.id)) return computedBounds.get(cluster.id);

            // [v0.3.11] cluster_id 일치 + 빈 문자열 제외 + 현재 레이어 가시성도 반영
            const directNodes = this.nodes.filter(n => {
                const cid = n.cluster_id || (n.data && n.data.cluster_id) || '';
                if (cid !== cluster.id || cid === '') return false;
                // 레이어 가시성 체크: 현재 렌더링되지 않는 노드는 바운드 계산에서 제외
                const isUserNode = n.layer === 'user' || (n.data && n.data.layer === 'user') || n.status === 'pending';
                if (isUserNode && !this.showUserLayer) return false;
                if (!isUserNode && !this.showBaseLayer) return false;
                return true;
            });

            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            const padding = 30;

            // 직계 노드들 포함
            for (const node of directNodes) {
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + 120);
                maxY = Math.max(maxY, node.position.y + 60);
            }

            // 자식 클러스터들 포함
            const childClusters = this.clusters.filter(c => c.parent_id === cluster.id);
            for (const child of childClusters) {
                const b = getClusterBounds(child);
                if (b.minX !== Infinity) {
                    minX = Math.min(minX, b.minX - padding);
                    minY = Math.min(minY, b.minY - padding);
                    maxX = Math.max(maxX, b.maxX + padding);
                    maxY = Math.max(maxY, b.maxY + padding);
                }
            }

            // [v0.3.11] 시스템 루트 특별 예외: 수동 클러스터와 겹치는 경우 자동 수축
            if (cluster.id === 'cluster_root' && minX !== Infinity) {
                // 루트는 기본 파일 계층만 보여주고 대규모 중첩은 피함
            }

            const bounds = { minX, minY, maxX, maxY };
            computedBounds.set(cluster.id, bounds);
            return bounds;
        };

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

        const sortedClusters = [...this.clusters].sort((a, b) => getDepth(a) - getDepth(b));

        for (const cluster of sortedClusters) {
            // [v0.2.18.3] Isolate Context Vault unless toggled ON
            if (cluster.id === 'context_vault' && !this.showContextVault) continue;

            // [v0.3.11] Layer Visibility - Use EXPLICIT layer tag from backend
            const clusterLayer = cluster.layer || (cluster.data && cluster.data.layer) || 'ai';
            
            if (clusterLayer === 'user' && !this.showUserLayer) {
                continue;
            }
            if (clusterLayer === 'ai' && !this.showBaseLayer) {
                // UI Filter: AI clusters hidden (Project Root, etc)
                // [v0.3.11] context_vault exception should be explicit
                if (cluster.id !== 'context_vault') {
                    continue;
                }
            }

            const b = getClusterBounds(cluster);
            if (b.minX === Infinity) continue;

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
                // Collapsed (Header only)
                const headerHeight = 30;
                this.ctx.fillStyle = cluster.color || '#458588';
                this.ctx.fillRect(minX - padding, minY - padding - headerHeight, (maxX - minX) + padding * 2, headerHeight);

                this.ctx.fillStyle = '#282828';
                this.ctx.font = `bold ${14 / this.transform.zoom}px Inter, sans-serif`;
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`[+] ${cluster.label}`, minX - padding + 10, minY - padding - headerHeight / 2);
            } else {
                // Expanded
                const headerHeight = 30;

                // Header
                this.ctx.fillStyle = (cluster.color || '#458588');
                this.ctx.fillRect(minX - padding, minY - padding - headerHeight, (maxX - minX) + padding * 2, headerHeight);

                // Body background
                this.ctx.fillStyle = (cluster.color || '#458588') + '10'; // 6% alpha
                this.ctx.fillRect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);

                // Border
                this.ctx.strokeStyle = cluster.color || '#458588';
                this.ctx.lineWidth = 1.5 / this.transform.zoom;
                this.ctx.strokeRect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);

                // Label
                this.ctx.fillStyle = '#282828';
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
        }
    }

    renderGhostNodes(zoom) {
        if (!this.baselineNodes) return;

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

        for (const ghost of this.baselineNodes) {
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
    drawNodeShape(ctx, x, y, width, height, typeLabel) {
        ctx.beginPath();
        if (typeLabel === 'Decision') {
            // Diamond
            ctx.moveTo(x + width / 2, y);
            ctx.lineTo(x + width, y + height / 2);
            ctx.lineTo(x + width / 2, y + height);
            ctx.lineTo(x, y + height / 2);
        } else if (typeLabel === 'Loop') {
            // Hexagon
            const offset = 20;
            ctx.moveTo(x + offset, y);
            ctx.lineTo(x + width - offset, y);
            ctx.lineTo(x + width, y + height / 2);
            ctx.lineTo(x + width - offset, y + height);
            ctx.lineTo(x + offset, y + height);
            ctx.lineTo(x, y + height / 2);
        } else if (typeLabel === 'Print') {
            // Parallelogram
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
            // Standard Rectangle
            ctx.rect(x, y, width, height);
        }
        ctx.closePath();
    }

    /**
     * 노드 타입별 스타일 가져오기 (Phase 3.5: Identity)
     */
    getNodeStyle(node) {
        const defaultStyle = {
            borderColor: '#a89984',
            bgColor: '#3c3836',
            icon: '{}',
            lineWidth: 2,
            typeLabel: 'Logic'
        };

        // [v0.3.19] Role-based Border Overlays
        const stats = this.nodeStatsMap.get(node.id);
        if (stats && stats.primaryRole) {
            const ROLE_COLOR = {
                'Orchestrator (fan-out)': '#FF8C00',
                'Controller (fan-in)':   '#4CAF50',
                'Hub (high connectivity)': '#2196F3',
                'Leaf node':         '#9E9E9E'
            };
            const roleColor = ROLE_COLOR[stats.primaryRole];
            if (roleColor) {
                defaultStyle.borderColor = roleColor;
                if (stats.primaryRole !== 'Leaf node') {
                    defaultStyle.glow = true;
                    defaultStyle.lineWidth = 3.5;
                }
            }
        }

        const typeMap = {
            // [v0.2.14] Standard Entities
            'source': { borderColor: '#a89984', bgColor: node.data?.color || '#3c3836', icon: '📄', lineWidth: 2, typeLabel: 'File' },
            'logic': { borderColor: '#a89984', bgColor: node.data?.color || '#3c3836', icon: '📄', lineWidth: 2, typeLabel: 'File' },
            'config': { borderColor: '#83a598', bgColor: node.data?.color || '#076678', icon: '📄', lineWidth: 4, typeLabel: 'Data' },
            'data': { borderColor: '#83a598', bgColor: node.data?.color || '#076678', icon: 'DB', lineWidth: 4, typeLabel: 'Data' },
            'entry': { borderColor: '#fe8019', bgColor: node.data?.color || '#3c3836', icon: '⚡', lineWidth: 2.5, glow: true, typeLabel: 'Trigger' },
            'trigger': { borderColor: '#fe8019', bgColor: node.data?.color || '#3c3836', icon: '⚡', lineWidth: 2.5, glow: true, typeLabel: 'Trigger' },
            'external': { borderColor: '#8ec07c', bgColor: node.data?.color || 'rgba(40, 40, 40, 0.7)', icon: '☁', lineWidth: 2, dash: [5, 5], typeLabel: 'External' },
            'documentation': { borderColor: '#fabd2f', bgColor: node.data?.color || '#3c3836', icon: '📄', lineWidth: 2, typeLabel: 'Doc' },
            'test': { borderColor: '#fe8019', bgColor: node.data?.color || '#3c3836', icon: '🧪', lineWidth: 2, typeLabel: 'Test' },
            'component': { borderColor: '#83a598', bgColor: node.data?.color || '#3c3836', icon: '🧩', lineWidth: 3, typeLabel: 'Component' },
            'folder': { borderColor: '#d79921', bgColor: node.data?.color || '#3c3836', icon: '📁', lineWidth: 2, typeLabel: 'Folder' }
        };

        // 파일명이나 경로를 보고 Entry 포인트를 동적으로 판단 (Main gate)
        const filePath = node.data?.file || '';
        if (filePath.match(/(main|app|index|server)\.(ts|js|py)$/i)) {
            return typeMap['entry'];
        }

        // --- New Logic: Identify If/For/While/Print based on Label and Type ---
        const label = (node.data?.label || '').toLowerCase();
        const type = node.type || '';

        // Print 노드 감지
        if (label.startsWith('print:') || label.startsWith('print ') || label.startsWith('console.log') || label === 'print' || label.startsWith('call: print') || label.startsWith('call: console.log')) {
            return {
                borderColor: '#b8bb26', // Green
                bgColor: '#3c3836',
                icon: '🖨️', // or '💬'
                lineWidth: 2,
                typeLabel: 'Print'
            };
        }

        // Loop (For/While) 노드 감지
        if (type === 'for' || type === 'while' || label.startsWith('for ') || label.startsWith('while ') || label === 'for' || label === 'while' || label === 'loop') {
            return {
                borderColor: '#fe8019', // Orange
                bgColor: '#3c3836',
                icon: '↻',
                lineWidth: 2,
                typeLabel: 'Loop'
            };
        }

        // Decision (If/Switch/Decision) 감지
        if (type === 'decision' || type === 'if' || type === 'switch' || label.startsWith('if ') || label.startsWith('switch ') || label === 'if' || label === 'switch') {
            return {
                borderColor: '#fabd2f', // Yellow
                bgColor: '#3c3836',
                icon: '◈',
                lineWidth: 2,
                typeLabel: 'Decision'
            };
        }

        // --- Filename Semantics Fallback (Existing) ---
        const fileName = (node.data?.file || '').toLowerCase();

        // Loop/Iterator Semantic
        if (fileName.includes('loop') || fileName.includes('iter')) {
            return {
                borderColor: '#fe8019',
                bgColor: '#3c3836',
                icon: '↻',
                lineWidth: 2,
                typeLabel: 'Loop'
            };
        }

        // Decision/Validation Semantic
        if (fileName.includes('valid_') || fileName.includes('validator') || fileName.includes('checker') || fileName.includes('router') || fileName.startsWith('is_')) {
            return {
                borderColor: '#fabd2f',
                bgColor: '#3c3836',
                icon: '◈',
                lineWidth: 2,
                typeLabel: 'Decision'
            };
        }

        // --- New v0.2.16 Node Types ---
        const v16TypeMap = {
            'component': {
                borderColor: '#b16286', // Component Style
                bgColor: '#3c3836',
                icon: '🧩',
                lineWidth: 2.5,
                typeLabel: 'Comp'
            },
            'processor': {
                borderColor: '#b16286', // Purple
                bgColor: '#3c3836',
                icon: '⚙️',
                lineWidth: 2.5,
                typeLabel: 'Proc'
            },
            'service': {
                borderColor: '#458588', // Blue
                bgColor: '#3c3836',
                icon: '🤝',
                lineWidth: 2.5,
                typeLabel: 'Serv'
            },
            'gate': {
                borderColor: '#d79921', // Yellow-ish
                bgColor: '#3c3836',
                icon: '⛩️',
                lineWidth: 3,
                typeLabel: 'Gate'
            },
            'trigger': {
                borderColor: '#cc241d', // Red
                bgColor: '#3c3836',
                icon: '⚡',
                lineWidth: 2,
                glow: true,
                typeLabel: 'Trig'
            },
            'data': {
                borderColor: '#83a598', // Blue
                bgColor: '#076678', // Dark Blue
                icon: '📋',
                lineWidth: 4, // 두꺼운 테두리
                typeLabel: 'Data'
            }
        };

        if (v16TypeMap[type]) {
            return v16TypeMap[type];
        }

        return typeMap[type] || defaultStyle;
    }

    renderNode(node, zoom) {
        if (!node || !node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
            return;
        }

        // [v0.3.19] Noise Control: Hide Leaf Nodes
        if (this.hideLeafNodes) {
            const stats = this.nodeStatsMap.get(node.id);
            if (stats && stats.primaryRole === 'Leaf node') return;
        }

        // [v0.3.19] Strategic Visibility: Top-N Focus View
        if (this.focusTopNodes) {
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
        if (this.focusTopNodes) {
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
        this.ctx.translate(node.position.x + jitterX, node.position.y + jitterY);

        const x = 0;
        const y = 0;
        const nodeWidth = 120;
        const nodeHeight = 60;

        // Level 1: Satellite View
        if (zoom < 0.4) {
            this.ctx.fillStyle = node.data.color || '#458588';
            this.ctx.beginPath();
            this.ctx.arc(nodeWidth / 2, nodeHeight / 2, 8 / zoom, 0, Math.PI * 2);
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
        if (isPartofActivePath) opacity = 1.0;
        this.ctx.globalAlpha = opacity;

        // 🌟 하이라이트 글로우 효과 (최적화: 기본 OFF, 선택/호버 시만 활성)
        if ((isSelected || isHovered) && zoom > 0.5) {
            this.ctx.shadowBlur = 15 + 5 * Math.sin(Date.now() / 200);
            this.ctx.shadowColor = isSelected ? '#fabd2f' : style.borderColor;
        }

        // 1. 상태별 특수 효과 계산
        const isTombstone = node.status === 'error_tombstone' || (node.data?.issues?.some(i => i.includes('Tombstone')));

        if ((node.status === 'error_necrosis' || isTombstone) && zoom > 0.4) {
            style.bgColor = '#1d2021'; // Dark Necrosis Base
            style.borderColor = '#fb4934'; // Red Border
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#fb4934';
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

        // [v0.2.22/v0.2.25] Node Status & High DTR Glow Override (Conventions)
        // [v0.2.22/v0.2.26] Node Status & High DTR Glow Override
        if (node.status === 'active') {
            borderColor = '#83a598';
            node.visual.opacity = 1.0; // Ensure full visibility
        } else if (node.status === 'ghost') {
            borderColor = '#928374'; // Ghost Gray
            dash = [5, 5];           // Dashed line
        } else if (node.status === 'deleted') {
            borderColor = '#282828'; // Dark Gray
            bgColor = 'rgba(40, 40, 40, 0.4)';
        } else if (node.status === 'warning' || node.isError) {
            borderColor = '#fb4934'; // Error Red
            glowColor = '#fb4934';
        } else if (node.status === 'error_necrosis' || node.status === 'error_tombstone') {
            borderColor = '#1d2021';
            bgColor = '#1d2021';
        }

        // High DTR Logic Pulse (Overwrites status glow if significant)
        const dtr = (node.intelligence && node.intelligence.dtr !== undefined) ? node.intelligence.dtr : this.currentDTR;
        if (dtr >= 0.7) {
            glowColor = '#8a2be2'; // Significant DTR Purple Glow
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
                // Morph from Yellow (#fabd2f) to Green (#b8bb26)
                bgColor = this._lerpColor('#fabd2f', '#b8bb26', ratio);
                borderColor = '#b8bb26';
                glowColor = '#8ec07c'; // Aqua glow
                if (!this.isDragging) {
                    this.ctx.shadowBlur = 20 * (1 - ratio) + 10;
                    this.ctx.shadowColor = glowColor;
                }
            } else {
                this.promotingNodeIds.delete(node.id);
            }
        }

        if (node.state === 'error') {
            borderColor = '#fb4934';
            lineWidth += 1.5;
            glowColor = '#fb4934';
        } else if (node.state === 'pending' || node.status === 'proposed') {
            dash = [5, 5];
            const pulse = 0.4 + 0.6 * Math.sin(Date.now() / 400);
            borderColor = `rgba(235, 219, 178, ${pulse})`;
            glowColor = `rgba(235, 219, 178, ${pulse * 0.3})`;
        } else if (node.status === 'ghost' || node.data?.status === 'ghost') {
            // [v0.2.19] Ghost Node style: dashed border, lower opacity, no glow
            dash = [4, 4];
            borderColor = '#928374'; // Grayish
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
            glowColor = '#8A2BE2'; // Purple
        }

        if (isSelected) {
            borderColor = '#fabd2f';
            lineWidth = 3;
            // Only set glow to yellow if it's not a DTR glowing node
            if (!isDtrGlow) {
                glowColor = '#fabd2f';
            }
        }

        // Logic Analysis Auras
        if (node.isVirtualDebugError) {
            // [v0.2.21 Fix B1] Virtual Debug Error → Cyan Scanner Aura
            // Distinct from LogicAnalyzer errors (those are red/orange)
            const scanPhase = Date.now() / 120;
            borderColor = '#83a598'; // Gruvbox Teal/Cyan
            lineWidth = 3;
            glowColor = `rgba(131, 165, 152, ${0.5 + 0.4 * Math.abs(Math.sin(scanPhase))})`;
            // Scanner line effect: oscillating shadow
            this.ctx.shadowOffsetY = Math.sin(scanPhase) * 3;
        } else if (node.isError) {
            borderColor = '#fb4934';
            lineWidth = 3;
            glowColor = '#fb4934';
        } else if (node.isBottleneck) {
            borderColor = '#fe8019';
            lineWidth = 3;
            glowColor = '#fe8019';
        } else if (node.isArchViolation) {
            // [v0.2.21 Fix] Architecture Violation → Ghost Jitter (Yellow Warning Aura)
            const jitterPhase = Date.now() / 180;
            const jitter = Math.sin(jitterPhase) * 2;
            borderColor = '#fabd2f'; // Gruvbox Yellow
            lineWidth = 2;
            glowColor = `rgba(250, 189, 47, ${0.4 + 0.3 * Math.abs(Math.sin(jitterPhase))})`;
            // Ghost Jitter: apply subtle positional offset via shadow
            this.ctx.shadowOffsetX = jitter;
            this.ctx.shadowOffsetY = jitter * 0.5;
        }

        if (node.isIsolated || node.isDeadEnd) {
            this.ctx.globalAlpha *= 0.4;
        }

        // [v0.3.15] Shelf Search Highlight (fzf Center-on)
        if (node.isHighlighted) {
            const hPulse = 0.5 + 0.5 * Math.sin(Date.now() / 150);
            this.ctx.shadowBlur = 40 + 20 * hPulse;
            this.ctx.shadowColor = '#fabd2f';
            borderColor = '#fabd2f';
            lineWidth += 4;
            opacity = 1.0;
            this.ctx.globalAlpha = 1.0;
        }

        // 2. 배경 및 글로우 렌더링
        this.ctx.save();

        // [v0.2.21 Fix] Reset shadow offset before applying (prevent bleed)
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Apply Glow logic (priority order: DTR > VirtualDebug > Promoting > ArchViolation > Selected/Error)
        if (!this.isDragging) {
            if (isDtrGlow && dtrPulse !== null) {
                this.ctx.shadowBlur = 50 * dtrPulse * (node.visual?.glow_intensity || 1);
                this.ctx.shadowColor = '#8A2BE2';
            } else if (node.isVirtualDebugError && glowColor) {
                // [v0.2.21 Fix B1] Virtual Debug: pulsing Cyan scanner beam
                const scanPhase = Date.now() / 120;
                this.ctx.shadowBlur = 18 + 8 * Math.abs(Math.sin(scanPhase));
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowOffsetY = Math.sin(scanPhase) * 3;
            } else if (isPromoting) {
                // Shadow already set in promotion block above
            } else if (node.isArchViolation && glowColor) {
                // [v0.2.21 Fix] Ghost Jitter: animated shadow offset + pulsing glow for arch violations
                const jitterPhase = Date.now() / 180;
                this.ctx.shadowBlur = 12 + 6 * Math.abs(Math.sin(jitterPhase));
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowOffsetX = Math.sin(jitterPhase) * 2;
                this.ctx.shadowOffsetY = Math.sin(jitterPhase * 0.7) * 1;
            } else if (glowColor && (isSelected || node.isError || node.isBottleneck || (isPartofActivePath && this.isAnimating))) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = glowColor;
            }
        }

        this.ctx.fillStyle = bgColor;
        this.drawNodeShape(this.ctx, x, y, nodeWidth, nodeHeight, style.typeLabel);
        this.ctx.fill();

        // 🎨 [v0.2.20] Necrosis Overlay (Necrotic Core & Static Noise)
        if (node.status === 'error_necrosis') {
            const centerX = x;
            const centerY = y;
            const radius = Math.min(nodeWidth, nodeHeight) * 0.45;

            this.ctx.save();
            // 1. Necrotic Core (Radial Gradient: Black to Dark Purple/Red)
            const grad = this.ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radius);
            grad.addColorStop(0, '#000000');
            grad.addColorStop(0.6, 'rgba(138, 43, 226, 0.4)'); // Purple necrosis
            grad.addColorStop(1, 'rgba(251, 73, 52, 0)'); // Fades out

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. High-intensity Static Noise (Digital Decay)
            this.ctx.globalAlpha = 0.3 * (0.8 + 0.2 * Math.sin(Date.now() / 50)); // Flickering noise
            this.ctx.fillStyle = '#ebdbb2'; // Light noise
            for (let i = 0; i < 60; i++) {
                const rx = x - nodeWidth / 2 + Math.random() * nodeWidth;
                const ry = y - nodeHeight / 2 + Math.random() * nodeHeight;
                const rSize = 1 + Math.random() * 2;
                this.ctx.fillRect(rx, ry, rSize, rSize);
            }
            this.ctx.restore();

            // Highlight the necrotic state further
            borderColor = '#1d2021';
            lineWidth = 4;

            // Draw Skull centerpiece
            if (zoom > 0.8) {
                this.ctx.fillStyle = '#fb4934';
                this.ctx.font = 'bold 28px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('💀', x + nodeWidth / 2, y + nodeHeight / 2 - 5);
            }
        }

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = lineWidth;

        // [New] Documentation Shelf 노드는 항상 은은한 노란색 아우라 부여
        if (node.cluster_id === 'doc_shelf' && !isSelected) {
            glowColor = '#fabd2f';
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

        this.drawNodeShape(this.ctx, x, y, nodeWidth, nodeHeight, style.typeLabel);
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;

        // 3. 우측 상단 'Dirty' 도트 (수정됨/싱크 필요)
        if (node.state === 'dirty' || node.isDirty) {
            this.ctx.fillStyle = '#fb4934'; // Red Dot
            this.ctx.beginPath();
            this.ctx.arc(x + nodeWidth - 5, y + 5, 4, 0, Math.PI * 2);
            this.ctx.fill();
            // 도트 외곽선
            this.ctx.strokeStyle = '#ebdbb2';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // 4. 타입별 아이콘 (Identity) - LOD 연동
        if (zoom > 1.2) {
            this.ctx.fillStyle = borderColor;
            this.ctx.font = 'bold 12px Inter, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(style.icon, x + 5, y + 5);
        }

        // 5. 중앙 에러 아이콘 (Error state)
        if (node.state === 'error' && zoom > 0.8) {
            this.ctx.fillStyle = '#fb4934';
            this.ctx.font = 'bold 24px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⚠️', x + nodeWidth / 2, y + nodeHeight / 2 - 5);
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
                this.ctx.fillText('Commander, approve?', x + nodeWidth / 2, y + nodeHeight - 8);
            }
        }

        // Level 3: Detail View & Deep LOD
        if (zoom > 1.5) {
            this.ctx.fillStyle = '#ebdbb2';
            this.ctx.font = 'bold 11px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.data.label, x + nodeWidth / 2, y + 15);



            // 구분선
            this.ctx.strokeStyle = '#504945';
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
                this.ctx.fillStyle = '#fabd2f'; // Yellowish for logical items
                const items = [...(classes || []), ...(functions || [])];
                items.slice(0, 3).forEach(item => {
                    this.ctx.fillText(`• ${item}`, x + 10, offsetY);
                    offsetY += 10;
                });
            }
            // 2. Data Node: Tables/Schema Keys
            else if ((node.type === 'data' || node.type === 'config') && node.data.summary) {
                const { tables, keys } = node.data.summary;
                this.ctx.fillStyle = '#83a598'; // Blue for data items
                const items = [...(tables || []), ...(keys || [])];
                items.slice(0, 3).forEach(item => {
                    this.ctx.fillText(`◆ ${item}`, x + 10, offsetY);
                    offsetY += 10;
                });
            }
            // 3. External Node: Status/Latency
            else if (node.type === 'external' && node.data.summary) {
                const { status, latency } = node.data.summary;
                this.ctx.fillStyle = '#fe8019';
                if (status) {
                    this.ctx.fillText(`Status: ${status}`, x + 10, offsetY);
                    offsetY += 10;
                }
                if (latency) {
                    this.ctx.fillText(`Latency: ${latency}ms`, x + 10, offsetY);
                    offsetY += 10;
                }
            } else if (node.status === 'proposed' || node.state === 'pending') {
                this.ctx.fillStyle = '#a89984';
                this.ctx.fillText('⚡ Awaiting Approval', x + 10, offsetY);
                offsetY += 12;
                this.ctx.font = '8px Inter, sans-serif';
                this.ctx.fillText('Click [V] to start deep scan', x + 10, offsetY);
            } else {
                this.ctx.fillStyle = '#a89984';
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
            const y = node.position.y;
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
        // [v0.2.16] Extract Weight and Type
        const type = edge.type || 'dependency';
        const weight = typeof edge.weight === 'number' ? edge.weight : 0; // Default weight 0


        const styles = {
            'dependency': { color: '#ebdbb2', dashPattern: null, lineWidth: 2.0, arrowStyle: 'standard' },
            'data_flow': { color: '#83a598', dashPattern: null, lineWidth: 3.0, arrowStyle: 'thick' },
            'event': { color: '#fe8019', dashPattern: null, lineWidth: 2.0, arrowStyle: 'standard' },
            'conditional': { color: '#d3869b', dashPattern: null, lineWidth: 1.0, arrowStyle: 'standard' },
            'origin': { color: '#d65d0e', dashPattern: null, lineWidth: 1.5, arrowStyle: 'standard' },
            'api_call': { color: '#8ec07c', dashPattern: [4, 4], lineWidth: 2.0, arrowStyle: 'standard' },
            'db_query': { color: '#d3869b', dashPattern: null, lineWidth: 3.0, arrowStyle: 'thick' },
            'loop_back': { color: '#fe8019', dashPattern: [1, 3], lineWidth: 2.0, arrowStyle: 'standard' }
        };

        const style = { ... (styles[type] || styles['dependency']) };

        // [v0.2.16] Apply Weight Dynamics (Thickness increases by 1 for every weight unit)
        if (weight > 0) {
            style.lineWidth += (weight * 0.8); // 0.8 pixel per weight unit increment
        }

        // [v0.2.20] Apply DTR (Deep Thought Ratio) weighted visual tension
        const dtr = (edge.intelligence && edge.intelligence.dtr !== undefined)
            ? edge.intelligence.dtr
            : this.currentDTR;

        if (dtr >= 0.7) {
            // High pressure (Inference Weight Expansion)
            style.borderColor = '#8A2BE2'; // Violet for Deep Thinking
            style.glow = true;
            style.lineWidth += (dtr - 0.7) * 8; // Doubled weight scaling (+ρ)
            style.glowIntensity = (dtr - 0.7) * 2;
        } else if (dtr >= 0.4) {
            // Balanced (Subtle Glow)
            style.lineWidth += (dtr - 0.4) * 2;
        }

        return style;
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
        const fromNode = this.nodes.find(n => n.id === edge.from);
        const toNode = this.nodes.find(n => n.id === edge.to);

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
        for (const edge of this.edges) {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) continue;
            const fromX = fromNode.position.x + 60;
            const fromY = fromNode.position.y + 30;
            const toX = toNode.position.x + 60;
            const toY = toNode.position.y + 30;

            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2 - 30;
            if (this.isPointNearArrow(px, py, midX, midY, 20)) return edge;
        }

        for (const edge of this.edges) {
            if (this.isPointNearCurve(px, py, edge, 30)) return edge;
        }
        return null;
    }

    renderEdge(edge) {
        const fromNode = this.nodeMap.get(edge.from);
        const toNode = this.nodeMap.get(edge.to);
        if (!fromNode || !toNode) return;

        // [v0.3.19] Hide Edges connected to filtered Leaf nodes
        if (this.hideLeafNodes) {
            const fromStats = this.nodeStatsMap.get(fromNode.id);
            const toStats = this.nodeStatsMap.get(toNode.id);
            if ((fromStats && fromStats.primaryRole === 'Leaf node') || 
                (toStats && toStats.primaryRole === 'Leaf node')) return;
        }

        const isSelected = this.selectedEdge && this.selectedEdge.id === edge.id;
        const isHovered = this.hoveredEdge && this.hoveredEdge.id === edge.id;
        const isPathSelected = isSelected || isHovered || Array.from(this.selectedNodes).some(n => n.id === edge.from || n.id === edge.to) ||
            (this.hoveredNode && (this.hoveredNode.id === edge.from || this.hoveredNode.id === edge.to));

        const isEdgeHidden = window.edgeVisibilityMode === 'NO_EDGES';
        if (isEdgeHidden && !isPathSelected) return;

        if (this.focusTopNodes && !isPathSelected) {
            if (!this.focusNodeSet.has(fromNode.id) || !this.focusNodeSet.has(toNode.id)) return;
        }

        // --- 🎨 Style & Data Resolution ---
        let validation = this.edgeValidationCache.get(edge.id) || { valid: true };
        const style = this.getEdgeStyle(edge);
        const fromX = fromNode.position.x + 60;
        const fromY = fromNode.position.y + 30;
        const toX = toNode.position.x + 60;
        const toY = toNode.position.y + 30;
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;

        // [v0.3.20] Lite Bundling Logic (Cluster-weighted Approach)
        const targetNodeInternal = this.nodeMap.get(edge.to);
        const targetClusterId = targetNodeInternal?.cluster_id || 'unmapped';
        const groupCPCenter = this.edgeGroupsCP?.get(targetClusterId);
        
        let cpX = midX;
        let cpY = midY;
        let isBundled = false;

        if (groupCPCenter) {
            cpX = midX * 0.3 + groupCPCenter.x * 0.7;
            cpY = midY * 0.3 + groupCPCenter.y * 0.7;
            const seed = (edge.id.charCodeAt(edge.id.length - 1) % 20) - 10;
            cpY += seed; 
            isBundled = true;
        } else {
            cpY -= 50; 
        }

        let edgeColor = validation.valid ? style.color : validation.color;
        let lineWidth = isBundled ? 1.8 : style.lineWidth;
        
        if (edge.isCircular) {
            edgeColor = '#fb4934';
            lineWidth += 2;
        }

        // --- 1단계: 선 렌더링 ---
        this.ctx.beginPath();
        this.ctx.lineWidth = isSelected || isHovered ? 2.5 : lineWidth;
        let finalAlpha = isSelected || isHovered ? 1.0 : (isBundled ? 0.7 : (isPathSelected ? 0.5 : 0.3));
        
        if (isEdgeHidden && isPathSelected) finalAlpha = 0.3;
        if (this.focusTopNodes && !isPathSelected) {
            if (!this.focusCoreSet.has(fromNode.id) || !this.focusCoreSet.has(toNode.id)) finalAlpha *= 0.2;
        }
        
        this.ctx.globalAlpha = finalAlpha;
        this.ctx.strokeStyle = isSelected || isHovered ? '#fabd2f' : edgeColor;
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
                this.ctx.fillStyle = '#fabd2f';
                this.ctx.beginPath();
                this.ctx.arc(px, py, 4, 0, Math.PI * 2);
                this.ctx.fill();
            });
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
        if (!isBadgeHidden && this.transform.zoom > 0.4) {
            this.renderEdgeBadges(this.ctx, edge);
        }
    }


    /**
     * [v0.2.33] Hybrid Badge Rendering
     * 분리된 엣지 배지 렌더링 (2D/3D 공통 사용)
     */
    renderEdgeBadges(ctx, edge) {
        // [v0.3.16] Edge Visibility Control
        const isBadgeHidden = window.edgeVisibilityMode === 'NO_BADGES' || window.edgeVisibilityMode === 'NO_EDGES';
        if (isBadgeHidden) return;

        const fromNode = edge.srcNode || this.nodeMap.get(edge.from);
        const toNode = edge.tgtNode || this.nodeMap.get(edge.to);
        if (!fromNode || !toNode) return;

        const fromX = fromNode.position.x + 60;
        const fromY = fromNode.position.y + 30;
        const toX = toNode.position.x + 60;
        const toY = toNode.position.y + 30;

        const bMidX = (fromX + toX) / 2;
        const bMidY = (fromY + toY) / 2 - (this.transform.zoom > 1.0 ? 35 : 25);
        const badgeSize = Math.max(16, 24 / this.transform.zoom);

        // [v0.3.11] Integrated Info Badge: Type Icon + Status
        const iconMap = {
            'dependency': '🔗', 'call': '📡', 'data_flow': '📊', 'reference': '📝',
            'event': '⚡', 'conditional': '❓', 'api_call': '🌐', 'db_query': '🛢️',
            'origin': '📍', 'loop_back': '🔁'
        };
        const typeIcon = iconMap[edge.type] || '➤';
        const confirmStatus = edge.confirmStatus || (edge.status === 'pending' || edge.status === 'pending_confirm' ? 'pending_confirm' : (edge.status === 'confirmed' ? 'confirmed' : ''));
        
        const isPending = confirmStatus === 'pending_confirm' || edge.status === 'pending';
        const statusChar = isPending ? '❓' : '✅';
        const combinedText = `${typeIcon} ${statusChar}`;

        // [v0.3.11] High-LOD Detail: Show badge always to prove logical existence
        if (this.transform.zoom > 0.4) {
            ctx.save();
            ctx.font = `bold ${badgeSize}px Inter, sans-serif`;
            const metrics = ctx.measureText(combinedText);
            const bw = metrics.width + 12 / this.transform.zoom;
            const bh = badgeSize * 1.5;

            // 1. Badge Background
            ctx.beginPath();
            ctx.roundRect(bMidX - bw/2, bMidY - bh/2, bw, bh, 6 / this.transform.zoom);
            ctx.fillStyle = isPending ? 'rgba(40,40,40,0.9)' : 'rgba(60,60,60,0.6)';
            ctx.fill();
            ctx.strokeStyle = isPending ? '#fabd2f' : '#8ec07c';
            ctx.lineWidth = 1.5 / this.transform.zoom;
            ctx.stroke();

            // 2. Text Rendering
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ebdbb2';
            ctx.fillText(combinedText, bMidX, bMidY);

            // [v0.3.13] Legacy Icon Restoration: B and D badges
            if (edge.type === 'dependency' || edge.isDeterministicFracture) {
                const legacyChar = edge.isDeterministicFracture ? 'B' : 'D';
                const lx = bMidX - bw / 2 - 10 / this.transform.zoom;
                const ly = bMidY;
                const ls = badgeSize * 0.7;
                
                ctx.beginPath();
                ctx.arc(lx, ly, ls * 0.8, 0, Math.PI * 2);
                ctx.fillStyle = edge.isDeterministicFracture ? '#fb4934' : '#fabd2f';
                ctx.fill();
                ctx.fillStyle = '#1d2021';
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

        // [v0.2.17-patch6] ❌ Delete Badge (Only in Edit Logic mode)
        if (this.isEditMode) {
            const deleteX = bMidX + 25 / this.transform.zoom + 10;
            const deleteY = bMidY;
            const delSize = badgeSize * 0.8;
            // ... (rest of delete badge logic follows)

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

        // console.log(`[DEBUG] renderArrow called: x=${x}, y=${y}, angle=${angle}, color=${color}, size=${arrowSize}`);

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
            const centerX = node.position.x + 60;
            const centerY = node.position.y + 30;
            const handleSize = 8 / this.transform.zoom;

            const handles = [
                { x: centerX, y: node.position.y }, // 상
                { x: centerX, y: node.position.y + 60 }, // 하
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
                    this.ctx.fillStyle = cluster.color || '#fabd2f';
                    this.ctx.strokeStyle = '#3c3836';
                    this.ctx.lineWidth = 2 / this.transform.zoom;

                    // 광택/발광 효과 (드래그 중 임시 차단)
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
        this.ctx.strokeStyle = this.edgeTarget ? '#b8bb26' : '#928374';
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
                this.ctx.shadowColor = '#b8bb26';
            }

            this.ctx.fillStyle = '#b8bb26';
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
        ctx.font = '12px monospace';
        ctx.fillStyle = 'lime';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const info = [
            `Nodes: ${this.nodes.length}`,
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

        const now = performance.now();
        if (!this._fpsHistory) this._fpsHistory = [];
        this._fpsHistory.push(now);
        while (this._fpsHistory.length > 0 && now - this._fpsHistory[0] > 1000) this._fpsHistory.shift();
        const fps = this._fpsHistory.length;

        const webglStatus = this.webglEnabled ? 'ACTIVE' : 'OFF';
        const cacheSize = this.edgeValidationCache ? this.edgeValidationCache.size : 0;
        const color = fps > 55 ? '#b8bb26' : (fps > 30 ? '#fabd2f' : '#fb4934');

        fpsEl.innerHTML = `<span style="color: ${color}">${fps} FPS</span> | <span style="color: #83a598">WebGL: ${webglStatus}</span> | <span style="color: #d3869b">Cache: ${cacheSize}</span>`;
    }

    // [v0.2.21] Tombstone Visual (Sovereign Quality)
    renderTombstone(width, height, style) {
        this.ctx.save();

        // Tombstone Shape
        this.ctx.beginPath();
        this.ctx.moveTo(10, height);
        this.ctx.lineTo(10, 25);
        this.ctx.arc(width / 2, 25, width / 2 - 10, Math.PI, 0);
        this.ctx.lineTo(width - 10, height);
        this.ctx.closePath();

        this.ctx.fillStyle = '#1d2021';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fb4934';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Cracks
        this.ctx.strokeStyle = 'rgba(251, 73, 52, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 25);
        this.ctx.lineTo(width / 2 + 10, 45);
        this.ctx.lineTo(width / 2 - 5, 60);
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = '#fb4934';
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
}

// 초기화
let engine;

function initCanvas() {
    if (engine) return;

    // index.html의 <canvas id="canvas">와 일치해야 함
    engine = new CanvasEngine('canvas');
    window.engine = engine; // [v0.2.25] Expose to global for button clicks
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
            case 'projectState': {
                if (message.data && message.data.project_name) {
                    engine.projectName = message.data.project_name;
                    console.log(`[SYNAPSE] Project Name Synchronized: ${engine.projectName}`);
                }
                if (message.workspaceFolder) {
                    engine.workspaceFolder = message.workspaceFolder;
                }
                
                // [v0.3.10] Build Tree using the freshly synced projectName
                if (engine.currentMode === 'tree' || engine.nodes) {
                    engine.treeData = engine.treeRenderer.buildTree(engine.nodes || [], engine.projectName);
                }

                // [v0.3.11] Authoritative Sync: Direct user actions bypass interaction lock
                if (message.isAuthoritative) {
                    console.log('[SYNAPSE] Authoritative projectState received. Bypassing interaction lock.');
                    engine.loadProjectState(message.data, true);
                    engine._pendingState = null; // Clear any stale deferred updates
                    return;
                }

                if (engine.isDragging || engine._isInteracting) {
                    engine._pendingState = message.data;
                    return;
                }
                const preserve = !message.forceReset && engine.nodes && engine.nodes.length > 0;
                engine.loadProjectState(message.data, preserve);
                engine.isExpectingUpdate = false;
                
                // [v0.3.10] Auto-Start Engine Loop upon first state arrival
                if (!engine._loopRunning) {
                    engine.startLoop();
                }
                // Dismiss loading overlay
                const loader = document.getElementById('loading');
                if (loader) loader.style.display = 'none';
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

                        engine.saveState();
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
                    engine.isDirty = true; // One final flag for all updates
                }
                break;
            case 'analysisResults':
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
    engine.getProjectState();

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

    document.getElementById('btn-rebootstrap')?.addEventListener('click', () => {
        if (typeof vscode !== 'undefined') {
            const confirmed = window.confirm(
                'Deep Reset을 실행하시겠습니까?\n\n이 작업은 프로젝트를 전체 재스캔하며, 현재까지 편집한 노드 위치, 커스텀 연결, 클러스터링 등의 모든 캔버스 수정 사항이 초기화됩니다.\n계속하시겠습니까?'
            );
            if (confirmed) {
                vscode.postMessage({ command: 'reBootstrap' });
            }
        } else {
            alert('Deep Reset is only available in VS Code mode.');
        }
    });

    document.getElementById('btn-reset-state')?.addEventListener('click', () => {
        if (typeof vscode !== 'undefined') {
            const confirmed = window.confirm(
                '🔄 project_state.json을 빈 상태로 초기화하시겠습니까?\n\n노드, 엣지, 클러스터 등 저장된 모든 캔버스 상태가 삭제됩니다.\n(소스 코드는 변경되지 않습니다.)'
            );
            if (confirmed) {
                vscode.postMessage({ command: 'resetProjectState' });
            }
        }
    });

    document.getElementById('btn-group')?.addEventListener('click', () => {
        engine.groupSelection();
    });

    document.getElementById('btn-ungroup')?.addEventListener('click', () => {
        engine.ungroupSelection();
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
