/**
 * SYNAPSE Analysis Graph Contract
 * =================================
 * 
 * 1. Selection Scope:
 *    - The specific nodes/clusters the user explicitly selected for analysis.
 *    - e.g., `src/platform`, `src/server`
 * 
 * 2. Analysis Graph Scope:
 *    - The expanded structural graph that the backend detectors actually observe.
 *    - Often larger than the Selection Scope (e.g., A5 Control Bridge calculates shortest paths traversing outside the selection).
 *    - Detectors MUST NOT artificially truncate this graph if the algorithm requires global context.
 * 
 * 3. Report Scope & Claims:
 *    - The report output that is presented to the user.
 *    - IMPORTANT: Report Claims MUST NOT exceed the Report Scope. 
 *    - If a detector (like A5) surfaces a node from outside the Selection Scope, the Interpretation Guide MUST explicitly explain that the finding is derived from the expanded Analysis Graph Scope, not just the user's initial selection.
 */

export type QuestionType =
    | "OBSERVATION"
    | "PATTERN_DETECTION"
    | "VALIDATION";

export type ReportId =
    | "ARCHITECT"
    | "EXECUTION"
    | "ONBOARDING"
    | "VIRTUAL_DEBUG";

export interface ReportQuestionContract {
    id: string;
    report: ReportId;
    type: QuestionType;
    question: string;
    vocabulary: string[];
    supportingPatterns: string[];
    allowedEvidence: string[];
    interpretationGuide?: string;
}

export const QUESTION_DICTIONARY: Record<string, ReportQuestionContract> = {
    "A1": {
        id: "A1",
        report: "ARCHITECT",
        type: "VALIDATION",
        question: "Where are the structurally central areas?",
        vocabulary: ["SYSTEM_CORE", "STRUCTURAL_CENTRALITY"],
        supportingPatterns: ["SYSTEM_CORE"],
        allowedEvidence: ["controlScore", "fanIn", "blastRadius"],
        interpretationGuide: "Higher controlScore indicates a higher structural centrality score for the component in the observed dependency graph."
    },
    "A2": {
        id: "A2",
        report: "ARCHITECT",
        type: "OBSERVATION",
        question: "Where do structural boundaries intersect?",
        vocabulary: ["MODULE_CONTACT_POINT", "CROSS_BOUNDARY_REFERENCE"],
        supportingPatterns: ["CROSS_BOUNDARY_REFERENCE"],
        allowedEvidence: ["source", "target", "dependencyCount"],
        interpretationGuide: "Contact points show where independent clusters couple. Higher dependencyCount indicates more observed structural references across the boundary."
    },
    "A3": {
        id: "A3",
        report: "ARCHITECT",
        type: "OBSERVATION",
        question: "Where are the observable structural boundaries?",
        vocabulary: ["BOUNDARY"],
        supportingPatterns: [
            "HIGH_ISOLATION_BOUNDARY",
            "BOUNDARY_CANDIDATE",
            "LOW_ISOLATION_BOUNDARY"
        ],
        allowedEvidence: [
            "size",
            "cohesion",
            "strength",
            "internalEdges",
            "externalEdges",
            "members",
            "crossBoundaryReferences"
        ],
        interpretationGuide: "Boundaries separate modules. Higher Isolation indicates a larger share of observed references stay inside the boundary; lower Isolation indicates a larger share cross it."
    },
    "A5": {
        id: "A5",
        report: "ARCHITECT",
        type: "VALIDATION",
        question: "Where are the structural control chokepoints?",
        vocabulary: ["CONTROL_BRIDGE"],
        supportingPatterns: ["CONTROL_BRIDGE"],
        allowedEvidence: ["clusterScore", "rawBetweennessSum", "topNodeContribution"],
        interpretationGuide: "Chokepoints are nodes on many observed shortest paths between clusters in the expanded Analysis Graph. They may exist outside your initial Selection Scope if they structurally control communication between your selected subsystems. Higher scores indicate more such paths pass through the node."
    },
    "E2": {
        id: "E2",
        report: "EXECUTION",
        type: "VALIDATION",
        question: "Where does a structural change show amplified propagation?",
        vocabulary: ["CHANGE_PROPAGATION"],
        supportingPatterns: ["CHANGE_AMPLIFIER"],
        allowedEvidence: ["complexityScore", "externalEdges"],
        interpretationGuide: "Higher complexityScore indicates denser internal and external connections relative to component size. Actual change propagation reach requires separate dynamic tracing."
    },
    "O2": {
        id: "O2",
        report: "ONBOARDING",
        type: "OBSERVATION",
        question: "Where are the observable dependency roots?",
        vocabulary: ["DEPENDENCY_ROOT"],
        supportingPatterns: ["DEPENDENCY_ROOT"],
        allowedEvidence: ["inDegree", "outDegree"],
        interpretationGuide: "Dependency roots are files with zero observed incoming dependency edges and at least one observed outgoing dependency edge in the analyzed graph."
    }
};
