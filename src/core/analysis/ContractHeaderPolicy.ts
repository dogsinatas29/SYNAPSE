export class ContractHeaderPolicy {
    // 서브시스템 경계를 정의하는 계약 헤더
    private static readonly PATTERNS: RegExp[] = [
        /^linux\/fs\.h$/,
        /^linux\/blkdev\.h$/,
        /^linux\/blk-mq\.h$/,
        /^linux\/netdevice\.h$/,
        /^linux\/net\.h$/,
        /^linux\/skbuff\.h$/,
        /^linux\/io_uring\.h$/,
        /^linux\/dma-mapping\.h$/,
        /^linux\/scatterlist\.h$/,
        /^linux\/interrupt\.h$/,
        /^linux\/irq\.h$/,
        /^linux\/pci\.h$/,
        /^linux\/usb\.h$/,
        /^linux\/platform_device\.h$/,
        /^linux\/clk\.h$/,
        /^linux\/regulator\/consumer\.h$/,
    ];

    public static isContractHeader(nodeId: string): boolean {
        if (!nodeId) return false;
        const norm = nodeId.replace(/\\/g, '/').toLowerCase();
        const tail = norm.includes('/include/')
            ? norm.split('/include/').pop() || norm
            : norm.split('/').slice(-2).join('/');
        return this.PATTERNS.some(p => p.test(tail) || p.test(norm.split('/').pop() || ''));
    }
}
