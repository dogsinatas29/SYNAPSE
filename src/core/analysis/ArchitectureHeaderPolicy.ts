export class ArchitectureHeaderPolicy {
    // 아키텍처 종속 인프라 및 헤더
    private static readonly PATTERNS: RegExp[] = [
        /(?:^|\/)asm\/.*\.h$/,
        /(?:^|\/)arch\/.*\/include\/.*\.h$/,
        /(?:^|\/)arch\/.*\/kernel\/.*\.h$/,
        /(?:^|\/)arch\/.*\/mm\/.*\.c$/, // init.c 등 인프라성 파일
        /(?:^|\/)arch\/.*\/delay\.h$/,
    ];

    public static isArchitectureHeader(nodeId: string): boolean {
        if (!nodeId) return false;
        const norm = nodeId.replace(/\\/g, '/').toLowerCase();
        
        return this.PATTERNS.some(p => p.test(norm));
    }
}
