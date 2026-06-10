import { ProjectMetadata, ProjectMetadataSchema } from '../core/ProjectMetadata';
import { SymbolIndex, FileEntry, FunctionEntry, FolderTree } from '../core/SymbolIndex';
import * as path from 'path';
import * as fs from 'fs';

describe('Phase 1 — Project Boundary Foundation', () => {
    const testRoot = path.join('/tmp', `synapse_test_${Date.now()}`);
    const projectName = 'test-project';

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(testRoot, { recursive: true });
        const meta = ProjectMetadata.getInstance();
        meta.initialize(testRoot, projectName);
        // loadSync will create/persist the default metadata if file missing
        meta.loadSync();
    });

    afterEach(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('1. ProjectMetadata 생성 및 로드', () => {
        const meta = ProjectMetadata.getInstance().get();
        expect(meta.projectUUID).toBeTruthy();
        expect(meta.projectName).toBe(projectName);
        expect(meta.metadataVersion).toBe(1);
        expect(meta.snapshotCount).toBe(0);
    });

    test('2. ProjectMetadata 저장 및 재로드', () => {
        for (let i = 0; i < 5; i++) {
            ProjectMetadata.getInstance().incrementSnapshotCount();
        }
        ProjectMetadata.getInstance().saveSync();

        ProjectMetadata.getInstance().initialize(testRoot, projectName);
        const meta2 = ProjectMetadata.getInstance().get();
        expect(meta2.snapshotCount).toBe(5);
    });

    test('3. Security: 프로젝트 경계 내 경로 허용', () => {
        const meta = ProjectMetadata.getInstance();
        expect(meta.validatePath('src/main.ts')).toBe(true);
        expect(meta.validatePath('data/file.json')).toBe(true);
        expect(meta.validatePath('src/utils/helper.ts')).toBe(true);
        expect(meta.validatePath(path.join(testRoot, 'src/file.ts'))).toBe(true);
    });

    test('4. Security: 프로젝트 경계 외부 경로 차단', () => {
        const meta = ProjectMetadata.getInstance();
        expect(meta.validatePath('../etc/passwd')).toBe(false);
        expect(meta.validatePath('../../other_project')).toBe(false);
        expect(meta.validatePath('/absolute/path')).toBe(false);
    });

    test('5. SymbolIndex 초기화 및 파일 등록', () => {
        const index = SymbolIndex.getInstance();
        index.initialize(projectName, testRoot);

        fs.mkdirSync(path.join(testRoot, 'src/utils'), { recursive: true });
        fs.writeFileSync(path.join(testRoot, 'src/main.ts'), '');
        fs.writeFileSync(path.join(testRoot, 'src/utils/helper.ts'), '');
        fs.writeFileSync(path.join(testRoot, 'README.md'), '');

        index.rebuildFromFiles([
            path.join(testRoot, 'src/main.ts'),
            path.join(testRoot, 'src/utils/helper.ts'),
            path.join(testRoot, 'README.md')
        ]);

        const registry = index.getFileRegistry();
        expect(registry.size).toBe(3);
        
        const mainEntry = registry.get('src/main.ts');
        expect(mainEntry).toBeTruthy();
        expect(mainEntry!.extension).toBe('.ts');
        expect(mainEntry!.isSource).toBe(true);
    });

    test('6. SymbolIndex FileRegistry 확장자 분류', () => {
        const index = SymbolIndex.getInstance();
        index.initialize(projectName, testRoot);

        index.rebuildFromFiles([
            path.join(testRoot, 'src/app.py'),
            path.join(testRoot, 'docs/guide.md'),
            path.join(testRoot, 'data/report.txt')
        ]);

        const registry = index.getFileRegistry();
        expect(registry.get('src/app.py')!.isSource).toBe(true);
        expect(registry.get('src/app.py')!.isDocumentation).toBe(false);
        expect(registry.get('docs/guide.md')!.isSource).toBe(false);
        expect(registry.get('docs/guide.md')!.isDocumentation).toBe(true);
    });

    test('7. SymbolIndex FunctionCatalog', () => {
        const index = SymbolIndex.getInstance();
        index.initialize(projectName, testRoot);
        fs.mkdirSync(path.join(testRoot, 'src'), { recursive: true });
        fs.writeFileSync(path.join(testRoot, 'src/app.py'), '');
        index.rebuildFromFiles([path.join(testRoot, 'src/app.py')]);

        index.addFunction('src/app.py', 'login', null, 10);
        index.addFunction('src/app.py', 'save', 'User', 25);
        index.addFunction('src/app.py', 'validate', null, 40);

        const catalog = index.getFunctionCatalog();
        expect(catalog.length).toBe(3);
        expect(catalog[0].functionName).toBe('login');
        expect(catalog[0].className).toBeNull();
        expect(catalog[1].functionName).toBe('save');
        expect(catalog[1].className).toBe('User');

        const registry = index.getFileRegistry();
        const entry = registry.get('src/app.py');
        expect(entry).toBeTruthy();
        expect(entry!.functionCount).toBe(2);
        expect(entry!.classCount).toBe(1);
    });

    test('8. SymbolIndex FolderTree', () => {
        const index = SymbolIndex.getInstance();
        index.initialize(projectName, testRoot);

        index.rebuildFromFiles([
            path.join(testRoot, 'src/main.ts'),
            path.join(testRoot, 'src/utils/helper.ts'),
            path.join(testRoot, 'tests/test_main.ts'),
            path.join(testRoot, 'README.md')
        ]);

        const tree = index.getFolderTree();
        expect(tree).toBeTruthy();
        expect(tree!.name).toBe(projectName);

        const findFolder = (node: FolderTree, name: string): FolderTree | undefined => {
            if (node.name === name) return node;
            for (const child of node.children) {
                const found = findFolder(child, name);
                if (found) return found;
            }
            return undefined;
        };

        expect(findFolder(tree!, 'src')).toBeTruthy();
        expect(findFolder(tree!, 'utils')).toBeTruthy();
        expect(findFolder(tree!, 'tests')).toBeTruthy();
    });

    test('9. ProjectMetadata 단일 관리자 (Server Ownership)', () => {
        const instance1 = ProjectMetadata.getInstance();
        const instance2 = ProjectMetadata.getInstance();
        expect(instance1).toBe(instance2);
    });

    test('10. SymbolIndex 단일 관리자', () => {
        const instance1 = SymbolIndex.getInstance();
        const instance2 = SymbolIndex.getInstance();
        expect(instance1).toBe(instance2);
    });
});
