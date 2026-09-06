import { ValidationClaim, ValidationStudy } from './types';

export class ValidationRenderer {
    public static claim = class ClaimRenderer {
        public static render(claim: ValidationClaim, allStudies: ValidationStudy[]): string {
            let supportingStudies: ValidationStudy[] = [];
            if (claim.supportingStudyIds && claim.supportingStudyIds.length > 0) {
                supportingStudies = allStudies.filter(s => claim.supportingStudyIds!.includes(s.id));
            } else {
                const parentStudy = allStudies.find(s => (s.claims || []).some(c => c.id === claim.id));
                if (parentStudy) supportingStudies.push(parentStudy);
            }
            
            const { quality, mockCount, simCount, measCount, totalReps } = ValidationRenderer.evidence.calculateQualityAndStrength(supportingStudies);

            let section = `**Status**: ${claim.status.toUpperCase()}\n\n`;
            section += `**Claim**:\n${claim.statement}\n\n`;
            
            if (claim.impactSummary) {
                const impact = claim.impactSummary;
                section += `**Impact**:\n`;
                if (impact.metric) {
                    section += `- Metric: ${impact.metric}\n`;
                }
                section += `- ${impact.before} → ${impact.after}\n`;
                if (impact.deltaPercent !== undefined) {
                    section += `- Delta: ${impact.deltaPercent}%\n`;
                }
                if (impact.affectedAreas && impact.affectedAreas.length > 0) {
                    section += `- Affected Areas:\n`;
                    impact.affectedAreas.forEach((area: string) => {
                        section += `  - ${area}\n`;
                    });
                }
                section += `\n`;
            }
            
            if (claim.datasetScope) {
                section += `**Dataset Scope**:\n${claim.datasetScope}\n\n`;
            }
            
            const confidenceLevels = supportingStudies.map(s => s.confidenceLevel);
            const conf = confidenceLevels.includes('high') ? 'HIGH' : (confidenceLevels.includes('medium') ? 'MEDIUM' : 'LOW');
            section += `**Logical Confidence**:\n${conf}\n\n`;
            
            section += `**Evidence Quality**:\n${quality}\n\n`;
            
            section += `**Evidence Strength**:\n`;
            section += `- Studies: ${supportingStudies.length}\n`;
            section += `- Replications: ${totalReps}\n`;
            section += `- Mock: ${mockCount}\n`;
            section += `- Simulated: ${simCount}\n`;
            section += `- Measured: ${measCount}\n\n`;
            
            if (claim.competingHypotheses && claim.competingHypotheses.length > 0) {
                section += `**Alternative Hypotheses Status**:\n`;
                claim.competingHypotheses.forEach((ch: any) => {
                    section += `- ${ch.hypothesis}: ${ch.status.toUpperCase()}\n`;
                });
                section += `\n`;
            }
            
            return section;
        }
    };

    public static evidence = class EvidenceRenderer {
        public static renderChain(studies: ValidationStudy[]): string {
            let section = `**Evidence Chain**:\n`;
            studies.forEach(s => {
                if (s.id === 'validation-0h') section += `- **Phase 0H (Targeted Ablation)**: STRUCTURE contributes significantly to giant SCC\n`;
                if (s.id === 'validation-0i') section += `- **Phase 0I (Subsystem Isolation)**: Combined analysis amplifies SCC size significantly\n`;
                if (s.id === 'validation-0j') section += `- **Phase 0J (Attribution)**: CALL edges account for major boundary connectivity\n`;
                if (s.id === 'validation-j2.5') section += `- **Phase J2.5 (Characterization)**: Residual SCC characterization\n`;
                if (s.id === 'validation-j2.6') section += `- **Phase J2.6 (Ablation)**: Edge ablation effects\n`;
                if (s.id === 'validation-j2.6b') section += `- **Phase J2.6b (Repeatability)**: 100/100 runs identical, Variance 0\n`;
                if (s.id === 'validation-j2.7') section += `- **Phase J2.7 (Candidate Discovery)**: Retention edge extraction\n`;
            });
            section += `\n---\n\n`;
            return section;
        }
        
        public static calculateQualityAndStrength(studies: ValidationStudy[]) {
            let mockCount = 0;
            let simCount = 0;
            let measCount = 0;
            let totalReps = 0;
            
            studies.forEach(s => {
                if (s.evidenceSource === 'mock') mockCount++;
                if (s.evidenceSource === 'simulated') simCount++;
                if (s.evidenceSource === 'measured') measCount++;
                if (s.replicationCount) totalReps += s.replicationCount;
            });
            
            let quality = 'PRELIMINARY';
            if (measCount > 0) quality = 'VALIDATED';
            else if (simCount > mockCount) quality = 'EXPERIMENTAL';
            
            return {
                mockCount,
                simCount,
                measCount,
                totalReps,
                quality
            };
        }
    };

    public static appendix = class AppendixRenderer {
        public static render(formattedEvidence: any[]): {title: string, content: string}[] {
            return formattedEvidence.filter((e: any) => e.title.includes('SCC Validation Evidence')).map((e: any) => ({
                title: 'Raw Registry Dump (Appendix)',
                content: e.content
            }));
        }
    };
}
