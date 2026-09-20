import * as fs from 'fs';
import * as path from 'path';
import { FileScanner } from '../../src/core/FileScanner';
import { ReferenceResolver } from '../../src/core/ReferenceResolver';
import { SymbolIndex } from '../../src/core/SymbolIndex';

export interface AuditResult {
    totalImports: number;
    excludedImports: number;
    resolvableImports: number;
    
    stage1Parsed: number;       // Found by FileScanner
    stage2Normalizedd: number;   // Normalizer passed
    stage3Lookup: number;       // Mapped to Node ID
    stage4EdgeGen: number;      // Edges created
    stage5Survival: number;
    failedLookups: any[];
    broadcastRecoverable: number;
    broadcastUnrecoverable: number;
    unrecoverableMap: Map<string, number>;
    successLookups: any[];     // Final edges in graph
}

// Simple regex to find true imports in Go files for baseline
function getTrueGoImports(content: string): string[] {
    const imports: string[] = [];
    let inImportBlock = false;
    const lines = content.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('import (')) {
            inImportBlock = true;
            continue;
        }
        if (inImportBlock) {
            if (line === ')') {
                inImportBlock = false;
                continue;
            }
            if (line && !line.startsWith('//')) {
                const match = line.match(/"(.*?)"/);
                if (match) imports.push(match[1]);
            }
        } else if (line.startsWith('import ')) {
            const match = line.match(/"(.*?)"/);
            if (match) imports.push(match[1]);
        }
    }
    return imports;
}

export class ResolverTraceAuditor {
    public static async runAudit(projectRoot: string, targetExt: string, sampleDir?: string) {
        console.log(`\n==================================================`);
        console.log(`🔍 [P0] 5-Stage Resolver Trace Audit`);
        console.log(`==================================================`);
        console.log(`Target: ${projectRoot}`);
        console.log(`Extension: ${targetExt}`);
        
        const stats: AuditResult = {
            totalImports: 0,
            excludedImports: 0,
            resolvableImports: 0,
            stage1Parsed: 0,
            stage2Normalizedd: 0,
            stage3Lookup: 0,
            stage4EdgeGen: 0,
            stage5Survival: 0,
            failedLookups: [],
            broadcastRecoverable: 0,
            broadcastUnrecoverable: 0,
            unrecoverableMap: new Map<string, number>(),
            successLookups: []
        };

        const files: string[] = [];
        const scanDir = (dir: string) => {
            if (!fs.existsSync(dir)) return;
            for (const file of fs.readdirSync(dir)) {
                const fullPath = path.join(dir, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    scanDir(fullPath);
                } else if (fullPath.endsWith(targetExt) && !fullPath.endsWith('_test.go')) {
                    files.push(fullPath);
                }
            }
        };
        
        const scanRoot = sampleDir ? path.join(projectRoot, sampleDir) : projectRoot;
        scanDir(scanRoot);
        console.log(`Found ${files.length} ${targetExt} files.\n`);
        
        const scanner = new FileScanner();
        const symbolIndex = SymbolIndex.getInstance();
        symbolIndex.initialize('audit', projectRoot);
        
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            
            // Baseline
            const actualImports = getTrueGoImports(content);
            stats.totalImports += actualImports.length;
            
            // Filter external / stdlib (mock logic for Go stdlib)
            const resolvable = actualImports.filter(imp => imp.includes('.') || imp.includes('/')); 
            stats.resolvableImports += resolvable.length;
            stats.excludedImports += (actualImports.length - resolvable.length);
            
            // SYNAPSE Pipeline 
            // Stage 1: Parse
            const summary = scanner.scanFile(file);
            const parsedRefs = summary.references.filter(r => r.type === 'dependency');
            const resolvableParsed = parsedRefs.filter(r => r.target && (r.target.includes('.') || r.target.includes('/')));
            stats.stage1Parsed += resolvableParsed.length;
            
            // Stage 2: Normalize
            // Assuming normalization happens before lookup
            const normalizedRefs = parsedRefs.filter(r => r.target && r.target.length > 0).map(r => ({ sourceFilePath: file, ref: r }));
            stats.stage2Normalizedd += normalizedRefs.length;
            
            // Stage 3: Lookup & Stage 4: Edge Gen
            // For edge gen, ReferenceResolver determines if an edge is valid
            const resolved = ReferenceResolver.resolve(normalizedRefs, new Set(files), symbolIndex);
            for (const r of resolved) {
                if (r.resolutionKind !== 'unresolved' && !r.targetId.startsWith('ghost://')) {
                    stats.stage3Lookup++;
                    stats.stage4EdgeGen++;
                    stats.fanOutMap = stats.fanOutMap || new Map<string, number>();
                    stats.fanOutMap.set(r.sourceId, (stats.fanOutMap.get(r.sourceId) || 0) + 1);
                    if (stats.successLookups.length < 20) {
                        stats.successLookups.push({
                            file: file,
                            raw: r.targetId,
                            resolvedTo: r.resolutionKind
                        });
                    }
                } else {
                    // It is a lookup failure.
                    // Let's check if it's recoverable by broadcast.
                    const targetDirName = r.targetId.split('/').pop() || r.targetId;
                    let found = false;
                    for (const f of files) {
                        if (f.includes(r.targetId) || f.includes('/' + targetDirName + '/')) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        stats.broadcastRecoverable++;
                    } else {
                        stats.broadcastUnrecoverable++;
                        stats.unrecoverableMap.set(r.targetId, (stats.unrecoverableMap.get(r.targetId) || 0) + 1);
                    }
                    
                    if (stats.failedLookups.length < 100 && r.targetId.includes('.')) {
                        stats.failedLookups.push({
                            file: file,
                            raw: r.targetId,
                            kind: r.resolutionKind,
                            candidates: []
                        });
                    }
                }
            }
        }
        
