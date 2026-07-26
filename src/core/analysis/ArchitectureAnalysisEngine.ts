import { ProjectState, Node, Edge } from '../../types/schema';
import { 
    AnalysisContext, 
    ArchitectureAnalyzer, 
    EvidenceBundle, 
    DiagnosticRecord
} from './types';
import { Logger } from '../../utils/Logger';

export class ArchitectureAnalysisEngine {
    private analyzers: ArchitectureAnalyzer[] = [];

    /**
     * Registers a new analyzer to the pipeline.
     * Execution order follows the order of registration.
     */
    public registerAnalyzer(analyzer: ArchitectureAnalyzer): void {
        this.analyzers.push(analyzer);
        Logger.info(`[AnalysisEngine] Registered analyzer: ${analyzer.id}`);
    }

    /**
     * Executes all registered analyzers sequentially and returns a unified EvidenceBundle.
     * This is a strictly synchronous, deterministic operation.
     */
    public run(state: ProjectState, initialDiagnostics?: DiagnosticRecord[], workspaceRoot?: string): EvidenceBundle {
        Logger.info(`[AnalysisEngine] Starting analysis pipeline with ${this.analyzers.length} analyzers`);

        // 1. Prepare O(1) maps for O(N) lookup optimizations inside analyzers
        const nodeMap = new Map<string, Node>();
        const edgeMap = new Map<string, Edge>();
        
        if (state.nodes) {
            for (const node of state.nodes) {
                nodeMap.set(node.id, node);
            }
        }
        
        if (state.edges) {
            for (const edge of state.edges) {
                edgeMap.set(edge.id, edge);
            }
        }

        // 2. Initialize Analysis Context
        const context: AnalysisContext = {
            findings: [],
            nodeMap,
            edgeMap,
            diagnostics: initialDiagnostics || [],
            workspaceRoot
        };

        // 2.5 Run AstSymbolResolver (Zero Mutation)
        const { AstSymbolResolver } = require('./ast/AstSymbolResolver');
        const astResolver = new AstSymbolResolver();
        astResolver.resolve(state, context);

        // 3. Execute Accumulation Pipeline (Synchronous)
        for (const analyzer of this.analyzers) {
            try {
                const result = analyzer.analyze(state, context);
                if (result && result.findings) {
                    context.findings.push(...result.findings);
                }
            } catch (error) {
                Logger.error(`[AnalysisEngine] Analyzer ${analyzer.id} failed:`, error);
                // We intentionally do not throw here to allow subsequent analyzers to run.
            }
        }

        Logger.info(`[AnalysisEngine] Pipeline complete. Generated ${context.findings.length} findings.`);

        // 4. Wrap and return the EvidenceBundle
        return {
            version: 1,
            timestamp: Date.now(),
            findings: context.findings
        };
    }
}
