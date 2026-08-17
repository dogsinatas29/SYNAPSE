import { ReasoningSnapshot } from '../snapshot/ReasoningSnapshot';
import { 
    EvidenceCategory, 
    IDataFlowSegmentEvidence, 
    IControlFlowSegmentEvidence, 
    IPathEvidence 
} from '../evidence/Evidence';

export class FlowAnalyzer {
    private readonly MAX_FLOW_DEPTH = 5;
    private readonly MAX_PATHS_PER_SOURCE = 10;

    /**
     * Reads segments from V2, discovers paths, and emits them into V3.
     */
    public analyze(snapshotV2: ReasoningSnapshot): ReasoningSnapshot {
        const snapshotV3 = snapshotV2.clone();

        const dataSegments = snapshotV3.getEvidenceByCategory<IDataFlowSegmentEvidence>(EvidenceCategory.DATA_FLOW_SEGMENT);
        const controlSegments = snapshotV3.getEvidenceByCategory<IControlFlowSegmentEvidence>(EvidenceCategory.CONTROL_FLOW_SEGMENT);

        // Build adjacency lists
        const dataAdj = this.buildAdjacencyList(dataSegments);
        const ctrlAdj = this.buildAdjacencyList(controlSegments);

        // Deduplication set
        const emittedPaths = new Set<string>();

        // Trace Data Paths
        for (const startNode of dataAdj.keys()) {
            this.tracePaths(startNode, dataAdj, 'DATA', snapshotV3, emittedPaths);
        }

        // Trace Control Paths
        for (const startNode of ctrlAdj.keys()) {
            this.tracePaths(startNode, ctrlAdj, 'CONTROL', snapshotV3, emittedPaths);
        }

        snapshotV3.freeze();
        return snapshotV3;
    }

    private buildAdjacencyList(segments: ReadonlyArray<IDataFlowSegmentEvidence | IControlFlowSegmentEvidence>) {
        const adj = new Map<string, { target: string, conf: number }[]>();
        for (const seg of segments) {
            if (!adj.has(seg.metadata.sourceId)) adj.set(seg.metadata.sourceId, []);
            adj.get(seg.metadata.sourceId)!.push({ 
                target: seg.metadata.targetId, 
                conf: seg.metadata.confidence 
            });
        }
        return adj;
    }

    private tracePaths(
        startNode: string, 
        adj: Map<string, { target: string, conf: number }[]>, 
        pathType: 'DATA' | 'CONTROL',
        snapshot: ReasoningSnapshot,
        emittedPaths: Set<string>
    ) {
        let pathsEmittedFromSource = 0;

        const stack: { path: string[], currentConf: number }[] = [];
        stack.push({ path: [startNode], currentConf: 1.0 });

        while (stack.length > 0) {
            const { path, currentConf } = stack.pop()!;
            
            // If we reached max paths per source, stop exploring from this root.
            if (pathsEmittedFromSource >= this.MAX_PATHS_PER_SOURCE) break;

            const currentId = path[path.length - 1];
            const children = adj.get(currentId) || [];

            // If no children, or max depth reached, it's a valid terminal path (if length > 1)
            if (children.length === 0 || path.length >= this.MAX_FLOW_DEPTH) {
                if (path.length > 1) {
                    this.emitPath(path, pathType, currentConf, snapshot, emittedPaths);
                    pathsEmittedFromSource++;
                }
                continue;
            }

            let pushedChild = false;
            for (const child of children) {
                // Cycle prevention: stop this specific branch if it loops
                if (path.includes(child.target)) {
                    if (path.length > 1) {
                        this.emitPath(path, pathType, currentConf, snapshot, emittedPaths);
                        pathsEmittedFromSource++;
                    }
                    continue;
                }

                pushedChild = true;
                stack.push({
                    path: [...path, child.target],
                    currentConf: currentConf * child.conf
                });
            }

            // If we didn't push any children (e.g. all were cycles), emit what we have
            if (!pushedChild && path.length > 1) {
                this.emitPath(path, pathType, currentConf, snapshot, emittedPaths);
                pathsEmittedFromSource++;
            }
        }
    }

    private emitPath(
        path: string[], 
        pathType: 'DATA' | 'CONTROL', 
        confidence: number,
        snapshot: ReasoningSnapshot,
        emittedPaths: Set<string>
    ) {
        const pathKey = `${pathType}:${path.join('->')}`;
        if (emittedPaths.has(pathKey)) return;
        emittedPaths.add(pathKey);

        snapshot.addEvidence({
            id: `ev-path-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            category: EvidenceCategory.PATH,
            nodeId: path[0], // Anchor to source
            description: `${pathType} Path: ${path.join(' -> ')}`,
            metadata: {
                pathNodes: path,
                pathType,
                segmentConfidenceProduct: confidence
            }
        } as IPathEvidence);
    }
}
