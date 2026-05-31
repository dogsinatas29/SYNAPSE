const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/extension.ts'), 'utf8');

const importRegex = /(?:import|require)\s+(?:type\s+)?(?:[\s\S]*?from\s+)?['"]([^'"`${}]+)['"]|import\s*\(\s*['"]([^'"`${}]+)['"]\s*\)/g;

let match;
let count = 0;
while ((match = importRegex.exec(content)) !== null) {
    const ref = match[1] || match[2];
    console.log(`Matched: ${ref}`);
    count++;
}
console.log(`Total matched count: ${count}`);
