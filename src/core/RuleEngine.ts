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
    private isLoaded: boolean = false;

    private constructor() { }

    public static getInstance(): RuleEngine {
        if (!RuleEngine.instance) {
            RuleEngine.instance = new RuleEngine();
        }
        return RuleEngine.instance;
    }

    /**
     * Loads rules from a specific project root.
     * Looks for RULES.md in the root.
     */
    public loadRules(projectRoot: string): void {
        const rulesPath = path.join(projectRoot, 'RULES.md');

        // Default hardcoded fallbacks in case RULES.md is missing
        this.setDefaultRules();

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
            'bin', 'obj', 'ui', '.synapse_contents'
        ]);
        this.blacklistFiles = new Set([
            'package-lock.json',
            'license',
            'v0.2.0_self_sync.js',
            'canvas-engine.js',
            'test_exclusion.js'
        ]);
        this.binaryExcludes = new Set([
            '.vsix', '.zip', '.tar.gz', '.exe', '.dll', '.so', '.bin', '.js.map',
            '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf'
        ]);
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
            // We need to find ALL occurrences of `text` in the line
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
                        } else {
                            this.ignoreFolders.add(item.toLowerCase());
                        }
                    }
                }
            }
        });
    }

    public shouldIgnoreFolder(folderName: string): boolean {
        return this.ignoreFolders.has(folderName.toLowerCase());
    }

    public shouldIgnoreFile(filePath: string): boolean {
        const fileName = path.basename(filePath).toLowerCase();

        if (this.blacklistFiles.has(fileName)) {
            return true;
        }

        for (const ext of this.binaryExcludes) {
            if (filePath.toLowerCase().endsWith(ext)) {
                return true;
            }
        }

        return false;
    }

    public getIgnoreFolders(): string[] {
        return Array.from(this.ignoreFolders);
    }
}
