import * as path from 'path';
import { Logger } from '../../utils/Logger';
import { SubmissionFile } from '../../types/schema';
import { SourceFileEntry, FunctionEntry, FolderTreeNode, ArchitectureIndex } from './ArchitectureIndexBuilder';

export type EdgeCategory = 'INCLUDE' | 'REFERENCE' | 'CALL' | 'DB_QUERY' | 'DATA_FLOW' | 'EVENT' | 'CONDITIONAL' | 'LOOP_BACK';

export interface ReferenceEdge {
    id: string;
    from: string;
    to: string;
    category: EdgeCategory;
    lineNumber: number;
    rawReference: string;
}

export type GhostType = 'external' | 'internal';

export interface GhostNode {
    id: string;
    path: string;
    type: GhostType;
    label: string;
    referencedBy: string[];
}

export interface ReferenceGraph {
    fileNodes: string[];
    ghostNodes: GhostNode[];
    edges: ReferenceEdge[];
    clusters: string[];
}

export type FindingSeverity = 'info' | 'warning' | 'error';

export interface ReviewFinding {
    type: 'UNRESOLVED_REFERENCE' | 'GHOST_PROJECTION' | 'FOLDER_STRUCTURE_MISMATCH' | 'REFERENCE_ANOMALY' | 'DISCONNECTED_COMPONENT' | 'EXTERNAL_DEPENDENCY' | 'UUID_CONFLICT';
    severity: FindingSeverity;
    message: string;
    details?: any;
}

export interface VerificationReport {
    generatedAt: number;
    graph: ReferenceGraph;
    findings: ReviewFinding[];
    stats: {
        totalFiles: number;
        totalEdges: number;
        totalGhosts: number;
        resolvedReferences: number;
        unresolvedReferences: number;
        disconnectedFiles: number;
    };
}

export type ArchitectDecision = 'accept' | 'modify' | 'resubmit' | 'prepare_harvest';

export interface HarvestCandidateEntry {
    filePath: string;
    nodeId: string;
    incomingEdges: string[];
    outgoingEdges: string[];
}

export interface HarvestCandidateSet {
    submissionId: string;
    projectUUID: string;
    decision: ArchitectDecision;
    candidates: HarvestCandidateEntry[];
    report: VerificationReport;
}

const EXTERNAL_PACKAGES = new Set([
    // JS/TS & Node.js
    'axios', 'express', 'lodash', 'react', 'vue', 'angular', 'jquery', 'next', 'nuxt', 'jest', 'mocha',
    'chai', 'rxjs', 'redux', 'mobx', 'zustand', 'tailwindcss', 'vite', 'webpack', 'rollup', 'fs',
    'path', 'os', 'events', 'crypto', 'http', 'https', 'child_process', 'util', 'stream', 'buffer',
    
    // Python
    'requests', 'flask', 'django', 'numpy', 'pandas', 'pytest', 'fastapi', 'sqlalchemy', 'pydantic',
    'os', 'sys', 'math', 'datetime', 'json', 're', 'pathlib', 'typing', 'collections', 'itertools',
    'asyncio', 'logging', 'subprocess', 'random', 'time', 'urllib', 'multiprocessing', 'threading',
    
    // Rust
    'serde', 'tokio', 'actix', 'rocket', 'clap', 'std', 'core', 'alloc', 'serde_json', 'reqwest',
    'anyhow', 'thiserror', 'actix_web', 'axum', 'sqlx', 'diesel', 'log', 'env_logger', 'chrono',
    
    // Go
    'gin', 'echo', 'fiber', 'cobra', 'viper', 'fmt', 'net', 'strings', 'strconv', 'time',
    'encoding', 'io', 'bufio', 'context', 'sync', 'gorilla', 'log', 'math', 'sort', 'regexp',
    
    // Java & Kotlin
    'junit', 'mockito', 'spring', 'hibernate', 'log4j', 'java', 'javax', 'org', 'com', 'lombok',
    'slf4j', 'jackson', 'gson', 'guava', 'apache',
    
    // Swift / iOS
    'swiftui', 'alamofire', 'kingfisher', 'foundation', 'uikit', 'combine',
    
    // C++
    'iostream', 'vector', 'string', 'map', 'set', 'algorithm', 'memory', 'functional', 'thread', 'mutex',
    'chrono', 'fstream', 'sstream', 'cmath', 'cstdint', 'cassert'
]);

