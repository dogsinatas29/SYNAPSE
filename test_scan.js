const fs = require('fs');
const path = require('path');

function getDiscoverableFiles(projectRoot, includePaths) {
    const fileList = [];
    const scanDir = (dir, relPath = '', depth = 0) => {
        if (!fs.existsSync(dir) || depth > 10) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const currentRelPath = path.join(relPath, file).replace(/\\/g, '/');
            
            // Simplified ignore
            if (['node_modules', '.git', 'build', 'dist', 'data', 'out', 'bin', 'obj'].includes(file)) continue;

            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scanDir(fullPath, currentRelPath, depth + 1);
            } else {
                const ext = path.extname(file).toLowerCase();
                const scanExtensions = ['.ts', '.js', '.py', '.c', '.h', '.cpp', '.rs', '.java', '.kt'];
                if (scanExtensions.includes(ext)) {
                    fileList.push(currentRelPath);
                }
            }
        }
    };
    scanDir(projectRoot);
    return fileList;
}

const res = getDiscoverableFiles('/home/dogsinatas/다운로드/AntennaPod-develop/AntennaPod');
console.log(res.filter(f => f.includes('EpisodeDetailActivity')));
