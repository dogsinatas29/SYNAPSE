#!/usr/bin/env node
/**
 * SYNAPSE CLI
 * 커맨드라인에서 Bootstrap 실행
 */

import * as path from 'path';
import { BootstrapEngine } from './bootstrap/BootstrapEngine';
import { BatchRunner } from './cli/BatchRunner';

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('사용법: synapse-bootstrap <GEMINI.md 경로> [프로젝트 루트]');
        console.log('예시: synapse-bootstrap ./GEMINI.md ./my-project');
        process.exit(1);
    }

    const command = args[0];

    if (command === 'analyze-batch') {
        const projectsJsonPath = args[1] ? path.resolve(args[1]) : undefined;
        const runner = new BatchRunner();
        await runner.run(projectsJsonPath);
        process.exit(0);
    }

    // Default bootstrap behavior for backwards compatibility
    const geminiMdPath = path.resolve(args[0]);
    const projectRoot = args[1] ? path.resolve(args[1]) : process.cwd();

    const engine = new BootstrapEngine();
    const result = await engine.bootstrap(geminiMdPath, projectRoot, true);

    if (result.success) {
        console.log('\n🎉 프로젝트 초기화 완료!');
        console.log('\n다음 단계:');
        console.log('  1. VS Code에서 프로젝트 열기');
        console.log('  2. SYNAPSE 확장 실행');
        console.log('  3. 캔버스에서 노드 확인 및 승인');
        process.exit(0);
    } else {
        console.error('\n❌ 초기화 실패:', result.error);
        process.exit(1);
    }
}

main().catch(console.error);
