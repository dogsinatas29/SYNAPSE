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
            dependencies: [],
            includePaths: []
        };

        // 0. 스캔 경로(Include Paths) 추출
        const scanPathPattern = /(?:Scan Paths|스캔 경로|Scope):\s*([^\n]+)/i;
        const scanPathMatch = content.match(scanPathPattern);
        if (scanPathMatch) {
            structure.includePaths = scanPathMatch[1].split(',').map(p => p.trim());
            console.log(`🔍 [SYNAPSE] Found Scan Paths: ${structure.includePaths.join(', ')}`);
        }

        // 1. 기존 패턴 (📂, 📄) + 확장된 필드 패턴
        const folderPattern = /(?:📂|\*\*Folder\*\*|Folder:)\s+([^\s/]+)\/?/g;
        let match;
        while ((match = folderPattern.exec(content)) !== null) {
            const folderName = match[1];
            if (!structure.folders.includes(folderName)) {
                structure.folders.push(folderName);
            }
        }

        // 파일 패턴 확장: 📄 아이콘, 불렛 포인트, 백틱, 굵게 표시 등 지원
        // 리뉴얼: 📄 뒤에 공백 허용, 불렛은 라인 시작에서만, m 플래그 추가
        // [Whitelisting] 프로그래밍 소스 파일 + 문서 파일
        const filePattern = /(?:📄\s*|^\s*[-\*]\s+[`]?|파일:\s*)([a-zA-Z0-9_./-]+\.(py|ts|js|cpp|h|hpp|cc|c|rs|sh|sql|md))[`]?/gm;
        while ((match = filePattern.exec(content)) !== null) {
            const fileName = match[1];
            // 중복 체크
            if (structure.files.find(f => f.path === fileName)) continue;

            const ext = path.extname(fileName).slice(1).toLowerCase();
            let type: NodeType = ext === 'md' ? 'documentation' : 'source';
            if (fileName.toLowerCase().includes('test')) type = 'test';

            structure.files.push({
                path: fileName,
                type,
                description: type === 'documentation' ? `${fileName} (Doc)` : `${fileName} (Source)`
            });
        }

        // 2. 새로운 패턴 (NodeName: Description) - [Nodes] 섹션 이후
        const nodesSection = content.split(/1\.\s+아키텍처 토폴로지|\[Nodes\]|## 주요 파일|## 프로젝트 개요/i)[1];
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

                    if (!structure.files.find(f => f.path === filePath)) {
                        const ext = path.extname(filePath).slice(1).toLowerCase();
                        const whitelist = ['py', 'ts', 'js', 'cpp', 'h', 'hpp', 'cc', 'c', 'rs', 'sh', 'sql'];

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
        while ((match = edgePattern.exec(content)) !== null) {
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
