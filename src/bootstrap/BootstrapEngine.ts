/**
 * Bootstrap 엔진
 * GEMINI.md 파일을 읽고 전체 초기화 프로세스 실행
 */

import * as path from 'path';
import * as fs from 'fs';
import { JVMAuditor } from '../core/JVMAuditor';
import { GeminiParser } from '../core/GeminiParser';
import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { FileScanner } from '../core/FileScanner';
import { ScannerRegistry } from '../core/ScannerRegistry';
import { JsTsScanner } from '../core/JsTsScanner';
import { PythonScanner } from '../core/PythonScanner';
import { ShellScanner } from '../core/ShellScanner';
import { MarkdownScanner } from '../core/MarkdownScanner';
import { JavaScanner } from '../core/JavaScanner';
import { KotlinScanner } from '../core/KotlinScanner';
import { CppScanner } from '../core/CppScanner';
import { RustScanner } from '../core/RustScanner';
import { SqlScanner } from '../core/SqlScanner';
import { ConfigScanner } from '../core/ConfigScanner';
import { BootstrapResult, ProjectState, NodeType } from '../types/schema';
import { isIgnoredFolder, isIgnoredFile } from '../utils/exclusionRules';
import { RuleEngine } from '../core/RuleEngine';
import { phaseManager, Phase } from '../core/PhaseManager';
import { dataPipeline, PipelineResult } from '../core/DataPipeline';
import { graphModel } from '../core/GraphModel';
import { buildGraph } from '../core/graphBuilder';
import { snapshotSystem } from '../core/SnapshotSystem';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { Logger } from '../utils/Logger';

export class BootstrapEngine {
    private parser: GeminiParser;
    private flowchartGen: FlowchartGenerator;
    private fileScanner: FileScanner;

    constructor() {
        this.parser = new GeminiParser();
        this.flowchartGen = new FlowchartGenerator();
        this.fileScanner = new FileScanner();
        this.registerScanners();
    }

    private registerScanners(): void {
        const registry = ScannerRegistry.getInstance();
        if (registry.isInitialized()) return;
        registry.register(new JsTsScanner());
        registry.register(new PythonScanner());
        registry.register(new ShellScanner());
        registry.register(new MarkdownScanner());
        registry.register(new JavaScanner());
        registry.register(new KotlinScanner());
        registry.register(new CppScanner());
        registry.register(new RustScanner());
        registry.register(new SqlScanner());
        registry.register(new ConfigScanner());
        registry.markInitialized();
    }

