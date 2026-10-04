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
}

export const QUESTION_DICTIONARY: Record<string, ReportQuestionContract> = {
    "A1": {
        id: "A1",
        report: "ARCHITECT",
        type: "VALIDATION",
        question: "Where are the structurally central areas?",
        vocabulary: ["SYSTEM_CORE", "STRUCTURAL_CENTRALITY"],
        supportingPatterns: ["SYSTEM_CORE"],
        allowedEvidence: ["controlScore", "fanIn", "blastRadius"]
    },
    "A3": {
        id: "A3",
        report: "ARCHITECT",
        type: "OBSERVATION",
        question: "Where are the observable structural boundaries?",
        vocabulary: ["BOUNDARY"],
        supportingPatterns: [
            "BOUNDARY_FORTRESS",
            "BOUNDARY_CANDIDATE",
            "WEAK_BOUNDARY"
        ],
        allowedEvidence: [
            "size",
            "cohesion",
            "members",
            "crossBoundaryReferences"
        ]
    },
    "A5": {
        id: "A5",
        report: "ARCHITECT",
        type: "VALIDATION",
        question: "Where are the structural control chokepoints?",
        vocabulary: ["CONTROL_BRIDGE"],
        supportingPatterns: ["ARCHITECTURAL_CHOKEPOINT"],
        allowedEvidence: ["clusterScore", "rawBetweennessSum", "topNodeContribution"]
    },
    "E2": {
        id: "E2",
        report: "EXECUTION",
        type: "VALIDATION",
        question: "Where does a structural change show amplified propagation?",
        vocabulary: ["CHANGE_PROPAGATION"],
        supportingPatterns: ["CHANGE_AMPLIFIER"],
        allowedEvidence: ["blastRadius", "propagationReach"]
    },
    "O2": {
        id: "O2",
        report: "ONBOARDING",
        type: "OBSERVATION",
        question: "Where can a newcomer begin examining the system structure?",
        vocabulary: ["ROOT_ENTRY_POINT"],
        supportingPatterns: ["ROOT_ENTRY_POINT"],
        allowedEvidence: ["inDegree", "outDegree"]
    }
};
