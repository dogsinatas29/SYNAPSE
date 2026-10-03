import { ExecutiveInsight, ReportSection } from '../../types/schema';

export class ExecutiveReportBuilder {
    public build(insight: ExecutiveInsight): ReportSection[] {
        // Executive Report will rely entirely on pattern findings and sub-report insights (A1, A3, A5, E2, O2)
        // All legacy heuristic narratives (Architecture Health, Frontier, Business Impact, Action) are removed.
        return [];
    }
}
