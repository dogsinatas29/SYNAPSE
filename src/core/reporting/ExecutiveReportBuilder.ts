import { ExecutiveInsight, ReportSection } from '../../types/schema';

export class ExecutiveReportBuilder {
    public build(insight: ExecutiveInsight): ReportSection[] {
        return [
            {
                title: 'System Health & Business Impact',
                content: `**Architecture Health:** ${insight.health}\n\n**Frontier Observation:** ${insight.frontierObservation}\n\n**Business Impact:** ${insight.whyItMatters}\n\n**Recommended Action:** ${insight.action}`
            }
        ];
    }
}
