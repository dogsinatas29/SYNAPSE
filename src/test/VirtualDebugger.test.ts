/**
 * VirtualDebugger Unit Tests
 * Tests the core mapping logic: diagnostics → necrosisNodeIds / fractureEdgeIds
 *
 * NOTE: VirtualDebugger calls vscode.languages.getDiagnostics() which is mocked here.
 */

// Mock vscode module
jest.mock('vscode', () => ({
    languages: {
        getDiagnostics: jest.fn()
    },
    workspace: {
        asRelativePath: jest.fn((uri: any) => uri.toString().replace('file:///', ''))
    },
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3
    }
}), { virtual: true });

import * as vscode from 'vscode';
import { VirtualDebugger } from '../core/VirtualDebugger';

// === Helpers ===

function makeUri(relativePath: string): vscode.Uri {
    return `file:///${relativePath}` as unknown as vscode.Uri;
}

function makeDiag(message: string, severity: vscode.DiagnosticSeverity, line = 0): vscode.Diagnostic {
    return {
        message,
        severity,
        range: { start: { line, character: 0 }, end: { line, character: 10 } }
    } as unknown as vscode.Diagnostic;
}

function makeNode(id: string, file: string, label = id): any {
    return { id, type: 'component', data: { label, file }, position: { x: 0, y: 0 }, visual: { opacity: 1 } };
}

function makeEdge(from: string, to: string): any {
    return { id: `${from}--${to}`, from, to, type: 'dependency' };
}

function makeState(nodes: any[], edges: any[]): any {
    return { nodes, edges, clusters: [] };
}

// === Tests ===

