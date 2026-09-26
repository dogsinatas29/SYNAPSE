import { DetectorContext } from '../DetectorContext';
import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';

export class EntryPointDetector implements PatternDetector {
    
    private isRealFile(filePath: string): boolean {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) {
            return false;
        }
        if (!filePath.includes('.')) return false;
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    }

    private getRoleScore(filePath: string): number {
        const lower = filePath.toLowerCase();
        if (lower.includes('test') || lower.includes('spec') || lower.includes('mock') || lower.includes('script') || lower.includes('benchmark')) {
            return -1000;
        }
        if (lower.includes('main') || lower.includes('index') || lower.includes('bootstrap') || lower.includes('extension') || lower.includes('orchestrator') || lower.includes('init') || lower.includes('core')) {
            return +500;
        }
        return 0;
    }

    private calculateEntryPointScore(node: any): number {
        const fanIn = node.fanIn || 0;
        const fanOut = node.fanOut || 0;
        const depth = (node.filePath || node.id || '').split('/').length;
        const filePath = (node.filePath || node.id || '').toLowerCase();
        
        let priorityScore = 0;
        
        if (filePath.includes('extension.ts') || filePath.includes('activate') || filePath.includes('main.ts') || filePath.includes('index.ts') || filePath.includes('bootstrap')) {
            priorityScore += 10000;
        }
        
        return priorityScore - (depth * 10) - (fanIn * 5) + fanOut;
    }

    // Report 어댑터 적용 전까지 OnboardingAnalyzer 등에서 기존 Context(any)를 넘길 수 있도록 허용
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        let candidates = (context.metrics?.systemAssemblyPoints || []).filter((c: any) => this.isRealFile(c.filePath || c.id || ''));
        
        if (candidates.length > 0) {
            candidates = candidates.sort((a: any, b: any) => this.calculateEntryPointScore(b) - this.calculateEntryPointScore(a));
            const topCandidate = candidates[0];
            const targetId = topCandidate.filePath || topCandidate.id || 'N/A';
            
            if (targetId !== 'N/A') {
                const evidence: EvidenceItem = {
                    evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    type: "FILE_NAMING",
                    sourceId: targetId,
                    description: `Matched entry point naming convention (Score: ${this.calculateEntryPointScore(topCandidate)})`,
                    filePath: targetId,
                    graphNodeId: topCandidate.id
                };

                findings.push({
                    findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    patternId: PatternId.ROOT_ENTRY_POINT,
                    targetScope: 'NODE',
                    targetId: targetId,
                    confidence: 1.0,
                    evidence: [evidence]
                });
                return findings;
            }
        }

        // Fallback to simulation evidence
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
             const simFindings = simContext.evidenceBundle.findings;
             const possibleEntry = new Set<string>();
             
             const semanticBoundaries = simFindings.filter((f: any) => f.type === 'semantic' && f.evidenceType === 'BOUNDARY_NODE').map((f: any) => f.targetId);
             for (const b of semanticBoundaries) {
                 if (b && this.isRealFile(b)) possibleEntry.add(b);
             }
             
             if (possibleEntry.size === 0) {
                 for (const f of simFindings) {
                     const src = f.sourceId || f.targetId || f.nodeId || '';
                     if (src && this.isRealFile(src)) possibleEntry.add(src);
                 }
             }
             
             if (possibleEntry.size > 0) {
                 const sortedSrc = Array.from(possibleEntry).sort((a, b) => {
                     const scoreA = this.getRoleScore(a) - (a.split('/').length * 10);
                     const scoreB = this.getRoleScore(b) - (b.split('/').length * 10);
                     return scoreB - scoreA;
                 });
                 
                 const targetId = sortedSrc[0];
                 const evidence: EvidenceItem = {
                     evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                     type: "SIMULATION_FALLBACK",
                     sourceId: targetId,
                     description: `Derived from simulation semantic boundaries (Score: ${this.getRoleScore(targetId)})`,
                     filePath: targetId
                 };

                 findings.push({
                     findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                     patternId: PatternId.ROOT_ENTRY_POINT,
                     targetScope: 'NODE',
                     targetId: targetId,
                     confidence: 0.8,
                     evidence: [evidence]
                 });
             }
        }

        return findings;
    }
}
