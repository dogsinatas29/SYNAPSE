import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';

export class SafeRefactoringZoneDetector implements PatternDetector {

    private isRealFile(filePath: string): boolean {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) {
            return false;
        }
        if (!filePath.includes('.')) return false;
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    }

    private isNoise(filePath: string): boolean {
        const lower = filePath.toLowerCase();
        return lower.includes('test') || lower.includes('spec') || lower.includes('mock') || lower.includes('script') || lower.includes('benchmark');
    }

    // Zero Fan-In (아무도 이 파일을 참조하지 않음 = 컴파일 안전하게 수정 가능) 계산은
    // ValidationEngine의 topImpactFiles/systemAssemblyPoints(externalEdges>0 필터링된 부분집합)에
    // 의존하지 않고, 전체 그래프(context.snapshot.edges)에서 직접 in-degree를 센다.
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        const snapshot = context?.snapshot;
        if (!snapshot || !Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) return findings;

        const inDegree = new Map<string, number>();
        for (const e of snapshot.edges) {
            if (!e.to) continue;
            inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
        }

        const candidates = snapshot.nodes.filter((n: any) => {
            const filePath = n.filePath || n.id || '';
            if (!this.isRealFile(filePath) || this.isNoise(filePath)) return false;
            return (inDegree.get(n.id) || 0) === 0;
        });

        for (const node of candidates) {
            const filePath = node.filePath || node.id;
            findings.push({
                findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                patternId: PatternId.SAFE_REFACTORING_ZONE,
                targetScope: 'NODE',
                targetId: filePath,
                confidence: 1.0,
                evidence: [{
                    evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    type: 'STRUCTURAL_METRIC',
                    description: 'Zero Fan-In (no consumers depend on this file)',
                    sourceId: filePath,
                    filePath
                }]
            });
        }

        return findings;
    }
}
