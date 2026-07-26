import { ProjectState } from '../../../types/schema';
import { AnalysisContext, AstFileInfo } from '../types';
import * as path from 'path';

/**
 * 정적 코드 텍스트(node.data.content)를 기반으로
 * 각 파일별 Symbol, Import, Reference를 파싱하여
 * AnalysisContext.astCache 맵에 O(1) 조회용으로 담아두는 리졸버입니다.
 * 
 * ⚠️ 제약사항 (Read-Only): 
 * 절대 이 단계에서 ProjectState(원본 노드/엣지)를 수정해서는 안 됩니다.
 */
export class AstSymbolResolver {
    public resolve(state: ProjectState, context: AnalysisContext): void {
        const astCache = new Map<string, AstFileInfo>();
        const nodes = state.nodes || [];

        for (const node of nodes) {
            const filePath = node.data?.file;
            const content = node.data?.content || '';
            
            if (!filePath) continue;

            const astInfo: AstFileInfo = {
                symbols: [],
                imports: [],
                references: []
            };

            if (content.length > 0) {
                const ext = path.extname(filePath).toLowerCase();
                
                if (ext === '.ts' || ext === '.js') {
                    this.parseTypeScript(content, astInfo);
                } else if (ext === '.py') {
                    this.parsePython(content, astInfo);
                }
            }

            astCache.set(filePath, astInfo);
        }

        context.astCache = astCache;
    }

    private parseTypeScript(content: string, astInfo: AstFileInfo) {
        // 1. 간단한 Import 추출 (import ... from '...')
        const importRegex = /import\s+(?:{[^}]+}|[a-zA-Z0-9_*]+)\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            astInfo.imports.push(match[1]);
        }

        // 2. 간단한 Symbol(Class, Function) 추출
        const classRegex = /class\s+([a-zA-Z0-9_]+)/g;
        while ((match = classRegex.exec(content)) !== null) {
            astInfo.symbols.push(match[1]);
        }
        
        const funcRegex = /function\s+([a-zA-Z0-9_]+)/g;
        while ((match = funcRegex.exec(content)) !== null) {
            astInfo.symbols.push(match[1]);
        }
        
        // 3. (Todo) 추후 Full AST Resolver 적용 시 references 상세 추출 로직 교체
        // 현재는 껍데기만 준비.
    }

    private parsePython(content: string, astInfo: AstFileInfo) {
        // 1. Import 추출 (import X, from Y import X)
        const importRegex = /^(?:from\s+([a-zA-Z0-9_.]+)\s+)?import\s+([a-zA-Z0-9_.,\s]+)/gm;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            if (match[1]) astInfo.imports.push(match[1]); // from Y
            else astInfo.imports.push(match[2].trim()); // import X
        }

        // 2. Symbol 추출 (class, def)
        const classRegex = /^class\s+([a-zA-Z0-9_]+)/gm;
        while ((match = classRegex.exec(content)) !== null) {
            astInfo.symbols.push(match[1]);
        }
        
        const defRegex = /^def\s+([a-zA-Z0-9_]+)/gm;
        while ((match = defRegex.exec(content)) !== null) {
            astInfo.symbols.push(match[1]);
        }
    }
}
