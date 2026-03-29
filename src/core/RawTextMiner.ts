import * as fs from 'fs';

/**
 * [v0.2.37] RawTextMiner
 * Extraction tool for UTF-8 Hangeul and meaningful strings from binary or malformed data (PB, VSCDB-WAL, etc.)
 */
export class RawTextMiner {
    /**
     * Extracts Hangeul (가-힣) and alphanumeric strings from a file path
     */
    public static extractFromFile(filePath: string): string[] {
        try {
            if (!fs.existsSync(filePath)) return [];
            const buffer = fs.readFileSync(filePath);
            return this.extractFromBuffer(buffer);
        } catch (e) {
            console.error(`[SYNAPSE] RawTextMiner failed for ${filePath}:`, e);
            return [];
        }
    }

    /**
     * Extracts Hangeul and alphanumeric strings from a buffer
     * [v0.2.38] Precision Noise Filter: Excludes VS Code internal keys and metadata.
     */
    public static extractFromBuffer(buffer: Buffer): string[] {
        const content = buffer.toString('utf-8');
        
        // Regex: Matches sequences of Hangeul, Alphanumeric, and common punctuation
        // Focuses on strings of length 15+ to avoid short identifiers
        const hangeulRegex = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F\w\s?.!,]{15,}/g;
        const matches = content.match(hangeulRegex) || [];
        
        return matches
            .map(m => m.trim())
            .filter(m => {
                // 1. Basic Content Check
                const hasHangeul = /[\uAC00-\uD7A3]/.test(m);
                const isSignificant = m.length > 25;
                if (!hasHangeul && !isSignificant) return false;

                // 2. [v0.2.38] Noise Filter (Key/Metadata identifiers)
                // Exclude common VS Code internal key patterns (dots, camelCase/dot.notation)
                if (m.includes('workbench.') || m.includes('antigravity.') || m.includes('jetski.')) return false;
                if (m.includes('ItemTable') || m.includes('CREATE TABLE')) return false;
                
                // Exclude strings with too many dots or underscores (likely identifiers)
                const dotCount = (m.match(/\./g) || []).length;
                const underscoreCount = (m.match(/_/g) || []).length;
                if (dotCount > 2 || underscoreCount > 3) return false;

                // Exclude strings that look like hex or long base64 chunks
                if (/^[a-fA-F0-9]{32,}$/.test(m)) return false;

                // 3. Human Sentence Heuristic: Should have spaces if it's alphanumeric only
                if (!hasHangeul && !m.includes(' ')) return false;

                return true;
            });
    }

    /**
     * Aggregates and deduplicates extracted strings
     */
    public static mine(dataProviders: (string | Buffer)[]): string[] {
        const results = new Set<string>();
        
        dataProviders.forEach(provider => {
            let strings: string[] = [];
            if (typeof provider === 'string') {
                strings = this.extractFromFile(provider);
            } else {
                strings = this.extractFromBuffer(provider);
            }
            
            strings.forEach(s => results.add(s));
        });
        
        return Array.from(results);
    }
}
