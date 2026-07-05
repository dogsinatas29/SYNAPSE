import { LanguageScanner, CodeSummary } from '../types/schema';

export class ScannerRegistry {
    private static instance: ScannerRegistry;
    private scanners: LanguageScanner[] = [];
    private initialized = false;

    private constructor() {}

    public static getInstance(): ScannerRegistry {
        if (!ScannerRegistry.instance) {
            ScannerRegistry.instance = new ScannerRegistry();
        }
        return ScannerRegistry.instance;
    }

    public register(scanner: LanguageScanner): void {
        const isDuplicate = this.scanners.some(s => s.constructor.name === scanner.constructor.name);
        if (isDuplicate) return;
        this.scanners.push(scanner);
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public markInitialized(): void {
        this.initialized = true;
    }

    public getScanner(ext: string): LanguageScanner | undefined {
        return this.scanners.find(s => s.supportsExtension(ext));
    }

    public scan(ext: string, content: string, summary: CodeSummary): boolean {
        const scanner = this.getScanner(ext);
        if (scanner) {
            scanner.parse(content, summary);
            return true;
        }
        return false;
    }

    public count(): number {
        return this.scanners.length;
    }

    public clear(): void {
        this.scanners = [];
        this.initialized = false;
    }
}
