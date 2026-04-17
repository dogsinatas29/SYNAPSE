/**
 * Bootstrap 엔진
 * GEMINI.md 파일을 읽고 전체 초기화 프로세스 실행
 */

import * as path from 'path';
import * as fs from 'fs';
import { GeminiParser } from '../core/GeminiParser';
import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { FileScanner } from '../core/FileScanner'; // Import Scanner
import { BootstrapResult, ProjectState, NodeType } from '../types/schema';
import { isIgnoredFolder, isIgnoredFile } from '../utils/exclusionRules';
import { RuleEngine } from '../core/RuleEngine';
import { phaseManager, Phase } from '../core/PhaseManager';
import { dataPipeline, PipelineResult } from '../core/DataPipeline';
import { graphModel } from '../core/GraphModel';
import { buildGraph } from '../core/graphBuilder';
import { snapshotSystem } from '../core/SnapshotSystem';
import { Logger } from '../utils/Logger';

export class BootstrapEngine {
    private parser: GeminiParser;
    private flowchartGen: FlowchartGenerator;
    private fileScanner: FileScanner; // Add Scanner

    constructor() {
        this.parser = new GeminiParser();
        this.flowchartGen = new FlowchartGenerator();
        this.fileScanner = new FileScanner(); // Initialize
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
            if (structure.files.length === 0 || (structure.files.length === 1 && structure.files[0].path.toLowerCase().endsWith('gemini.md'))) {
                console.log('⚠️ [SYNAPSE] GEMINI.md contains no file definitions. Falling back to Auto-Discovery...');
                const discoveredState = await this.autoDiscover(projectRoot, structure.includePaths);

                // 검색된 노드 정보를 structure 형식으로 변환 (createStructure 지원을 위해)
                structure.files = discoveredState.nodes.map(n => ({
                    path: n.data.file || '',
                    type: n.type as any,
                    description: n.data.description || ''
                })).filter(f => f.path);

                const nodeMap = new Map<string, string>();
                discoveredState.nodes.forEach(n => nodeMap.set(n.id, n.data.file || ''));

                structure.dependencies = discoveredState.edges.map(e => ({
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
            const pipelineResult = dataPipeline.processFiles(discoveredFiles, projectRoot);
            
            // [v0.3.11] Core Freeze: Build and freeze graph
            const frozenGraph = buildGraph(pipelineResult.nodes, pipelineResult.edges, pipelineResult.clusters);
            graphModel.restoreSnapshot(frozenGraph);

            const nodes = frozenGraph.nodes;
            const edges = frozenGraph.edges;

            // 3. SNAPSHOT 생성 (Phase 2)
            phaseManager.advancePhase(Phase.SNAPSHOT);
            snapshotSystem.save();

            // 프로젝트 상태 저장
            const projectState: ProjectState = {
                project_name: path.basename(projectRoot),
                gemini_md_path: geminiMdPath,
                canvas_state: {
                    zoom_level: 1.0,
                    offset: { x: 0, y: 0 },
                    visible_layers: ['source', 'documentation']
                },
                nodes: nodes as any,
                edges: edges as any,
                clusters: graphModel.createSnapshot().clusters as any
            };

            const statePath = path.join(projectRoot, 'data', 'project_state.json');
            const stateDir = path.dirname(statePath);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
            fs.writeFileSync(statePath, JSON.stringify(projectState, null, 2), 'utf-8');

            return {
                success: true,
                structure,
                initial_nodes: nodes as any,
                initial_edges: edges as any
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
            snapshotSystem.setStoragePath(projectRoot);
            graphModel.setProjectRoot(projectRoot);

            phaseManager.assertPhase(Phase.DATA);
            this.ensureRulesFile(projectRoot);
            RuleEngine.getInstance().loadRules(projectRoot);

            const discoveredFiles = this.getDiscoverableFiles(projectRoot);
            const pipelineResult = dataPipeline.processFiles(discoveredFiles, projectRoot);
            
            // [v0.3.11] Core Freeze
            const frozenGraph = buildGraph(pipelineResult.nodes, pipelineResult.edges, pipelineResult.clusters);
            graphModel.restoreSnapshot(frozenGraph);

            let nodes = [...frozenGraph.nodes];
            let edges = [...frozenGraph.edges];

            // [v0.3.10] 🛡️ PRESERVE MANUAL STATE: Merge with existing manual nodes/edges
            const existingStatePath = path.join(projectRoot, 'data', 'project_state.json');
            if (fs.existsSync(existingStatePath)) {
                try {
                    const existingData = JSON.parse(fs.readFileSync(existingStatePath, 'utf8'));
                    const manualNodes = (existingData.nodes || []).filter((n: any) => n.id.startsWith('node_manual_'));
                    const manualEdges = (existingData.edges || []).filter((e: any) => 
                        e.id.startsWith('edge_node_manual_') || 
                        e.status === 'pending' || 
                        e.status === 'pending_confirm' ||
                        e.status === 'manual'
                    );
                    
                    if (manualNodes.length > 0) nodes = [...nodes, ...manualNodes] as any;
                    if (manualEdges.length > 0) edges = [...edges, ...manualEdges] as any;
                    Logger.info(`[SYNAPSE] Merged ${manualNodes.length} manual nodes & ${manualEdges.length} manual edges from existing state.`);
                } catch (e) {
                    Logger.warn('[SYNAPSE] Failed to merge previous manual state', e);
                }
            }

            phaseManager.advancePhase(Phase.SNAPSHOT);
            snapshotSystem.save();

            const projectState: ProjectState = {
                project_name: path.basename(projectRoot),
                gemini_md_path: path.join(projectRoot, 'GEMINI.md'),
                canvas_state: {
                    zoom_level: 1.0,
                    offset: { x: 0, y: 0 },
                    visible_layers: ['source', 'documentation']
                },
                nodes: nodes as any,
                edges: edges as any,
                clusters: graphModel.createSnapshot().clusters as any
            };

            const statePath = path.join(projectRoot, 'data', 'project_state.json');
            const stateDir = path.dirname(statePath);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
            fs.writeFileSync(statePath, JSON.stringify(projectState, null, 2), 'utf-8');

            // [v0.3.10] Final Phase Advance: Hand over control to USER
            phaseManager.advancePhase(Phase.CONTROL);

            return {
                success: true,
                structure: { folders: [], files: [], dependencies: [] },
                initial_nodes: nodes as any,
                initial_edges: edges as any
            };
        } catch (error: any) {
            console.error('\n❌ Lite Bootstrap 실패:', error);
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
            const defaultRules = `# SYNAPSE Architecture & Discovery Rules\n\n- **Real Path Priority**: Only valid nodes.\n- **Exclusion**: node_modules, .git, etc.\n`;
            fs.writeFileSync(rulesPath, defaultRules, 'utf8');
        }
    }

    /**
     * 프로젝트 자동 발견 (Headless - Phase 0 DATA Collection)
     */
    public async autoDiscover(projectRoot: string, includePaths?: string[], onProgress?: (msg: string) => void): Promise<ProjectState> {
        console.log(`🔍 [SYNAPSE] Auto-discovering source files in: ${projectRoot}`);
        // [v0.3.13 Fix] Ensure exclusion rules are loaded before scan to prevent explosions
        RuleEngine.getInstance().loadRules(projectRoot);
        const discoveredFiles = this.getDiscoverableFiles(projectRoot, includePaths);
        const pipelineResult = dataPipeline.processFiles(discoveredFiles, projectRoot);
        
        // [v0.3.11] Core Freeze
        const frozenGraph = buildGraph(pipelineResult.nodes, pipelineResult.edges, pipelineResult.clusters);
        graphModel.restoreSnapshot(frozenGraph);

        const nodes = frozenGraph.nodes;
        const edges = frozenGraph.edges;

        const state: ProjectState = {
            project_name: path.basename(projectRoot),
            gemini_md_path: path.join(projectRoot, 'GEMINI.md'),
            canvas_state: {
                zoom_level: 1.0,
                offset: { x: 0, y: 0 },
                visible_layers: ['source', 'documentation']
            },
            nodes: nodes as any,
            edges: edges as any,
            clusters: graphModel.createSnapshot().clusters as any
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
        const scanDir = (dir: string, relPath: string = '', depth: number = 0) => {
            if (!fs.existsSync(dir) || depth > 10) return;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const currentRelPath = path.join(relPath, file).replace(/\\/g, '/');
                if (isIgnoredFolder(file)) continue;
                
                // [v0.3.10] Metadata folders are now discoverable but routed to the shelf
                if (file.toLowerCase() === 'data') continue;
                
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
                    
                    // [v0.3.10] All MD files are now discoverable
                    const isProtocol = fileName === 'rules.md' || fileName === 'gemini.md' || fileName === 'architecture.md' || fileName.includes('report');
                    
                    if (isIgnoredFile(currentRelPath)) continue;
                    const scanExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.cc', '.rs', '.sh', '.sql', '.md', '.csv', '.yaml', '.yml'];
                    if (scanExtensions.includes(ext) || isProtocol) {
                        fileList.push(currentRelPath);
                    }
                }
            }
        };
        scanDir(projectRoot);
        return fileList;
    }

    private scoutDTR(filePath: string, type: NodeType): any {
        return { dtr: 0.3, confidence: 0.9 }; // Simplified for Phase 1
    }

    private calculateComplexityHeuristic(content: string): number {
        return 1; // Simplified for Phase 1
    }
}
