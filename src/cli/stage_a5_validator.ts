import * as fs from 'fs';
import * as path from 'path';
import { detectCommunities } from '../core/CommunityDetector';
import { MetricsCalculator, CommunityMetrics, DominanceCalculator, NodeMetadataExtractor, ThresholdProfile, DiagnosisEngine } from './signal_laboratory';

interface Node {
    id?: string;
    name?: string;
    type?: string;
    label?: string;
    filePath?: string;
    status?: string;
    role?: string;
    layer?: string;
    data?: Record<string, any>;
}
interface Edge { source?: any; target?: any; from?: any; to?: any; type?: string; weight?: number; }

interface CentralityContributor {
    nodeId: string;
    value: number;
    shareInCommunity: number;
}

interface ConcentrationSummary {
    top1: number;
    top3: number;
    top5: number;
    effectiveNodeCount: number;
}

interface DensitySummary {
    trafficPerNodePct: number;
    dependencyPerNodePct: number;
    ecosystemPerNodePct: number;
    trafficRelative: number;
    dependencyRelative: number;
    ecosystemRelative: number;
}

interface HubGravitySummary {
    average: number;
    p90: number;
    top: Array<{ nodeId: string; value: number; globalDegree: number; localDegree: number }>;
}

interface LouvainWeightSummary {
    edgeCount: number;
    mean: number;
    p90: number;
    min: number;
    max: number;
}

interface ContinentAssessment {
    score: number;
    sizeScore: number;
    entropyScore: number;
    hubGravityScore: number;
    prDispersionScore: number;
    isContinent: boolean;
}

interface SpeciesDecision {
    baseSpecies: string;
    finalSpecies: string;
    confidence?: number;
    scoreName?: string;
}

interface SemanticGraphFilterResult {
    nodes: Node[];
    edges: Edge[];
    removedNodeCount: number;
    explicitGhostCount: number;
    promotedHeaderGhostCount: number;
    headerDegreeThreshold: number;
}

