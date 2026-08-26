export interface ExtractorAgreement {
  targetType: string;
  extractorA: string;
  extractorB: string;
  agreementRate: number; // 0.0 to 1.0
  groundTruthMatch: number; // 0.0 to 1.0
}

export class AgreementMatrixBuilder {
  private agreements: ExtractorAgreement[] = [];

  public recordAgreement(agreement: ExtractorAgreement): void {
    this.agreements.push(agreement);
  }

  public calculateConsensusIllusionIndex(agreement: ExtractorAgreement): number {
    // CII = Agreement - Ground Truth Match
    // High CII means they agree with each other, but they are both wrong.
    const cii = agreement.agreementRate - agreement.groundTruthMatch;
    return Math.max(0, cii); // Clamp to 0
  }

  public generateMatrix(): Record<string, any> {
    const matrix: Record<string, any> = {};
    for (const a of this.agreements) {
      const cii = this.calculateConsensusIllusionIndex(a);
      matrix[`${a.extractorA}_vs_${a.extractorB}_${a.targetType}`] = {
        agreementRate: a.agreementRate,
        groundTruthMatch: a.groundTruthMatch,
        consensusIllusionIndex: cii
      };
    }
    return matrix;
  }
}
