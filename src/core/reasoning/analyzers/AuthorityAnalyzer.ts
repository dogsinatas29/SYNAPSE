// DELETED IN PHASE 13.1
// This file is intentionally left blank. 
// "Authority Engine" has been replaced by "Signal Discovery Engine".

import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';

// Legacy type export for backward compatibility
export interface AuthorityFinding {
    nodeId: string;
    signals: Array<{
        type: string;
        description: string;
        evidenceReferences: string[];
    }>;
}

/**
 * Legacy AuthorityAnalyzer - Deprecated
 * Returns empty findings. Authority analysis has been replaced by Signal Discovery Engine.
 */
export class AuthorityAnalyzer {
    public analyze(_evidences: ArchitecturalEvidence[]): AuthorityFinding[] {
        // Deprecated: Authority Engine removed in Phase 13.1
        return [];
    }
}
