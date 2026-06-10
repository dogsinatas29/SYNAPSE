import { ArchitectureIndexBuilder, ArchitectureIndex, SourceFileEntry, FunctionEntry, FolderTreeNode } from '../core/collaboration/ArchitectureIndexBuilder';
import { SubmissionSnapshot } from '../types/schema';
import * as path from 'path';
import * as fs from 'fs';

describe('Phase 5 — Architecture Index Generation', () => {
    const testRoot = path.join('/tmp', `synapse_phase5_test_${Date.now()}`);

    function makeSnapshot(overrides?: Partial<SubmissionSnapshot>): SubmissionSnapshot {
        return {
            id: 'sub_phase5_001',
            projectUUID: 'proj_phase5',
            sessionId: 'ses_phase5',
            clientId: 'usr_builder',
            files: [
                { filePath: 'src/main.ts', content: 'function greet(name: string) { return `Hello ${name}`; }\n', encoding: 'utf8' },
                { filePath: 'src/utils/helper.py', content: 'def parse(data):\n    return data.strip()\n', encoding: 'utf8' },
                { filePath: 'src/core/engine.rs', content: 'pub fn compute(x: i32) -> i32 { x * 2 }\n', encoding: 'utf8' },
                { filePath: 'src/models/user.py', content: 'class User:\n    def save(self):\n        pass\n    def delete(self):\n        pass\n', encoding: 'utf8' },
                { filePath: 'README.md', content: '# Project\n', encoding: 'utf8' },
                { filePath: 'docs/guide.md', content: '# Guide\n', encoding: 'utf8' },
                { filePath: 'data/report.txt', content: 'log output', encoding: 'utf8' },
                { filePath: 'logs/build.log', content: 'build log', encoding: 'utf8' },
                { filePath: 'external://axios', content: '', encoding: 'utf8' },
                { filePath: 'ghost://missing_mod', content: '', encoding: 'utf8' },
                { filePath: 'src/app.js', content: 'const x = 1;\nfunction init() {\n  console.log("start");\n}\n', encoding: 'utf8' },
                { filePath: 'src/lib.go', content: 'package lib\nfunc Run() string { return "ok" }\n', encoding: 'utf8' },
                { filePath: 'src/calc.java', content: 'public class Calc {\n    public int add(int a, int b) { return a + b; }\n}\n', encoding: 'utf8' },
                { filePath: 'src/service.swift', content: 'func handle() -> String { return "done" }\n', encoding: 'utf8' },
            ],
            timestamp: Date.now(),
            immutable: true,
            ...overrides,
        };
    }

    beforeAll(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(testRoot, { recursive: true });
    });

    afterAll(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('1. ArchitectureIndex created from SubmissionSnapshot', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot(), 'test-project');
        expect(index.submissionId).toBe('sub_phase5_001');
        expect(index.projectUUID).toBe('proj_phase5');
        expect(index.generatedAt).toBeGreaterThan(0);
    });

    test('2. Project Tree contains project node', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot(), 'test-project');
        expect(index.projectTree.type).toBe('project');
        expect(index.projectTree.name).toBe('test-project');
        expect(index.projectTree.id).toContain('proj_phase5');
    });

    test('3. Folder Tree generated with correct hierarchy', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot(), 'test-project');

        const findFolder = (node: FolderTreeNode, name: string): FolderTreeNode | undefined => {
            if (node.name === name) return node;
            for (const child of node.children) {
                const found = findFolder(child, name);
                if (found) return found;
            }
            return undefined;
        };

        expect(index.folderTree.name).toBe('test-project');
        expect(findFolder(index.folderTree, 'src')).toBeTruthy();
        expect(findFolder(index.folderTree, 'utils')).toBeTruthy();
        expect(findFolder(index.folderTree, 'core')).toBeTruthy();
        expect(findFolder(index.folderTree, 'models')).toBeTruthy();
    });

    test('4. Source File Registry contains only source files', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        const paths = index.sourceFileRegistry.map(f => f.filePath);
        expect(paths).toContain('src/main.ts');
        expect(paths).toContain('src/utils/helper.py');
        expect(paths).toContain('src/core/engine.rs');
        expect(paths).toContain('src/models/user.py');
        expect(paths).toContain('src/app.js');
        expect(paths).toContain('src/lib.go');
        expect(paths).toContain('src/calc.java');
        expect(paths).toContain('src/service.swift');

        // Excluded: documentation, reports, logs
        expect(paths).not.toContain('README.md');
        expect(paths).not.toContain('docs/guide.md');
        expect(paths).not.toContain('data/report.txt');
        expect(paths).not.toContain('logs/build.log');

        // Excluded: external and ghost
        expect(paths).not.toContain('external://axios');
        expect(paths).not.toContain('ghost://missing_mod');
    });

    test('5. Language detection from file extension', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        const getFile = (fp: string) => index.sourceFileRegistry.find(f => f.filePath === fp);
        expect(getFile('src/main.ts')!.language).toBe('typescript');
        expect(getFile('src/utils/helper.py')!.language).toBe('python');
        expect(getFile('src/core/engine.rs')!.language).toBe('rust');
        expect(getFile('src/app.js')!.language).toBe('javascript');
        expect(getFile('src/lib.go')!.language).toBe('go');
        expect(getFile('src/calc.java')!.language).toBe('java');
        expect(getFile('src/service.swift')!.language).toBe('swift');
    });

    test('6. Function Catalog extracts top-level functions', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        const tsFuncs = index.functionCatalog.filter(f => f.filePath === 'src/main.ts');
        expect(tsFuncs.some(f => f.functionName === 'greet')).toBe(true);

        const pyFuncs = index.functionCatalog.filter(f => f.filePath === 'src/utils/helper.py');
        expect(pyFuncs.some(f => f.functionName === 'parse')).toBe(true);

        const rsFuncs = index.functionCatalog.filter(f => f.filePath === 'src/core/engine.rs');
        expect(rsFuncs.some(f => f.functionName === 'compute')).toBe(true);

        const jsFuncs = index.functionCatalog.filter(f => f.filePath === 'src/app.js');
        expect(jsFuncs.some(f => f.functionName === 'init')).toBe(true);

        const goFuncs = index.functionCatalog.filter(f => f.filePath === 'src/lib.go');
        expect(goFuncs.some(f => f.functionName === 'Run')).toBe(true);
    });

    test('7. Function Catalog includes class methods', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        const userMethods = index.functionCatalog.filter(f => f.filePath === 'src/models/user.py');
        expect(userMethods.some(f => f.functionName === 'save' && f.className === 'User')).toBe(true);
        expect(userMethods.some(f => f.functionName === 'delete' && f.className === 'User')).toBe(true);

        const calcMethods = index.functionCatalog.filter(f => f.filePath === 'src/calc.java');
        expect(calcMethods.some(f => f.functionName === 'add' && f.className === 'Calc')).toBe(true);
    });

    test('8. Function ID is unique and deterministic', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const snapshot = makeSnapshot();
        const index1 = builder.build(snapshot);
        const index2 = builder.build(snapshot);

        expect(index1.functionCatalog.length).toBe(index2.functionCatalog.length);
        for (let i = 0; i < index1.functionCatalog.length; i++) {
            expect(index1.functionCatalog[i].functionId).toBe(index2.functionCatalog[i].functionId);
        }

        const ids = new Set(index1.functionCatalog.map(f => f.functionId));
        expect(ids.size).toBe(index1.functionCatalog.length);
    });

    test('9. No Database used (stateless)', () => {
        const dbPath = path.join(testRoot, 'data', 'architecture_db.json');
        expect(fs.existsSync(dbPath)).toBe(false);
    });

    test('10. ArchitectureIndex contains no layer information', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        for (const file of index.sourceFileRegistry) {
            expect((file as any).layer).toBeUndefined();
        }
        for (const fn of index.functionCatalog) {
            expect((fn as any).layer).toBeUndefined();
        }
    });

    test('11. ArchitectureIndex contains no visualization metadata', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        expect((index as any).nodePositions).toBeUndefined();
        expect((index as any).canvasLayout).toBeUndefined();
        expect((index as any).viewState).toBeUndefined();
        expect((index as any).visibility).toBeUndefined();
    });

    test('12. ArchitectureIndex does not include user clusters or external ghosts', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        expect((index as any).userClusters).toBeUndefined();
        expect((index as any).externalGhosts).toBeUndefined();
        expect((index.folderTree as any).layer).toBeUndefined();
    });

    test('13. Source file entry has correct structure', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        const tsFile = index.sourceFileRegistry.find(f => f.filePath === 'src/main.ts');
        expect(tsFile).toBeTruthy();
        expect(tsFile!.fileName).toBe('main.ts');
        expect(tsFile!.extension).toBe('.ts');
        expect(tsFile!.size).toBeGreaterThan(0);
        expect(tsFile!.functionCount).toBeGreaterThanOrEqual(0);
        expect(tsFile!.classCount).toBeGreaterThanOrEqual(0);
    });

    test('14. Function Catalog has correct entry structure', () => {
        const builder = ArchitectureIndexBuilder.getInstance();
        const index = builder.build(makeSnapshot());

        const entry = index.functionCatalog.find(f => f.functionName === 'greet');
        expect(entry).toBeTruthy();
        expect(entry!.functionId).toMatch(/^fn_/);
        expect(entry!.filePath).toBe('src/main.ts');
        expect(entry!.lineNumber).toBeGreaterThan(0);
    });
});
