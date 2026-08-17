import { IRule, Finding } from './Rule';
import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';

export class RuleRegistry {
    private readonly rules = new Map<string, IRule>();
    private readonly disabledRules = new Set<string>();

    public register(rule: IRule): void {
        if (this.rules.has(rule.id)) {
            throw new Error(`Rule ${rule.id} is already registered.`);
        }
        this.rules.set(rule.id, rule);
    }

    public disableRule(id: string): void {
        if (!this.rules.has(id)) {
            throw new Error(`Cannot disable rule ${id}: Not found.`);
        }
        this.disabledRules.add(id);
    }

    public enableRule(id: string): void {
        this.disabledRules.delete(id);
    }

    public getRule(id: string): IRule | undefined {
        return this.rules.get(id);
    }

    public getAllRules(): IRule[] {
        return Array.from(this.rules.values());
    }

    public getActiveRules(): IRule[] {
        return this.getAllRules().filter(rule => !this.disabledRules.has(rule.id));
    }
}

export class RuleEngine {
    private readonly registry: RuleRegistry;

    constructor(registry: RuleRegistry) {
        this.registry = registry;
    }

    public execute(snapshot: ReasoningSnapshot): Finding[] {
        const allFindings: Finding[] = [];
        
        for (const rule of this.registry.getActiveRules()) {
            try {
                const findings = rule.evaluate(snapshot);
                allFindings.push(...findings);
            } catch (err) {
                console.error(`Error executing rule ${rule.id}:`, err);
                // Continue executing other rules even if one fails
            }
        }
        
        return allFindings;
    }
}
