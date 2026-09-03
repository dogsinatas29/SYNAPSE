export interface RecoveryImpact {
    ownerId: string;
    ownerType: 'NODE' | 'EDGE';
    
    /**
     * The ID of the evidence (e.g. RecoveryScenario id) that caused this impact.
     */
    evidenceId: string;

    /**
     * The IDs of the failure causes that should be removed by this impact.
     */
    causesToRemove: readonly string[];

    // targetState is intentionally omitted.
    // The RecoveryRuleEngine will ALWAYS map this to SimulationState.DIRTY.
}
