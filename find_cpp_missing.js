const fs = require('fs');
const readline = require('readline');

const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';

async function processLineByLine() {
  const fileStream = fs.createReadStream(tracePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let h_count = 0;
  let cc_count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.targetPathExists && !obj.targetNodeExists) {
        if (obj.normalizedTarget.endsWith('.h') && h_count < 10) {
          console.log(`[H ] Source: ${obj.source} -> Target: ${obj.normalizedTarget} (${obj.resolutionKind})`);
          h_count++;
        }
        if (obj.normalizedTarget.endsWith('.cc') && cc_count < 10) {
          console.log(`[CC] Source: ${obj.source} -> Target: ${obj.normalizedTarget} (${obj.resolutionKind})`);
          cc_count++;
        }
        if (h_count >= 10 && cc_count >= 10) break;
      }
    } catch (e) {}
  }
}

processLineByLine();