function normalizeEndpoint(raw: any, workspaceRoot: string): string {
    if (typeof raw !== 'string') return '';
    const normalized = raw.replace(/\\/g, '/').trim();
    if (!normalized) return '';
    if (normalized.startsWith('external://')) return normalized;

    const rootNormalized = workspaceRoot.replace(/\\/g, '/');
    if (rootNormalized && normalized.startsWith(rootNormalized + '/')) {
        return normalized.slice(rootNormalized.length + 1);
    }

    return normalized.replace(/^\.?\//, '').replace(/^\/+/, '');
}

function resolveEndpoint(raw: any, nodeIdSet: Set<string>, workspaceRoot: string): string {
    if (typeof raw === 'object' && raw) {
        const objectId = raw.id || raw.name || raw.label;
        if (typeof objectId === 'string' && nodeIdSet.has(objectId)) return objectId;
        const normalizedObjectId = normalizeEndpoint(objectId, workspaceRoot);
        if (nodeIdSet.has(normalizedObjectId)) return normalizedObjectId;
    }

    if (typeof raw !== 'string') return '';
    if (nodeIdSet.has(raw)) return raw;

    const normalized = normalizeEndpoint(raw, workspaceRoot);
    if (nodeIdSet.has(normalized)) return normalized;

    return raw;
}

function getEdgeEndpoints(edge: Edge, nodeIdSet: Set<string>, workspaceRoot: string): { s: string; t: string; valid: boolean } {
    const sRaw = edge.source !== undefined ? edge.source : edge.from;
    const tRaw = edge.target !== undefined ? edge.target : edge.to;
    const s = resolveEndpoint(sRaw, nodeIdSet, workspaceRoot);
    const t = resolveEndpoint(tRaw, nodeIdSet, workspaceRoot);
    return { s, t, valid: nodeIdSet.has(s) && nodeIdSet.has(t) };
}

function getNodeId(node: Node): string {
    return node.id || node.name || '';
}

function firstPathSegment(nodeId: string): string {
    const normalized = nodeId.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = normalized.split('/').filter(Boolean);
    return parts[0] || normalized;
}

function isHeaderLike(nodeId: string): boolean {
    const n = nodeId.toLowerCase();
    return n.endsWith('.h') || n.endsWith('.hh') || n.endsWith('.hpp') || n.endsWith('.hxx') || n.endsWith('.inc');
}

function isInfrastructureHeaderPath(nodeId: string): boolean {
    const n = nodeId.toLowerCase();
    return (
        n.startsWith('include/')
        || n.includes('/include/')
        || n.includes('/uapi/')
        || n.startsWith('uapi/')
        || n.startsWith('asm/')
        || n.includes('/asm/')
        || n.includes('asm-generic')
    );
}

function isExplicitGhostNode(node: Node, nodeId: string): boolean {
    const filePath = (node.filePath || '').toLowerCase();
    const status = (node.status || '').toLowerCase();
    const role = (node.role || '').toLowerCase();
    const layer = (node.layer || '').toLowerCase();
    const dataLayer = String(node.data?.layer || '').toLowerCase();

    if (filePath.startsWith('external://') || filePath.startsWith('ghost://')) return true;
    if (status === 'ghost') return true;
    if (role === 'ghost' || role === 'external') return true;
    if (layer === 'external' || dataLayer === 'external') return true;
    if (nodeId.startsWith('external://') || nodeId.startsWith('ghost://')) return true;
    return false;
}

function buildSemanticGraphFilter(
    rawNodes: Node[],
    rawEdges: Edge[],
    workspaceRoot: string
): SemanticGraphFilterResult {
    const nodeById = new Map<string, Node>();
    const rawNodeIds: string[] = [];
    for (const node of rawNodes) {
        const id = getNodeId(node);
        if (!id) continue;
        rawNodeIds.push(id);
        nodeById.set(id, node);
    }

    const rawNodeIdSet = new Set(rawNodeIds);
    const degreeMap = new Map<string, number>();
    const neighborSegments = new Map<string, Set<string>>();

    for (const edge of rawEdges) {
        const { s, t, valid } = getEdgeEndpoints(edge, rawNodeIdSet, workspaceRoot);
        if (!valid) continue;
        degreeMap.set(s, (degreeMap.get(s) || 0) + 1);
        degreeMap.set(t, (degreeMap.get(t) || 0) + 1);

        if (!neighborSegments.has(s)) neighborSegments.set(s, new Set<string>());
        if (!neighborSegments.has(t)) neighborSegments.set(t, new Set<string>());
        neighborSegments.get(s)!.add(firstPathSegment(t));
        neighborSegments.get(t)!.add(firstPathSegment(s));
    }

    const explicitGhostSet = new Set<string>();
    for (const id of rawNodeIds) {
        const node = nodeById.get(id)!;
        if (isExplicitGhostNode(node, id)) explicitGhostSet.add(id);
    }

    const headerCandidates: number[] = [];
    for (const id of rawNodeIds) {
        if (explicitGhostSet.has(id)) continue;
        if (!isHeaderLike(id)) continue;
        if (!isInfrastructureHeaderPath(id)) continue;
        headerCandidates.push(degreeMap.get(id) || 0);
    }
    headerCandidates.sort((a, b) => a - b);

    let headerDegreeThreshold = Number.POSITIVE_INFINITY;
    if (rawNodeIds.length >= 5000 && headerCandidates.length > 0) {
        headerDegreeThreshold = Math.max(200, percentile(headerCandidates, 0.92));
    }

    const promotedHeaderSet = new Set<string>();
    if (Number.isFinite(headerDegreeThreshold)) {
        for (const id of rawNodeIds) {
            if (explicitGhostSet.has(id)) continue;
            if (!isHeaderLike(id) || !isInfrastructureHeaderPath(id)) continue;

            const degree = degreeMap.get(id) || 0;
            if (degree < headerDegreeThreshold) continue;

            const segmentDiversity = neighborSegments.get(id)?.size || 0;
            if (segmentDiversity < 5) continue;

            promotedHeaderSet.add(id);
        }
    }

    const removedSet = new Set<string>([...explicitGhostSet, ...promotedHeaderSet]);
    const filteredNodes = rawNodes.filter((node) => {
        const id = getNodeId(node);
        return !!id && !removedSet.has(id);
    });
    const filteredNodeIdSet = new Set(filteredNodes.map((n) => getNodeId(n)).filter(Boolean));
    const filteredEdges = rawEdges.filter((edge) => {
        const { s, t, valid } = getEdgeEndpoints(edge, rawNodeIdSet, workspaceRoot);
        return valid && filteredNodeIdSet.has(s) && filteredNodeIdSet.has(t);
    });

    return {
        nodes: filteredNodes,
        edges: filteredEdges,
        removedNodeCount: removedSet.size,
        explicitGhostCount: explicitGhostSet.size,
        promotedHeaderGhostCount: promotedHeaderSet.size,
        headerDegreeThreshold: Number.isFinite(headerDegreeThreshold) ? headerDegreeThreshold : 0
    };
}

function topCentralityContributors(
    members: string[],
    valueMap: Map<string, number>,
    topN: number
): CentralityContributor[] {
    const rows = members.map((nodeId) => ({
        nodeId,
        value: valueMap.get(nodeId) || 0
    }));
    rows.sort((a, b) => b.value - a.value || a.nodeId.localeCompare(b.nodeId));

    const communitySum = rows.reduce((acc, row) => acc + row.value, 0);
    const denom = communitySum > 0 ? communitySum : 1;

    return rows.slice(0, topN).map((row) => ({
        nodeId: row.nodeId,
        value: row.value,
        shareInCommunity: row.value / denom
    }));
}

function concentrationSummary(members: string[], valueMap: Map<string, number>): ConcentrationSummary {
    const values = members
        .map((nodeId) => valueMap.get(nodeId) || 0)
        .sort((a, b) => b - a);

    const sum = values.reduce((acc, v) => acc + v, 0);
    if (sum <= 0) {
        return { top1: 0, top3: 0, top5: 0, effectiveNodeCount: 0 };
    }

    const normalized = values.map((v) => v / sum);
    const top1 = normalized.slice(0, 1).reduce((acc, v) => acc + v, 0);
    const top3 = normalized.slice(0, 3).reduce((acc, v) => acc + v, 0);
    const top5 = normalized.slice(0, 5).reduce((acc, v) => acc + v, 0);
    const hhi = normalized.reduce((acc, p) => acc + p * p, 0);

    return {
        top1,
        top3,
        top5,
        effectiveNodeCount: hhi > 0 ? 1 / hhi : 0
    };
}

function globalDistributionSummary(nodes: string[], valueMap: Map<string, number>): { mean: number; std: number; cv: number; nonZero: number } {
    if (nodes.length === 0) return { mean: 0, std: 0, cv: 0, nonZero: 0 };
    const values = nodes.map((n) => valueMap.get(n) || 0);
    const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / values.length;
    const std = Math.sqrt(variance);
    const cv = mean > 0 ? std / mean : 0;
    const nonZero = values.filter((v) => v > 1e-12).length;
    return { mean, std, cv, nonZero };
}

function computeDensitySummary(
    communitySize: number,
    dom: { size: number; traffic: number; dependency: number; ecosystem: number }
): DensitySummary {
    const safeSize = communitySize > 0 ? communitySize : 1;
    const safeSizeDom = dom.size > 0 ? dom.size : Number.EPSILON;

    return {
        trafficPerNodePct: (dom.traffic * 100) / safeSize,
        dependencyPerNodePct: (dom.dependency * 100) / safeSize,
        ecosystemPerNodePct: (dom.ecosystem * 100) / safeSize,
        trafficRelative: dom.traffic / safeSizeDom,
        dependencyRelative: dom.dependency / safeSizeDom,
        ecosystemRelative: dom.ecosystem / safeSizeDom
    };
}

function percentile(sortedValues: number[], q: number): number {
    if (sortedValues.length === 0) return 0;
    const clamped = Math.max(0, Math.min(1, q));
    const idx = Math.min(sortedValues.length - 1, Math.floor(clamped * (sortedValues.length - 1)));
    return sortedValues[idx];
}

function computeHubGravitySummary(
    members: string[],
    globalDegree: Map<string, number>,
    localDegreeMap: Map<string, number>
): HubGravitySummary {
    const rows = members.map((nodeId) => {
        const g = globalDegree.get(nodeId) || 0;
        const l = localDegreeMap.get(nodeId) || 0;
        const safeLocal = l > 0 ? l : 1;
        return {
            nodeId,
            value: g / safeLocal,
            globalDegree: g,
            localDegree: l
        };
    });

    const values = rows.map((r) => r.value).sort((a, b) => a - b);
    const average = rows.length > 0 ? rows.reduce((acc, r) => acc + r.value, 0) / rows.length : 0;
    const p90 = percentile(values, 0.9);
    rows.sort((a, b) => b.value - a.value || b.globalDegree - a.globalDegree || a.nodeId.localeCompare(b.nodeId));

    return {
        average,
        p90,
        top: rows.slice(0, 5)
    };
}

function buildLouvainWeightedEdges(
    edges: Edge[],
    nodeIdSet: Set<string>,
    workspaceRoot: string,
    globalDegree: Map<string, number>
): { edges: Edge[]; summary: LouvainWeightSummary } {
    const srcOut = new Map<string, number>();
    const tgtIn = new Map<string, number>();
    const validPairs: Array<{ s: string; t: string; base: number }> = [];

    for (const edge of edges) {
        const { s, t, valid } = getEdgeEndpoints(edge, nodeIdSet, workspaceRoot);
        if (!valid) continue;
        const base = (edge.weight && edge.weight > 0) ? edge.weight : 1;
        validPairs.push({ s, t, base });
        srcOut.set(s, (srcOut.get(s) || 0) + 1);
        tgtIn.set(t, (tgtIn.get(t) || 0) + 1);
    }

    const nodeCount = Math.max(1, nodeIdSet.size);
    const idfScale = Math.log(nodeCount + 1) + 1;
    const weightedEdges: Edge[] = [];
    const weights: number[] = [];

    for (const pair of validPairs) {
        const out = srcOut.get(pair.s) || 1;
        const incoming = tgtIn.get(pair.t) || 0;
        const sourceGlobal = globalDegree.get(pair.s) || 0;
        const targetGlobal = globalDegree.get(pair.t) || 0;

        const idf = Math.log((nodeCount + 1) / (incoming + 1)) + 1;
        const idfNorm = Math.max(0.05, Math.min(1.0, idf / idfScale));
        const sourcePenalty = 1 / (1 + Math.log(out + 1) / 10);
        const hubPenalty = 1 / (1 + Math.log(Math.max(sourceGlobal, targetGlobal) + 1) / 10);

        // Conservative blend: preserve base topology while reducing ubiquitous hub-driven links.
        const modulation = idfNorm * sourcePenalty * hubPenalty;
        const weighted = Math.max(1e-9, pair.base * (0.7 + 0.3 * modulation));

        weightedEdges.push({ from: pair.s, to: pair.t, weight: weighted, type: 'INCLUDE' });
        weights.push(weighted);
    }

    const sorted = weights.slice().sort((a, b) => a - b);
    const sum = weights.reduce((acc, v) => acc + v, 0);
    return {
        edges: weightedEdges,
        summary: {
            edgeCount: weightedEdges.length,
            mean: weights.length > 0 ? sum / weights.length : 0,
            p90: percentile(sorted, 0.9),
            min: sorted[0] || 0,
            max: sorted[sorted.length - 1] || 0
        }
    };
}

function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

function computeContinentAssessment(input: {
    size: number;
    pathEntropy: number;
    pathPurity: number;
    hubP90: number;
    prEffectiveNodes: number;
}): ContinentAssessment {
    const sizeScore = clamp01(input.size / 7000);
    const entropyScore = clamp01(input.pathEntropy / 6);
    const hubGravityScore = clamp01(input.hubP90 / 3);
    const prDispersionScore = clamp01(input.prEffectiveNodes / 120);
    const score = (sizeScore + entropyScore + hubGravityScore + prDispersionScore) / 4;
    const isContinent = input.size >= 5000 && input.pathPurity <= 0.5 && score >= 0.7;
    return { score, sizeScore, entropyScore, hubGravityScore, prDispersionScore, isContinent };
}

function buildSecondPassEdgesForMembers(
    members: string[],
    edges: Edge[],
    nodeIdSet: Set<string>,
    workspaceRoot: string,
    prMap: Map<string, number>,
    prGlobalMean: number,
    prGlobalStd: number
): Edge[] {
    const memberSet = new Set(members);
    const hubNodes = new Set<string>();
    const safeStd = prGlobalStd > 0 ? prGlobalStd : 1;

    for (const nodeId of members) {
        const pr = prMap.get(nodeId) || 0;
        const z = (pr - prGlobalMean) / safeStd;
        if (z > 3) hubNodes.add(nodeId);
    }

    const result: Edge[] = [];
    for (const edge of edges) {
        const { s, t, valid } = getEdgeEndpoints(edge, nodeIdSet, workspaceRoot);
        if (!valid) continue;
        if (!memberSet.has(s) || !memberSet.has(t)) continue;

        const base = (edge.weight && edge.weight > 0) ? edge.weight : 1;
        const attenuated = (hubNodes.has(s) || hubNodes.has(t)) ? base * 0.2 : base;
        result.push({ from: s, to: t, weight: Math.max(1e-9, attenuated), type: 'INCLUDE' });
    }
    return result;
}

function classifySpecies(input: {
    size: number;
    isNoise: boolean;
    pathPurity: number;
    structuralPurity: number;
    prConcentration: ConcentrationSummary;
    evConcentration: ConcentrationSummary;
    density: DensitySummary;
    hubP90?: number;
    pathEntropy?: number;
}): string {
    if (input.isNoise) {
        return 'Noise Cluster';
    }

    if (input.size <= 3 && input.evConcentration.top1 >= 0.9) {
        return 'Isolated Cluster';
    }

    if (input.pathPurity >= 0.85 && input.prConcentration.top1 >= 0.5) {
        return 'Contract Core';
    }

    if (
        input.prConcentration.effectiveNodeCount < 10 &&
        (input.prConcentration.top1 >= 0.30 || input.prConcentration.top3 >= 0.60)
    ) {
        return 'Utility Cluster';
    }

    if (
        input.pathPurity < 0.2 &&
        input.structuralPurity < 0.55 &&
        input.evConcentration.top1 < 0.03 &&
        input.evConcentration.effectiveNodeCount >= 1000
    ) {
        return 'Infrastructure Mesh';
    }

    if (input.density.trafficRelative >= 2.0 && input.density.dependencyRelative >= 2.0 && input.density.ecosystemRelative >= 2.0) {
        return 'Infrastructure Core';
    }

    if (input.density.ecosystemRelative >= 2.5 && input.density.trafficRelative >= 1.8 && input.evConcentration.effectiveNodeCount >= 10) {
        return 'Execution Core';
    }

    if (input.structuralPurity < 0.35 && input.density.trafficRelative >= 1.2 && input.density.dependencyRelative < 1.2) {
        return 'Bridge Cluster';
    }

    if (input.pathPurity >= 0.7 && input.structuralPurity >= 0.55) {
        return 'Subsystem Core';
    }

    if (input.size <= 8 && input.density.trafficRelative < 1.2 && input.density.ecosystemRelative < 1.2) {
        return 'Utility Cluster';
    }

    const nearBalanced = Math.abs(input.density.trafficRelative - 1.0) <= 0.35
        && Math.abs(input.density.dependencyRelative - 1.0) <= 0.35
        && Math.abs(input.density.ecosystemRelative - 1.0) <= 0.35;
    if (nearBalanced) {
        return 'Balanced Community';
    }

    // B.5.5-2: split Mixed into semantic subtypes before any merge-back phase.
    const hubP90 = input.hubP90 || 0;
    const pathEntropy = input.pathEntropy || 0;

    if (input.structuralPurity < 0.30 && hubP90 >= 3.0) {
        return 'Mixed: Bridge Residue';
    }

    if (input.prConcentration.top1 >= 0.18 && input.prConcentration.top3 >= 0.40 && input.pathPurity < 0.60) {
        return 'Mixed: Contract Hub';
    }

    if (
        input.density.ecosystemRelative >= 1.20 &&
        input.density.trafficRelative >= 1.00 &&
        input.evConcentration.effectiveNodeCount >= 100 &&
        pathEntropy >= 3.0
    ) {
        return 'Mixed: Execution Layer';
    }

    if (
        input.prConcentration.effectiveNodeCount < 25 &&
        (input.prConcentration.top1 >= 0.20 || input.prConcentration.top3 >= 0.50)
    ) {
        return 'Mixed: Utility Residual';
    }

    return 'Mixed Core';
}

function computeBridgeScore(input: {
    structuralPurity: number;
    hubP90: number;
    pathEntropy: number;
}): number {
    const externalRatio = clamp01(1 - input.structuralPurity);
    const hubGravity = clamp01(input.hubP90 / 5);
    const pathDiversity = clamp01(input.pathEntropy / 6);
    return clamp01(0.4 * externalRatio + 0.3 * hubGravity + 0.3 * pathDiversity);
}

function computeUtilityScore(input: {
    prConcentration: ConcentrationSummary;
    density: DensitySummary;
}): number {
    const concentrationSignal = clamp01(
        ((input.prConcentration.top1 / 0.30) + (input.prConcentration.top3 / 0.60)) / 2
    );
    const compactnessSignal = clamp01(
        (25 - Math.min(25, input.prConcentration.effectiveNodeCount)) / 25
    );
    const lowEcosystemSignal = clamp01((1.5 - input.density.ecosystemRelative) / 1.5);
    return clamp01(0.5 * concentrationSignal + 0.3 * compactnessSignal + 0.2 * lowEcosystemSignal);
}

function computeContractScore(input: {
    pathPurity: number;
    structuralPurity: number;
    prConcentration: ConcentrationSummary;
}): number {
    const pathSignal = clamp01(input.pathPurity);
    const concentrationSignal = clamp01(
        ((input.prConcentration.top1 / 0.50) + (input.prConcentration.top3 / 0.70)) / 2
    );
    const cohesionSignal = clamp01(input.structuralPurity / 0.85);
    return clamp01(0.4 * pathSignal + 0.3 * concentrationSignal + 0.3 * cohesionSignal);
}

function applySpeciesPromotionPolicy(input: {
    baseSpecies: string;
    pathPurity: number;
    structuralPurity: number;
    prConcentration: ConcentrationSummary;
    density: DensitySummary;
    hubP90: number;
    pathEntropy: number;
}): SpeciesDecision {
    const PROMOTE_THRESHOLD = 0.8;
    const CANDIDATE_THRESHOLD = 0.6;

    if (input.baseSpecies === 'Mixed: Bridge Residue' || input.baseSpecies === 'Bridge Cluster') {
        const score = computeBridgeScore({
            structuralPurity: input.structuralPurity,
            hubP90: input.hubP90,
            pathEntropy: input.pathEntropy
        });

        if (input.baseSpecies === 'Bridge Cluster' && score < PROMOTE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Bridge Candidate',
                confidence: score,
                scoreName: 'Bridge Score'
            };
        }

        if (score >= PROMOTE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Bridge Cluster',
                confidence: score,
                scoreName: 'Bridge Score'
            };
        }

        if (score >= CANDIDATE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Bridge Candidate',
                confidence: score,
                scoreName: 'Bridge Score'
            };
        }
    }

    if (input.baseSpecies === 'Mixed: Utility Residual' || input.baseSpecies === 'Utility Cluster') {
        const score = computeUtilityScore({
            prConcentration: input.prConcentration,
            density: input.density
        });

        if (input.baseSpecies === 'Utility Cluster' && score < PROMOTE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Utility Candidate',
                confidence: score,
                scoreName: 'Utility Score'
            };
        }

        if (score >= PROMOTE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Utility Cluster',
                confidence: score,
                scoreName: 'Utility Score'
            };
        }

        if (score >= CANDIDATE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Utility Candidate',
                confidence: score,
                scoreName: 'Utility Score'
            };
        }
    }

    if (input.baseSpecies === 'Mixed: Contract Hub' || input.baseSpecies === 'Contract Core') {
        const score = computeContractScore({
            pathPurity: input.pathPurity,
            structuralPurity: input.structuralPurity,
            prConcentration: input.prConcentration
        });

        if (input.baseSpecies === 'Contract Core' && score < PROMOTE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Contract Candidate',
                confidence: score,
                scoreName: 'Contract Score'
            };
        }

        if (score >= PROMOTE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Contract Core',
                confidence: score,
                scoreName: 'Contract Score'
            };
        }

        if (score >= CANDIDATE_THRESHOLD) {
            return {
                baseSpecies: input.baseSpecies,
                finalSpecies: 'Contract Candidate',
                confidence: score,
                scoreName: 'Contract Score'
            };
        }
    }

    return {
        baseSpecies: input.baseSpecies,
        finalSpecies: input.baseSpecies
    };
}

