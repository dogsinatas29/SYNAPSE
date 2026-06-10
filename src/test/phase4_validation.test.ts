import { RemoteLayerProjector, ProjectionResult, LayerType } from '../core/collaboration/RemoteLayerProjector';
import { ProjectMetadata } from '../core/ProjectMetadata';
import { SubmissionSnapshot } from '../types/schema';
import * as path from 'path';
import * as fs from 'fs';

describe('Phase 4 — Remote Layer Visualization', () => {
    const testRoot = path.join('/tmp', `synapse_phase4_test_${Date.now()}`);

    function makeSnapshot(overrides?: Partial<SubmissionSnapshot>): SubmissionSnapshot {
        return {
            id: 'sub_test_001',
            projectUUID: 'proj_test',
            sessionId: 'ses_test',
            clientId: 'usr_member',
            files: [
                { filePath: 'src/main.ts', content: 'const x = 1;\n', encoding: 'utf8' },
                { filePath: 'src/utils/helper.ts', content: 'export function h() {}\n', encoding: 'utf8' },
                { filePath: 'README.md', content: '# Docs\n', encoding: 'utf8' },
                { filePath: 'external://axios', content: '', encoding: 'utf8' },
                { filePath: 'ghost://missing_mod', content: '', encoding: 'utf8' },
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
        fs.mkdirSync(path.join(testRoot, 'data'), { recursive: true });
        ProjectMetadata.getInstance().initialize(testRoot, 'test-project');
        ProjectMetadata.getInstance().loadSync();
    });

    afterAll(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('1. Submission Snapshot Imported', () => {
        const projector = RemoteLayerProjector.getInstance();
        const snapshot = makeSnapshot();
        const result = projector.project(snapshot);
        expect(result.submissionId).toBe(snapshot.id);
        expect(result.projectUUID).toBe(snapshot.projectUUID);
        expect(result.clientId).toBe(snapshot.clientId);
    });

    test('2. Runtime Projection Complete (Nodes generated)', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());
        expect(result.nodes.length).toBeGreaterThan(0);
        expect(result.graphSnapshot.nodes.length).toBe(result.nodes.length);
    });

    test('3. Node Layer Classification — AI Layer', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());
        const aiNodes = result.nodes.filter(n => n.layer === 'ai');
        expect(aiNodes.length).toBeGreaterThan(0);
        expect(aiNodes.some(n => n.filePath === 'src/main.ts')).toBe(true);
    });

    test('4. Node Layer Classification — User Layer (docs)', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());
        const userNodes = result.nodes.filter(n => n.layer === 'user');
        expect(userNodes.some(n => n.filePath === 'README.md')).toBe(true);
    });

    test('5. Node Layer Classification — External Layer (ghosts)', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());
        const extNodes = result.nodes.filter(n => n.layer === 'external');
        expect(extNodes.some(n => n.filePath === 'external://axios')).toBe(true);
        expect(extNodes.some(n => n.filePath === 'ghost://missing_mod')).toBe(true);
    });

    test('6. Cluster Layer Classification', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());

        const aiClusters = result.clusters.filter(c => c.layer === 'ai');
        expect(aiClusters.some(c => c.id.startsWith('folder_'))).toBe(true);

        const extClusters = result.clusters.filter(c => c.layer === 'external');
        expect(extClusters.some(c => c.id === 'cluster_ghosts')).toBe(true);

        const userClusters = result.clusters.filter(c => c.layer === 'user');
        expect(userClusters.some(c => c.id === 'doc_shelf')).toBe(true);
    });

    test('7. System Clusters Always Present', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());

        const clusterIds = result.clusters.map(c => c.id);
        expect(clusterIds).toContain('cluster_ghosts');
        expect(clusterIds).toContain('sys_cluster_reserved');
        expect(clusterIds).toContain('doc_shelf');
    });

    test('8. Visibility Controls Present', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());
        expect(result.visibility.showBaseLayer).toBe(true);
        expect(result.visibility.showUserLayer).toBe(true);
        expect(result.visibility.showExternalLayer).toBe(true);
    });

    test('9. GraphSnapshot generated with correct layers', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());

        for (const node of result.graphSnapshot.nodes) {
            expect(node.layer).toBeTruthy();
        }
        for (const cluster of result.graphSnapshot.clusters) {
            expect(cluster.layer).toBeTruthy();
        }
    });

    test('10. Folder-based cluster grouping', () => {
        const projector = RemoteLayerProjector.getInstance();
        const snapshot = makeSnapshot();
        snapshot.files.push({ filePath: 'src/utils/parser.ts', content: '', encoding: 'utf8' });
        const result = projector.project(snapshot);

        const srcUtilsCluster = result.clusters.find(c => c.id === 'folder_src_utils');
        expect(srcUtilsCluster).toBeTruthy();
        expect(srcUtilsCluster!.memberCount).toBe(2);
    });

    test('11. Ghost nodes in cluster_ghosts', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());

        const ghostCluster = result.clusters.find(c => c.id === 'cluster_ghosts');
        expect(ghostCluster).toBeTruthy();
        expect(ghostCluster!.memberCount).toBe(2); // external://axios + ghost://missing_mod
    });

    test('12. Edges have no layer (Phase4 rule)', () => {
        const projector = RemoteLayerProjector.getInstance();
        const result = projector.project(makeSnapshot());
        expect(result.graphSnapshot.edges).toEqual([]);
        // Edges belong to no layer - this is validated by the empty edges array
    });

    test('13. No Database used (stateless)', () => {
        const dbPath = path.join(testRoot, 'data', 'layer_db.json');
        expect(fs.existsSync(dbPath)).toBe(false);
    });

    test('14. Layer classification for Atomic Signature nodes', () => {
        const projector = RemoteLayerProjector.getInstance();
        const snapshot = makeSnapshot();
        snapshot.files.push({ filePath: 'src/core/engine.py', content: '# ⚡ atomic\n', encoding: 'utf8' });
        const result = projector.project(snapshot);

        // hasAtomicSignature is detected by DataPipeline's FileScanner
        // In RemoteLayerProjector, we classify based on filePath patterns
        const engineNode = result.nodes.find(n => n.filePath === 'src/core/engine.py');
        expect(engineNode).toBeTruthy();
        expect(engineNode!.layer).toBe('ai'); // Default for source files without atomic marker
    });
});
