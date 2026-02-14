/**
 * SYNAPSE Canvas Engine
 * HTML5 Canvas 기반 노드 시각화 엔진
 */

/**
 * FlowRenderer - 함수 실행 순서 플로우차트 렌더링
 */
class FlowRenderer {
    constructor(engine) {
        this.engine = engine;
        this.currentFlow = null;
    }

    buildFlow(nodes) {
        // 간단한 버전: 파일 순서대로 선형 플로우 생성
        const steps = nodes.map((node, index) => ({
            id: `step_${index}`,
            type: 'process',
            label: node.data.label,
            file: node.data.file,
            node: node,
            next: index < nodes.length - 1 ? `step_${index + 1}` : null
        }));

        return {
            id: 'flow_main',
            name: 'Main Flow',
            steps: steps
        };
    }

    layoutFlow(flow) {
        // 수직 레이아웃: 위에서 아래로
        const startX = 400;
        const startY = 100;
        const stepHeight = 100;

        const positions = {};
        flow.steps.forEach((step, index) => {
            positions[step.id] = {
                x: startX,
                y: startY + (index * stepHeight)
            };
        });

        return positions;
    }

    renderFlow(ctx, flow) {
        const positions = this.layoutFlow(flow);

        for (const step of flow.steps) {
            const pos = positions[step.id];
            this.renderStep(ctx, step, pos.x, pos.y);

            // 다음 단계로 연결선
            if (step.next) {
                const nextPos = positions[step.next];
                this.renderConnection(ctx, pos.x, pos.y, nextPos.x, nextPos.y);
            }
        }
    }

