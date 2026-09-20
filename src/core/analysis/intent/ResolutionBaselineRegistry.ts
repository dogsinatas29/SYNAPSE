export interface ResolutionProfile {
    observed: {
        direct: { ratio: number; avgCandidates: number };
        broadcast: { ratio: number; avgCandidates: number };
        basename: { ratio: number; avgCandidates: number };
        symbol_index: { ratio: number; avgCandidates: number };
        unresolved: { ratio: number; avgCandidates: number };
    };
}

/**
 * Stage 1: Resolution Observatory Dictionary (Read-Only)
 * This registry stores empirical baseline facts gathered from the 9-project metrology audit.
 * It strictly logs "Usage Statistics" (dominance), NOT "Accuracy Statistics" (correctness).
 * It acts as an observational reference point for deviation warnings, and does NOT alter resolver logic.
 */
export const ResolutionBaselineRegistry: Map<string, ResolutionProfile> = new Map([
    // --- Go (Kubernetes / etcd baseline) ---
    // Dominance: Broadcast
    ['go:PACKAGE_IMPORT', {
        observed: {
            direct: { ratio: 0.0006, avgCandidates: 1.0 },
            broadcast: { ratio: 0.9388, avgCandidates: 20.53 }, // Massive Fan-out observed
            basename: { ratio: 0.0014, avgCandidates: 1.0 },
            symbol_index: { ratio: 0.0000, avgCandidates: 1.0 },
            unresolved: { ratio: 0.0592, avgCandidates: 1.0 }
        }
    }],

    // --- TypeScript (VSCode baseline) ---
    // Dominance: Basename (Highly deterministic)
    ['ts:IMPORT', {
        observed: {
            direct: { ratio: 0.0035, avgCandidates: 1.0 },
            broadcast: { ratio: 0.0000, avgCandidates: 1.0 },
            basename: { ratio: 0.9346, avgCandidates: 1.0 },
            symbol_index: { ratio: 0.0321, avgCandidates: 1.0 },
            unresolved: { ratio: 0.0298, avgCandidates: 1.0 }
        }
    }],

    // --- C/C++ (Godot / Postgres baseline) ---
    // Dominance: Symbol Index & Unresolved
    ['cpp:INCLUDE', {
        observed: {
            direct: { ratio: 0.1164, avgCandidates: 1.0 },
            broadcast: { ratio: 0.0000, avgCandidates: 1.0 },
            basename: { ratio: 0.0039, avgCandidates: 1.0 },
            symbol_index: { ratio: 0.6980, avgCandidates: 1.0 },
            unresolved: { ratio: 0.1817, avgCandidates: 1.0 }
        }
    }],
    ['c:INCLUDE', {
        observed: {
            direct: { ratio: 0.0000, avgCandidates: 1.0 },
            broadcast: { ratio: 0.0000, avgCandidates: 1.0 },
            basename: { ratio: 0.0002, avgCandidates: 1.0 },
            symbol_index: { ratio: 0.4714, avgCandidates: 1.0 },
            unresolved: { ratio: 0.5284, avgCandidates: 1.0 }
        }
    }],

    // --- Rust (RustDesk baseline) ---
    // Dominance: Unresolved (Standard library flooding)
    ['rust:USE', {
        observed: {
            direct: { ratio: 0.0068, avgCandidates: 1.0 },
            broadcast: { ratio: 0.0000, avgCandidates: 1.0 },
            basename: { ratio: 0.2148, avgCandidates: 1.0 },
            symbol_index: { ratio: 0.0904, avgCandidates: 1.0 },
            unresolved: { ratio: 0.6880, avgCandidates: 1.0 }
        }
    }],

    // --- Java (AntennaPod baseline) ---
    // Dominance: Unresolved (Standard library flooding)
    ['java:IMPORT', {
        observed: {
            direct: { ratio: 0.0000, avgCandidates: 1.0 },
            broadcast: { ratio: 0.0000, avgCandidates: 1.0 },
            basename: { ratio: 0.1109, avgCandidates: 1.0 },
            symbol_index: { ratio: 0.0035, avgCandidates: 1.0 },
            unresolved: { ratio: 0.8856, avgCandidates: 1.0 }
        }
    }],

    // --- Kotlin (nowinandroid baseline) ---
    // Dominance: Unresolved
    ['kt:IMPORT', {
        observed: {
            direct: { ratio: 0.0119, avgCandidates: 1.0 },
            broadcast: { ratio: 0.0000, avgCandidates: 1.0 },
            basename: { ratio: 0.0417, avgCandidates: 1.0 },
            symbol_index: { ratio: 0.1458, avgCandidates: 1.0 },
            unresolved: { ratio: 0.8006, avgCandidates: 1.0 }
        }
    }]
]);
