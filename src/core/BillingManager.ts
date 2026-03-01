import * as vscode from 'vscode';
import { DatabaseEngine } from './DatabaseEngine';

export class BillingManager {
    private static instance: BillingManager;
    private db: DatabaseEngine;

    // Configurable thresholds for monetization
    private readonly FREE_NODE_LIMIT = 5000; // Increased for development
    private readonly FREE_DAILY_SESSIONS = 1000; // Increased for development

    private constructor(context: vscode.ExtensionContext) {
        this.db = DatabaseEngine.getInstance(context);

        // [v0.2.16-dev] Force Pro mode for this engineering build to avoid blocking debugging
        const meta = this.db.getBillingMeta();
        if (!meta.isPro) {
            meta.isPro = true;
            this.db.updateBillingMeta(meta);
            console.log('[SYNAPSE] Dev build: Force enabling Pro mode.');
        }
    }

    public static initialize(context: vscode.ExtensionContext): BillingManager {
        if (!BillingManager.instance) {
            BillingManager.instance = new BillingManager(context);
        }
        return BillingManager.instance;
    }

    public static getInstance(): BillingManager {
        if (!BillingManager.instance) {
            throw new Error("BillingManager must be initialized with ExtensionContext first.");
        }
        return BillingManager.instance;
    }

    /**
     * Track a new active session
     */
    public trackSessionStart(): void {
        const today = new Date().toISOString().split('T')[0];
        const meta = this.db.getBillingMeta();

        if (meta.lastActiveDate !== today) {
            meta.dailySessions = 1;
            meta.lastActiveDate = today;
        } else {
            meta.dailySessions += 1;
        }

        this.db.updateBillingMeta(meta);

        // [v0.2.16 Monetization Lock] 
        /*
        if (meta.dailySessions > this.FREE_DAILY_SESSIONS && !meta.isPro) {
            vscode.window.showWarningMessage(`[SYNAPSE] You have exceeded the free daily session limit (${this.FREE_DAILY_SESSIONS}). Please consider upgrading to PRO.`);
        }
        */
    }

    /**
     * Validates node limits and tracks uniquely managed nodes
     * @param nodeIds Currently active nodes in the project
     */
    public validateNodeUsage(nodeIds: string[]): boolean {
        const meta = this.db.getBillingMeta();
        if (meta.isPro) return true; // Pro users have no limits

        // Count unique nodes ever processed
        const existingNodes = this.db.getManagedNodes();
        let newNodesCount = 0;

        for (const id of nodeIds) {
            if (!existingNodes.includes(id)) {
                existingNodes.push(id);
                newNodesCount++;
            }
        }

        if (newNodesCount > 0) {
            this.db.updateManagedNodes(existingNodes);
        }

        /* 
        // [v0.2.16 Monetization Lock] Node limit check is disabled for testing/dev
        if (existingNodes.length > this.FREE_NODE_LIMIT) {
            vscode.window.showErrorMessage(`[SYNAPSE] Free plan node limit reached (${this.FREE_NODE_LIMIT} nodes). You are currently tracking ${existingNodes.length} nodes. Upgrade to PRO to view more logic.`);
            return false;
        }
        */

        return true;
    }

    public upgradeToPro(): void {
        const meta = this.db.getBillingMeta();
        meta.isPro = true;
        this.db.updateBillingMeta(meta);
        vscode.window.showInformationMessage('🎉 Welcome to SYNAPSE Pro! All limits removed.');
    }
}
