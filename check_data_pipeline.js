const fs = require('fs');
const code = fs.readFileSync('/home/dogsinatas/TypeScript_project/antigravity-extension-vis/src/core/DataPipeline.ts', 'utf8');
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('findSourceFiles') || lines[i].includes('files =') || lines[i].includes('ProjectAnalyzer') || lines[i].includes('path.relative')) {
        console.log(`${i+1}: ${lines[i]}`);
    }
}
