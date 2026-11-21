import * as fs from 'fs';
import * as path from 'path';
import { UserGraphStorage, UserGraphData } from '../src/core/layout/UserGraphStorage';

interface VerificationResult {
    name: string;
    passed: boolean;
    details: string;
}

const results: VerificationResult[] = [];

function assert(condition: boolean, name: string, details: string) {
    results.push({
        name,
        passed: condition,
        details: condition ? details : `FAILED: ${details}`
    });
    if (!condition) {
        console.error(`❌ [FAIL] ${name}: ${details}`);
    } else {
        console.log(`✅ [PASS] ${name}: ${details}`);
    }
}

async function runVerification() {
    console.log('=== [Phase 2] UserGraphStorage & SSoT Immutability Verification ===\n');

    const tempDir = path.join(__dirname, '..', '.tmp_verify_user_graph');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(tempDir, 'synapse_data'), { recursive: true });

    try {
        // TEST 1: Schema & Security (Allowlist & Identity Protection)
        console.log('--- Test 1: Schema & Allowlist Security ---');
        const empty = UserGraphStorage.createEmptyUserGraph();
        assert(UserGraphStorage.validateSchema(empty), 'Empty Schema Validation', 'Default empty schema conforms to version 1');

        // Identity field rejection
        const badPatch = { id: 'hacked_id', label: 'Valid Label', filePath: '/etc/passwd' };
        const sanitizedNode = UserGraphStorage.sanitizeNodePatch(badPatch);
        assert(
            sanitizedNode !== null && sanitizedNode.label === 'Valid Label' && !('id' in (sanitizedNode as any)) && !('filePath' in (sanitizedNode as any)),
            'Identity Field Stripping',
            'id and filePath are completely stripped from node patch'
        );

        // Status allowlist
        const badStatusPatch = { status: 'arbitrary_status' };
        const rejectedStatus = UserGraphStorage.sanitizeNodePatch(badStatusPatch);
        assert(rejectedStatus === null, 'Arbitrary Status Rejection', 'Status outside allowlist is rejected');

        const approvedPatch = { status: 'approved' };
        const validStatus = UserGraphStorage.sanitizeNodePatch(approvedPatch);
        assert(validStatus?.status === 'approved', 'Approved Status Acceptance', "'approved' status is accepted for nodes");

        // Prototype pollution rejection
        let protoBlocked = false;
        try {
            UserGraphStorage.sanitizeNodePatch(JSON.parse('{"__proto__": {"admin": true}}'));
        } catch (e: any) {
            protoBlocked = true;
        }
        assert(protoBlocked, 'Prototype Pollution Guard', '__proto__ key triggers security exception');

        // TEST 2: Independent Rendering Copy & SSoT Immutability
        console.log('\n--- Test 2: Independent Rendering Copy & Immutability ---');
        const masterState = {
            project_name: 'test-project',
            nodes: [
                { id: 'node1', label: 'Node 1', filePath: 'src/node1.ts', status: 'proposed' },
                { id: 'node2', label: 'Node 2', filePath: 'src/node2.ts' },
                { id: 'node3', label: 'Node 3', filePath: 'src/node3.ts' }
            ],
            edges: [
                { id: 'node1->node2', from: 'node1', to: 'node2', status: 'proposed' },
                { id: 'node2->node3', from: 'node2', to: 'node3' }
            ],
            clusters: [
                { id: 'cluster1', name: 'Cluster 1', nodeIds: ['node1', 'node2', 'node3'], count: 3 }
            ]
        };

        const masterCloneBefore = JSON.parse(JSON.stringify(masterState));

        const overlay: UserGraphData = {
            version: 1,
            revision: 1,
            updatedAt: new Date().toISOString(),
            modifiedNodes: {
                node1: { label: 'Node 1 Patched', status: 'approved' }
            },
            modifiedEdges: {
                'node1->node2': { status: 'confirmed' }
            },
            hiddenNodeIds: ['node3'],
            hiddenEdgeIds: []
        };

        const renderingCopy = UserGraphStorage.createRenderingCopy(masterState, overlay);

        // Verify masterState immutability (Deep Equality)
        assert(
            JSON.stringify(masterState) === JSON.stringify(masterCloneBefore),
            'SSoT Master Immutability',
            'masterState content is 100% untouched after rendering copy creation'
        );

        // Verify Reference Independence
        renderingCopy.nodes[0].label = 'MUTATED IN RENDERING COPY';
        assert(
            masterState.nodes[0].label === 'Node 1',
            'Reference Independence',
            'Mutating rendering copy does not affect masterState'
        );

        // Verify Overlay Application in Rendering Copy
        assert(
            renderingCopy.nodes.length === 2 && !renderingCopy.nodes.some((n: any) => n.id === 'node3'),
            'Node Hiding in Rendering Copy',
            'Hidden node3 is excluded from rendering copy'
        );

        // Verify Cascading Edge Hiding (edges connected to hidden nodes are pruned)
        const renderingCopy2 = UserGraphStorage.createRenderingCopy(masterState, {
            ...overlay,
            hiddenNodeIds: ['node2'] // node2 hidden -> node1->node2 and node2->node3 must be pruned
        });
        assert(
            renderingCopy2.edges.length === 0,
            'Cascading Edge Hiding',
            'Edges connected to hidden node2 are automatically excluded at render time'
        );

        // Verify Cluster nodeIds and count pruning
        assert(
            renderingCopy.clusters[0].nodeIds.length === 2 && renderingCopy.clusters[0].count === 2 && !renderingCopy.clusters[0].nodeIds.includes('node3'),
            'Cluster Member Pruning',
            'Hidden nodes are cleanly pruned from cluster.nodeIds and count is updated'
        );

        // TEST 3: Corrupt File Safe Backup & Read-Only Fallback
        console.log('\n--- Test 3: Corrupt File Safe Backup ---');
        const corruptPath = UserGraphStorage.getUserGraphFilePath(tempDir);
        fs.writeFileSync(corruptPath, '{ INVALID_JSON_CONTENT ...', 'utf8');

        const loadedAfterCorrupt = await UserGraphStorage.loadUserGraph(tempDir);
        assert(
            loadedAfterCorrupt.version === 1 && Object.keys(loadedAfterCorrupt.modifiedNodes).length === 0,
            'Corrupt File Recovery Fallback',
            'Loaded fallback empty overlay safely'
        );

        const filesInSynapseData = fs.readdirSync(path.join(tempDir, 'synapse_data'));
        const backupFound = filesInSynapseData.some(f => f.startsWith('user_graph.json.corrupt-'));
        assert(
            backupFound,
            'Corrupt Backup Preservation',
            `Corrupt file was preserved as backup (found: ${filesInSynapseData.find(f => f.startsWith('user_graph.json.corrupt-'))})`
        );

        // TEST 4: Reset Safety Backup
        console.log('\n--- Test 4: Reset Safety Backup ---');
        const activeData: UserGraphData = {
            version: 1,
            revision: 5,
            updatedAt: new Date().toISOString(),
            modifiedNodes: { n1: { label: 'Active Label' } },
            modifiedEdges: {},
            hiddenNodeIds: [],
            hiddenEdgeIds: []
        };
        await UserGraphStorage.saveUserGraph(tempDir, activeData);

        await UserGraphStorage.reset(tempDir);
        const resetBackupFound = fs.readdirSync(path.join(tempDir, 'synapse_data')).some(f => f.startsWith('user_graph.json.reset-backup-'));
        assert(
            resetBackupFound,
            'Reset Safety Backup',
            'Reset created safety backup of user_graph.json without permanent data loss'
        );

        // TEST 5: Static Spy Verification of CanvasPanel.ts SSoT Writes
        console.log('\n--- Test 5: Static Code Inspection of SSoT Write Calls ---');
        const canvasPanelSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'webview', 'CanvasPanel.ts'), 'utf8');

        // Look for any writeFile matching project_state.json or variations
        const lines = canvasPanelSrc.split('\n');
        const ssotWriteLines: { line: number; text: string }[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('writeFile') && (line.includes('projectStateUri') || line.includes('project_state.json') || (line.includes('stateUri') && !line.includes('workspaceUri')))) {
                ssotWriteLines.push({ line: i + 1, text: line.trim() });
            }
        }

        console.log(`Found ${ssotWriteLines.length} SSoT write occurrences:`);
        for (const hit of ssotWriteLines) {
            console.log(`  Line ${hit.line}: ${hit.text}`);
        }

        assert(
            ssotWriteLines.length === 1,
            'SSoT Write Count Verification',
            `Expected exactly 1 SSoT write (handleReBootstrap), found ${ssotWriteLines.length}`
        );

        if (ssotWriteLines.length === 1) {
            // Verify that the single occurrence is in handleReBootstrap
            const targetLine = ssotWriteLines[0].line;
            const surrounding = lines.slice(Math.max(0, targetLine - 60), targetLine + 5).join('\n');
            assert(
                surrounding.includes('handleReBootstrap'),
                'handleReBootstrap Sole Write Authorization',
                'The sole remaining SSoT write is confirmed to reside inside handleReBootstrap (Phase 3)'
            );
        }

    } finally {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }

    console.log('\n=== Verification Summary ===');
    const passedCount = results.filter(r => r.passed).length;
    console.log(`Total Tests: ${results.length}, Passed: ${passedCount}, Failed: ${results.length - passedCount}`);

    if (passedCount !== results.length) {
        process.exit(1);
    }
}

runVerification().catch(err => {
    console.error('Fatal verification error:', err);
    process.exit(1);
});
