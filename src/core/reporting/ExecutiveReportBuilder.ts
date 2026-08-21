import { ReportContext, ExecutiveReport, ReportConfig } from '../../types/schema';

export class ExecutiveReportBuilder {
    public build(context: ReportContext, config: ReportConfig): ExecutiveReport {
        // Section 1: System Snapshot
        const systemSnapshot = {
            totalNodes: context.systemStats.totalNodes,
            totalEdges: context.systemStats.totalEdges,
            totalClusters: context.systemStats.totalClusters,
            assemblyPoints: context.assemblyNodes.length,
            authorityNodes: context.authorityNodes.length
        };

        const sortedByBlast = [...context.failureReport.impacts].sort((a, b) => {
            if (b.impactedNodes.length !== a.impactedNodes.length) return b.impactedNodes.length - a.impactedNodes.length;
            return a.sourceNodeId.localeCompare(b.sourceNodeId);
        });
        const topRisksCount = Math.min(
            Math.floor(sortedByBlast.length * config.systemHeartPolicy.percentile),
            config.systemHeartPolicy.hardCap
        );
        const topRisks = sortedByBlast.slice(0, Math.max(1, topRisksCount)).map(i => i.sourceNodeId);

        // Section 3: Blast Radius Dashboard
        const totalNodes = context.failureReport.totalNodes || context.systemStats.totalNodes || 1;
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;
        
        for (const impact of context.failureReport.impacts) {
            const ratio = impact.impactedNodes.length / totalNodes;
            if (ratio >= config.blastRadiusRiskPolicy.highRiskPercent) highRiskCount++;
            else if (ratio >= config.blastRadiusRiskPolicy.mediumRiskPercent) mediumRiskCount++;
            else lowRiskCount++;
        }
        
        const blastRadiusDashboard = {
            highRiskCount,
            mediumRiskCount,
            lowRiskCount
        };

        // Section 4: Authority Concentration
        const totalAuthority = context.nodeStats.reduce((sum, n) => sum + n.authorityScore, 0) || 1;
        const topAuthCount = Math.min(
            Math.floor(context.nodeStats.length * config.authorityCenterPolicy.percentile),
            config.authorityCenterPolicy.hardCap
        );
        const topAuth = [...context.nodeStats].sort((a, b) => {
            if (b.authorityScore !== a.authorityScore) return b.authorityScore - a.authorityScore;
            return a.nodeId.localeCompare(b.nodeId);
        }).slice(0, Math.max(1, topAuthCount));
        const topAuthSum = topAuth.reduce((sum, n) => sum + n.authorityScore, 0);
        
        const authorityConcentration = {
            topNodesCoverPercent: parseFloat(((topAuthSum / totalAuthority) * 100).toFixed(2)),
            topNodes: topAuth.map(n => n.nodeId)
        };

        // Section 5: Refactoring Candidates
        // Pure projection: Use pre-computed cohesionScore from context
        const refactoringCount = Math.min(
            Math.floor(context.nodeStats.length * config.refactoringCandidatePolicy.percentile),
            config.refactoringCandidatePolicy.hardCap
        );
        const refactoringCandidates = [...context.nodeStats]
            .sort((a, b) => {
                if (a.cohesionScore !== b.cohesionScore) return a.cohesionScore - b.cohesionScore; // Low cohesion
                return a.nodeId.localeCompare(b.nodeId);
            })
            .slice(0, Math.max(1, refactoringCount))
            .map(n => n.nodeId);

        // Section 6: Team Scaling Risks (Authority concentration points without predictive guessing)
        const scalingRiskCount = Math.min(
            Math.floor(context.nodeStats.length * config.teamScalingPolicy.percentile),
            config.teamScalingPolicy.hardCap
        );
        const teamScalingRisks = topAuth.slice(0, Math.max(1, scalingRiskCount)).map(n => n.nodeId);

        return {
            systemSnapshot,
            topRisks,
            blastRadiusDashboard,
            authorityConcentration,
            refactoringCandidates,
            teamScalingRisks
        };
    }
}
