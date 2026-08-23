const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function maskPaths(log, rootPath) {
    if (!log) return log;
    const regex = new RegExp(rootPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    return log.replace(regex, '<PROJECT_ROOT>');
}

function runBuild() {
    const projectRoot = __dirname;
    const milestoneDir = path.join(projectRoot, 'mile_stone');
    const releaseNoteDir = path.join(projectRoot, 'release_note');

    try {
        // 2. 마일스톤-빌드 타겟 강제 동기화: 가장 최신 마일스톤 파일 찾기
        const files = fs.readdirSync(milestoneDir);
        const milestoneFiles = files.filter(f => /^v\d/.test(f) && f.endsWith('.md') && !f.includes('_implementation_plan')).sort().reverse();

        if (milestoneFiles.length === 0) {
            throw new Error('BM Policy Mismatch: No milestone documents found.');
        }

        const bmSyncVer = process.env.BM_SYNC_VER;
        let currentVersion;
        
        if (bmSyncVer && milestoneFiles.includes(`${bmSyncVer}.md`)) {
            currentVersion = bmSyncVer;
        } else {
            const currentMilestoneFile = milestoneFiles[0];
            currentVersion = currentMilestoneFile.replace('.md', ''); // e.g. "v0.2.17"
        }

        // 1. 환경 변수 기반 빌드 트리거
        if (bmSyncVer !== currentVersion) {
            throw new Error(`BM Policy Mismatch: Build Aborted. Expected BM_SYNC_VER '${currentVersion}' but got '${bmSyncVer}'.`);
        }

        // 3. 릴리즈 노트 무결성 검사
        const releaseNoteFile = path.join(releaseNoteDir, `${currentVersion}_release_notes.md`);
        if (!fs.existsSync(releaseNoteFile)) {
            throw new Error(`미승인 배포: Release note not found for ${currentVersion}`);
        }

        const noteContent = fs.readFileSync(releaseNoteFile, 'utf8');
        if (!noteContent.includes('[Status: Verified by Commander]')) {
            throw new Error(`미승인 배포: 릴리즈 노트에 [Status: Verified by Commander] 태그가 명시되지 않았습니다.`);
        }

        console.log(`[Build Guard] Policy checks passed for ${currentVersion}. Starting compilation...`);

        // Canvas Engine 동기화: ui/ → demo/
        const srcCanvas = path.join(projectRoot, 'ui', 'canvas-engine.js');
        const dstCanvas = path.join(projectRoot, 'demo', 'canvas-engine.js');
        if (!fs.existsSync(path.dirname(dstCanvas))) {
            fs.mkdirSync(path.dirname(dstCanvas), { recursive: true });
        }
        if (fs.existsSync(srcCanvas)) {
            fs.copyFileSync(srcCanvas, dstCanvas);
            console.log(`[Build Guard] Synced canvas-engine.js: ui/ → demo/`);
        } else {
            console.log(`[Build Guard] Skipped sync: ui/canvas-engine.js not found.`);
        }

        // Compile
        execSync('npm run compile', { stdio: 'inherit', cwd: projectRoot });

        // Build vsix
        const vsixName = `synapse-visual-architecture-${currentVersion}.vsix`;
        console.log(`[Build Guard] Packaging into ${vsixName}...`);

        const vsceResult = execSync(`npx vsce package -o ${vsixName}`, {
            stdio: 'pipe',
            cwd: projectRoot,
            encoding: 'utf8'
        });

        // 4. 보안 로깅 (외곽 참조 마스킹)
        const maskedLog = maskPaths(vsceResult, projectRoot);
        console.log(maskedLog);

        console.log(`[Build Guard] Successfully packaged ${vsixName}`);

    } catch (e) {
        const maskedError = maskPaths(e.message || String(e), projectRoot);
        console.error(`\x1b[31m[Build Error]\x1b[0m ${maskedError}`);
        process.exit(1);
    }
}

runBuild();
