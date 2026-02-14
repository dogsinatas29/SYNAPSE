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
        this.expandedFolders = new Set(['src']); // 기본적으로 src 폴더 열림
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

        // 마우스 드래그 (팬, 노드 드래그, 선택)
        this.canvas.addEventListener('mousedown', (e) => {
            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            const clickedNode = this.getNodeAt(worldPos.x, worldPos.y);
            this.dragStart = { x: e.offsetX, y: e.offsetY };

            if (e.button === 0) { // 왼쪽 버튼
                this.wasDragging = false; // mousedown 시 초기화
                if (clickedNode) {
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
                    // 노드가 아님 -> 클러스터 배경 클릭 확인
                    const clickedCluster = this.getClusterAt(worldPos.x, worldPos.y);
                    if (clickedCluster) {
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
                        // 빈 공간 클릭 -> 선택 영역 시작
                        this.isSelecting = true;
                        this.selectionRect = { x: e.offsetX, y: e.offsetY, width: 0, height: 0 };

                        if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
                            this.selectedNodes.clear();
                            this.selectedNode = null;
                        }
                    }
                }
            } else if (e.button === 2) { // 오른쪽 버튼
                this.isPanning = true;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const dx = e.offsetX - this.dragStart.x;
            const dy = e.offsetY - this.dragStart.y;

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

        // 컨텍스트 메뉴 제어 (CTRL+우클릭 시 메뉴 차단)
        this.canvas.addEventListener('contextmenu', (e) => {
            if (e.ctrlKey || e.button === 2) {
                e.preventDefault();
            }
        });
        this.canvas.addEventListener('click', (e) => {
            if (this.wasDragging) {
                this.wasDragging = false;
                return;
            }

            if (this.currentMode === 'tree') {
                // Tree 모드
                if (!this.treeData) return;
                const clickedItem = this.treeRenderer.getItemAt(this.treeData, e.offsetX, e.offsetY);

                if (clickedItem) {
                    if (clickedItem.type === 'folder') {
                        this.treeRenderer.toggleFolder(clickedItem.name);
                        this.treeData = this.treeRenderer.buildTree(this.nodes);
                    } else if (clickedItem.type === 'file' && clickedItem.node) {
                        const filePath = clickedItem.node.data.file;
                        if (typeof vscode !== 'undefined') {
                            vscode.postMessage({ command: 'openFile', filePath });
                        } else if (typeof window.showFilePreview === 'function') {
                            window.showFilePreview(filePath);
                        }
                    }
                }
            } else if (this.currentMode === 'flow') {
                // Flow 모드
                if (!this.flowData) return;
                const clickedStep = this.flowRenderer.getStepAt(this.flowData, e.offsetX, e.offsetY);

                if (clickedStep && clickedStep.node) {
                    const filePath = clickedStep.node.data.file;
                    if (typeof vscode !== 'undefined') {
                        vscode.postMessage({ command: 'openFile', filePath });
                    } else if (typeof showFilePreview === 'function') {
                        showFilePreview(filePath);
                    }
                }
            } else {
                // Graph 모드 (단일 클릭으로 노드 선택/해제)
                const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
                const clickedNode = this.getNodeAt(worldPos.x, worldPos.y);

                if (clickedNode) {
                    if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                        // Shift/Ctrl/Cmd 없이 클릭하면 단일 선택
                        this.selectedNodes.clear();
                        this.selectedNodes.add(clickedNode);
                        this.selectedNode = clickedNode;
                    }
                    // 파일 열기 로직은 그대로 유지
                    if (clickedNode.data.file) {
                        const filePath = clickedNode.data.file;
                        if (typeof vscode !== 'undefined') {
                            vscode.postMessage({ command: 'openFile', filePath });
                        } else if (typeof window.showFilePreview === 'function') {
                            window.showFilePreview(filePath);
                        }
                    }
                } else {
                    // 빈 공간 클릭 시 모든 선택 해제
                    this.selectedNode = null;
                    this.selectedNodes.clear();
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
        }
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

        // Level 3: Detail View (줌이 클 때)
        if (zoom > 1.5) {
            // 상단 라벨 (작게)
            this.ctx.fillStyle = '#a89984';
            this.ctx.font = '10px Inter, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(node.data.label, x + 5, y + 15);

            // 중앙에 스니펫 가상 표시
            this.ctx.fillStyle = '#fb4934';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("class LoginEngine:", x + nodeWidth / 2, y + nodeHeight / 2);

            this.ctx.fillStyle = '#b8bb26';
            this.ctx.font = '10px monospace';
            this.ctx.fillText("  def authenticate():", x + nodeWidth / 2, y + nodeHeight / 2 + 15);
        }
    }

    renderEdge(edge) {
        const fromNode = this.nodes.find(n => n.id === edge.from);
        const toNode = this.nodes.find(n => n.id === edge.to);

        if (!fromNode || !toNode) return;

        const fromX = fromNode.position.x + 60;
        const fromY = fromNode.position.y + 30;
        const toX = toNode.position.x + 60;
        const toY = toNode.position.y + 30;

        this.ctx.strokeStyle = edge.visual?.color || '#665c54';
        this.ctx.lineWidth = 2;

        if (edge.visual?.dashArray) {
            this.ctx.setLineDash(edge.visual.dashArray.split(',').map(Number));
        }

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);

        // 곡선 화살표
        const cpX = (fromX + toX) / 2;
        const cpY = (fromY + toY) / 2 - 30;
        this.ctx.quadraticCurveTo(cpX, cpY, toX, toY);

        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 화살표 머리
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
        this.ctx.fillStyle = edge.visual?.color || '#665c54';
        this.ctx.fill();
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
                const msg = event.data;
                console.log('[SYNAPSE] Received message:', msg.command);

                if (msg.command === 'projectState') {
                    console.log('[SYNAPSE] Loading project state');
                    engine.loadProjectState(msg.data);
                } else if (msg.command === 'fitView') {
                    engine.fitView();
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