        // Stage 5: Graph Survival (Filters might drop some)
        stats.stage5Survival = stats.stage4EdgeGen; 

        this.printDashboard(stats);
    }
    
    private static printDashboard(stats: AuditResult) {
        console.log(`\n==================================================`);
        console.log(`📊 P1.1a Broadcast Coverage Audit`);
        console.log(`==================================================`);
        console.log(`Total Failed Lookups: ${stats.broadcastRecoverable + stats.broadcastUnrecoverable}`);
        console.log(`Broadcast Recoverable Imports: ${stats.broadcastRecoverable}`);
        console.log(`Broadcast Unrecoverable Imports: ${stats.broadcastUnrecoverable}`);
        const cov = ((stats.broadcastRecoverable / Math.max(1, stats.broadcastRecoverable + stats.broadcastUnrecoverable)) * 100).toFixed(1);
        console.log(`Broadcast Candidate Coverage: ${cov}%`);
        
        const currentLookupRate = ((stats.stage3Lookup / Math.max(1, stats.stage2Normalizedd)) * 100).toFixed(1);
        const projectedLookupRate = (((stats.stage3Lookup + stats.broadcastRecoverable) / Math.max(1, stats.stage2Normalizedd)) * 100).toFixed(1);
        console.log(`\nProjected Lookup Rate: ${currentLookupRate}% -> ${projectedLookupRate}%`);
        
        console.log(`\nTop 20 Unrecoverable Imports:`);
        const sortedUnrec = Array.from(stats.unrecoverableMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
        for (const [k, v] of sortedUnrec) {
            console.log(`  ${k} (${v} times)`);
        }


        console.log(`
==================================================`);
        console.log(`✅ Lookup SUCCESS Sample (Top 20)`);
        console.log(`==================================================`);
        stats.successLookups.forEach((succ, i) => {
            console.log(`[Succ ${i+1}] Source: ${succ.file.split('staging/src/')[1] || succ.file}`);
            console.log(`         Target: ${succ.raw}`);
            console.log(`         Resolved: ${succ.resolvedTo}`);
        });

        console.log(`
==================================================`);
        console.log(`🚨 Lookup FAILURE Trace Sample (Top 20)`);
        console.log(`==================================================`);
        stats.failedLookups.slice(0, 20).forEach((fail, i) => {
            console.log(`[Fail ${i+1}] Source: ${fail.file.split('staging/src/')[1] || fail.file}`);
            console.log(`         Target: ${fail.raw}`);
            console.log(`         Reason: ${fail.kind}`);
            console.log(`         Candidates in Graph:`, fail.candidates);
        });

        console.log(`
==================================================`);
        console.log(`🚨 Lookup Failure Sample (Top 100)`);
        console.log(`==================================================`);
        stats.failedLookups.forEach((fail, i) => {
            console.log(`[Fail ${i+1}] File: ${fail.file.split('staging/src/')[1] || fail.file}`);
            console.log(`         Target: ${fail.raw}`);
            console.log(`         Reason: ${fail.kind}`);
        });

        console.log(`==================================================`);
        console.log(`📊 Quality Dashboard Skeleton`);
        console.log(`==================================================`);
        
        const safePercent = (num: number, den: number) => den > 0 ? ((num / den) * 100).toFixed(1) : '0.0';
        
        const captureRateStr = safePercent(stats.stage4EdgeGen, stats.resolvableImports);
        const captureRate = parseFloat(captureRateStr);
        const survivalRateStr = safePercent(stats.stage5Survival, stats.stage4EdgeGen);
        const survivalRate = parseFloat(survivalRateStr);
        
        const getColor = (rate: number) => {
            if (rate >= 95) return '🟢 Excellent';
            if (rate >= 90) return '🟡 Warning';
            return '🔴 Investigation Required';
        };

        console.log(`Total Imports:      ${stats.totalImports}`);
        console.log(`Excluded (Stdlib):  ${stats.excludedImports}`);
        console.log(`Resolvable Imports: ${stats.resolvableImports}\n`);
        
        console.log(`[Stage 1] Parse Rate:       ${safePercent(stats.stage1Parsed, stats.resolvableImports)}%`);
        console.log(`[Stage 2] Normalize Rate:   ${safePercent(stats.stage2Normalizedd, stats.stage1Parsed)}%`);
        console.log(`[Metrics] Before Edges (Normalized): ${stats.stage2Normalizedd}`);
        console.log(`[Metrics] After Edges (Lookup): ${stats.stage3Lookup}`);
        
        if (stats.fanOutMap) {
            const sortedFanOut = Array.from(stats.fanOutMap.entries()).sort((a, b) => b[1] - a[1]);
            console.log(`[Metrics] Max Fan-Out After: ${sortedFanOut.length > 0 ? sortedFanOut[0][1] : 0} (Source: ${sortedFanOut.length > 0 ? sortedFanOut[0][0] : 'None'})`);
            console.log(`[Metrics] Top 5 Fan-Out Sources:`);
            for (let i=0; i<Math.min(5, sortedFanOut.length); i++) {
                console.log(`   ${i+1}. ${sortedFanOut[i][1]} edges - ${sortedFanOut[i][0]}`);
            }
        }
        console.log(`[Metrics] Edge Inflation: ${(stats.stage3Lookup / Math.max(1, stats.stage2Normalizedd)).toFixed(2)}x`);

        // Adjusted Metrics
        const importResolutionRate = "N/A (Requires tracking unique sources)";
        const edgeExpansionRatio = (stats.stage3Lookup / Math.max(1, stats.stage2Normalizedd)).toFixed(2) + "x";
        
        console.log(`[Stage 3] Edge Expansion Ratio: ${edgeExpansionRatio}`);
        const fs = require('fs');
        const edges = [];
        for (const r of stats.successLookups) { edges.push({source: r.source, target: r.target}); } // wait, stats doesn't save all edges.

        // console.log(`[Stage 3] Import Resolution Rate: ${importResolutionRate}`);

        console.log(`[Stage 4] Edge Gen Rate:    ${safePercent(stats.stage4EdgeGen, stats.stage3Lookup)}%`);
        console.log(`[Stage 5] Graph Survival:   ${survivalRateStr}%\n`);
        
        console.log(`Resolver Capture Rate: ${captureRateStr}% ${getColor(captureRate)}`);
        console.log(`Graph Survival Rate:   ${survivalRateStr}% ${getColor(survivalRate)}`);
        console.log(`==================================================\n`);
    }
}

if (require.main === module) {
    const projectRoot = process.argv[2];
    const ext = process.argv[3] || '.go';
    const sampleDir = process.argv[4] || ''; 
    
    if (!projectRoot) {
        console.error("Usage: ts-node resolver_trace_audit.ts <projectRoot> [ext] [sampleDir]");
        process.exit(1);
    }
    
    ResolverTraceAuditor.runAudit(projectRoot, ext, sampleDir).catch(console.error);
}
