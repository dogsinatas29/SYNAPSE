const fs = require('fs');
const readline = require('readline');

const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';

const stats = {
  totalRecorded: 0,
  actualCount: 0,
  resolutionKindMap: {},
  combinationMap: {},
  pathExistsButNodeFails: 0,
  edgeCreatedCount: 0
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
      
      // Check if it's metadata
      if (obj._metadata) {
        stats.totalRecorded = obj._metadata.totalRecorded;
        continue;
      }

      stats.actualCount++;
      
      // 2. resolutionKind별 분포
      const kind = obj.resolutionKind || 'undefined';
      stats.resolutionKindMap[kind] = (stats.resolutionKindMap[kind] || 0) + 1;
      
      // 3. targetPathExists와 targetNodeExists의 조합별 건수
      const pathExists = obj.targetPathExists ? 'path_O' : 'path_X';
      const nodeExists = obj.targetNodeExists ? 'node_O' : 'node_X';
      const combo = `${pathExists} / ${nodeExists}`;
      stats.combinationMap[combo] = (stats.combinationMap[combo] || 0) + 1;
      
      // 4. 대상 파일은 존재하지만 노드 매핑에 실패한 참조의 수
      if (obj.targetPathExists && !obj.targetNodeExists) {
        stats.pathExistsButNodeFails++;
      }
      
      if (obj.edgeCreated) {
        stats.edgeCreatedCount++;
      }
    } catch (e) {
      console.error("Parse error on line:", line);
    }
  }

  console.log("=== 분석 결과 ===");
  console.log(`1. 실제 기록된 줄 수: ${stats.actualCount}`);
  console.log(`   메타데이터의 totalRecorded: ${stats.totalRecorded}`);
  console.log(`   edgeCreated=true 수: ${stats.edgeCreatedCount}`);
  
  console.log("\n2. resolutionKind 분포:");
  Object.entries(stats.resolutionKindMap).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`   - ${k}: ${v}`);
  });
  
  console.log("\n3. targetPathExists & targetNodeExists 조합 건수:");
  Object.entries(stats.combinationMap).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`   - ${k}: ${v}`);
  });
  
  console.log(`\n4. 대상 파일은 존재하지만 노드 매핑에 실패한 참조 수: ${stats.pathExistsButNodeFails}`);
}

processLineByLine();
