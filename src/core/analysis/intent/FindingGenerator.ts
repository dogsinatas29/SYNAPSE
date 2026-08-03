import { IntentEdge } from './IntentEdge';
import { Finding, FindingType, PipelineStats, CriticalEdge } from './ReasonedReportBundle';

export class FindingGenerator {
    generate(intentEdges: IntentEdge[], workspaceRoot: string): { findings: Finding[], pipelineStats: PipelineStats } {
        const findings: Finding[] = [];
        const pipelineStats: PipelineStats = {
            rawEdges: intentEdges.length,
            resolvedEdges: 0,
            unresolvedSymbols: 0,
            subsystemEdges: 0,
            findingCandidates: 0,
            finalFindings: 0
        };

        const subFanOutMap = new Map<string, IntentEdge[]>();
        const subFanInMap = new Map<string, IntentEdge[]>();
        const subInternalMap = new Map<string, IntentEdge[]>();
        const subAllNodes = new Set<string>();

        const boundaryEdgesMap = new Map<string, IntentEdge[]>();

        for (const edge of intentEdges) {
            const srcSub = this.getSubsystem(edge.source, workspaceRoot);
            const tgtSub = this.getSubsystem(edge.target, workspaceRoot);

            if (srcSub === '_unresolved_symbol_' || tgtSub === '_unresolved_symbol_') {
                pipelineStats.unresolvedSymbols++;
                continue;
            }
            pipelineStats.resolvedEdges++;

            subAllNodes.add(srcSub);
            subAllNodes.add(tgtSub);

            if (srcSub === tgtSub) {
                if (!subInternalMap.has(srcSub)) subInternalMap.set(srcSub, []);
                subInternalMap.get(srcSub)!.push(edge);
            } else {
                pipelineStats.subsystemEdges++;

                if (!subFanOutMap.has(srcSub)) subFanOutMap.set(srcSub, []);
                subFanOutMap.get(srcSub)!.push(edge);
                
                if (!subFanInMap.has(tgtSub)) subFanInMap.set(tgtSub, []);
                subFanInMap.get(tgtSub)!.push(edge);

                const boundaryKey = `${srcSub}|${tgtSub}`;
                if (!boundaryEdgesMap.has(boundaryKey)) boundaryEdgesMap.set(boundaryKey, []);
                boundaryEdgesMap.get(boundaryKey)!.push(edge);
            }
        }

        pipelineStats.findingCandidates = subAllNodes.size;

        const fanInValues = Array.from(subFanInMap.values()).map(e => e.length).sort((a, b) => a - b);
        const fanOutValues = Array.from(subFanOutMap.values()).map(e => e.length).sort((a, b) => a - b);
        
        const getPercentile = (sorted: number[], p: number) => {
            if (sorted.length === 0) return 0;
            const index = Math.floor(sorted.length * p);
            return sorted[index];
        };

        const p90FanIn = Math.max(3, getPercentile(fanInValues, 0.9));
        const p90FanOut = Math.max(3, getPercentile(fanOutValues, 0.9));

        const getTopFilesForBoundary = (src: string, tgt: string): string[] => {
            const edges = boundaryEdgesMap.get(`${src}|${tgt}`) ?? [];
            const filePairs = new Map<string, number>();
            for (const e of edges) {
                // Shorten file paths for readability if possible
                const s = e.source.split(/[\\/]/).slice(-3).join('/');
                const t = e.target.split(/[\\/]/).slice(-3).join('/');
                const pair = `${s} -> ${t}`;
                filePairs.set(pair, (filePairs.get(pair) ?? 0) + 1);
            }
            return Array.from(filePairs.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(e => e[0]);
        };

        const createCriticalEdge = (srcSub: string, tgtSub: string, count: number): CriticalEdge => {
            return {
                sourceSub: srcSub,
                targetSub: tgtSub,
                count,
                topFiles: getTopFilesForBoundary(srcSub, tgtSub),
                traceReference: `See: intent_edges.json#${srcSub}-${tgtSub}`
            };
        };

        // 1. circular_dependency
        const subEdgeSet = new Set<string>();
        for (const [srcSub, edges] of subFanOutMap.entries()) {
            for (const edge of edges) {
                const tgtSub = this.getSubsystem(edge.target, workspaceRoot);
                subEdgeSet.add(`${srcSub}|${tgtSub}`);
            }
        }

        const seenCycles = new Set<string>();
        const cycleSubsystems = new Set<string>();

        for (const key of subEdgeSet) {
            const [src, tgt] = key.split('|');
            const reverseKey = `${tgt}|${src}`;
            const cycleKey = [key, reverseKey].sort().join('::');

            if (subEdgeSet.has(reverseKey) && !seenCycles.has(cycleKey)) {
                seenCycles.add(cycleKey);
                cycleSubsystems.add(src);
                cycleSubsystems.add(tgt);

                const forwardEdges = boundaryEdgesMap.get(`${src}|${tgt}`) ?? [];
                const reverseEdges = boundaryEdgesMap.get(`${tgt}|${src}`) ?? [];
                const totalEvidence = forwardEdges.length + reverseEdges.length;
                const avgConf = [...forwardEdges, ...reverseEdges].reduce((s, e) => s + e.confidence, 0) / totalEvidence;

                findings.push({
                    title: `Circular Dependency: ${src} ↔ ${tgt}`,
                    findingType: 'circular_dependency',
                    observation: `Subsystems '${src}' and '${tgt}' depend on each other bidirectionally (${totalEvidence} cross-edges).`,
                    interpretation: `These two subsystems form a tight coupling cycle — neither can evolve without affecting the other.`,
                    consequence: `Independent testing, deployment, or replacement of either subsystem is impossible without breaking the other.`,
                    confidence: parseFloat(avgConf.toFixed(4)),
                    impactVector: {
                        fanIn: (subFanInMap.get(src)?.length ?? 0) + (subFanInMap.get(tgt)?.length ?? 0),
                        fanOut: (subFanOutMap.get(src)?.length ?? 0) + (subFanOutMap.get(tgt)?.length ?? 0),
                        skew: 0,
                        cycle: true
                    },
                    relatedEdges: [...forwardEdges, ...reverseEdges],
                    evidencePattern: `${src}/* ↔ ${tgt}/*`,
                    criticalEdges: [
                        createCriticalEdge(src, tgt, forwardEdges.length),
                        createCriticalEdge(tgt, src, reverseEdges.length)
                    ]
                });
            }
        }

        // Structural Role Analysis
        for (const sub of subAllNodes) {
            const fanInEdges = subFanInMap.get(sub) ?? [];
            const fanOutEdges = subFanOutMap.get(sub) ?? [];
            const fanIn = fanInEdges.length;
            const fanOut = fanOutEdges.length;
            
            const inboundSubsystems = new Map<string, number>();
            for (const edge of fanInEdges) {
                const srcSub = this.getSubsystem(edge.source, workspaceRoot);
                inboundSubsystems.set(srcSub, (inboundSubsystems.get(srcSub) ?? 0) + 1);
            }

            const outboundSubsystems = new Map<string, number>();
            for (const edge of fanOutEdges) {
                const tgtSub = this.getSubsystem(edge.target, workspaceRoot);
                outboundSubsystems.set(tgtSub, (outboundSubsystems.get(tgtSub) ?? 0) + 1);
            }
            
            let dominantSubsystemRatio = 0;
            let topSourceSubsystem = '';
            for (const [srcSub, count] of inboundSubsystems.entries()) {
                const ratio = fanIn > 0 ? count / fanIn : 0;
                if (ratio > dominantSubsystemRatio) {
                    dominantSubsystemRatio = ratio;
                    topSourceSubsystem = srcSub;
                }
            }

            const inCycle = cycleSubsystems.has(sub);
            const impactVector = { fanIn, fanOut, skew: parseFloat(dominantSubsystemRatio.toFixed(2)), cycle: inCycle };
            const avgConf = fanInEdges.length > 0 ? fanInEdges.reduce((s, e) => s + e.confidence, 0) / fanInEdges.length : 0.5;
            
            // 2. domain_bottleneck
            if (fanIn >= p90FanIn && dominantSubsystemRatio >= 0.6) {
                findings.push({
                    title: `Domain Bottleneck: ${sub}`,
                    findingType: 'domain_bottleneck',
                    observation: `The '${sub}' subsystem receives ${fanIn} inbound dependencies, and ${Math.round(dominantSubsystemRatio * 100)}% of them originate from '${topSourceSubsystem}'.`,
                    interpretation: `This subsystem acts as a domain bottleneck heavily coupled to a specific external domain rather than being generic.`,
                    consequence: `Changes in the public APIs of '${sub}' may propagate unpredictably across '${topSourceSubsystem}'.`,
                    confidence: parseFloat(avgConf.toFixed(4)),
                    impactVector,
                    relatedEdges: boundaryEdgesMap.get(`${topSourceSubsystem}|${sub}`) ?? [],
                    evidencePattern: `${topSourceSubsystem}/* → ${sub}/* ${Math.round(dominantSubsystemRatio * 100)}%`,
                    criticalEdges: [
                        createCriticalEdge(topSourceSubsystem, sub, inboundSubsystems.get(topSourceSubsystem) ?? 0)
                    ]
                });
            }
            // 3. shared_infrastructure
            else if (fanIn >= p90FanIn && dominantSubsystemRatio <= 0.3) {
                findings.push({
                    title: `Shared Infrastructure: ${sub}`,
                    findingType: 'shared_infrastructure',
                    observation: `The '${sub}' subsystem receives ${fanIn} inbound dependencies evenly distributed across ${inboundSubsystems.size} different subsystems.`,
                    interpretation: `This subsystem functions as core shared infrastructure used uniformly across the project architecture.`,
                    consequence: `This is a normal architectural pattern. No separation is recommended, but API stability must be strictly maintained.`,
                    confidence: parseFloat(avgConf.toFixed(4)),
                    impactVector,
                    relatedEdges: fanInEdges,
                    evidencePattern: `*/* → ${sub}/* (Distributed across ${inboundSubsystems.size} subsystems)`,
                    criticalEdges: Array.from(inboundSubsystems.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(e => createCriticalEdge(e[0], sub, e[1]))
                });
            }
            
            // 4. orchestrator
            if (fanOut >= p90FanOut && outboundSubsystems.size >= 3) {
                const avgOutConf = fanOutEdges.length > 0 ? fanOutEdges.reduce((s, e) => s + e.confidence, 0) / fanOutEdges.length : 0.5;
                findings.push({
                    title: `Orchestrator: ${sub}`,
                    findingType: 'orchestrator',
                    observation: `The '${sub}' subsystem actively controls ${fanOut} dependencies across ${outboundSubsystems.size} distinct subsystems.`,
                    interpretation: `Structural Role Detected: Orchestrator / Controller. This subsystem acts as a valid integration point.`,
                    consequence: `Usually safe to keep as-is, but if logic becomes too complex, an Integration Layer or Facade might be needed.`,
                    confidence: parseFloat(avgOutConf.toFixed(4)),
                    impactVector,
                    relatedEdges: fanOutEdges,
                    evidencePattern: `${sub}/* → */* (Controls ${outboundSubsystems.size} subsystems)`,
                    criticalEdges: Array.from(outboundSubsystems.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(e => createCriticalEdge(sub, e[0], e[1]))
                });
            }
        }

        pipelineStats.finalFindings = findings.length;

        return { findings, pipelineStats };
    }

    private getSubsystem(filePath: string, workspaceRoot: string): string {
        let normalizedPath = filePath.replace(/\\/g, '/');
        let normalizedRoot = workspaceRoot ? workspaceRoot.replace(/\\/g, '/') : '';
        
        let relativePath = normalizedPath;
        if (normalizedRoot && normalizedPath.startsWith(normalizedRoot)) {
            relativePath = normalizedPath.substring(normalizedRoot.length);
        }
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }
        
        const parts = relativePath.split('/').filter(p => p.trim() !== '');

        if (parts.length === 1 && !relativePath.includes('/') && !relativePath.includes('.')) {
            return '_unresolved_symbol_';
        }

        if (parts.length > 1) {
            return parts[0];
        }
        
        return 'root';
    }
}