    renderStep(ctx, step, x, y) {
        const width = 200;
        const height = 60;

        if (step.type === 'process') {
            // 사각형
            ctx.fillStyle = '#3c3836';
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
            ctx.strokeStyle = '#b8bb26';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        } else if (step.type === 'decision') {
            // 다이아몬드
            ctx.fillStyle = '#3c3836';
            ctx.beginPath();
            ctx.moveTo(x, y - height / 2);
            ctx.lineTo(x + width / 2, y);
            ctx.lineTo(x, y + height / 2);
            ctx.lineTo(x - width / 2, y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fabd2f';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 텍스트
        ctx.fillStyle = '#ebdbb2';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(step.label, x, y);

        // 클릭 영역 저장
        step._bounds = {
            x: x - width / 2,
            y: y - height / 2,
            width: width,
            height: height,
            step: step
        };
    }

    renderConnection(ctx, x1, y1, x2, y2) {
        ctx.strokeStyle = '#665c54';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + 30);
        ctx.lineTo(x2, y2 - 30);
        ctx.stroke();

        // 화살표
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 10;
        ctx.fillStyle = '#665c54';
        ctx.beginPath();
        ctx.moveTo(x2, y2 - 30);
        ctx.lineTo(
            x2 - arrowSize * Math.cos(angle - Math.PI / 6),
            y2 - 30 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            x2 - arrowSize * Math.cos(angle + Math.PI / 6),
            y2 - 30 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
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
class TreeRenderer {
    constructor(engine) {
        this.engine = engine;
        this.expandedFolders = new Set(['.', 'root', 'src']); // 데모 환경 호환을 위해 '.' 추가
    }

    buildTree(nodes) {
        // 노드를 디렉토리별로 그룹화
        const tree = {};

        for (const node of nodes) {
            const dir = node.data.directory || 'root';
            if (!tree[dir]) {
                tree[dir] = {
                    name: dir,
                    type: 'folder',
                    children: [],
                    expanded: this.expandedFolders.has(dir)
                };
            }
            tree[dir].children.push({
                name: node.data.file,
                type: 'file',
                path: node.data.path,
                node: node
            });
        }

        // 트리 구조로 변환
        const rootItems = [];
        for (const dirName in tree) {
            rootItems.push(tree[dirName]);
        }

        return rootItems;
    }

    toggleFolder(folderName) {
        if (this.expandedFolders.has(folderName)) {
            this.expandedFolders.delete(folderName);
        } else {
            this.expandedFolders.add(folderName);
        }
    }

    renderTree(ctx, treeData, transform) {
        const startX = 50;
        const startY = 100;
        const lineHeight = 30;
        const indent = 20;

        let currentY = startY;

        for (const item of treeData) {
            currentY = this.renderTreeItem(ctx, item, startX, currentY, lineHeight, indent, 0);
        }
    }

    renderTreeItem(ctx, item, x, y, lineHeight, indent, level) {
        const indentX = x + (level * indent);

        if (item.type === 'folder') {
            // 폴더 아이콘
            const icon = item.expanded ? '▼' : '▶';
            ctx.fillStyle = '#fabd2f';
            ctx.font = '12px monospace';
            ctx.fillText(icon, indentX, y);

            // 폴더 이름
            ctx.fillStyle = '#fabd2f';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(`📁 ${item.name}/`, indentX + 20, y);

            // 클릭 영역 저장 (나중에 클릭 감지용)
            item._bounds = {
                x: indentX,
                y: y - 12,
                width: 200,
                height: lineHeight,
                item: item
            };

            let currentY = y + lineHeight;

            // 하위 항목 렌더링 (폴더가 열려있을 때만)
            if (item.expanded && item.children) {
                for (const child of item.children) {
                    currentY = this.renderTreeItem(ctx, child, x, currentY, lineHeight, indent, level + 1);
                }
            }

            return currentY;
        } else {
            // 파일 아이콘
            ctx.fillStyle = '#ebdbb2';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(`📄 ${item.name}`, indentX + 20, y);

            // 클릭 영역 저장
            item._bounds = {
                x: indentX,
                y: y - 12,
                width: 200,
                height: lineHeight,
                item: item
            };

            return y + lineHeight;
        }
    }

    getItemAt(treeData, x, y) {
        // 재귀적으로 모든 항목의 bounds 확인
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

        // 데이터
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.selectedEdge = null; // 선택된 엣지
        this.baselineNodes = null; // 비교를 위한 기준 데이터
        this.selectedNodes = new Set(); // 다중 선택 노드
        this.clusters = []; // 클러스터 데이터

        // 모드 및 렌더러
        this.currentMode = 'graph'; // 'graph' | 'tree' | 'flow'
        this.treeRenderer = new TreeRenderer(this);
        this.treeData = null;
        this.flowRenderer = new FlowRenderer(this);
        this.flowData = null;

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

        // 인터랙션 상태
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.isSelecting = false; // 드래그 선택 중인지 여부
        this.selectionRect = { x: 0, y: 0, width: 0, height: 0 }; // 드래그 선택 영역
        this.wasDragging = false; // 드래그/선택 후 클릭 무시용 플래그

        // 전역 엔진 등록
        window.engine = this;

        // 파일 열기 통합 핸들러
        this.handleOpenFile = (filePath) => {
            if (!filePath) return;
            console.log('[SYNAPSE] handleOpenFile:', filePath);
            if (typeof vscode !== 'undefined') {
                vscode.postMessage({ command: 'openFile', filePath });
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

        // 이벤트 리스너 등록
        this.setupEventListeners();

        // 렌더링 루프 시작
        this.render();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    setupEventListeners() {
        // 마우스 휠 (줌)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta, e.offsetX, e.offsetY);
        });

        // 마우스 드래그 (팬, 노드 드래그, 선택, 엣지 생성)
        this.canvas.addEventListener('mousedown', (e) => {
            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            this.dragStart = { x: e.offsetX, y: e.offsetY };

            if (e.button === 0) { // 왼쪽 버튼
                this.wasDragging = false; // mousedown 시 초기화

                // 1. 연결 핸들 체크 (최우선)
                const handle = this.getConnectionHandleAt(worldPos.x, worldPos.y);
                if (handle && e.altKey) {
                    // Alt + 핸들 클릭 = 엣지 생성 모드
                    this.isCreatingEdge = true;
                    this.edgeSource = handle;
                    this.edgeCurrentPos = worldPos;
                    console.log('[SYNAPSE] Edge creation started from:', handle);
                    return;
                }

                // 2. 엣지 클릭 (노드보다 먼저 체크)
                const clickedEdge = this.findEdgeAtPoint(worldPos.x, worldPos.y);
                if (clickedEdge && !e.altKey) {
                    // 엣지 선택
                    this.selectedEdge = clickedEdge;
                    this.selectedNode = null;
                    this.selectedNodes.clear();
                    console.log('[SYNAPSE] Edge selected:', clickedEdge.id, clickedEdge.type);
                    this.render();
                    return;
                }

                // 3. 노드 클릭
                const clickedNode = this.getNodeAt(worldPos.x, worldPos.y);
                if (clickedNode) {
                    // 엣지 선택 해제
                    this.selectedEdge = null;

                    // 노드 클릭 (기존 로직)
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        if (this.selectedNodes.has(clickedNode)) {
                            this.selectedNodes.delete(clickedNode);
                        } else {
                            this.selectedNodes.add(clickedNode);
                        }
                        this.selectedNode = null;
                    } else {
                        if (!this.selectedNodes.has(clickedNode)) {
                            this.selectedNodes.clear();
                            this.selectedNodes.add(clickedNode);
                        }
                        this.selectedNode = clickedNode;
                    }
                    this.isDragging = true;
                } else {
                    // 4. 클러스터 배경 클릭 확인
                    const clickedCluster = this.getClusterAt(worldPos.x, worldPos.y);
                    if (clickedCluster) {
                        // 엣지 선택 해제
                        this.selectedEdge = null;

                        const clusterNodes = this.nodes.filter(n => n.cluster_id === clickedCluster.id);
                        if (clusterNodes.length > 0) {
                            if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                                this.selectedNodes.clear();
                            }
                            clusterNodes.forEach(n => this.selectedNodes.add(n));
                            this.isDragging = true;
                            this.wasDragging = true; // 클러스터 선택 효과
                            console.log('[SYNAPSE] Dragged cluster:', clickedCluster.label);
                        }
                    } else {
                        // 5. 빈 공간 클릭 -> 선택 영역 시작 & 엣지 선택 해제
                        this.selectedEdge = null;
                        this.isSelecting = true;
                        this.selectionRect = { x: e.offsetX, y: e.offsetY, width: 0, height: 0 };

                        if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                            this.selectedNodes.clear();
                            this.selectedNode = null;
                        }
                    }
                }
            } else if (e.button === 2) { // 오른쪽 버튼
                // 오른쪽 클릭 시 노드가 있으면 자동 선택 (이미 여러 개가 선택되어 있지 않을 때만)
                if (clickedNode && !this.selectedNodes.has(clickedNode)) {
                    this.selectedNodes.clear();
                    this.selectedNodes.add(clickedNode);
                    this.selectedNode = clickedNode;
                }
                this.isPanning = true;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
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
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
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
                this.dragStart = { x: e.offsetX, y: e.offsetY };
            } else if (this.isSelecting) {
                // 드래그 선택 영역 업데이트
                this.selectionRect.width = e.offsetX - this.selectionRect.x;
                this.selectionRect.height = e.offsetY - this.selectionRect.y;
            } else if (this.isPanning) {
                // 캔버스 팬
                this.pan(dx, dy);
                this.dragStart = { x: e.offsetX, y: e.offsetY };
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            // 엣지 생성 완료
            if (this.isCreatingEdge) {
                if (this.edgeTarget && this.edgeTarget.id !== this.edgeSource.id) {
                    // 엣지 타입 선택 메뉴 표시
                    this.showEdgeTypeSelector(e.clientX, e.clientY);
                } else {
                    // 타겟이 없거나 자기 자신이면 취소
                    this.isCreatingEdge = false;
                    this.edgeSource = null;
                    this.edgeTarget = null;
                }
                // 주의: edgeSource/edgeTarget은 createManualEdge에서 사용하므로 여기서 초기화하지 않음!
                this.isCreatingEdge = false;
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
                    const nodeWidth = 120;
                    const nodeHeight = 60;
                    // node.position.x/y 사용
                    if (node.position.x < maxX && node.position.x + nodeWidth > minX &&
                        node.position.y < maxY && node.position.y + nodeHeight > minY) {
                        this.selectedNodes.add(node);
                    }
                }
                this.saveState();
            } else if (this.isDragging) {
                this.isDragging = false;

                // 클러스터 드래그 종료 시 침범한 노드 밀어내기
                const draggedNodes = Array.from(this.selectedNodes);
                const clusterIds = new Set(draggedNodes.map(n => n.cluster_id).filter(id => id));
                for (const cid of clusterIds) {
                    this.repositionIntruders(cid);
                }

                this.saveState();
            } else if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isSelecting = false;
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        });

        // Delete 키로 선택된 엣지 삭제
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedEdge) {
                console.log('[SYNAPSE] Deleting edge:', this.selectedEdge.id);
                this.deleteEdge(this.selectedEdge.id);
            }
        });

