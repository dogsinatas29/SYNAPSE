import { ValidationScenario } from '../../scenario/ValidationScenario';
import { ValidationImpact } from './ValidationImpact';

export interface ValidationRule {
    matches(scenario: ValidationScenario): boolean;
    evaluate(scenario: ValidationScenario): readonly ValidationImpact[];
}
