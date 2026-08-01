export class PlatformHeaderPolicy {
    // 커널 런타임 인프라 (확정 목록)
    private static readonly PATTERNS: RegExp[] = [
        // 타입 기반
        /^linux\/types\.h$/, /^uapi\/linux\/types\.h$/, /^asm\/types\.h$/,
        /^linux\/stddef\.h$/, /^linux\/limits\.h$/, /^linux\/bug\.h$/,
        // 메모리/할당
        /^linux\/slab\.h$/, /^linux\/gfp\.h$/, /^linux\/mm\.h$/,
        /^linux\/vmalloc\.h$/,
        // 언어 유틸
        /^linux\/kernel\.h$/, /^linux\/string\.h$/, /^linux\/errno\.h$/,
        /^linux\/bitops\.h$/, /^linux\/compiler(?:_types)?\.h$/,
        /^linux\/printk\.h$/, /^linux\/export\.h$/,
        // 컨테이너/자료구조 (순수 매크로)
        /^linux\/list\.h$/, /^linux\/rbtree\.h$/, /^linux\/hash\.h$/,
        // 모듈 인프라
        /^linux\/module\.h$/, /^linux\/init\.h$/, /^linux\/kconfig\.h$/,
        // C stdlib 수준
        /^stdint\.h$/, /^stddef\.h$/, /^stdbool\.h$/,
        /^string\.h$/, /^errno\.h$/, /^limits\.h$/,
    ];

    public static isPlatformHeader(nodeId: string): boolean {
        if (!nodeId) return false;
        const norm = nodeId.replace(/\\/g, '/').toLowerCase();
        // "include/linux/types.h" 형태도 매칭
        const tail = norm.includes('/include/') 
            ? norm.split('/include/').pop() || norm 
            : norm.split('/').slice(-2).join('/');
        return this.PATTERNS.some(p => p.test(tail) || p.test(norm.split('/').pop() || ''));
    }
}
