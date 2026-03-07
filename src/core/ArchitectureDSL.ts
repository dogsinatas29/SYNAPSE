import { Node, Edge, NodeType, EdgeType } from '../types/schema';

/**
 * ArchitectureDSL - 요약 설계 언어 파서 (v0.2.18.1)
 * "수천 줄의 코드 대신 DSL 5줄로 아키텍처 브리핑"
 */
export class ArchitectureDSL {
    public parse(dslContent: string): { nodes: Partial<Node>[], edges: Partial<Edge>[] } {
        const nodes: Partial<Node>[] = [];
        const edges: Partial<Edge>[] = [];

        const lines = dslContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // 1. event UserClick -> logic AuthVerify
            const flowMatch = trimmed.match(/^(event|logic|service|data)\s+([a-zA-Z0-9_]+)\s+->\s+(event|logic|service|data)\s+([a-zA-Z0-9_]+)/);
            if (flowMatch) {
                const [, fromType, fromId, toType, toId] = flowMatch;
                this.ensureNode(nodes, fromId, fromType as NodeType);
                this.ensureNode(nodes, toId, toType as NodeType);
                edges.push({
                    from: fromId,
                    to: toId,
                    type: 'control_bidirectional'
                });
                continue;
            }

            // 2. logic AuthVerify uses data UserTable
            const useMatch = trimmed.match(/^(logic|service)\s+([a-zA-Z0-9_]+)\s+uses\s+(data|config)\s+([a-zA-Z0-9_]+)/);
            if (useMatch) {
                const [, fromType, fromId, toType, toId] = useMatch;
                this.ensureNode(nodes, fromId, fromType as NodeType);
                this.ensureNode(nodes, toId, toType as NodeType);
                edges.push({
                    from: fromId,
                    to: toId,
                    type: 'data_flow'
                });
                continue;
            }

            // 3. logic AuthVerify calls service LDAP_API
            const callMatch = trimmed.match(/^(logic|service)\s+([a-zA-Z0-9_]+)\s+calls\s+(service|external)\s+([a-zA-Z0-9_]+)/);
            if (callMatch) {
                const [, fromType, fromId, toType, toId] = callMatch;
                this.ensureNode(nodes, fromId, fromType as NodeType);
                this.ensureNode(nodes, toId, toType as NodeType);
                edges.push({
                    from: fromId,
                    to: toId,
                    type: 'api_call'
                });
                continue;
            }
        }

        return { nodes, edges };
    }

    private ensureNode(nodes: Partial<Node>[], id: string, type: NodeType) {
        if (!nodes.find(n => n.id === id)) {
            nodes.push({
                id,
                type: type === ('logic' as any) ? 'source' : (type === ('data' as any) ? 'source' : type),
                data: { label: id },
                status: 'proposed',
                visual: { opacity: 0.8 }
            });
        }
    }
}
