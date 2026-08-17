import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';

export class Q1EntryPointAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q1';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const ctrlPipelines = findings.filter(f => f.type === 'CONTROL_PIPELINE');
        const dominantAuths = findings.filter(f => f.type === 'DOMINANT_AUTHORITY');

        if (ctrlPipelines.length === 0 || dominantAuths.length === 0) return null;

        const authIds = new Set(dominantAuths.map(f => f.targetIds[0]));
        const entryPointScores = new Map<string, { count: number, authsReached: Set<string>, evidence: Set<string>, findings: Set<string> }>();

        for (const pipe of ctrlPipelines) {
            const root = pipe.targetIds[0];
            const reach = pipe.targetIds.filter(id => authIds.has(id));
            
            if (reach.length > 0) {
                if (!entryPointScores.has(root)) {
                    entryPointScores.set(root, { count: 0, authsReached: new Set(), evidence: new Set(), findings: new Set() });
                }
                const entry = entryPointScores.get(root)!;
                entry.count++;
                reach.forEach(a => entry.authsReached.add(a));
                pipe.evidenceIds.forEach(e => entry.evidence.add(e));
                entry.findings.add(pipe.id);
            }
        }

        const items: IAnswerItem[] = Array.from(entryPointScores.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .map(([nodeId, data]) => ({
                targetId: nodeId,
                score: data.count,
                explanation: `Acts as the root for ${data.count} control pipelines that directly reach Dominant Authorities (${Array.from(data.authsReached).join(', ')}).`,
                supportingFindings: Array.from(data.findings),
                supportingEvidence: Array.from(data.evidence)
            }));

        return {
            questionId: this.questionId,
            questionText: '어디서 시작해야 하나? (Where to start?)',
            summary: `Found ${items.length} key entry points that drive the core logic.`,
            items: items.slice(0, 5),
            confidence: items.length > 0 ? 0.9 : 0
        };
    }
}