class DefaultNodeExtractor implements NodeMetadataExtractor {
    extract(nodeId: string): Record<string, string> {
        const parts = nodeId.split(/[\/\\]/);
        const pathDim = parts.length > 2 ? `${parts[0]}/${parts[1]}` : (parts.length > 1 ? parts[0] : 'root');
        
        const extMatch = nodeId.match(/\.([a-z0-9]+)$/i);
        const lang = extMatch ? extMatch[1] : 'unknown';
        
        return {
            path: pathDim,
            language: lang
        };
    }
}

class GraphCentrality {
    static computeDegree(nodes: string[], edges: Edge[], nodeIdSet: Set<string>, workspaceRoot: string): Map<string, number> {
        const degree = new Map<string, number>();
        for (const n of nodes) degree.set(n, 0);
        for (const e of edges) {
            const { s, t, valid } = getEdgeEndpoints(e, nodeIdSet, workspaceRoot);
            if (!valid) continue;
            degree.set(s, (degree.get(s) || 0) + 1);
            degree.set(t, (degree.get(t) || 0) + 1);
        }
        return degree;
    }

    static computePageRank(nodes: string[], edges: Edge[], nodeIdSet: Set<string>, workspaceRoot: string, iters = 20, damping = 0.85): Map<string, number> {
        let pr = new Map<string, number>();
        const N = nodes.length;
        if (N===0) return pr;
        for (const n of nodes) pr.set(n, 1.0 / N);
        
        const outDegree = new Map<string, number>();
        const inEdges = new Map<string, string[]>();
        for (const e of edges) {
            const { s, t, valid } = getEdgeEndpoints(e, nodeIdSet, workspaceRoot);
            if (!valid) continue;
            outDegree.set(s, (outDegree.get(s) || 0) + 1);
            if (!inEdges.has(t)) inEdges.set(t, []);
            inEdges.get(t)!.push(s);
        }

        for (let i = 0; i < iters; i++) {
            const nextPr = new Map<string, number>();
            for (const n of nodes) {
                let sum = 0;
                const incoming = inEdges.get(n) || [];
                for (const inc of incoming) {
                    sum += pr.get(inc)! / (outDegree.get(inc) || 1);
                }
                nextPr.set(n, (1 - damping) / N + damping * sum);
            }
            pr = nextPr;
        }
        return pr;
    }

