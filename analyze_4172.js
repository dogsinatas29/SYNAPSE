const fs = require('fs');
const path = require('path');
const readline = require('readline');

const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';
const projectRoot = '/home/dogsinatas/다운로드/chromium-main';

const stats = {
  total: 0,
  directories: 0,
  filesByExtension: {},
  missingFiles: 0 // Files that were marked as existing but stat fails (rare)
};

async function processLineByLine() {
  const fileStream = fs.createReadStream(tracePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.targetPathExists && !obj.targetNodeExists) {
        stats.total++;
        const targetPath = path.join(projectRoot, obj.normalizedTarget);
        
        try {
          const stat = fs.statSync(targetPath);
          if (stat.isDirectory()) {
            stats.directories++;
          } else {
            const ext = path.extname(obj.normalizedTarget) || '[No Extension]';
            stats.filesByExtension[ext] = (stats.filesByExtension[ext] || 0) + 1;
          }
        } catch (err) {
          stats.missingFiles++;
        }
      }
    } catch (e) {}
  }

  console.log("=== 4,172건 상세 분류 결과 ===");
  console.log(`전체 대상: ${stats.total}건`);
  console.log(`- 디렉터리(Directory) 참조: ${stats.directories}건`);
  console.log(`- stat 실패(권한/삭제 등): ${stats.missingFiles}건`);
  console.log(`- 단일 파일 참조: ${stats.total - stats.directories - stats.missingFiles}건\n`);
  
  console.log("=== 파일 확장자별 분류 ===");
  Object.entries(stats.filesByExtension)
    .sort((a,b) => b[1] - a[1])
    .forEach(([ext, count]) => {
      console.log(`${ext}: ${count}건`);
    });
}

processLineByLine();
