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

        let report = `### 🏢 SYNAPSE Executive Summary - ${currentProjectName}\n\n`;
        report += `- **Report Generated:** ${new Date().toLocaleString()}\n`;
        report += `- **Project Complexity:** ${activeNodesCount} Active Nodes / ${activeEdgesCount} Connections\n`;
        report += `- **Total Managed Entities (All Time):** ${managed.length}\n`;
        report += `- **License Status:** ${meta.isPro ? 'PRO (Unlimited)' : 'FREE'}\n`;
        report += `- **Today's Session Usage:** ${meta.dailySessions}\n\n`;

        report += `#### Traceability Highlights\n`;
        const traces = this.getTraceabilityReport();
        const recentTraces = traces.slice(-5).reverse();

        if (recentTraces.length === 0) {
            report += `No recent data flow traced.\n`;
        } else {
            recentTraces.forEach((t: any) => {
                report += `- [${t.timestamp}] \`${t.fromId}\` -> \`${t.toId}\` (${t.payloadType})\n`;
            });
        }

        return report;
    }
}
