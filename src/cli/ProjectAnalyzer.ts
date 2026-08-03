import { RegexProvider } from '../core/analysis/intent/RegexProvider';
import { VSCodeProvider } from '../core/analysis/intent/VSCodeProvider';
import { EvidenceAggregator } from '../core/analysis/intent/EvidenceAggregator';
import { ConfidenceEngine } from '../core/analysis/intent/ConfidenceEngine';
import { ArchitectMapGenerator } from '../core/analysis/intent/ArchitectMapGenerator';
import { ReasonedReportBundle } from '../core/analysis/intent/ReasonedReportBundle';
import * as fs from 'fs';
import * as path from 'path';

export type AnalysisStatus = 'PASS' | 'FAIL' | 'TIMEOUT' | 'OOM' | 'PARTIAL';

export interface AnalysisMetrics {
    projectName: string;
    version: string;
    filesScanned: number;
    nodes: number;
    edges: number;
    evidenceCount: number;
    intentEdgeCount: number;
    averageConfidence: number;
    analysisMs: number;
    providers: {
        Regex: number;
        DefinitionProvider: number;
        ReferenceProvider: number;
        SymbolProvider: number;
    };
}

export interface AnalysisResult {
    version: string;
    projectName: string;
    status: AnalysisStatus;
    durationMs: number;
    metrics?: AnalysisMetrics;
    bundle?: ReasonedReportBundle;
    error?: string;
}

export class ProjectAnalyzer {
    async analyze(projectPath: string): Promise<AnalysisResult> {
        const startTime = Date.now();
        const projectName = path.basename(projectPath);
        const version = '0.3.34.11';

        try {
            const targetFiles = this.findSourceFiles(projectPath);
            
            const regexProvider = new RegexProvider(targetFiles);
            const vscodeProvider = new VSCodeProvider(targetFiles);

            const [regexEvidence, vscodeEvidence] = await Promise.all([
                regexProvider.collect(),
                vscodeProvider.collect()
            ]);

            const allEvidence = [...regexEvidence, ...vscodeEvidence];

            const aggregator = new EvidenceAggregator();
            let intentEdges = aggregator.aggregate(allEvidence);

            // --- Phase 1: Symbol -> File Resolution ---
            // 1. Build Symbol Index and existing nodes set
            const existingNodeIds = new Set(targetFiles);
            const symbolIndex = require('../core/SymbolIndex').SymbolIndex.getInstance();
            symbolIndex.initialize(projectName, projectPath);
            symbolIndex.rebuildFromFiles(targetFiles);

            const ReferenceResolver = require('../core/ReferenceResolver').ReferenceResolver;

            // 2. Format edges for Resolver
            const refsForResolver = intentEdges.map(edge => ({
                sourceFilePath: edge.source,
                ref: { target: edge.target, type: edge.intent, provenance: edge.providers?.[0] }
            }));

            // 3. Resolve symbols to absolute file paths
            const resolved = ReferenceResolver.resolve(refsForResolver, existingNodeIds, symbolIndex);

            // 4. Filter unresolved and rebuild intentEdges
            const resolvedEdges: any[] = [];
            for (let i = 0; i < resolved.length; i++) {
                const r = resolved[i];
                if (r.resolutionKind !== 'unresolved') {
                    resolvedEdges.push({
                        source: r.sourceId,
                        target: r.targetId, // Resolved absolute path!
                        intent: r.referenceType,
                        confidence: intentEdges[i].confidence,
                        evidenceCount: intentEdges[i].evidenceCount,
                        providers: intentEdges[i].providers
                    });
                }
            }
            intentEdges = resolvedEdges;
            // ------------------------------------------

            const confidenceEngine = new ConfidenceEngine();
            confidenceEngine.calculateAll(intentEdges);

            // Finding + Action generation replaced by ArchitectOnboardingMap
            const architectMapGen = new ArchitectMapGenerator();
            const { map: onboardingMap, stats: pipelineStats } = architectMapGen.generate(intentEdges, projectPath);

            const averageConfidence = intentEdges.length > 0 
                ? intentEdges.reduce((acc, edge) => acc + edge.confidence, 0) / intentEdges.length 
                : 0;

            const durationMs = Date.now() - startTime;

            const bundle: ReasonedReportBundle = {
                generatedAt: new Date().toISOString(),
                pipelineStats,
                evidenceCount: allEvidence.length,
                intentEdgeCount: intentEdges.length,
                averageConfidence: averageConfidence,
                evidence: allEvidence,
                intentEdges: intentEdges,
                onboardingMap
            };

            const providerStats = {
                Regex: allEvidence.filter(e => e.provider === 'RegexProvider').length,
                DefinitionProvider: allEvidence.filter(e => e.provider === 'DefinitionProvider').length,
                ReferenceProvider: allEvidence.filter(e => e.provider === 'ReferenceProvider').length,
                SymbolProvider: allEvidence.filter(e => e.provider === 'SymbolProvider').length,
            };

            const metrics: AnalysisMetrics = {
                projectName,
                version,
                filesScanned: targetFiles.length,
                nodes: targetFiles.length, // approximation for MVP scale tracking
                edges: intentEdges.length,
                evidenceCount: bundle.evidenceCount,
                intentEdgeCount: bundle.intentEdgeCount,
                averageConfidence: bundle.averageConfidence,
                analysisMs: durationMs,
                providers: providerStats
            };

            return {
                version,
                projectName,
                status: 'PASS',
                durationMs,
                metrics,
                bundle
            };

        } catch (error: any) {
            const errorMessage = error.message || String(error);
            const status: AnalysisStatus = errorMessage.includes('heap out of memory') ? 'OOM' : 'FAIL';
            
            return {
                version,
                projectName,
                status,
                durationMs: Date.now() - startTime,
                error: errorMessage
            };
        }
    }

    private findSourceFiles(dir: string): string[] {
        let results: string[] = [];
        if (!fs.existsSync(dir)) return results;
        
        try {
            const list = fs.readdirSync(dir);
            for (const file of list) {
                if (file === 'node_modules' || file.startsWith('.')) continue;
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat && stat.isDirectory()) {
                    results = results.concat(this.findSourceFiles(fullPath));
                } else {
                    if (file.match(/\.(ts|js|c|h|cpp|java|kt|py|rs)$/)) {
                        results.push(fullPath);
                    }
                }
            }
        } catch (e) {
            // Ignore access errors
        }
        
        return results;
    }
}
