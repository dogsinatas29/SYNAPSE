import { ValidationContext } from '../validation/ValidationContext';
import { SimulationContext } from '../../types/schema';
import { OnboardingPath } from './types';

export class OnboardingAnalyzer {
    
    private isRealFile(filePath: string): boolean {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) {
            return false;
        }
        // Basic check for file extension (typical source files)
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    }

    private getRoleScore(filePath: string): number {
        const lower = filePath.toLowerCase();
        // Heavy penalty for test and script files
        if (lower.includes('test') || lower.includes('spec') || lower.includes('mock') || lower.includes('script') || lower.includes('benchmark')) {
            return -1000;
        }
        // Bonus for entry/bootstrap semantics
        if (lower.includes('main') || lower.includes('index') || lower.includes('bootstrap') || lower.includes('extension') || lower.includes('orchestrator') || lower.includes('init') || lower.includes('core')) {
            return +500;
        }
        return 0;
    }

    private calculateEntryPointScore(node: any): number {
        const fanIn = node.fanIn || 0;
        const fanOut = node.fanOut || 0;
        const depth = (node.filePath || node.id || '').split('/').length;
        const roleScore = this.getRoleScore(node.filePath || node.id || '');
        
        // We want: Fan-In = 0, Depth = low, Fan-Out = high
        // Score = RoleBonus - (FanIn * 50) - (Depth * 10) + FanOut
        return roleScore - (fanIn * 50) - (depth * 10) + fanOut;
    }

    /**
     * Extracts an onboarding reading path by mining the existing validation metrics
     * and simulation evidence, rather than "detecting" from scratch.
     */
    public extractPath(context: ValidationContext, simContext?: SimulationContext): OnboardingPath {
        const path: OnboardingPath = {
            entryPoint: 'N/A',
            corePipeline: [],
            safeAreas: [],
            readLater: []
        };

        if (!context.metrics) {
            return path;
        }

        // 1. Detect True Entry Point
        let candidates = (context.metrics.systemAssemblyPoints || []).filter(c => this.isRealFile(c.filePath || c.id || ''));
        
        let trueEntryPoint = 'N/A';
        
        if (candidates.length > 0) {
            // Sort by calculated score (descending)
            candidates = candidates.sort((a, b) => this.calculateEntryPointScore(b) - this.calculateEntryPointScore(a));
            trueEntryPoint = candidates[0].filePath || candidates[0].id || 'N/A';
        }

        // If Assembly Points missing, mine evidence for root-level nodes
        if (trueEntryPoint === 'N/A' && simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
             const findings = simContext.evidenceBundle.findings;
             const possibleEntry = new Set<string>();
             for (const f of findings) {
                 const src = f.sourceId || '';
                 if (src && this.isRealFile(src)) possibleEntry.add(src);
             }
             if (possibleEntry.size > 0) {
                 // Sort using role score and depth (shallower is better, bonus/penalty applied)
                 const sortedSrc = Array.from(possibleEntry).sort((a, b) => {
                     const scoreA = this.getRoleScore(a) - (a.split('/').length * 10);
                     const scoreB = this.getRoleScore(b) - (b.split('/').length * 10);
                     return scoreB - scoreA;
                 });
                 trueEntryPoint = sortedSrc[0];
             }
        }
        
        path.entryPoint = trueEntryPoint;

        // 2. Extract Core Pipeline (Reading Path)
        // Filter out Test files from Core Pipeline
        const pipeline: string[] = [];
        
        let topFiles = (context.metrics.topImpactFiles || []).filter(f => {
            const fPath = f.filePath || '';
            return this.isRealFile(fPath) && this.getRoleScore(fPath) > -1000;
        });

        // Fallback: If metrics are missing, mine the most heavily targeted files in evidence
        if (topFiles.length === 0 && simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            const counts = new Map<string, number>();
            for (const f of simContext.evidenceBundle.findings) {
                const targetId = f.nodeId || (f.nodeIds && f.nodeIds[0]) || '';
                if (targetId && this.isRealFile(targetId) && this.getRoleScore(targetId) > -1000) {
                    counts.set(targetId, (counts.get(targetId) || 0) + 1);
                }
            }
            const sortedCounts = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
            topFiles = sortedCounts.map(entry => ({
                filePath: entry[0],
                externalEdges: entry[1] // proxy for centrality based on violations
            })) as any[];
        }
        
        // We will build a logical sequence from the top impact files
        if (topFiles.length > 0) {
            // Sort top impact files by their centrality or external dependencies
            const sortedImpact = [...topFiles].sort((a, b) => (b.externalEdges || 0) - (a.externalEdges || 0));
            
            if (trueEntryPoint === 'N/A') {
                trueEntryPoint = sortedImpact[0].filePath || 'N/A';
                path.entryPoint = trueEntryPoint;
            }
            
            for (const f of sortedImpact) {
                const fPath = f.filePath || '';
                if (fPath !== trueEntryPoint && pipeline.length < 4) {
                    pipeline.push(fPath);
                }
            }
        }
        
        path.corePipeline = pipeline;

        // Extract Safe Areas (Low Fan-Out, High Fan-In typically)
        if (context.metrics.topImpactFiles) {
             const safe = context.metrics.topImpactFiles
                 .filter((f: any) => {
                     const name = f.filePath || '';
                     return this.isRealFile(name);
                 })
                 .sort((a: any, b: any) => (a.externalEdges || 0) - (b.externalEdges || 0));
             path.safeAreas = safe.slice(0, 3).map((f: any) => f.filePath || '');
        }

        // Read Later: We pick the highest impact file that is NOT in the core pipeline and NOT entry point
        if (topFiles.length > 0) {
             const complex = topFiles.find(f => {
                 const name = f.filePath || '';
                 return this.isRealFile(name) && name !== trueEntryPoint && !pipeline.includes(name);
             });
             if (complex) {
                 path.readLater.push(complex.filePath || '');
             }
        } 
        
        // Fallbacks if extraction was empty
        if (path.safeAreas.length === 0) path.safeAreas = ['N/A (No isolated leaf nodes detected)'];
        if (path.readLater.length === 0) path.readLater = ['N/A (No peripheral complexity detected)'];

        return path;
    }
}
