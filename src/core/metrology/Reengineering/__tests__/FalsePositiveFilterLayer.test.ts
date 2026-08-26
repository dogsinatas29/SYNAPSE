import { FalsePositiveFilterLayer, RejectReason } from '../FalsePositiveFilterLayer';

describe('FalsePositiveFilterLayer', () => {
  let filter: FalsePositiveFilterLayer;

  beforeEach(() => {
    filter = new FalsePositiveFilterLayer();
  });

  test('Accepts valid candidates', () => {
    const candidate = { id: 'edge-1', sourceNode: 'A', targetNode: 'B', extractorId: 'Regex', confidence: 0.9 };
    // AST is valid, CII is low (0.1)
    const result = filter.evaluateCandidate(candidate, true, 0.1);
    expect(result).toBe(true);
    expect(filter.getAllRejections().length).toBe(0);
  });

  test('Rejects if AST validation fails and logs reason', () => {
    const candidate = { id: 'edge-2', sourceNode: 'A', targetNode: 'C', extractorId: 'Regex', confidence: 0.9 };
    // AST is invalid
    const result = filter.evaluateCandidate(candidate, false, 0.1);
    expect(result).toBe(false);
    
    const log = filter.getRejectionLog('edge-2');
    expect(log).toBeDefined();
    expect(log?.reason).toBe(RejectReason.AST_VALIDATION_FAILED);
  });

  test('Rejects if Consensus Illusion Index is too high', () => {
    const candidate = { id: 'edge-3', sourceNode: 'B', targetNode: 'C', extractorId: 'Regex', confidence: 0.9 };
    // AST is technically valid, but CII is 0.8 (which is >= default threshold 0.5)
    // This implies it is a hallucination that multiple extractors mistakenly agree on
    const result = filter.evaluateCandidate(candidate, true, 0.8);
    expect(result).toBe(false);

    const log = filter.getRejectionLog('edge-3');
    expect(log).toBeDefined();
    expect(log?.reason).toBe(RejectReason.CONSENSUS_ILLUSION_HIGH);
    expect(log?.ciiScore).toBe(0.8);
  });
});
