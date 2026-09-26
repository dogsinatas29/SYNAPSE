import * as fs from 'fs';
import * as path from 'path';
import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';

export class MetricAccessDetector implements PatternDetector {
    
    public detect(context: any, simContext?: any): PatternFinding[] {
        const findings: PatternFinding[] = [];
        
        // Ensure we are operating on the actual Graph Nodes (Clusters)
        if (!context || !context.snapshot || !context.snapshot.clusters) {
            return findings;
        }

        const projectRoot = context.snapshot.projectRoot || process.cwd();
        const clusters = Object.values(context.snapshot.clusters) as any[];
        
        // Filter graph nodes that belong to the reporting layer
        const reportingNodes = clusters.filter(c => c.name && c.name.includes('src/core/reporting'));

        const metricRegexes = [
            { name: 'context.metrics', regex: /context\.metrics(\.[a-zA-Z0-9_]+)?/g },
            { name: '.topImpactFiles', regex: /\.topImpactFiles/g },
            { name: '.fanIn', regex: /\.fanIn/g },
            { name: '.fanOut', regex: /\.fanOut/g },
            { name: '.inboundEdges', regex: /\.inboundEdges/g },
            { name: '.externalEdges', regex: /\.externalEdges/g },
            { name: '.internalEdges', regex: /\.internalEdges/g },
            { name: '.cohesion', regex: /\.cohesion/g },
            { name: '.size', regex: /\.size/g },
            { name: '.authority', regex: /\.authority/g },
            { name: '.coupling', regex: /\.coupling/g },
            { name: '.cycle', regex: /\.cycle/g },
            { name: '.boundary(?!Context)', regex: /\.boundary(?!Context)/g }
        ];

        reportingNodes.forEach(node => {
            const relPath = node.name;
            const absolutePath = path.resolve(projectRoot, relPath);
            
            if (!fs.existsSync(absolutePath)) return;
            
            const content = fs.readFileSync(absolutePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, idx) => {
                metricRegexes.forEach(rule => {
                    const matches = line.match(rule.regex);
                    if (matches) {
                        matches.forEach(m => {
                            const evidenceItem: EvidenceItem = {
                                evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                                type: "CODE_EVIDENCE",
                                sourceId: relPath,
                                description: `Direct Metric Access Violation: found '${m}' at line ${idx + 1}`,
                                filePath: relPath,
                                graphNodeId: relPath
                            };
                            
                            findings.push({
                                findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                                patternId: PatternId.METRIC_ACCESS_VIOLATION,
                                targetScope: 'NODE',
                                targetId: relPath,
                                confidence: 1.0,
                                evidence: [evidenceItem]
                            });
                        });
                    }
                });
            });
        });

        return findings;
    }
}
