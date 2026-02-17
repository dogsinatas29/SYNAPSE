/**
 * Bootstrap 엔진
 * GEMINI.md 파일을 읽고 전체 초기화 프로세스 실행
 */

import * as path from 'path';
import * as fs from 'fs';
import { GeminiParser } from '../core/GeminiParser';
import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { BootstrapResult, ProjectState } from '../types/schema';

export class BootstrapEngine {
    private parser: GeminiParser;
    private flowchartGen: FlowchartGenerator;

    constructor() {
        this.parser = new GeminiParser();
        this.flowchartGen = new FlowchartGenerator();
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
            // 1. GEMINI.md 파싱
            const structure = await this.parser.parseGeminiMd(geminiMdPath);

            // 2. 디렉토리 구조 생성
            if (autoApprove) {
                await this.parser.createStructure(projectRoot, structure);
            }

            // 3. 초기 순서도 생성
            const { nodes, edges } = this.flowchartGen.generateInitialFlowchart(structure);

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
                clusters: []
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
    public async liteBootstrap(projectRoot: string): Promise<BootstrapResult> {
        console.log(`🔍 [SYNAPSE] Lite Bootstrapping project at: ${projectRoot}`);

        try {
            const projectState = await this.autoDiscover(projectRoot);

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
     * 프로젝트 자동 발견 (Headless Bootstrap)
     */
    public async autoDiscover(projectRoot: string): Promise<ProjectState> {
        console.log(`🔍 [SYNAPSE] Auto-discovering source files in: ${projectRoot}`);

        const structure: any = {
            folders: [],
            files: [],
            dependencies: []
        };

        const scanDir = (dir: string, relPath: string = '') => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                // Ignore common directories and data/project_state.json
                if (['node_modules', '.git', 'build', 'dist', 'data', 'out'].includes(file)) continue;

                const fullPath = path.join(dir, file);
                const currentRelPath = path.join(relPath, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    structure.folders.push(currentRelPath);
                    scanDir(fullPath, currentRelPath);
                } else {
                    const ext = path.extname(file).toLowerCase();
                    if (['.ts', '.js', '.py', '.cpp', '.h', '.c', '.hpp', '.cc', '.md', '.rs'].includes(ext)) {
                        let type: any = 'source';
                        if (ext === '.md') type = 'documentation';
                        if (['.json', '.yaml', '.yml'].includes(ext)) type = 'config';

                        structure.files.push({
                            path: currentRelPath.replace(/\\/g, '/'), // Force forward slashes
                            type,
                            description: `${file} (Auto-detected)`
                        });
                    }
                }
            }
        };

        try {
            scanDir(projectRoot);
        } catch (e) {
            console.error('[SYNAPSE] Scan error:', e);
        }

        const { nodes, edges } = this.flowchartGen.generateInitialFlowchart(structure);

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
            clusters: []
        };
    }

    private printStructurePreview(structure: any): void {
        // Implementation remains same or simplified
    }
}
