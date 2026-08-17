import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { EvidenceCategory, IBlastRadiusEvidence } from '../../evidence/Evidence';

export class BlastRadiusRule implements IRule {
    public readonly id = 'rule-blast-radius';
    public readonly name = 'Blast Radius Rule';
    public readonly purpose = 'Calculates the severity of a node\'s removal based on its structural dependencies and role.';

    public evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const findings: Finding[] = [];
        
        const blastEvidence = snapshot.getAllEvidence().filter(
            (e): e is IBlastRadiusEvidence => e.category === EvidenceCategory.BLAST_RADIUS
        );

        for (const ev of blastEvidence) {
            const meta = ev.metadata;
            let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
            let explanation = '';

            // Rule Logic for Blast Radius Severity

            // CRITICAL:
            // Must be CORE AND one of: Boundary Crosser, Critical Pipeline Owner, Pipeline Payload Definition, or Extension Ecosystem Root
            const isCore = meta.criticality === 'CORE';
            const isBoundaryCrosser = meta.isBoundaryCrosser;
            const hasCriticalPipelines = meta.isPipelineOwner || meta.isPipelinePayloadDefinition;
            // Differentiate between minor abstraction (e.g. 2 impls) and ecosystem root (e.g. 5+ impls)
            const isExtensionEcosystem = meta.affectedExtensionPointCount >= 1 && meta.affectedExtensionImplementationCount >= 5;

            if (meta.criticality === 'UTILITY') {
                // UTILITY Hard Guard: Utilities are never structurally critical, regardless of fan-in
                severity = 'LOW';
                explanation = `LOW Impact: UTILITY nodes cause localized compile errors but no architectural logic shifts.`;
            } else if (isCore && (isBoundaryCrosser || hasCriticalPipelines || isExtensionEcosystem)) {
                severity = 'CRITICAL';
                explanation = `CRITICAL Impact: CORE node that causes pipeline collapse, severs primary communication, or shatters ecosystem.`;
            } else if (isExtensionEcosystem || isBoundaryCrosser) {
                // E.g. Cascading Contract Test: SUPPORTING but is Extension Ecosystem
                // E.g. Boundary Collapse Test: SUPPORTING but is Boundary Crosser
                severity = 'HIGH';
                explanation = `HIGH Impact: Disables major features across multiple boundaries or shatters plugin ecosystem.`;
            } else if (meta.criticality === 'SUPPORTING') {
                severity = 'MEDIUM';
                explanation = `MEDIUM Impact: Causes localized feature degradation within a single boundary.`;
            } else {
                severity = 'LOW';
                explanation = `LOW Impact: Causes localized compile errors but no architectural logic shifts.`;
            }

            findings.push({
                id: `f-blast-${meta.nodeId}`,
                type: 'BLAST_RADIUS',
                confidence: ev.metadata.confidence,
                evidenceIds: [ev.id],
                ruleId: this.id,
                summary: `Blast Radius for ${meta.nodeId} is ${severity}`,
                explanation: `[${severity}] ${explanation}`,
                targetType: 'NODE',
                targetIds: [meta.nodeId]
            });
        }

        return findings;
    }
}
