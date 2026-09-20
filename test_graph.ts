import * as fs from 'fs';
import * as path from 'path';
import { GoScanner } from './src/core/GoScanner';
import { ReferenceResolver } from './src/core/ReferenceResolver';

function walkDir(dir: string, ext: string): string[] {
    let files: string[] = [];
    for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            if (!p.includes('vendor') && !p.includes('.git')) {
                files = files.concat(walkDir(p, ext));
            }
        } else if (p.endsWith(ext)) {
            files.push(p);
        }
    }
    return files;
}

const dir = '/home/dogsinatas/다운로드/etcd/';
const files = walkDir(dir, '.go');
const scanner = new GoScanner();
const symbolIndex = new Map<string, string>() as any;

let normalizedRefs: any[] = [];
for (const file of files) {
    const summary = scanner.scanFile(file);
    const parsedRefs = summary.references.filter((r: any) => r.type === 'dependency');
    normalizedRefs = normalizedRefs.concat(parsedRefs.filter((r: any) => r.target && r.target.length > 0).map((r: any) => ({ sourceFilePath: file, ref: r })));
}

// Generate Baseline
process.env.ENABLE_GO_BROADCAST = 'false';
let resolved = ReferenceResolver.resolve(normalizedRefs, new Set(files), symbolIndex);
let edges = resolved.filter((r: any) => r.resolutionKind !== 'unresolved').map((r: any) => ({source: r.sourceId, target: r.targetId}));
fs.writeFileSync('scratch/baseline_edges.json', JSON.stringify(edges, null, 2));

// Generate Broadcast
process.env.ENABLE_GO_BROADCAST = 'true';
resolved = ReferenceResolver.resolve(normalizedRefs, new Set(files), symbolIndex);
edges = resolved.filter((r: any) => r.resolutionKind !== 'unresolved').map((r: any) => ({source: r.sourceId, target: r.targetId}));
fs.writeFileSync('scratch/broadcast_edges.json', JSON.stringify(edges, null, 2));

console.log("Done");
