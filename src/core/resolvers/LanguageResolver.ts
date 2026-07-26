import { CodeSummary, EdgeProvenance } from '../../types/schema';

export interface LanguageResolver {
    /**
     * Resolves the provenance of external references extracted from the file.
     * @param filePath The absolute path to the file
     * @param content The raw content of the source file
     * @param summary The code summary containing classes, functions, and references
     * @returns A boolean indicating whether the resolution was completely successful
     */
    resolve(filePath: string, content: string, summary: CodeSummary): boolean;
    
    /**
     * Checks if this resolver supports the given file extension
     */
    supportsExtension(ext: string): boolean;
}
