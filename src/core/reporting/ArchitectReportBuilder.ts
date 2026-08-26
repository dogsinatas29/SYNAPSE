import { ArchitecturalReasoningModel } from '../reasoning/builders/ArchitecturalReasoningModelBuilder';

/**
 * v0.3.34.32 Phase 11: Architect Report Builder
 * 
 * ArchitecturalReasoningModel을 마크다운 텍스트로 직렬화(Serialize)하는 순수 렌더러입니다.
 * 
 * [!CAUTION] 
 * 1. 이 클래스는 "추론(Inference)"이나 "해석(Interpretation)"을 절대 수행하지 않습니다.
 * 2. generateSummary(), generateRecommendation() 등의 메서드는 환각을 유발하므로 
 *    오직 renderObservation(), renderConstraint(), renderTransition() 형태만 허용합니다.
 * 3. 마크다운 섹션 타이틀도 OBSERVATIONS, CONSTRAINTS, TRANSITIONS, REFERENCES 로 고정합니다.
 */
export class ArchitectReportBuilder {
    
    public renderReport(model: ArchitecturalReasoningModel): string {
        let md = `# Architectural Reasoning Report (Timestamp: ${model.timestamp})\n\n`;

        md += this.renderObservations(model);
        md += this.renderConstraints(model);
        md += this.renderTransitions(model);
        md += this.renderReferences(model);

        return md;
    }

    private renderObservations(model: ArchitecturalReasoningModel): string {
        let md = `## OBSERVATIONS\n\n`;

        if (model.authority && model.authority.length > 0) {
            md += `### Authority\n`;
            model.authority.forEach(auth => {
                auth.signals.forEach(sig => {
                    md += `- Node: \`${auth.nodeId}\` | Signal: **${sig.type}** [REF: ${sig.evidenceReferences.join(', ')}]\n`;
                });
            });
            md += `\n`;
        }

        if (model.propagation && model.propagation.length > 0) {
            md += `### Propagation\n`;
            model.propagation.forEach(prop => {
                md += `- Node: \`${prop.nodeId}\` | Extent: **${prop.propagationExtent}** [REF: ${prop.evidenceReferences.join(', ')}]\n`;
            });
            md += `\n`;
        }

        return md;
    }

    private renderConstraints(model: ArchitecturalReasoningModel): string {
        let md = `## CONSTRAINTS\n\n`;

        if (model.constraints && model.constraints.length > 0) {
            model.constraints.forEach(constraintFinding => {
                constraintFinding.constraints.forEach(c => {
                    md += `- Node: \`${constraintFinding.nodeId}\` | Constraint: **${c.type}** [REF: ${constraintFinding.evidenceReferences.join(', ')}]\n`;
                });
            });
            md += `\n`;
        } else {
            md += `*No constraints detected.*\n\n`;
        }

        return md;
    }

    private renderTransitions(model: ArchitecturalReasoningModel): string {
        let md = `## TRANSITIONS\n\n`;

        if (model.transitions && model.transitions.length > 0) {
            model.transitions.forEach(t => {
                md += `- **${t.from}** --(${t.event})--> **${t.to || 'NULL'}**\n`;
            });
            md += `\n`;
        } else {
            md += `*No transitions executed.*\n\n`;
        }

        return md;
    }

    private renderReferences(model: ArchitecturalReasoningModel): string {
        let md = `## REFERENCES\n\n`;
        md += `- Base Evidence Count: ${model.evidences ? model.evidences.length : 0}\n`;
        md += `- Assembly Timestamp: ${model.timestamp}\n\n`;
        return md;
    }
}
