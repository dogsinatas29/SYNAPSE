import { FlowchartGenerator } from '../core/FlowchartGenerator';
import { Node, Edge, Cluster } from '../types/schema';

describe('FlowchartGenerator', () => {
    const generator = new FlowchartGenerator();

    it('should generate Mermaid diagram with subgraph blocks for clusters', () => {
        const nodes: Node[] = [
            {
                id: 'node_1',
                type: 'source',
                status: 'active',
                position: { x: 100, y: 100 },
                data: { label: 'file1.ts', cluster_id: 'cluster_1' },
                visual: { opacity: 1 }
            },
            {
                id: 'node_2',
                type: 'source',
                status: 'active',
                position: { x: 200, y: 200 },
                data: { label: 'file2.ts', cluster_id: 'cluster_1' },
                visual: { opacity: 1 }
            },
            {
                id: 'node_3',
                type: 'source',
                status: 'active',
                position: { x: 300, y: 300 },
                data: { label: 'standalone.ts' },
                visual: { opacity: 1 }
            }
        ];

        const edges: Edge[] = [
            {
                id: 'edge_1',
                from: 'node_1',
                to: 'node_2',
                type: 'dependency',
                is_approved: true,
                visual: { thickness: 2, style: 'solid', color: '#000' }
            }
        ];

        const clusters: Cluster[] = [
            {
                id: 'cluster_1',
                label: 'src',
                collapsed: false,
                bounds: { x: 0, y: 0, width: 500, height: 500 },
                children: ['node_1', 'node_2']
            }
        ];

        const mermaid = generator.generateMermaidDiagram(nodes, edges, clusters);

        expect(mermaid).toContain('subgraph cluster_1 ["src"]');
        expect(mermaid).toContain('node_1[file1.ts]');
        expect(mermaid).toContain('node_2[file2.ts]');
        expect(mermaid).toContain('end');
        expect(mermaid).toContain('node_3[standalone.ts]');
        expect(mermaid).toContain('node_1 --> node_2');
    });

    it('should maintain backward compatibility when clusters are not provided', () => {
        const nodes: Node[] = [
            {
                id: 'node_1',
                type: 'source',
                status: 'active',
                position: { x: 100, y: 100 },
                data: { label: 'file1.ts' },
                visual: { opacity: 1 }
            }
        ];
        const edges: Edge[] = [];

        const mermaid = generator.generateMermaidDiagram(nodes, edges);

        expect(mermaid).not.toContain('subgraph');
        expect(mermaid).toContain('node_1[file1.ts]');
    });
    it('should place documentation nodes in the doc_shelf cluster', () => {
        const structure = {
            folders: ['src'],
            files: [
                { path: 'src/main.ts', type: 'source' as const, description: 'source' },
                { path: 'README.md', type: 'documentation' as const, description: 'doc' }
            ],
            dependencies: []
        };

        const { nodes, clusters } = generator.generateInitialFlowchart(structure);

        const docNode = nodes.find(n => n.data.file === 'README.md');
        expect(docNode?.data.cluster_id).toBe('doc_shelf');
        expect(docNode?.position.x).toBeLessThan(0); // Should be in the shelf area

        const docShelf = clusters.find(c => c.id === 'doc_shelf');
        expect(docShelf).toBeDefined();
        expect(docShelf?.children).toContain(docNode?.id);
    });

    it('should handle root-level cluster_id as a fallback for Mermaid generation', () => {
        const nodes: any[] = [
            { id: 'node1', type: 'source', data: { label: 'Node 1' }, cluster_id: 'manual_group' },
            { id: 'node2', type: 'source', data: { label: 'Node 2' }, cluster_id: 'manual_group' }
        ];
        const clusters: any[] = [
            { id: 'manual_group', label: 'Manual Group' }
        ];

        const mermaid = generator.generateMermaidDiagram(nodes, [], clusters);
        expect(mermaid).toContain('subgraph manual_group ["Manual Group"]');
        expect(mermaid).toContain('node1[Node 1]');
        expect(mermaid).toContain('node2[Node 2]');
    });
});
