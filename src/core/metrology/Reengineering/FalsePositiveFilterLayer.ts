export interface EdgeCandidate {
  id: string;
  sourceNode: string;
  targetNode: string;
  extractorId: string;
  confidence: number;
}

export enum RejectReason {
  AST_VALIDATION_FAILED = 'AST_VALIDATION_FAILED',
  CONSENSUS_ILLUSION_HIGH = 'CONSENSUS_ILLUSION_HIGH',
  SEMANTIC_MISMATCH = 'SEMANTIC_MISMATCH'
}

export interface RejectionLog {
  candidateId: string;
  reason: RejectReason;
  ciiScore?: number;
  timestamp: string;
}

export class FalsePositiveFilterLayer {
  private rejections: Map<string, RejectionLog> = new Map();

  public evaluateCandidate(
    candidate: EdgeCandidate,
    astValid: boolean,
    ciiScore: number,
    ciiThreshold: number = 0.5
  ): boolean {
    if (!astValid) {
      this.reject(candidate.id, RejectReason.AST_VALIDATION_FAILED);
      return false;
    }

    if (ciiScore >= ciiThreshold) {
      this.reject(candidate.id, RejectReason.CONSENSUS_ILLUSION_HIGH, ciiScore);
      return false;
    }

    return true; // Keep edge
  }

  private reject(candidateId: string, reason: RejectReason, ciiScore?: number): void {
    this.rejections.set(candidateId, {
      candidateId,
      reason,
      ciiScore,
      timestamp: new Date().toISOString()
    });
  }

  public getRejectionLog(candidateId: string): RejectionLog | undefined {
    return this.rejections.get(candidateId);
  }

  public getAllRejections(): RejectionLog[] {
    return Array.from(this.rejections.values());
  }
}