        // 컨텍스트 메뉴 제어
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            const clickedNode = this.getNodeAt(worldPos.x, worldPos.y);

            this.showContextMenu(e.clientX, e.clientY, clickedNode);
        });
        this.canvas.addEventListener('click', (e) => {
            if (this.wasDragging) {
                this.wasDragging = false;
                return;
            }

            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            const hasModifier = e.shiftKey || e.ctrlKey || e.metaKey;

            if (this.currentMode === 'tree') {
                // Tree 모드
                if (!this.treeData) return;
                const clickedItem = this.treeRenderer.getItemAt(this.treeData, worldPos.x, worldPos.y);

                if (clickedItem) {
                    if (clickedItem.type === 'folder') {
                        this.treeRenderer.toggleFolder(clickedItem.name);
                        this.treeData = this.treeRenderer.buildTree(this.nodes);
                    } else if (clickedItem.type === 'file' && clickedItem.node && !hasModifier) {
                        this.handleOpenFile(clickedItem.node.data.path || clickedItem.node.data.file);
                    }
                }
            } else if (this.currentMode === 'flow') {
                // Flow 모드
                if (!this.flowData) return;
                const clickedStep = this.flowRenderer.getStepAt(this.flowData, worldPos.x, worldPos.y);

                if (clickedStep && clickedStep.node && !hasModifier) {
                    this.handleOpenFile(clickedStep.node.data.path || clickedStep.node.data.file);
                }
            } else {
                // Graph 모드
                const clickedNode = this.getNodeAt(worldPos.x, worldPos.y);

                if (clickedNode) {
                    // 수정 키가 없을 때만 파일 열기 수행
                    // (선택 로직은 mousedown에서 이미 처리됨)
                    if (!hasModifier) {
                        this.handleOpenFile(clickedNode.data.path || clickedNode.data.file);
                    }
                } else {
                    // 빈 공간 클릭 시 선택 해제 (수정 키가 없을 때만)
                    if (!hasModifier) {
                        this.selectedNode = null;
                        this.selectedNodes.clear();
                    }
                }
            }
        });
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
    }

    pan(dx, dy) {
        this.transform.offsetX += dx;
        this.transform.offsetY += dy;
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
        for (const node of this.nodes) {
            const nodeWidth = 120;
            const nodeHeight = 60;

            if (worldX >= node.position.x && worldX <= node.position.x + nodeWidth &&
                worldY >= node.position.y && worldY <= node.position.y + nodeHeight) {
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
                worldY >= minY - padding && worldY <= maxY + padding) {
                return cluster;
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
                const clusterNodes = this.nodes.filter(n => n.cluster_id === cluster.id);
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

        const clusterNodes = this.nodes.filter(n => n.cluster_id === cluster.id);
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
            if (node.cluster_id === cluster.id) continue;

            const nx = node.position.x;
            const ny = node.position.y;
            const nw = 120;
            const nh = 60;

            // 충돌 검사 (AABB)
            if (nx + nw >= minX - padding && nx <= maxX + padding &&
                ny + nh >= minY - padding && ny <= maxY + padding) {

                // 침범 발생 -> 아래쪽으로 밀어내기 (가장 간단한 전략)
                // TODO: 위/아래 중 가까운 곳으로 밀어내기 등 고도화 가능
                node.position.y = maxY + padding + intruderPadding;
                movedAny = true;
                console.log(`[SYNAPSE] Pushing intruder node '${node.data.label}' out of ${cluster.label}`);
            }
        }

        if (movedAny) {
            this.saveState();
            this.takeSnapshot(`Auto Push (after drag)`);
        }
    }

    showContextMenu(x, y, node) {
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        // 노드 관련 메뉴 필터링
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

        document.getElementById('menu-group').onclick = () => {
            this.groupSelection();
        };

        document.getElementById('menu-ungroup').onclick = () => {
            this.ungroupSelection();
        };

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
        // A → B → A 패턴 체크
        const circularCheck = this.detectCircularDependency(sourceNode.id, targetNode.id);
        if (circularCheck) {
            return {
                valid: false,
                color: '#fb4934', // 빨간색 (에러)
                reason: 'Circular dependency detected'
            };
        }

        // 기본값: 정상
        return {
            valid: true,
            color: edge.visual?.color || '#83a598',
            reason: 'Valid edge'
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

    createManualEdge(type, color) {
        if (!this.edgeSource || !this.edgeTarget) return;

        const newEdge = {
            id: `edge_manual_${Date.now()}`,
            from: this.edgeSource.type === 'node' ? this.edgeSource.id : undefined,
            fromCluster: this.edgeSource.type === 'cluster' ? this.edgeSource.id : undefined,
            to: this.edgeTarget.type === 'node' ? this.edgeTarget.id : undefined,
            toCluster: this.edgeTarget.type === 'cluster' ? this.edgeTarget.id : undefined,
            type: type,
            label: type.replace('_', ' '),
            visual: {
                color: color,
                dashArray: type === 'dependency' ? '5,5' : undefined
            }
        };

        this.edges.push(newEdge);
        console.log('[SYNAPSE] Manual edge created:', newEdge);

        // 백엔드에 저장
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'createManualEdge', edge: newEdge });
        }

        this.saveState();

        // 엣지 생성 완료 후 상태 초기화
        this.edgeSource = null;
        this.edgeTarget = null;
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
                        clusters: this.clusters
                    }
                }
            });
        } else {
            console.log('[SYNAPSE] Snapshot would be taken:', label);
        }
    }

    getHistory() {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'getHistory' });
        }
    }

    rollback(snapshotId) {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({
                command: 'rollback',
                snapshotId: snapshotId
            });
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
                if (confirm(`Do you want to rollback to "${snap.label}"?`)) {
                    this.rollback(snap.id);
                }
            };

            list.appendChild(item);
        });
    }

    loadProjectState(projectState) {
        this.nodes = projectState.nodes;
        this.edges = projectState.edges;
        this.clusters = projectState.clusters || []; // 클러스터 데이터 로드

        // Tree 데이터 빌드
        this.treeData = this.treeRenderer.buildTree(this.nodes);

        // Flow 데이터 빌드
        this.flowData = this.flowRenderer.buildFlow(this.nodes);

        // UI 업데이트
        document.getElementById('node-count').textContent = this.nodes.length;
        document.getElementById('edge-count').textContent = this.edges.length;

        // 로딩 숨기기
        document.getElementById('loading').style.display = 'none';

        // Fit view
        this.fitView();

        console.log('[SYNAPSE] Loaded project state with', this.nodes.length, 'nodes');
        console.log('[SYNAPSE] Tree data:', this.treeData);
        console.log('[SYNAPSE] Flow data:', this.flowData);
        console.log('[SYNAPSE] Clusters:', this.clusters);
    }

    fitView() {
        if (this.nodes.length === 0) return;

        // 모든 노드를 포함하는 바운딩 박스 계산
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const node of this.nodes) {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + 120);
            maxY = Math.max(maxY, node.position.y + 60);
        }

        const width = maxX - minX;
        const height = maxY - minY;

        // 캔버스에 맞게 줌 조정
        const zoomX = this.canvas.width / (width + 100);
        const zoomY = this.canvas.height / (height + 100);
        this.transform.zoom = Math.min(zoomX, zoomY, 1.0);

        // 중앙 정렬
        this.transform.offsetX = (this.canvas.width - width * this.transform.zoom) / 2 - minX * this.transform.zoom;
        this.transform.offsetY = (this.canvas.height - height * this.transform.zoom) / 2 - minY * this.transform.zoom;

        this.updateZoomDisplay();
    }

    updateZoomDisplay() {
        document.getElementById('zoom-level').textContent = Math.round(this.transform.zoom * 100) + '%';
    }

    render() {
        try {
            // 배경 클리어
            this.ctx.fillStyle = '#1e1e1e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.save();
            this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
            this.ctx.scale(this.transform.zoom, this.transform.zoom);

            const zoom = this.transform.zoom;

            if (this.currentMode === 'tree') {
                this.treeRenderer.renderTree(this.ctx, this.treeData, this.transform);
            } else if (this.currentMode === 'flow') {
                this.flowRenderer.renderFlow(this.ctx, this.flowData);
            } else {
                // Graph 모드: 그리드 -> 클러스터 -> 엣지 -> 노드 순으로 렌더링
                this.renderGrid();
                this.renderClusters();

                // 엣지 렌더링 (줌이 너무 작으면 생략 가능)
                if (zoom > 0.3) {
                    for (const edge of this.edges) {
                        this.renderEdge(edge);
                    }
                }

                this.renderClusters();

                // 유령 노드 렌더링 (비교 모드)
                this.renderGhostNodes(zoom);

                // 노드 렌더링 (LOD 적용)
                for (const node of this.nodes) {
                    this.renderNode(node, zoom);
                }

                // 드래그 선택 영역 표시
                if (this.isSelecting) {
                    this.ctx.restore(); // 원래 좌표계로 복구 (스크린 좌표)
                    this.ctx.fillStyle = 'rgba(69, 133, 136, 0.2)';
                    this.ctx.strokeStyle = '#458588';
                    this.ctx.lineWidth = 1;
                    this.ctx.fillRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height);
                    this.ctx.strokeRect(this.selectionRect.x, this.selectionRect.y, this.selectionRect.width, this.selectionRect.height);
                    this.ctx.save(); // 다시 스케일 좌표계로
                }

                // 연결 핸들 렌더링 (선택된 노드/클러스터)
                this.renderConnectionHandles();

                // 유령 엣지 렌더링 (엣지 생성 중)
                if (this.isCreatingEdge && this.edgeSource) {
                    this.renderGhostEdge();
                }
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
                if (zoom < 0.4) lodText = "SATELLITE";
                else if (zoom > 1.5) lodText = "DETAIL";
                lodStatusEl.textContent = lodText;
            }
        } catch (error) {
            console.error('[SYNAPSE] Render error:', error);
        }

        requestAnimationFrame(() => this.render());
    }

    groupSelection() {
        if (this.selectedNodes.size < 2) {
            console.warn('[SYNAPSE] Select at least 2 nodes to group');
            return;
        }

        // 이미 모두 같은 클러스터에 속해 있는지 확인
        const nodeArray = Array.from(this.selectedNodes);
        const firstClusterId = nodeArray[0].cluster_id;
        const allInSameCluster = firstClusterId && nodeArray.every(n => n.cluster_id === firstClusterId);

        if (allInSameCluster) {
            // 선택된 모든 노드가 이미 동일한 클러스터에 있고, 
            // 그 클러스터에 다른 노드가 없다면 새로 생성할 필요 없음
            const nodesInCluster = this.nodes.filter(n => n.cluster_id === firstClusterId);
            if (nodesInCluster.length === this.selectedNodes.size) {
                console.log('[SYNAPSE] Selection already forms a unique cluster:', firstClusterId);
                return;
            }
        }

        const clusterId = `cluster_${Date.now()}`;
        const color = this.clusterColors[this.colorCounter % this.clusterColors.length];
        this.colorCounter++;

        const newCluster = {
            id: clusterId,
            label: `Group ${this.clusters.length + 1}`,
            color: color,
            collapsed: false
        };

        this.clusters.push(newCluster);
        for (const node of this.selectedNodes) {
            node.cluster_id = clusterId;
        }

        console.log('[SYNAPSE] Created cluster:', clusterId);

        // 침범한 노드(소속되지 않은 노드) 밀어내기
        this.repositionIntruders(clusterId);

        this.saveState(); // 클러스터 생성 후 저장
        this.takeSnapshot(`Group Created: ${newCluster.label}`);
    }

    ungroupSelection() {
        if (this.selectedNodes.size === 0) return;

        for (const node of this.selectedNodes) {
            node.cluster_id = null;
        }

        // 사용되지 않는 클러스터 정리
        this.clusters = this.clusters.filter(c => {
            return this.nodes.some(n => n.cluster_id === c.id);
        });

        console.log('[SYNAPSE] Ungrouped selection');
        this.saveState(); // 클러스터 해제 후 저장
        this.takeSnapshot('Selection Ungrouped');
    }

    saveState() {
        // VS Code 환경이면 저장을 위해 익스텐션으로 메시지 전송
        if (typeof vscode !== 'undefined') {
            const projectState = {
                nodes: this.nodes,
                edges: this.edges,
                clusters: this.clusters
            };
            console.log('[SYNAPSE] Saving state to VS Code...');
            vscode.postMessage({
                command: 'saveState',
                data: projectState
            });
        } else {
            // 브라우저 환경 (로컬 스토리지 등에 임시 저장 가능)
            console.log('[SYNAPSE] Running in browser - State saved to console (Mock)');
        }
    }

    /**
     * 엣지 삭제
     * @param {string} edgeId - 삭제할 엣지 ID
     */
    deleteEdge(edgeId) {
        // 로컬 상태에서 엣지 제거
        const edgeIndex = this.edges.findIndex(e => e.id === edgeId);
        if (edgeIndex === -1) {
            console.warn('[SYNAPSE] Edge not found:', edgeId);
            return;
        }

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
        this.render();
    }

    renderGrid() {
        const gridSize = 50;
        const zoom = this.transform.zoom;
        if (zoom < 0.2) return; // 너무 작으면 그리드 생략

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#282828';
        this.ctx.lineWidth = 1 / zoom;

        // 화면 영역 계산
        const startX = Math.floor(-this.transform.offsetX / zoom / gridSize) * gridSize;
        const startY = Math.floor(-this.transform.offsetY / zoom / gridSize) * gridSize;
        const endX = startX + this.canvas.width / zoom + gridSize;
        const endY = startY + this.canvas.height / zoom + gridSize;

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
    }
    renderClusters() {
        if (!this.clusters || this.clusters.length === 0) return;

        for (const cluster of this.clusters) {
            // 해당 클러스터에 속한 노드들 찾기
            const clusterNodes = this.nodes.filter(n => n.cluster_id === cluster.id);
            if (clusterNodes.length === 0) continue;

            // 바운딩 박스 계산
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            const padding = 20;

            for (const node of clusterNodes) {
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + 120);
                maxY = Math.max(maxY, node.position.y + 60);
            }

            // 클러스터 박스 그리기
            this.ctx.beginPath();

            // 배경 채우기 (매우 연하게, 겹침 확인을 위해 낮은 알파값)
            this.ctx.fillStyle = (cluster.color || '#458588') + '15'; // 8% 투명도
            this.ctx.fillRect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);

            this.ctx.setLineDash([10, 5]);
            this.ctx.strokeStyle = cluster.color || '#458588';
            this.ctx.lineWidth = 2 / this.transform.zoom; // 일관된 시각적 두께 (2px 기준)
            this.ctx.rect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // 클러스터 라벨
            this.ctx.fillStyle = cluster.color || '#458588';
            this.ctx.font = `${14 / this.transform.zoom}px Inter, sans-serif`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(cluster.label, minX - padding, minY - padding - 5);
        }
    }

    renderGhostNodes(zoom) {
        if (!this.baselineNodes) return;

        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.setLineDash([5, 5]);

        const nodeWidth = 120;
        const nodeHeight = 60;

        for (const ghost of this.baselineNodes) {
            const currentNode = this.nodes.find(n => n.id === ghost.id);

            // 1. 사라진 노드 (Ghost)
            if (!currentNode) {
                this.ctx.strokeStyle = '#928374';
                this.ctx.fillStyle = '#282828';
                this.ctx.strokeRect(ghost.position.x, ghost.position.y, nodeWidth, nodeHeight);
                this.ctx.font = '10px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`(Removed: ${ghost.data.label})`, ghost.position.x + nodeWidth / 2, ghost.position.y + nodeHeight / 2);
            }
            // 2. 위치가 바뀐 노드 (Origin point ghost)
            else if (currentNode.position.x !== ghost.position.x || currentNode.position.y !== ghost.position.y) {
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

    renderNode(node, zoom) {
        const nodeWidth = 120;
        const nodeHeight = 60;
        const x = node.position.x;
        const y = node.position.y;

        // Level 1: Satellite View (줌이 매우 작을 때)
        if (zoom < 0.4) {
            this.ctx.fillStyle = node.data.color || '#458588';
            this.ctx.beginPath();
            this.ctx.arc(x + nodeWidth / 2, y + nodeHeight / 2, 10 / zoom, 0, Math.PI * 2);
            this.ctx.fill();

            // 선택 표시 (Satellite)
            if (this.selectedNode === node || (this.selectedNodes && this.selectedNodes.has(node))) {
                this.ctx.strokeStyle = '#fabd2f';
                this.ctx.lineWidth = 4 / zoom;
                this.ctx.stroke();
            }
            return;
        }

        // 기본 노드 배경
        this.ctx.fillStyle = '#3c3836';
        if (this.selectedNode === node || (this.selectedNodes && this.selectedNodes.has(node))) {
            this.ctx.strokeStyle = '#fabd2f';
            this.ctx.lineWidth = 3;
        } else {
            // 클러스터 소속이라면 클러스터 색상 사용, 아니면 기본 색상
            let borderColor = node.data.color || '#458588';
            if (node.cluster_id) {
                const cluster = this.clusters.find(c => c.id === node.cluster_id);
                if (cluster) borderColor = cluster.color;
            }
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = 2 / zoom; // 클러스터 테두리와 두께 통일
        }

        if (node.visual && node.visual.dashArray) {
            this.ctx.setLineDash(node.visual.dashArray.split(',').map(Number));
        }

        this.ctx.fillRect(x, y, nodeWidth, nodeHeight);
        this.ctx.strokeRect(x, y, nodeWidth, nodeHeight);
        this.ctx.setLineDash([]);

        // Level 2: Normal View
        if (zoom >= 0.4 && zoom <= 1.5) {
            this.ctx.fillStyle = '#ebdbb2';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.data.label, x + nodeWidth / 2, y + nodeHeight / 2);
        }

        // Level 3: Detail View (줌이 클 때 - 정교한 정보 표시)
        if (zoom > 1.5) {
            // 상단 헤더 바 (파일 정보)
            this.ctx.fillStyle = '#504945';
            this.ctx.fillRect(x, y, nodeWidth, 20);

            this.ctx.fillStyle = '#fabd2f'; // 파일 라벨 강조
            this.ctx.font = 'bold 10px Inter, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(node.data.label, x + 5, y + 5);

            // 실제 분석 데이터가 있는 경우 표시
            if (node.data.summary) {
                const { classes, functions } = node.data.summary;
                let offsetY = y + 25;

                // 클래스 표시 (Gruvbox Red)
                if (classes && classes.length > 0) {
                    this.ctx.fillStyle = '#fb4934';
                    this.ctx.font = 'bold 10px monospace';
                    classes.slice(0, 2).forEach(cls => {
                        this.ctx.fillText(`C ${cls}`, x + 5, offsetY);
                        offsetY += 12;
                    });
                }

                // 함수 표시 (Gruvbox Green)
                if (functions && functions.length > 0) {
                    this.ctx.fillStyle = '#b8bb26';
                    this.ctx.font = '9px monospace';
                    functions.slice(0, 3).forEach(func => {
                        this.ctx.fillText(`f ${func}()`, x + 5, offsetY);
                        offsetY += 10;
                    });

                    // 더 많은 함수가 있으면 표시
                    if (functions.length > 3) {
                        this.ctx.fillStyle = '#928374';
                        this.ctx.font = 'italic 8px Inter, sans-serif';
                        this.ctx.fillText(`+ ${functions.length - 3} more...`, x + 5, offsetY);
                    }
                }
            } else {
                // 데이터가 없는 경우 장식용 자리표시자
                this.ctx.fillStyle = '#928374';
                this.ctx.font = 'italic 9px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText("(No members)", x + nodeWidth / 2, y + nodeHeight / 2 + 10);
            }
        }
    }

    /**
     * 엣지 타입별 시각적 스타일 반환
     * @param {Object} edge - 엣지 객체
     * @returns {Object} { color, dashPattern, lineWidth, arrowStyle }
     */
    getEdgeStyle(edge) {
        const type = edge.type || 'dependency';

        const styles = {
            'dependency': {
                color: '#83a598',      // 파란색
                dashPattern: [5, 5],   // 점선
                lineWidth: 1.5,
                arrowStyle: 'standard' // 표준 화살표
            },
            'call': {
                color: '#b8bb26',      // 녹색
                dashPattern: null,     // 실선
                lineWidth: 1.5,
                arrowStyle: 'standard'
            },
            'data_flow': {
                color: '#fabd2f',      // 노란색
                dashPattern: [10, 5],  // 긴 대시
                lineWidth: 2.0,        // 약간 굵게
                arrowStyle: 'thick'    // 굵은 화살표
            },
            'bidirectional': {
                color: '#d3869b',      // 보라색
                dashPattern: null,     // 실선
                lineWidth: 1.5,
                arrowStyle: 'double'   // 양방향 화살표
            }
        };

        return styles[type] || styles['dependency'];
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
        // 1단계: 화살표 클릭 확인 (우선순위!)
        for (const edge of this.edges) {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);

            if (!fromNode || !toNode) continue;

            const fromX = fromNode.position.x + 60;
            const fromY = fromNode.position.y + 30;
            const toX = toNode.position.x + 60;
            const toY = toNode.position.y + 30;
            const cpX = (fromX + toX) / 2;
            const cpY = (fromY + toY) / 2 - 30;

            // 중앙 화살표 체크
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2 - 30;
            if (this.isPointNearArrow(px, py, midX, midY, 20)) {
                return edge;
            }

            // 끝점 화살표 체크
            const angle = Math.atan2(toY - cpY, toX - cpX);
            const arrowPoint = this.getNodeBoundaryPoint(toX, toY, angle);
            if (this.isPointNearArrow(px, py, arrowPoint.x, arrowPoint.y, 20)) {
                return edge;
            }

            // Bidirectional인 경우 시작점 화살표도 체크
            const style = this.getEdgeStyle(edge);
            if (style.arrowStyle === 'double') {
                const startAngle = Math.atan2(fromY - cpY, fromX - cpX);
                const startArrowPoint = this.getNodeBoundaryPoint(fromX, fromY, startAngle);
                if (this.isPointNearArrow(px, py, startArrowPoint.x, startArrowPoint.y, 20)) {
                    return edge;
                }
            }
        }

        // 2단계: 곡선 클릭 확인 (대체 방법)
        for (const edge of this.edges) {
            if (this.isPointNearCurve(px, py, edge, 10)) {
                return edge;
            }
        }

        return null;
    }

    renderEdge(edge) {
        const fromNode = this.nodes.find(n => n.id === edge.from);
        const toNode = this.nodes.find(n => n.id === edge.to);

        if (!fromNode || !toNode) return;

        // 🔍 엣지 검증 로직 적용
        const validation = this.validateEdge(edge, fromNode, toNode);

        // 🎨 엣지 타입별 스타일 가져오기
        const style = this.getEdgeStyle(edge);

        const fromX = fromNode.position.x + 60;
        const fromY = fromNode.position.y + 30;
        const toX = toNode.position.x + 60;
        const toY = toNode.position.y + 30;

        // 엣지 색상: 검증 에러가 있으면 검증 색상 우선, 없으면 타입별 색상
        let edgeColor = validation.valid ? style.color : validation.color;

        // 선 굵기: 검증 에러는 더 굵게, 아니면 타입별 굵기
        let lineWidth = validation.valid ? style.lineWidth : 2.5;

        // 🌟 선택된 엣지 강조 효과
        const isSelected = this.selectedEdge && this.selectedEdge.id === edge.id;
        if (isSelected) {
            // 글로우 효과
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = edgeColor;
            // 더 굵은 선
            lineWidth += 2;
        }

        this.ctx.strokeStyle = edgeColor;
        this.ctx.lineWidth = lineWidth;

        // 대시 패턴 적용
        if (!validation.valid) {
            // 에러인 경우 짧은 점선
            this.ctx.setLineDash([3, 3]);
        } else if (style.dashPattern) {
            // 타입별 대시 패턴
            this.ctx.setLineDash(style.dashPattern);
        } else {
            // 실선
            this.ctx.setLineDash([]);
        }

        // 곡선 그리기
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);

        const cpX = (fromX + toX) / 2;
        const cpY = (fromY + toY) / 2 - 30;
        this.ctx.quadraticCurveTo(cpX, cpY, toX, toY);

        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 글로우 효과 리셋
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';

        // 화살표 렌더링 (노드 외곽선 교점 + 엣지 중앙)
        const angle = Math.atan2(toY - cpY, toX - cpX);
        const arrowPoint = this.getNodeBoundaryPoint(toX, toY, angle);

        // 1. 끝점 화살표 (노드 경계)
        this.renderArrow(arrowPoint.x, arrowPoint.y, angle, edgeColor, style.arrowStyle);

        // 2. 중앙 화살표 (엣지 중간) - 시각적 명확성 향상!
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2 - 30; // 곡선 중앙점
        const midAngle = Math.atan2(toY - midY, toX - midX);
        this.renderArrow(midX, midY, midAngle, edgeColor, style.arrowStyle);

        // Bidirectional인 경우 반대 방향 화살표도 그리기
        if (style.arrowStyle === 'double') {
            const startAngle = Math.atan2(fromY - cpY, fromX - cpX);
            const startArrowPoint = this.getNodeBoundaryPoint(fromX, fromY, startAngle);
            this.renderArrow(startArrowPoint.x, startArrowPoint.y, startAngle, edgeColor, 'standard');

            // 중앙 반대 방향 화살표
            const midStartAngle = Math.atan2(fromY - midY, fromX - midX);
            this.renderArrow(midX, midY, midStartAngle, edgeColor, 'standard');
        }

        // 🔍 검증 결과 표시 (에러/경고인 경우 라벨 추가)
        if (!validation.valid || validation.color === '#fabd2f') {
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2 - 35;

            this.ctx.save();
            this.ctx.font = `${12 / this.transform.zoom}px Inter, sans-serif`;
            this.ctx.fillStyle = validation.valid ? '#fabd2f' : '#fb4934';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // 배경 박스
            const text = validation.valid ? '⚠️' : '❌';
            const metrics = this.ctx.measureText(text);
            const padding = 4 / this.transform.zoom;

            this.ctx.fillStyle = '#282828';
            this.ctx.fillRect(
                midX - metrics.width / 2 - padding,
                midY - 8 / this.transform.zoom,
                metrics.width + padding * 2,
                16 / this.transform.zoom
            );

            this.ctx.fillStyle = validation.valid ? '#fabd2f' : '#fb4934';
            this.ctx.fillText(text, midX, midY);
            this.ctx.restore();
        }
    }

    /**
     * 화살표 렌더링 (타입별 스타일)
     * @param {number} x - 화살표 끝점 X
     * @param {number} y - 화살표 끝점 Y
     * @param {number} angle - 화살표 각도
     * @param {string} color - 화살표 색상
     * @param {string} style - 'standard', 'thick', 'double'
     */
    renderArrow(x, y, angle, color, style = 'standard') {
        // 화살표 크기: 2배로 증가 (테스트용)
        const baseSize = style === 'thick' ? 40 : 30; // 기본 크기 2배
        const minSize = 24; // 최소 크기 2배
        const arrowSize = Math.max(minSize, baseSize / Math.sqrt(this.transform.zoom));

        console.log(`[DEBUG] renderArrow called: x=${x}, y=${y}, angle=${angle}, color=${color}, size=${arrowSize}`);

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
        this.ctx.strokeStyle = '#1d2021'; // 어두운 테두리
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

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
                this.ctx.beginPath();
                this.ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
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
                    this.ctx.beginPath();
                    this.ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
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
            this.ctx.fillStyle = '#b8bb26';
            this.ctx.fill();
        }
    }
}

