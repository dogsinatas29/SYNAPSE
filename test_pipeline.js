const path = require('path');
const fs = require('fs');

// Stub out minimal things to test DataPipeline locally
process.env.VSCODE_NLS_CONFIG = "{}";

const projectRoot = "/home/dogsinatas/Downloads/DOOM-master";
if (!fs.existsSync(projectRoot)) {
    console.log("No DOOM-master found at", projectRoot);
    process.exit(0);
}

// We will load the transpiled js from out/ or src/ ?
// If I use ts-node, it's easier.
