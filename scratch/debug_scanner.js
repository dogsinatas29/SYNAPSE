const path = require('path');
const fs = require('fs');

// We can run ts-node or load ts file via ts-node directly, but since we have ts-node installed:
// Let's run a test by importing the transpiled DataPipeline and FileScanner from out/ or dist/ if available.
// Or we can dynamically use ts-node to register and import the source ts files.

require('ts-node').register({
    compilerOptions: {
        module: "commonjs"
    }
});

const { DataPipeline } = require('../src/core/DataPipeline');
const { RuleEngine } = require('../src/core/RuleEngine');

const projectRoot = path.join(__dirname, '..');
RuleEngine.getInstance().loadRules(projectRoot);

// Let's get files list like getDiscoverableFiles
function getDiscoverableFiles(projectRoot) {
    const fileList = [];
    const scanDir = (dir, relPath = '', depth = 0) => {
        if (!fs.existsSync(dir) || depth > 10) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const currentRelPath = path.join(relPath, file).replace(/\\/g, '/');
            if (currentRelPath.startsWith('node_modules') || currentRelPath.startsWith('.git') || currentRelPath.startsWith('dist') || currentRelPath.startsWith('data')) continue;
            
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDir(fullPath, currentRelPath, depth + 1);
            } else {
                const ext = path.extname(file).toLowerCase();
                const scanExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.c', '.h', '.cpp', '.hpp', '.cc', '.rs', '.sh', '.sql', '.md'];
                if (scanExtensions.includes(ext)) {
                    fileList.push(currentRelPath);
                }
            }
        }
    };
    scanDir(projectRoot);
    return fileList;
}

const discoveredFiles = getDiscoverableFiles(projectRoot);
console.log(`Discovered ${discoveredFiles.length} files.`);

const pipeline = new DataPipeline();
const result = pipeline.processFiles(discoveredFiles, projectRoot);

console.log(`Pipeline Result Nodes: ${result.nodes.length}`);
console.log(`Pipeline Result Edges: ${result.edges.length}`);
if (result.edges.length > 0) {
    console.log(`Sample Edge:`, result.edges[0]);
} else {
    console.log(`No edges generated!`);
}