// 초기화
let engine;

window.addEventListener('DOMContentLoaded', async () => {
    engine = new CanvasEngine('canvas');

    // 프로젝트 상태 로드
    try {
        console.log('[SYNAPSE] Initializing...');
        console.log('[SYNAPSE] VS Code API available:', typeof window.vscode !== 'undefined');

        const vscode = window.vscode;
        if (vscode) {
            // VS Code 환경
            console.log('[SYNAPSE] Running in VS Code webview');

            // 메시지 리스너 등록
            window.addEventListener('message', event => {
                const message = event.data;
                console.log('[SYNAPSE] Received message:', message.command);

                switch (message.command) {
                    case 'projectState':
                        console.log('[SYNAPSE] Loading project state');
                        engine.loadProjectState(message.data);
                        break;
                    case 'rollback':
                        // Rollback then clear baseline
                        engine.loadProjectState(message.data);
                        engine.baselineNodes = null;
                        break;
                    case 'setBaseline':
                        console.log('[SYNAPSE] Setting visual baseline');
                        engine.baselineNodes = message.data.nodes;
                        break;
                    case 'clearBaseline':
                        engine.baselineNodes = null;
                        break;
                    case 'fitView':
                        engine.fitView();
                        break;
                    case 'history':
                        engine.updateHistoryUI(message.data);
                        break;
                }
            });

            // 프로젝트 상태 요청
            console.log('[SYNAPSE] Requesting project state from extension');
            vscode.postMessage({ command: 'getProjectState' });
        } else {
            // 브라우저 환경
            console.log('[SYNAPSE] Running in browser');
            const response = await fetch('../data/project_state.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const projectState = await response.json();
            engine.loadProjectState(projectState);
        }
    } catch (error) {
        console.error('[SYNAPSE] Load error:', error);
        document.getElementById('loading').innerHTML = `
            <div>❌ Failed to load project</div>
            <div style="font-size: 12px; margin-top: 8px; color: #fb4934;">${error.message}</div>
        `;
    }

    // 툴바 버튼 이벤트
    document.getElementById('btn-fit').addEventListener('click', () => {
        engine.fitView();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        engine.transform = { zoom: 1.0, offsetX: 0, offsetY: 0 };
        engine.updateZoomDisplay();
    });

    document.getElementById('btn-group')?.addEventListener('click', () => {
        engine.groupSelection();
    });

    document.getElementById('btn-ungroup')?.addEventListener('click', () => {
        engine.ungroupSelection();
    });

    // 모드 전환 버튼
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;

            // UI 업데이트
            document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('current-mode').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

            // 엔진 모드 전환
            engine.currentMode = mode;
            console.log('[SYNAPSE] Switched to mode:', mode);

            // Tree 모드로 전환 시 tree 데이터 재빌드
            if (mode === 'tree' && engine.nodes.length > 0) {
                engine.treeData = engine.treeRenderer.buildTree(engine.nodes);
            }
        });
    });

});
