/*
 * SYNAPSE - Visual Architecture Engine
 * Copyright (C) 2024 synapse-team (and contributors)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * GEMINI.md 파서
 * GEMINI.md 파일을 읽고 프로젝트 구조를 분석
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectStructure, NodeType, EdgeType } from '../types/schema';
import { isIgnoredFile, isIgnoredFolder } from '../utils/exclusionRules';
import { RuleEngine } from './RuleEngine';

export class GeminiParser {
    /**
     * GEMINI.md 파일 읽기 및 분석
     */
    public async parseGeminiMd(filePath: string): Promise<ProjectStructure> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // Ensure rules are loaded (if not already by BootstrapEngine)
            const projectRoot = path.dirname(filePath);
            RuleEngine.getInstance().loadRules(projectRoot);

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
     * GEMINI.md에서 원칙(Principles) 섹션 추출
     */
    public async extractPrinciples(filePath: string): Promise<string[]> {
        try {
            if (!fs.existsSync(filePath)) return [];
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // HTML 주석 제거 후 분석
            const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');

            // 1. 헤더 레벨과 섹션을 정확하게 찾기 위한 정규식 (e.g., ## 1. 원칙, ## 핵심 설계 원칙, # Principles)
            // [v0.3.21] Enhanced regex to handle potential BOM or whitespace at start of line
            const headerPattern = /^[ \t\uFEFF]*([#]+).*(?:Principles|원칙|규약|Manifesto).*/mi;
            const headerMatch = cleanContent.match(headerPattern);
            if (!headerMatch) {
                // 헤더가 없는 경우 [Principles] 같은 대괄호 형태나 단순 텍스트 섹션 탐색 시도
                const altHeaderPattern = /^[ \t\uFEFF]*(?:\[|\*\*|#)*\s*(?:Principles|원칙|규약|Manifesto).*/mi;
                const altMatch = cleanContent.match(altHeaderPattern);
                if (!altMatch) return [];
                
                // 대안 헤더가 있는 경우 해당 위치부터 텍스트 추출 시도
                const altStartIndex = altMatch.index! + altMatch[0].length;
                const altSection = cleanContent.substring(altStartIndex);
                const firstHeaderMatch = altSection.match(/^#+/m);
                const altContent = firstHeaderMatch ? altSection.substring(0, firstHeaderMatch.index) : altSection;
                return this.extractFromLines(altContent);
            }

            const level = headerMatch[1].length;
            
            // 첫 번째 매치 지점의 끝부터 내용 시작 (split을 쓰면 여러 헤더가 잡혀 내용이 짤릴 수 있음)
            const startIndex = headerMatch.index! + headerMatch[0].length;
            const principlesSection = cleanContent.substring(startIndex);

            // 2. 현재 레벨과 같거나 더 높은 레벨의 헤더가 나오기 전까지가 내용
            // 만약 ##에서 시작했다면, 다음 # 또는 ## 까지만. ###은 포함.
            const boundaryRegex = new RegExp(`^#{1,${level}}(?=[^#]|$)`, 'm');
            const principlesContent = principlesSection.split(boundaryRegex)[0];
            return this.extractFromLines(principlesContent);
        } catch (error) {
            console.error('❌ Principles 추출 실패:', error);
            return [];
        }
    }

    /**
     * 줄 단위 텍스트에서 불렛 포인트 추출
     */
    private extractFromLines(content: string): string[] {
        const lines = content.split('\n');
        const principles: string[] = [];
        
        lines.forEach((line: string) => {
            const match = line.match(/^\s*[-\*\d\.]+\s*(?:\[.*?\])?\s*(.*)/);
            if (match && match[1].trim() && match[1].trim().length > 3) {
                principles.push(match[1].trim());
            }
        });
        
        console.log(`✅ GEMINI.md에서 ${principles.length}개의 원칙 추출 완료`);
        return principles;
    }

    /**
     * 내용 분석 (간단한 패턴 매칭)
     * TODO: 실제로는 AI API를 호출하여 더 정교한 분석 수행
     */
    private analyzeContent(content: string): ProjectStructure {
        const structure: ProjectStructure = {
            folders: [],
            files: [],
            dependencies: [],
            includePaths: []
        };

        // 스캔용 콘텐츠 정제 (필터링 순서 중요: 큰 단위부터 제거)
        let contentForScanning = content;

        // 1. HTML 주석 제거 (주석 내부의 📄 아이콘 등 무시)
        contentForScanning = contentForScanning.replace(/<!--[\s\S]*?-->/g, '');

        // 2. 멀티라인 코드 블록 제거 (``` 및 ~~~ 지원)
        contentForScanning = contentForScanning.replace(/```[\s\S]*?```/g, '');
        contentForScanning = contentForScanning.replace(/~~~[\s\S]*?~~~/g, '');

        // 3. 인라인 코드 블록 제거 (`...`) - 줄바꿈을 포함하지 않는 백틱 쌍만 타겟팅
        // [v0.2.17 Fix] 주석 처리: 불렛 리스트 안의 노드 정의(- **`main.py`**)까지 지워버리는 치명적 부작용 발생.
        // Node 정의 정규식 자체가 불렛이나 아이콘으로 제한되어 있으므로 인라인 백틱을 무차별 제거할 필요가 없음.
        // contentForScanning = contentForScanning.replace(/`[^`\n]+`/g, '');

        // 0. 스캔 경로(Include Paths) 추출
        const scanPathPattern = /(?:Scan Paths|스캔 경로|Scope):\s*([^\n]+)/i;
        const scanPathMatch = contentForScanning.match(scanPathPattern);
        if (scanPathMatch) {
            structure.includePaths = scanPathMatch[1].split(',').map(p => p.trim());
            console.log(`🔍 [SYNAPSE] Found Scan Paths: ${structure.includePaths.join(', ')}`);
        }

        // 1. 기존 패턴 (📂, 📄) + 확장된 필드 패턴
        const folderPattern = /(?:📂|\*\*Folder\*\*|Folder:)\s+([^\s/]+)\/?/g;
        let match;
        while ((match = folderPattern.exec(contentForScanning)) !== null) {
            const folderName = match[1];
            if (isIgnoredFolder(folderName)) continue;
            if (!structure.folders.includes(folderName)) {
                structure.folders.push(folderName);
            }
        }

        // 파일 패턴 확장: 📄 아이콘이 있거나 [Nodes] 섹션에 명시된 경우만 문서로 인정
        // 소스 파일은 불렛 포인트 등으로도 탐색 가능 (별표 표시와 백틱 완화)
        const filePattern = /(?:📄\s*|^\s*[-\*]\s*(?:\*\*|__)?\s*[`]?|파일:\s*)([a-zA-Z0-9_./-]+\.(json|py|ts|js|cpp|h|hpp|cc|c|rs|sh|sql|md))[`]?(?:\*\*|__)?/gm;
        while ((match = filePattern.exec(contentForScanning)) !== null) {
            const fileName = match[1];
            const isExplicitDoc = match[0].includes('📄') || match[0].includes('파일:');
            const ext = path.extname(fileName).slice(1).toLowerCase();

            // [Refinement] .md 파일은 📄 아이콘이 있거나 명시적으로 '파일:' 키워드가 있는 경우만 수집
            // [v0.2.17 New Rule] .md 파일은 루트 또는 Doc/ 폴더에 있는 것만 Documentation Shelf로 인정
            if (ext === 'md') {
                if (!isExplicitDoc) continue;
                const isRoot = !fileName.includes('/');
                const isDocFolder = fileName.toLowerCase().startsWith('doc/');
                if (!isRoot && !isDocFolder) continue;
            }

            // [Node Diet] 블랙리스트 및 무시된 폴더 경로 필터링
            if (isIgnoredFile(fileName) || fileName.split('/').some(isIgnoredFolder)) continue;

            // 중복 체크
            if (structure.files.find(f => f.path === fileName)) continue;

            let type: NodeType = ext === 'md' ? 'documentation' : 'source';
            if (fileName.toLowerCase().includes('test')) type = 'test';

            structure.files.push({
                path: fileName,
                type,
                description: type === 'documentation' ? `${fileName} (Doc)` : `${fileName} (Source)`
            });
        }

        // 2. 새로운 패턴 (NodeName: Description) - [Nodes] 섹션 이후
        const nodesSection = contentForScanning.split(/1\.\s+아키텍처 토폴로지|\[Nodes\]|## 주요 파일|## 프로젝트 개요/i)[1];
        if (nodesSection) {
            // 다음 섹션 이전까지만 파싱
            const nodesContent = nodesSection.split(/2\.\s+데이터 흐름|\[Edges\]|## 개발 가이드라인|## 에이전트 지침/i)[0];
            const nodeLines = nodesContent.split('\n');
            nodeLines.forEach(line => {
                // 예: - dungeon/Start.py: 설명
                const nodeMatch = line.match(/^\s*[-\*]?\s*[`]?([a-zA-Z0-9_./-]+\.[a-z]+)[`]?:\s*(.*)/);
                if (nodeMatch) {
                    const filePath = nodeMatch[1];
                    const description = nodeMatch[2].trim();

                    // [Node Diet] 블랙리스트 및 무시된 폴더 경로 필터링
                    if (isIgnoredFile(filePath) || filePath.split('/').some(isIgnoredFolder)) return;

                    if (!structure.files.find(f => f.path === filePath)) {
                        const ext = path.extname(filePath).slice(1).toLowerCase();
                        const whitelist = ['py', 'ts', 'js', 'cpp', 'h', 'hpp', 'cc', 'c', 'rs', 'sh', 'sql', 'json'];

                        if (whitelist.includes(ext)) {
                            structure.files.push({
                                path: filePath,
                                type: 'source',
                                description: description
                            });
                        }
                    }
                }
            });
        }

        // 3. 엣지 패턴 (NodeA --> NodeB: Label)
        // 확장자가 없는 경우를 위해 캡처 후 나중에 처리
        const edgePattern = /([a-zA-Z0-9_./-]+)\s*(?:-->|->)\s*([a-zA-Z0-9_./-]+)(?::\s*(.*))?/g;
        while ((match = edgePattern.exec(contentForScanning)) !== null) {
            const from = match[1];
            const to = match[2];
            const label = match[3] || '';

            // 만약 파일 목록에 있으면 그 경로 그대로 사용, 없으면 추측
            const fromFile = structure.files.find(f => f.path.includes(from))?.path || from;
            const toFile = structure.files.find(f => f.path.includes(to))?.path || to;

            structure.dependencies.push({
                from: fromFile,
                to: toFile,
                type: 'dependency',
                label: label
            });
        }

        // NOTE: 하드코딩된 샘플 구조 로직 제거.
        // 대신 BootstrapEngine에서 결과가 비어있으면 autoDiscover를 호출하도록 유도.
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
