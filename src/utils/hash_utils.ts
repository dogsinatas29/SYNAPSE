// @synapse-bypass Deterministic hash utility for audit layer.
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {
    canonicalStringify,
    FloatNormalizationOptions,
    normalizeForSemanticHash,
    NormalizationTrace
} from './determinism';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface DeterminismConfig {
    hashAlgorithm: string;
    normalize: FloatNormalizationOptions;
}

const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g;
const DURATION_RE = /\b\d+(?:\.\d+)?\s*(?:ms|s|sec|seconds?)\b/gi;

function scrubRuntimeText(input: string): { semanticText: string; runtimeFragments: string[] } {
    const runtimeFragments: string[] = [];
    const semanticText = input
        .replace(ISO_DATE_RE, (match) => {
            runtimeFragments.push(`timestamp:${match}`);
            return '<TIMESTAMP>';
        })
        .replace(DURATION_RE, (match) => {
            runtimeFragments.push(`duration:${match}`);
            return '<DURATION>';
        });
    return { semanticText, runtimeFragments };
}

async function walkFiles(rootDir: string): Promise<string[]> {
    const out: string[] = [];
    const entries = await readdir(rootDir);
    const sorted = entries.slice().sort((a, b) => a.localeCompare(b));

    for (const entry of sorted) {
        const abs = path.join(rootDir, entry);
        const st = await stat(abs);
        if (st.isDirectory()) {
            const nested = await walkFiles(abs);
            out.push(...nested);
        } else {
            out.push(abs);
        }
    }

    return out;
}

/**
 * Computes the hash of a directory by recursively processing all files.
 * Applies normalization and canonicalization based on the provided config.
 *
 * @param dirPath The directory to hash.
 * @param config Determinism configuration.
 * @returns The computed hash.
 */
export async function hashDirectory(dirPath: string, config: DeterminismConfig): Promise<string> {
    const semanticHash = crypto.createHash(config.hashAlgorithm);
    const runtimeHash = crypto.createHash(config.hashAlgorithm);
    const traces: NormalizationTrace[] = [];
    const files = await walkFiles(dirPath);

    for (const absFilePath of files) {
        const rel = path.relative(dirPath, absFilePath).split(path.sep).join('/');
        const text = await readFile(absFilePath, 'utf-8');

        semanticHash.update(`PATH:${rel}\n`);
        runtimeHash.update(`PATH:${rel}\n`);

        if (absFilePath.endsWith('.json')) {
            const parsed = JSON.parse(text);
            const transformed = normalizeForSemanticHash(parsed, config.normalize, rel, traces);
            semanticHash.update(canonicalStringify(transformed.semantic));
            if (transformed.runtime !== undefined) {
                runtimeHash.update(canonicalStringify(transformed.runtime));
            }
            continue;
        }

        const scrubbed = scrubRuntimeText(text);
        semanticHash.update(scrubbed.semanticText);
        if (scrubbed.runtimeFragments.length > 0) {
            runtimeHash.update(scrubbed.runtimeFragments.sort().join('\n'));
        }
    }

    return `${semanticHash.digest('hex')}::${runtimeHash.digest('hex')}::${traces.length}`;
}

/**
 * Computes the hash of a file.
 *
 * @param filePath The file to hash.
 * @param hashAlgorithm The hash algorithm to use.
 * @returns The computed hash.
 */
export async function hashFile(filePath: string, hashAlgorithm: string): Promise<string> {
    const hash = crypto.createHash(hashAlgorithm);
    const content = await readFile(filePath);
    hash.update(content);
    return hash.digest('hex');
}