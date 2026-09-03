import { SimulationScenario } from './SimulationScenario';
import { SimulationSnapshot } from '../SimulationSnapshot';
import { SimulationScenarioValidator } from './SimulationScenarioValidator';

export class SimulationScenarioRegistry {
    private readonly _scenarios: SimulationScenario[] = [];

    /**
     * Validates and registers a scenario.
     * Note: This does NOT execute the scenario, it only queues it for future evaluation.
     */
    public register(snapshot: SimulationSnapshot, scenario: SimulationScenario): void {
        // Prevent duplicate registration by ID
        if (this._scenarios.some(s => s.id === scenario.id)) {
            throw new Error(`Scenario with ID '${scenario.id}' is already registered.`);
        }

        // Validation ensures the scenario is structurally correct and logically feasible.
        const result = SimulationScenarioValidator.validate(snapshot, scenario);
        if (result.status !== 'VALID') {
            throw new Error(`Scenario Validation Failed [${result.status}]: ${result.reason || 'Unknown reason'}`);
        }

        // Ensure the scenario itself is completely immutable (Deep Freeze)
        const frozenScenario: SimulationScenario = {
            id: scenario.id,
            type: scenario.type,
            targetId: scenario.targetId,
            metadata: scenario.metadata ? JSON.parse(JSON.stringify(scenario.metadata)) : undefined
        };

        this.deepFreeze(frozenScenario);
        this._scenarios.push(frozenScenario);
    }

    private deepFreeze(object: any): void {
        const propNames = Object.getOwnPropertyNames(object);
        for (const name of propNames) {
            const value = object[name];
            if (value && typeof value === 'object') {
                this.deepFreeze(value);
            }
        }
        Object.freeze(object);
    }

    /**
     * Retrieves all registered scenarios.
     */
    public getRegisteredScenarios(): ReadonlyArray<SimulationScenario> {
        return this._scenarios;
    }
}