function detectLanguage(ext: string): string {
    const map: Record<string, string> = {
        '.py': 'python', '.ts': 'typescript', '.js': 'javascript',
        '.rs': 'rust', '.cpp': 'cpp', '.c': 'c',
        '.go': 'go', '.java': 'java', '.kt': 'kotlin', '.kts': 'kotlin', '.swift': 'swift',
    };
    return map[ext.toLowerCase()] || 'unknown';
}

function extractReferences(content: string, filePath: string): { target: string; category: EdgeCategory; lineNumber: number }[] {
    const results: { target: string; category: EdgeCategory; lineNumber: number }[] = [];
    const lines = content.split('\n');
    const ext = path.extname(filePath).toLowerCase();
    const lang = detectLanguage(ext);

    const patterns: { regex: RegExp; category: EdgeCategory }[] = [];

    switch (lang) {
        case 'python':
            patterns.push(
                { regex: /^\s*from\s+(\S+)\s+import/, category: 'INCLUDE' as EdgeCategory },
                { regex: /^\s*import\s+(\S+)/, category: 'INCLUDE' as EdgeCategory },
            );
            break;
        case 'typescript':
        case 'javascript':
            patterns.push(
                { regex: /from\s+['"]([^'"]+)['"]/, category: 'INCLUDE' as EdgeCategory },
                { regex: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/, category: 'INCLUDE' as EdgeCategory },
                { regex: /import\s+['"]([^'"]+)['"]/, category: 'INCLUDE' as EdgeCategory },
            );
            break;
        case 'rust':
            patterns.push(
                { regex: /^\s*use\s+([^;]+)/, category: 'INCLUDE' as EdgeCategory },
                { regex: /^\s*extern\s+crate\s+(\S+)/, category: 'INCLUDE' as EdgeCategory },
                { regex: /^\s*mod\s+(\S+)/, category: 'REFERENCE' as EdgeCategory },
            );
            break;
        case 'cpp':
        case 'c':
            patterns.push(
                { regex: /#include\s+[<"]([^>"]+)[>"]/, category: 'INCLUDE' as EdgeCategory },
            );
            break;
        case 'go':
            patterns.push(
                { regex: /^\s*import\s+["]([^"]+)["]/, category: 'INCLUDE' as EdgeCategory },
                { regex: /"([^"]+\/[^"]+)"/, category: 'REFERENCE' as EdgeCategory },
            );
            break;
        case 'java':
            patterns.push(
                { regex: /^\s*import\s+(\S+)/, category: 'INCLUDE' as EdgeCategory },
            );
            break;
        case 'kotlin':
            patterns.push(
                { regex: /^\s*import\s+(\S+)/, category: 'INCLUDE' as EdgeCategory },
            );
            break;
        case 'swift':
            patterns.push(
                { regex: /^\s*import\s+(\S+)/, category: 'INCLUDE' as EdgeCategory },
            );
            break;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const p of patterns) {
            const match = line.match(p.regex);
            if (match) {
                let target = match[1].trim();
                if (target.endsWith(';')) target = target.slice(0, -1).trim();
                results.push({ target, category: p.category, lineNumber: i + 1 });
            }
        }
    }

    return results;
}

function resolveReference(target: string, sourceFileRegistry: SourceFileEntry[], currentFileDir: string): string | null {
    const targetName = target.split('/').pop() || target;
    const targetBase = targetName.replace(/\.\w+$/, '');

    const parts = target.split('.');
    const modulePath = parts.join('/');

    const candidates: string[] = [];

    const directMatch = sourceFileRegistry.find(f => f.filePath === target || f.filePath === `${target}`);
    if (directMatch) return directMatch.filePath;

    const baseMatch = sourceFileRegistry.find(f =>
        f.filePath === `${target}.py` ||
        f.filePath === `${target}.ts` ||
        f.filePath === `${target}.js` ||
        f.filePath === `${target}.rs` ||
        f.filePath === `${target}.go` ||
        f.filePath === `${target}.java` ||
        f.filePath === `${target}.kt` ||
        f.filePath === `${target}.kts` ||
        f.filePath === `${target}.swift` ||
        f.filePath === `${target}.cpp` ||
        f.filePath === `${target}.c`
    );
    if (baseMatch) return baseMatch.filePath;

    const fromCurrentDir = sourceFileRegistry.find(f =>
        f.filePath === `${currentFileDir}/${target}` ||
        f.filePath === `${currentFileDir}/${target}.py` ||
        f.filePath === `${currentFileDir}/${target}.ts`
    );
    if (fromCurrentDir) return fromCurrentDir.filePath;

    const moduleMatch = sourceFileRegistry.find(f =>
        f.filePath === `${modulePath}.py` ||
        f.filePath === `${modulePath}.ts` ||
        f.filePath === `${modulePath}.js` ||
        f.filePath === `${modulePath}.rs` ||
        f.filePath === `${modulePath}.go` ||
        f.filePath === `${modulePath}.java`
    );
    if (moduleMatch) return moduleMatch.filePath;

    for (const file of sourceFileRegistry) {
        const fileName = path.basename(file.filePath).replace(/\.[^/.]+$/, '');
        if (fileName === targetBase || fileName === target) {
            candidates.push(file.filePath);
        }
    }

    if (candidates.length === 1) return candidates[0];

    return null;
}

function isExternalPackage(target: string): boolean {
    const firstPart = target.split('/')[0].split('.')[0].split(':')[0];
    const clean = firstPart.replace(/[^a-zA-Z0-9_-]/g, '');
    return EXTERNAL_PACKAGES.has(clean) || EXTERNAL_PACKAGES.has(target);
}

export class ReferenceVerifier {
    private static instance: ReferenceVerifier;

    static getInstance(): ReferenceVerifier {
        if (!ReferenceVerifier.instance) {
            ReferenceVerifier.instance = new ReferenceVerifier();
        }
        return ReferenceVerifier.instance;
    }

    verify(index: ArchitectureIndex, files: {filePath: string, content: string}[], submissionId: string): VerificationReport {
        Logger.info(`[v0.3.30] Verifying submission: ${submissionId}`);

        const edges: ReferenceEdge[] = [];
        const ghostMap = new Map<string, GhostNode>();
        const fileContentMap = new Map<string, string>();
        const sourcePaths = new Set(index.sourceFileRegistry.map(f => f.filePath));

        for (const file of files) {
            fileContentMap.set(file.filePath, file.content);
        }

        let resolvedCount = 0;
        let unresolvedCount = 0;

        for (const sourceFile of index.sourceFileRegistry) {
            const content = fileContentMap.get(sourceFile.filePath) || '';
            if (!content) continue;

            const refs = extractReferences(content, sourceFile.filePath);
            const currentDir = path.dirname(sourceFile.filePath);

            for (const ref of refs) {
                const resolved = resolveReference(ref.target, index.sourceFileRegistry, currentDir);

                if (resolved) {
                    const edgeId = `edge_${sourceFile.filePath.replace(/[^a-zA-Z0-9]/g, '_')}_to_${resolved.replace(/[^a-zA-Z0-9]/g, '_')}_${ref.lineNumber}`;
                    edges.push({
                        id: edgeId,
                        from: sourceFile.filePath,
                        to: resolved,
                        category: ref.category,
                        lineNumber: ref.lineNumber,
                        rawReference: ref.target,
                    });
                    resolvedCount++;
                } else {
                    const isExternal = isExternalPackage(ref.target);
                    const ghostPath = isExternal ? `external://${ref.target}` : `ghost://${ref.target}`;

                    if (!ghostMap.has(ghostPath)) {
                        ghostMap.set(ghostPath, {
                            id: ghostPath,
                            path: ghostPath,
                            type: isExternal ? 'external' : 'internal',
                            label: ref.target,
                            referencedBy: [],
                        });
                    }
                    ghostMap.get(ghostPath)!.referencedBy.push(sourceFile.filePath);

                    const edgeId = `edge_${sourceFile.filePath.replace(/[^a-zA-Z0-9]/g, '_')}_to_ghost_${ref.target.replace(/[^a-zA-Z0-9]/g, '_')}_${ref.lineNumber}`;
                    edges.push({
                        id: edgeId,
                        from: sourceFile.filePath,
                        to: ghostPath,
                        category: ref.category,
                        lineNumber: ref.lineNumber,
                        rawReference: ref.target,
                    });
                    unresolvedCount++;
                }
            }
        }

        const ghostNodes = Array.from(ghostMap.values());

        const folderSet = new Set<string>();
        for (const file of index.sourceFileRegistry) {
            const dir = path.dirname(file.filePath);
            if (dir && dir !== '.') {
                folderSet.add(dir);
            }
        }

        const graph: ReferenceGraph = {
            fileNodes: index.sourceFileRegistry.map(f => f.filePath),
            ghostNodes,
            edges,
            clusters: Array.from(folderSet),
        };

        const findings: ReviewFinding[] = [];

        for (const ghost of ghostNodes) {
            if (ghost.type === 'external') {
                findings.push({
                    type: 'EXTERNAL_DEPENDENCY',
                    severity: 'info',
                    message: `External dependency: ${ghost.label}`,
                    details: { ghost, referencedBy: ghost.referencedBy },
                });
            } else {
                findings.push({
                    type: 'GHOST_PROJECTION',
                    severity: 'warning',
                    message: `Unresolved internal reference: ${ghost.label}`,
                    details: { ghost, referencedBy: ghost.referencedBy },
                });
            }
        }

        const connectedFiles = new Set<string>();
        for (const edge of edges) {
            if (!edge.to.startsWith('external://') && !edge.to.startsWith('ghost://')) {
                connectedFiles.add(edge.from);
                connectedFiles.add(edge.to);
            }
        }
        const disconnectedFiles = sourcePaths.size - connectedFiles.size;

        if (disconnectedFiles > 0) {
            findings.push({
                type: 'DISCONNECTED_COMPONENT',
                severity: 'info',
                message: `${disconnectedFiles} files have no incoming or outgoing references`,
                details: { count: disconnectedFiles },
            });
        }

        const report: VerificationReport = {
            generatedAt: Date.now(),
            graph,
            findings,
            stats: {
                totalFiles: index.sourceFileRegistry.length,
                totalEdges: edges.length,
                totalGhosts: ghostNodes.length,
                resolvedReferences: resolvedCount,
                unresolvedReferences: unresolvedCount,
                disconnectedFiles,
            },
        };

        Logger.info(`[v0.3.30] Verification complete: ${edges.length} edges, ${ghostNodes.length} ghosts, ${findings.length} findings`);
        return report;
    }

    generateCandidates(report: VerificationReport, decision: ArchitectDecision, submissionId: string, projectUUID: string): HarvestCandidateSet {
        const candidateMap = new Map<string, HarvestCandidateEntry>();

        for (const filePath of report.graph.fileNodes) {
            const incoming = report.graph.edges
                .filter(e => e.to === filePath && !e.to.startsWith('external://') && !e.to.startsWith('ghost://'))
                .map(e => e.id);
            const outgoing = report.graph.edges
                .filter(e => e.from === filePath && !e.to.startsWith('external://') && !e.to.startsWith('ghost://'))
                .map(e => e.id);
            candidateMap.set(filePath, {
                filePath,
                nodeId: filePath,
                incomingEdges: incoming,
                outgoingEdges: outgoing,
            });
        }

        return {
            submissionId,
            projectUUID,
            decision,
            candidates: Array.from(candidateMap.values()),
            report,
        };
    }
}
