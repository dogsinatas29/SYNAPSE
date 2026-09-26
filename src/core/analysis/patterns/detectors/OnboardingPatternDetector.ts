import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';
import { ValidationContext } from '../../../validation/ValidationContext';
import { SimulationContext } from '../../../../types/schema';
import { EntryPointDetector } from './EntryPointDetector';

export class OnboardingPatternDetector implements PatternDetector {
    
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

    private getPipelineRoleScore(filePath: string): number {
        const lower = filePath.toLowerCase();
        if (lower.includes('model') || lower.includes('domain') || lower.includes('entity')) return 400;
        if (lower.includes('service') || lower.includes('manager') || lower.includes('engine') || lower.includes('core') || lower.includes('usecase')) return 300;
        if (lower.includes('repository') || lower.includes('database') || lower.includes('storage') || lower.includes('dao')) return 200;
        if (lower.includes('ui') || lower.includes('view') || lower.includes('activity') || lower.includes('fragment') || lower.includes('adapter') || lower.includes('action')) return -100;
        return 0;
    }
    
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        // 1. Re-use EntryPointDetector to find true entry point
        const entryPointDetector = new EntryPointDetector();
        const epFindings = entryPointDetector.detect(context, simContext);
        
        let trueEntryPoint = 'N/A';
        if (epFindings && epFindings.length > 0) {
            trueEntryPoint = Array.isArray(epFindings[0].targetId) ? epFindings[0].targetId[0] : epFindings[0].targetId;
        }
        
        let topFiles: any[] = [];
        
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            const counts = new Map<string, number>();
            for (const f of simContext.evidenceBundle.findings) {
                const src = f.sourceId || f.targetId || f.nodeId || '';
                if (src && this.isRealFile(src) && this.getRoleScore(src) > -1000) {
                    counts.set(src, (counts.get(src) || 0) + 1);
                }
            }
            const sortedCounts = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
            topFiles = sortedCounts.map(entry => ({
                filePath: entry[0],
                externalEdges: entry[1]
            }));
        }
        
        const pipeline: string[] = [];
        if (topFiles.length > 0) {
            const sortedImpact = [...topFiles].sort((a, b) => {
                const scoreA = this.getPipelineRoleScore(a.filePath) - (a.externalEdges * 0.01);
                const scoreB = this.getPipelineRoleScore(b.filePath) - (b.externalEdges * 0.01);
                return scoreB - scoreA;
            });
            
            if (trueEntryPoint === 'N/A') {
                trueEntryPoint = sortedImpact[0].filePath || 'N/A';
            }
            
            for (const f of sortedImpact) {
                if (f.filePath !== trueEntryPoint && pipeline.length < 4) {
                    pipeline.push(f.filePath);
                }
            }
        }
        
        // --- 1. PERIPHERAL_COMPONENT (Safe Areas) ---
        if (topFiles && topFiles.length > 0) {
            const safe = [...topFiles]
                .filter((f: any) => this.isRealFile(f.filePath))
                .sort((a: any, b: any) => a.externalEdges - b.externalEdges);
            
            const safeAreas = safe.slice(0, 3).map((f: any) => f.filePath);
            
            for (const area of safeAreas) {
                findings.push({
                    findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    patternId: PatternId.PERIPHERAL_COMPONENT,
                    targetScope: 'NODE',
                    targetId: area,
                    confidence: 1.0,
                    evidence: [{
                        evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                        type: 'STRUCTURAL_METRIC',
                        description: 'Low fan-out',
                        sourceId: area,
                        filePath: area
                    }]
                });
            }
        }

        // --- 2. LEARNING_HUB (Read Later) ---
        if (topFiles.length > 0) {
            const complex = topFiles.find(f => {
                return this.isRealFile(f.filePath) && f.filePath !== trueEntryPoint && !pipeline.includes(f.filePath);
            });
            
            if (complex) {
                const readLaterPath = complex.filePath;
                findings.push({
                    findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    patternId: PatternId.LEARNING_HUB,
                    targetScope: 'NODE',
                    targetId: readLaterPath,
                    confidence: 1.0,
                    evidence: [{
                        evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                        type: 'STRUCTURAL_METRIC',
                        description: 'High relative impact score',
                        sourceId: readLaterPath,
                        filePath: readLaterPath
                    }]
                });
            }
        }
        
        return findings;
    }
}
