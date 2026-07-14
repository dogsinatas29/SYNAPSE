const fs = require('fs');
const path = require('path');
let html = fs.readFileSync('ui/index.html', 'utf8');

const cspSource = "vscode-webview-resource";
const nonce = "1234567890abcdef";

html = html.replace(
    '<head>',
    `<head>\n<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval'; img-src ${cspSource} https:; connect-src ${cspSource} https:; worker-src ${cspSource} blob:;">`
);

html = html.replace(
    /<script/g,
    `<script nonce="${nonce}"`
);

html = html.replace(
    '</head>',
    `<script nonce="${nonce}">\nconst vscode = "dummy";\nwindow.vscode = vscode;\n</script>\n</head>`
);

fs.writeFileSync('scratch/output.html', html);
console.log("Dumped HTML to scratch/output.html");
