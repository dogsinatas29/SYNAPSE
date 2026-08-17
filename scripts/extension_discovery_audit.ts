import * as fs from 'fs';
import * as path from 'path';

function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            getAllFiles(filepath, fileList);
        } else if (filepath.endsWith('.ts')) {
            fileList.push(filepath);
        }
    }
    return fileList;
}

const srcDir = path.join(__dirname, '../src');
const files = getAllFiles(srcDir);

const implementations: Record<string, string[]> = {};
const extensions: Record<string, string[]> = {};

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const basename = path.basename(file, '.ts');

    // Match "class X implements Y, Z"
    const implementsRegex = /class\s+(\w+)\s+implements\s+([^{]+)/g;
    let match;
    while ((match = implementsRegex.exec(content)) !== null) {
        const className = match[1];
        const interfaces = match[2].split(',').map(s => s.trim());
        for (const iface of interfaces) {
            const cleanIface = iface.split('<')[0].trim(); // Remove generics
            if (!implementations[cleanIface]) implementations[cleanIface] = [];
            implementations[cleanIface].push(className);
        }
    }

    // Match "class X extends Y"
    const extendsRegex = /class\s+(\w+)\s+extends\s+([^{]+)/g;
    while ((match = extendsRegex.exec(content)) !== null) {
        const className = match[1];
        const baseClass = match[2].split('implements')[0].split(',')[0].trim();
        const cleanBase = baseClass.split('<')[0].trim();
        if (!extensions[cleanBase]) extensions[cleanBase] = [];
        extensions[cleanBase].push(className);
    }
}

console.log('=== Extension Discovery Audit ===\n');

console.log('1. Interfaces Implemented (Potential Extension Points):');
const sortedImpls = Object.entries(implementations).sort((a, b) => b[1].length - a[1].length);
for (const [iface, classes] of sortedImpls) {
    if (classes.length >= 2) {
        console.log(`\n[${classes.length}] ${iface}`);
        classes.forEach(c => console.log(`  ├ ${c}`));
    }
}

console.log('\n======================================================\n');

console.log('2. Base Classes Extended (Potential Extension Points):');
const sortedExts = Object.entries(extensions).sort((a, b) => b[1].length - a[1].length);
for (const [base, classes] of sortedExts) {
    if (classes.length >= 2) {
        console.log(`\n[${classes.length}] ${base}`);
        classes.forEach(c => console.log(`  ├ ${c}`));
    }
}
