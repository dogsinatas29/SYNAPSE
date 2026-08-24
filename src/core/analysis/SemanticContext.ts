import { SimulationContext } from '../../types/schema';
import { EvidenceType } from '../reporting/types';
import { SemanticFinding } from './types';

export interface BoundaryNode {
    id: string;
    members: string[];
    strength: string;
    size: number;
}

export class SemanticContext {
    private boundaries = new Map<string, BoundaryNode>();
    private nodeToBoundary = new Map<string, string>();
    private wrappers = new Set<string>();

    constructor(context?: SimulationContext) {
        if (!context || !context.evidenceBundle || !context.evidenceBundle.findings) {
            return;
        }

        const findings = context.evidenceBundle.findings;
        for (const finding of findings) {
            if (finding.type === 'semantic') {
                const semanticFinding = finding as SemanticFinding;
                if (semanticFinding.evidenceType === EvidenceType.BOUNDARY_NODE) {
                    const id = semanticFinding.targetId;
                    const members = semanticFinding.metadata?.members || [];
                    const strength = semanticFinding.metadata?.strength || 'Unknown';
                    const size = semanticFinding.metadata?.size || members.length;

                    this.boundaries.set(id, { id, members, strength, size });

                    for (const member of members) {
                        this.nodeToBoundary.set(member, id);
                    }
                } else if (semanticFinding.evidenceType === EvidenceType.WRAPPER_NODE) {
                    this.wrappers.add(semanticFinding.targetId);
                }
            }
        }
    }

    public isWrapper(nodeId: string): boolean {
        return this.wrappers.has(nodeId);
    }

    public getBoundaryForNode(nodeId: string): BoundaryNode | null {
        // Direct map lookup (fast)
        const boundaryId = this.nodeToBoundary.get(nodeId);
        if (boundaryId) {
            return this.boundaries.get(boundaryId) || null;
        }

        // Fallback: prefix matching if node was not explicitly in members but falls under the boundary
        // This handles cases where RootCauseAggregator compressed the path (e.g., src/vs/workbench)
        for (const [id, boundary] of this.boundaries.entries()) {
            if (nodeId === id || nodeId.startsWith(id + '/')) {
                return boundary;
            }
        }
        
        return null;
    }

    public isInsideBoundary(nodeId: string): boolean {
        return this.getBoundaryForNode(nodeId) !== null;
    }

    public getAllBoundaries(): BoundaryNode[] {
        return Array.from(this.boundaries.values());
    }
}
