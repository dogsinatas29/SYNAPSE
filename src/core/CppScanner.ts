import * as path from 'path';
import { LanguageScanner, CodeSummary, EdgeProvenance } from '../types/schema';

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

        // C/C++ 함수 (안전한 정규식으로 선언부 앞부분 추출 후 마지막 단어를 함수명으로 식별)
        const funcRegex = /^[ \t]*([^()={};\n]+)\s*\([^)]*\)\s*(?:const)?\s*(?={|;)/gm;
        while ((match = funcRegex.exec(content)) !== null) {
            const prefix = match[1].trim();
            const nameMatch = prefix.match(/([a-zA-Z_]\w*)$/);
            if (nameMatch) {
                const funcName = nameMatch[1];
                if (!['if', 'while', 'for', 'switch', 'return', 'catch', 'template', 'using', 'static', 'explicit'].includes(funcName)) {
                    if (!summary.functions.includes(funcName)) {
                        summary.functions.push(funcName);
                    }
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

                // [v0.3.34 Fix] Keep path and extension for C/C++ includes to preserve subsystem hierarchy
                const cleanRef = ref;

                if (quoteType === '"') {
                    if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                        let type = 'dependency';
                        const idMatch = line.match(/\[SYNAPSE(?:_PENDING|_DELETED)?:([^\]]+)\]/);
                        const nodeId = idMatch ? idMatch[1] : undefined;
                        summary.references.push({ target: cleanRef, type, nodeId, isApproved: !isPendingOrDeleted, provenance: EdgeProvenance.INCLUDE_DIRECTIVE });
                    }
                } else if (quoteType === '<') {
                    const systemLib = ref.split('/')[0];
                    const standardLibs = ['iostream', 'vector', 'string', 'map', 'set', 'algorithm', 'stdio.h', 'stdlib.h', 'stdint.h', 'stdbool.h', 'cmath', 'cstdio', 'memory', 'thread', 'mutex', 'future', 'chrono'];

                    if (!standardLibs.includes(systemLib)) {
                        if (cleanRef && !summary.references.some(r => r.target === cleanRef)) {
                            summary.references.push({ target: cleanRef, type: 'dependency', provenance: EdgeProvenance.INCLUDE_DIRECTIVE });
                        }
                    } else {
                        if (!summary.references.some(r => r.target === systemLib)) {
                            summary.references.push({ target: systemLib, type: 'api_call', provenance: EdgeProvenance.INCLUDE_DIRECTIVE });
                        }
                    }
                }
            }
        }

        // [v0.3.34.40] Phase 3-1: C/C++ 함수 호출 (CALL 추출)
        // 주석/문자열을 완전히 제거한 뒤 callRegex를 적용한다.
        // Copyright (, Author (, Notice ( 같은 주석 토큰이 api_call로 오인식되는 걸 차단.
        //
        // [v0.3.34.40.1] 레지스터 테이블 헤더 조기 종료:
        // asic_reg/*_sh_mask.h, *_offset.h 같은 파일은 첫 2KB부터 #define 도배.
        // 이런 파일은 함수 호출이 없으므로 callRegex 자체를 스킵.
        const probe = content.length > 2048 ? content.slice(0, 2048) : content;
        const defineCount = (probe.match(/#define\s/g) || []).length;
        const lineCount = (probe.match(/\n/g) || []).length || 1;
        const isDefineHeavy = (defineCount / lineCount) > 0.5; // 50%+ 줄이 #define

        if (!isDefineHeavy) {
        const stripped = content
            .replace(/\/\*[\s\S]*?\*\//g, ' ')   // /* ... */ block comments
            .replace(/\/\/[^\n]*/g, ' ')           // // line comments
            .replace(/"(?:[^"\\]|\\.)*"/g, '""')  // string literals
            .replace(/'(?:[^'\\]|\\.)*'/g, "''"); // char literals

        const callRegex = /\b([a-zA-Z_]\w*)\s*\(/g;
        const kernelMacroIgnoreSet = new Set([
            // Language Keywords
            'if', 'for', 'while', 'switch', 'return', 'sizeof', 'typeof', 'alignof', 
            'catch', 'static_cast', 'reinterpret_cast', 'const_cast', 'dynamic_cast',
            'template', 'using', 'static', 'explicit',
            
            // GNU / Kernel Attributes
            '__attribute__', '__always_inline', '__maybe_unused', '__init', '__exit', 
            '__cold', '__visible', '__latent_entropy', '__printf', '__scanf',
            
            // Branch Prediction
            'likely', 'unlikely',
            
            // Lockdep / Trace
            'WARN', 'WARN_ON', 'WARN_ON_ONCE', 'BUG', 'BUG_ON', 'VM_WARN_ON', 'lockdep_assert_held',
            
            // Build Helpers
            'IS_ENABLED', 'IS_BUILTIN', 'IS_MODULE', 'IS_ERR', 'IS_ERR_OR_NULL', 'PTR_ERR', 'ERR_PTR',
            
            // Compile-time Helpers
            'BUILD_BUG_ON', 'BUILD_BUG_ON_MSG', 'static_assert',
            
            // Container Helpers
            'container_of', 'container_of_const', 'offsetof',
            
            // Kernel Modules
            'module_init', 'module_exit',
            'subsys_initcall', 'device_initcall', 'late_initcall', 'core_initcall',
            
            // Misc Helpers
            'min', 'max', 'clamp', 'roundup', 'rounddown', 'ARRAY_SIZE'
        ]);

        while ((match = callRegex.exec(stripped)) !== null) {
            const funcName = match[1];
            if (!kernelMacroIgnoreSet.has(funcName)) {
                if (!summary.references.some(r => r.target === funcName && r.type === 'api_call')) {
                    summary.references.push({ 
                        target: funcName, 
                        type: 'api_call', // EdgeBuilder에서 'CALL'로 변환됨
                        provenance: EdgeProvenance.FUNCTION_CALL 
                    });
                }
            }
        }
        } // end if (!isDefineHeavy)
    }
}
