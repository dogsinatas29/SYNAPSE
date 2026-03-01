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
        const milestoneFiles = files.filter(f => f.startsWith('v') && f.endsWith('.md')).sort().reverse();

        if (milestoneFiles.length === 0) {
            throw new Error('BM Policy Mismatch: No milestone documents found.');
        }

        const currentMilestoneFile = milestoneFiles[0];
        const currentVersion = currentMilestoneFile.replace('.md', ''); // e.g. "v0.2.17"

        // 1. 환경 변수 기반 빌드 트리거
        const bmSyncVer = process.env.BM_SYNC_VER;
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

        // Compile
        execSync('npm run compile', { stdio: 'inherit', cwd: projectRoot });

        // Build vsix
        const vsixName = `synapse-visual-architecture-${currentVersion}.vsix`;
        console.log(`[Build Guard] Packaging into ${vsixName}...`);

        const vsceResult = execSync(`npx vsce package --no-dependencies -o ${vsixName}`, {
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
