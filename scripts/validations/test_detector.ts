import { ProjectContextDetector, ProjectEcosystem, ProjectDomain } from '../../src/core/analysis/semantic/ProjectContextDetector';
import * as path from 'path';

function runTests() {
    console.log(`[Detector] Testing ProjectContextDetector...`);
    
    // The target directories on the local machine
    const targets = [
        {
            name: 'VSCode',
            path: '/home/dogsinatas/다운로드/vscode/vscode-main',
            expectedEcosystem: ProjectEcosystem.NODE,
            expectedDomain: ProjectDomain.IDE,
            expectedFlags: { isVSCode: true, isLinux: false, isNestJS: false, isAntennaPod: false }
        },
        {
            name: 'Linux Kernel',
            path: '/home/dogsinatas/다운로드/linux-7.2-rc3',
            expectedEcosystem: ProjectEcosystem.LINUX,
            expectedDomain: ProjectDomain.OS_KERNEL,
            expectedFlags: { isVSCode: false, isLinux: true, isNestJS: false, isAntennaPod: false }
        },
        {
            name: 'NestJS (No win/Nest Backend)',
            path: path.join(__dirname, '../../scratch/mock-nestjs'),
            expectedEcosystem: ProjectEcosystem.NODE,
            expectedDomain: ProjectDomain.BACKEND_API,
            expectedFlags: { isVSCode: false, isLinux: false, isNestJS: true, isAntennaPod: false }
        },
        {
            name: 'AntennaPod',
            path: '/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod',
            expectedEcosystem: ProjectEcosystem.ANDROID,
            expectedDomain: ProjectDomain.ANDROID_APP,
            expectedFlags: { isVSCode: false, isLinux: false, isNestJS: false, isAntennaPod: true }
        }
    ];

    let passed = 0;
    
    for (const target of targets) {
        try {
            const result = ProjectContextDetector.detect(target.path);
            
            let failed = false;
            const logError = (msg: string) => {
                console.error(`  ❌ [${target.name}] ${msg}`);
                failed = true;
            };

            if (result.status !== 'RESOLVED') logError(`Status mismatch: expected RESOLVED, got ${result.status}`);
            if (result.ecosystem !== target.expectedEcosystem) logError(`Ecosystem mismatch: expected ${target.expectedEcosystem}, got ${result.ecosystem}`);
            if (result.domain !== target.expectedDomain) logError(`Domain mismatch: expected ${target.expectedDomain}, got ${result.domain}`);
            if (result.isVSCode !== target.expectedFlags.isVSCode) logError(`isVSCode flag mismatch`);
            if (result.isLinux !== target.expectedFlags.isLinux) logError(`isLinux flag mismatch`);
            if (result.isNestJS !== target.expectedFlags.isNestJS) logError(`isNestJS flag mismatch`);
            if (result.isAntennaPod !== target.expectedFlags.isAntennaPod) logError(`isAntennaPod flag mismatch`);

            if (!failed) {
                console.log(`  ✅ [${target.name}] Detected correctly (Confidence: ${(result.confidence * 100).toFixed(0)}%)`);
                console.log(`     Evidence: ${result.evidence.map(e => `${e.source}(${e.score})`).join(', ')}`);
                passed++;
            }
        } catch (e) {
            console.error(`  ❌ [${target.name}] Errored:`, e);
        }
    }

    console.log(`\n[Detector] Result: ${passed}/${targets.length} passed.`);
    if (passed !== targets.length) {
        process.exit(1);
    }
}

if (require.main === module) {
    runTests();
}
