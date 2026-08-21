import { ExecutiveReport, ScenarioComparison } from '../../types/schema';

/**
 * v0.3.34.30 - Pure Diff Projection for Scenario Comparison
 * Calculates numerical and categorical diffs dynamically without storing delta states.
 * No interpretation or risk evaluation occurs here.
 */
export class ExecutiveReportDiffBuilder {
    
    public static createComparison(baseline: ExecutiveReport, scenario: ExecutiveReport): ScenarioComparison {
        return {
            baselineReport: baseline,
            scenarioReport: scenario
        };
    }

    public static getBlastRadiusDelta(comparison: ScenarioComparison) {
        const base = comparison.baselineReport.blastRadiusDashboard;
        const scen = comparison.scenarioReport.blastRadiusDashboard;
        
        return {
            highRiskDelta: scen.highRiskCount - base.highRiskCount,
            mediumRiskDelta: scen.mediumRiskCount - base.mediumRiskCount,
            lowRiskDelta: scen.lowRiskCount - base.lowRiskCount
        };
    }

    public static getAuthorityConcentrationDelta(comparison: ScenarioComparison) {
        const base = comparison.baselineReport.authorityConcentration;
        const scen = comparison.scenarioReport.authorityConcentration;
        
        return {
            coverPercentDelta: parseFloat((scen.topNodesCoverPercent - base.topNodesCoverPercent).toFixed(2))
        };
    }

    public static getSystemSnapshotDelta(comparison: ScenarioComparison) {
        const base = comparison.baselineReport.systemSnapshot;
        const scen = comparison.scenarioReport.systemSnapshot;

        return {
            nodesDelta: scen.totalNodes - base.totalNodes,
            edgesDelta: scen.totalEdges - base.totalEdges,
            clustersDelta: scen.totalClusters - base.totalClusters,
            assemblyPointsDelta: scen.assemblyPoints - base.assemblyPoints,
            authorityNodesDelta: scen.authorityNodes - base.authorityNodes
        };
    }
}
