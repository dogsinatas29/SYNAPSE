import { ProjectStructure, Node, Edge, Cluster, NodeType, EdgeType } from '../types/schema';
import * as path from 'path';
import { getVisualHints } from '../utils/visualHints';

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

        // 레이어 기반 레이아웃을 위해 클러스터 배치를 더 넓게 가져감
        const clusterSpacingX = 800;
        const clusterSpacingY = 1200; // 레이어 높이를 고려하여 크게 잡음
        const clusterCols = Math.ceil(Math.sqrt(totalClusters));

        directoryGroups.forEach((files, dirName) => {
            const clusterId = `cluster_${this.clusterIdCounter++}`;
            const clusterLabel = dirName === '.' ? 'ROOT' : dirName;

            const clusterX = (clusterIdx % clusterCols) * clusterSpacingX;
            const clusterY = Math.floor(clusterIdx / clusterCols) * clusterSpacingY;

            const clusterNodes: string[] = [];
            const nodeSpacingX = 350;
            const nodeSpacingY = 150;

            const layerCounters = new Map<number, number>();

            files.forEach((file) => {
                const hints = getVisualHints(file.path);
                const layer = hints.layer;

                // 의존성 확인 (degree 0 노드 식별)
                const isDisconnected = !structure.dependencies.some(d => d.from === file.path || d.to === file.path);

                const currentCount = layerCounters.get(layer) || 0;
                layerCounters.set(layer, currentCount + 1);

                const layerYOffset = layer * 350 + 50;

                let nodeX, nodeY;
                let finalClusterId = clusterId;

                if (file.type === 'documentation') {
                    // [Doc Shelf] 문서 파일은 별도의 고정 영역에 배치
                    nodeX = (currentCount % 4) * 200;
                    nodeY = Math.floor(currentCount / 4) * 150 + 100;
                    finalClusterId = 'doc_shelf';
                } else if (isDisconnected) {
                    // 수평 상 멀리 떨어진 Storage 영역 (오른쪽 구석)
                    nodeX = 3000 + (currentCount % 3) * 200;
                    nodeY = (currentCount / 3) * 150 + 100;
                    finalClusterId = 'storage_cluster';
                } else {
                    nodeX = (currentCount - 2) * nodeSpacingX + 350;
                    nodeY = Math.floor(currentCount / 5) * nodeSpacingY + layerYOffset;
                }

                const node = this.createNode(
                    file.path,
                    file.type,
                    file.description,
                    finalClusterId === 'doc_shelf' ? -1500 + nodeX : clusterX + nodeX,
                    finalClusterId === 'doc_shelf' ? 0 + nodeY : clusterY + nodeY,
                    hints.layer,
                    hints.priority,
                    finalClusterId
                );
                nodes.push(node);
                clusterNodes.push(node.id);
            });

            // 클러스터 영역 계산 (Storage/Doc 노드 제외)
            const maxNodesInLayer = Math.max(...Array.from(layerCounters.values()), 1);
            clusters.push({
                id: clusterId,
                label: clusterLabel,
                collapsed: false,
                bounds: {
                    x: clusterX,
                    y: clusterY,
                    width: Math.max(maxNodesInLayer, 3) * nodeSpacingX + 200,
                    height: 3 * 350 + 200
                },
                children: clusterNodes.filter(id => {
                    const n = nodes.find(node => node.id === id);
                    return n && n.data.cluster_id === clusterId;
                })
            });

            clusterIdx++;
        });

        // 3. Special Clusters 추가
        // [Documentation Shelf] 모든 MD 파일들을 모아두는 고정 영역
        clusters.push({
            id: 'doc_shelf',
            label: '📚 Documentation Shelf',
            collapsed: false,
            bounds: { x: -1600, y: -100, width: 900, height: 1200 },
            children: nodes.filter(n => n.data.cluster_id === 'doc_shelf').map(n => n.id)
        });

        // [Ghost Nodes Storage]
        clusters.push({
            id: 'storage_cluster',
            label: '📦 Ghost Nodes (Storage)',
            collapsed: true,
            bounds: { x: clusterCols * clusterSpacingX + 1000, y: 0, width: 800, height: 1200 },
            children: nodes.filter(n => n.data.cluster_id === 'storage_cluster').map(n => n.id)
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
        layer: number,
        priority: number,
        clusterId?: string
    ): Node {
        const safeId = filePath.replace(/[^a-zA-Z0-9]/g, '_');
        const id = `node_${safeId}`;

        // 타입별 색상
        const colorMap: Record<NodeType, string> = {
            source: '#b8bb26',      // 초록색
            cluster: '#83a598',     // 파란색
            documentation: '#fabd2f', // 노란색
            test: '#fe8019',        // 주황색
            config: '#d3869b',      // 분홍색
            history: '#d65d0e'      // 주황/갈색 (브라운)
        };

        // 중앙 집중화 (Reasoning 레이어의 핵심 파일들)
        let finalX = x;
        const fileName = path.basename(filePath).toLowerCase();
        if (layer === 1) {
            const isCore = fileName.includes('router') ||
                fileName.includes('prompt') ||
                fileName.includes('engine') ||
                fileName.includes('inference');

            if (isCore) {
                // 클러스터의 중앙 부근으로 유도
                // x는 이미 clusterX + nodeX 형태로 들어옴. 
                // 여기서는 x의 기저값(nodeX 부분)을 조정하거나 
                // 전체 cluster width의 절반 정도로 보정
                finalX = x + (Math.random() * 40 - 20); // 약간의 변동성만 줌
            }
        }

        return {
            id,
            type,
            status: 'proposed',
            position: { x: finalX, y },
            data: {
                file: filePath,
                label: path.basename(filePath),
                description,
                color: colorMap[type],
                cluster_id: clusterId,
                layer,
                priority
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
     * Mermaid 다이어그램 생성 (클러스터 지원)
     */
    public generateMermaidDiagram(nodes: Node[], edges: Edge[], clusters?: Cluster[]): string {
        let mermaid = 'flowchart TD\n';

        // 1. 클러스터(subgraph) 처리
        if (clusters && clusters.length > 0) {
            clusters.forEach(cluster => {
                // 특정 클러스터에 속한 노드들 찾기
                const clusterNodes = nodes.filter(n => n.data.cluster_id === cluster.id || (n as any).cluster_id === cluster.id);

                if (clusterNodes.length > 0) {
                    mermaid += `  subgraph ${cluster.id} ["${cluster.label}"]\n`;
                    clusterNodes.forEach(node => {
                        const label = node.data.label;
                        const shape = this.getNodeShape(node.type);
                        mermaid += `    ${node.id}${shape[0]}${label}${shape[1]}\n`;
                    });
                    mermaid += '  end\n\n';
                }
            });

            // 클러스터에 속하지 않은 노드들 처리
            const standaloneNodes = nodes.filter(n => !n.data.cluster_id || !clusters.some(c => c.id === n.data.cluster_id));
            standaloneNodes.forEach(node => {
                const label = node.data.label;
                const shape = this.getNodeShape(node.type);
                mermaid += `  ${node.id}${shape[0]}${label}${shape[1]}\n`;
            });
        } else {
            // 기존 하위 호환성 유지 (클러스터 정보가 없는 경우)
            nodes.forEach(node => {
                const label = node.data.label;
                const shape = this.getNodeShape(node.type);
                mermaid += `  ${node.id}${shape[0]}${label}${shape[1]}\n`;
            });
        }

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
