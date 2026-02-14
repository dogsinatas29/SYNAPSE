/**
 * 초기 순서도 생성기
 * 프로젝트 구조를 기반으로 초기 노드와 엣지 생성
 */

import { ProjectStructure, Node, Edge, NodeType, EdgeType } from '../types/schema';

export class FlowchartGenerator {
    private nodeIdCounter = 0;
    private edgeIdCounter = 0;

    /**
     * 프로젝트 구조로부터 초기 순서도 생성
     */
    public generateInitialFlowchart(structure: ProjectStructure): {
        nodes: Node[];
        edges: Edge[];
    } {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // 파일별 노드 생성
        structure.files.forEach((file, index) => {
            const node = this.createNode(
                file.path,
                file.type,
                file.description,
                index
            );
            nodes.push(node);
        });

        // 의존성 기반 엣지 생성
        structure.dependencies.forEach((dep) => {
            const fromNode = nodes.find(n => n.data.file === dep.from);
            const toNode = nodes.find(n => n.data.file === dep.to);

            if (fromNode && toNode) {
                const edge = this.createEdge(fromNode.id, toNode.id, dep.type);
                edges.push(edge);
            }
        });

        console.log('✅ 초기 순서도 생성 완료');
        console.log(`  - 노드: ${nodes.length}개`);
        console.log(`  - 엣지: ${edges.length}개`);

        return { nodes, edges };
    }

    /**
     * 노드 생성
     */
    private createNode(
        filePath: string,
        type: NodeType,
        description: string,
        index: number
    ): Node {
        const id = `node_${this.nodeIdCounter++}`;

        // 노드 위치 자동 배치 (간단한 그리드 레이아웃)
        const cols = 3;
        const spacing = 200;
        const x = (index % cols) * spacing + 100;
        const y = Math.floor(index / cols) * spacing + 100;

        // 타입별 색상
        const colorMap: Record<NodeType, string> = {
            source: '#b8bb26',      // 초록색
            cluster: '#83a598',     // 파란색
            documentation: '#fabd2f', // 노란색
            test: '#fe8019',        // 주황색
            config: '#d3869b'       // 분홍색
        };

        return {
            id,
            type,
            status: 'proposed',     // 초기에는 제안 상태
            position: { x, y },
            data: {
                file: filePath,
                label: filePath.split('/').pop() || filePath,
                description,
                color: colorMap[type]
            },
            visual: {
                opacity: 0.5,         // 반투명 (제안 상태)
                dashArray: '5,5'      // 점선
            }
        };
    }

    /**
     * 엣지 생성
     */
    private createEdge(
        fromId: string,
        toId: string,
        type: EdgeType
    ): Edge {
        const id = `edge_${this.edgeIdCounter++}`;

        // 타입별 스타일
        const styleMap: Record<EdgeType, { color: string; thickness: number }> = {
            dependency: { color: '#ebdbb2', thickness: 2 },
            data_flow: { color: '#83a598', thickness: 3 },
            event: { color: '#fe8019', thickness: 2 },
            conditional: { color: '#d3869b', thickness: 1 }
        };

        const style = styleMap[type];

        return {
            id,
            from: fromId,
            to: toId,
            type,
            is_approved: false,     // 초기에는 미승인
            visual: {
                thickness: style.thickness,
                style: 'dashed',      // 제안 상태는 점선
                color: style.color,
                animated: false
            }
        };
    }

    /**
     * Mermaid 다이어그램 생성
     */
    public generateMermaidDiagram(nodes: Node[], edges: Edge[]): string {
        let mermaid = 'flowchart TD\n';

        // 노드 정의
        nodes.forEach(node => {
            const label = node.data.label;
            const shape = this.getNodeShape(node.type);
            mermaid += `  ${node.id}${shape[0]}${label}${shape[1]}\n`;
        });

        mermaid += '\n';

        // 엣지 정의
        edges.forEach(edge => {
            const arrow = edge.visual.style === 'dashed' ? '-.->' : '-->';
            mermaid += `  ${edge.from} ${arrow} ${edge.to}\n`;
        });

        return mermaid;
    }

    /**
     * 노드 타입별 Mermaid 형태
     */
    private getNodeShape(type: NodeType): [string, string] {
        switch (type) {
            case 'source':
                return ['[', ']'];        // 사각형
            case 'cluster':
                return ['[[', ']]'];      // 서브루틴
            case 'documentation':
                return ['[/', '/]'];      // 평행사변형
            case 'test':
                return ['{', '}'];        // 다이아몬드
            case 'config':
                return ['[(', ')]'];      // 원통
            default:
                return ['[', ']'];
        }
    }
}
