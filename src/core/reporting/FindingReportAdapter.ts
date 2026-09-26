import { PatternFinding } from '../analysis/patterns/PatternFinding';
import { PatternId } from '../analysis/patterns/PatternId';
import { ReportSection } from '../../types/schema';
import { traceReportConsume } from '../analysis/pipeline/DiagnosticTracer';

export class FindingReportAdapter {
    public buildOnboardingSection(findings: PatternFinding[]): ReportSection {
        const rootEntryPoints = findings.filter(f => f.patternId === PatternId.ROOT_ENTRY_POINT);
        const content = rootEntryPoints.length > 0 
            ? rootEntryPoints.map(f => {
                if (f.findingId) {
                    traceReportConsume(f.findingId, 'ONBOARDING_REPORT', 'onboarding.entry_points');
                }
                const targetStr = Array.isArray(f.targetId) ? f.targetId.join(', ') : f.targetId;
                return `- ${targetStr}`;
            }).join('\n')
            : '- N/A';

        const safeZones = findings.filter(f => f.patternId === PatternId.SAFE_REFACTORING_ZONE);
        safeZones.forEach(f => {
            if (f.findingId) traceReportConsume(f.findingId, 'ONBOARDING_REPORT', 'onboarding.safe_refactoring_zones');
        });

        return {
            title: "Entry Points (Pattern-based)",
            content: `Entry Point:\n${content}`
        };
    }

    public buildExecutiveSection(findings: PatternFinding[]): ReportSection {
        const sysCores = findings.filter(f => f.patternId === PatternId.SYSTEM_CORE);
        const content = sysCores.length > 0
            ? sysCores.map(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'EXECUTIVE_REPORT', 'executive.system_cores');
                return `- ${f.targetId}`;
            }).join('\n')
            : '- N/A';

        return {
            title: "System Cores (Pattern-based)",
            content: `System Cores:\n${content}`
        };
    }

    public buildSimulationSection(findings: PatternFinding[]): ReportSection {
        const changeAmps = findings.filter(f => f.patternId === PatternId.CHANGE_AMPLIFIER);
        const cascadeFails = findings.filter(f => f.patternId === PatternId.CASCADE_FAILURE_POINT);
        const boundaryCandidates = findings.filter(f => f.patternId === PatternId.BOUNDARY_CANDIDATE);
        
        console.log(`[DT-A2] FindingReportAdapter.buildSimulationSection:\n  inputBoundary=${boundaryCandidates.length}\n  outputBoundary=0\n  dropped=${boundaryCandidates.length} (Filter condition: only change_amp, cascade_fail, chokepoint are processed)`);

        let content = "### Change Amplifiers\n";
        content += changeAmps.length > 0 
            ? changeAmps.map(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'SIMULATION_DEBUG', 'simulation.change_amplifiers');
                return `- ${f.targetId}`;
            }).join('\n')
            : '- N/A';
            
        content += "\n\n### Cascade Failure Points\n";
        content += cascadeFails.length > 0 
            ? cascadeFails.map(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'SIMULATION_DEBUG', 'simulation.cascade_failure_points');
                return `- ${f.targetId}`;
            }).join('\n')
            : '- N/A';

        const chokepoints = findings.filter(f => f.patternId === PatternId.ARCHITECTURAL_CHOKEPOINT);
        content += "\n\n### Architectural Chokepoints (Cluster-Level Bridges)\n";
        content += chokepoints.length > 0
            ? chokepoints.map(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'SIMULATION_DEBUG', 'simulation.architectural_chokepoints');
                
                const score = f.evidence?.[0]?.metadata?.clusterScore?.toFixed(2) || 'N/A';
                const contributors = f.evidence?.[0]?.metadata?.topContributors?.join(', ') || 'N/A';
                
                return `- **Cluster**: \`${f.targetId}\` (Score: ${score})\n  - Top Contributors: ${contributors}`;
            }).join('\n')
            : '- N/A';

        return {
            title: "Impact Propagation (Pattern-based)",
            content: content
        };
    }
}