    /**
     * Bootstrap 프로세스 실행 (v0.3.1 Phase Enforcement)
     */
    public async bootstrap(
        geminiMdPath: string,
        projectRoot: string,
        autoApprove: boolean = false
    ): Promise<BootstrapResult> {
        console.log('🚀 SYNAPSE Bootstrap 시작 (Phase 0: DATA)...');
        phaseManager.reset(); 

        try {
            // [v0.3.1] Snapshot Storage Initialize
            snapshotSystem.setStoragePath(projectRoot);

            // 1. DATA 수집 시작 (Phase 0)
            phaseManager.assertPhase(Phase.DATA);
            
            // Ensure RULES.md exists and load it
            this.ensureRulesFile(projectRoot);
            RuleEngine.getInstance().loadRules(projectRoot);

            // 1. GEMINI.md 파싱
            let structure = await this.parser.parseGeminiMd(geminiMdPath);

            // 2. 스마트 폴백: GEMINI.md에 파일 정보가 전혀 없거나 자기 자신(GEMINI.md)만 있는 경우 autoDiscover 실행
            if (!structure.files || structure.files.length === 0 || (structure.files.length === 1 && structure.files[0].path.toLowerCase().endsWith('gemini.md'))) {
                console.log('⚠️ [SYNAPSE] GEMINI.md contains no file definitions. Falling back to Auto-Discovery...');
                const discoveredState = await this.autoDiscover(projectRoot, structure.includePaths);

                // 검색된 노드 정보를 structure 형식으로 변환 (createStructure 지원을 위해)
                structure.files = discoveredState.nodes!.map(n => ({
                    path: n.data!.file || '',
                    type: n.type as any,
                    description: n.data!.description || ''
                })).filter(f => f.path);

                const nodeMap = new Map<string, string>();
                discoveredState.nodes!.forEach(n => nodeMap.set(n.id, n.data!.file || ''));

                structure.dependencies = discoveredState.edges!.map(e => ({
                    from: nodeMap.get(e.from) || '',
                    to: nodeMap.get(e.to) || '',
                    type: e.type,
                    label: e.type
                })).filter(d => d.from && d.to);
            }

            // 3. 디렉토리 구조 생성 (선택 사항)
            if (autoApprove) {
                await this.parser.createStructure(projectRoot, structure);
            }

            // [v0.3.10] Pass projectRoot for absolute path scanning
            const discoveredFiles = this.getDiscoverableFiles(projectRoot, structure.includePaths);
            
            // [JVM_AUDIT] Phase A & B: Tally stats and Potential Edges safely
            JVMAuditor.runAudit(discoveredFiles, projectRoot);
            
            const pipelineResult = await dataPipeline.processFiles(discoveredFiles, projectRoot);
            
            // [P1.5] Bounds logger helper
            const getBounds = (nodes: any[]) => {
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                for (const n of nodes) {
                    if (n.position?.x < minX) minX = n.position.x;
                    if (n.position?.x > maxX) maxX = n.position.x;
                    if (n.position?.y < minY) minY = n.position.y;
                    if (n.position?.y > maxY) maxY = n.position.y;
                }
                return { minX, maxX, minY, maxY };
            };
            console.log("[LAYOUT_STAGE]", "DataPipeline", getBounds(pipelineResult.nodes));
            console.log("[LAYOUT_STAGE]", "FlowchartGenerator", getBounds(pipelineResult.nodes));
            
            console.log(`[SCAN_DEBUG] Pipeline produced Nodes: ${pipelineResult.nodes.length}, Edges: ${pipelineResult.edges.length}`);
            // [v0.3.11] Core Freeze: Build and freeze graph
            const frozenGraph = buildGraph(pipelineResult.nodes, pipelineResult.edges, pipelineResult.clusters);
            
            console.log(`[SCAN_DEBUG] Final Frozen Graph Nodes: ${frozenGraph.nodes.length}`);
            graphModel.restoreSnapshot(frozenGraph);

            const nodes = frozenGraph.nodes;
            const edges = frozenGraph.edges;

            // 3. SNAPSHOT 생성 (Phase 2)
            phaseManager.advancePhase(Phase.SNAPSHOT);
            snapshotSystem.save();

            // 프로젝트 상태 저장
            const projectState: ProjectState = {
                version: 1,
                project_name: path.basename(projectRoot),
                gemini_md_path: geminiMdPath,
                current_snapshot_id: '',
                nodes: nodes as any,
                edges: edges as any,
                clusters: graphModel.createSnapshot().clusters as any,
                cluster_flows: [],
                metaEdges: pipelineResult.metaEdges,
                system_context: {}
            };

            const statePath = path.join(projectRoot, 'data', 'project_state.json');
            const stateDir = path.dirname(statePath);
            
            console.log(`[STATE_SAVE_START] Output path: ${statePath}`);
            console.log(`[STATE_SAVE] Nodes: ${nodes.length}, Edges: ${edges.length}`);
            
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
                console.log(`[STATE_SAVE] Created directory: ${stateDir}`);
            }
            
            try {
                fs.writeFileSync(statePath, JSON.stringify(projectState, null, 2), 'utf-8');
                console.log(`[STATE_SAVE_COMPLETE] project_state.json successfully written.`);
            } catch (err) {
                console.error(`[STATE_SAVE_ERROR] Failed to write project_state.json:`, err);
            }

            return {
                success: true,
                structure,
                initial_nodes: nodes as any,
                initial_edges: edges as any,
                metaEdges: pipelineResult.metaEdges,
                error: null
            };

        } catch (error: any) {
            console.error('\n❌ Bootstrap 실패:', error);
            phaseManager.lockSystem(`PHASE FAILED: ${error.message}`);
            return {
                success: false,
                structure: { folders: [], files: [], dependencies: [] },
                initial_nodes: [],
                initial_edges: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 프로젝트 자동 발견 및 초기화 (Lite Bootstrap - Phase 0 Integration)
     */
    public async liteBootstrap(projectRoot: string, onProgress?: (msg: string) => void): Promise<BootstrapResult> {
        console.log(`🔍 [SYNAPSE] Lite Bootstrapping project at: ${projectRoot}`);
        phaseManager.reset();

        try {
            // [v0.3.1] Snapshot Storage Initialize
            ProjectMetadata.getInstance().initialize(projectRoot);
            snapshotSystem.setStoragePath(projectRoot);
            graphModel.setProjectRoot(projectRoot);

            phaseManager.assertPhase(Phase.DATA);
            this.ensureRulesFile(projectRoot);
            RuleEngine.getInstance().loadRules(projectRoot);

            const discoveredFiles = this.getDiscoverableFiles(projectRoot);
            
            // [JVM_AUDIT] Phase A & B: Tally stats and Potential Edges safely
            JVMAuditor.runAudit(discoveredFiles, projectRoot);
            
            const pipelineResult = await dataPipeline.processFiles(discoveredFiles, projectRoot);
            
            Logger.info(`[SCAN_DEBUG] Pipeline produced Nodes: ${pipelineResult.nodes.length}, Edges: ${pipelineResult.edges.length}, Clusters: ${pipelineResult.clusters.length}`);
            
            // [v0.3.11] Core Freeze
            const frozenGraph = buildGraph(pipelineResult.nodes, pipelineResult.edges, pipelineResult.clusters);
            
            Logger.info(`[SCAN_DEBUG] Final Frozen Graph Nodes: ${frozenGraph.nodes.length}`);
            graphModel.restoreSnapshot(frozenGraph);

            let nodes = frozenGraph.nodes.slice();
            let edges = frozenGraph.edges.slice();

            // [v0.3.10] 🛡️ PRESERVE MANUAL STATE: Merge with existing manual nodes/edges
            const existingStatePath = path.join(projectRoot, 'data', 'project_state.json');
            let existingData: any = null;
            if (fs.existsSync(existingStatePath)) {
                try {
                    existingData = JSON.parse(fs.readFileSync(existingStatePath, 'utf8'));
                    
                    // 1. Preserve Positions, Layers, and Clusters for scanned nodes
                    const existingNodeMap = new Map<string, any>((existingData.nodes || []).map((n: any) => [n.id, n]));
                    nodes = nodes.map((n: any) => {
                        const existing = existingNodeMap.get(n.id);
                        if (existing) {
                            return {
                                ...n,
                                position: existing.position || n.position,
                                layer: existing.layer || n.layer,
                                // [v0.3.34.13 Fix] NEVER restore cluster_id for auto-generated nodes from snapshot!
                                // It creates a feedback loop where Ghost/Community mutations become permanent.
                                // ONLY preserve cluster_id for manual nodes (handled below).
                                cluster_id: n.cluster_id, 
                                // Do not blindly merge `existing.data` as it contains old ghost/community metadata.
                                data: n.data
                            };
                        }
                        return n;
                    });

                    // 2. Preserve Manual Nodes & Edges
                    const manualNodes = (existingData.nodes || []).filter((n: any) => 
                        n.id.startsWith('node_manual_') ||
                        n.data?.isUserCreated === true ||
                        (n.layer === 'user' && n.status === 'pending')
                    );
                    const manualNodeIds = new Set(manualNodes.map((n: any) => n.id));
                    const manualEdges = (existingData.edges || []).filter((e: any) => 
                        e.id.startsWith('edge_node_manual_') || 
                        e.status === 'pending' || 
                        e.status === 'pending_confirm' ||
                        e.status === 'manual' ||
                        manualNodeIds.has(e.from) ||
                        manualNodeIds.has(e.to)
                    );
                    
                    if (manualNodes.length > 0) nodes = [...nodes, ...manualNodes] as any;
                    if (manualEdges.length > 0) edges = [...edges, ...manualEdges] as any;
                    
                    // 3. Preserve Manual Clusters
                    if (existingData.clusters && Array.isArray(existingData.clusters)) {
                        const currentClusterIds = new Set(graphModel.createSnapshot().clusters.map(c => c.id));
                        const missingClusters = existingData.clusters.filter((c: any) => !currentClusterIds.has(c.id));
                        if (missingClusters.length > 0) {
                            // We will append these when creating the ProjectState object below
                            existingData._preservedClusters = missingClusters;
                        }
                    }

                    Logger.info(`[SYNAPSE] Merged ${manualNodes.length} manual nodes & restored layout from existing state.`);
                } catch (e) {
                    Logger.warn('[SYNAPSE] Failed to merge previous manual state', e);
                }
            }

            phaseManager.advancePhase(Phase.SNAPSHOT);
            snapshotSystem.save();

            console.log('[SAVE_START]');

            const projectState: ProjectState = {
                version: 1,
                project_name: path.basename(projectRoot),
                gemini_md_path: path.join(projectRoot, 'GEMINI.md'),
                current_snapshot_id: '',
                nodes: nodes as any,
                edges: edges as any,
                clusters: (graphModel.createSnapshot().clusters as any).concat(
                    existingData && existingData._preservedClusters ? existingData._preservedClusters : []
                ),
                cluster_flows: [],
                metaEdges: pipelineResult.metaEdges,
                system_context: {},
                deletedNodeIds: (existingData && existingData.deletedNodeIds) ? existingData.deletedNodeIds : [],
                deletedPaths: (existingData && existingData.deletedPaths) ? existingData.deletedPaths : []
            };

            const statePath = path.join(projectRoot, 'data', 'project_state.json');
            const stateDir = path.dirname(statePath);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
            console.log('[JSON_STRINGIFY_START]', projectState.nodes!.length, projectState.edges!.length, projectState.clusters!.length);
            const json = JSON.stringify(projectState, null, 2);
            console.log('[JSON_STRINGIFY_DONE]', json.length);
            console.log('[WRITE_FILE]', statePath);
            fs.writeFileSync(statePath, json, 'utf-8');
            console.log('[WRITE_SUCCESS]', fs.statSync(statePath).size);

            // [v0.3.10] Final Phase Advance: Hand over control to USER
            phaseManager.advancePhase(Phase.CONTROL);

            return {
                success: true,
                structure: { folders: [], files: [], dependencies: [] },
                initial_nodes: nodes as any,
                initial_edges: edges as any,
                metaEdges: pipelineResult.metaEdges
            };
        } catch (error: any) {
            console.error('[WRITE_FAILED]', error.message);
            console.error('\n❌ Lite Bootstrap 실패:', error);
            if (error && error.stack) {
                console.error('[LITE_BOOTSTRAP_STACK_TRACE]\n', error.stack);
            }
            phaseManager.lockSystem(`LITE BOOTSTRAP FAILED: ${error.message}`);
            return {
                success: false,
                structure: { folders: [], files: [], dependencies: [] },
                initial_nodes: [],
                initial_edges: [],
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private ensureRulesFile(projectRoot: string): void {
        const rulesPath = path.join(projectRoot, 'RULES.md');
        if (!fs.existsSync(rulesPath)) {
            const defaultRules = `# Antigravity & SYNAPSE: DTR Thought Control & Canvas Physical Rules (RULES.md)

## 1. Definition of DTR (Deep-Thinking Ratio)
**DTR** is a core metric representing the **'density and depth of reasoning'** performed internally by the model before providing a final response. 
- **Computational Definition:** $\\text{DTR} = \\frac{\\text{Deep Reasoning Steps}}{\\text{Total Inference Path}}$
- **Purpose:** To prevent unnecessary token waste and to achieve 'precise results' by exploding computational resources only in complex logical segments.

## 2. Definition of Logical Density ($\\rho$)
**Logical Density** is the **'mass'** and **'visual energy'** of a node on the SYNAPSE canvas.
- **Definition:** It indicates how many deep logical steps are encapsulated within a small number of tokens.
- **Formula:** $\\rho = \\frac{\\text{Logic Steps}}{\\text{Token Count}} \\times \\text{DTR}$
- **Visual Correlation:** Higher density nodes emit a stronger glow and possess stronger gravity towards the canvas center.

## 3. DTR Control & Operational Rules (The Valve Rules)

### 3.1 Scenario-based DTR Valve Operation
The LLM adjusts the DTR valve in real-time based on the nature of the incoming request.
- **Low Mode (DTR 0.1 ~ 0.3):** Simple syntax fixes, variable renaming, boilerplate generation. 
  - *Rule:* Do not overthink; immediately output minimal code according to the KISS (Keep It Simple, Stupid) principle.
- **Mid Mode (DTR 0.4 ~ 0.6):** General business logic, unit tests, API integration.
  - *Rule:* Verify once for logical consistency before outputting.
- **High Mode (DTR 0.7 ~ 0.95):** Kernel debugging, architectural design, security vulnerability analysis.
  - *Rule:* Simulate all reasoning paths and use 'Think@n' strategies to early-halt high-error probability paths.

### 3.2 SYNAPSE Canvas Rendering Rules
DTR values feed back directly into the SYNAPSE canvas physics engine.
- **Glow Rule:** Outputs with DTR 0.7 or higher must be created as nodes with a purple (#8A2BE2) neon glow effect.
- **Gravity Rule:** High-density nodes congregate at the canvas center, forcing related low-density nodes into a child-node alignment (Clustering).
- **Tension Rule:** Higher inference confidence and DTR result in thicker edges between nodes, visualizing 'strong logic'.

## 4. Manual Override
If a user modifies thresholds within \`RULES.md\` or manually adjusts the valve through the interface, the model prioritizes **user input as the highest priority** over its own self-judgment, immediately changing the depth of thought.

## 5. Documentation Management Regulation (Documentation Shelf Rules)
The **Documentation Shelf** of the Synapse canvas is a sacred storage area for managing project knowledge assets. To prevent information pollution from unnecessary nodes, the following rules are observed:

- **Explicit Adoption & Scope Limitation Principle:** Only documents marked with the 📄 icon or the \`File:\` keyword in \`GEMINI.md\` are exposed on the canvas. These documents must reside within the **project root** or the **\`Doc/\` folder**.
- **Initial Visualization Control:** The \`Documentation Shelf\` and \`Intelligent Context Vault\` clusters are rendered in a **collapsed state by default** to reduce visual cognitive load. Users can expand them manually.
- **Anti-Overlap:** During node loading or placement, physical overlaps are automatically detected and self-corrected (Resolve Overlaps) to maintain a minimum spacing of 150px (X) and 100px (Y).
- **Data Hygiene:** During large-scale document parsing, only the top 20 headers are included in the summary to optimize payload size.
- **Auto-Exclusion List:** \`README.md\`, \`CHANGELOG.md\`, etc., are excluded by default (Node Diet).

## 6. 📌 강제 파일 투사 규칙 (Forced File Projection Rules)
- **[트리거]:** 프롬프트 입력 및 파일 최종 Write 직전 예외 없이 수행.
- **[수행 명령]:** 프로젝트 루트의 \`context/\` 폴더 내에 \`yyyy.mm.dd.tt.synapse_gate.txt\` 형태로 평문 파일을 생성하거나 Append(이어쓰기)하라.
- **[필수 기록 데이터]:** 
  1. 사용자 원본 프롬프트 내용 (Raw User Prompt)
  2. 이번 프롬프트로 인해 수행한 추론 과정 요약 (Core CoT)
  3. 수정 및 생성된 변경 파일 목록 (Affected Files Diff)
- **[주의 사항]:** 구글 안티그래비티 내부 암호화 샌드박스에 갇히지 말고, 반드시 외부에서 인간 매니저와 AXON 데몬이 읽을 수 있는 평문(Plain Text)으로 출력할 것.
`;
            fs.writeFileSync(rulesPath, defaultRules, 'utf8');
        }
    }

    /**
     * 프로젝트 자동 발견 (Headless - Phase 0 DATA Collection)
     */
    public async autoDiscover(projectRoot: string, includePaths?: string[], onProgress?: (msg: string) => void): Promise<ProjectState> {
        Logger.info(`🔍 [SYNAPSE] Auto-discovering source files in: ${projectRoot}`);
        // [v0.3.13 Fix] Ensure exclusion rules are loaded before scan to prevent explosions
        RuleEngine.getInstance().loadRules(projectRoot);
        const discoveredFiles = this.getDiscoverableFiles(projectRoot, includePaths);
        
        // [JVM_AUDIT] Execute JVM diagnostics on autoDiscover too
        JVMAuditor.runAudit(discoveredFiles, projectRoot);
        
        const pipelineResult = await dataPipeline.processFiles(discoveredFiles, projectRoot);
        
        // [v0.3.11] Core Freeze
        const frozenGraph = buildGraph(pipelineResult.nodes, pipelineResult.edges, pipelineResult.clusters);
        graphModel.restoreSnapshot(frozenGraph);

        const nodes = frozenGraph.nodes;
        const edges = frozenGraph.edges;

        const state: ProjectState = {
            project_name: path.basename(projectRoot),
            gemini_md_path: path.join(projectRoot, 'GEMINI.md'),
            current_snapshot_id: '',
            canvas_state: {
                zoom_level: 1.0,
                offset: { x: 0, y: 0 },
                visible_layers: ['source', 'documentation']
            },
            nodes: nodes as any,
            edges: edges as any,
            clusters: graphModel.createSnapshot().clusters as any,
            cluster_flows: [],
            system_context: {}
        };
        
        // [v0.3.10] Advance phase for interactive auto-discovery
        phaseManager.advancePhase(Phase.CONTROL);
        return state;
    }

    /**
     * 프로젝트 루트로부터 스캔 가능한 파일 경로 리스트 추출 (v0.3.1 Phase 0)
     */
    private getDiscoverableFiles(projectRoot: string, includePaths?: string[]): string[] {
        const fileList: string[] = [];
        const stats: Record<string, number> = {};
        
        const scanDir = (dir: string, relPath: string = '', depth: number = 0) => {
            if (!fs.existsSync(dir) || depth > 10) return;
            const files = fs.readdirSync(dir);
            files.sort(); // [v0.3.34.13 Fix] Ensure deterministic file scanning order
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const currentRelPath = path.join(relPath, file).replace(/\\/g, '/');
                if (isIgnoredFolder(currentRelPath)) continue;
                
                // [v0.3.32.2] Let exclusion rules handle 'data' instead of hardcoding, as some C projects (like DOOM) use it for source.
                const stat = fs.statSync(fullPath);
                
                if (includePaths && includePaths.length > 0 && relPath === '' && !stat.isDirectory()) {
                    // [v0.3.11] 🛡️ 루트 디렉토리의 파일은 includePaths 설정과 관계없이 항상 포함 시도
                } else if (includePaths && includePaths.length > 0 && relPath === '' && stat.isDirectory()) {
                    const isIncluded = includePaths.some(p => {
                        const normalizedP = p.replace(/^\.\//, '').replace(/\/$/, '');
                        return file === normalizedP || file.startsWith(normalizedP + '/');
                    });
                    if (!isIncluded) continue;
                }
                if (stat.isDirectory()) {
                    scanDir(fullPath, currentRelPath, depth + 1);
                } else {
                    const ext = path.extname(file).toLowerCase();
                    const fileName = file.toLowerCase();
                    
                    stats[ext] = (stats[ext] || 0) + 1;
                    
                    // [v0.3.10] All MD files are now discoverable
                    const isProtocol = fileName === 'rules.md' || fileName === 'gemini.md' || fileName === 'architecture.md' || fileName.includes('report');
                    
                    if (isIgnoredFile(currentRelPath)) continue;
                    const scanExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.cc', '.rs', '.sh', '.sql', '.md', '.csv', '.yaml', '.yml', '.json', '.java', '.kt', '.kts', '.swift', '.go'];
                    if (scanExtensions.includes(ext) || isProtocol) {
                        fileList.push(currentRelPath);
                    }
                }
            }
        };
        scanDir(projectRoot);
        
        Logger.info(`[SCAN_DEBUG] Directory Walker completed. Total valid nodes added to fileList: ${fileList.length}`);
        Logger.info(`[SCAN_DEBUG] Extension Stats:`, JSON.stringify(stats, null, 2));
        
        return fileList;
    }

    private scoutDTR(filePath: string, type: NodeType): any {
        return { dtr: 0.3, confidence: 0.9 }; // Simplified for Phase 1
    }

    private calculateComplexityHeuristic(content: string): number {
        return 1; // Simplified for Phase 1
    }
}
