
const pathStr = 'prompts/2026-02-17_keybinding_check.md';
const parts = pathStr.split(/[/\\]/).filter(p => p !== '');
console.log('Parts:', JSON.stringify(parts));

const root = { name: 'Root', type: 'folder', children: {}, fullPath: '', expanded: true };
let current = root;
for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isFile = (i === parts.length - 1);
    const currentPath = parts.slice(0, i + 1).join('/');

    if (isFile) {
        current.children[part] = {
            name: part,
            type: 'file',
            path: pathStr
        };
    } else {
        if (!current.children[part]) {
            current.children[part] = {
                name: part,
                type: 'folder',
                children: {},
                fullPath: currentPath,
                expanded: true
            };
        }
        current = current.children[part];
    }
}

console.log('Tree Structure:', JSON.stringify(root, null, 2));
