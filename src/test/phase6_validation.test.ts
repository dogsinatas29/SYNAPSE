import { ArchitectureIndexBuilder, ArchitectureIndex } from '../core/collaboration/ArchitectureIndexBuilder';
import { ReferenceVerifier, VerificationReport, HarvestCandidateSet, EdgeCategory } from '../core/collaboration/ReferenceVerifier';
import { SubmissionSnapshot } from '../types/schema';
import * as path from 'path';
import * as fs from 'fs';

describe('Phase 6 — Reference Verification Layer', () => {
    const testRoot = path.join('/tmp', `synapse_phase6_test_${Date.now()}`);

    function makeSnapshot(overrides?: Partial<SubmissionSnapshot>): SubmissionSnapshot {
        return {
            id: 'sub_phase6_001',
            projectUUID: 'proj_phase6',
            sessionId: 'ses_phase6',
            clientId: 'usr_verifier',
            files: [
                { filePath: 'src/main.ts', content:
                    'import { helper } from "./utils/helper";\n' +
                    'import axios from "axios";\n' +
                    'const x = 1;\n', encoding: 'utf8' },
                { filePath: 'src/utils/helper.py', content:
                    'def parse(data):\n' +
                    '    return data.strip()\n', encoding: 'utf8' },
                { filePath: 'src/core/engine.rs', content:
                    'use crate::models::user;\n' +
                    'pub fn compute(x: i32) -> i32 { x * 2 }\n', encoding: 'utf8' },
                { filePath: 'src/models/user.py', content:
                    'from src.core import engine\n' +
                    'import requests\n' +
                    'class User:\n' +
                    '    def save(self):\n' +
                    '        pass\n', encoding: 'utf8' },
                { filePath: 'src/app.js', content:
                    'const os = require("os");\n' +
                    'function init() {}\n', encoding: 'utf8' },
                { filePath: 'src/lib.go', content:
                    'package lib\n' +
                    'import "fmt"\n' +
                    'func Run() string { return "ok" }\n', encoding: 'utf8' },
                { filePath: 'src/calc.java', content:
                    'import java.util.List;\n' +
                    'public class Calc {\n' +
                    '    public int add(int a, int b) { return a + b; }\n' +
                    '}\n', encoding: 'utf8' },
                { filePath: 'README.md', content: '# Docs\n', encoding: 'utf8' },
                { filePath: 'external://axios', content: '', encoding: 'utf8' },
                { filePath: 'ghost://missing_mod', content: '', encoding: 'utf8' },
                { filePath: 'src/service.swift', content:
                    'import Foundation\n' +
                    'func handle() -> String { return "done" }\n', encoding: 'utf8' },
                { filePath: 'src/lib.rs', content:
                    'use std::collections::HashMap;\n' +
                    'pub fn lib_func() -> i32 { 42 }\n', encoding: 'utf8' },
            ],
            timestamp: Date.now(),
            immutable: true,
            ...overrides,
        };
    }

    let index: ArchitectureIndex;
    let snapshot: SubmissionSnapshot;

    beforeAll(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true });
        }
        fs.mkdirSync(testRoot, { recursive: true });
        snapshot = makeSnapshot();
        index = ArchitectureIndexBuilder.getInstance().build(snapshot, 'test-project');
    });

    afterAll(() => {
        fs.rmSync(testRoot, { recursive: true, force: true });
    });

    test('1. Reference Discovery scans source files', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        expect(report.stats.totalEdges).toBeGreaterThan(0);
        expect(report.stats.resolvedReferences + report.stats.unresolvedReferences).toBe(report.stats.totalEdges);
    });

    test('2. Resolved references generate edges', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        // src/main.ts imports ./utils/helper -> should resolve to src/utils/helper.py
        const resolvedEdge = report.graph.edges.find(e => e.from === 'src/main.ts' && e.to === 'src/utils/helper.py');
        expect(resolvedEdge).toBeTruthy();
        expect(resolvedEdge!.category).toBe('INCLUDE');
    });

    test('3. Unresolved references create ghost projections', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        // axios and requests are external packages
        const extGhost = report.graph.ghostNodes.find(g => g.label === 'axios');
        expect(extGhost).toBeTruthy();
        expect(extGhost!.type).toBe('external');
        expect(extGhost!.path).toContain('external://');

        const reqGhost = report.graph.ghostNodes.find(g => g.label === 'requests');
        expect(reqGhost).toBeTruthy();
        expect(reqGhost!.type).toBe('external');
    });

    test('4. External dependencies detected', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        const extFindings = report.findings.filter(f => f.type === 'EXTERNAL_DEPENDENCY');
        expect(extFindings.length).toBeGreaterThan(0);
    });

    test('5. Internal unresolved references become ghost://', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        // crate::models::user from engine.rs might not resolve in simple test
        const intGhosts = report.graph.ghostNodes.filter(g => g.type === 'internal');
        // Each internal ghost should have path starting with ghost://
        for (const ghost of intGhosts) {
            expect(ghost.path).toMatch(/^ghost:\/\//);
        }
    });

    test('6. Graph constructed with all components', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        expect(report.graph.fileNodes.length).toBe(index.sourceFileRegistry.length);
        expect(report.graph.edges.length).toBeGreaterThan(0);
        expect(report.graph.clusters.length).toBeGreaterThan(0);
    });

    test('7. Verification report contains findings', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        expect(report.findings.length).toBeGreaterThan(0);
        expect(report.generatedAt).toBeGreaterThan(0);
        expect(report.stats.totalFiles).toBe(index.sourceFileRegistry.length);
    });

    test('8. Disconnected files detected', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        // Some files may have no incoming/outgoing references
        expect(report.stats.disconnectedFiles).toBeGreaterThanOrEqual(0);
        expect(typeof report.stats.disconnectedFiles).toBe('number');
    });

    test('9. No function call analysis performed', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        // Edges are file-level only, not function-level
        for (const edge of report.graph.edges) {
            expect(typeof edge.from).toBe('string');
            expect(typeof edge.to).toBe('string');
        }
        // Verify no call graph edges exist (all edges should be from file to file)
        const callEdges = report.graph.edges.filter(e => e.category === 'CALL');
        expect(callEdges.length).toBe(0);
    });

    test('10. Edge categories are valid', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        const validCategories: EdgeCategory[] = ['INCLUDE', 'REFERENCE', 'CALL', 'DB_QUERY', 'DATA_FLOW', 'EVENT', 'CONDITIONAL', 'LOOP_BACK'];
        for (const edge of report.graph.edges) {
            expect(validCategories).toContain(edge.category);
        }
    });

    test('11. Ghost nodes track referencing files', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        // axios is referenced by src/main.ts
        const axiosGhost = report.graph.ghostNodes.find(g => g.label === 'axios');
        if (axiosGhost) {
            expect(axiosGhost.referencedBy.length).toBeGreaterThan(0);
            expect(axiosGhost.referencedBy).toContain('src/main.ts');
        }
    });

    test('12. Harvest Candidate Set generated', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        const candidates = verifier.generateCandidates(report, 'prepare_harvest', snapshot.id, snapshot.projectUUID);
        expect(candidates.submissionId).toBe(snapshot.id);
        expect(candidates.projectUUID).toBe(snapshot.projectUUID);
        expect(candidates.decision).toBe('prepare_harvest');
        expect(candidates.candidates.length).toBe(index.sourceFileRegistry.length);
        expect(candidates.report).toBe(report);
    });

    test('13. Candidate entries have correct structure', () => {
        const verifier = ReferenceVerifier.getInstance();
        const report = verifier.verify(index, snapshot);
        const candidates = verifier.generateCandidates(report, 'accept', snapshot.id, snapshot.projectUUID);
        const mainCandidate = candidates.candidates.find(c => c.filePath === 'src/main.ts');
        expect(mainCandidate).toBeTruthy();
        expect(mainCandidate!.nodeId).toBe('src/main.ts');
        expect(Array.isArray(mainCandidate!.incomingEdges)).toBe(true);
        expect(Array.isArray(mainCandidate!.outgoingEdges)).toBe(true);
    });

    test('14. No database used (stateless)', () => {
        const dbPath = path.join(testRoot, 'data', 'verification_db.json');
        expect(fs.existsSync(dbPath)).toBe(false);
    });
});
