import { ProjectStructure, Node, Edge, Cluster, NodeType, EdgeType } from '../types/schema';
import * as path from 'path';

export class FlowchartGenerator {
    private nodeIdCounter = 0;
    private edgeIdCounter = 0;
    private clusterIdCounter = 0;

    /**
     * 프로젝트 구조로부터 초기 순서도 생성 (클러스터링 포함)
     */
    public generateInitialFlowchart(structure: ProjectStructure): {
        nodes: Node[];
        edges: Edge[];
        clusters: Cluster[];
    } {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        const clusters: Cluster[] = [];

        // 1. 파일들을 디렉토리별로 그룹화
        const directoryGroups = new Map<string, typeof structure.files>();

        structure.files.forEach(file => {
            const dir = path.dirname(file.path);
            const group = directoryGroups.get(dir) || [];
            group.push(file);
            directoryGroups.set(dir, group);
        });

        // 2. 각 디렉토리별로 클러스터 및 노드 생성
        let clusterIdx = 0;
        const totalClusters = directoryGroups.size;
        const clusterCols = Math.ceil(Math.sqrt(totalClusters));

        directoryGroups.forEach((files, dirName) => {
            const clusterId = `cluster_${this.clusterIdCounter++}`;
            const clusterLabel = dirName === '.' ? 'ROOT' : dirName;

            // 클러스터 위치 계산 (그리드)
            const clusterSpacingX = 600;
            const clusterSpacingY = 400;
            const clusterX = (clusterIdx % clusterCols) * clusterSpacingX;
            const clusterY = Math.floor(clusterIdx / clusterCols) * clusterSpacingY;

            const clusterNodes: string[] = [];
            const nodeCount = files.length;
            const nodeCols = Math.ceil(Math.sqrt(nodeCount));
            const nodeSpacing = 150;

            files.forEach((file, fIdx) => {
                const nodeX = (fIdx % nodeCols) * nodeSpacing + 50;
                const nodeY = Math.floor(fIdx / nodeCols) * nodeSpacing + 50;

                const node = this.createNode(
                    file.path,
                    file.type,
                    file.description,
                    clusterX + nodeX,
                    clusterY + nodeY,
                    clusterId
                );
                nodes.push(node);
                clusterNodes.push(node.id);
            });

            // 클러스터 정보 생성
            clusters.push({
                id: clusterId,
                label: clusterLabel,
                collapsed: false,
                bounds: {
                    x: clusterX,
                    y: clusterY,
                    width: nodeCols * nodeSpacing + 100,
                    height: Math.ceil(nodeCount / nodeCols) * nodeSpacing + 100
                },
                children: clusterNodes
            });

            clusterIdx++;
        });

        // 3. 의존성 기반 엣지 생성
        structure.dependencies.forEach((dep) => {
            const fromNode = nodes.find(n => n.data.file === dep.from);
            const toNode = nodes.find(n => n.data.file === dep.to);

            if (fromNode && toNode) {
                const edge = this.createEdge(fromNode.id, toNode.id, dep.type);
                edges.push(edge);
            }
        });

        console.log('✅ 초기 순서도 생성 완료 (Clustered)');
        console.log(`  - 노드: ${nodes.length}개`);
        console.log(`  - 엣지: ${edges.length}개`);
        console.log(`  - 클러스터: ${clusters.length}개`);

        return { nodes, edges, clusters };
    }

    /**
     * 노드 생성 (명시적 좌표 지정)
     */
    private createNode(
        filePath: string,
        type: NodeType,
        description: string,
        x: number,
        y: number,
        clusterId?: string
    ): Node {
        const id = `node_${this.nodeIdCounter++}`;

        // 타입별 색상
        const colorMap: Record<NodeType, string> = {
            source: '#b8bb26',      // 초록색
            cluster: '#83a598',     // 파란색
            documentation: '#fabd2f', // 노란색
            test: '#fe8019',        // 주황색
            config: '#d3869b',      // 분홍색
            history: '#d65d0e'      // 주황/갈색 (브라운)
        };

        return {
            id,
            type,
            status: 'proposed',
            position: { x, y },
            data: {
                file: filePath,
                label: path.basename(filePath),
                description,
                color: colorMap[type],
                cluster_id: clusterId
            },
            visual: {
                opacity: 0.5,
                dashArray: '5,5'
            }
        };
    }

    /**
     * 엣지 생성
     */
    private createEdge(fromId: string, toId: string, type: EdgeType): Edge {
        const id = `edge_${this.edgeIdCounter++}`;

        // 타입별 스타일
        const styleMap: Record<EdgeType, { color: string; thickness: number }> = {
            dependency: { color: '#ebdbb2', thickness: 2 },
            data_flow: { color: '#83a598', thickness: 3 },
            event: { color: '#fe8019', thickness: 2 },
            conditional: { color: '#d3869b', thickness: 1 },
            origin: { color: '#d65d0e', thickness: 1.5 } // 프롬프트 기원 링크
        } as Record<EdgeType, { color: string; thickness: number }>;

        const style = styleMap[type] || styleMap['dependency'];

        return {
            id,
            from: fromId,
            to: toId,
            type,
            is_approved: false,
            visual: {
                thickness: style.thickness,
                style: 'dashed',
                color: style.color,
                animated: false
            }
        };
    }

    /**
     * Mermaid 다이어그램 생성 (기존 호환성 유지)
     */
    public generateMermaidDiagram(nodes: Node[], edges: Edge[]): string {
        let mermaid = 'flowchart TD\n';

        nodes.forEach(node => {
            const label = node.data.label;
            const shape = this.getNodeShape(node.type);
            mermaid += `  ${node.id}${shape[0]}${label}${shape[1]}\n`;
        });

        mermaid += '\n';

        edges.forEach(edge => {
            const arrow = edge.visual.style === 'dashed' ? '-.->' : '-->';
            mermaid += `  ${edge.from} ${arrow} ${edge.to}\n`;
        });

        return mermaid;
    }

    private getNodeShape(type: NodeType): [string, string] {
        switch (type) {
            case 'source': return ['[', ']'];
            case 'cluster': return ['[[', ']]'];
            case 'documentation': return ['[/', '/]'];
            case 'test': return ['{', '}'];
            case 'config': return ['[(', ')]'];
            case 'history': return ['((', '))'];
            default: return ['[', ']'];
        }
    }
}
