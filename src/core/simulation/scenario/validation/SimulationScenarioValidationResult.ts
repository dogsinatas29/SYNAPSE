export enum ValidationStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    UNSUPPORTED = 'UNSUPPORTED'
}

export interface SimulationScenarioValidationResult {
    status: ValidationStatus;
    reason?: string;
}
