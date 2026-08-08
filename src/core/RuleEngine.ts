import * as fs from 'fs';
import * as path from 'path';

/**
 * RuleEngine
 * Responsible for parsing RULES.md and providing dynamic architecture policies.
 */
export class RuleEngine {
    private static instance: RuleEngine;
    private ignoreFolders: Set<string> = new Set();
    private blacklistFiles: Set<string> = new Set();
    private binaryExcludes: Set<string> = new Set();
    private blacklistPaths: Set<string> = new Set();
    private blacklistFolders: Set<string> = new Set();
    private projectRoot: string = '';
    private caseNormalizedBlacklist: Set<string> = new Set();
    private isCaseInsensitive: boolean = process.platform === 'win32' || process.platform === 'darwin';
    private isLoaded: boolean = false;
    
    // [Performance] Cache to prevent O(N) regex replacements during mass state generation
    private ignoreFolderCache: Map<string, boolean> = new Map();
    private ignoreFileCache: Map<string, boolean> = new Map();

    private constructor() {
        this.setDefaultRules();
    }

    public static getInstance(): RuleEngine {
        if (!RuleEngine.instance) {
            RuleEngine.instance = new RuleEngine();
        }
        return RuleEngine.instance;
    }

    /**
     * [v0.3.23] Load blacklist from project configuration
     */
    public loadConfig(projectRoot: string): void {
        this.projectRoot = this.normalizePath(projectRoot);
        const configPath = path.join(projectRoot, 'synapse.config.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                
                // Reset dynamic blacklists to prevent accumulation during reload
                this.blacklistPaths = new Set();
                this.blacklistFolders = new Set();
                this.caseNormalizedBlacklist = new Set();
                this.ignoreFolderCache.clear();
                this.ignoreFileCache.clear();

                if (config.blacklist) {
                    if (Array.isArray(config.blacklist.folders)) {
                        config.blacklist.folders.forEach((f: string) => {
                            const normalized = this.normalizePath(f);
                            this.blacklistFolders.add(normalized);
                            this.caseNormalizedBlacklist.add(normalized);
                        });
                    }
                    if (Array.isArray(config.blacklist.files)) {
                        config.blacklist.files.forEach((f: string) => {
                            const normalized = this.normalizePath(f);
                            this.blacklistPaths.add(normalized);
                            this.caseNormalizedBlacklist.add(normalized);
                        });
                    }
                    console.log(`✅ [SYNAPSE] Blacklist loaded: ${this.blacklistFolders.size} folders, ${this.blacklistPaths.size} files`);
                }
            } catch (e) {
                console.error('❌ [SYNAPSE] Failed to load blacklist from config:', e);
            }
        }
    }

    private normalizePath(p: string): string {
        let normalized = p.replace(/\\/g, '/');
        
        // [v0.3.24] Robust Absolute Path Guard
        // Standardize projectRoot and target path for comparison
        const standardRoot = this.projectRoot.replace(/\\/g, '/').replace(/\/+$/, '');
        const standardPath = normalized.replace(/\/+$/, '');

        if (standardRoot && standardPath.startsWith(standardRoot)) {
            normalized = standardPath.substring(standardRoot.length);
        }
        
        normalized = normalized.replace(/^\/+/, '').replace(/\/+$/, '');
        return this.normalizeCase(normalized);
    }

    private normalizeCase(p: string): string {
        return this.isCaseInsensitive ? p.toLowerCase() : p;
    }

    /**
     * Loads rules from a specific project root.
     * Looks for RULES.md in the root.
     */
    public loadRules(projectRoot: string): void {
        const rulesPath = path.join(projectRoot, 'RULES.md');

        // Default hardcoded fallbacks in case RULES.md is missing
        this.setDefaultRules();
        
        // [v0.3.23] Also load from config
        this.loadConfig(projectRoot);

        if (fs.existsSync(rulesPath)) {
            try {
                const content = fs.readFileSync(rulesPath, 'utf8');
                this.parseRules(content);
                this.isLoaded = true;
                console.log('✅ [SYNAPSE] Rules loaded from RULES.md');
            } catch (error) {
                console.error('❌ [SYNAPSE] Failed to parse RULES.md, using defaults:', error);
            }
        } else {
            console.log('⚠️ [SYNAPSE] RULES.md not found, using default engine rules.');
        }
    }

    private setDefaultRules(): void {
        this.ignoreFolders = new Set([
            'node_modules', '.git', 'build', 'dist', 'data', 'out',
            '.venv', 'venv', 'env', '__pycache__', '.pytest_cache',
            '.idea', '.vscode', '.github', 'target', 'vendor',
            'bin', 'obj', '.synapse_contexts', '.synapse',
            'synapse_report', 'synapse_harvest_output', 'synapse_generated_reports'
        ]);
        this.blacklistFiles = new Set([
            'package-lock.json',
            'license',
            'v0.2.0_self_sync.js',
            'test_exclusion.js',
            'webpack.config.js',
            'verify_rules.js',
            'verify_rules_only.js',
            'test_tree_logic.js'
        ]);
        this.binaryExcludes = new Set([
            '.vsix', '.zip', '.tar.gz', '.exe', '.dll', '.so', '.bin', '.js.map',
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.txt', '.log', '.csv'
        ]);
        // Reset dynamic blacklists
        this.blacklistPaths = new Set();
        this.blacklistFolders = new Set();
    }

    private parseRules(content: string): void {
        // Simple markdown parsing logic to extract items from lists
        // Note: This is an extensible parser that looks for specific section headers

        // 1. Extract Node Diet (Optimization) / Blacklist from Exclusion Rules section
        const lines = content.split('\n');
        let currentSection = '';

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('##')) {
                currentSection = trimmed.toLowerCase();
            }

            // Extract inline code backticks as potential paths
            // Pattern matches `- ` or `* ` followed by content
            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const regex = /`([^`]+)`/g;
                let match;

                while ((match = regex.exec(trimmed)) !== null) {
                    const item = match[1];
                    if (currentSection.includes('exclusion')) {
                        if (item.startsWith('.')) {
                            this.binaryExcludes.add(item.toLowerCase());
                        } else if (item.includes('/') || item.includes('.')) {
                            this.blacklistFiles.add(path.basename(item).toLowerCase());
                            // [v0.3.23] Also add as full path if it looks like one
                            if (item.includes('/')) {
                                this.blacklistPaths.add(this.normalizePath(item));
                            }
                        } else {
                            this.ignoreFolders.add(item.toLowerCase());
                        }
                    }
                }
            }
        });
    }

    public shouldIgnoreFolder(folderPath: string): boolean {
        if (this.ignoreFolderCache.has(folderPath)) {
            return this.ignoreFolderCache.get(folderPath)!;
        }

        const folderName = path.basename(folderPath).toLowerCase();
        if (this.ignoreFolders.has(folderName)) {
            this.ignoreFolderCache.set(folderPath, true);
            return true;
        }

        const normalizedPath = this.normalizePath(folderPath);
        for (const blackFolder of this.blacklistFolders) {
            if (normalizedPath === blackFolder || normalizedPath.startsWith(blackFolder + '/')) {
                this.ignoreFolderCache.set(folderPath, true);
                return true;
            }
        }
        this.ignoreFolderCache.set(folderPath, false);
        return false;
    }


    public shouldIgnoreFile(filePath: string): boolean {
        if (this.ignoreFileCache.has(filePath)) {
            return this.ignoreFileCache.get(filePath)!;
        }

        const fileName = path.basename(filePath).toLowerCase();

        // [v0.2.17 Patch] Never ignore core SYNAPSE documents
        if (fileName === 'gemini.md' || fileName === 'rules.md') {
            this.ignoreFileCache.set(filePath, false);
            return false;
        }

        const normalizedPath = this.normalizePath(filePath);
        
        // [v0.3.23 L2 Hardening] O(1) Check via pre-normalized cache
        if (this.caseNormalizedBlacklist.has(normalizedPath)) {
            this.ignoreFileCache.set(filePath, true);
            return true;
        }

        if (this.blacklistFiles.has(fileName)) {
            this.ignoreFileCache.set(filePath, true);
            return true;
        }

        // Check recursive folder blacklists
        for (const blackFolder of this.blacklistFolders) {
            if (normalizedPath.startsWith(blackFolder + '/')) {
                this.ignoreFileCache.set(filePath, true);
                return true;
            }
        }

        for (const ext of this.binaryExcludes) {
            if (filePath.toLowerCase().endsWith(ext)) {
                this.ignoreFileCache.set(filePath, true);
                return true;
            }
        }

        this.ignoreFileCache.set(filePath, false);
        return false;
    }

    public getIgnoreFolders(): string[] {
        return Array.from(this.ignoreFolders);
    }
}
