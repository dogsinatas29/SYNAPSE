const fs = require('fs');
const path = require('path');
const ts = require('typescript');

if (process.argv.length < 4) {
    console.error("Usage: node ts_ast_extractor.js <PROJECT_ROOT> <TARGET_DIR_1> [TARGET_DIR_2 ...]");
    process.exit(1);
}

const PROJECT_ROOT = path.resolve(process.argv[2]);
const TARGET_DIRS = process.argv.slice(3).map(dir => path.resolve(dir));


const graph = {};

function getAllTsFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllTsFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

function resolveImportPath(importerPath, importPath) {
    let cleanImportPath = importPath.endsWith('.js') ? importPath.slice(0, -3) : importPath;
    let resolved = null;

    if (cleanImportPath.startsWith('vs/')) {
        resolved = path.join(PROJECT_ROOT, cleanImportPath + '.ts');
        if (!fs.existsSync(resolved)) {
            resolved = path.join(PROJECT_ROOT, cleanImportPath, 'index.ts');
        }
    } else if (cleanImportPath.startsWith('.')) {
        resolved = path.resolve(path.dirname(importerPath), cleanImportPath + '.ts');
        if (!fs.existsSync(resolved)) {
            resolved = path.resolve(path.dirname(importerPath), cleanImportPath, 'index.ts');
        }
    }
    
    if (resolved && fs.existsSync(resolved)) return resolved;
    return null;
}

function extractImports(filePath) {
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
        filePath,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
    );

    const imports = [];

    function visit(node) {
        if (ts.isImportDeclaration(node)) {
            if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                imports.push(node.moduleSpecifier.text);
            }
        } else if (ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                imports.push(node.moduleSpecifier.text);
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return imports;
}

function buildGraph() {
    console.log('Collecting TS files...');
    const allFiles = [];
    for (const dir of TARGET_DIRS) {
        if (fs.existsSync(dir)) {
            getAllTsFiles(dir, allFiles);
        } else {
            console.warn(`Directory not found: ${dir}`);
        }
    }
    console.log(`Found ${allFiles.length} internal TS files in base and platform.`);

    for (const file of allFiles) {
        graph[file] = {
            id: file,
            fanIn: 0,
            fanOut: 0,
            imports: []
        };
    }

    console.log('Extracting AST edges...');
    for (const file of allFiles) {
        const rawImports = extractImports(file);
        for (const imp of rawImports) {
            const resolvedPath = resolveImportPath(file, imp);
            if (resolvedPath && graph[resolvedPath]) {
                if (!graph[file].imports.includes(resolvedPath)) {
                    graph[file].imports.push(resolvedPath);
                    graph[file].fanOut++;
                    graph[resolvedPath].fanIn++;
                }
            }
        }
    }

    console.log('Calculating correlations for valid nodes...');
    let fanIns = [];
    let fanOuts = [];
    
    for (const file in graph) {
        fanIns.push(graph[file].fanIn);
        fanOuts.push(graph[file].fanOut);
    }
    
    const pearson = getPearson(fanIns, fanOuts);
    const spearman = getSpearman(fanIns, fanOuts);
    
    console.log(`\n=== VS Code Sample (base + platform) Results ===`);
    console.log(`Total Valid Internal Nodes: ${fanIns.length}`);
    console.log(`Corr(fanIn, fanOut) [Pearson]:  ${pearson.toFixed(4)}`);
    console.log(`Corr(fanIn, fanOut) [Spearman]: ${spearman.toFixed(4)}`);
    console.log(`===============================================\n`);

    console.log("\nWriting graph.json for deep analysis...");
    fs.writeFileSync('graph.json', JSON.stringify(graph, null, 2), 'utf8');
    console.log("Graph saved to graph.json");
}

function getPearson(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    return numerator / denominator;
}

function getSpearman(x, y) {
    const n = x.length;
    const rankX = getRanks(x);
    const rankY = getRanks(y);
    let sumD2 = 0;
    for (let i = 0; i < n; i++) {
        const d = rankX[i] - rankY[i];
        sumD2 += d * d;
    }
    return 1 - (6 * sumD2) / (n * (n * n - 1));
}

function getRanks(arr) {
    const sorted = arr.map((val, ind) => ({ val, ind })).sort((a, b) => a.val - b.val);
    const ranks = new Array(arr.length);
    let i = 0;
    while (i < sorted.length) {
        let j = i;
        while (j < sorted.length && sorted[j].val === sorted[i].val) {
            j++;
        }
        const rank = (i + 1 + j) / 2;
        for (let k = i; k < j; k++) {
            ranks[sorted[k].ind] = rank;
        }
        i = j;
    }
    return ranks;
}

buildGraph();
