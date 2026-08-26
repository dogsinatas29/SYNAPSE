import crypto from 'crypto';

export class DeterministicHashVerifier {
  
  /**
   * Converts a given object into a canonical JSON string according to v0.3.34.35 rules:
   * 1. Object Key Sort (lexicographic)
   * 2. Stable Array Ordering (if elements are strings/numbers)
   * 3. Remove Timestamp
   * 4. Remove Runtime UUID
   * 5. UTF-8 normalized
   */
  public canonicalize(obj: any): string {
    if (obj === null || obj === undefined) {
      return '';
    }
    
    if (typeof obj !== 'object') {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      // 2. Stable Array Ordering (primitive arrays only, for objects we map recursively but maintain order if it's semantic)
      const mappedArray = obj.map(item => this.canonicalize(item));
      // Sort if it's a primitive array that doesn't have semantic order, but to be safe,
      // in graph structures, array order might be semantic. 
      // For this implementation, we assume arrays of strings/numbers are sets.
      if (mappedArray.every(i => typeof i === 'string' && !i.startsWith('{'))) {
        mappedArray.sort();
      }
      return `[${mappedArray.join(',')}]`;
    }

    // 1. Object Key Sort
    const keys = Object.keys(obj).sort();
    let result = '{';
    let first = true;

    for (const key of keys) {
      // 3. & 4. Remove non-deterministic fields
      if (key.toLowerCase().includes('timestamp') || 
          key.toLowerCase().includes('uuid') ||
          key === 'id' && obj[key].match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) {
        continue;
      }

      const value = obj[key];
      if (value === undefined) continue;

      if (!first) result += ',';
      
      result += `"${key}":${typeof value === 'object' ? this.canonicalize(value) : `"${String(value)}"`}`;
      first = false;
    }

    result += '}';
    return result;
  }

  public generateHash(obj: any): string {
    const canonicalStr = this.canonicalize(obj);
    return crypto.createHash('sha256').update(canonicalStr, 'utf8').digest('hex');
  }

  public verifyMatch(baseHash: string, newHash: string): boolean {
    return baseHash === newHash;
  }
}
