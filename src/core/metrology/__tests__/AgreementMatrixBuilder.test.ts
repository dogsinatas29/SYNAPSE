import { AgreementMatrixBuilder } from '../AgreementMatrixBuilder';

describe('AgreementMatrixBuilder', () => {
  let builder: AgreementMatrixBuilder;

  beforeEach(() => {
    builder = new AgreementMatrixBuilder();
  });

  test('Consensus Illusion Index (CII) separates agreement from ground truth', () => {
    // Both Regex and AST agree 95% of the time, but they only match reality 20% of the time.
    builder.recordAgreement({
      targetType: 'MacroExpansion',
      extractorA: 'RegexExtractor',
      extractorB: 'ASTExtractor',
      agreementRate: 0.95,
      groundTruthMatch: 0.20
    });

    const matrix = builder.generateMatrix();
    const result = matrix['RegexExtractor_vs_ASTExtractor_MacroExpansion'];

    expect(result).toBeDefined();
    expect(result.agreementRate).toBe(0.95);
    expect(result.groundTruthMatch).toBe(0.20);
    // CII should be 0.95 - 0.20 = 0.75
    expect(result.consensusIllusionIndex).toBeCloseTo(0.75, 4);
  });

  test('CII clamps at 0 if ground truth is higher than agreement', () => {
    builder.recordAgreement({
      targetType: 'SimpleFunction',
      extractorA: 'RegexExtractor',
      extractorB: 'ASTExtractor',
      agreementRate: 0.60,
      groundTruthMatch: 0.80
    });

    const matrix = builder.generateMatrix();
    const result = matrix['RegexExtractor_vs_ASTExtractor_SimpleFunction'];
    
    // CII should be clamped to 0
    expect(result.consensusIllusionIndex).toBe(0);
  });
});
