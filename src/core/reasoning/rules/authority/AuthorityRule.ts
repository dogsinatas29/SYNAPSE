import { IRule, Finding } from '../Rule';
import { ReasoningSnapshot } from '../../snapshot/ReasoningSnapshot';
import { 
    EvidenceCategory, 
    IRoleDensityEvidence, 
    IDependencyEvidence, 
    IReachabilityEvidence 
} from '../../evidence/Evidence';

export interface AuthorityContribution {
    source: string;
    points: number; // For additive components
    multiplier?: number; // For multiplicative components
    evidenceId: string;
}

export class AuthorityRule implements IRule {
    id = 'R-101';
    name = 'Authority Classification';
    purpose = 'Identifies candidates for system dominance based on role density, dependency, and reachability';

    evaluate(snapshot: ReasoningSnapshot): Finding[] {
        const densityEv = snapshot.getEvidenceByCategory<IRoleDensityEvidence>(EvidenceCategory.ROLE_DENSITY);
        const depEv = snapshot.getEvidenceByCategory<IDependencyEvidence>(EvidenceCategory.DEPENDENCY);
        const reachEv = snapshot.getEvidenceByCategory<IReachabilityEvidence>(EvidenceCategory.REACHABILITY);

        const nodes = new Set([...densityEv, ...depEv, ...reachEv].map(e => e.nodeId));
        const findings: Finding[] = [];

        for (const nodeId of nodes) {
            const contributors: AuthorityContribution[] = [];
            const evidenceIds: string[] = [];

            const density = densityEv.find(e => e.nodeId === nodeId);
            const dep = depEv.find(e => e.nodeId === nodeId);
            const reach = reachEv.find(e => e.nodeId === nodeId);

            let roleScore = 0;
            if (density && density.metadata.roleCount > 0) {
                // Base points from roles
                roleScore = density.metadata.roleCount * 20;
                contributors.push({ 
                    source: `Role Density (${density.metadata.roles.join(', ')})`, 
                    points: roleScore, 
                    evidenceId: density.id 
                });
                evidenceIds.push(density.id);
            }

            let influenceMultiplier = 1.0;
            
            if (dep && dep.metadata.inboundDependencyCount > 0) {
                // Logarithmic or capped scaling for dependencies to prevent UtilityHub inflation
                // 10 deps = ~2x, 100 deps = ~3x, 500 deps = ~3.7x
                const depMult = 1.0 + Math.log10(dep.metadata.inboundDependencyCount + 1);
                influenceMultiplier *= depMult;
                contributors.push({ 
                    source: `Inbound Dependency Centrality (count: ${dep.metadata.inboundDependencyCount})`, 
                    points: 0,
                    multiplier: parseFloat(depMult.toFixed(2)),
                    evidenceId: dep.id 
                });
                evidenceIds.push(dep.id);
            }

            if (reach && (reach.metadata.mutationReach > 0 || reach.metadata.decisionReach > 0)) {
                const reachSum = reach.metadata.mutationReach + reach.metadata.decisionReach;
                // N-hop reach scales the influence
                const reachMult = 1.0 + Math.log10(reachSum + 1);
                influenceMultiplier *= reachMult;
                contributors.push({ 
                    source: `System Reachability (N-hop reach: ${reachSum})`, 
                    points: 0,
                    multiplier: parseFloat(reachMult.toFixed(2)), 
                    evidenceId: reach.id 
                });
                evidenceIds.push(reach.id);
            }

            // The Core Equation: Authority = Role * Influence
            // If Role is 0 (Utility Library), Score is 0.
            // If Role is 3 but Influence is 1 (Tiny Manager), Score is 60 (Major). Wait, 3*20 = 60. Let's adjust thresholds.
            const score = Math.round(roleScore * influenceMultiplier);

            if (score >= 40) {
                let type = 'AUTHORITY_CANDIDATE';
                if (score >= 80) type = 'DOMINANT_AUTHORITY';
                else if (score >= 60) type = 'MAJOR_AUTHORITY';

                const explanation = `Authority Score: ${score}\n\nContributors:\n` + 
                    contributors.map(c => c.multiplier ? `x${c.multiplier} ${c.source}` : `+${c.points} ${c.source}`).join('\n');

                findings.push({
                    id: `f-${this.id}-${nodeId}`,
                    type,
                    confidence: Math.min(score / 100, 1.0),
                    evidenceIds,
                    ruleId: this.id,
                    targetType: 'NODE',
                    targetIds: [nodeId],
                    summary: `Node ${nodeId} is classified as ${type}`,
                    explanation
                });
            }
        }

        return findings;
    }
}
