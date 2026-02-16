#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

// dist 폴더에서 BootstrapEngine 로드
const { BootstrapEngine } = require('./dist/bootstrap/BootstrapEngine');

async function runDemoBootstrap() {
    console.log('🚀 demo 모드 GEMINI.md 기반 Bootstrap 시작\n');

    const projectRoot = path.join(__dirname, 'demo');
    const geminiMdPath = path.join(projectRoot, 'GEMINI.md');

    console.log('📋 설정:');
    console.log(`  - GEMINI.md: ${geminiMdPath}`);
    console.log(`  - 프로젝트 루트: ${projectRoot}`);
    console.log(`  - 자동 승인: true\n`);

    const engine = new BootstrapEngine();
    const result = await engine.bootstrap(geminiMdPath, projectRoot, true);

    if (result.success) {
        console.log('\n✅ Demo Bootstrap 성공!');
        console.log(`  - 생성된 노드: ${result.initial_nodes.length}개`);
        console.log(`  - 생성된 엣지: ${result.initial_edges.length}개`);
    } else {
        console.error('\n❌ Demo Bootstrap 실패:', result.error);
        process.exit(1);
    }
}

runDemoBootstrap().catch(console.error);
