#!/usr/bin/env node
/**
 * SYNAPSE Bootstrap 테스트
 * 현재 디렉토리의 GEMINI.md를 읽고 Bootstrap 실행
 */

const path = require('path');
const { BootstrapEngine } = require('./dist/bootstrap/BootstrapEngine');

async function test() {
    console.log('🧪 SYNAPSE Bootstrap 테스트 시작\n');

    const geminiMdPath = path.join(__dirname, 'GEMINI.md');
    const projectRoot = __dirname;

    const engine = new BootstrapEngine();

    console.log('📋 설정:');
    console.log(`  - GEMINI.md: ${geminiMdPath}`);
    console.log(`  - 프로젝트 루트: ${projectRoot}`);
    console.log(`  - 자동 승인: true\n`);

    const result = await engine.bootstrap(geminiMdPath, projectRoot, true);

    if (result.success) {
        console.log('\n✅ 테스트 성공!');
        console.log('\n생성된 파일 확인:');
        console.log('  - data/project_state.json');
        console.log('  - architecture.md');
    } else {
        console.error('\n❌ 테스트 실패:', result.error);
        process.exit(1);
    }
}

test().catch(console.error);
