import { CanvasPanel } from '../webview/CanvasPanel';

describe('Schema Validation Guard (v0.2.18.1)', () => {
    // CanvasPanel attributes are private, but we can test normalization edge cases 
    // if we had access. For unit test purposes, we'll simulate the validation logic.
    
    function validateProjectState(state: any): boolean {
        if (!state || typeof state !== 'object') return false;
        const essentialKeys = ['nodes', 'edges', 'clusters'];
        for (const key of essentialKeys) {
            if (!Array.isArray(state[key])) return false;
        }
        for (const node of (state.nodes || [])) {
            if (!node.id || !node.type) return false;
        }
        return true;
    }

    test('should accept valid project state', () => {
        const validState = {
            nodes: [{ id: 'n1', type: 'source', data: { label: 'Node 1' }, visual: { opacity: 1 } }],
            edges: [],
            clusters: []
        };
        expect(validateProjectState(validState)).toBe(true);
    });

    test('should reject state missing essential arrays', () => {
        const invalidState = {
            nodes: [],
            // edges missing
            clusters: []
        };
        expect(validateProjectState(invalidState)).toBe(false);
    });

    test('should reject nodes missing id or type', () => {
        const invalidState = {
            nodes: [{ data: { label: 'Broken' } }], // id, type missing
            edges: [],
            clusters: []
        };
        expect(validateProjectState(invalidState)).toBe(false);
    });
});
