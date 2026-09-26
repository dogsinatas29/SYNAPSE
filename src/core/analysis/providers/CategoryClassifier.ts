export enum NodeCategory {
    TEST = 'TEST',
    GENERATED = 'GENERATED',
    COPY = 'COPY',
    UTILITY = 'UTILITY',
    RUNTIME = 'RUNTIME'
}

export class CategoryClassifier {
    public classify(filePath: string): NodeCategory {
        const p = filePath.toLowerCase();
        
        if (/\/test\/|\/tests\/|\/fixtures\/|\/mocks\/|\/stubs\/|\.test\.|\.spec\./.test(p)) {
            return NodeCategory.TEST;
        }
        
        if (/\/generated\/|\/out\/|\/dist\/|\/build\/|\.g\.ts|\.pb\./.test(p)) {
            return NodeCategory.GENERATED;
        }
        
        if (/\/util\/vs\/base\/|\/copy\//.test(p)) {
            return NodeCategory.COPY;
        }
        
        if (/\/base\/common\/|\/util\/|\/utils\/|\/helpers?\//.test(p)) {
            return NodeCategory.UTILITY;
        }
        
        return NodeCategory.RUNTIME;
    }

    public getWeight(category: NodeCategory): number {
        switch (category) {
            case NodeCategory.TEST: return 0.0;
            case NodeCategory.GENERATED: return 0.0;
            case NodeCategory.COPY: return 0.0;
            case NodeCategory.UTILITY: return 0.5; // Downweight
            case NodeCategory.RUNTIME: return 1.0;
            default: return 1.0;
        }
    }
}
