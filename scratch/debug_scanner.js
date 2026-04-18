const fs = require('fs');
const path = require('path');

function parseJavaScript(content) {
    const summary = { references: [] };
    try {
        const importRegex = /(?:import|require)\s+(?:type\s+)?(?:[\s\S]*?from\s+)?['"]([^'"`${}]+)['"]|import\s*\(\s*['"]([^'"`${}]+)['"]\s*\)/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const ref = match[1] || match[2];
            if (ref) {
                if (ref.includes('${') || ref.length > 100) continue;

                const cleanRef = path.basename(ref, path.extname(ref));
                console.log(`Found ref: ${ref} -> clean: ${cleanRef}`);
                summary.references.push({ target: cleanRef, type: 'dependency' });
            }
        }
    } catch (error) {
        console.error('Parse error:', error);
    }
    return summary;
}

const filePath = path.join(__dirname, '../src/core/DataPipeline.ts');
const content = fs.readFileSync(filePath, 'utf-8');
const result = parseJavaScript(content);
console.log('Final Result:', JSON.stringify(result, null, 2));
