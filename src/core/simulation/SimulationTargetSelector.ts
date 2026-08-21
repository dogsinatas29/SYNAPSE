import { FailurePropagationReport, SimulationTargetPolicy, TargetPolicyType } from '../../types/schema';

export class SimulationTargetSelector {
    /**
     * 정책에 따라 시뮬레이션을 수행할 타겟 노드들을 추출한다.
     */
    static getTopImpactNodes(report: FailurePropagationReport, policy: SimulationTargetPolicy): string[] {
        if (!report || !report.impacts || report.impacts.length === 0) return [];

        // Direct, Indirect, Cascade 합산치를 기준으로 정렬
        const sortedImpacts = [...report.impacts].sort((a, b) => {
            const totalA = a.directImpact + a.indirectImpact + a.cascadeImpact;
            const totalB = b.directImpact + b.indirectImpact + b.cascadeImpact;
            return totalB - totalA; // 내림차순
        });

        if (policy.type === TargetPolicyType.TOP_N) {
            const count = Math.min(policy.value, policy.hardCap);
            return sortedImpacts.slice(0, count).map(i => i.sourceNodeId);
        } else if (policy.type === TargetPolicyType.TOP_PERCENT) {
            // value is e.g. 0.05 for 5%
            const count = Math.min(Math.max(1, Math.floor(report.totalNodes * policy.value)), policy.hardCap);
            return sortedImpacts.slice(0, count).map(i => i.sourceNodeId);
        } else if (policy.type === TargetPolicyType.ABOVE_THRESHOLD) {
            return sortedImpacts.filter(i => {
                const total = i.directImpact + i.indirectImpact + i.cascadeImpact;
                return total >= policy.value;
            }).map(i => i.sourceNodeId);
        }

        return [];
    }
}
