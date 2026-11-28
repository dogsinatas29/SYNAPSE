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

export interface ScopeToggleResult {
    action: 'added' | 'removed';
    pattern: string;
    configPath: string;
    patterns: string[];
    shadowedByVscodeSettings: boolean;
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
                    const settings = ScopeResolver.parseJsonc(fs.readFileSync(vscodeSettingsPath, 'utf8'));
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

    public static buildPatternForTarget(projectRoot: string, targetFsPath: string, isDir: boolean): string {
        const relPath = path.relative(projectRoot, targetFsPath).replace(/\\/g, '/').replace(/\/+$/, '');
        if (!relPath || relPath === '.' || relPath === '..' || relPath.startsWith('../') || path.isAbsolute(relPath)) {
            throw new Error('INVALID_TARGET: Target must be a file or subfolder inside the workspace root.');
        }
        const pattern = isDir ? `${relPath}/**` : relPath;
        ScopeResolver.validatePatterns([pattern]);
        return pattern;
    }

    public static toggleScopeExclusion(projectRoot: string, targetFsPath: string, isDir: boolean): ScopeToggleResult {
        const pattern = ScopeResolver.buildPatternForTarget(projectRoot, targetFsPath, isDir);
        const configPath = path.join(projectRoot, 'synapse.config.json');

        let config: Record<string, any> = {};
        if (fs.existsSync(configPath)) {
            let parsed: any;
            try {
                parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch (err: any) {
                throw new Error(`INVALID_CONFIG: Failed to parse synapse.config.json (${err?.message || err})`);
            }
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                throw new Error('INVALID_CONFIG: synapse.config.json must be a JSON object');
            }
            config = parsed;
        }

        let existing: string[] = [];
        if (config.scopeExclusions !== undefined) {
            ScopeResolver.validatePatterns(config.scopeExclusions);
            existing = [...config.scopeExclusions];
        }

        const idx = existing.indexOf(pattern);
        let action: 'added' | 'removed';
        if (idx !== -1) {
            existing.splice(idx, 1);
            action = 'removed';
        } else {
            existing.push(pattern);
            action = 'added';
        }

        config.scopeExclusions = existing;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

        let shadowedByVscodeSettings = false;
        const vscodeSettingsPath = path.join(projectRoot, '.vscode', 'settings.json');
        if (fs.existsSync(vscodeSettingsPath)) {
            try {
                const settings = ScopeResolver.parseJsonc(fs.readFileSync(vscodeSettingsPath, 'utf8'));
                shadowedByVscodeSettings = settings?.['synapse.analysis.scopeExclusions'] !== undefined;
            } catch {
                shadowedByVscodeSettings = false;
            }
        }

        return {
            action,
            pattern,
            configPath,
            patterns: existing,
            shadowedByVscodeSettings
        };
    }

    private static parseJsonc(raw: string): any {
        const text = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;

        // Pass 1: Strip // and /* */ comments outside double-quoted strings
        let noComments = '';
        let inString = false;
        let escaped = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (inString) {
                noComments += ch;
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === '"') {
                    inString = false;
                }
                continue;
            }
            if (ch === '"') {
                inString = true;
                noComments += ch;
                continue;
            }
            if (ch === '/' && text[i + 1] === '/') {
                i += 2;
                while (i < text.length && text[i] !== '\n') {
                    i++;
                }
                if (i < text.length && text[i] === '\n') {
                    noComments += '\n';
                }
                continue;
            }
            if (ch === '/' && text[i + 1] === '*') {
                i += 2;
                let closed = false;
                while (i < text.length) {
                    if (text[i] === '*' && text[i + 1] === '/') {
                        i += 1;
                        closed = true;
                        break;
                    }
                    if (text[i] === '\n') {
                        noComments += '\n';
                    }
                    i++;
                }
                if (!closed) {
                    noComments += '/*';
                    break;
                }
                continue;
            }
            noComments += ch;
        }

        // Pass 2: Strip trailing commas before } or ] outside strings
        let cleaned = '';
        inString = false;
        escaped = false;
        for (let i = 0; i < noComments.length; i++) {
            const ch = noComments[i];
            if (inString) {
                cleaned += ch;
                if (escaped) {
                    escaped = false;
                } else if (ch === '\\') {
                    escaped = true;
                } else if (ch === '"') {
                    inString = false;
                }
                continue;
            }
            if (ch === '"') {
                inString = true;
                cleaned += ch;
                continue;
            }
            if (ch === ',') {
                let j = i + 1;
                while (
                    j < noComments.length &&
                    (noComments[j] === ' ' || noComments[j] === '\t' || noComments[j] === '\r' || noComments[j] === '\n')
                ) {
                    j++;
                }
                if (j < noComments.length && (noComments[j] === '}' || noComments[j] === ']')) {
                    continue;
                }
            }
            cleaned += ch;
        }

        return JSON.parse(cleaned);
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

