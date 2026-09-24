import * as path from 'path';
import { SymbolIndex } from './SymbolIndex';
import { ReferenceWithSource } from './GhostPolicy';
import { EdgeProvenance } from '../types/schema';

export type ResolutionKind = 'direct' | 'basename' | 'symbol_index' | 'unresolved' | 'broadcast' | 'stdlib';

const GO_STDLIB_PREFIXES = new Set([
    'archive', 'bufio', 'bytes', 'compress', 'container', 'context', 'crypto', 
    'database', 'debug', 'encoding', 'errors', 'expvar', 'flag', 'fmt', 'hash', 
    'html', 'image', 'index', 'io', 'log', 'math', 'mime', 'net', 'os', 'path', 
    'plugin', 'reflect', 'regexp', 'runtime', 'sort', 'strconv', 'strings', 
    'sync', 'syscall', 'testing', 'text', 'time', 'unicode', 'unsafe'
]);

function isGoStdlib(importPath: string): boolean {
    const firstSegment = importPath.split('/')[0];
    return GO_STDLIB_PREFIXES.has(firstSegment);
}

export interface ResolvedReference {
    sourceId: string;
    targetId: string;
    resolutionKind: ResolutionKind;
    candidateCount?: number;
    originalTarget: string;
    referenceType: string;
    fullPath?: string;
    provenance?: any;
}

