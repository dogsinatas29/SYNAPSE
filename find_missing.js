const fs = require('fs');
const readline = require('readline');

const tracePath = '/home/dogsinatas/다운로드/chromium-main/synapse_report/surgery/05_RESOLVER_TRACE.json';

async function processLineByLine() {
  const fileStream = fs.createReadStream(tracePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.targetPathExists && !obj.targetNodeExists) {
        console.log(`Source: ${obj.source}`);
        console.log(`Normalized Target: ${obj.normalizedTarget}`);
        console.log(`Resolution: ${obj.resolutionKind}`);
        console.log('---');
        count++;
        if (count >= 10) break;
      }
    } catch (e) {}
  }
}

processLineByLine();
