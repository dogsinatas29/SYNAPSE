import { LogicAnalyzer } from '../core/LogicAnalyzer';

// Helper: 최소 ProjectState 생성
function makeState(nodes: any[], edges: any[] = [], clusters: any[] = []): any {
    return { nodes, edges, clusters };
}

function makeNode(id: string, label: string, content = '', overrides: any = {}): any {
    return {
        id,
        type: 'component',
        data: { label, content, ...overrides },
        position: { x: 0, y: 0 },
        visual: { opacity: 1.0 },
        ...overrides._nodeLevel
    };
}

function makeEdge(from: string, to: string, type = 'dependency'): any {
    return { id: `${from}--${to}`, from, to, type };
}

describe('LogicAnalyzer', () => {
    let analyzer: LogicAnalyzer;

    beforeEach(() => {
        analyzer = new LogicAnalyzer();
    });

    // =============================================
    // 1. Deterministic Violation Tests (Tombstone)
    // =============================================
    describe('[v0.2.21] detectDeterministicViolations', () => {
        it('should flag "virtual" keyword as Tombstone', () => {
            const nodes = [makeNode('n1', 'Controller', 'virtual void update();')];
            const issues = analyzer.analyze(makeState(nodes));
            const det = issues.filter(i => i.message.includes('Tombstone') && i.message.includes('virtual'));
            expect(det.length).toBeGreaterThan(0);
            expect(det[0].nodeIds).toContain('n1');
            expect(det[0].severity).toBe('critical');
        });

        it('should flag "malloc" as Tombstone', () => {
            const nodes = [makeNode('n1', 'Allocator', 'void* ptr = malloc(100);')];
            const issues = analyzer.analyze(makeState(nodes));
            const det = issues.filter(i => i.message.includes('Tombstone') && i.message.includes('malloc'));
            expect(det.length).toBeGreaterThan(0);
        });

        it('should flag "new " keyword as Tombstone', () => {
            const nodes = [makeNode('n1', 'Factory', 'MyClass* obj = new MyClass();')];
            const issues = analyzer.analyze(makeState(nodes));
            const det = issues.filter(i => i.message.includes('Tombstone') && i.message.includes('new'));
            expect(det.length).toBeGreaterThan(0);
        });

        it('should flag "throw" as Tombstone', () => {
            const nodes = [makeNode('n1', 'ErrorHandler', 'throw std::runtime_error("err");')];
            const issues = analyzer.analyze(makeState(nodes));
            const det = issues.filter(i => i.message.includes('Tombstone') && i.message.includes('exception'));
            expect(det.length).toBeGreaterThan(0);
        });

        it('should flag possible recursion as Tombstone', () => {
            // 함수명이 노드 label과 동일하고, content 내에 2번 이상 등장 (재귀 의심)
            const nodes = [makeNode('n1', 'fibonacci', 'int fibonacci(int n) { return fibonacci(n-1) + fibonacci(n-2); }')];
            const issues = analyzer.analyze(makeState(nodes));
            const det = issues.filter(i => i.message.includes('Tombstone') && i.message.includes('Recursion'));
            expect(det.length).toBeGreaterThan(0);
        });

        it('should NOT flag clean deterministic code', () => {
            const nodes = [makeNode('n1', 'PureCompute', 'int add(int a, int b) { return a + b; }')];
            const issues = analyzer.analyze(makeState(nodes));
            const det = issues.filter(i => i.message.includes('Tombstone'));
            expect(det.length).toBe(0);
        });

        it('should NOT flag nodes with no content', () => {
            const nodes = [makeNode('n1', 'EmptyNode', '')];
            const issues = analyzer.analyze(makeState(nodes));
            const det = issues.filter(i => i.message.includes('Tombstone'));
            expect(det.length).toBe(0);
        });
    });

    // =============================================
    // 2. Circular Dependency Tests
    // =============================================
    describe('detectCircularDependencies', () => {
        it('should detect simple A -> B -> A cycle', () => {
            const nodes = [makeNode('A', 'ModuleA'), makeNode('B', 'ModuleB')];
            const edges = [makeEdge('A', 'B'), makeEdge('B', 'A')];
            const issues = analyzer.analyze(makeState(nodes, edges));
            const circular = issues.filter(i => i.type === 'circular');
            expect(circular.length).toBeGreaterThan(0);
        });

        it('should detect 3-node cycle A -> B -> C -> A', () => {
            const nodes = [makeNode('A', 'A'), makeNode('B', 'B'), makeNode('C', 'C')];
            const edges = [makeEdge('A', 'B'), makeEdge('B', 'C'), makeEdge('C', 'A')];
            const issues = analyzer.analyze(makeState(nodes, edges));
            const circular = issues.filter(i => i.type === 'circular');
            expect(circular.length).toBeGreaterThan(0);
        });

        it('should NOT flag a DAG (no cycle)', () => {
            const nodes = [makeNode('A', 'A'), makeNode('B', 'B'), makeNode('C', 'C')];
            const edges = [makeEdge('A', 'B'), makeEdge('A', 'C'), makeEdge('B', 'C')];
            const issues = analyzer.analyze(makeState(nodes, edges));
            const circular = issues.filter(i => i.type === 'circular');
            expect(circular.length).toBe(0);
        });
    });

    // =============================================
    // 3. Schema Violation Tests
    // =============================================
    describe('detectSchemaViolations', () => {
        it('should flag unknown node type as schema-violation', () => {
            const node = { ...makeNode('n1', 'Weird'), type: 'unknownType999' };
            const issues = analyzer.analyze(makeState([node]));
            const schemaIssues = issues.filter(i => i.type === 'schema-violation');
            expect(schemaIssues.length).toBeGreaterThan(0);
            expect(schemaIssues[0].message).toContain('unknownType999');
        });

        it('should flag edge with missing "from" as schema-violation', () => {
            const nodes = [makeNode('n1', 'Node1'), makeNode('n2', 'Node2')];
            const badEdge = { id: 'bad', from: '', to: 'n2', type: 'dependency' };
            const issues = analyzer.analyze(makeState(nodes, [badEdge]));
            const schemaIssues = issues.filter(i => i.type === 'schema-violation');
            expect(schemaIssues.length).toBeGreaterThan(0);
        });
    });

    // =============================================
    // 4. Isolated Node Tests
    // =============================================
    describe('detectIsolatedNodes', () => {
        it('should flag component node with no edges as isolated', () => {
            const nodes = [makeNode('n1', 'Orphan')];
            const issues = analyzer.analyze(makeState(nodes, []));
            const isolated = issues.filter(i => i.type === 'isolated');
            expect(isolated.length).toBeGreaterThan(0);
        });

        it('should NOT flag documentation node without edges', () => {
            const node = { ...makeNode('n1', 'Docs'), type: 'documentation' };
            const issues = analyzer.analyze(makeState([node], []));
            const isolated = issues.filter(i => i.type === 'isolated');
            expect(isolated.length).toBe(0);
        });
    });

    // =============================================
    // 5. Issue → Visual State Mapping (Integration)
    // =============================================
    describe('Tombstone issue → nodeIds mapping', () => {
        it('Tombstone issue should reference the correct node id', () => {
            const nodes = [makeNode('target-node', 'BadCode', 'void* p = malloc(256);')];
            const issues = analyzer.analyze(makeState(nodes));
            const tombstone = issues.find(i => i.message.includes('Tombstone') && i.message.includes('malloc'));
            expect(tombstone).toBeDefined();
            expect(tombstone!.nodeIds).toContain('target-node');
        });

        it('multiple violations in same node should all reference same nodeId', () => {
            const nodes = [makeNode('multi-bad', 'MultiViolator', 'virtual void* p = malloc(100); throw err;')];
            const issues = analyzer.analyze(makeState(nodes));
            const tombstones = issues.filter(i => i.message.includes('Tombstone') && i.nodeIds.includes('multi-bad'));
            // virtual, malloc, throw 각각 별도 이슈
            expect(tombstones.length).toBeGreaterThanOrEqual(3);
        });
    });
});
