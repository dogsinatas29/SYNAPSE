import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';

export class CrossBoundaryReferenceDetector implements PatternDetector {
    
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        let semanticFindings = [];
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            semanticFindings = simContext.evidenceBundle.findings.filter((f: any) => 
                f.type === 'semantic' && f.evidenceType === 'CROSS_BOUNDARY_DEPENDENCY'
            );
        }

        if (semanticFindings.length === 0) {
            return findings;
        }

        for (const f of semanticFindings) {
            const source = f.metadata?.from;
            const target = f.metadata?.to;
            const depCount = f.metadata?.dependencyCount || 0;

            if (!source || !target) continue;

            // (Unpromoted) filter: We only care about edges between actual promoted boundaries
            if (this.isPromotedBoundaryId(source) && this.isPromotedBoundaryId(target)) {
                
                const evidence: EvidenceItem[] = [
                    {
                        evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                        type: 'CROSS_BOUNDARY_REFERENCE',
                        sourceId: `${source}->${target}`,
                        description: `Boundary ${source} ─(${depCount} edges)─▶ Boundary ${target}`,
                        metadata: { source, target, dependencyCount: depCount },
                        selectionBasis: `Valid edge between promoted boundaries (${depCount} dependencies)`
                    }
                ];

                findings.push({
                    findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    patternId: PatternId.CROSS_BOUNDARY_REFERENCE,
                    targetScope: 'EDGE',
                    targetId: `${source}->${target}`, // Compound ID for the relation
                    confidence: 1.0, // This is an absolute fact, not a heuristic
                    evidence,
                    context: {
                        description: `현재 분석 범위에서 Boundary ${source}와(과) Boundary ${target} 사이에 ${depCount}개의 실제 구조적 의존성 Edge가 관측된다.`
                    }
                });
            }
        }

        return findings;
    }

    private isPromotedBoundaryId(id: string): boolean {
        return !id.includes('(Unpromoted)');
    }
}
