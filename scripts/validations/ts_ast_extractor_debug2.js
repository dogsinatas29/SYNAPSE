const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const VSCODE_SRC_ROOT = '/home/dogsinatas/다운로드/vscode/vscode-main/src';
const sampleFile = path.join(VSCODE_SRC_ROOT, 'vs/platform/actions/common/actions.ts');

const sourceCode = fs.readFileSync(sampleFile, 'utf8');
const sourceFile = ts.createSourceFile(
    sampleFile,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
);

function visit(node) {
    if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            console.log('Found import:', node.moduleSpecifier.text);
        }
    }
    ts.forEachChild(node, visit);
}

visit(sourceFile);
