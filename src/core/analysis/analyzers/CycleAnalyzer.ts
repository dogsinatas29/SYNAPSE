import { ProjectState, Node } from '../../../types/schema';
import { AnalysisContext, AnalyzerResult, ArchitectureAnalyzer, CycleFinding } from '../types';

export class CycleAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'cycle_analyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const findings: CycleFinding[] = [];
        const nodes = state.nodes || [];
        const edges = state.edges || [];

        // 비로직 노드(문서 등) 필터링 (기존 LogicAnalyzer 로직 계승)
        const nonLogicTypes = ['document', 'documentation', 'doc', 'directory', 'folder', 'file', 'asset', 'history'];
        const logicNodes = nodes.filter(n => !nonLogicTypes.includes(n.type as string));
        const logicNodeIds = new Set(logicNodes.map(n => n.id));
        const logicEdges = edges.filter(e => logicNodeIds.has(e.from) && logicNodeIds.has(e.to));

        const adj = new Map<string, string[]>();
        logicNodes.forEach(n => adj.set(n.id, []));
        logicEdges.forEach(e => adj.get(e.from)?.push(e.to));

        const visited = new Set<string>();
        const recStack = new Set<string>();
        const cycles: string[][] = [];

        const findCycles = (u: string, path: string[]) => {
            visited.add(u);
            recStack.add(u);
            path.push(u);

            const neighbors = adj.get(u) || [];
            for (const v of neighbors) {
                if (!visited.has(v)) {
                    findCycles(v, [...path]);
                } else if (recStack.has(v)) {
                    const cycleStartIdx = path.indexOf(v);
                    if (cycleStartIdx !== -1) {
                        const cycle = path.slice(cycleStartIdx);
                        if (cycle.length > 1) { // Ignore self-loops
                            // O(N) 순환 결과 복사하여 분리 (Zero Mutation 보장)
                            cycles.push([...cycle]);
                        }
                    }
                }
            }

            recStack.delete(u);
            // 원본 path 배열을 그대로 유지하기 위해 수정 (DFS 경로 원복)
            path.pop();
        };

        logicNodes.forEach(n => {
            if (!visited.has(n.id)) findCycles(n.id, []);
        });

        // 결과 생성
        const nodeMap = context.nodeMap || new Map<string, Node>(nodes.map(n => [n.id, n]));

        cycles.forEach(cycle => {
            const labels = cycle.map(id => nodeMap.get(id)?.data?.label || id);
            findings.push({
                type: 'cycle',
                message: `순환 의존성 발견: ${labels.join(' -> ')} -> ${labels[0]}`,
                nodeIds: cycle
            });
        });

        return { findings };
    }
}
