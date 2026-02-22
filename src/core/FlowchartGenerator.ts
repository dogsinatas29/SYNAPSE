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

        // 1. 모든 관련 폴더 수집 및 클러스터 맵 생성
        const clusterMap = new Map<string, Cluster>();
        const folders = new Set<string>();

        // 파일들의 상위 폴더들 모두 수집
        structure.files.forEach(f => {
            let dir = path.dirname(f.path);
            while (dir !== '.' && dir !== '/' && dir !== '') {
                folders.add(dir.replace(/\\/g, '/'));
                dir = path.dirname(dir);
            }
        });
        // structure.folders에 있는 것들도 추가
        structure.folders.forEach(f => folders.add(f.replace(/\\/g, '/')));

        // 2. 클러스터 생성 (계층 구조 포함)
        const sortedFolders = Array.from(folders).sort((a, b) => a.split('/').length - b.split('/').length);

        sortedFolders.forEach(dirPath => {
            const clusterId = `cluster_${dirPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const parentPath = path.dirname(dirPath).replace(/\\/g, '/');
            const parentId = parentPath !== '.' && parentPath !== '' ? `cluster_${parentPath.replace(/[^a-zA-Z0-9]/g, '_')}` : undefined;

            const cluster: Cluster = {
                id: clusterId,
                label: path.basename(dirPath),
                collapsed: false,
                bounds: { x: 0, y: 0, width: 0, height: 0 }, // 나중에 계산
                children: [],
                parent_id: parentId
            };
            clusterMap.set(dirPath, cluster);
            clusters.push(cluster);
        });

        // 3. 노드 생성 및 클러스터 할당
        const nodeSpacingX = 350;
        const nodeSpacingY = 150;
        const clusterSpacingX = 1000;
        const clusterSpacingY = 1500;
        const clusterCols = Math.ceil(Math.sqrt(Math.max(clusters.filter(c => !c.parent_id).length, 1)));

        // 최상위 폴더(부모가 없는 클러스터) 기준으로 배치 시작
        let topClusterIdx = 0;
        const directoryGroups = new Map<string, typeof structure.files>();
        structure.files.forEach(file => {
            const dir = path.dirname(file.path).replace(/\\/g, '/');
            const group = directoryGroups.get(dir) || [];
            group.push(file);
            directoryGroups.set(dir, group);
        });

        directoryGroups.forEach((files, dirName) => {
            const clusterPath = dirName === '.' ? '' : dirName;
            const cluster = clusterMap.get(clusterPath);
            const clusterId = cluster ? cluster.id : 'root_cluster';

            // ROOT에 파일이 있는 경우를 위한 가상 클러스터 처리
            if (dirName === '.' && !clusterMap.has('')) {
                // Skip or handle root files later
            }

            const clusterX = (topClusterIdx % clusterCols) * clusterSpacingX;
            const clusterY = Math.floor(topClusterIdx / clusterCols) * clusterSpacingY;

            const layerCounters = new Map<number, number>();

            files.forEach((file) => {
                const hints = getVisualHints(file.path);
                const layer = hints.layer;
                const currentCount = layerCounters.get(layer) || 0;
                layerCounters.set(layer, currentCount + 1);

                const layerYOffset = layer * 350 + 50;

                let nodeX, nodeY;
                let finalClusterId = clusterId;

                if (file.type === 'documentation') {
                    nodeX = (currentCount % 4) * 200;
                    nodeY = Math.floor(currentCount / 4) * 150 + 100;
                    finalClusterId = 'doc_shelf';
                } else {
                    nodeX = (currentCount % 5) * nodeSpacingX + 350;
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

                if (finalClusterId === 'doc_shelf') {
                    // Handled by doc_shelf special cluster
                } else if (cluster) {
                    cluster.children.push(node.id);
                }
            });

            if (clusterPath === '' || !clusterMap.get(path.dirname(clusterPath).replace(/\\/g, '/'))) {
                topClusterIdx++;
            }
        });

        // 4. Special Clusters 및 미지정 노드 처리
        clusters.push({
            id: 'doc_shelf',
            label: '📚 Documentation Shelf',
            collapsed: false,
            bounds: { x: -1600, y: -100, width: 900, height: 1200 },
            children: nodes.filter(n => n.data.cluster_id === 'doc_shelf').map(n => n.id)
        });

        // External Modules Cluster
        const externalNodes = nodes.filter(n => n.type === 'external');
        if (externalNodes.length > 0) {
            console.log(`[SYNAPSE] Grouping ${externalNodes.length} external modules.`);
            clusters.push({
                id: 'cluster_external',
                label: '🌐 External Modules',
                collapsed: false,
                bounds: { x: 3000, y: 0, width: 1000, height: 1500 },
                children: externalNodes.map(n => {
                    n.data.cluster_id = 'cluster_external';
                    // Reposition external nodes to be inside this cluster
                    const idx = externalNodes.indexOf(n);
                    n.position.x = 3100 + (idx % 3) * 350;
                    n.position.y = 100 + Math.floor(idx / 3) * 200;

                    // Add visual distinction
                    n.data.label = `[[ ${n.data.label} ]]`;
                    return n.id;
                })
            });
        }

        // 5. 의존성 기반 엣지 생성
        structure.dependencies.forEach((dep) => {
            const fromNode = nodes.find(n => n.data.file === dep.from);
            const toNode = nodes.find(n => n.data.file === dep.to);

            if (fromNode && toNode) {
                const edge = this.createEdge(fromNode.id, toNode.id, dep.type);
                edges.push(edge);
            }
        });

        console.log('✅ 초기 순서도 생성 완료 (Hierarchical Clustered)');
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
            history: '#d65d0e',     // 주황/갈색 (브라운)
            external: '#83a598'      // 파란색 (외부 라이브러리)
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
                style: 'solid',
                color: style.color,
                animated: true
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
            case 'external': return ['[[', ']]'];
            default: return ['[', ']'];
        }
    }
}
