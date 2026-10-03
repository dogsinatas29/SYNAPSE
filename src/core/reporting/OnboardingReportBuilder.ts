import { OnboardingInsight, ReportSection } from '../../types/schema';

export class OnboardingReportBuilder {
    public build(insight: OnboardingInsight): ReportSection[] {
        const pipelineSteps = insight.coreDomain !== 'N/A' 
            ? insight.coreDomain.split(',').map((step, idx) => `${idx + 2}. **Core Pipeline:** ${step}`).join('\n')
            : '2. **Core Pipeline:** N/A';
            
        const readLaterSteps = insight.avoidReadingYet !== 'N/A'
            ? insight.avoidReadingYet.split(',').map(s => `- ${s}`).join('\n')
            : '- N/A';

        const safeZoneSteps = insight.safeRefactoringZone && insight.safeRefactoringZone.length > 0
            ? insight.safeRefactoringZone.map(s => `- ${s}`).join('\n')
            : '- N/A';

        return [
            {
                title: 'Onboarding Guide',
                content: `### Entry Point\n- ${insight.entryPoint}`
            }
        ];
    }
}
