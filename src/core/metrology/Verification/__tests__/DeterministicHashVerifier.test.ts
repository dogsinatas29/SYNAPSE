import { DeterministicHashVerifier } from '../DeterministicHashVerifier';

describe('DeterministicHashVerifier', () => {
  let verifier: DeterministicHashVerifier;

  beforeEach(() => {
    verifier = new DeterministicHashVerifier();
  });

  test('Produces identical hashes regardless of object key order', () => {
    const objA = { b: 2, a: 1, c: { y: 'test', x: 5 } };
    const objB = { c: { x: 5, y: 'test' }, a: 1, b: 2 };

    const hashA = verifier.generateHash(objA);
    const hashB = verifier.generateHash(objB);

    expect(hashA).toBe(hashB);
  });

  test('Removes non-deterministic fields like UUID and Timestamp', () => {
    const obj1 = { id: 'edge-123', timestamp: 123456789, data: 'hello' };
    const obj2 = { id: 'edge-123', timestamp: 987654321, data: 'hello' };
    
    // Also tests UUID removal
    const obj3 = { id: '550e8400-e29b-41d4-a716-446655440000', node: 'A' };
    const obj4 = { id: '660e8400-e29b-41d4-a716-446655440000', node: 'A' };

    expect(verifier.generateHash(obj1)).toBe(verifier.generateHash(obj2));
    expect(verifier.generateHash(obj3)).toBe(verifier.generateHash(obj4));
  });

  test('Sorts primitive arrays for stable canonicalization', () => {
    const obj1 = { edges: ['A->B', 'B->C'] };
    const obj2 = { edges: ['B->C', 'A->B'] };

    expect(verifier.generateHash(obj1)).toBe(verifier.generateHash(obj2));
  });
});
