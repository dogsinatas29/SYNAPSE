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

        // Detect languageFamily from node paths (default: 'ts')
        let languageFamily = 'ts';
        const exts: Record<string, number> = { ts: 0, js: 0, java: 0, kt: 0, cpp: 0, c: 0, h: 0, py: 0, rs: 0, go: 0 };
        for (const node of (graph as any).nodes.values() || []) {
            const file = node.filePath || node.id || '';
            const m = file.match(/\.([^.]+)$/);
            if (m && exts[m[1]] !== undefined) exts[m[1]]++;
        }
        
        let maxCount = 0;
        let maxExt = 'ts';
        for (const [ext, count] of Object.entries(exts)) {
            if (count > maxCount) {
                maxCount = count;
                maxExt = ext;
            }
        }
        
        if (['cpp', 'c', 'h'].includes(maxExt)) languageFamily = 'cpp';
        else if (['java', 'kt'].includes(maxExt)) languageFamily = 'java';
        else if (['py'].includes(maxExt)) languageFamily = 'python';
        else if (['rs'].includes(maxExt)) languageFamily = 'rust';
        else if (['go'].includes(maxExt)) languageFamily = 'go';
        else languageFamily = 'ts';
        
        console.log('[REASONING] detected languageFamily', { maxExt, maxCount, languageFamily });

        irBuilder.build(graph, languageFamily);

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
