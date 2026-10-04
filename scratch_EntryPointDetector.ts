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

    private getExecutionSemanticScore(filePath: string): number {
        const lower = filePath.toLowerCase();
        if (lower.includes('test') || lower.includes('spec') || lower.includes('mock') || lower.includes('script') || lower.includes('benchmark')) {
            return -1000;
        }
        
        let score = 0;
        // Strong indicators of execution start
        if (lower.endsWith('main.go') || lower.endsWith('main.rs') || lower.endsWith('main.ts') || lower.endsWith('main.c') || lower.endsWith('main.cpp')) score += 5000;
        else if (lower.includes('main') || lower.includes('cli') || lower.includes('bootstrap') || lower.includes('index') || lower.includes('activate')) score += 2000;
        else if (lower.includes('app') || lower.includes('server') || lower.includes('cmd')) score += 1000;
        
        return score;
    }

    private getLearningHubSemanticScore(filePath: string): number {
        const lower = filePath.toLowerCase();
        if (lower.includes('test') || lower.includes('spec') || lower.includes('mock') || lower.includes('script')) {
            return -1000;
        }
        
        let score = 0;
        // Strong indicators of core logic/domain
        if (lower.includes('core') || lower.includes('domain') || lower.includes('model') || lower.includes('engine') || lower.includes('service') || lower.includes('controller') || lower.includes('pkg')) score += 1000;
        
        return score;
    }

    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        const allNodes = context.metrics?.systemAssemblyPoints || [];
        const validNodes = allNodes.filter((n: any) => this.isRealFile(n.filePath || n.id || ''));
        
        if (validNodes.length === 0) return findings;

        // 1. Execution Entry (inDegree == 0 && outDegree > 0)
        let execCandidates = validNodes.filter((n: any) => (n.fanIn || 0) === 0 && (n.fanOut || 0) > 0);
        
        // Fallback: If no pure root (inDegree==0), just take lowest fanIn + highest outDegree
        if (execCandidates.length === 0) {
            execCandidates = validNodes.filter((n: any) => (n.fanOut || 0) > 0);
        }

        if (execCandidates.length > 0) {
            execCandidates.sort((a: any, b: any) => {
                const scoreA = this.getExecutionSemanticScore(a.filePath || a.id || '') - ((a.fanIn || 0) * 100) + (a.fanOut || 0);
                const scoreB = this.getExecutionSemanticScore(b.filePath || b.id || '') - ((b.fanIn || 0) * 100) + (b.fanOut || 0);
                return scoreB - scoreA;
            });
            
            const topExec = execCandidates[0];
            const targetId = topExec.filePath || topExec.id;
            
            const evidence: EvidenceItem = {
                evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                type: "EXECUTION_METRIC",
                sourceId: targetId,
                description: `Execution entry point with outDegree=${topExec.fanOut || 0}, inDegree=${topExec.fanIn || 0}`,
                filePath: targetId,
                graphNodeId: topExec.id,
                metadata: {
                    inDegree: topExec.fanIn || 0,
                    outDegree: topExec.fanOut || 0
                }
            };

            findings.push({
                findingId: `F-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                patternId: PatternId.ROOT_ENTRY_POINT,
                targetScope: 'NODE',
                targetId: targetId,
                confidence: 1.0,
                evidence: [evidence]
            });
        }

        // 2. Structural Learning Hub (high outDegree + high semantic score)
        let hubCandidates = validNodes.filter((n: any) => (n.fanOut || 0) > 0 || (n.fanIn || 0) > 0);
        if (hubCandidates.length > 0) {
            hubCandidates.sort((a: any, b: any) => {
                const scoreA = this.getLearningHubSemanticScore(a.filePath || a.id || '') + ((a.fanOut || 0) * 10) + ((a.fanIn || 0) * 5) - ((a.filePath || a.id || '').split('/').length * 5);
                const scoreB = this.getLearningHubSemanticScore(b.filePath || b.id || '') + ((b.fanOut || 0) * 10) + ((b.fanIn || 0) * 5) - ((b.filePath || b.id || '').split('/').length * 5);
                return scoreB - scoreA;
            });
            
            // Take top 2 unique hubs
            const selectedHubs = new Set<string>();
            for (let i = 0; i < hubCandidates.length && selectedHubs.size < 2; i++) {
                const targetId = hubCandidates[i].filePath || hubCandidates[i].id;
                // Basic deduplication to avoid picking things in the exact same directory if possible
                const dir = targetId.substring(0, targetId.lastIndexOf('/'));
                
                let isDuplicateDir = false;
                for (const existing of selectedHubs) {
                    if (existing.includes(dir) || dir.includes(existing)) {
                        isDuplicateDir = true;
                        break;
                    }
                }
                
                if (!isDuplicateDir || selectedHubs.size === 0) {
                    selectedHubs.add(targetId);
                    
                    const evidence: EvidenceItem = {
                        evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        type: "LEARNING_METRIC",
                        sourceId: targetId,
                        description: `Structural learning hub with high cohesion/impact (fanOut=${hubCandidates[i].fanOut || 0}, fanIn=${hubCandidates[i].fanIn || 0})`,
                        filePath: targetId,
                        graphNodeId: hubCandidates[i].id,
                        metadata: {
                            inDegree: hubCandidates[i].fanIn || 0,
                            outDegree: hubCandidates[i].fanOut || 0,
                            domainComplexity: scoreA => scoreA // dummy
                        }
                    };

                    findings.push({
                        findingId: `F-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        patternId: PatternId.LEARNING_HUB,
                        targetScope: 'NODE',
                        targetId: targetId,
                        confidence: 0.9,
                        evidence: [evidence]
                    });
                }
            }
        }

        return findings;
    }
}
