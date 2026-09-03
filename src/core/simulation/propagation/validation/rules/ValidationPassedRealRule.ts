import { ValidationRule } from '../ValidationRule';
import { ValidationScenario } from '../../../scenario/ValidationScenario';
import { ValidationImpact } from '../ValidationImpact';
import { ValidationEventType } from '../../../scenario/ValidationEventType';

export class ValidationPassedRealRule implements ValidationRule {
    matches(scenario: ValidationScenario): boolean {
        return scenario.type === ValidationEventType.VALIDATION_PASSED;
    }

    evaluate(scenario: ValidationScenario): readonly ValidationImpact[] {
        // Validation scenarios specifically target an owner
        return [{
            ownerId: scenario.targetId,
            ownerType: scenario.targetType,
            evidenceId: scenario.id
        }];
    }
}