describe('VirtualDebugger', () => {
    let vDebugger: VirtualDebugger;
    const WORKSPACE_ROOT = '/workspace';

    beforeEach(() => {
        vDebugger = new VirtualDebugger();
        jest.clearAllMocks();
        // Default: no diagnostics
        (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([]);
    });

    // ============================================================
    // 1. Basic Mapping: diagnostics → necrosisNodeIds
    // ============================================================
    describe('performVirtualDebug - Necrosis Mapping', () => {
        it('should mark node as necrotic when its file has an Error diagnostic', async () => {
            const fileUri = makeUri('src/main.cpp');
            const nodes = [makeNode('n1', 'src/main.cpp')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [fileUri, [makeDiag('undefined reference to foo', vscode.DiagnosticSeverity.Error)]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, []), WORKSPACE_ROOT);

            expect(impact.necrosisNodeIds).toContain('n1');
        });

        it('should mark node as necrotic for Warning diagnostics too', async () => {
            const fileUri = makeUri('src/utils.h');
            const nodes = [makeNode('n1', 'src/utils.h')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [fileUri, [makeDiag('unused variable', vscode.DiagnosticSeverity.Warning)]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, []), WORKSPACE_ROOT);

            expect(impact.necrosisNodeIds).toContain('n1');
        });

        it('should NOT mark node as necrotic for Information/Hint diagnostics', async () => {
            const fileUri = makeUri('src/clean.cpp');
            const nodes = [makeNode('n1', 'src/clean.cpp')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [fileUri, [
                    makeDiag('suggestion', vscode.DiagnosticSeverity.Information),
                    makeDiag('hint', vscode.DiagnosticSeverity.Hint)
                ]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, []), WORKSPACE_ROOT);

            expect(impact.necrosisNodeIds).not.toContain('n1');
        });

        it('should produce empty impact when no diagnostics exist', async () => {
            const nodes = [makeNode('n1', 'src/happy.cpp')];
            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, []), WORKSPACE_ROOT);

            expect(impact.necrosisNodeIds).toHaveLength(0);
            expect(impact.fractureEdgeIds).toHaveLength(0);
            expect(impact.reports).toHaveLength(0);
        });

        it('should deduplicate nodeIds (one node with multiple diagnostics = one entry)', async () => {
            const fileUri = makeUri('src/multi.cpp');
            const nodes = [makeNode('n1', 'src/multi.cpp')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [fileUri, [
                    makeDiag('error 1', vscode.DiagnosticSeverity.Error),
                    makeDiag('error 2', vscode.DiagnosticSeverity.Error),
                    makeDiag('error 3', vscode.DiagnosticSeverity.Error),
                ]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, []), WORKSPACE_ROOT);

            const uniqueIds = new Set(impact.necrosisNodeIds);
            expect(uniqueIds.size).toBe(1);
            expect([...uniqueIds][0]).toBe('n1');
        });

        it('should map multiple files to multiple nodes independently', async () => {
            const uri1 = makeUri('src/a.cpp');
            const uri2 = makeUri('src/b.cpp');

            const nodes = [makeNode('nA', 'src/a.cpp'), makeNode('nB', 'src/b.cpp')];
            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [uri1, [makeDiag('error A', vscode.DiagnosticSeverity.Error)]],
                [uri2, [makeDiag('error B', vscode.DiagnosticSeverity.Error)]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, []), WORKSPACE_ROOT);

            expect(impact.necrosisNodeIds).toContain('nA');
            expect(impact.necrosisNodeIds).toContain('nB');
        });
    });

    // ============================================================
    // 2. Edge Fracture Mapping
    // ============================================================
    describe('performVirtualDebug - Fracture Mapping', () => {
        it('should fracture outgoing edges of Error nodes (not Warning-only nodes)', async () => {
            const uri = makeUri('src/error_node.cpp');
            const nodes = [
                makeNode('nErr', 'src/error_node.cpp'),
                makeNode('nOk', 'src/ok.cpp')
            ];
            const edges = [makeEdge('nErr', 'nOk')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [uri, [makeDiag('critical error', vscode.DiagnosticSeverity.Error)]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, edges), WORKSPACE_ROOT);

            expect(impact.fractureEdgeIds).toContain('nErr--nOk');
        });

        it('should NOT fracture edges of Warning-only nodes', async () => {
            const uri = makeUri('src/warn_node.cpp');
            const nodes = [
                makeNode('nWarn', 'src/warn_node.cpp'),
                makeNode('nOk', 'src/ok.cpp')
            ];
            const edges = [makeEdge('nWarn', 'nOk')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [uri, [makeDiag('just a warning', vscode.DiagnosticSeverity.Warning)]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, edges), WORKSPACE_ROOT);

            // necroCount should include the node, but edges should NOT be fractured (warning, not error)
            expect(impact.necrosisNodeIds).toContain('nWarn');
            expect(impact.fractureEdgeIds).not.toContain('nWarn--nOk');
        });

        it('should fracture multiple outgoing edges from one error node', async () => {
            const uri = makeUri('src/hub.cpp');
            const nodes = [
                makeNode('hub', 'src/hub.cpp'),
                makeNode('a', 'src/a.cpp'),
                makeNode('b', 'src/b.cpp')
            ];
            const edges = [makeEdge('hub', 'a'), makeEdge('hub', 'b')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [uri, [makeDiag('core failure', vscode.DiagnosticSeverity.Error)]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, edges), WORKSPACE_ROOT);

            expect(impact.fractureEdgeIds).toContain('hub--a');
            expect(impact.fractureEdgeIds).toContain('hub--b');
        });

        it('should NOT fracture incoming edges (only outgoing from error node)', async () => {
            const uri = makeUri('src/error.cpp');
            const nodes = [
                makeNode('nOk', 'src/ok.cpp'),
                makeNode('nErr', 'src/error.cpp')
            ];
            const edges = [makeEdge('nOk', 'nErr')]; // incoming to nErr

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [uri, [makeDiag('error', vscode.DiagnosticSeverity.Error)]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, edges), WORKSPACE_ROOT);

            expect(impact.fractureEdgeIds).not.toContain('nOk--nErr');
        });
    });

    // ============================================================
    // 3. Reports Structure
    // ============================================================
    describe('performVirtualDebug - Reports', () => {
        it('should build a report entry for each diagnostic mapped to a node', async () => {
            const uri = makeUri('src/main.cpp');
            const nodes = [makeNode('n1', 'src/main.cpp')];

            (vscode.languages.getDiagnostics as jest.Mock).mockReturnValue([
                [uri, [
                    makeDiag('error at line 5', vscode.DiagnosticSeverity.Error, 5),
                    makeDiag('warning at line 8', vscode.DiagnosticSeverity.Warning, 8)
                ]]
            ]);

            const impact = await vDebugger.performVirtualDebug(makeState(nodes, []), WORKSPACE_ROOT);

            expect(impact.reports.length).toBe(2);
            expect(impact.reports[0].nodeId).toBe('n1');
            expect(impact.reports[0].severity).toBe(vscode.DiagnosticSeverity.Error);
            expect(impact.reports[0].line).toBe(5);
            expect(impact.reports[1].line).toBe(8);
        });
    });
});
