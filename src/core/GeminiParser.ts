/**
 * GEMINI.md 파서
 * GEMINI.md 파일을 읽고 프로젝트 구조를 분석
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectStructure, NodeType, EdgeType } from '../types/schema';

export class GeminiParser {
    /**
     * GEMINI.md 파일 읽기 및 분석
     */
    public async parseGeminiMd(filePath: string): Promise<ProjectStructure> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // AI를 사용하여 구조 분석 (현재는 간단한 패턴 매칭)
            const structure = this.analyzeContent(content);

            console.log('✅ GEMINI.md 분석 완료');
            console.log(`  - 폴더: ${structure.folders.length}개`);
            console.log(`  - 파일: ${structure.files.length}개`);
            console.log(`  - 의존성: ${structure.dependencies.length}개`);

            return structure;
        } catch (error) {
            console.error('❌ GEMINI.md 파싱 실패:', error);
            throw error;
        }
    }

    /**
     * 내용 분석 (간단한 패턴 매칭)
     * TODO: 실제로는 AI API를 호출하여 더 정교한 분석 수행
     */
    private analyzeContent(content: string): ProjectStructure {
        const structure: ProjectStructure = {
            folders: [],
            files: [],
            dependencies: []
        };

        // 1. 기존 패턴 (📂, 📄)
        const folderPattern = /📂\s+([^\s/]+)\//g;
        let match;
        while ((match = folderPattern.exec(content)) !== null) {
            const folderName = match[1];
            if (!structure.folders.includes(folderName)) {
                structure.folders.push(folderName);
            }
        }

        const filePattern = /📄\s+([^\s]+\.(py|ts|js|md|json|sql))/g;
        while ((match = filePattern.exec(content)) !== null) {
            const fileName = match[1];
            const ext = match[2];
            let type: NodeType = 'source';
            if (ext === 'md') type = 'documentation';
            if (ext === 'json') type = 'config';
            if (fileName.includes('test')) type = 'test';

            structure.files.push({
                path: fileName,
                type,
                description: `${fileName} 파일`
            });
        }

        // 2. 새로운 패턴 (NodeName: Description) - [Nodes] 섹션 이후
        const nodesSection = content.split(/1\.\s+아키텍처 토폴로지|\[Nodes\]/i)[1];
        if (nodesSection) {
            const nodesContent = nodesSection.split(/2\.\s+데이터 흐름|\[Edges\]/i)[0];
            const nodeLines = nodesContent.split('\n');
            nodeLines.forEach(line => {
                const nodeMatch = line.match(/^([a-zA-Z0-9_]+):\s*(.*)/);
                if (nodeMatch) {
                    const nodeName = nodeMatch[1];
                    const description = nodeMatch[2].trim();

                    // 파일 경로 추측 (이미 있으면 건너뜀)
                    if (!structure.files.find(f => f.path.startsWith(nodeName))) {
                        structure.files.push({
                            path: `${nodeName}.ts`, // 기본값은 .ts
                            type: 'source',
                            description: description
                        });
                    }
                }
            });
        }

        // 3. 엣지 패턴 (NodeA --> NodeB: Label)
        const edgePattern = /([a-zA-Z0-9_]+)\s*-->\s*([a-zA-Z0-9_]+)(?::\s*(.*))?/g;
        while ((match = edgePattern.exec(content)) !== null) {
            const from = match[1];
            const to = match[2];
            const label = match[3] || '';

            structure.dependencies.push({
                from: `${from}.ts`,
                to: `${to}.ts`,
                type: 'dependency',
                label: label
            });
        }

        // 기본 구조가 없으면 샘플 구조 생성
        if (structure.folders.length === 0 && structure.files.length === 0) {
            structure.folders = ['src', 'data', 'assets'];
            structure.files = [
                { path: 'src/main.ts', type: 'source', description: '메인 엔트리 포인트' },
                { path: 'src/types/schema.ts', type: 'source', description: '데이터 스키마' },
                { path: 'data/config.json', type: 'config', description: '설정 파일' },
                { path: 'README.md', type: 'documentation', description: '프로젝트 문서' }
            ];

            structure.dependencies = [
                { from: 'src/main.ts', to: 'src/types/schema.ts', type: 'dependency' },
                { from: 'src/main.ts', to: 'data/config.json', type: 'data_flow' }
            ];
        }

        return structure;
    }

    /**
     * 프로젝트 구조를 실제 파일 시스템에 생성
     */
    public async createStructure(
        projectRoot: string,
        structure: ProjectStructure
    ): Promise<void> {
        console.log('📁 프로젝트 구조 생성 중...');

        // 폴더 생성
        for (const folder of structure.folders) {
            const folderPath = path.join(projectRoot, folder);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
                console.log(`  ✓ 폴더 생성: ${folder}`);
            }
        }

        // 파일 생성 (빈 파일)
        for (const file of structure.files) {
            const filePath = path.join(projectRoot, file.path);
            const fileDir = path.dirname(filePath);

            // 파일이 속한 디렉토리가 없으면 생성
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }

            // 파일이 없으면 생성
            if (!fs.existsSync(filePath)) {
                const template = this.getFileTemplate(file.type, file.path);
                fs.writeFileSync(filePath, template, 'utf-8');
                console.log(`  ✓ 파일 생성: ${file.path}`);
            }
        }

        console.log('✅ 프로젝트 구조 생성 완료');
    }

    /**
     * 파일 타입별 템플릿
     */
    private getFileTemplate(type: NodeType, filePath: string): string {
        const fileName = path.basename(filePath);
        const ext = path.extname(filePath);

        switch (type) {
            case 'source':
                if (ext === '.ts' || ext === '.js') {
                    return `/**\n * ${fileName}\n * Auto-generated by SYNAPSE\n */\n\nexport {};\n`;
                }
                if (ext === '.py') {
                    return `"""\n${fileName}\nAuto-generated by SYNAPSE\n"""\n\n`;
                }
                return '';

            case 'documentation':
                return `# ${fileName.replace('.md', '')}\n\nAuto-generated by SYNAPSE\n`;

            case 'config':
                if (ext === '.json') {
                    return '{\n  "generated_by": "SYNAPSE"\n}\n';
                }
                return '';

            default:
                return '';
        }
    }
}
