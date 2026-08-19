import { GraphModel } from '../../GraphModel';
import { INodeFactCandidate, NotCandidateReport } from '../models/SemanticTypes';
import { INodeFactCandidateGenerator } from '../models/GeneratorInterfaces';

export class ExtensionPointCandidateGenerator implements INodeFactCandidateGenerator {
    public readonly generatorName = 'ExtensionPointCandidateGenerator';
    
    public generate(graph: GraphModel): {
        candidates: INodeFactCandidate[];
        notCandidates: NotCandidateReport[];
    } {
        const candidates: INodeFactCandidate[] = [];
        const notCandidates: NotCandidateReport[] = [];
        
        const snapshot = graph.createSnapshot();
        
        const targetImplementorCount = new Map<string, { count: number, fileId: string }>();
        
        let inheritanceEdgeCount = 0;
        for (const edge of snapshot.edges) {
            if (edge.type === 'IMPLEMENTS' || edge.type === 'EXTENDS') {
                inheritanceEdgeCount++;
                const targetSymbol = edge.data?.originalTarget || edge.to || edge.targetId;
                if (targetSymbol) {
                    if (this.isFrameworkType(targetSymbol)) {
                        continue;
                    }
                    const prev = targetImplementorCount.get(targetSymbol);
                    targetImplementorCount.set(targetSymbol, {
                        count: (prev?.count || 0) + 1,
                        fileId: edge.to // edge.to is the target file
                    });
                }
            }
        }
        
        for (const [targetSymbol, data] of targetImplementorCount.entries()) {
            if (data.count >= 2) {
                candidates.push({
                    id: `cand_extension_point_${targetSymbol}`,
                    nodeId: data.fileId, // Use fileId instead of targetSymbol for node lookup
                    proposedFactType: 'IS_EXTENSION_POINT',
                    baseConfidence: 0.5
                });
            } else {
                notCandidates.push({
                    subjectId: targetSymbol,
                    generatorName: this.generatorName,
                    reason: `Only ${data.count} implementor(s) detected. Minimum extension density is 2.`
                });
            }
        }
        console.log('[EXTENSION_CANDIDATES]', {
            inheritanceEdgeCount,
            candidates: candidates.length,
            notCandidates: notCandidates.length
        });
        
        return { candidates, notCandidates };
    }

    private isFrameworkType(targetSymbol: string): boolean {
        const lower = targetSymbol.toLowerCase();
        
        // Package level rejection
        if (
            lower.startsWith('android.') ||
            lower.startsWith('androidx.') ||
            lower.startsWith('java.') ||
            lower.startsWith('javax.') ||
            lower.startsWith('kotlin.') ||
            lower.startsWith('com.google.')
        ) {
            return true;
        }

        // Common class/interface names rejection
        const FRAMEWORK_TYPES = new Set([
            'fragment',
            'appcompatactivity',
            'activity',
            'recyclerview.adapter',
            'recyclerview.viewholder',
            'serializable',
            'parcelable',
            'comparator',
            'drawable',
            'worker',
            'viewmodel',
            'context',
            'intent',
            'application',
            'service',
            'broadcastreceiver',
            'contentprovider'
        ]);

        // Some targetSymbols might be ghost paths like ghost://Fragment, so we extract the last part
        const parts = targetSymbol.split(/[\/\.]/);
        const name = parts[parts.length - 1].toLowerCase();

        // Also check if the raw target symbol includes any of these as exact matches
        if (FRAMEWORK_TYPES.has(name) || FRAMEWORK_TYPES.has(lower)) {
            return true;
        }

        return false;
    }
}
