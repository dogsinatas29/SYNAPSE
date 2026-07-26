import { InterventionEngine } from '../core/analysis/reasoning/InterventionEngine';
import { ProjectState, Edge, Node } from '../types/schema';
import { TarjanSCC } from '../core/analysis/reasoning/TarjanSCC';

describe('InterventionEngine Stability Test', () => {
    test('Top 10 candidates should be 100% deterministic over 10 runs', () => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Generate a synthetic massive SCC (e.g., 200 nodes)
        // 2 Communities (0-99 and 100-199)
        for (let i = 0; i < 200; i++) {
            nodes.push({ id: `node_${i}`, status: 'active', data: { label: `node_${i}` } } as any);
        }

        // Internal edges for community 1 (0-99)
        for (let i = 0; i < 99; i++) {
            edges.push({ id: `e_${i}_${i+1}`, source: `node_${i}`, target: `node_${i+1}`, layer: 'user' });
            // Add some cycles
            if (i % 5 === 0) {
                edges.push({ id: `e_${i+1}_${i-1}`, source: `node_${i+1}`, target: `node_${i-1}`, layer: 'user' });
            }
        }
        // Force community 1 to be strongly connected
        edges.push({ id: 'e_99_0', source: 'node_99', target: 'node_0', layer: 'user' });

        // Internal edges for community 2 (100-199)
        for (let i = 100; i < 199; i++) {
            edges.push({ id: `e_${i}_${i+1}`, source: `node_${i}`, target: `node_${i+1}`, layer: 'user' });
            if (i % 5 === 0) {
                edges.push({ id: `e_${i+1}_${i-1}`, source: `node_${i+1}`, target: `node_${i-1}`, layer: 'user' });
            }
        }
        edges.push({ id: 'e_199_100', source: 'node_199', target: 'node_100', layer: 'user' });

        // Potential Bridges between the two communities
        // Bridge 1 (High Degree Hub)
        edges.push({ id: 'bridge_hub', source: 'node_0', target: 'node_100', layer: 'user' });
        edges.push({ id: 'bridge_hub_ret', source: 'node_100', target: 'node_0', layer: 'user' }); // Make it an SCC

        // Bridge 2 (Low Degree Gate)
        edges.push({ id: 'bridge_gate', source: 'node_50', target: 'node_150', layer: 'user' });
        edges.push({ id: 'bridge_gate_ret', source: 'node_150', target: 'node_50', layer: 'user' });

        const state: ProjectState = {
            nodes,
            edges,
            clusters: []
        };

        const sccs = TarjanSCC.extract(state);
        expect(sccs.length).toBeGreaterThan(0);

        const engine = new InterventionEngine();
        
        let baselineHash = '';
        
        for (let i = 0; i < 10; i++) {
            const bridges = engine.discoverCriticalBridges(state, sccs);
            const top10 = bridges.slice(0, 10);
            
            // Generate a simple hash based on candidate edge IDs in order
            const currentHash = top10.map(b => `${b.sourceId}->${b.targetId}`).join('|');
            
            if (i === 0) {
                baselineHash = currentHash;
                expect(top10.length).toBeGreaterThan(0);
            } else {
                expect(currentHash).toBe(baselineHash);
            }
        }
    });
});
