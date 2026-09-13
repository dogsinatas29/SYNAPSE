import * as path from 'path';
import { SymbolIndex } from './SymbolIndex';
import { ReferenceWithSource } from './GhostPolicy';
import { EdgeProvenance } from '../types/schema';

export type ResolutionKind = 'direct' | 'basename' | 'symbol_index' | 'unresolved';

export interface ResolvedReference {
    sourceId: string;
    targetId: string;
    resolutionKind: ResolutionKind;
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
            inputSamples.push(`source=${v.sourceFilePath} | target=${v.ref.target} | type=${v.ref.referenceType || (v.ref as any).provenance || 'unknown'}`);
        }
        console.error(`\n[REFERENCE_INPUT_SAMPLE] Total Inputs: ${validReferences.length}\n  ${inputSamples.join('\n  ')}\n`);
        
        // [P-4.0] Call Resolution Audit Metrics
        const auditStats = {
            totalFunctionCalls: 0,
            resolvedBySymbolIndex: 0,
            macroClassified: 0,
            dslClassified: 0,
            unresolved: 0,
            dropped: 0
        };
        const resolvedSymbolsFreq = new Map<string, number>();
        
        // [v0.3.34] Optimize O(N*M) basename lookups to prevent Extension Host freezing
        const stemMap = new Map<string, string>();
        for (const id of existingNodeIds) {
            const nodeStem = path.basename(id, path.extname(id)).toLowerCase();
            if (!stemMap.has(nodeStem)) {
                stemMap.set(nodeStem, id);
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

            if (!existingNodeIds.has(targetNodeId)) {
                // Try basename fallback
                const targetStem = path.basename(targetNodeId, path.extname(targetNodeId)).toLowerCase();
                const matchedId = stemMap.get(targetStem);

                if (matchedId) {
                    targetNodeId = matchedId;
                    resolutionKind = 'basename';
                } else {
                    // Try symbol index
                    const resolvedPath = symbolIndex.lookupSymbol(targetNodeId);
                    if (resolvedPath) {
                        targetNodeId = resolvedPath;
                        resolutionKind = 'symbol_index';
                        if (ref.provenance === 'FUNCTION_CALL' || ref.provenance === EdgeProvenance.FUNCTION_CALL) {
                            auditStats.resolvedBySymbolIndex++;
                            resolvedSymbolsFreq.set(originalTarget, (resolvedSymbolsFreq.get(originalTarget) || 0) + 1);
                        }
                    }
                }
            }

            // Final check if it's actually in nodeIds, otherwise mark unresolved.
            // Note: If resolutionKind is symbol_index or basename, is it guaranteed to be in existingNodeIds?
            // Fallback match guarantees it's in existingNodeIds.
            // SymbolIndex match might return a path that IS in existingNodeIds, or maybe not.
            if (resolutionKind === 'symbol_index' && !existingNodeIds.has(targetNodeId)) {
                // The original code considered it "resolved" if it found a path, but later unresolved if not in nodeIds.
                // Let's stick to the definition: if it's not in nodeIds after all tries, it's unresolved.
                resolutionKind = 'unresolved';
            } else if (resolutionKind === 'direct' && !existingNodeIds.has(targetNodeId)) {
                resolutionKind = 'unresolved';
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
                } else if (dslKeywords.some(prefix => name.startsWith(prefix) || name.includes(prefix))) {
                    finalProvenance = 'DSL_CALL' as any;
                    auditStats.dslClassified++;
                } else if (resolutionKind !== 'unresolved') {
                    // Passed all heuristic filters AND exists in SymbolIndex (or basename)
                    finalProvenance = 'VERIFIED_FUNCTION_CALL' as any;
                } else {
                    // Passed all heuristic filters but NOT in SymbolIndex
                    finalProvenance = 'UNRESOLVED_CALL' as any;
                    auditStats.unresolved++;
                }
            }

            if (resolutionKind === 'unresolved') {
                // [PONTYAIL-FIX] Removed 3.2M console.log I/O bomb that caused 7-hour Linux scan
            }

            result.push({
                sourceId: sourceFilePath,
                targetId: targetNodeId,
                resolutionKind,
                originalTarget,
                referenceType: ref.type,
                fullPath: ref.fullPath,
                provenance: finalProvenance
            });
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

        console.error('[REFERENCE_RESOLVER_COMPLETE] output=', result.length);
        return result;
    }
}
