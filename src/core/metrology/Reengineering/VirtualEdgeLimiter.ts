export interface CrossProductLimiterConfig {
  maxFanOutPerNode: number;
  enforceLexicalScope: boolean;
  enforceTypeMatch: boolean;
}

export class VirtualEdgeLimiter {
  private config: CrossProductLimiterConfig;
  private dedupeCache: Set<string> = new Set();

  constructor(config: Partial<CrossProductLimiterConfig> = {}) {
    this.config = {
      maxFanOutPerNode: config.maxFanOutPerNode || 10,
      enforceLexicalScope: config.enforceLexicalScope ?? true,
      enforceTypeMatch: config.enforceTypeMatch ?? true
    };
  }

  public shouldAllowEdge(sourceSignalId: string, targetSignalId: string, scopeId: string, typeMatch: boolean): boolean {
    const edgeSignature = `${sourceSignalId}->${targetSignalId}`;
    
    // 1. Deduplication Cache (O(1) state lookup)
    if (this.dedupeCache.has(edgeSignature)) {
      return false; // Already generated this virtual edge
    }

    // 2. Lexical Scope Constraint (Prevents N x M cross product across unrelated files)
    if (this.config.enforceLexicalScope && !scopeId) {
      return false;
    }

    // 3. Strict Type Matching
    if (this.config.enforceTypeMatch && !typeMatch) {
      return false;
    }

    // If passed all constraints, allow it and cache the signature
    this.dedupeCache.add(edgeSignature);
    return true;
  }

  public clearCache(): void {
    this.dedupeCache.clear();
  }
}
