import { IAnswer, IAnswerAggregator, IAnswerItem } from '../Answer';
import { Finding } from '../../rules/Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IBlastRadiusEvidence } from '../../evidence/Evidence';

export class Q5BlastRadiusAggregator implements IAnswerAggregator {
    public readonly questionId = 'Q5';

    public aggregate(snapshot: ReasoningSnapshot, findings: Finding[]): IAnswer | null {
        const blastFindings = findings.filter(f => f.type === 'BLAST_RADIUS');
        if (blastFindings.length === 0) return null;

        const items: IAnswerItem[] = [];

        for (const f of blastFindings) {
            const ev = snapshot.getAllEvidence().find(
                e => e.id === f.evidenceIds[0] && e.category === EvidenceCategory.BLAST_RADIUS
            ) as IBlastRadiusEvidence | undefined;

            if (!ev) continue;

            const meta = ev.metadata;
            const severityMatch = f.explanation.match(/^\[(.*?)\]/);
            const severity = severityMatch ? severityMatch[1] : 'LOW';

            let numericScore = 0;
            if (severity === 'CRITICAL') numericScore = 4;
            else if (severity === 'HIGH') numericScore = 3;
            else if (severity === 'MEDIUM') numericScore = 2;
            else numericScore = 1;

            // Add slight weight for sorting within groups
            numericScore += (meta.affectedBoundaryCount * 0.1) + (meta.affectedPipelineCount * 0.01);

            let humanExpl = `Classified as ${meta.criticality}.\n`;
            if (meta.affectedBoundaryCount > 0) humanExpl += `• affects ${meta.affectedBoundaryCount} boundaries\n`;
            if (meta.affectedPipelineCount > 0) humanExpl += `• affects ${meta.affectedPipelineCount} pipelines\n`;
            if (meta.affectedExtensionPointCount > 0) humanExpl += `• shatters ${meta.affectedExtensionPointCount} extension points\n`;

            items.push({
                targetId: f.targetIds[0],
                score: numericScore,
                explanation: `[${severity}] ${humanExpl.trim()}`,
                supportingFindings: [f.id],
                supportingEvidence: [ev.id]
            });
        }

        // Sort by severity group, then by affected counts
        items.sort((a, b) => b.score - a.score);

        return {
            questionId: this.questionId,
            questionText: '어디를 건드리면 무너지는가? (Blast Radius)',
            summary: `Identified structural blast radius for ${items.length} nodes.`,
            items,
            confidence: items.length > 0 ? 0.9 : 0
        };
    }
}
