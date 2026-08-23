import { OnboardingInsight, ReportSection } from '../../types/schema';

export class OnboardingReportBuilder {
    public build(insight: OnboardingInsight): ReportSection[] {
        const pipelineSteps = insight.coreDomain !== 'N/A' 
            ? insight.coreDomain.split(',').map((step, idx) => `${idx + 2}. **Core Pipeline:** ${step}`).join('\n')
            : '2. **Core Pipeline:** N/A';
            
        const readLaterSteps = insight.avoidReadingYet !== 'N/A'
            ? insight.avoidReadingYet.split(',').map(s => `- ${s}`).join('\n')
            : '- N/A';

        return [
            {
                title: 'Onboarding Guide',
                content: `### Reading Path\n1. **Entry Point:** ${insight.entryPoint}\n${pipelineSteps}\n\n### Safe Areas (Low Risk)\n${insight.safeArea.map(s => `- ${s}`).join('\n')}\n\n### Read Later (Complex / High Risk)\n${readLaterSteps}`
            }
        ];
    }
}
