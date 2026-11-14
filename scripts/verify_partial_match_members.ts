/**
 * verify_partial_match_members.ts
 * 
 * Verifies member-level path matching for all components in partial_match_raw_trace.json
 * against raw simulation evidence (simulation_evidence.json) from Godot and VS Code.
 * 
 * Asserts:
 * 1. For every FULL_MATCH component, 100% of its member file paths match the scope exclusions.
 * 2. For every ZERO_MATCH component, 0% of its member file paths match the scope exclusions.
 * 3. Member counts in partial_match_raw_trace.json exactly match simulation_evidence.json.
 */

import * as fs from 'fs';
import { ScopeResolver } from '../src/core/analysis/ScopeResolver';

let assertionsPassed = 0;

function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.error(`[FAIL] ${msg}`);
        throw new Error(`ASSERTION_FAILURE: ${msg}`);
    } else {
        assertionsPassed++;
        console.log(`[PASS] ${msg}`);
    }
}

interface ProjectConfig {
    name: string;
    simPath: string;
    patterns: string[];
    traceKey: 'godot' | 'vscode';
}

function verifyProjectMembers(config: ProjectConfig) {
    console.log(`\n===============================================================`);
    console.log(`=== Member-Level Trace Verification: ${config.name} ===`);
    console.log(`Simulation Evidence: ${config.simPath}`);

    const sim = JSON.parse(fs.readFileSync(config.simPath, 'utf8'));
    const trace = JSON.parse(fs.readFileSync('mile_stone/evidence/partial_match_raw_trace.json', 'utf8'));
    const findings = sim.evidenceBundle?.findings || [];

    const componentMembersMap = new Map<string, string[]>();
    for (const f of findings) {
        if (f.evidenceType === 'BOUNDARY_NODE' && f.metadata && Array.isArray(f.metadata.members)) {
            componentMembersMap.set(f.targetId, f.metadata.members);
        }
    }

    assert(componentMembersMap.size > 0, `${config.name}: Extracted ${componentMembersMap.size} boundary components from simulation evidence`);

    const resolver = new ScopeResolver(config.patterns, 'CLI_FLAG');
    const a1Records = trace[config.traceKey].a1Trace;
    const e2Records = trace[config.traceKey].e2Trace || [];

    // Verify A1 Component Members
    verifyTraceArray(`${config.name} A1`, a1Records, componentMembersMap, resolver);

    // Verify E2 Component Members (if different from A1)
    if (e2Records.length > 0) {
        verifyTraceArray(`${config.name} E2`, e2Records, componentMembersMap, resolver);
    }
}

function verifyTraceArray(label: string, records: any[], componentMembersMap: Map<string, string[]>, resolver: ScopeResolver) {
    let fullMatchCount = 0;
    let zeroMatchCount = 0;
    let fullMatchMembersTotal = 0;
    let zeroMatchMembersTotal = 0;

    for (const rec of records) {
        const members = componentMembersMap.get(rec.componentId);
        assert(!!members, `${label}: Component "${rec.componentId}" exists in simulation evidence`);
        if (!members) continue;

        assert(
            members.length === rec.totalMembers,
            `${label} [${rec.componentId}]: Member count (${members.length}) === Trace totalMembers (${rec.totalMembers})`
        );

        let matchedCount = 0;
        for (const m of members) {
            if (resolver.matches(m)) {
                matchedCount++;
            }
        }

        assert(
            matchedCount === rec.matchedMembers,
            `${label} [${rec.componentId}]: Matched members (${matchedCount}) === Trace matchedMembers (${rec.matchedMembers})`
        );

        if (rec.matchClassification === 'FULL_MATCH') {
            fullMatchCount++;
            fullMatchMembersTotal += members.length;
            assert(
                matchedCount === members.length,
                `${label} FULL_MATCH [${rec.componentId}]: All ${members.length} members match scope pattern`
            );
        } else if (rec.matchClassification === 'ZERO_MATCH') {
            zeroMatchCount++;
            zeroMatchMembersTotal += members.length;
            assert(
                matchedCount === 0,
                `${label} ZERO_MATCH [${rec.componentId}]: Exactly 0 of ${members.length} members match scope pattern`
            );
        }
    }

    console.log(`[SUMMARY] ${label}: ${fullMatchCount} FULL_MATCH components (${fullMatchMembersTotal} members verified 100% matched)`);
    console.log(`[SUMMARY] ${label}: ${zeroMatchCount} ZERO_MATCH components (${zeroMatchMembersTotal} members verified 0% matched)`);
}

function main() {
    console.log('=== Starting Member-Level Path Verification Suite ===');

    verifyProjectMembers({
        name: 'Godot Engine',
        simPath: '/home/dogsinatas/다운로드/godot-master/synapse_report/surgery/simulation_evidence.json',
        patterns: ['thirdparty/**', 'tests/**', 'platform/android/java/**/apksig/**'],
        traceKey: 'godot'
    });

    verifyProjectMembers({
        name: 'VS Code',
        simPath: '/home/dogsinatas/다운로드/vscode/vscode-main/synapse_report/surgery/simulation_evidence.json',
        patterns: ['test/**', 'extensions/**'],
        traceKey: 'vscode'
    });

    console.log(`\n===============================================================`);
    console.log(`=== All Member-Level Verification Assertions PASSED (${assertionsPassed} checks) ===`);
}

main();

