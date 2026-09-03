export enum SimulationEvidenceType {
    STRUCTURAL = 'STRUCTURAL', // Node added/removed, Edge changed
    BEHAVIORAL = 'BEHAVIORAL', // API changed, Signature changed
    CONTROL = 'CONTROL',       // Authority node changed
    STATE = 'STATE',           // State-related evidence (NOT transition logic)
    POLICY = 'POLICY'          // Contract broken, Rule violation
}
