const path = require('path');

const nodeIds = [
    "src/core/FileScanner.ts",
    "src/core/PhaseManager.ts",
    "src/core/GraphModel.ts",
    "src/core/canvas-engine/CanvasEngine.ts",
    "src/core/RuleEngine.ts"
];

const references = [
    { target: "FileScanner", type: "dependency" },
    { target: "PhaseManager", type: "dependency" },
    { target: "GraphModel", type: "dependency" },
    { target: "CanvasEngine", type: "dependency" },
    { target: "RuleEngine", type: "dependency" }
];

function debugMatch(targetNodeId) {
    const lowerTarget = targetNodeId.toLowerCase();
    console.log(`Matching target: ${targetNodeId} (lower: ${lowerTarget})`);
    
    const matchedId = nodeIds.find(id => {
        const ext = path.extname(id);
        const stem = path.basename(id, ext).toLowerCase();
        const matches = stem === lowerTarget;
        console.log(`  Checking ID: ${id} -> stem: ${stem} -> Match: ${matches}`);
        return matches && (id.endsWith('.ts') || id.endsWith('.js') || id.endsWith('.py') || id.endsWith('.tsx') || id.endsWith('.jsx') || id.endsWith('.rs'));
    });
    
    return matchedId;
}

for (const ref of references) {
    const result = debugMatch(ref.target);
    console.log(`RESULT: ${ref.target} -> ${result || 'NOT FOUND'}\n`);
}
