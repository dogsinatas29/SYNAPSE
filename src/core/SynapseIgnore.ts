import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';

function globToRegex(pattern: string): RegExp {
    let regexStr = '^';
    let i = 0;
    while (i < pattern.length) {
        const ch = pattern[i];
        if (ch === '*') {
            if (i + 1 < pattern.length && pattern[i + 1] === '*') {
                regexStr += '.*';
                i += 2;
                if (i < pattern.length && pattern[i] === '/') i++;
            } else {
                regexStr += '[^/]*';
                i++;
            }
        } else if (ch === '?') {
            regexStr += '[^/]';
            i++;
        } else if (ch === '.') {
            regexStr += '\\.';
            i++;
        } else if (ch === '/') {
            regexStr += '/';
            i++;
        } else {
            regexStr += ch;
            i++;
        }
    }
    regexStr += '$';
    return new RegExp(regexStr);
}

export class SynapseIgnore {
    private patterns: { regex: RegExp; negation: boolean; dirOnly: boolean }[] = [];
    private loaded = false;

    load(rootPath: string): void {
        this.patterns = [];
        this.loaded = false;
        const ignorePath = path.join(rootPath, '.synapseignore');
        if (!fs.existsSync(ignorePath)) {
            this.loaded = true;
            return;
        }
        try {
            const content = fs.readFileSync(ignorePath, 'utf-8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;

                let pattern = trimmed;
                let negation = false;
                let dirOnly = false;

                if (pattern.startsWith('!')) {
                    negation = true;
                    pattern = pattern.slice(1);
                }
                if (pattern.endsWith('/')) {
                    dirOnly = true;
                    pattern = pattern.slice(0, -1);
                }

                const regex = globToRegex(pattern);
                this.patterns.push({ regex, negation, dirOnly });
            }
            Logger.info(`[SynapseIgnore] Loaded ${this.patterns.length} patterns from .synapseignore`);
        } catch (e) {
            Logger.warn(`[SynapseIgnore] Failed to load .synapseignore: ${e}`);
        }
        this.loaded = true;
    }

    isIgnored(relativePath: string): boolean {
        if (!this.loaded) return false;
        const normalized = relativePath.replace(/\\/g, '/');
        let ignored = false;
        for (const p of this.patterns) {
            if (p.dirOnly) continue;
            if (p.negation) {
                if (p.regex.test(normalized)) ignored = false;
            } else {
                if (p.regex.test(normalized)) ignored = true;
            }
        }
        return ignored;
    }
}
