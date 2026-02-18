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
        const edges = this.engine.edges || [];

        // 1. 진짜 실행 루트 탐색 ( Cargo.toml, GEMINI.md 등 메타데이터 제외하고 main 위주)
        const roots = nodes.filter(n => {
            if (!n.data || !n.data.file) return false;
            const fileName = n.data.file.toLowerCase();
            return fileName.includes('main.') || fileName.includes('index.') || fileName.includes('app.');
        });

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
        const filteredNodes = nodes.filter(n => reachableIds.has(n.id));
        const sortedNodes = [...filteredNodes].sort((a, b) => {
            const layerA = a.data.layer || 0;
            const layerB = b.data.layer || 0;
            if (layerA !== layerB) return layerA - layerB;
            return (a.data.priority || 50) - (b.data.priority || 50);
        });

        // 4. 스텝 생성 (START 인젝션)
        const steps = [];
        steps.push({
            id: 'step_start',
            type: 'terminal',
            label: 'START',
            file: 'system',
            next: sortedNodes.length > 0 ? `step_0` : null
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
                fileName.includes('prompt');

            steps.push({
                id: `step_${index}`,
                type: isLogicalDecision ? 'decision' : 'process',
                label: node.data.label,
                file: node.data.file,
                node: node,
                next: nextSteps.length > 0 ? nextSteps[0] : null,
                alternateNext: (isLogicalDecision && nextSteps.length > 1) ? nextSteps[1] : null,
                allNexts: nextSteps,
                layer: node.data.layer || 0,
                isRealDecision: isLogicalDecision
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
            name: 'Strategic Execution Flow',
            steps: steps
        };
    }

    layoutFlow(flow) {
        const startX = 400;
        const startY = 100;
        const stepWidth = 300;
        const stepHeight = 150;

        const positions = {};
        const layerBranchCount = {};

        // 1. 레이아웃 계산을 위한 BFS/DFS 대신 순차적 배치 + 분기 보정
        flow.steps.forEach((step, index) => {
            const layer = step.layer || 0;

            // 기본 수직 위치
            if (!positions[step.id]) {
                positions[step.id] = {
                    x: startX + (layer * 50),
                    y: startY + (index * stepHeight)
                };
            }

            // 분기(alternateNext)가 있다면 오른쪽으로 오프셋 부여
            if (step.alternateNext) {
                positions[step.alternateNext] = {
                    x: positions[step.id].x + stepWidth,
                    y: positions[step.id].y + (stepHeight * 0.5) // 약간 아래로
                };
            }
        });

        return positions;
    }

    renderFlow(ctx, flow) {
        if (!flow || !flow.steps) return;
        const positions = this.layoutFlow(flow);

        for (const step of flow.steps) {
            const pos = positions[step.id];
            this.renderStep(ctx, step, pos.x, pos.y);

            // 다음 단계로 연결선
            if (step.next) {
                const nextPos = positions[step.next];
                // 진짜 조건문일 때만 'True' 표시
                const label = step.isRealDecision ? 'True' : null;
                this.renderConnection(ctx, pos.x, pos.y, nextPos.x, nextPos.y, label);
            }

            // 진짜 조건문일 때만 대체 경로 표시
            if (step.isRealDecision && step.alternateNext) {
                const altPos = positions[step.alternateNext];
                this.renderConnection(ctx, pos.x, pos.y, altPos.x, altPos.y, 'False');
            }
        }
    }

    renderStep(ctx, step, x, y) {
        const width = 220;
        const height = 65;

        if (step.type === 'terminal') {
            // 둥근 캡슐형 (START/END)
            ctx.fillStyle = '#b8bb26'; // Green/Aqua for terminal
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
            // 사각형
            ctx.fillStyle = '#3c3836';
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
            ctx.strokeStyle = '#ebdbb2';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - width / 2, y - height / 2, width, height);
        } else if (step.type === 'decision') {
            // 다이아몬드
            ctx.fillStyle = '#504945';
            ctx.beginPath();
            ctx.moveTo(x, y - height / 2 - 10);
            ctx.lineTo(x + width / 2 + 10, y);
            ctx.lineTo(x, y + height / 2 + 10);
            ctx.lineTo(x - width / 2 - 10, y);
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

    renderConnection(ctx, x1, y1, x2, y2, label) {
        ctx.strokeStyle = '#665c54';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + 30);

        // 굴곡진 연결선 (기본적으로 수직)
        const cpY = (y1 + y2) / 2;
        ctx.bezierCurveTo(x1, cpY, x2, cpY, x2, y2 - 30);
        ctx.stroke();

        // 라벨 (True/False 등)
        if (label) {
            ctx.fillStyle = '#a89984';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(label, (x1 + x2) / 2 + 10, (y1 + y2) / 2);
        }

        // 화살표
        const angle = Math.atan2(y2 - (y1 + 10), x2 - x1);
        const arrowSize = 10;
        ctx.fillStyle = '#665c54';
        ctx.save();
        ctx.translate(x2, y2 - 30);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
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
        this.expandedFolders = new Set(['.', 'root', 'src']); // 데모 환경 호환을 위해 '.' 추가
    }

    buildTree(nodes) {
        // 노드를 디렉토리별로 그룹화
        const tree = {};

        for (const node of nodes) {
            if (!node.data) continue;
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
        if (!treeData || !Array.isArray(treeData)) return;
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
        this.isExpectingUpdate = false; // 데이터 업데이트 시 뷰 유지 여부 플래그

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

        // 인터랙션 상태
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.animationOffset = 0;
        this.isAnimating = true;
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

        // 노드 생성 상태
        this.isAddingNode = false;
        this.pendingNodePos = { x: 0, y: 0 };

        // 이벤트 리스너 등록
        this.setupEventListeners();
        this.setupToolbarListeners(); // New listener setup

        // 렌더링 루프 시작
        this.render();
        this.startAnimationLoop();

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

        // Request initial state
        this.getProjectState();
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
                        this.isAddingNode = false;
                        document.getElementById('btn-add-node')?.classList.remove('active');
                        this.canvas.style.cursor = 'default';
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
    }

    createManualNode(label, type, x, y) {
        const newNode = {
            id: `node_manual_${Date.now()}`,
            type: type,
            status: 'proposed', // Start as proposed
            position: { x, y },
            data: {
                label: label,
                description: 'Manually created node'
            },
            visual: {
                opacity: 1 // Make it fully visible immediately
            }
        };

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
    }

    async getProjectState() {
        if (typeof vscode !== 'undefined') {
            vscode.postMessage({ command: 'getProjectState' });
        } else {
            console.warn('[SYNAPSE] VS Code API not available (Browser mode). Attempting to fetch state...');
            try {
                // 상위 디렉토리의 data/project_state.json 시도 (demo 환경 등)
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

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const dpr = window.devicePixelRatio || 1;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Set actual size in memory (scaled to account for extra pixel density)
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;

        // Normalize coordinate system to use css pixels
        // This means drawing logic (like 100, 100) will map to correct high-DPI pixels
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }

        // Make canvas element size match the css pixel size (so it fits in layout)
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        console.log(`[SYNAPSE] Canvas resized. DPR: ${dpr}, Size: ${width}x${height} (Buffer: ${this.canvas.width}x${this.canvas.height})`);
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
            this.startAnimationLoop();
        }
        console.log('[SYNAPSE] Animation toggled:', this.isAnimating);
        return this.isAnimating;
    }

    startAnimationLoop() {
        const animate = () => {
            if (this.isAnimating) {
                // 부드러운 이동을 위한 오프셋 증가
                this.animationOffset = (this.animationOffset + 0.5) % 40;
                this.render(); // 매 프레임 재포착
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
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
                                console.log('[SYNAPSE] Dropped string content:', s);
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
            console.log('[DEBUG] Wheel event detected:', e.deltaY);
            e.preventDefault();
            e.stopPropagation(); // 브라우저 전체 줌 방지
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta, e.offsetX, e.offsetY);
        }, { passive: false });

        // 마우스 드래그 (팬, 노드 드래그, 선택, 엣지 생성)
        this.canvas.addEventListener('mousedown', (e) => {
            const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
            this.dragStart = { x: e.offsetX, y: e.offsetY };

            if (e.button === 0) { // 왼쪽 버튼
                this.wasDragging = false; // mousedown 시 초기화

                // -1. 클러스터 헤더 버튼 체크 (최우선)
                const clickedCluster = this.getClusterAt(worldPos.x, worldPos.y);
                if (clickedCluster) {
                    // 버튼 영역 체크 (오른쪽 끝 30px 정도)
                    const b = clickedCluster._headerBounds;
                    if (worldPos.x > b.x + b.width - 40) {
                        this.toggleClusterCollapse(clickedCluster.id);
                        return;
                    }
                }

                // 0. 노드 추가 모드 (최우선)
                if (this.isAddingNode) {
                    this.pendingNodePos = worldPos;
                    const nodeDialog = document.getElementById('node-dialog');
                    if (nodeDialog) {
                        nodeDialog.style.display = 'block';
                        document.getElementById('node-label-input')?.focus();
                    }
                    return;
                }

                // 0. 노드 승인/취소 버튼 체크 (가장 먼저)
                if (this.checkNodeButtonClick(worldPos.x, worldPos.y)) {
                    return;
                }

                // 1. 연결 핸들 체크 (최우선) OR 연결 모드일 때 노드 클릭
                const handle = this.getConnectionHandleAt(worldPos.x, worldPos.y);
                const clickedNodeForEdge = this.getNodeAt(worldPos.x, worldPos.y);

                if ((handle && e.altKey) || (this.isCreatingEdge && (clickedNodeForEdge || handle))) {
                    // Alt + 핸들 클릭 = 엣지 생성 모드
                    // OR 'Connect' button is active and user clicked a node/handle

                    // If manually toggled mode and click is on body, ignore (wait for node click)
                    if (this.isCreatingEdge && !clickedNodeForEdge && !handle) {
                        // Just deselect if clicking empty space? Or allow pan?
                        // For now let it fall through to pan/select
                    } else {
                        // Start edge creation
                        this.isCreatingEdge = true; // Ensure true
                        this.edgeSource = handle || { type: 'node', id: clickedNodeForEdge.id };
                        this.edgeCurrentPos = worldPos;
                        console.log('[SYNAPSE] Edge creation started from:', this.edgeSource);
                        return;
                    }
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

                        const clusterNodes = this.nodes.filter(n => (n.data && n.data.cluster_id === clickedCluster.id) || n.cluster_id === clickedCluster.id);
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
            } else {
                // 🔍 툴팁 처리 (Phase 4)
                const edge = this.findEdgeAtPoint(worldPos.x, worldPos.y);
                if (edge && edge._validationReason) {
                    this.showTooltip(e.clientX, e.clientY, edge._validationReason);
                } else {
                    this.hideTooltip();
                }
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

        // Delete 키로 선택된 노드/엣지 삭제 및 방향키 내비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete') {
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

            // 아니면 노드 컨텍스트 메뉴
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
        console.log('[DEBUG] zoom called:', { delta, centerX, centerY, currentZoom: this.transform.zoom });
        const oldZoom = this.transform.zoom;
        this.transform.zoom *= delta;
        this.transform.zoom = Math.max(0.1, Math.min(5.0, this.transform.zoom));

        // 줌 중심점 조정
        const zoomRatio = this.transform.zoom / oldZoom;
        this.transform.offsetX = centerX - (centerX - this.transform.offsetX) * zoomRatio;
        this.transform.offsetY = centerY - (centerY - this.transform.offsetY) * zoomRatio;

        console.log('[DEBUG] New transform:', this.transform);
        this.updateZoomDisplay();
        this.render();
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
            { label: '↔️ Bidirectional', type: 'bidirectional', color: '#d3869b' }
        ];

        types.forEach(t => {
            const item = document.createElement('div');
            item.textContent = t.label;
            item.style.padding = '6px 12px';
            item.style.cursor = 'pointer';
            item.style.borderRadius = '4px';
            item.style.transition = 'background 0.2s';

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

            // 🔍 즉시 아키텍처 검증 요청 (Phase 4)
            const fromNode = this.nodes.find(n => n.id === newEdge.from);
            const toNode = this.nodes.find(n => n.id === newEdge.to);
            if (fromNode && toNode) {
                vscode.postMessage({
                    command: 'validateEdge',
                    edgeId: newEdge.id,
                    fromNode: fromNode,
                    toNode: toNode,
                    type: type
                });
            }
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

    updateEdgeValidation(edgeId, result) {
        const edge = this.edges.find(e => e.id === edgeId);
        if (edge) {
            edge.validation = result;
            this.render();
        }
    }

    showTooltip(x, y, content) {
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
        this.tooltip.style.display = 'none';
    }

    loadProjectState(projectState, preserveView = false) {
        try {
            this.nodes = projectState.nodes || [];
            this.edges = projectState.edges || [];
            this.clusters = projectState.clusters || [];

            // Reset transient states
            this.baselineNodes = null; // Clear comparison artifacts
            this.selectedNodes = new Set(); // Clear selection
            this.selectedEdge = null;


            // Tree 데이터 빌드
            if (this.treeRenderer) {
                this.treeData = this.treeRenderer.buildTree(this.nodes) || [];
            }

            // Flow 데이터 빌드
            if (this.flowRenderer) {
                this.flowData = this.flowRenderer.buildFlow(this.nodes) || { steps: [] };
            }

            // UI 업데이트
            const nodeCountEl = document.getElementById('node-count');
            const edgeCountEl = document.getElementById('edge-count');
            if (nodeCountEl) nodeCountEl.textContent = this.nodes.length;
            if (edgeCountEl) edgeCountEl.textContent = this.edges.length;

            // Fit view (only if not preserving)
            this.resizeCanvas(); // Ensure canvas size is correct before fitting
            if (!preserveView) {
                this.fitView();
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

            // 로드 시 모든 엣지에 대해 비동기 검증 요청
            if (typeof vscode !== 'undefined' && this.edges.length > 0) {
                this.edges.forEach(edge => {
                    const fromNode = this.nodes.find(n => n.id === edge.from);
                    const toNode = this.nodes.find(n => n.id === edge.to);
                    if (fromNode && toNode) {
                        vscode.postMessage({
                            command: 'validateEdge',
                            edgeId: edge.id,
                            fromNode: fromNode,
                            toNode: toNode,
                            type: edge.type
                        });
                    }
                });
            }

            console.log('[SYNAPSE] Loaded project state with', this.nodes.length, 'nodes');
            console.log('[SYNAPSE] Tree data:', this.treeData);
            console.log('[SYNAPSE] Flow data:', this.flowData);
            console.log('[SYNAPSE] Clusters:', this.clusters);
        } catch (error) {
            console.error('[SYNAPSE] loadProjectState error:', error);
        } finally {
            // 로딩 숨기기 (무조건 실행)
            // 로딩 숨기기 (무조건 실행)
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.remove(); // Force remove to prevent blocking
            this.render();
        }
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
    }

    updateZoomDisplay() {
        if (document.getElementById('zoom-level')) {
            document.getElementById('zoom-level').textContent = Math.round(this.transform.zoom * 100) + '%';
        }
    }

    render() {
        try {
            const ctx = this.ctx;
            const canvas = this.canvas;

            // 1. 캔버스 해상도 강제 동기화 (Zero Point Adjustment)
            this.resizeCanvas();

            // 2. 변환 매트릭스 초기화 & 클리어
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Coordinate System (DPR Scale only)
            // Note: renderGrid() here was removed because it needs camera transform
            const dpr = window.devicePixelRatio || 1;
            ctx.scale(dpr, dpr);

            // 4. 카메라 변환 적용
            ctx.save();
            ctx.translate(this.transform.offsetX, this.transform.offsetY);
            ctx.scale(this.transform.zoom, this.transform.zoom);

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
                    // 클러스터가 접혀있으면 렌더링 스킵
                    if (node.cluster_id) {
                        const cluster = this.clusters.find(c => c.id === node.cluster_id);
                        if (cluster && cluster.collapsed) continue;
                    }
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
                const zoom = this.transform.zoom;
                if (zoom < 0.4) lodText = "SATELLITE";
                else if (zoom > 1.5) lodText = "DETAIL";
                lodStatusEl.textContent = lodText;
            }

            // Debug Overlay
            this.renderDebugInfo();

        } catch (error) {
            console.error('[SYNAPSE] Render error:', error);
            const ctx = this.ctx;
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = 'red';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`Render Error: ${error.message}`, 10, 50);
            ctx.restore();
        }
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

        for (const node of this.selectedNodes) {
            if (node.data) node.data.cluster_id = null;
            node.cluster_id = null;
        }

        // 사용되지 않는 클러스터 정리
        this.clusters = this.clusters.filter(c => {
            return this.nodes.some(n => (n.data?.cluster_id === c.id) || n.cluster_id === c.id);
        });

        console.log('[SYNAPSE] Ungrouped selection');
        this.saveState(); // 클러스터 해제 후 저장
        this.takeSnapshot('Selection Ungrouped');
    }

    getClusterAt(x, y) {
        if (!this.clusters) return null;
        // 헤더 영역만 클릭 체크
        for (const cluster of this.clusters) {
            if (cluster._headerBounds) {
                const b = cluster._headerBounds;
                if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                    return cluster;
                }
            }
        }
        return null;
    }

    toggleClusterCollapse(clusterId) {
        const cluster = this.clusters.find(c => c.id === clusterId);
        if (cluster) {
            cluster.collapsed = !cluster.collapsed;
            console.log(`[SYNAPSE] Toggled cluster ${cluster.label}: ${cluster.collapsed ? 'Collapsed' : 'Expanded'}`);
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
                command: 'deleteNode',
                nodeId: nodeId
            });
        }

        console.log('[SYNAPSE] Node deleted:', nodeId);
        this.render();
    }

    deleteSelectedNodes() {
        const nodesToDelete = Array.from(this.selectedNodes);
        if (nodesToDelete.length === 0) return;

        // Confirmation for multiple nodes
        if (nodesToDelete.length > 1) {
            const confirmMsg = `Are you sure you want to delete ${nodesToDelete.length} nodes and their connections?`;
            // Browser confirm or VS Code specific if needed (using confirm for simplicity in webview)
            if (!confirm(confirmMsg)) {
                return;
            }
        }

        nodesToDelete.forEach(node => {
            this.deleteNode(node.id);
        });

        this.selectedNodes.clear();
        this.selectedNode = null;
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
                    // 결과 반영 (Mock UI 상단 표시)
                    this.flowData = res.flowData;
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

    renderGrid() {
        const gridSize = 50;
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

        for (const cluster of this.clusters) {
            // 해당 클러스터에 속한 노드들 찾기
            const clusterNodes = this.nodes.filter(n => (n.data?.cluster_id === cluster.id) || n.cluster_id === cluster.id);
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

            // Collapsed 상태 처리
            if (cluster.collapsed) {
                // 접혔을 때는 헤더만 표시
                const headerHeight = 30;

                // 배경 (헤더)
                this.ctx.fillStyle = cluster.color || '#458588';
                this.ctx.fillRect(minX - padding, minY - padding - headerHeight, (maxX - minX) + padding * 2, headerHeight);

                // 테두리
                this.ctx.strokeStyle = cluster.color || '#458588';
                this.ctx.lineWidth = 2 / this.transform.zoom;
                this.ctx.strokeRect(minX - padding, minY - padding - headerHeight, (maxX - minX) + padding * 2, headerHeight);

                // 라벨
                this.ctx.fillStyle = '#282828'; // Dark text on colored header
                this.ctx.font = `bold ${14 / this.transform.zoom}px Inter, sans-serif`;
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(cluster.label, minX - padding + 10, minY - padding - headerHeight / 2);

                // 접힘 표시 (요약)
                this.ctx.fillStyle = '#282828';
                this.ctx.textAlign = 'right';
                this.ctx.font = `${12 / this.transform.zoom}px Inter, sans-serif`;
                this.ctx.fillText(`(${clusterNodes.length} items)`, maxX + padding - 30, minY - padding - headerHeight / 2);

                // 버튼 [+]
                this.ctx.textAlign = 'center';
                this.ctx.fillText('[+]', maxX + padding - 10, minY - padding - headerHeight / 2);

            } else {
                // 펼쳐졌을 때
                const headerHeight = 30;

                // 1. 헤더 영역 (상단)
                this.ctx.fillStyle = cluster.color || '#458588';
                this.ctx.fillRect(minX - padding, minY - padding - headerHeight, (maxX - minX) + padding * 2, headerHeight);

                // 2. 본문 영역 배경 (매우 연하게)
                this.ctx.fillStyle = (cluster.color || '#458588') + '15'; // 8% 투명도
                this.ctx.fillRect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);

                // 3. 테두리 (점선)
                this.ctx.beginPath();
                this.ctx.setLineDash([10, 5]);
                this.ctx.strokeStyle = cluster.color || '#458588';
                this.ctx.lineWidth = 2 / this.transform.zoom;
                this.ctx.rect(minX - padding, minY - padding, (maxX - minX) + padding * 2, (maxY - minY) + padding * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);

                // 4. 헤더 텍스트 (라벨)
                this.ctx.fillStyle = '#282828'; // Dark text on colored header
                this.ctx.font = `bold ${14 / this.transform.zoom}px Inter, sans-serif`;
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(cluster.label, minX - padding + 10, minY - padding - headerHeight / 2);

                // 5. 버튼 [-]
                this.ctx.textAlign = 'right';
                this.ctx.fillText('[-]', maxX + padding - 10, minY - padding - headerHeight / 2);
            }

            // 헤더 영역 정보 저장 (클릭 감지용)
            // 주의: 줌/팬이 적용된 상태의 좌표계임. 그대로 저장해도 됨 (screenToWorld로 변환해서 체크할 것이므로)
            cluster._headerBounds = {
                x: minX - padding,
                y: minY - padding - 30,
                width: (maxX - minX) + padding * 2,
                height: 30
            };
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

        const typeMap = {
            // Logic (Code)
            'source': {
                borderColor: '#a89984', // Bright Grey
                bgColor: '#3c3836',
                icon: 'f()',
                lineWidth: 2,
                typeLabel: 'Logic'
            },
            'logic': { // Alias
                borderColor: '#a89984',
                bgColor: '#3c3836',
                icon: 'f()',
                lineWidth: 2,
                typeLabel: 'Logic'
            },
            // Data (Store)
            'config': {
                borderColor: '#83a598', // Blue
                bgColor: '#076678', // Dark Blue
                icon: '📋',
                lineWidth: 4, // 두꺼운 테두리
                typeLabel: 'Data'
            },
            'data': { // Alias
                borderColor: '#83a598',
                bgColor: '#076678',
                icon: 'DB',
                lineWidth: 4,
                typeLabel: 'Data'
            },
            // Entry (Gate)
            'entry': {
                borderColor: '#fe8019', // Orange
                bgColor: '#3c3836',
                icon: '▶',
                lineWidth: 2.5,
                glow: true,
                typeLabel: 'Entry'
            },
            // External
            'external': {
                borderColor: '#8ec07c', // Aqua
                bgColor: 'rgba(40, 40, 40, 0.7)', // Translucent
                icon: '☁',
                lineWidth: 2,
                dash: [5, 5],
                typeLabel: 'External'
            },
            'documentation': {
                borderColor: '#fabd2f',
                bgColor: '#3c3836',
                icon: '📄',
                lineWidth: 2,
                typeLabel: 'Doc'
            },
            'test': {
                borderColor: '#fe8019',
                bgColor: '#3c3836',
                icon: '🧪',
                lineWidth: 2,
                typeLabel: 'Test'
            }
        };

        // 파일명이나 경로를 보고 Entry 포인트를 동적으로 판단 (Main gate)
        const filePath = node.data?.file || '';
        if (filePath.match(/(main|app|index|server)\.(ts|js|py)$/i)) {
            return typeMap['entry'];
        }

        return typeMap[node.type] || defaultStyle;
    }

    renderNode(node, zoom) {
        if (!node || !node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
            return;
        }

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

        // --- Phase 3 Advanced Rendering ---
        const style = this.getNodeStyle(node);
        const isSelected = this.selectedNode === node || (this.selectedNodes && this.selectedNodes.has(node));

        // 1. 상태별 특수 효과 계산
        let borderColor = style.borderColor;
        let lineWidth = style.lineWidth;
        let bgColor = style.bgColor;
        let dash = style.dash || [];
        let glowColor = null;

        if (node.state === 'error') {
            borderColor = '#fb4934'; // Strong Red
            lineWidth += 1.5;
            glowColor = '#fb4934';
        } else if (node.state === 'pending' || node.status === 'proposed') {
            dash = [5, 5];
            // Silver/Bright Pulse 효과 (사령관의 승인을 기다리는 생명체처럼)
            const pulse = 0.4 + 0.6 * Math.sin(Date.now() / 400);
            borderColor = `rgba(235, 219, 178, ${pulse})`; // Bright Cream/Silver pulse
            glowColor = `rgba(235, 219, 178, ${pulse * 0.3})`;
        } else if (style.glow) {
            glowColor = style.borderColor;
        }

        if (isSelected) {
            borderColor = '#fabd2f';
            lineWidth = 3;
            glowColor = '#fabd2f';
        }

        // 2. 배경 및 글로우 렌더링
        this.ctx.save();
        if (glowColor && this.isAnimating) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = glowColor;
        }

        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, nodeWidth, nodeHeight);

        this.ctx.strokeStyle = borderColor;
        if (isSelected) {
            borderColor = '#fabd2f';
            lineWidth = 3;
            glowColor = '#fabd2f';
        }

        // 1.5. 클러스터 접힘 체크
        if (node.cluster_id) {
            const cluster = this.clusters?.find(c => c.id === node.cluster_id);
            if (cluster && cluster.collapsed) return;
        }
        if (dash.length > 0) {
            this.ctx.setLineDash(dash);
            if ((node.state === 'pending' || node.status === 'proposed') && this.isAnimating) {
                this.ctx.lineDashOffset = -this.animationOffset;
            }
        }
        this.ctx.strokeRect(x, y, nodeWidth, nodeHeight);
        this.ctx.restore();
        this.ctx.setLineDash([]);

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

            // Proposed 모드 가이드 버튼 ([V], [X])
            if (node.status === 'proposed' || node.state === 'pending') {
                this.renderNodeButtons(node, x, y, nodeWidth, nodeHeight);
            }

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

        // 줌이 크면 라벨 표시
        if (zoom > 1.8) {
            this.ctx.font = '9px Inter, sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#b8bb26';
            this.ctx.fillText('Approve', vBtnX - 5, btnY + btnSize / 2);
            this.ctx.fillStyle = '#fb4934';
            this.ctx.fillText('Reject', xBtnX + btnSize + 30, btnY + btnSize / 2); // 우측으로 시선 분산
            // 그냥 버튼 아래나 옆에 작게
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Approve', vBtnX + btnSize / 2, btnY - 5);
            this.ctx.fillText('Reject', xBtnX + btnSize / 2, btnY - 5);
        }
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
            const arrowPoint = this.getNodeBoundaryPoint(toX, toY, angle + Math.PI);
            if (this.isPointNearArrow(px, py, arrowPoint.x, arrowPoint.y, 20)) {
                return edge;
            }

            // Bidirectional인 경우 시작점 화살표도 체크
            const style = this.getEdgeStyle(edge);
            if (style.arrowStyle === 'double') {
                const startAngle = Math.atan2(fromY - cpY, fromX - cpX);
                const startArrowPoint = this.getNodeBoundaryPoint(fromX, fromY, startAngle + Math.PI);
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

        // 화살표 아이콘 결정 (Phase 3)
        // LOD 적용: 줌이 1.2 이상일 때만 아이콘 표시 (절제된 미학 - 노드 아이콘과 높이 맞춤)
        const showIcons = this.transform.zoom > 1.2;
        const iconMap = {
            'dependency': 'D',
            'call': 'C',
            'data_flow': 'F',
            'bidirectional': 'B'
        };
        const edgeIcon = (showIcons && iconMap[edge.type]) || '';

        // 펄스 애니메이션 적용 (Phase 3)
        // 시니어 엔지니어 제언: Data Flow와 같은 동적인 관계에만 우선 적용 (절제)
        if (this.isAnimating && edge.type === 'data_flow') {
            this.ctx.lineDashOffset = -this.animationOffset;
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.lineDashOffset = 0; // 리셋

        // 글로우 효과 리셋
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';

        // 화살표 렌더링 (노드 외곽선 교점 + 엣지 중앙)
        const angle = Math.atan2(toY - cpY, toX - cpX);
        const arrowPoint = this.getNodeBoundaryPoint(toX, toY, angle + Math.PI);

        // 1. 끝점 화살표 (노드 경계)
        this.renderArrow(arrowPoint.x, arrowPoint.y, angle, edgeColor, style.arrowStyle, edgeIcon);

        // 2. 중앙 화살표 (엣지 중간) - 시각적 명확성 향상!
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2 - 30; // 곡선 중앙점
        const midAngle = Math.atan2(toY - midY, toX - midX);
        this.renderArrow(midX, midY, midAngle, edgeColor, style.arrowStyle, edgeIcon);

        // Bidirectional인 경우 반대 방향 화살표도 그리기
        if (style.arrowStyle === 'double') {
            const startAngle = Math.atan2(fromY - cpY, fromX - cpX);
            const startArrowPoint = this.getNodeBoundaryPoint(fromX, fromY, startAngle + Math.PI);
            this.renderArrow(startArrowPoint.x, startArrowPoint.y, startAngle, edgeColor, 'standard', edgeIcon);

            // 중앙 반대 방향 화살표
            const midStartAngle = Math.atan2(fromY - midY, fromX - midX);
            this.renderArrow(midX, midY, midStartAngle, edgeColor, 'standard', edgeIcon);
        }

        // 🔍 검증 결과 표시 (에러/경고인 경우 라벨 추가)
        if (!validation.valid || validation.color === '#fabd2f' || validation.isAi) {
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2 - 35;

            this.ctx.save();
            this.ctx.font = `${12 / this.transform.zoom}px Inter, sans-serif`;

            // AI 검증인 경우 특수 효과 (Pulsing)
            let opacity = 1.0;
            if (validation.isAi && this.isAnimating) {
                opacity = 0.7 + 0.3 * Math.sin(Date.now() / 200);
            }

            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle = validation.valid ? '#fabd2f' : '#fb4934';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // 배경 박스
            const text = (validation.isAi ? '🤖 ' : '') + (validation.valid ? '⚠️' : '❌');
            const metrics = this.ctx.measureText(text);
            const padding = 6 / this.transform.zoom;

            this.ctx.fillStyle = '#282828';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.beginPath();
            const bw = metrics.width + padding * 2;
            const bh = 18 / this.transform.zoom;
            this.ctx.roundRect(midX - bw / 2, midY - bh / 2, bw, bh, 4);
            this.ctx.fill();

            this.ctx.fillStyle = validation.valid ? '#fabd2f' : '#fb4934';
            this.ctx.fillText(text, midX, midY);
            this.ctx.restore();

            // 💡 마우스 오버 시 AI 판단 이유 저장 (툴팁용)
            edge._validationReason = validation.reason;
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

            // 텍스트 색상: 어두운 배경/색상에는 밝은색, 밝은 색상에는 어두운색
            // 여기서는 고정적으로 어두운 Gruvbox 브라운 사용 (가장 잘 보임)
            this.ctx.fillStyle = '#1d2021';

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
                if (this.isAnimating) {
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

    resizeCanvas() {
        const canvas = this.canvas;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        const targetWidth = Math.floor(rect.width * dpr);
        const targetHeight = Math.floor(rect.height * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
        }
    }

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
}

// 초기화
// 초기화
let engine;

function initCanvas() {
    if (engine) return;

    // index.html의 <canvas id="canvas">와 일치해야 함
    engine = new CanvasEngine('canvas');
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
        console.log('[DEBUG] MouseDown on:', e.target.tagName, e.target.id, e.target.className);
        if (engine) {
            engine.lastInputTime = Date.now();
            engine.render(); // Force render to update debug info
        }
    }, true); // Capture phase

    // VS Code API 연동 확인
    if (typeof acquireVsCodeApi !== 'undefined' && typeof window.vscode === 'undefined') {
        window.vscode = acquireVsCodeApi();
    }

    // 메시지 리스너 등록
    window.addEventListener('message', event => {
        const message = event.data;
        console.log('[SYNAPSE] Received message:', message.command);

        switch (message.command) {
            case 'projectState':
                console.log(`[SYNAPSE] Received projectState with ${message.data.nodes?.length || 0} nodes.`);
                // 승인/거절 등의 인터랙션 후라면 뷰 유지
                const preserve = engine.isExpectingUpdate;
                engine.loadProjectState(message.data, preserve);
                engine.isExpectingUpdate = false; // 플래그 리셋
                break;
            case 'projectProposal':
                engine.loadProjectState(message.data);
                engine.fitView();
                break;
            case 'history':
                console.log(`[SYNAPSE] Received history with ${message.data.length} snapshots.`);
                engine.updateHistoryUI(message.data);
                break;
            // ... (other cases)
            case 'rollbackComplete':
                console.log('[SYNAPSE] Rollback complete msg received. Fetching new state in 200ms...');
                setTimeout(() => {
                    engine.getProjectState();
                }, 200);
                break;
            case 'fitView':
                engine.fitView();
                break;
            case 'setBaseline':
                engine.baselineNodes = message.data.nodes;
                engine.render();
                break;
            case 'requestContext':
                engine.sendContextData();
                break;
            case 'requestContext':
                engine.sendContextData();
                break;
            case 'clearBaseline':
                engine.baselineNodes = null;
                engine.render();
                break;
            case 'edgeValidationResult':
                engine.updateEdgeValidation(message.edgeId, message.result);
                break;
            case 'flowData':
                engine.flowData = message.data;
                engine.currentMode = 'flow';
                document.getElementById('loading').style.display = 'none';
                engine.render();

                // Update UI buttons for flow mode
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-mode="flow"]')?.classList.add('active');
                document.getElementById('current-mode').textContent = 'Flow';
                break;
        }
    });

    // Initial request
    engine.getProjectState();

    // Toolbar Event Listeners
    document.getElementById('btn-fit')?.addEventListener('click', () => {
        engine.fitView();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
        engine.transform = { zoom: 1.0, offsetX: 0, offsetY: 0 };
        engine.updateZoomDisplay();
        engine.render();
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

    document.getElementById('btn-animate')?.addEventListener('click', (e) => {
        engine.isAnimating = !engine.isAnimating;
        e.target.textContent = engine.isAnimating ? '🎬 On' : '⏸ Off';
        if (engine.isAnimating) engine.startAnimationLoop();
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
            console.log('[SYNAPSE] Switched to mode:', mode);

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

    // 0. dblclick listener for cluster renaming
    engine.canvas.addEventListener('dblclick', (e) => {
        const worldPos = engine.screenToWorld(e.offsetX, e.offsetY);
        const clickedCluster = engine.getClusterAt(worldPos.x, worldPos.y);
        if (clickedCluster) {
            engine.renameCluster(clickedCluster.id);
        }
    });
}

// Ensure DOM is ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvas);
} else {
    initCanvas();
}
