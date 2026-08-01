import { IEvidenceProvider } from './IEvidenceProvider';
import { EvidenceIR } from './EvidenceIR';
import { FileScanner } from '../../FileScanner';

export class RegexProvider implements IEvidenceProvider {
    readonly name = 'RegexProvider';
    private scanner: FileScanner;
    private targetFiles: string[];

    constructor(targetFiles: string[], scanner?: FileScanner) {
        this.targetFiles = targetFiles;
        this.scanner = scanner || new FileScanner();
    }

    async collect(): Promise<EvidenceIR[]> {
        const evidenceList: EvidenceIR[] = [];

        for (const file of this.targetFiles) {
            const summary = this.scanner.scanFile(file);

            if (summary.references) {
                for (const ref of summary.references) {
                    evidenceList.push({
                        id: this.generateId(),
                        file: file,
                        line: 0, // FileScanner doesn't provide line number in MVP
                        source: file,
                        target: ref.target,
                        evidenceType: 'Dependency', // Treating all regex findings as generic dependencies for now
                        provider: this.name,
                        reason: `Regex matched reference to ${ref.target}`,
                        metadata: {
                            rawType: ref.type
                        }
                    });
                }
            }
        }

        return evidenceList;
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    }
}
