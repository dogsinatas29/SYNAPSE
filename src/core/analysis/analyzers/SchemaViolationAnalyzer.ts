import { ProjectState, Node } from '../../../types/schema';
import { AnalysisContext, AnalyzerResult, ArchitectureAnalyzer, SchemaFinding } from '../types';

export class SchemaViolationAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'schema_violation_analyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const findings: SchemaFinding[] = [];
        const validNodeTypes = new Set(['component', 'entry', 'database', 'external', 'documentation', 'document', 'doc', 'directory', 'folder', 'file', 'asset', 'test', 'config', 'source', 'history', 'cluster', 'Data', 'Processor', 'Service', 'Gate', 'Trigger']);

        const nodes = state.nodes || [];
        nodes.forEach(node => {
            if (!validNodeTypes.has(node.type as string)) {
                findings.push({
                    type: 'schema',
                    message: `스키마 위반: '${node.data?.label}' 노드가 알 수 없는 타입('${node.type}')을 가지고 있습니다. LLM 환각(Hallucination)일 수 있습니다.`,
                    schemaType: 'invalid-node',
                    nodeId: node.id
                });
            }
        });

        const edges = state.edges || [];
        edges.forEach(edge => {
            if (!edge.from || !edge.to) {
                findings.push({
                    type: 'schema',
                    message: `스키마 위반: 식별자 '${edge.id}'를 가진 엣지의 연결점(from/to)이 유실되었습니다.`,
                    schemaType: 'missing-edge-ref',
                    edgeId: edge.id
                });
            }
        });

        return { findings };
    }
}
