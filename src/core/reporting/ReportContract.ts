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
        interpretationGuide: "High controlScore indicates components that are heavily depended upon and possess large potential blast radius."
    },
    "A2": {
        id: "A2",
        report: "ARCHITECT",
        type: "OBSERVATION",
        question: "Where do structural boundaries intersect?",
        vocabulary: ["MODULE_CONTACT_POINT", "CROSS_BOUNDARY_REFERENCE"],
        supportingPatterns: ["CROSS_BOUNDARY_REFERENCE"],
        allowedEvidence: ["source", "target", "dependencyCount"],
        interpretationGuide: "Contact points show where independent clusters couple. High dependencyCount implies a tight API or potential architectural leakage."
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
            "members",
            "crossBoundaryReferences"
        ],
        interpretationGuide: "Boundaries separate modules. High Isolation indicates tight internal cohesion, while Low Isolation indicates heavy external coupling."
    },
    "A5": {
        id: "A5",
        report: "ARCHITECT",
        type: "VALIDATION",
        question: "Where are the structural control chokepoints?",
        vocabulary: ["CONTROL_BRIDGE"],
        supportingPatterns: ["ARCHITECTURAL_CHOKEPOINT"],
        allowedEvidence: ["clusterScore", "rawBetweennessSum", "topNodeContribution"],
        interpretationGuide: "Chokepoints act as obligatory transit bridges between otherwise independent modules. High scores imply critical routing bottlenecks."
    },
    "E2": {
        id: "E2",
        report: "EXECUTION",
        type: "VALIDATION",
        question: "Where does a structural change show amplified propagation?",
        vocabulary: ["CHANGE_PROPAGATION"],
        supportingPatterns: ["CHANGE_AMPLIFIER"],
        allowedEvidence: ["blastRadius", "propagationReach"],
        interpretationGuide: "High propagationReach indicates that a small modification here may force extensive cascading updates downstream."
    },
    "O2": {
        id: "O2",
        report: "ONBOARDING",
        type: "OBSERVATION",
        question: "Where are the observable dependency roots?",
        vocabulary: ["DEPENDENCY_ROOT"],
        supportingPatterns: ["DEPENDENCY_ROOT"],
        allowedEvidence: ["inDegree", "outDegree"],
        interpretationGuide: "Dependency Roots are files that act as absolute structural origins in the dependency graph, importing other modules while never being imported themselves."
    }
};
