import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';
import { Node } from './GraphModel';
import { ResolvedReference } from './ReferenceResolver';
import { ExternalEcosystem, ExternalOriginType, makeExternalSemantic } from './ExternalReferenceSemantics';

export type GhostCategory = 'header' | 'source' | 'rust' | 'symbol' | 'unknown';
export type GhostClassification = 'validExternal' | 'resolvableInternal' | 'parserArtifact';
export type GhostActionDecision = 'INCLUDE_RESOLUTION' | 'PARSER_FILTER' | 'KEEP_GHOST_CLUSTER' | 'REVIEW';
export type GhostOriginType = ExternalOriginType;
export type GhostEcosystem = ExternalEcosystem;

export interface GhostClassificationGroup {
    target: string;
    occurrenceCount: number;
    referencedByCount: number;
    sampleSources: string[];
    sourceFiles: string[];
    classification: GhostClassification;
    category: GhostCategory;
    reason: string;
}

export interface GhostClassificationReport {
    total: number;
    extStats: {
        total: number;
        header: number;
        source: number;
        rust: number;
        symbol: number;
        unknown: number;
    };
    topTargets: Array<{ target: string; count: number }>;
    originTopTargets: Array<{ target: string; referencedByCount: number; sampleSources: string[] }>;
    classification: {
        total: number;
        validExternal: number;
        resolvableInternal: number;
        parserArtifact: number;
    };
    classificationV2: {
        byOriginType: Record<GhostOriginType, number>;
        byEcosystem: Record<GhostEcosystem, number>;
    };
    unknownDiagnostics: {
        unknownTopTargets: Array<{ target: string; count: number; sourceExt: string }>;
        unknownBySourceExt: Record<string, number>;
    };
    v2Gate: {
        total: number;
        unknownCount: number;
        unknownRatio: number;
        commandArgumentCount: number;
        commandArgumentRatio: number;
        licenseTokenCount: number;
        licenseTokenRatio: number;
        readyForV2B: boolean;
        thresholdUnknownRatio: number;
    };
    decision: {
        decision: GhostActionDecision;
        confidence: number;
    };
    diagnosticText: string;
}

