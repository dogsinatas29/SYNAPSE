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
        console.time("AAE_TOTAL");
        for (const analyzer of this.analyzers) {
            try {
                Logger.info(`[AAE_ENTER] ${analyzer.id}`);
                console.time(`[AAE] ${analyzer.id}`);
                const result = analyzer.analyze(state, context);
                if (result && result.findings) {
                    for (const f of result.findings) {
                        context.findings.push(f);
                    }
                }
                console.timeEnd(`[AAE] ${analyzer.id}`);
                Logger.info(`[AAE_EXIT] ${analyzer.id} findings=${result.findings.length}`);
            } catch (error) {
                Logger.error(`[AnalysisEngine] Analyzer ${analyzer.id} failed:`, error);
                // We intentionally do not throw here to allow subsequent analyzers to run.
            }
        }

        console.timeEnd("AAE_TOTAL");

        Logger.info(`[AnalysisEngine] Pipeline complete. Generated ${context.findings.length} findings.`);
        Logger.info(`[DEBUG] findings=${context.findings.length}`);
        Logger.info(`[DEBUG] keys=${Object.keys(context).join(',')}`);
        Logger.info(`[DEBUG] before return context`);

        const result = {
            version: 1 as 1,
            timestamp: Date.now(),
            findings: context.findings
        } as any;

        Logger.info(`[DEBUG] context prepared`);

        return result;
    }
}