export class ReferenceResolver {
    public static resolve(
        validReferences: ReferenceWithSource[],
        existingNodeIds: ReadonlySet<string>,
        symbolIndex: SymbolIndex
    ): ResolvedReference[] {
        const result: ResolvedReference[] = [];
        console.error('[REFERENCE_RESOLVER_ENTER] validReferences=', validReferences.length);
        
        // Phase 15.8: Dump ReferenceResolver Inputs for Root Cause Analysis
        const inputSamples: string[] = [];
        for (let i = 0; i < Math.min(100, validReferences.length); i++) {
            const v = validReferences[i];
            inputSamples.push(`source=${v.sourceFilePath} | target=${v.ref.target} | type=${v.ref.type || (v.ref as any).provenance || 'unknown'}`);
        }
        console.error(`\n[REFERENCE_INPUT_SAMPLE] Total Inputs: ${validReferences.length}\n  ${inputSamples.join('\n  ')}\n`);
        
        const auditStats = {
            totalFunctionCalls: 0,
            resolvedBySymbolIndex: 0,
            macroClassified: 0,
            dslClassified: 0,
            unresolved: 0,
            dropped: 0
        };
        const resolvedSymbolsFreq = new Map<string, number>();

        // [INSTRUMENTATION] Resolution tracking by language
        type Language = 'Go' | 'C/C++' | 'Rust' | 'Other';
        const getLanguage = (p: string): Language => {
            if (p.endsWith('.go')) return 'Go';
            if (p.endsWith('.c') || p.endsWith('.h') || p.endsWith('.cpp') || p.endsWith('.hpp')) return 'C/C++';
            if (p.endsWith('.rs')) return 'Rust';
            return 'Other';
        };

        const resStats: Record<Language, Record<string, number>> = {
            'Go': { direct: 0, basename: 0, symbol_index: 0, broadcast: 0, unresolved: 0 },
            'C/C++': { direct: 0, basename: 0, symbol_index: 0, broadcast: 0, unresolved: 0 },
            'Rust': { direct: 0, basename: 0, symbol_index: 0, broadcast: 0, unresolved: 0 },
            'Other': { direct: 0, basename: 0, symbol_index: 0, broadcast: 0, unresolved: 0 }
        };

        
        // [v0.3.34] Optimize O(N*M) basename lookups to prevent Extension Host freezing
        const stemMap = new Map<string, string>();
        // [P1.1b] Package Map for Broadcast Lookup
        const packageMap = new Map<string, string[]>();
        
        for (const id of existingNodeIds) {
            const nodeStem = path.basename(id, path.extname(id)).toLowerCase();
            if (!stemMap.has(nodeStem)) {
                stemMap.set(nodeStem, id);
            }
            
            // Build package map (dir -> files)
            const dir = path.dirname(id).replace(/\\/g, '/');
            if (!packageMap.has(dir)) {
                packageMap.set(dir, []);
            }
            packageMap.get(dir)!.push(id);
        }

        // [TRACE-4] Dump packageMap keys for Go modules mapping analysis
        console.error(`[TRACE-4-PACKAGEMAP-DUMP] Total packageMap keys: ${packageMap.size}`);
        for (const dir of packageMap.keys()) {
            if (dir.endsWith('schema') || dir.endsWith('runtime') || dir.endsWith('labels') || dir.endsWith('metav1') || dir.endsWith('serializer')) {
                console.error(`[TRACE-4-PACKAGEMAP-KEY] ${dir}`);
            }
        }

        for (const { sourceFilePath, ref } of validReferences) {
            let targetNodeId = ref.target;

            // [v0.3.34 FIX] Normalize relative paths based on source file location to prevent '.' and '..' ghost nodes
            const isRelativePath = targetNodeId.startsWith('./') || targetNodeId.startsWith('../') || targetNodeId === '.' || targetNodeId === '..';
            if (isRelativePath) {
                targetNodeId = path.join(path.dirname(sourceFilePath), targetNodeId).replace(/\\/g, '/');
                if (targetNodeId === '.' || targetNodeId === '..') {
                    console.warn(`[ReferenceResolver] Skipping invalid relative path resolution: ${ref.target} from ${sourceFilePath}`);
                    continue;
                }
            }

            const originalTarget = targetNodeId;
            let resolutionKind: ResolutionKind = 'direct';
            let fallbackResult = '';
            
            if (!existingNodeIds.has(targetNodeId)) {
                // [v0.3.34.51 FIX] 1. Alias Resolver (VSCode 코어 모듈 특화)
                if (targetNodeId.startsWith('vs/')) {
                    targetNodeId = 'src/' + targetNodeId;
                }

                // [v0.3.34.51 FIX] 2. Extension Probing (확장자 복원 시도)
                let foundExt = false;
                if (!existingNodeIds.has(targetNodeId)) {
                    const exts = ['.ts', '.js', '/index.ts', '/index.js', '.tsx', '.jsx'];
                    for (const ext of exts) {
                        if (existingNodeIds.has(targetNodeId + ext)) {
                            targetNodeId = targetNodeId + ext;
                            foundExt = true;
                            break;
                        }
                    }
                } else {
                    foundExt = true;
                }

                // [v0.3.34.51 FIX] 3. basenameFallback 영구 폐기
                // 엉뚱한 파일로 하이재킹하지 않고 깔끔하게 symbolIndex 검색 또는 unresolved로 넘깁니다.
                if (!foundExt) {
                    // Try symbol index
                    const resolvedPath = symbolIndex.lookupSymbol(targetNodeId);
                    if (resolvedPath) {
                        targetNodeId = resolvedPath;
                        resolutionKind = 'symbol_index';
                        if (ref.provenance === 'FUNCTION_CALL' || ref.provenance === EdgeProvenance.FUNCTION_CALL) {
                            auditStats.resolvedBySymbolIndex++;
                            resolvedSymbolsFreq.set(originalTarget, (resolvedSymbolsFreq.get(originalTarget) || 0) + 1);
                        }
                    } else {
                        resolutionKind = 'unresolved';
                    }
                }
            }

            // Final check if it's actually in nodeIds, otherwise mark unresolved.
            if (resolutionKind === 'symbol_index' && !existingNodeIds.has(targetNodeId)) {
                resolutionKind = 'unresolved';
            } else if (resolutionKind === 'direct' && !existingNodeIds.has(targetNodeId)) {
                resolutionKind = 'unresolved';
            }

            // [Method A] STDLIB Override: If it's Go and matches stdlib, preserve targetId but set kind to 'stdlib'
            if (sourceFilePath.endsWith('.go') && resolutionKind === 'unresolved') {
                if (isGoStdlib(originalTarget)) {
                    resolutionKind = 'stdlib';
                }
            }

            let broadcastCandidates: string[] = [];
            // [TRACE] Go Semantic Collapse 추적 타겟
            const isTraceTarget = sourceFilePath.endsWith('.go') && (
                originalTarget.includes('schema') || 
                originalTarget.includes('serializer') || 
                originalTarget.includes('runtime') || 
                originalTarget.includes('labels') || 
                originalTarget.includes('metav1') ||
                originalTarget.includes('protoimpl')
            );

            if (isTraceTarget) {
                console.error(`\n[TRACE-2-RESOLVER-IN] Source: ${sourceFilePath}`);
                console.error(`[TRACE-2-RESOLVER-IN] Target: ${originalTarget}, Type: ${ref.type || (ref as any).provenance}`);
            }

            if (sourceFilePath.endsWith('.go') && resolutionKind === 'unresolved' && (targetNodeId.includes('/') || targetNodeId.includes('.'))) {
                // Try Broadcast Fallback using FULL target string
                const targetSuffix = '/' + targetNodeId;
                let bestPkgDir = "";
                
                for (const pkgDir of packageMap.keys()) {
                    // Case 1: Physical path is longer/equal to import path (e.g. nested in staging/)
                    if (pkgDir.endsWith(targetSuffix) || pkgDir === targetNodeId) {
                        bestPkgDir = pkgDir;
                        break;
                    }
                    // Case 2: Import path is longer than physical path (e.g. k8s module at workspace root)
                    // We track the longest matching pkgDir to avoid false positives (e.g. matching "runtime" instead of "pkg/runtime")
                    if (pkgDir !== '.' && targetSuffix.endsWith('/' + pkgDir)) {
                        if (pkgDir.length > bestPkgDir.length) {
                            bestPkgDir = pkgDir;
                        }
                    }
                }

                let matchedPkgDir = "";
                if (bestPkgDir) {
                    const files = packageMap.get(bestPkgDir)!;
                    broadcastCandidates = files;
                    resolutionKind = 'broadcast';
                    matchedPkgDir = bestPkgDir;
                    if (files.length > 50) {
                        console.warn(`[Broadcast Warning] package=${bestPkgDir} files=${files.length}`);
                    }
                }
                
                if (isTraceTarget) {
                    if (resolutionKind === 'broadcast') {
                        console.error(`[TRACE-3-BROADCAST] Matched Directory: ${matchedPkgDir}, File Count: ${broadcastCandidates.length}`);
                    } else {
                        console.error(`[TRACE-3-BROADCAST-FAIL] Import: ${originalTarget}`);
                        console.error(`[TRACE-3-BROADCAST-FAIL] Suffix: ${targetSuffix}`);
                        console.error(`[TRACE-3-BROADCAST-FAIL] Candidate Count: 0`);
                        
                        // Dump nearby keys
                        const suffixStr = targetSuffix.replace('/', '');
                        const nearbyKeys = Array.from(packageMap.keys()).filter(k => k.includes(suffixStr)).slice(0, 5);
                        const randomKeys = Array.from(packageMap.keys()).slice(0, 3);
                        console.error(`[TRACE-3-BROADCAST-FAIL] Nearby Keys: ${nearbyKeys.length > 0 ? nearbyKeys.join(', ') : 'NONE'}`);
                        console.error(`[TRACE-3-BROADCAST-FAIL] Sample Keys: ${randomKeys.join(', ')}`);
                    }
                }
            }

            if (isTraceTarget) {
                console.error(`[TRACE-3-RESOLVER-OUT] Target: ${originalTarget} -> ResolutionKind: ${resolutionKind}`);
            }

            let finalProvenance = ref.provenance;

            // [P-3.6] Call Classification Layer - Option B (Ponytail: Heuristic First)
            if (ref.provenance === 'FUNCTION_CALL' || ref.provenance === EdgeProvenance.FUNCTION_CALL) {
                auditStats.totalFunctionCalls++;
                const name = originalTarget;
                const garbageKeywords = new Set([
                    'void', 'int', 'char', 'unsigned', 'long', 'short', 'struct', 'union', 'enum',
                    'const', 'volatile', 'static', 'extern', 'inline', 'bool', 'size_t', 'ssize_t',
                    'u8', 'u16', 'u32', 'u64', 's8', 's16', 's32', 's64', '__u8', '__u16', '__u32', '__u64',
                    'defined', 'Copyright', 'c', 'C', 's', 'S', 'i', 'j', 'k', 'n', 'v', 'ptr', 'p'
                ]);
                const dslKeywords = [
                    'list_for_each', 'container_of', 'guard', 'DEFINE_', 'DECLARE_',
                    'FOR_EACH', 'for_each', 'offsetof'
                ];

                if (garbageKeywords.has(name) || name.length === 1) {
                    // [P-3.6] Garbage Discard
                    auditStats.dropped++;
                    continue;
                } else if (name === name.toUpperCase()) {
                    finalProvenance = 'MACRO_CALL' as any;
                    auditStats.macroClassified++;
                    if (sourceFilePath.endsWith('.c') || sourceFilePath.endsWith('.h') || sourceFilePath.endsWith('.cpp') || sourceFilePath.endsWith('.hpp')) {
                        auditStats.dropped++;
                        continue;
                    }
                } else if (dslKeywords.some(prefix => name.startsWith(prefix) || name.includes(prefix))) {
                    finalProvenance = 'DSL_CALL' as any;
                    auditStats.dslClassified++;
                    if (sourceFilePath.endsWith('.c') || sourceFilePath.endsWith('.h') || sourceFilePath.endsWith('.cpp') || sourceFilePath.endsWith('.hpp')) {
                        auditStats.dropped++;
                        continue;
                    }
                } else if (resolutionKind !== 'unresolved') {
                    // Passed all heuristic filters AND exists in SymbolIndex (or basename)
                    finalProvenance = 'VERIFIED_FUNCTION_CALL' as any;
                } else {
                    // Passed all heuristic filters but NOT in SymbolIndex
                    finalProvenance = 'UNRESOLVED_CALL' as any;
                    auditStats.unresolved++;
                    if (sourceFilePath.endsWith('.c') || sourceFilePath.endsWith('.h') || sourceFilePath.endsWith('.cpp') || sourceFilePath.endsWith('.hpp')) {
                        auditStats.dropped++;
                        continue;
                    }
                }
            }

            if (resolutionKind === 'unresolved') {
                // [PONTYAIL-FIX] Removed 3.2M console.log I/O bomb that caused 7-hour Linux scan
            }

            // Record Instrumentation before fan-out
            const lang = getLanguage(sourceFilePath);
            resStats[lang][resolutionKind] = (resStats[lang][resolutionKind] || 0) + 1;

            if (resolutionKind === 'broadcast' && broadcastCandidates.length > 0) {
                for (const bTarget of broadcastCandidates) {
                    result.push({
                        sourceId: sourceFilePath,
                        targetId: bTarget,
                        resolutionKind: 'broadcast',
                        candidateCount: broadcastCandidates.length,
                        originalTarget,
                        referenceType: ref.type,
                        fullPath: ref.fullPath,
                        provenance: finalProvenance
                    });
                }
            } else {
                result.push({
                    sourceId: sourceFilePath,
                    targetId: targetNodeId,
                    resolutionKind,
                    candidateCount: 1,
                    originalTarget,
                    referenceType: ref.type,
                    fullPath: ref.fullPath,
                    provenance: finalProvenance
                });
            }
        }

        const top100Resolved = Array.from(resolvedSymbolsFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 100);

        const auditLog = `
================== [CALL_RESOLUTION_AUDIT] ==================
Total Function Call Candidates: ${auditStats.totalFunctionCalls}
Resolved By SymbolIndex: ${auditStats.resolvedBySymbolIndex}
Macro Classified: ${auditStats.macroClassified}
DSL Classified: ${auditStats.dslClassified}
Unresolved (No Symbol Match): ${auditStats.unresolved}
Dropped (Garbage/1-letter): ${auditStats.dropped}
-------------------------------------------------------------
Top 10 Resolved Symbols (By Event Frequency):
${top100Resolved.slice(0, 10).map((x, i) => `  ${i+1}. ${x[0]} (${x[1]})`).join('\n')}
=============================================================
`;
        console.log(auditLog);

        // [INSTRUMENTATION_OUTPUT]
        console.log('\n==================================================');
        console.log(' [RESOLUTION_INSTRUMENTATION_REPORT]');
        console.log('==================================================');
        for (const lang of ['Go', 'C/C++', 'Rust', 'Other'] as Language[]) {
            const s = resStats[lang];
            const total = s.direct + s.basename + s.symbol_index + s.broadcast + s.unresolved;
            if (total > 0) {
                console.log(`\n ${lang} (Total Inputs: ${total})`);
                console.log(`  Path (direct) : ${s.direct}`);
                console.log(`  Stem (basename): ${s.basename}`);
                console.log(`  Symbol Index  : ${s.symbol_index}`);
                console.log(`  Broadcast     : ${s.broadcast}`);
                console.log(`  Unresolved    : ${s.unresolved}`);
            }
        }
        console.log('==================================================\n');

        console.error('[REFERENCE_RESOLVER_COMPLETE] output=', result.length);
        return result;
    }
}