    static computeEigenvector(nodes: string[], edges: Edge[], nodeIdSet: Set<string>, workspaceRoot: string, iters = 20): Map<string, number> {
        let ev = new Map<string, number>();
        for (const n of nodes) ev.set(n, 1.0);
        
        const adj = new Map<string, string[]>();
        for (const e of edges) {
            const { s, t, valid } = getEdgeEndpoints(e, nodeIdSet, workspaceRoot);
            if (!valid) continue;
            if (!adj.has(s)) adj.set(s, []);
            if (!adj.has(t)) adj.set(t, []);
            adj.get(s)!.push(t);
            adj.get(t)!.push(s);
        }

        for (let i = 0; i < iters; i++) {
            const nextEv = new Map<string, number>();
            let norm = 0;
            for (const n of nodes) {
                let sum = 0;
                const neighbors = adj.get(n) || [];
                for (const neighbor of neighbors) {
                    sum += ev.get(neighbor) || 0;
                }
                nextEv.set(n, sum);
                norm += sum * sum;
            }
            norm = Math.sqrt(norm) || 1;
            for (const n of nodes) ev.set(n, nextEv.get(n)! / norm);
        }
        return ev;
    }
}

export function runStageB5Validation(graphFilePath: string) {
    console.log(`\n=== 🔬 SYNAPSE Stage B.5: Dominance Signature Validation (Multi-Dimensional) ===`);
    if (!fs.existsSync(graphFilePath)) {
        console.error(`File not found: ${graphFilePath}`); return;
    }

    const data = JSON.parse(fs.readFileSync(graphFilePath, 'utf8'));
    let nodes: Node[] = data.nodes || [];
    let edges: Edge[] = data.edges || [];
    if (!data.nodes && data.graph && data.graph.nodes) {
        nodes = data.graph.nodes; edges = data.graph.edges;
    }

    const workspaceRoot = path.resolve(path.dirname(graphFilePath), '..');
    const semanticFilter = buildSemanticGraphFilter(nodes, edges, workspaceRoot);
    nodes = semanticFilter.nodes;
    edges = semanticFilter.edges;

    console.log(`[B.5.GHOST] removed=${semanticFilter.removedNodeCount}, explicit=${semanticFilter.explicitGhostCount}, promotedHeader=${semanticFilter.promotedHeaderGhostCount}, headerDegreeThreshold=${semanticFilter.headerDegreeThreshold.toFixed(1)}`);

    const nodeIds = nodes.map(n => n.id || n.name || '').filter(id => id !== '');
    const nodeIdSet = new Set(nodeIds);
    console.log(`Nodes: ${nodeIds.length}, Edges: ${edges.length}`);

    let validEdges = 0;
    for (const e of edges) {
        const { valid } = getEdgeEndpoints(e, nodeIdSet, workspaceRoot);
        if (valid) validEdges++;
    }
    console.log(`[Edge Integrity] Valid Edges: ${validEdges} / ${edges.length}`);

    console.log(`\n[1] Computing Graph Centralities (Degree, PageRank, Eigenvector)...`);
    const degreeMap = GraphCentrality.computeDegree(nodeIds, edges, nodeIdSet, workspaceRoot);
    const prMap = GraphCentrality.computePageRank(nodeIds, edges, nodeIdSet, workspaceRoot);
    const evMap = GraphCentrality.computeEigenvector(nodeIds, edges, nodeIdSet, workspaceRoot);

    const globalDegreeSum = Array.from(degreeMap.values()).reduce((a,b)=>a+b,0);
    const globalPrSum = Array.from(prMap.values()).reduce((a,b)=>a+b,0);
    const globalEvSum = Array.from(evMap.values()).reduce((a,b)=>a+b,0);

    const prGlobal = globalDistributionSummary(nodeIds, prMap);
    const evGlobal = globalDistributionSummary(nodeIds, evMap);
    console.log(`[Centrality Distribution]`);
    console.log(`  PageRank: mean=${prGlobal.mean.toExponential(3)}, std=${prGlobal.std.toExponential(3)}, cv=${prGlobal.cv.toFixed(3)}, nonZero=${prGlobal.nonZero}/${nodeIds.length}`);
    console.log(`  Eigenvector: mean=${evGlobal.mean.toExponential(3)}, std=${evGlobal.std.toExponential(3)}, cv=${evGlobal.cv.toFixed(3)}, nonZero=${evGlobal.nonZero}/${nodeIds.length}`);

    const louvainWeighted = buildLouvainWeightedEdges(edges, nodeIdSet, workspaceRoot, degreeMap);
    console.log(`[B.5.4-C] Weighted Louvain Edges: count=${louvainWeighted.summary.edgeCount}, mean=${louvainWeighted.summary.mean.toExponential(3)}, p90=${louvainWeighted.summary.p90.toExponential(3)}, min=${louvainWeighted.summary.min.toExponential(3)}, max=${louvainWeighted.summary.max.toExponential(3)}`);

    console.log(`[2] Running Louvain Community Detection...`);
    const result = detectCommunities(nodes as any, louvainWeighted.edges as any);

    // B.5.5: keep initial communities, then recursively split only continent-scale groups.
    const finalCommunityMap = new Map<string, string>(result.nodeCommunityMap);

    const communityNodes = new Map<string, string[]>();
    for (const [nodeId, commId] of result.nodeCommunityMap.entries()) {
        if (!communityNodes.has(commId)) communityNodes.set(commId, []);
        communityNodes.get(commId)!.push(nodeId);
    }

    const extractor = new DefaultNodeExtractor();
    let continentCount = 0;
    let continentSplitCount = 0;
    const nodeById = new Map<string, Node>();
    for (const node of nodes) {
        const id = node.id || node.name;
        if (id) nodeById.set(id, node);
    }

    const firstPassLocalDegree = new Map<string, Map<string, number>>();
    for (const edge of edges) {
        const { s, t, valid } = getEdgeEndpoints(edge, nodeIdSet, workspaceRoot);
        if (!valid) continue;
        const commS = result.nodeCommunityMap.get(s);
        const commT = result.nodeCommunityMap.get(t);
        if (!commS || !commT || commS !== commT) continue;
        if (!firstPassLocalDegree.has(commS)) firstPassLocalDegree.set(commS, new Map());
        const local = firstPassLocalDegree.get(commS)!;
        local.set(s, (local.get(s) || 0) + 1);
        local.set(t, (local.get(t) || 0) + 1);
    }

    for (const [commId, members] of communityNodes.entries()) {
        const pathMetric = MetricsCalculator.calculateDimensions(members, extractor).path as any;
        const pathPurity = (pathMetric?.score as number | undefined) || 0;
        const pathEntropy = (pathMetric?.entropy as number | undefined) || 0;
        const localMap = firstPassLocalDegree.get(commId) || new Map<string, number>();
        const hub = computeHubGravitySummary(members, degreeMap, localMap);
        const prConc = concentrationSummary(members, prMap);
        const continent = computeContinentAssessment({
            size: members.length,
            pathEntropy,
            pathPurity,
            hubP90: hub.p90,
            prEffectiveNodes: prConc.effectiveNodeCount
        });

        if (!continent.isContinent) continue;
        continentCount++;

        const subNodes = members
            .map((id) => nodeById.get(id))
            .filter((n): n is Node => !!n)
            .map((n) => ({ ...(n as any), id: n.id || n.name, type: (n as any).type || 'source' }));
        const subEdges = buildSecondPassEdgesForMembers(
            members,
            louvainWeighted.edges,
            nodeIdSet,
            workspaceRoot,
            prMap,
            prGlobal.mean,
            prGlobal.std
        );

        if (subNodes.length < 200 || subEdges.length < 400) continue;

        const subResult = detectCommunities(subNodes as any, subEdges as any);
        const uniqueSub = new Set(subResult.nodeCommunityMap.values());
        if (uniqueSub.size <= 1) continue;

        const subSize = new Map<string, number>();
        for (const subId of subResult.nodeCommunityMap.values()) {
            subSize.set(subId, (subSize.get(subId) || 0) + 1);
        }

        const dominantSubSize = Math.max(...Array.from(subSize.values()));
        if ((dominantSubSize / members.length) > 0.75) continue;

        const staged = new Map<string, string>();
        for (const nodeId of members) {
            const rawSub = subResult.nodeCommunityMap.get(nodeId);
            if (!rawSub) continue;
            if ((subSize.get(rawSub) || 0) < 80) continue;
            staged.set(nodeId, `${commId}::${rawSub}`);
        }
        if (staged.size === 0) continue;
        if ((staged.size / members.length) < 0.6) continue;
        for (const [nodeId, splitId] of staged.entries()) {
            finalCommunityMap.set(nodeId, splitId);
        }
        continentSplitCount++;
    }

    console.log(`[B.5.5] Continent candidates=${continentCount}, recursively split=${continentSplitCount}`);

    const finalCommunityNodes = new Map<string, string[]>();
    for (const [nodeId, commId] of finalCommunityMap.entries()) {
        if (!finalCommunityNodes.has(commId)) finalCommunityNodes.set(commId, []);
        finalCommunityNodes.get(commId)!.push(nodeId);
    }

    const internalEdges = new Map<string, number>();
    const externalEdges = new Map<string, number>();
    const localDegreeByCommunity = new Map<string, Map<string, number>>();

    for (const e of edges) {
        const { s, t, valid } = getEdgeEndpoints(e, nodeIdSet, workspaceRoot);
        if (!valid) continue;

        const commS = finalCommunityMap.get(s);
        const commT = finalCommunityMap.get(t);
        if (!commS || !commT) continue;

        if (commS === commT) {
            internalEdges.set(commS, (internalEdges.get(commS) || 0) + 1);

            if (!localDegreeByCommunity.has(commS)) localDegreeByCommunity.set(commS, new Map());
            const localMap = localDegreeByCommunity.get(commS)!;
            localMap.set(s, (localMap.get(s) || 0) + 1);
            localMap.set(t, (localMap.get(t) || 0) + 1);
        } else {
            externalEdges.set(commS, (externalEdges.get(commS) || 0) + 1);
            externalEdges.set(commT, (externalEdges.get(commT) || 0) + 1);
        }
    }

    console.log(`\n[Projection Audit] Community Members -> Centrality Key Coverage`);
    const sortedBySize = Array.from(finalCommunityNodes.entries()).sort((a, b) => b[1].length - a[1].length);
    for (let i = 0; i < Math.min(5, sortedBySize.length); i++) {
        const [commId, members] = sortedBySize[i];
        let degreeFound = 0;
        let degreeMissing = 0;
        let prFound = 0;
        let prMissing = 0;
        let evFound = 0;
        let evMissing = 0;

        const sampleLookups: string[] = [];
        for (const m of members.slice(0, 10)) {
            const hasDeg = degreeMap.has(m);
            const hasPr = prMap.has(m);
            const hasEv = evMap.has(m);
            if (hasDeg) degreeFound++; else degreeMissing++;
            if (hasPr) prFound++; else prMissing++;
            if (hasEv) evFound++; else evMissing++;
            sampleLookups.push(`${m} -> deg:${hasDeg ? (degreeMap.get(m) || 0) : 'MISS'}, pr:${hasPr ? (prMap.get(m) || 0).toFixed(6) : 'MISS'}, ev:${hasEv ? (evMap.get(m) || 0).toFixed(6) : 'MISS'}`);
        }

        // Count full member coverage (not only sampled 10)
        for (const m of members.slice(10)) {
            if (degreeMap.has(m)) degreeFound++; else degreeMissing++;
            if (prMap.has(m)) prFound++; else prMissing++;
            if (evMap.has(m)) evFound++; else evMissing++;
        }

        console.log(`- ${commId}: members=${members.length}`);
        console.log(`  Degree Found/Missing: ${degreeFound}/${degreeMissing}`);
        console.log(`  PageRank Found/Missing: ${prFound}/${prMissing}`);
        console.log(`  Eigenvector Found/Missing: ${evFound}/${evMissing}`);
        console.log(`  Sample Lookups:`);
        for (const row of sampleLookups) {
            console.log(`    ${row}`);
        }
    }

    // Default Profile for Diagnosis
    const thresholdProfile: ThresholdProfile = {
        purityHigh: 0.85,
        purityMedium: 0.50,
        retentionHigh: 0.80,
        retentionMedium: 0.15,
        cohesionHigh: 0.30
    };
    
    const signatures: any[] = [];
    
    for (const [commId, members] of finalCommunityNodes.entries()) {
        const isNoise = members.length < 5; // 리포트 태깅용 (필터링하지 않음)
        
        const dimensions = MetricsCalculator.calculateDimensions(members, extractor);
        
        let sumDegree = 0, sumPr = 0, sumEv = 0;
        for(const n of members) {
            sumDegree += degreeMap.get(n)||0;
            sumPr += prMap.get(n)||0;
            sumEv += evMap.get(n)||0;
        }

        const sizeDom = DominanceCalculator.calculateSizeDominance(members.length, nodeIds.length);
        const trafficDom = DominanceCalculator.calculateTrafficDominance(members, id => degreeMap.get(id)||0, globalDegreeSum);
        const depDom = DominanceCalculator.calculateDependencyDominance(members, id => prMap.get(id)||0);
        const ecoDom = DominanceCalculator.calculateEcosystemDominance(members, id => evMap.get(id)||0, globalEvSum);
        
        // Mock Retention and Cohesion for now
        const mockMetrics: CommunityMetrics = {
            communityId: commId,
            dimensions,
            stability: members.length,
            retention: 1.0,
            cohesion: 0.0
        };

        const diagnosis = DiagnosisEngine.diagnose(mockMetrics, thresholdProfile);

        signatures.push({
            id: commId,
            size: members.length,
            isNoise,
            members,
            dimensions,
            diagnosis,
            rawSums: { degree: sumDegree, pr: sumPr, ev: sumEv },
            topology: {
                internal: internalEdges.get(commId) || 0,
                external: externalEdges.get(commId) || 0
            },
            dom: { size: sizeDom, traffic: trafficDom, dependency: depDom, ecosystem: ecoDom }
        });
    }

    signatures.sort((a, b) => b.size - a.size);

    console.log(`\n[3] 🏆 Top 10 Community Signatures\n`);
    let printed = 0;
    for (const sig of signatures) {
        if (printed >= 10) break;
        
        const noiseTag = sig.isNoise ? ' ⚠️ [Noise Candidate]' : '';
        console.log(`=== ${sig.id} (Size: ${sig.size})${noiseTag} ===`);
        
        console.log(`Metrics (Multi-Dimensional):`);
        for (const [dim, rawMetric] of Object.entries(sig.dimensions)) {
            const metric = rawMetric as any;
            const diag = sig.diagnosis.purityLevels[dim];
            console.log(`  - [${dim.toUpperCase()}] Purity: ${(metric.score*100).toFixed(1)}% (${metric.dominantValue}) | Entropy: ${metric.entropy.toFixed(2)} | Diagnosis: ${diag}`);
        }

        console.log(`Dominance:`);
        console.log(`  Size:       ${(sig.dom.size*100).toFixed(1)}% (Nodes: ${sig.size})`);
        console.log(`  Traffic:    ${(sig.dom.traffic*100).toFixed(2)}% (Raw Degree Sum: ${sig.rawSums.degree})`);
        console.log(`  Dependency: ${(sig.dom.dependency*100).toFixed(2)}% (Raw PR Sum: ${sig.rawSums.pr.toFixed(6)})`);
        console.log(`  Ecosystem:  ${(sig.dom.ecosystem*100).toFixed(2)}% (Raw EV Sum: ${sig.rawSums.ev.toFixed(6)})`);

        // B.5.3 Dominance Decomposition: explain "why" a community dominates.
        const prTop = topCentralityContributors(sig.members, prMap, 5);
        const evTop = topCentralityContributors(sig.members, evMap, 5);
        const prConcentration = concentrationSummary(sig.members, prMap);
        const evConcentration = concentrationSummary(sig.members, evMap);
        const density = computeDensitySummary(sig.size, sig.dom);
        const pathPurity = (sig.dimensions.path?.score as number | undefined) || 0;
        const internalCount = sig.topology.internal as number;
        const externalCount = sig.topology.external as number;
        const structuralPurity = (internalCount + externalCount) > 0
            ? internalCount / (internalCount + externalCount)
            : 0;
        const localDegreeMap = localDegreeByCommunity.get(sig.id) || new Map<string, number>();
        const hubGravity = computeHubGravitySummary(sig.members, degreeMap, localDegreeMap);
        const baseSpecies = classifySpecies({
            size: sig.size,
            isNoise: sig.isNoise,
            pathPurity,
            structuralPurity,
            prConcentration,
            evConcentration,
            density,
            hubP90: hubGravity.p90,
            pathEntropy: (sig.dimensions.path?.entropy as number | undefined) || 0
        });
        const speciesDecision = applySpeciesPromotionPolicy({
            baseSpecies,
            pathPurity,
            structuralPurity,
            prConcentration,
            density,
            hubP90: hubGravity.p90,
            pathEntropy: (sig.dimensions.path?.entropy as number | undefined) || 0
        });

        console.log(`Dominance Decomposition (B.5.3):`);
        console.log(`  PageRank Concentration: top1=${(prConcentration.top1*100).toFixed(2)}%, top3=${(prConcentration.top3*100).toFixed(2)}%, top5=${(prConcentration.top5*100).toFixed(2)}%, effectiveNodes=${prConcentration.effectiveNodeCount.toFixed(2)}`);
        console.log(`  Eigenvector Concentration: top1=${(evConcentration.top1*100).toFixed(2)}%, top3=${(evConcentration.top3*100).toFixed(2)}%, top5=${(evConcentration.top5*100).toFixed(2)}%, effectiveNodes=${evConcentration.effectiveNodeCount.toFixed(2)}`);
        console.log(`  Dominance Density:`);
        console.log(`    - Traffic Density: ${density.trafficPerNodePct.toFixed(3)} (%-points per node), relative=${density.trafficRelative.toFixed(3)}x`);
        console.log(`    - Dependency Density: ${density.dependencyPerNodePct.toFixed(3)} (%-points per node), relative=${density.dependencyRelative.toFixed(3)}x`);
        console.log(`    - Ecosystem Density: ${density.ecosystemPerNodePct.toFixed(3)} (%-points per node), relative=${density.ecosystemRelative.toFixed(3)}x`);
        console.log(`  Structural Purity (B.5.4-A): ${structuralPurity.toFixed(3)} (internal=${internalCount}, external=${externalCount})`);
        console.log(`  Hub Gravity (B.5.4-B): avg=${hubGravity.average.toFixed(3)}, p90=${hubGravity.p90.toFixed(3)}`);
        console.log(`  Top Hub Gravity Nodes:`);
        for (const row of hubGravity.top) {
            console.log(`    - ${row.nodeId} | gravity=${row.value.toFixed(3)} | global=${row.globalDegree} | local=${row.localDegree}`);
        }
        console.log(`  Species: ${speciesDecision.finalSpecies}`);
        if (speciesDecision.baseSpecies !== speciesDecision.finalSpecies) {
            console.log(`  Species Base: ${speciesDecision.baseSpecies}`);
        }
        if (speciesDecision.confidence !== undefined && speciesDecision.scoreName) {
            console.log(`  ${speciesDecision.scoreName}: ${speciesDecision.confidence.toFixed(3)}`);
        }

        console.log(`  Top PageRank Nodes:`);
        for (const row of prTop) {
            console.log(`    - ${row.nodeId} | pr=${row.value.toFixed(6)} | share=${(row.shareInCommunity*100).toFixed(2)}%`);
        }

        console.log(`  Top Eigenvector Nodes:`);
        for (const row of evTop) {
            console.log(`    - ${row.nodeId} | ev=${row.value.toFixed(6)} | share=${(row.shareInCommunity*100).toFixed(2)}%`);
        }

        console.log('');
        printed++;
    }

    const speciesSummary = new Map<string, number>();
    const infraMeshCandidates: Array<{ id: string; score: number; internal: number; external: number }> = [];
    for (const sig of signatures) {
        const prConcentration = concentrationSummary(sig.members, prMap);
        const evConcentration = concentrationSummary(sig.members, evMap);
        const density = computeDensitySummary(sig.size, sig.dom);
        const pathPurity = (sig.dimensions.path?.score as number | undefined) || 0;
        const internalCount = sig.topology.internal as number;
        const externalCount = sig.topology.external as number;
        const structuralPurity = (internalCount + externalCount) > 0
            ? internalCount / (internalCount + externalCount)
            : 0;
        const hubP90 = computeHubGravitySummary(
            sig.members,
            degreeMap,
            localDegreeByCommunity.get(sig.id) || new Map<string, number>()
        ).p90;
        const pathEntropy = (sig.dimensions.path?.entropy as number | undefined) || 0;
        const baseSpecies = classifySpecies({
            size: sig.size,
            isNoise: sig.isNoise,
            pathPurity,
            structuralPurity,
            prConcentration,
            evConcentration,
            density,
            hubP90,
            pathEntropy
        });
        const speciesDecision = applySpeciesPromotionPolicy({
            baseSpecies,
            pathPurity,
            structuralPurity,
            prConcentration,
            density,
            hubP90,
            pathEntropy
        });
        speciesSummary.set(speciesDecision.finalSpecies, (speciesSummary.get(speciesDecision.finalSpecies) || 0) + 1);

        if (speciesDecision.finalSpecies === 'Infrastructure Mesh') {
            const externalRatio = clamp01(1 - structuralPurity);
            const entropySignal = clamp01(pathEntropy / 6);
            const score = clamp01(0.5 * externalRatio + 0.5 * entropySignal);
            infraMeshCandidates.push({
                id: sig.id,
                score,
                internal: internalCount,
                external: externalCount
            });
        }
    }

    console.log(`[4] Species Summary`);
    for (const [species, count] of Array.from(speciesSummary.entries()).sort((a, b) => b[1] - a[1])) {
        console.log(`  - ${species}: ${count}`);
    }

    if (infraMeshCandidates.length > 0) {
        console.log(`[5] B.5.6 Infrastructure Mesh Split Targets (Top 3)`);
        infraMeshCandidates
            .sort((a, b) => b.score - a.score || b.external - a.external)
            .slice(0, 3)
            .forEach((row) => {
                console.log(`  - ${row.id}: splitPriority=${row.score.toFixed(3)} (external=${row.external}, internal=${row.internal})`);
            });
    }
}

// CLI
if (require.main === module) {
    const defaultPath = path.join(__dirname, '../../data/project_state.json');
    const targetPath = process.argv[2] || defaultPath;
    runStageB5Validation(targetPath);
}
