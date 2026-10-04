import { PatternFinding } from '../analysis/patterns/PatternFinding';
import { PatternId } from '../analysis/patterns/PatternId';
import { ReportSection } from '../../types/schema';
import { traceReportConsume } from '../analysis/pipeline/DiagnosticTracer';
import { QUESTION_DICTIONARY } from './ReportContract';

export class FindingReportAdapter {
    public buildOnboardingSections(findings: PatternFinding[]): ReportSection[] {
        const sections: ReportSection[] = [];

        // --- O2: Observation Question ---
        const contractO2 = QUESTION_DICTIONARY["O2"];
        const o2Findings = findings.filter(f => contractO2.supportingPatterns.includes(f.patternId));
        
        let contentO2 = `Question:\n${contractO2.question}\n\n`;
        contentO2 += `Vocabulary:\n${contractO2.vocabulary.join(', ')}\n\n`;
        if (contractO2.interpretationGuide) {
            contentO2 += `Interpretation Guide:\n${contractO2.interpretationGuide}\n\n`;
        }
        
        if (o2Findings.length > 0) {
            contentO2 += `Finding:\n${o2Findings.length} root entry points observed.\n\n`;
            contentO2 += `[View Evidence](EVIDENCE_VIEWER.html#O2)\n`;
            o2Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ONBOARDING_REPORT', 'onboarding.entry_points');
            });
        } else {
            contentO2 += `Finding:\nNo verified finding emitted.\n\n`;
            contentO2 += `[View Evidence](EVIDENCE_VIEWER.html#O2)\n`;
        }
        
        sections.push({
            title: "O2 — Root Entry Point Observation",
            content: contentO2
        });

        return sections;
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

    public buildExecutionSections(findings: PatternFinding[]): ReportSection[] {
        const sections: ReportSection[] = [];

        // --- E2: Validation Question ---
        const contractE2 = QUESTION_DICTIONARY["E2"];
        const e2Findings = findings.filter(f => contractE2.supportingPatterns.includes(f.patternId));
        
        let contentE2 = `Question:\n${contractE2.question}\n\n`;
        contentE2 += `Vocabulary:\n${contractE2.vocabulary.join(', ')}\n\n`;
        if (contractE2.interpretationGuide) {
            contentE2 += `Interpretation Guide:\n${contractE2.interpretationGuide}\n\n`;
        }
        
        if (e2Findings.length > 0) {
            contentE2 += `Finding:\n${e2Findings.length} change propagation amplifiers observed.\n\n`;
            contentE2 += `[View Evidence](EVIDENCE_VIEWER.html#E2)\n`;
            e2Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'SIMULATION_DEBUG', 'simulation.change_amplifiers');
            });
        } else {
            contentE2 += `Finding:\nNo verified finding emitted.\n\n`;
            contentE2 += `[View Evidence](EVIDENCE_VIEWER.html#E2)\n`;
        }

        sections.push({
            title: "E2 — Change Propagation Amplifier",
            content: contentE2
        });

        return sections;
    }

    public buildArchitectSections(findings: PatternFinding[]): ReportSection[] {
        const sections: ReportSection[] = [];

        // --- A1: Validation Question ---
        const contractA1 = QUESTION_DICTIONARY["A1"];
        const a1Findings = findings.filter(f => contractA1.supportingPatterns.includes(f.patternId));
        
        let contentA1 = `Question:\n${contractA1.question}\n\n`;
        contentA1 += `Vocabulary:\n${contractA1.vocabulary.join(', ')}\n\n`;
        if (contractA1.interpretationGuide) {
            contentA1 += `Interpretation Guide:\n${contractA1.interpretationGuide}\n\n`;
        }
        
        if (a1Findings.length > 0) {
            contentA1 += `Finding:\n${a1Findings.length} system cores observed.\n\n`;
            contentA1 += `[View Evidence](EVIDENCE_VIEWER.html#A1)\n`;
            a1Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.system_cores');
            });
        } else {
            contentA1 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA1 += `[View Evidence](EVIDENCE_VIEWER.html#A1)\n`;
        }

        sections.push({
            title: "A1 — System Core Validation",
            content: contentA1
        });

        // --- A2: Observation Question ---
        const contractA2 = QUESTION_DICTIONARY["A2"];
        const a2Findings = findings.filter(f => contractA2.supportingPatterns.includes(f.patternId));
        
        let contentA2 = `Question:\n${contractA2.question}\n\n`;
        contentA2 += `Vocabulary:\n${contractA2.vocabulary.join(', ')}\n\n`;
        if (contractA2.interpretationGuide) {
            contentA2 += `Interpretation Guide:\n${contractA2.interpretationGuide}\n\n`;
        }
        
        if (a2Findings.length > 0) {
            contentA2 += `Finding:\n${a2Findings.length} module contact points observed.\n\n`;
            contentA2 += `[View Evidence](EVIDENCE_VIEWER.html#A2)\n`;
            a2Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.module_contact_points');
            });
        } else {
            contentA2 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA2 += `[View Evidence](EVIDENCE_VIEWER.html#A2)\n`;
        }

        sections.push({
            title: "A2 — Module Contact Points",
            content: contentA2
        });

        // --- A3: Observation Question ---
        const contractA3 = QUESTION_DICTIONARY["A3"];
        const boundaryFindings = findings.filter(f => contractA3.supportingPatterns.includes(f.patternId));
        
        let contentA3 = `Question:\n${contractA3.question}\n\n`;
        contentA3 += `Vocabulary:\n${contractA3.vocabulary.join(', ')}\n\n`;
        if (contractA3.interpretationGuide) {
            contentA3 += `Interpretation Guide:\n${contractA3.interpretationGuide}\n\n`;
        }
        
        if (boundaryFindings.length > 0) {
            contentA3 += `Finding:\n${boundaryFindings.length} structural boundaries observed.\n\n`;
            contentA3 += `[View Evidence](EVIDENCE_VIEWER.html#A3)\n`;
            boundaryFindings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.structural_boundaries');
            });
        } else {
            contentA3 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA3 += `[View Evidence](EVIDENCE_VIEWER.html#A3)\n`;
        }

        sections.push({
            title: "A3 — Structural Boundaries",
            content: contentA3
        });

        // --- A5: Validation Question ---
        const contractA5 = QUESTION_DICTIONARY["A5"];
        const a5Findings = findings.filter(f => contractA5.supportingPatterns.includes(f.patternId));
        
        console.log(`[DEBUG-A5] buildArchitectSections: total findings=${findings.length}`);
        console.log(`[DEBUG-A5] buildArchitectSections: a5Findings=${a5Findings.length}`);
        console.log(`[DEBUG-A5] buildArchitectSections: first 5 patternIds=${findings.slice(0, 5).map(f => f.patternId).join(', ')}`);
        
        let contentA5 = `Question:\n${contractA5.question}\n\n`;
        contentA5 += `Vocabulary:\n${contractA5.vocabulary.join(', ')}\n\n`;
        if (contractA5.interpretationGuide) {
            contentA5 += `Interpretation Guide:\n${contractA5.interpretationGuide}\n\n`;
        }
        
        if (a5Findings.length > 0) {
            contentA5 += `Finding:\n${a5Findings.length} structural control chokepoints observed.\n\n`;
            contentA5 += `[View Evidence](EVIDENCE_VIEWER.html#A5)\n`;
            a5Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.chokepoints');
            });
        } else {
            contentA5 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA5 += `[View Evidence](EVIDENCE_VIEWER.html#A5)\n`;
        }

        sections.push({
            title: "A5 — Structural Control Chokepoints",
            content: contentA5
        });

        return sections;
    }
}
