/**
 * ScopeResolver.ts
 * 
 * Declared Scope Exclusion Module (Phase A)
 * Enforces Tier 3 Candidate Eligibility scoping without mutating Source/Measurement Graph.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ScopeConfigResult {
    patterns: string[];
    source: 'CLI_FLAG' | 'ENV_VAR' | 'VSCODE_SETTINGS' | 'PROJECT_CONFIG' | 'DEFAULT_EMPTY';
}

export class ScopeResolver {
    private patterns: string[];
    private source: ScopeConfigResult['source'];

    constructor(patterns: string[] = [], source: ScopeConfigResult['source'] = 'DEFAULT_EMPTY') {
        this.patterns = patterns;
        this.source = source;
    }

    public static loadConfig(workspaceRoot?: string, cliPatterns?: string[]): ScopeResolver {
        // 1. CLI Flag
        if (cliPatterns !== undefined) {
            ScopeResolver.validatePatterns(cliPatterns);
            console.log(`[SCOPE_CONFIG] Loaded scopeExclusions from: CLI_FLAG (count: ${cliPatterns.length})`);
            return new ScopeResolver(cliPatterns, 'CLI_FLAG');
        }

        // 1-b. Environment Variable
        if (process.env.SYNAPSE_SCOPE_EXCLUSIONS) {
            try {
                const parsed = JSON.parse(process.env.SYNAPSE_SCOPE_EXCLUSIONS);
                if (!Array.isArray(parsed)) {
                    throw new Error('SYNAPSE_SCOPE_EXCLUSIONS must be a JSON array of strings');
                }
                ScopeResolver.validatePatterns(parsed);
                console.log(`[SCOPE_CONFIG] Loaded scopeExclusions from: ENV_VAR (count: ${parsed.length})`);
                return new ScopeResolver(parsed, 'ENV_VAR');
            } catch (err: any) {
                console.error(`[FATAL] INVALID_CONFIG: scopeExclusions must be a valid array of strings (${err.message})`);
                throw new Error(`INVALID_CONFIG: ${err.message}`);
            }
        }

        // 2. VSCode Settings
        if (workspaceRoot) {
            const vscodeSettingsPath = path.join(workspaceRoot, '.vscode', 'settings.json');
            if (fs.existsSync(vscodeSettingsPath)) {
                try {
                    const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf8'));
                    if (settings['synapse.analysis.scopeExclusions'] !== undefined) {
                        const val = settings['synapse.analysis.scopeExclusions'];
                        ScopeResolver.validatePatterns(val);
                        console.log(`[SCOPE_CONFIG] Loaded scopeExclusions from: VSCODE_SETTINGS (count: ${val.length})`);
                        return new ScopeResolver(val, 'VSCODE_SETTINGS');
                    }
                } catch (err: any) {
                    console.error(`[FATAL] INVALID_CONFIG: Failed to parse .vscode/settings.json (${err.message})`);
                    throw new Error(`INVALID_CONFIG: ${err.message}`);
                }
            }

            // 3. Project Config file
            const synapseConfigPath = path.join(workspaceRoot, 'synapse.config.json');
            if (fs.existsSync(synapseConfigPath)) {
                try {
                    const cfg = JSON.parse(fs.readFileSync(synapseConfigPath, 'utf8'));
                    if (cfg.scopeExclusions !== undefined) {
                        const val = cfg.scopeExclusions;
                        ScopeResolver.validatePatterns(val);
                        console.log(`[SCOPE_CONFIG] Loaded scopeExclusions from: PROJECT_CONFIG (count: ${val.length})`);
                        return new ScopeResolver(val, 'PROJECT_CONFIG');
                    }
                } catch (err: any) {
                    console.error(`[FATAL] INVALID_CONFIG: Failed to parse synapse.config.json (${err.message})`);
                    throw new Error(`INVALID_CONFIG: ${err.message}`);
                }
            }
        }

        // Default empty
        console.log(`[SCOPE_CONFIG] Loaded scopeExclusions from: DEFAULT_EMPTY (count: 0)`);
        return new ScopeResolver([], 'DEFAULT_EMPTY');
    }

    private static validatePatterns(patterns: any): void {
        if (!Array.isArray(patterns)) {
            throw new Error('scopeExclusions must be an array of strings');
        }
        for (const p of patterns) {
            if (typeof p !== 'string') {
                throw new Error('scopeExclusions must contain only string values');
            }
            if (p.trim() === '') {
                throw new Error(`INVALID_PATTERN: Pattern cannot be empty or whitespace only`);
            }
            if (p !== p.trim()) {
                throw new Error(`INVALID_PATTERN: Pattern cannot contain leading or trailing whitespace: "${p}"`);
            }
            if (p.startsWith('/')) {
                throw new Error(`INVALID_PATTERN: Leading slash not allowed in relative glob: "${p}"`);
            }
            if (p.endsWith('/')) {
                throw new Error(`INVALID_PATTERN: Trailing slash not allowed in file glob: "${p}"`);
            }
            if (p.includes('\\')) {
                throw new Error(`INVALID_PATTERN: Backslashes not allowed in glob pattern: "${p}"`);
            }
            if (p.includes('//')) {
                throw new Error(`INVALID_PATTERN: Redundant slashes not allowed in glob pattern: "${p}"`);
            }
            if (p.includes('**/**')) {
                throw new Error(`INVALID_PATTERN: Redundant recursive wildcards not allowed: "${p}"`);
            }
            if (p.includes('***') || /([^\/]|^)\*{2}([^\/]|$)/.test(p)) {
                // ** must be an entire segment
                const segments = p.split('/');
                for (const seg of segments) {
                    if (seg.includes('**') && seg !== '**') {
                        throw new Error(`INVALID_PATTERN: "**" must be an entire path segment: "${p}"`);
                    }
                }
            }
            if (p.split('/').some(s => s === '.' || s === '..')) {
                throw new Error(`INVALID_PATTERN: Directory traversal segments (. or ..) not allowed: "${p}"`);
            }
            if (/[?\[\]{}]/.test(p)) {
                throw new Error(`INVALID_PATTERN: Unsupported glob character in pattern: "${p}"`);
            }
        }
    }

    public getPatterns(): string[] {
        return [...this.patterns];
    }

    public getSource(): ScopeConfigResult['source'] {
        return this.source;
    }

    public hasExclusions(): boolean {
        return this.patterns.length > 0;
    }

    /**
     * Matches a relative file path against declared scopeExclusions.
     * Case-sensitive matching.
     */
    public matches(filePath: string): boolean {
        if (!filePath || this.patterns.length === 0) return false;
        
        // Fast skip for virtual or absolute paths
        if (filePath.startsWith('/') || filePath.startsWith('ghost://') || filePath.startsWith('external://') || filePath.startsWith('stdlib://') || filePath.startsWith('AGGREGATE_')) {
            return false;
        }

        const normalized = filePath.replace(/\\/g, '/');
        for (const pattern of this.patterns) {
            if (ScopeResolver.matchGlob(pattern, normalized)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks which pattern matches a file path. Returns the matching pattern or null.
     */
    public matchPattern(pattern: string, filePath: string): boolean {
        if (!filePath || !pattern) return false;
        if (filePath.startsWith('/') || filePath.startsWith('ghost://') || filePath.startsWith('external://') || filePath.startsWith('stdlib://') || filePath.startsWith('AGGREGATE_')) {
            return false;
        }
        const normalized = filePath.replace(/\\/g, '/');
        return ScopeResolver.matchGlob(pattern, normalized);
    }

    /**
     * Deterministic Glob matcher enforcing contract:
     * - ** matches 0 or more directory segments when it is an entire segment.
     * - * matches 0 or more characters within a single segment (cannot cross '/').
     */
    public static matchGlob(pattern: string, targetPath: string): boolean {
        if (pattern === '**') return true;

        const pSegs = pattern.split('/');
        const tSegs = targetPath.split('/');

        return ScopeResolver.matchSegments(pSegs, 0, tSegs, 0);
    }

    private static matchSegments(pSegs: string[], pIdx: number, tSegs: string[], tIdx: number): boolean {
        while (pIdx < pSegs.length && tIdx < tSegs.length) {
            const p = pSegs[pIdx];

            if (p === '**') {
                if (pIdx === pSegs.length - 1) {
                    // Trailing ** matches all remaining target segments
                    return true;
                }
                // Try matching 0, 1, 2, ... segments
                for (let skip = 0; skip <= tSegs.length - tIdx; skip++) {
                    if (ScopeResolver.matchSegments(pSegs, pIdx + 1, tSegs, tIdx + skip)) {
                        return true;
                    }
                }
                return false;
            }

            if (!ScopeResolver.matchSingleSegment(p, tSegs[tIdx])) {
                return false;
            }

            pIdx++;
            tIdx++;
        }

        // If pattern has trailing **
        while (pIdx < pSegs.length && pSegs[pIdx] === '**') {
            pIdx++;
        }

        return pIdx === pSegs.length && tIdx === tSegs.length;
    }

    private static matchSingleSegment(pattern: string, target: string): boolean {
        if (pattern === '*') return true;
        if (!pattern.includes('*')) return pattern === target;

        // Convert * to regex within segment
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*');
        const reg = new RegExp(`^${escaped}$`);
        return reg.test(target);
    }
}

