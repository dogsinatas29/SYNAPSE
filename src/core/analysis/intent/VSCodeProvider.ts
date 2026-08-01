import { IEvidenceProvider } from './IEvidenceProvider';
import { EvidenceIR } from './EvidenceIR';

// NOTE: Since this is an MVP without active vscode extension context injection in tests,
// we create structural stubs for the collectors. In the actual execution environment,
// these will wrap `vscode.commands.executeCommand('vscode.executeDefinitionProvider', ...)`
// and catch any errors to prevent cascading failures.

class DefinitionCollector {
    async collect(targetFiles: string[]): Promise<EvidenceIR[]> {
        try {
            // TODO: call executeDefinitionProvider
            return [];
        } catch (error) {
            console.error(`[DefinitionCollector] failed, returning empty evidence:`, error);
            return [];
        }
    }
}

class ReferenceCollector {
    async collect(targetFiles: string[]): Promise<EvidenceIR[]> {
        try {
            // TODO: call executeReferenceProvider
            return [];
        } catch (error) {
            console.error(`[ReferenceCollector] failed, returning empty evidence:`, error);
            return [];
        }
    }
}

class SymbolCollector {
    async collect(targetFiles: string[]): Promise<EvidenceIR[]> {
        try {
            // TODO: call executeDocumentSymbolProvider
            return [];
        } catch (error) {
            console.error(`[SymbolCollector] failed, returning empty evidence:`, error);
            return [];
        }
    }
}

export class VSCodeProvider implements IEvidenceProvider {
    readonly name = 'VSCodeProvider';
    private definitionCollector = new DefinitionCollector();
    private referenceCollector = new ReferenceCollector();
    private symbolCollector = new SymbolCollector();
    
    private targetFiles: string[];

    constructor(targetFiles: string[]) {
        this.targetFiles = targetFiles;
    }

    async collect(): Promise<EvidenceIR[]> {
        try {
            // Execute all MVP collectors concurrently.
            // If any fail, they internally catch the error and return [] to ensure 
            // the pipeline doesn't break.
            const [definitions, references, symbols] = await Promise.all([
                this.definitionCollector.collect(this.targetFiles),
                this.referenceCollector.collect(this.targetFiles),
                this.symbolCollector.collect(this.targetFiles)
            ]);

            return [...definitions, ...references, ...symbols];
        } catch (error) {
            // Ultimate fallback for the facade
            console.error(`[VSCodeProvider] Critical failure, returning empty array.`, error);
            return [];
        }
    }
}
