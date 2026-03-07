import { ProjectStructure, Node, Edge, Cluster, NodeType, EdgeType } from '../types/schema';
import * as path from 'path';
import { getVisualHints } from '../utils/visualHints';

export class FlowchartGenerator {
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

        structure.files.forEach(f => {
            let dir = path.dirname(f.path);
            while (dir !== '.' && dir !== '/' && dir !== '') {
                folders.add(dir.replace(/\\/g, '/'));
                dir = path.dirname(dir);
            }
        });
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
                bounds: { x: 0, y: 0, width: 0, height: 0 },
                children: [],
                parent_id: parentId
            };
            clusterMap.set(dirPath, cluster);
            clusters.push(cluster);
        });

        // 3. 의존성 기반 Rank 계산 (Topological Leveling)
        const inDegree = new Map<string, number>();
        const adj = new Map<string, string[]>();
        structure.files.forEach(f => {
            inDegree.set(f.path, 0);
            adj.set(f.path, []);
        });

        structure.dependencies.forEach(dep => {
            if (inDegree.has(dep.to)) {
                inDegree.set(dep.to, (inDegree.get(dep.to) || 0) + 1);
            }
            if (adj.has(dep.from)) {
                adj.get(dep.from)!.push(dep.to);
            }
        });

        const ranks = new Map<string, number>();
        const pathStack = new Set<string>();
        const calculateRank = (nodePath: string): number => {
            if (ranks.has(nodePath)) return ranks.get(nodePath)!;
            if (pathStack.has(nodePath)) return 0;
            pathStack.add(nodePath);
            let maxRank = 0;
            const neighbors = adj.get(nodePath) || [];
            for (const neighbor of neighbors) {
                maxRank = Math.max(maxRank, calculateRank(neighbor) + 1);
            }
            pathStack.delete(nodePath);
            ranks.set(nodePath, maxRank);
            return maxRank;
        };

        structure.files.forEach(f => {
            if (inDegree.get(f.path) === 0 && f.type !== 'documentation') {
                calculateRank(f.path);
            }
        });

        let recursionLimit = 0;
        structure.files.forEach(f => {
            if (!ranks.has(f.path) && f.type !== 'documentation') {
                if (recursionLimit++ > 1000) return;
                calculateRank(f.path);
            }
        });

        let maxOverallRank = 0;
        ranks.forEach(rank => maxOverallRank = Math.max(maxOverallRank, rank));
        ranks.forEach((rank, nodeId) => ranks.set(nodeId, maxOverallRank - rank));

        // 4. 노드 생성 및 클러스터 할당
        const clusterSpacingX = 1000;
        const clusterSpacingY = 1500;
        const clusterCols = Math.ceil(Math.sqrt(Math.max(clusters.filter(c => !c.parent_id).length, 1)));

        // Ghost Node Clustering (Pre-pass) - [v0.2.17] Always initialize to avoid undefined
        clusters.push({
            id: 'cluster_ghosts',
            label: '👻 External Ghosts',
            collapsed: true,
            bounds: { x: 0, y: -800, width: 600, height: 400 },
            children: []
        });

        let topClusterIdx = 1;
        const directoryGroups = new Map<string, typeof structure.files>();
        structure.files.forEach(file => {
            const dir = path.dirname(file.path).replace(/\\/g, '/');
            const group = directoryGroups.get(dir) || [];
            group.push(file);
            directoryGroups.set(dir, group);
        });

        // Handle Project Root
        const rootFiles = directoryGroups.get('.') || [];
        const rootClusterId = 'cluster_root';
        if (rootFiles.length > 0) {
            clusters.push({
                id: rootClusterId,
                label: '🏠 Project Root',
                collapsed: false,
                bounds: { x: 0, y: 1500, width: 0, height: 0 },
                children: []
            });

            rootFiles.forEach((file, idx) => {
                const hints = getVisualHints(file.path);
                if (file.type === 'documentation') {
                    const node = this.createNode(file.path, file.type, file.description, -200 + (idx % 4) * 200, 1100 + Math.floor(idx / 4) * 150, hints.layer, hints.priority, 'doc_shelf', (file as any).intelligence);
                    nodes.push(node);
                } else {
                    const node = this.createNode(file.path, file.type, file.description, (idx % 4) * 200 + 30, 1500 + Math.floor(idx / 4) * 150 + 100, hints.layer, hints.priority, rootClusterId, (file as any).intelligence);
                    nodes.push(node);
                    clusters.find(c => c.id === rootClusterId)?.children.push(node.id);
                }
            });
            directoryGroups.delete('.');
        }

        // Handle Nested Clusters
        directoryGroups.forEach((files, dirName) => {
            const cluster = clusterMap.get(dirName);
            const clusterId = cluster ? cluster.id : 'root_cluster';
            const clusterX = (topClusterIdx % clusterCols) * clusterSpacingX;
            const clusterY = Math.floor(topClusterIdx / clusterCols) * clusterSpacingY;

            files.forEach((file, idx) => {
                const hints = getVisualHints(file.path);
                if (file.type === 'documentation') {
                    const node = this.createNode(file.path, file.type, file.description, -200 + (idx % 4) * 200, 1100 + Math.floor(idx / 4) * 150, hints.layer, hints.priority, 'doc_shelf', (file as any).intelligence);
                    nodes.push(node);
                } else {
                    const node = this.createNode(file.path, file.type, file.description, clusterX + (idx % 4) * 200 + 30, clusterY + Math.floor(idx / 4) * 150 + 100, hints.layer, hints.priority, clusterId, (file as any).intelligence);
                    nodes.push(node);
                    if (cluster) cluster.children.push(node.id);
                }
            });
            topClusterIdx++;
        });

        // 4. Special Clusters
        clusters.push({
            id: 'doc_shelf',
            label: '📚 Documentation Shelf',
            collapsed: true,
            bounds: { x: -200, y: 1100, width: 800, height: 600 },
            children: nodes.filter(n => n.data.cluster_id === 'doc_shelf').map(n => n.id)
        });

        // 5. Edges
        structure.dependencies.forEach(dep => {
            const fromNode = nodes.find(n => n.data.file === dep.from);
            const toNode = nodes.find(n => n.data.file === dep.to);
            if (fromNode && toNode) {
                const edge = this.createEdge(fromNode.id, toNode.id, dep.type, dep.isApproved !== false);
                edges.push(edge);
            }
        });

        return { nodes, edges, clusters: clusters.filter(c => c.children.length > 0 || c.id === 'doc_shelf' || c.id === 'cluster_ghosts') };
    }

    private createNode(file: string, type: NodeType, description: string, x: number, y: number, layer: number, priority: number, clusterId: string, intelligence: any): Node {
        const colorMap: Record<NodeType, string> = {
            source: '#b8bb26', cluster: '#83a598', documentation: '#fabd2f',
            test: '#fe8019', config: '#d3869b', history: '#d65d0e', external: '#83a598',
            event: '#b16286'
        };
        return {
            id: `node_${file.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
            type,
            position: { x, y },
            status: 'proposed',
            data: {
                label: path.basename(file),
                file,
                description,
                layer,
                priority,
                cluster_id: clusterId,
                color: colorMap[type]
            },
            intelligence,
            visual: { opacity: 0.5 }
        };
    }

    private createEdge(fromId: string, toId: string, type: EdgeType, isApproved: boolean = true): Edge {
        const edgeStyles: Record<string, { color: string, thickness: number }> = {
            'dependency': { color: '#888', thickness: 1 },
            'flow': { color: '#4a9eff', thickness: 2 },
            'data_flow': { color: '#4a9eff', thickness: 2 }, // [v0.2.18.1.1] Same as flow
            'loop_back': { color: '#ff4a4a', thickness: 1 },
            'event': { color: '#ffcc00', thickness: 1 },
            'reference': { color: '#b8bb26', thickness: 1.5 },
            'static_unidirectional': { color: '#fabd2f', thickness: 2 },
            'control_bidirectional': { color: '#d3869b', thickness: 2 }
        };
        const style = edgeStyles[type] || edgeStyles['dependency'];
        return {
            id: `edge_${fromId}_${toId}_${Date.now()}`,
            from: fromId,
            to: toId,
            type,
            is_approved: isApproved,
            visual: { color: style.color, thickness: style.thickness, style: 'solid' }
        };
    }

    public generateMermaidDiagram(nodes: Node[], edges: Edge[], clusters?: Cluster[]): string {
        let mermaid = 'flowchart TD\n';
        if (clusters) {
            clusters.forEach(c => {
                mermaid += `  subgraph ${c.id} ["${c.label}"]\n`;
                nodes.filter(n => n.data.cluster_id === c.id).forEach(n => {
                    mermaid += `    ${n.id}["${n.data.label}"]\n`;
                });
                mermaid += '  end\n';
            });
        }
        edges.forEach(e => {
            mermaid += `  ${e.from} --> ${e.to}\n`;
        });
        return mermaid;
    }
}
