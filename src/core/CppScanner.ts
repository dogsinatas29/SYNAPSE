import * as path from 'path';
import { LanguageScanner, CodeSummary } from '../types/schema';

export class CppScanner implements LanguageScanner {
    supportsExtension(ext: string): boolean {
        return ['.cpp', '.h', '.c', '.hpp', '.cc'].includes(ext);
    }

    parse(content: string, summary: CodeSummary): void {
        // C++ 클래스 및 구조체
        const classRegex = /(?:class|struct)\s+([a-zA-Z0-9_:]+)[\s{:]/gm;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            if (className && !summary.classes.includes(className)) {
                summary.classes.push(className);
            }
        }

        // C/C++ 함수
        const funcRegex = /^\s*(?:[\w\s:*&<>]+\s+)?([\w::]+)\s*\([^)]*\)\s*(?:const)?\s*(?={|;)/gm;
        while ((match = funcRegex.exec(content)) !== null) {
            const funcName = match[1];
            if (funcName && !['if', 'while', 'for', 'switch', 'return', 'catch', 'template', 'using', 'static', 'explicit'].includes(funcName)) {
                if (!summary.functions.includes(funcName)) {
                    summary.functions.push(funcName);
                }
            }
        }

        // C/C++ 인클루드
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            const isCommented = trimmed.startsWith('//') || trimmed.startsWith('/*');
            const isPendingOrDeleted = /\[SYNAPSE_(?:PENDING|DELETED)/.test(line);

            if (isCommented && !isPendingOrDeleted) continue;

            const includeMatch = trimmed.match(/(?:#\s*include|#include)\s+(["<])([^">]+)([">])/);
            if (includeMatch) {
                summary.hasImportSignature = true;
                const quoteType = includeMatch[1];
                const ref = includeMatch[2];

                const cleanRef = path.basename(ref, path.extname(ref));

                if (quoteType === '"') {
                    if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                        let type = 'dependency';
                        const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                        const nodeId = idMatch ? idMatch[1] : undefined;
                        summary.references.push({ target: cleanRef, type, nodeId, isApproved: !isPendingOrDeleted });
                    }
                } else if (quoteType === '<') {
                    const systemLib = ref.split('/')[0];
                    const standardLibs = ['iostream', 'vector', 'string', 'map', 'set', 'algorithm', 'stdio.h', 'stdlib.h', 'stdint.h', 'stdbool.h', 'cmath', 'cstdio', 'memory', 'thread', 'mutex', 'future', 'chrono'];

                    if (!standardLibs.includes(systemLib)) {
                        if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                            summary.references.push({ target: cleanRef, type: 'dependency' });
                        }
                    } else {
                        if (!summary.references.some(r => r.target === systemLib)) {
                            summary.references.push({ target: systemLib, type: 'api_call' });
                        }
                    }
                }
            }
        }
    }
}
