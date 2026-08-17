import { GraphModel } from '../GraphModel';
import { ReasoningSnapshot } from './snapshot/ReasoningSnapshot';
import { ExtensionAnalyzer } from './analysis/ExtensionAnalyzer';
import { AnswerEngine } from './answers/AnswerEngine';
import { Q4ExtensionAggregator } from './answers/aggregators/Q4ExtensionAggregator';
import { ValidationContext, GraphSnapshot } from '../validation/ValidationContext';
import { ArchitectureIrBuilder } from '../ir/ArchitectureIrBuilder';

export interface AnswerBundle {
    extensionPoints: any[];
}

export class ReasoningPipelineRunner {
    public static run(graphSnapshot: GraphSnapshot, context: ValidationContext): AnswerBundle {
        console.log('[REASONING] start');
        // Create a GraphModel adapter if needed, or instantiate a new one
        const graph = new GraphModel();
        graph.restoreSnapshot(graphSnapshot as any);
        console.log('[REASONING] snapshot restored');

        // 1. Run IR Builder to enrich graph with semantic facts
        const irBuilder = new ArchitectureIrBuilder();
        
        // Log a sample of nodes to detect project pollution
        const sampleNodes = Array.from((graph as any).nodes.keys() || []).slice(0, 5);
        console.log('[REASONING] graph sample nodes', sampleNodes);

        irBuilder.build(graph);

        // 2. Initialize ReasoningSnapshot
        let snapshot = new ReasoningSnapshot();
        
        // 3. Run Analyzers to populate Snapshot with Evidence
        const extensionAnalyzer = new ExtensionAnalyzer();
        snapshot = extensionAnalyzer.analyze(snapshot, [], graph);
        console.log('[REASONING] analyzer done');

        // 4. Run AnswerEngine to answer architectural questions (Q1-Q8)
        const answerEngine = new AnswerEngine();
        answerEngine.register(new Q4ExtensionAggregator());
        console.log('[REASONING] answer engine done');
        
        const findings = (context as any).metrics?.findings || [];
        const answers = answerEngine.execute(snapshot, { findings } as any);

        console.log('[ANSWER_ENGINE]', { answers: answers.length });

        return {
            extensionPoints: answers.filter((a: any) => a.questionId === 'Q4')
        };
    }
}
