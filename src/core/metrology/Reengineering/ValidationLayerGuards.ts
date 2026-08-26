export class ValidationDedupeCache {
  private cache: Set<string> = new Set();

  /**
   * Generates a unique key for the edge and rule combination.
   */
  private generateKey(edgeId: string, ruleId: string): string {
    return `${edgeId}::${ruleId}`;
  }

  /**
   * Checks if the edge has already been validated by the rule.
   * If not, it caches it and returns true (allowed).
   */
  public shouldEvaluate(edgeId: string, ruleId: string): boolean {
    const key = this.generateKey(edgeId, ruleId);
    if (this.cache.has(key)) {
      return false;
    }
    this.cache.add(key);
    return true;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export class ValidationCycleGuard {
  private visitedSets: Map<string, Set<string>> = new Map();

  /**
   * Pushes a node into the current traversal path for a specific trace/context.
   * Returns false if a cycle is detected.
   */
  public enterNode(traceId: string, nodeId: string): boolean {
    let visited = this.visitedSets.get(traceId);
    if (!visited) {
      visited = new Set<string>();
      this.visitedSets.set(traceId, visited);
    }

    if (visited.has(nodeId)) {
      return false; // SHORT_CIRCUIT: Cycle detected
    }

    visited.add(nodeId);
    return true;
  }

  /**
   * Removes a node from the current traversal path.
   */
  public exitNode(traceId: string, nodeId: string): void {
    const visited = this.visitedSets.get(traceId);
    if (visited) {
      visited.delete(nodeId);
    }
  }

  public clear(traceId?: string): void {
    if (traceId) {
      this.visitedSets.delete(traceId);
    } else {
      this.visitedSets.clear();
    }
  }
}

export class TraversalStateCache {
  private cache: Map<string, boolean> = new Map();

  /**
   * Generates a unique key for the node and validator combination.
   */
  private generateKey(nodeId: string, validatorId: string): string {
    return `${nodeId}::${validatorId}`;
  }

  /**
   * Retrieves the cached validation result if it exists.
   */
  public getResult(nodeId: string, validatorId: string): boolean | undefined {
    return this.cache.get(this.generateKey(nodeId, validatorId));
  }

  /**
   * Caches the result of a deep traversal validation.
   */
  public cacheResult(nodeId: string, validatorId: string, isValid: boolean): void {
    this.cache.set(this.generateKey(nodeId, validatorId), isValid);
  }

  public clear(): void {
    this.cache.clear();
  }
}
