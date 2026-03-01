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
     * Bootstrap 프로세스 실행
     */
    public async bootstrap(
        geminiMdPath: string,
        projectRoot: string,
        autoApprove: boolean = false
    ): Promise<BootstrapResult> {
        console.log('🚀 SYNAPSE Bootstrap 시작...');

        try {
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

                // 의존성 정보 매핑 (중요: autoDiscover에서 찾아낸 엣지들을 structure에 반영)
                // Note: discoveredState.edges has {from, to, type}. structure.dependencies needs file paths.
                // We need to map node IDs back to file paths.
                const nodeMap = new Map<string, string>();
                discoveredState.nodes.forEach(n => nodeMap.set(n.id, n.data.file || ''));

                structure.dependencies = discoveredState.edges.map(e => ({
                    from: nodeMap.get(e.from) || '',
                    to: nodeMap.get(e.to) || '',
                    type: e.type,
                    label: e.type
                })).filter(d => d.from && d.to);
            }

            // 3. 디렉토리 구조 생성
            if (autoApprove) {
                await this.parser.createStructure(projectRoot, structure);
            }

            // 4. 초기 순서도 및 클러스터 생성
            const { nodes, edges, clusters } = this.flowchartGen.generateInitialFlowchart(structure);

            // 프로젝트 상태 저장
            const projectState: ProjectState = {
                project_name: path.basename(projectRoot),
                gemini_md_path: geminiMdPath,
                canvas_state: {
                    zoom_level: 1.0,
                    offset: { x: 0, y: 0 },
                    visible_layers: ['source', 'documentation']
                },
                nodes,
                edges,
                clusters
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
                initial_nodes: nodes,
                initial_edges: edges
            };

        } catch (error) {
            console.error('\n❌ Bootstrap 실패:', error);
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
     * 프로젝트 자동 발견 및 초기화 (Lite Bootstrap)
     */
    public async liteBootstrap(projectRoot: string, onProgress?: (msg: string) => void): Promise<BootstrapResult> {
        console.log(`🔍 [SYNAPSE] Lite Bootstrapping project at: ${projectRoot}`);
        if (onProgress) onProgress('Initializing rules...');

        try {
            // Ensure RULES.md exists and load it
            this.ensureRulesFile(projectRoot);
            RuleEngine.getInstance().loadRules(projectRoot);

            const projectState = await this.autoDiscover(projectRoot, undefined, onProgress);

            const statePath = path.join(projectRoot, 'data', 'project_state.json');
            const stateDir = path.dirname(statePath);
            if (!fs.existsSync(stateDir)) {
                fs.mkdirSync(stateDir, { recursive: true });
            }
            console.log(`💾 [SYNAPSE] Saving initial project state to: ${statePath}`);
            fs.writeFileSync(statePath, JSON.stringify(projectState, null, 2), 'utf-8');

            return {
                success: true,
                structure: { folders: [], files: [], dependencies: [] }, // Lite bootstrap doesn't use standard structure
                initial_nodes: projectState.nodes,
                initial_edges: projectState.edges
            };
        } catch (error) {
            console.error('\n❌ Lite Bootstrap 실패:', error);
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
     * Ensures that RULES.md exists in the project root.
     * If not, creates it with default content.
     */
    private ensureRulesFile(projectRoot: string): void {
        const rulesPath = path.join(projectRoot, 'RULES.md');
        if (!fs.existsSync(rulesPath)) {
            console.log('📝 [SYNAPSE] RULES.md not found. Generating default rules file...');
            const defaultRules = `# SYNAPSE Architecture & Discovery Rules (설계 및 발견 규칙)

This document defines the rules for how SYNAPSE discovers, parses, and visualizes the project architecture.
본 문서는 SYNAPSE가 프로젝트 아키텍처를 발견, 파싱 및 시각화하는 규칙을 정의합니다.

---

## 1. Node Inclusion Rules (노드 포함 규칙)
- **Real Path Priority (실제 경로 우선)**: Only files and folders that actually exist in the project root (e.g., \`src/\`, \`prompts/\`) are valid nodes.
- **Icon Standards (아이콘 표준)**: 
    - Folder nodes MUST be prefixed with the 📁 icon.
    - File nodes MUST be prefixed with the 📄 icon.
- **Core Components (중추 컴포넌트)**: Critical system logic must always be placed in the top-level cluster.

## 2. Exclusion & Refinement Rules (제외 및 정제 규칙)
- **Code Block Isolation (코드 블록 격리)**: Text inside multi-line code blocks is excluded from scanning.
- **Inline Code Protection (인라인 코드 보호)**: Filenames wrapped in single backticks (\`...\`) do not trigger node creation.
- **Comment Ignores (주석 무시)**: Text inside HTML comments \`<!-- ... -->\` is ignored.
- **Node Diet (최적화)**: Non-architectural documents and build artifacts are excluded:
    - \`README.md\`, \`README_KR.md\`, \`CHANGELOG.md\`, \`.vsix\`, \`.js.map\`
    - \`node_modules\`, \`.git\`, \`dist\`, \`build\`, \`ui\`

## 3. Edge & Flow Definitions (엣지 및 흐름 정의)
- **Execution Flow Priority (실행 흐름 우선)**: Connections (\`-->\`) should represent actual **'Execution Flow'**.
- **Layer Compliance (레이어 준수)**: Connections should follow: \`Discovery\` -> \`Reasoning\` -> \`Action\`.
`;
            fs.writeFileSync(rulesPath, defaultRules, 'utf8');
        }
    }

    /**
     * 프로젝트 자동 발견 (Headless Bootstrap)
     */
    public async autoDiscover(projectRoot: string, includePaths?: string[], onProgress?: (msg: string) => void): Promise<ProjectState> {
        console.log(`🔍 [SYNAPSE] Auto-discovering source files in: ${projectRoot}`);
        if (onProgress) onProgress('Discovering project files...');

        const structure: any = {
            folders: [],
            files: [],
            dependencies: []
        };

        let fileCount = 0;
        const scanDir = (dir: string, relPath: string = '') => {
            if (!fs.existsSync(dir)) return;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const currentRelPath = path.join(relPath, file).replace(/\\/g, '/');

                if (isIgnoredFolder(file)) continue;

                if (includePaths && includePaths.length > 0 && relPath === '') {
                    const isIncluded = includePaths.some(p => {
                        const normalizedP = p.replace(/^\.\//, '').replace(/\/$/, '');
                        return file === normalizedP || file.startsWith(normalizedP + '/');
                    });
                    if (!isIncluded) continue;
                }

                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    structure.folders.push(currentRelPath);
                    scanDir(fullPath, currentRelPath);
                } else {
                    const ext = path.extname(file).toLowerCase();

                    if (isIgnoredFile(currentRelPath)) {
                        continue;
                    }

                    const scanExtensions = [
                        '.ts', '.js', '.py', '.cpp', '.h', '.c', '.hpp', '.cc', '.rs', '.sh', '.sql', '.md'
                    ];

                    if (scanExtensions.includes(ext)) {
                        fileCount++;
                        if (fileCount % 50 === 0 && onProgress) {
                            onProgress(`Discovering files (${fileCount} found)...`);
                        }

                        const type: NodeType = ext === '.md' ? 'documentation' : 'source';
                        structure.files.push({
                            path: currentRelPath.replace(/\\/g, '/'),
                            type,
                            description: `${file} (${type === 'documentation' ? 'Doc' : 'Auto-detected'})`
                        });

                        // [v0.2.16 Opt] Deep Scanning decoupled from discovery walk to prevent hangs
                        // Content summary will be populated separately during sendProjectState
                    }
                }
            }
        };

        try {
            scanDir(projectRoot);
            if (onProgress) onProgress(`Finalizing structure for ${fileCount} files...`);

            // Re-process dependencies to match actual file paths
            const filePaths = new Set(structure.files.map((f: any) => f.path));
            const validDependencies: any[] = [];

            structure.dependencies.forEach((dep: any) => {
                // 'ref' might be a module name or partial path. 
                // Try to find a file that ends with this name (naive resolution)
                // or exactly matches.

                // 0. Handle relative imports (from .module import X)
                if (dep.to.startsWith('.')) {
                    const fromDir = path.dirname(dep.from);
                    const cleanTo = dep.to.replace(/^\.+/, '');
                    const resolvedPath = path.join(fromDir, cleanTo).replace(/\\/g, '/');

                    // Try with extensions
                    const extensions = ['.ts', '.js', '.py'];
                    for (const ext of extensions) {
                        if (filePaths.has(resolvedPath + ext)) {
                            validDependencies.push({ ...dep, to: resolvedPath + ext });
                            return;
                        }
                    }
                    if (filePaths.has(resolvedPath)) {
                        validDependencies.push({ ...dep, to: resolvedPath });
                        return;
                    }
                }

                // 1. Exact match
                if (filePaths.has(dep.to)) {
                    validDependencies.push(dep);
                    return;
                }

                // 2. Fuzzy match (reference 'User' -> 'src/models/User.ts')
                const match = structure.files.find((f: any) => {
                    const fName = path.basename(f.path, path.extname(f.path));
                    const extensions = ['.ts', '.js', '.py'];

                    // Match by filename (e.g., 'calculator' matches 'calculator.py')
                    if (fName === dep.to) return true;

                    // Match by partial path (e.g., 'models/User' matches 'src/models/User.ts')
                    for (const ext of extensions) {
                        const target = dep.to + ext;
                        if (f.path === target || f.path.endsWith('/' + target)) return true;
                    }

                    return false;
                });

                if (match) {
                    console.log(`  - [Resolved] ${dep.to} -> ${match.path}`);
                    validDependencies.push({
                        ...dep,
                        to: match.path
                    });
                } else {
                    // 3. External Library Support (Not found in project, but keep it)
                    // Skip common built-in modules or very short noise
                    if (dep.to.length > 1 && !dep.to.startsWith('/') && !dep.to.includes('\\')) {
                        console.log(`  - [External] ${dep.to} (Potential library)`);
                        // Add to structure.files if not already there as an external node
                        if (!structure.files.some((f: any) => f.path === dep.to && f.type === 'external')) {
                            structure.files.push({
                                path: dep.to,
                                type: 'external',
                                description: `External Library: ${dep.to}`
                            });
                        }
                        validDependencies.push({
                            ...dep,
                            to: dep.to,
                            type: 'dependency'
                        });
                    }
                }
            });

            structure.dependencies = validDependencies;

        } catch (e) {
            console.error('[SYNAPSE] Scan error:', e);
        }

        const { nodes, edges, clusters } = this.flowchartGen.generateInitialFlowchart(structure);

        return {
            project_name: path.basename(projectRoot),
            gemini_md_path: path.join(projectRoot, 'GEMINI.md'),
            canvas_state: {
                zoom_level: 1.0,
                offset: { x: 0, y: 0 },
                visible_layers: ['source', 'documentation']
            },
            nodes,
            edges,
            clusters
        };
    }

    private printStructurePreview(structure: any): void {
        // Implementation remains same or simplified
    }
}
