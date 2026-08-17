import * as path from 'path';
import { LanguageScanner, CodeSummary, EdgeProvenance } from '../types/schema';

export class JsTsScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ['.ts', '.js', '.tsx', '.jsx'].includes(ext);
    }

    parse(content: string, summary: CodeSummary): void {
        try {
            // JS/TS 클래스, 인터페이스, 타입, 열거형
            const classRegex = /(?:export\s+)?(?:class|interface|type|enum)\s+([a-zA-Z0-9_]+)/g;
            let match;
            while ((match = classRegex.exec(content)) !== null) {
                const name = match[1];
                if (name && !summary.classes.includes(name)) {
                    summary.classes.push(name);
                }
            }

            // JS/TS 함수 및 메서드 (TS 접근 제어자 및 async 지원 강화)
            const funcRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*\(|public\s+([a-zA-Z0-9_]+)|private\s+([a-zA-Z0-9_]+)|protected\s+([a-zA-Z0-9_]+))/g;
            while ((match = funcRegex.exec(content)) !== null) {
                const name = match[1] || match[2] || match[3] || match[4] || match[5];
                // 키워드 제외
                if (name && !['if', 'while', 'for', 'switch', 'return', 'catch', 'export', 'class', 'interface', 'type', 'enum', 'async', 'await'].includes(name)) {
                    if (!summary.functions.includes(name)) {
                        summary.functions.push(name);
                    }
                }
            }

            // JS/TS 임포트 (references, import type 지원) - [v0.3.21] Support multiline imports
            const importRegex = /(?:import|require)\s+(?:type\s+)?(?:[\s\S]*?from\s+)?['"]([^'"`${}]+)['"]|import\s*\(\s*['"]([^'"`${}]+)['"]\s*\)/g;
            while ((match = importRegex.exec(content)) !== null) {
                const ref = match[1] || match[2];
                if (ref) {
                    if (ref.includes('${') || ref.length > 100) continue;

                    // [v0.3.21] Robust path cleaning: extract filename stem for both relative and absolute-style imports
                    const cleanRef = path.basename(ref, path.extname(ref));
                    if (cleanRef && !['react', 'vscode', 'path', 'fs', 'os', 'child_process'].includes(cleanRef) && !summary.references.some(r => r.target === cleanRef)) {
                        let type = 'dependency';
                        if (cleanRef.match(/api|http|fetch|axios/i)) type = 'api_call';
                        else if (cleanRef.match(/db|sql|database|query/i)) type = 'db_query';
                        summary.references.push({ target: cleanRef, type, provenance: EdgeProvenance.UNKNOWN_RUNTIME });
                    }
                }
            }

            // JS/TS implements
            const implementsRegex = /class\s+(\w+)\s+implements\s+([^{]+)/g;
            while ((match = implementsRegex.exec(content)) !== null) {
                const interfaces = match[2].split(',').map(s => s.trim());
                for (const iface of interfaces) {
                    const cleanIface = iface.split('<')[0].trim();
                    if (cleanIface) {
                        summary.references.push({ target: cleanIface, type: 'IMPLEMENTS', provenance: EdgeProvenance.INHERITANCE });
                    }
                }
            }

            // JS/TS extends
            const extendsRegex = /class\s+(\w+)\s+extends\s+([^{]+)/g;
            while ((match = extendsRegex.exec(content)) !== null) {
                const baseClassRaw = match[2].split('implements')[0].split(',')[0].trim();
                const cleanBase = baseClassRaw.split('<')[0].trim();
                if (cleanBase) {
                    summary.references.push({ target: cleanBase, type: 'EXTENDS', provenance: EdgeProvenance.INHERITANCE });
                }
            }
        } catch (error) {
            console.error('[SYNAPSE] JS/TS parse error:', error);
        }
    }
}
