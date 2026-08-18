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
        const isDuplicate = this.scanners.some(s => s.constructor === scanner.constructor);
        if (isDuplicate) return;
        this.scanners.push(scanner);
        console.log('[REGISTERED]', scanner.constructor ? scanner.constructor.name : 'unknown', 'Total:', this.scanners.length);
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
        console.log(
            '[SCANNER_MATCH]',
            ext,
            scanner ? scanner.constructor.name : 'none',
            'Registered:', this.scanners.map(s => s.constructor.name)
        );
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
