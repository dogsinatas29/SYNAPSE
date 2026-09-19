const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const VSCODE_SRC_ROOT = '/home/dogsinatas/다운로드/vscode/vscode-main/src';
const TARGET_DIRS = [
    path.join(VSCODE_SRC_ROOT, 'vs/base'),
    path.join(VSCODE_SRC_ROOT, 'vs/platform')
];

const graph = {};
let totalEdges = 0;

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
    // Remove .js extension if present, as VS Code uses it for ES modules
    let cleanImportPath = importPath.endsWith('.js') ? importPath.slice(0, -3) : importPath;
    
    let resolved = null;
    
    if (cleanImportPath.startsWith('vs/')) {
        resolved = path.join(VSCODE_SRC_ROOT, cleanImportPath + '.ts');
        if (!fs.existsSync(resolved)) {
            resolved = path.join(VSCODE_SRC_ROOT, cleanImportPath, 'index.ts');
        }
    } else if (cleanImportPath.startsWith('.')) {
        resolved = path.resolve(path.dirname(importerPath), cleanImportPath + '.ts');
        if (!fs.existsSync(resolved)) {
            resolved = path.resolve(path.dirname(importerPath), cleanImportPath, 'index.ts');
        }
    }
    
    if (resolved && fs.existsSync(resolved)) {
        return resolved;
    }
    
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
                    totalEdges++;
                }
            }
        }
    }

    console.log(`Total Edges extracted: ${totalEdges}`);

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
}

function getPearson(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }
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
    const spearman = 1 - (6 * sumD2) / (n * (n * n - 1));
    return isNaN(spearman) ? 0 : spearman;
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
