import { 
  ValidationDedupeCache, 
  ValidationCycleGuard, 
  TraversalStateCache 
} from '../ValidationLayerGuards';

describe('ValidationLayerGuards', () => {

  describe('ValidationDedupeCache', () => {
    test('Prevents duplicate rule applications on the same edge', () => {
      const cache = new ValidationDedupeCache();
      
      expect(cache.shouldEvaluate('edge_1', 'BoundaryValidator')).toBe(true);
      expect(cache.shouldEvaluate('edge_1', 'BoundaryValidator')).toBe(false); // Dupe
      expect(cache.shouldEvaluate('edge_2', 'BoundaryValidator')).toBe(true); // Different edge
      expect(cache.shouldEvaluate('edge_1', 'TypeValidator')).toBe(true); // Different rule
    });
  });

  describe('ValidationCycleGuard', () => {
    test('Detects cycles and allows valid trees', () => {
      const guard = new ValidationCycleGuard();
      
      expect(guard.enterNode('trace_1', 'NodeA')).toBe(true);
      expect(guard.enterNode('trace_1', 'NodeB')).toBe(true);
      expect(guard.enterNode('trace_1', 'NodeA')).toBe(false); // Cycle detected! SHORT CIRCUIT.
      
      guard.exitNode('trace_1', 'NodeB');
      expect(guard.enterNode('trace_1', 'NodeC')).toBe(true); // Valid branch
    });
  });

  describe('TraversalStateCache', () => {
    test('Caches and retrieves traversal results', () => {
      const cache = new TraversalStateCache();
      
      expect(cache.getResult('NodeX', 'ImportCycleValidator')).toBeUndefined();
      
      cache.cacheResult('NodeX', 'ImportCycleValidator', true);
      
      expect(cache.getResult('NodeX', 'ImportCycleValidator')).toBe(true);
    });
  });

});
