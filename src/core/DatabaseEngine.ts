import * as vscode from 'vscode';

export interface BillingMeta {
    isPro: boolean;
    dailySessions: number;
    lastActiveDate: string;
    totalExports: number;
}

/**
 * Mocking SQLite functionality using VS Code Extension globalState
 * Provides Traceability and Executive Summaries
 */
export class DatabaseEngine {
    private static instance: DatabaseEngine;
    private context: vscode.ExtensionContext;

    private readonly KEY_MANAGED_NODES = 'synapse.db.managedNodes';
    private readonly KEY_BILLING_META = 'synapse.db.billingMeta';
    private readonly KEY_TRACE_LOGS = 'synapse.db.traceLogs';

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;

        // Initialize Default Schema if undefined
        if (!this.context.globalState.get(this.KEY_BILLING_META)) {
            this.updateBillingMeta({
                isPro: false,
                dailySessions: 0,
                lastActiveDate: '',
                totalExports: 0
            });
        }

        if (!this.context.globalState.get(this.KEY_MANAGED_NODES)) {
            this.updateManagedNodes([]);
        }

        if (!this.context.globalState.get(this.KEY_TRACE_LOGS)) {
            this.context.globalState.update(this.KEY_TRACE_LOGS, []);
        }
    }

    public static getInstance(context: vscode.ExtensionContext): DatabaseEngine {
        if (!DatabaseEngine.instance) {
            DatabaseEngine.instance = new DatabaseEngine(context);
        }
        return DatabaseEngine.instance;
    }

    // --- Billing / State Schema ---
    public getBillingMeta(): BillingMeta {
        return this.context.globalState.get<BillingMeta>(this.KEY_BILLING_META) as BillingMeta;
    }

    public updateBillingMeta(meta: BillingMeta): void {
        this.context.globalState.update(this.KEY_BILLING_META, meta);
    }

    public getManagedNodes(): string[] {
        return this.context.globalState.get<string[]>(this.KEY_MANAGED_NODES) || [];
    }

    public updateManagedNodes(nodes: string[]): void {
        this.context.globalState.update(this.KEY_MANAGED_NODES, nodes);
    }

    // --- Traceability ---
    public logTrace(fromId: string, toId: string, payloadType: string): void {
        const logs = this.context.globalState.get<any[]>(this.KEY_TRACE_LOGS) || [];
        logs.push({
            timestamp: new Date().toISOString(),
            fromId,
            toId,
            payloadType
        });

        // Keep only last 1000 logs to prevent memory leak in globalState
        if (logs.length > 1000) logs.shift();

        this.context.globalState.update(this.KEY_TRACE_LOGS, logs);
    }

    public getTraceabilityReport(): any[] {
        return this.context.globalState.get<any[]>(this.KEY_TRACE_LOGS) || [];
    }

    // --- Reporting ---
    public generateExecutiveSummary(currentProjectName: string, activeNodesCount: number, activeEdgesCount: number): string {
        const meta = this.getBillingMeta();
        const managed = this.getManagedNodes();
        const isKo = vscode.env.language.startsWith('ko');

        let report = isKo 
            ? `### 🏢 SYNAPSE 경영진 요약 보고서 - ${currentProjectName}\n\n`
            : `### 🏢 SYNAPSE Executive Summary - ${currentProjectName}\n\n`;

        report += isKo 
            ? `- **보고서 생성일시:** ${new Date().toLocaleString()}\n`
            : `- **Report Generated:** ${new Date().toLocaleString()}\n`;

        report += isKo 
            ? `- **프로젝트 복잡도:** 활성 노드 ${activeNodesCount}개 / 연결선 ${activeEdgesCount}개\n`
            : `- **Project Complexity:** ${activeNodesCount} Active Nodes / ${activeEdgesCount} Connections\n`;

        report += isKo 
            ? `- **총 관리 대상 노드 (누적):** ${managed.length}개\n`
            : `- **Total Managed Entities (All Time):** ${managed.length}\n`;

        report += isKo 
            ? `- **라이선스 상태:** ${meta.isPro ? 'PRO (무제한)' : 'FREE'}\n`
            : `- **License Status:** ${meta.isPro ? 'PRO (Unlimited)' : 'FREE'}\n`;

        report += isKo 
            ? `- **오늘 세션 사용량:** ${meta.dailySessions}회\n\n`
            : `- **Today's Session Usage:** ${meta.dailySessions}\n\n`;

        report += isKo ? `#### 추적 가능성 요약 (Traceability)\n` : `#### Traceability Highlights\n`;
        const traces = this.getTraceabilityReport();
        const recentTraces = traces.slice(-5).reverse();

        if (recentTraces.length === 0) {
            report += isKo ? `최근 추적된 데이터 흐름이 없습니다.\n` : `No recent data flow traced.\n`;
        } else {
            recentTraces.forEach((t: any) => {
                report += `- [${t.timestamp}] \`${t.fromId}\` -> \`${t.toId}\` (${t.payloadType})\n`;
            });
        }

        return report;
    }
}
