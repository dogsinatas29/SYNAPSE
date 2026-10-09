import { PatternFinding } from '../analysis/patterns/PatternFinding';
import { PatternId } from '../analysis/patterns/PatternId';
import { ReportSection } from '../../types/schema';
import { traceReportConsume } from '../analysis/pipeline/DiagnosticTracer';
import { QUESTION_DICTIONARY } from './ReportContract';

export class FindingReportAdapter {
    private formatDetailedFindings(uniqueFindings: Map<string, any>, count: number, section: string, allowedMetrics: string[]): string {
        let content = '';
        const displayFindings = Array.from(uniqueFindings.values()).slice(0, 5);
        for (const f of displayFindings) {
            const targetName = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
            let evidenceStr = '';
            
            if (f.evidence && f.evidence.length > 0) {
                const ev = f.evidence[0];
                let metrics = 'N/A';
                if (ev.metadata) {
                    const filtered = Object.entries(ev.metadata).filter(([k]) => allowedMetrics.includes(k));
                    if (filtered.length > 0) {
                        metrics = filtered.map(([k,v]) => `${k}=${v}`).join(', ');
                    }
                }
                const basis = ev.selectionBasis || (typeof ev.predicate === 'string' ? ev.predicate : JSON.stringify(ev.predicate)) || 'No selection basis provided by detector';
                evidenceStr = `\n  - Observed: ${metrics}\n  - Selection Basis: ${basis}`;
            }
            
            content += `- **Target**: \`${targetName}\`${evidenceStr}\n`;
        }
        if (count > 5) {
            content += `- ... and ${count - 5} more.\n\n`;
        } else {
            content += `\n`;
        }
        content += `[View All Detailed Evidence](EVIDENCE_VIEWER.html#${section})\n`;
        return content;
    }

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
        
        const uniqueO2 = new Map<string, any>();
        for (const f of o2Findings) {
            const key = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
            uniqueO2.set(key, f);
        }
        const o2Count = uniqueO2.size;
        
        if (o2Count > 0) {
            contentO2 += `Finding:\n${o2Count} dependency roots observed.\n\n`;
            contentO2 += this.formatDetailedFindings(uniqueO2, o2Count, "O2", ['inDegree', 'outDegree']);
            
            o2Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ONBOARDING_REPORT', 'onboarding.entry_points');
            });
        } else {
            contentO2 += `Finding:\nNo verified finding emitted.\n\n`;
            contentO2 += `[View All Detailed Evidence](EVIDENCE_VIEWER.html#O2)\n`;
        }
        
        sections.push({
            title: "O2 — Dependency Root Observation",
            content: contentO2
        });

        return sections;
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
        
        const uniqueE2 = new Map<string, any>();
        for (const f of e2Findings) {
            const key = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
            uniqueE2.set(key, f);
        }
        const e2Count = uniqueE2.size;
        
        if (e2Count > 0) {
            contentE2 += `Finding:\n${e2Count} change propagation amplifiers observed.\n\n`;
            contentE2 += this.formatDetailedFindings(uniqueE2, e2Count, "E2", ['blastRadius', 'propagationReach']);
            
            e2Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'SIMULATION_DEBUG', 'simulation.change_amplifiers');
            });
        } else {
            contentE2 += `Finding:\nNo verified finding emitted.\n\n`;
            contentE2 += `[View All Detailed Evidence](EVIDENCE_VIEWER.html#E2)\n`;
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
        
        const uniqueA1 = new Map<string, any>();
        for (const f of a1Findings) {
            const key = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
            uniqueA1.set(key, f);
        }
        const a1Count = uniqueA1.size;
        
        if (a1Count > 0) {
            contentA1 += `Finding:\n${a1Count} system cores observed.\n\n`;
            contentA1 += this.formatDetailedFindings(uniqueA1, a1Count, "A1", ['controlScore', 'fanIn', 'blastRadius']);
            
            a1Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.system_cores');
            });
        } else {
            contentA1 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA1 += `[View All Detailed Evidence](EVIDENCE_VIEWER.html#A1)\n`;
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
        
        const uniqueA2 = new Map<string, any>();
        for (const f of a2Findings) {
            const key = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
            uniqueA2.set(key, f);
        }
        const a2Count = uniqueA2.size;
        
        if (a2Count > 0) {
            contentA2 += `Finding:\n${a2Count} module contact points observed.\n\n`;
            contentA2 += this.formatDetailedFindings(uniqueA2, a2Count, "A2", ['dependencyCount']);
            
            a2Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.module_contact_points');
            });
        } else {
            contentA2 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA2 += `[View All Detailed Evidence](EVIDENCE_VIEWER.html#A2)\n`;
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
        
        const uniqueA3 = new Map<string, any>();
        for (const f of boundaryFindings) {
            const key = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
            uniqueA3.set(key, f);
        }
        const a3Count = uniqueA3.size;
        
        if (a3Count > 0) {
            contentA3 += `Finding:\n${a3Count} structural boundaries observed.\n\n`;
            contentA3 += this.formatDetailedFindings(uniqueA3, a3Count, "A3", ['strength', 'cohesion', 'internalEdges', 'externalEdges', 'members']);
            
            boundaryFindings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.structural_boundaries');
            });
        } else {
            contentA3 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA3 += `[View All Detailed Evidence](EVIDENCE_VIEWER.html#A3)\n`;
        }

        sections.push({
            title: "A3 — Structural Boundaries",
            content: contentA3
        });

        // --- A5: Validation Question ---
        const contractA5 = QUESTION_DICTIONARY["A5"];
        const a5Findings = findings.filter(f => contractA5.supportingPatterns.includes(f.patternId));
        
        let contentA5 = `Question:\n${contractA5.question}\n\n`;
        contentA5 += `Vocabulary:\n${contractA5.vocabulary.join(', ')}\n\n`;
        if (contractA5.interpretationGuide) {
            contentA5 += `Interpretation Guide:\n${contractA5.interpretationGuide}\n\n`;
        }
        
        const uniqueA5 = new Map<string, any>();
        for (const f of a5Findings) {
            const key = Array.isArray(f.targetId) ? f.targetId.join(', ') : String(f.targetId);
            uniqueA5.set(key, f);
        }
        const a5Count = uniqueA5.size;
        
        if (a5Count > 0) {
            contentA5 += `Finding:\n${a5Count} structural control chokepoints observed.\n\n`;
            contentA5 += this.formatDetailedFindings(uniqueA5, a5Count, "A5", ['rawBetweennessSum', 'topNodeContribution', 'clusterScore', 'aggregationMethod']);
            
            a5Findings.forEach(f => {
                if (f.findingId) traceReportConsume(f.findingId, 'ARCHITECT_REPORT', 'architect.chokepoints');
            });
        } else {
            contentA5 += `Finding:\nNo verified finding emitted.\n\n`;
            contentA5 += `[View All Detailed Evidence](EVIDENCE_VIEWER.html#A5)\n`;
        }

        sections.push({
            title: "A5 — Structural Control Chokepoints",
            content: contentA5
        });

        return sections;
    }
}
