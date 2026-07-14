import * as path from 'path';
import { SymbolIndex } from './SymbolIndex';
import { ReferenceWithSource } from './GhostPolicy';

export type ResolutionKind = 'direct' | 'basename' | 'symbol_index' | 'unresolved';

export interface ResolvedReference {
    sourceId: string;
    targetId: string;
    resolutionKind: ResolutionKind;
    originalTarget: string;
    referenceType: string;
    fullPath?: string;
}

export class ReferenceResolver {
    public static resolve(
        validReferences: ReferenceWithSource[],
        existingNodeIds: ReadonlySet<string>,
        symbolIndex: SymbolIndex
    ): ResolvedReference[] {
        const result: ResolvedReference[] = [];
        
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

            result.push({
                sourceId: sourceFilePath,
                targetId: targetNodeId,
                resolutionKind,
                originalTarget,
                referenceType: ref.type,
                fullPath: ref.fullPath
            });
        }

        return result;
    }
}