function normalizeText(value: string): string {
    return value.replace(/\\/g, '/').replace(/^(external|ghost):\/\//i, '').trim();
}

function stripDecorations(value: string): string {
    return normalizeText(value).split('?')[0].split('#')[0];
}

function getPathBasename(value: string): string {
    const clean = stripDecorations(value);
    return path.posix.basename(clean);
}

function getGhostCategory(value: string): GhostCategory {
    const clean = stripDecorations(value);
    const base = getPathBasename(clean);
    const lowerBase = base.toLowerCase();
    const ext = path.posix.extname(lowerBase);

    if (['.h', '.hh', '.hpp', '.hxx', '.inc'].includes(ext)) return 'header';
    if (['.rs'].includes(ext)) return 'rust';
    if (['.c', '.cc', '.cpp', '.cxx'].includes(ext) || base.endsWith('.S') || ['.s', '.asm'].includes(ext)) return 'source';
    if (!clean.includes('/') && !ext) return 'symbol';
    if (base.includes('EXPORT_SYMBOL') || base.includes('LIST_HEAD') || base.includes('container_of')) return 'symbol';
    return 'unknown';
}

function isParserArtifact(value: string): boolean {
    const clean = stripDecorations(value);
    const base = getPathBasename(clean);
    return (
        /^EXPORT_SYMBOL(?:_GPL)?$/.test(base) ||
        /^LIST_HEAD$/.test(base) ||
        /^container_of$/.test(base) ||
        /^__init$/.test(base) ||
        /^__exit$/.test(base) ||
        /^__iomem$/.test(base) ||
        /^MODULE_[A-Z0-9_]+$/.test(base) ||
        (!clean.includes('/') && !clean.includes('.') && /^[A-Z0-9_]{3,}$/.test(base))
    );
}

function getSourceExt(sourceFilePath: string): string {
    const lower = sourceFilePath.toLowerCase();
    if (lower.endsWith('/makefile') || lower.endsWith('makefile')) return '.mk';
    return path.posix.extname(lower);
}

function isCommandArgumentToken(value: string): boolean {
    const clean = stripDecorations(value);
    return /^-{1,2}[a-z0-9][a-z0-9-]*$/i.test(clean);
}

function isLicenseToken(value: string): boolean {
    const clean = stripDecorations(value).toLowerCase();
    return (
        /^\d+-(only|or-later)$/.test(clean) ||
        /^(gpl|lgpl|mit|bsd|apache|mpl|agpl)/.test(clean) ||
        clean.includes('spdx')
    );
}

function isLikelyShellLiteral(value: string): boolean {
    const clean = stripDecorations(value);
    if (/^\d+$/.test(clean)) return true;
    if (/^\d+[a-z]$/i.test(clean)) return true;
    if (!clean.includes('/') && !clean.includes('.') && !clean.startsWith('-') && clean.length <= 3 && /[0-9]/.test(clean)) {
        return true;
    }
    return false;
}

function isLikelyHeader(value: string): boolean {
    const clean = stripDecorations(value).toLowerCase();
    const ext = path.posix.extname(clean);
    return ['.h', '.hh', '.hpp', '.hxx', '.inc'].includes(ext) || clean.startsWith('linux/') || clean.startsWith('uapi/') || clean.startsWith('asm/');
}

function isLikelyToolchainToken(value: string): boolean {
    const clean = stripDecorations(value).toLowerCase();
    return [
        'gdb', 'lldb', 'clang', 'clang++', 'gcc', 'g++', 'ld', 'ar', 'nm', 'objdump', 'readelf',
        'make', 'cmake', 'ninja', 'python', 'python3', 'sh', 'bash', 'zsh', 'awk', 'sed', 'grep', 'perl'
    ].includes(clean);
}

function isTsJsModuleSourceExt(sourceExt: string): boolean {
    return sourceExt === '.ts' || sourceExt === '.tsx' || sourceExt === '.js' || sourceExt === '.jsx' || sourceExt === '.mjs' || sourceExt === '.cjs';
}

function isYamlSourceExt(sourceExt: string): boolean {
    return sourceExt === '.yml' || sourceExt === '.yaml';
}

function isLikelyNodeBuiltin(name: string): boolean {
    const n = name.toLowerCase();
    return [
        'fs', 'path', 'os', 'http', 'https', 'url', 'util', 'stream', 'buffer', 'events', 'zlib',
        'crypto', 'child_process', 'readline', 'net', 'tls', 'assert', 'process', 'inspector', 'module'
    ].includes(n) || n.startsWith('node:');
}

function inferOriginType(ref: ResolvedReference, candidate: string): GhostOriginType {
    const clean = stripDecorations(candidate);
    const lowerClean = clean.toLowerCase();
    const sourceExt = getSourceExt(ref.sourceId);
    const referenceType = (ref.referenceType || '').toLowerCase();

    if (isCommandArgumentToken(clean)) return 'CommandArgument';
    if (isLicenseToken(clean)) return 'LicenseToken';
    if (sourceExt === '.sh' || sourceExt === '.bash' || sourceExt === '.zsh' || sourceExt === '.mk') {
        if (isLikelyShellLiteral(clean)) return 'ShellLiteral';
        if (isLikelyToolchainToken(clean)) return 'ToolchainReference';
        if (!clean.includes('/') && !clean.startsWith('.') && !clean.includes(':')) return 'ToolchainReference';
    }

    if (sourceExt === '.md' || lowerClean.endsWith('.md') || lowerClean.includes('.md/')) {
        return 'DocumentationReference';
    }

    if (isYamlSourceExt(sourceExt)) {
        if (!clean.includes('/') && !clean.startsWith('.') && !clean.includes(':')) return 'ToolchainReference';
    }

    if (sourceExt === '.py') {
        if (!clean.includes('/') && !clean.includes(':')) return 'ImportReference';
    }

    if (sourceExt === '.rs') {
        if (!clean.includes('/') && !clean.includes(':')) return 'PackageReference';
    }

    if (isTsJsModuleSourceExt(sourceExt)) {
        if (!clean.startsWith('./') && !clean.startsWith('../') && !path.posix.isAbsolute(clean)) {
            return 'PackageReference';
        }
    }

    if (sourceExt === '.c' || sourceExt === '.h' || sourceExt === '.cc' || sourceExt === '.cpp' || sourceExt === '.s' || sourceExt === '.S') {
        if (isLikelyHeader(clean) || !clean.includes('/')) return 'IncludeReference';
    }

    if (referenceType === 'dependency' && isLikelyHeader(clean)) return 'IncludeReference';
    if (isLikelyToolchainToken(clean)) return 'ToolchainReference';

    return 'Unknown';
}

function inferEcosystem(originType: GhostOriginType, ref: ResolvedReference, candidate: string): GhostEcosystem {
    const clean = stripDecorations(candidate).toLowerCase();
    const sourceExt = getSourceExt(ref.sourceId);

    if (originType === 'DocumentationReference' || sourceExt === '.md' || clean.endsWith('.md')) {
        return 'DOCUMENTATION';
    }

    if (originType === 'ToolchainReference' || originType === 'CommandArgument' || originType === 'ShellLiteral' || originType === 'LicenseToken') {
        return 'TOOLCHAIN';
    }

    if (originType === 'ImportReference' || sourceExt === '.py' || ['argparse', 'subprocess', 'typing', 'logging', 'pathlib', 'dataclasses'].includes(clean)) {
        return 'PYTHON';
    }

    if (sourceExt === '.rs' || ['quote', 'syn', 'proc_macro', 'alloc', 'core', 'std'].includes(clean)) {
        return 'RUST';
    }

    if (originType === 'IncludeReference' || isLikelyHeader(clean) || ['pthread', 'libgen'].includes(clean)) {
        return 'C_RUNTIME';
    }

    if (originType === 'PackageReference') {
        if (clean === 'electron' || clean.startsWith('electron/')) {
            return 'ELECTRON';
        }
        if (isTsJsModuleSourceExt(sourceExt) || isLikelyNodeBuiltin(clean) || clean === 'vscode' || clean.startsWith('@')) {
            return 'NODE';
        }
        return 'PACKAGE';
    }

    if (isYamlSourceExt(sourceExt)) {
        return 'TOOLCHAIN';
    }

    return 'UNKNOWN';
}

function semanticFrom(ref: ResolvedReference, candidate: string): { originType: GhostOriginType; ecosystem: GhostEcosystem } {
    const originType = inferOriginType(ref, candidate);
    const ecosystem = inferEcosystem(originType, ref, candidate);
    return { originType, ecosystem };
}

function buildSuffixIndex(existingNodeIds: ReadonlySet<string>): Set<string> {
    const suffixIndex = new Set<string>();
    for (const nodeId of existingNodeIds) {
        const normalized = normalizeText(nodeId).toLowerCase();
        if (!normalized) continue;
        const segments = normalized.split('/').filter(Boolean);
        for (let i = 0; i < segments.length; i++) {
            suffixIndex.add(segments.slice(i).join('/'));
        }
    }
    return suffixIndex;
}

const statCache = new Map<string, boolean>();

function isResolvableInternal(
    candidate: string,
    sourceFilePath: string,
    projectRoot?: string,
    suffixIndex?: Set<string>
): { match: boolean; matchedPath?: string } {
    if (!projectRoot) return { match: false };

    const rootAbs = path.resolve(projectRoot);
    const sourceAbs = path.isAbsolute(sourceFilePath)
        ? sourceFilePath
        : path.resolve(rootAbs, sourceFilePath);
    const clean = stripDecorations(candidate);
    const lowerClean = clean.toLowerCase();

    if (!lowerClean || isParserArtifact(clean)) {
        return { match: false };
    }

    const candidates = new Set<string>();
    const add = (p: string) => {
        if (!p) return;
        candidates.add(path.resolve(p));
    };

    if (path.isAbsolute(clean)) {
        add(clean);
    } else {
        add(path.resolve(rootAbs, clean));
        add(path.resolve(path.dirname(sourceAbs), clean));
        add(path.resolve(rootAbs, 'include', clean));
        add(path.resolve(rootAbs, 'include/generated', clean));
        add(path.resolve(rootAbs, 'arch', clean));
        add(path.resolve(rootAbs, 'src', clean));
        add(path.resolve(rootAbs, 'kernel', clean));
        add(path.resolve(rootAbs, 'drivers', clean));
        add(path.resolve(rootAbs, 'fs', clean));
        add(path.resolve(rootAbs, 'mm', clean));
        add(path.resolve(rootAbs, 'net', clean));
        add(path.resolve(rootAbs, 'sound', clean));
        add(path.resolve(rootAbs, 'tools', clean));
        add(path.resolve(rootAbs, 'lib', clean));
        add(path.resolve(rootAbs, 'rust', clean));
    }

    if (clean.startsWith('linux/') || clean.startsWith('uapi/') || clean.startsWith('asm/')) {
        add(path.resolve(rootAbs, 'include', clean));
        add(path.resolve(rootAbs, 'include', 'uapi', clean.replace(/^uapi\//, '')));
        add(path.resolve(rootAbs, 'arch', clean));
    }

    if (!clean.includes('/') && path.posix.extname(clean).length > 0) {
        add(path.resolve(rootAbs, 'include', clean));
        add(path.resolve(rootAbs, 'include/generated', clean));
    }

    for (const candidatePath of candidates) {
        if (statCache.has(candidatePath)) {
            if (statCache.get(candidatePath)) return { match: true, matchedPath: candidatePath };
            continue;
        }

        let isFile = false;
        if (fs.existsSync(candidatePath)) {
            try {
                if (fs.statSync(candidatePath).isFile()) {
                    isFile = true;
                }
            } catch {
                // ignore
            }
        }
        
        statCache.set(candidatePath, isFile);
        if (isFile) return { match: true, matchedPath: candidatePath };
    }

    if (suffixIndex && suffixIndex.has(lowerClean)) {
        return { match: true, matchedPath: lowerClean };
    }

    return { match: false };
}

function classifyReference(
    ref: ResolvedReference,
    projectRoot?: string,
    suffixIndex?: Set<string>
): {
    classification: GhostClassification;
    category: GhostCategory;
    reason: string;
    matchedPath?: string;
    originType: GhostOriginType;
    ecosystem: GhostEcosystem;
} {
    const candidate = ref.fullPath || ref.originalTarget || ref.targetId;
    const category = getGhostCategory(candidate);
    const semantic = semanticFrom(ref, candidate);
    const originType = semantic.originType;
    const ecosystem = semantic.ecosystem;

    if (isParserArtifact(candidate)) {
        return { classification: 'parserArtifact', category, reason: 'macro_or_parser_token', originType, ecosystem };
    }

    const internal = isResolvableInternal(candidate, ref.sourceId, projectRoot, suffixIndex);
    if (internal.match) {
        return {
            classification: 'resolvableInternal',
            category,
            reason: internal.matchedPath ? `resolved_path:${internal.matchedPath}` : 'resolved_path',
            originType,
            ecosystem
        };
    }

    return { classification: 'validExternal', category, reason: 'external_or_unmapped', originType, ecosystem };
}

function decideAction(
    validExternal: number,
    resolvableInternal: number,
    parserArtifact: number,
    total: number
): { decision: GhostActionDecision; confidence: number } {
    if (total === 0) return { decision: 'REVIEW', confidence: 0 };

    const resolvableRatio = resolvableInternal / total;
    const parserRatio = parserArtifact / total;
    const externalRatio = validExternal / total;

    if (resolvableRatio >= 0.6) {
        return { decision: 'INCLUDE_RESOLUTION', confidence: Number(resolvableRatio.toFixed(4)) };
    }

    if (parserRatio >= 0.4) {
        return { decision: 'PARSER_FILTER', confidence: Number(parserRatio.toFixed(4)) };
    }

    if (externalRatio >= 0.4) {
        return { decision: 'KEEP_GHOST_CLUSTER', confidence: Number(externalRatio.toFixed(4)) };
    }

    return { decision: 'REVIEW', confidence: Number(Math.max(resolvableRatio, parserRatio, externalRatio).toFixed(4)) };
}

export class GhostClassifier {
    public static inspect(params: {
        ghostNodes: Node[];
        resolvedReferences: ResolvedReference[];
        projectRoot?: string;
        existingNodeIds: ReadonlySet<string>;
    }): GhostClassificationReport {
        const externalNodes = params.ghostNodes.filter(n => n.type === 'external' || n.cluster_id === 'cluster_ghosts');
        Logger.info(`[GHOST_V2_ENTRY] totalExternal=${externalNodes.length} totalGhostNodes=${params.ghostNodes.length}`);

        const unresolved = params.resolvedReferences.filter(r => r.resolutionKind === 'unresolved');
        const unresolvedByTarget = new Map<string, ResolvedReference[]>();
        const unresolvedByTargetSources = new Map<string, Set<string>>();

        for (const ref of unresolved) {
            const target = stripDecorations(ref.targetId || ref.originalTarget || '').toLowerCase();
            if (!target) continue;

            if (!unresolvedByTarget.has(target)) unresolvedByTarget.set(target, []);
            unresolvedByTarget.get(target)!.push(ref);

            if (!unresolvedByTargetSources.has(target)) unresolvedByTargetSources.set(target, new Set<string>());
            unresolvedByTargetSources.get(target)!.add(ref.sourceId);
        }

        const suffixIndex = buildSuffixIndex(params.existingNodeIds);
        const targetEntries = Array.from(unresolvedByTarget.entries());

        const classificationCounts = {
            validExternal: 0,
            resolvableInternal: 0,
            parserArtifact: 0
        };

        const originTypeCounts: Record<GhostOriginType, number> = {
            IncludeReference: 0,
            ImportReference: 0,
            PackageReference: 0,
            ToolchainReference: 0,
            DocumentationReference: 0,
            CommandArgument: 0,
            LicenseToken: 0,
            ShellLiteral: 0,
            Unknown: 0
        };

        const ecosystemCounts: Record<GhostEcosystem, number> = {
            C_RUNTIME: 0,
            PYTHON: 0,
            RUST: 0,
            TOOLCHAIN: 0,
            PACKAGE: 0,
            NODE: 0,
            ELECTRON: 0,
            DOCUMENTATION: 0,
            UNKNOWN: 0
        };

        const extStats = {
            total: targetEntries.length,
            header: 0,
            source: 0,
            rust: 0,
            symbol: 0,
            unknown: 0
        };

        const targetStats: Array<{ target: string; count: number }> = [];
        const originStats: Array<{ target: string; referencedByCount: number; sampleSources: string[] }> = [];
        const unknownTopTargets: Array<{ target: string; count: number; sourceExt: string }> = [];
        const unknownBySourceExt: Record<string, number> = {};

        const nodeByTarget = new Map<string, Node[]>();
        for (const node of params.ghostNodes) {
            if (node.type !== 'external' && node.cluster_id !== 'cluster_ghosts') continue;
            const key = stripDecorations((node.data as any)?.file || node.id).toLowerCase();
            if (!nodeByTarget.has(key)) nodeByTarget.set(key, []);
            nodeByTarget.get(key)!.push(node);
        }

        console.time('ghost-classification-core');
        for (const [target, refsForTarget] of targetEntries) {
            const representative = refsForTarget[0];
            const resolved = classifyReference(representative, params.projectRoot, suffixIndex);
            const sourceExt = getSourceExt(representative.sourceId) || '<none>';

            classificationCounts[resolved.classification]++;
            extStats[getGhostCategory(target)]++;
            originTypeCounts[resolved.originType] = (originTypeCounts[resolved.originType] || 0) + 1;
            ecosystemCounts[resolved.ecosystem] = (ecosystemCounts[resolved.ecosystem] || 0) + 1;
            targetStats.push({ target, count: refsForTarget.length });

            if (resolved.originType === 'Unknown' || resolved.ecosystem === 'UNKNOWN') {
                unknownTopTargets.push({ target, count: refsForTarget.length, sourceExt });
                unknownBySourceExt[sourceExt] = (unknownBySourceExt[sourceExt] || 0) + 1;
            }

            const sources = Array.from(unresolvedByTargetSources.get(target) || []);
            originStats.push({
                target,
                referencedByCount: sources.length,
                sampleSources: sources.slice(0, 5)
            });

            const nodes = nodeByTarget.get(target) || [];
            for (const node of nodes) {
                if (!node.data) node.data = {} as any;
                (node.data as any).ghost_classification = resolved.classification;
                (node.data as any).ghost_category = resolved.category;
                (node.data as any).ghost_reason = resolved.reason;
                Object.assign((node.data as any), makeExternalSemantic(resolved.originType, resolved.ecosystem));
            }
        }
        console.timeEnd('ghost-classification-core');

        console.time('ghost-stats');
        targetStats.sort((a, b) => b.count - a.count);
        originStats.sort((a, b) => b.referencedByCount - a.referencedByCount);
        unknownTopTargets.sort((a, b) => b.count - a.count);

        const decision = decideAction(
            classificationCounts.validExternal,
            classificationCounts.resolvableInternal,
            classificationCounts.parserArtifact,
            extStats.total
        );

        const totalV2 = extStats.total || 1;
        const unknownCount = ecosystemCounts.UNKNOWN;
        const commandArgumentCount = originTypeCounts.CommandArgument;
        const licenseTokenCount = originTypeCounts.LicenseToken;
        const unknownRatio = unknownCount / totalV2;
        const commandArgumentRatio = commandArgumentCount / totalV2;
        const licenseTokenRatio = licenseTokenCount / totalV2;
        const thresholdUnknownRatio = 0.05;
        const readyForV2B = unknownRatio <= thresholdUnknownRatio;

        const v2Gate = {
            total: extStats.total,
            unknownCount,
            unknownRatio: Number(unknownRatio.toFixed(4)),
            commandArgumentCount,
            commandArgumentRatio: Number(commandArgumentRatio.toFixed(4)),
            licenseTokenCount,
            licenseTokenRatio: Number(licenseTokenRatio.toFixed(4)),
            readyForV2B,
            thresholdUnknownRatio
        };

        Logger.info(`[GHOST_UNKNOWN_COUNT] ${unknownCount}`);

        const diagnosticLines: string[] = [
            `[GHOST_EXT_STATS] ${JSON.stringify(extStats)}`,
            `[GHOST_TOP20] ${JSON.stringify(targetStats.slice(0, 20))}`,
            `[GHOST_ORIGIN_TOP20] ${JSON.stringify(originStats.slice(0, 20))}`,
            `[GHOST_CLASSIFICATION] ${JSON.stringify({
                total: extStats.total,
                validExternal: classificationCounts.validExternal,
                resolvableInternal: classificationCounts.resolvableInternal,
                parserArtifact: classificationCounts.parserArtifact
            })}`
        ];

        Logger.info(`[GHOST_CLASSIFICATION_V2_BEFORE] total=${extStats.total}`);
        try {
            diagnosticLines.push(`[GHOST_CLASSIFICATION_V2] ${JSON.stringify({
                byOriginType: originTypeCounts,
                byEcosystem: ecosystemCounts
            })}`);
        } catch (e: any) {
            Logger.error(`[GHOST_CLASSIFICATION_V2_ERROR] ${String(e?.message || e)}`);
        }

        diagnosticLines.push(`[GHOST_UNKNOWN_TOP50] ${JSON.stringify(unknownTopTargets.slice(0, 50))}`);
        diagnosticLines.push(`[GHOST_UNKNOWN_SOURCE_EXT] ${JSON.stringify(unknownBySourceExt)}`);
        diagnosticLines.push(`[GHOST_V2_GATE] ${JSON.stringify(v2Gate)}`);
        diagnosticLines.push(`[ACTION_DECISION] ${JSON.stringify(decision)}`);

        const diagnosticText = diagnosticLines.join('\n');
        for (const line of diagnosticLines) {
            Logger.info(line);
        }
        console.timeEnd('ghost-stats');

        return {
            total: extStats.total,
            extStats,
            topTargets: targetStats.slice(0, 20),
            originTopTargets: originStats.slice(0, 20),
            classification: {
                total: extStats.total,
                validExternal: classificationCounts.validExternal,
                resolvableInternal: classificationCounts.resolvableInternal,
                parserArtifact: classificationCounts.parserArtifact
            },
            classificationV2: {
                byOriginType: originTypeCounts,
                byEcosystem: ecosystemCounts
            },
            unknownDiagnostics: {
                unknownTopTargets: unknownTopTargets.slice(0, 50),
                unknownBySourceExt
            },
            v2Gate,
            decision,
            diagnosticText
        };
    }
}