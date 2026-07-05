import * as path from 'path';
import * as fs from 'fs';
import { Node, Edge } from '../GraphModel';
import { EdgeCodeRefactorer } from '../EdgeCodeRefactorer';

/**
 * 🛠️ SYNAPSE Execution Layer (v0.3.11)
 * 
 * DraftGraph를 실제 파일 시스템과 코드로 변환하는 역할을 수행합니다.
 * ID -> Path 해상도 제어 및 Import 구문 자동 생성을 담당합니다.
 */

export interface ResolvedNode {
    id: string;
    path: string;
    name: string;
    type: string;
    content?: string;
}

export class ExecutionLayer {
    /**
     * Node ID를 실제 파일 경로로 변환합니다.
     */
    public resolveNode(node: Node, projectRoot: string): ResolvedNode {
        const fileName = node.label || node.id;
        // 기본적으로 /src 디렉토리에 생성 (상황에 따라 type별 폴더 분화 가능)
        const targetPath = path.join(projectRoot, 'src', `${fileName}.ts`);
        
        return {
            id: node.id,
            name: fileName,
            path: targetPath,
            type: node.type as string,
            content: node.data?.content || ''
        };
    }

    /**
     * Edge 정보를 바탕으로 상대 경로 import 구문을 생성합니다.
     */
    public generateImport(from: ResolvedNode, to: ResolvedNode): string {
        try {
            const fromDir = path.dirname(from.path);
            let relativePath = path.relative(fromDir, to.path);
            
            // 확장자 제거 및 상대 경로 정규화 (./ 추가)
            relativePath = relativePath.replace(/\.ts$/, '');
            if (!relativePath.startsWith('.')) {
                relativePath = `./${relativePath}`;
            }

            return `import { ${to.name} } from '${relativePath}';`;
        } catch (e: unknown) {
            const error = e as Error;
            console.error(`[SYNAPSE] Import Generation Failed: ${from.name} -> ${to.name}`, error.message);
            return `// Failed to generate import for ${to.name}`;
        }
    }

    /**
     * 변경 사항을 파일 시스템에 원자적으로 작성하기 위한 준비 (Transaction 지원용)
     */
    public materialize(nodes: ResolvedNode[], edges: Edge[], projectRoot: string): string[] {
        const createdFiles: string[] = [];
        
        try {
            // 1. Dependency Map 구축
            const depMap = new Map<string, string[]>();
            edges.forEach(edge => {
                if (!depMap.has(edge.from)) depMap.set(edge.from, []);
                depMap.get(edge.from)!.push(edge.to);
            });

            // 2. 파일 작성
            for (const node of nodes) {
                const deps = depMap.get(node.id) || [];
                const imports = deps.map(depId => {
                    const target = nodes.find(n => n.id === depId);
                    if (!target) return null;
                    return this.generateImport(node, target);
                }).filter(Boolean);

                const content = [
                    `/**`,
                    ` * 🧩 SYNAPSE Generated Module: ${node.name}`,
                    ` * Type: ${node.type}`,
                    ` */`,
                    ...imports,
                    ``,
                    node.content || `export class ${node.name} { \n  // TODO: Implement logic \n}`,
                    ``
                ].join('\n');

                this.safeWriteFile(node.path, content);
                createdFiles.push(node.path);
            }

            return createdFiles;
        } catch (e: unknown) {
            const error = e as Error;
            // 실패 시 생성된 파일 목록 반환하여 롤백 지원
            throw { message: error.message || 'Unknown Error', createdFiles };
        }
    }

    private safeWriteFile(filePath: string, content: string) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // UTF-8 No BOM (GEMINI.md 규격)
        fs.writeFileSync(filePath, content, 'utf8');
    }

    /**
     * [v0.3.32] 트랜잭션 기반 엣지 물리 소스 연결
     * @returns 성공 여부 및 생성된 물리 파일 변경 사항 정보
     */
    public connectEdge(edge: Edge, projectRoot: string, isEditLogicMode: boolean): { success: boolean, message?: string } {
        if (!isEditLogicMode) {
            return { success: true, message: 'Edit Logic Mode disabled, skipped physical modification.' };
        }
        
        // _fromFile, _toFile이 존재하지 않으면 GraphModel에서 동적으로 확인하는 로직이 필요할 수 있지만, 
        // 의도(Intent) 발생 시점 또는 RuleEngine에서 이미 확인하여 edge에 포함시켰다고 가정합니다.
        const fromFile = (edge as any)._fromFile;
        const toFile = (edge as any)._toFile;
        
        if (!fromFile || !toFile) {
            return { success: false, message: 'Missing _fromFile or _toFile properties on Edge.' };
        }

        const refactorer = new EdgeCodeRefactorer();
        const result = refactorer.applyEdgeToSource(fromFile, toFile, projectRoot, { commented: true });
        
        return {
            success: result.success,
            message: result.message
        };
    }

    /**
     * [v0.3.32] 트랜잭션 기반 엣지 물리 소스 주석 처리 (삭제)
     * @returns 성공 여부 및 결과 메시지
     */
    public disconnectEdge(fromFile: string | null, toFile: string | null, projectRoot: string, isEditLogicMode: boolean, toNodeId?: string): { success: boolean, message?: string, importLine?: string } {
        if (!isEditLogicMode) {
            return { success: true, message: 'Edit Logic Mode disabled, skipped physical modification.' };
        }

        if (!fromFile || !toFile) {
            // 소스 파일을 특정할 수 없다면, SSoT 관점에서는 물리 변경 없이 논리 삭제만 수행해도 무방함.
            return { success: true, message: 'No physical files mapped, skipping source modification.' };
        }

        const refactorer = new EdgeCodeRefactorer();
        const result = refactorer.removeEdgeFromSource(fromFile, toFile, projectRoot, toNodeId);
        
        return {
            success: result.success,
            message: result.message,
            importLine: result.importLine
        };
    }
}

export const executionLayer = new ExecutionLayer();
