import { EvidenceIR } from './EvidenceIR';

export interface IEvidenceProvider {
    readonly name: string;

    collect(): Promise<EvidenceIR[]>;
}
