import { ValidationContext } from '../../../validation/ValidationContext';
import { SimulationContext } from '../../../../types/schema';
import { PatternDetector, PatternFinding } from '../PatternDetector';

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

    public detect(context: ValidationContext, simContext?: SimulationContext): PatternFinding[] {
        const findings: PatternFinding[] = [];
        let candidates = (context.metrics?.systemAssemblyPoints || []).filter((c: any) => this.isRealFile(c.filePath || c.id || ''));
        
        if (candidates.length > 0) {
            candidates = candidates.sort((a: any, b: any) => this.calculateEntryPointScore(b) - this.calculateEntryPointScore(a));
            const topCandidate = candidates[0];
            const targetId = topCandidate.filePath || topCandidate.id || 'N/A';
            
            if (targetId !== 'N/A') {
                findings.push({
                    patternId: 'root_entry_point',
                    targetId: targetId,
                    confidence: 1.0,
                    evidence: {
                        score: this.calculateEntryPointScore(topCandidate),
                        fanIn: topCandidate.fanIn || 0,
                        fanOut: topCandidate.fanOut || 0,
                        source: 'metrics'
                    }
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
                 
                 findings.push({
                     patternId: 'root_entry_point',
                     targetId: sortedSrc[0],
                     confidence: 0.8,
                     evidence: {
                         score: this.getRoleScore(sortedSrc[0]) - (sortedSrc[0].split('/').length * 10),
                         source: 'simulation_fallback'
                     }
                 });
             }
        }

        return findings;
    }
}
