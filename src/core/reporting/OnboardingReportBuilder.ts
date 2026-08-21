import { ReportContext, OnboardingReport, ReportConfig } from '../../types/schema';

export class OnboardingReportBuilder {
    public build(context: ReportContext, config: ReportConfig): OnboardingReport {
        // Section 1: System Heart
        const blastSorted = [...context.failureReport.impacts].sort((a, b) => {
            if (b.impactedNodes.length !== a.impactedNodes.length) return b.impactedNodes.length - a.impactedNodes.length;
            return a.sourceNodeId.localeCompare(b.sourceNodeId);
        });
        const maxBlastIdx = Math.min(
            Math.floor(blastSorted.length * config.systemHeartPolicy.percentile),
            config.systemHeartPolicy.hardCap
        );
        const systemHeart = blastSorted.slice(0, Math.max(1, maxBlastIdx)).map(i => i.sourceNodeId);

        // Section 2: Core Assembly Points
        const maxAssemblyIdx = Math.min(
            Math.floor(context.assemblyNodes.length * config.assemblyPointPolicy.percentile),
            config.assemblyPointPolicy.hardCap
        );
        const coreAssemblyPoints = context.assemblyNodes.slice(0, Math.max(1, maxAssemblyIdx));
        
        // Section 3: Safe Exploration Zones
        const maxSafeBlastIdx = Math.min(
            Math.floor(blastSorted.length * config.safeExplorationPolicy.blastRadiusPercentile),
            blastSorted.length
        );
        const safeBlastNodes = new Set(blastSorted.slice(blastSorted.length - Math.max(1, maxSafeBlastIdx)).map(i => i.sourceNodeId));

        const authSorted = [...context.nodeStats].sort((a, b) => {
            if (a.authorityScore !== b.authorityScore) return a.authorityScore - b.authorityScore;
            return a.nodeId.localeCompare(b.nodeId);
        });
        const maxSafeAuthIdx = Math.min(
            Math.floor(authSorted.length * config.safeExplorationPolicy.authorityPercentile),
            authSorted.length
        );
        const safeAuthNodes = new Set(authSorted.slice(0, Math.max(1, maxSafeAuthIdx)).map(n => n.nodeId));

        const couplingSorted = [...context.nodeStats].sort((a, b) => {
            if (a.couplingScore !== b.couplingScore) return a.couplingScore - b.couplingScore;
            return a.nodeId.localeCompare(b.nodeId);
        });
        const maxSafeCouplingIdx = Math.min(
            Math.floor(couplingSorted.length * config.safeExplorationPolicy.couplingPercentile),
            couplingSorted.length
        );
        const safeCouplingNodes = new Set(couplingSorted.slice(0, Math.max(1, maxSafeCouplingIdx)).map(n => n.nodeId));

        const safeExplorationZones = context.nodeStats
            .filter(n => safeBlastNodes.has(n.nodeId) && safeAuthNodes.has(n.nodeId) && safeCouplingNodes.has(n.nodeId))
            .map(n => n.nodeId)
            .slice(0, config.safeExplorationPolicy.hardCap);

        // Section 4: Architecture Landmarks
        const maxAuthIdx = Math.min(
            Math.floor(context.authorityNodes.length * config.authorityCenterPolicy.percentile),
            config.authorityCenterPolicy.hardCap
        );
        const authorityCenters = context.authorityNodes.slice(0, Math.max(1, maxAuthIdx));

        const architectureLandmarks = {
            systemHeart: [...systemHeart],
            coreAssembly: [...coreAssemblyPoints],
            authorityCenters: [...authorityCenters],
            peripheralZones: safeExplorationZones
        };

        // Section 5: Do Not Touch
        const doNotTouch = systemHeart; // Using systemHeart as high blast representatives

        return {
            systemHeart,
            coreAssemblyPoints,
            safeExplorationZones,
            architectureLandmarks,
            doNotTouch
        };
    }
}
