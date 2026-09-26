import * as fs from 'fs';
import * as path from 'path';
import { PatternDetector } from '../PatternDetector';
import { PatternFinding } from '../PatternFinding';
import { PatternId } from '../PatternId';
import { EvidenceItem } from '../EvidenceItem';

export class VocabularyViolationDetector implements PatternDetector {
    
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

        // Terms NOT in PatternRegistry but currently used inappropriately
        const vocabRegex = /(Hub|Important Node|Control Hub|Key Component|Critical)/gi;

        reportingNodes.forEach(node => {
            const relPath = node.name;
            const absolutePath = path.resolve(projectRoot, relPath);
            
            if (!fs.existsSync(absolutePath)) return;
            
            const content = fs.readFileSync(absolutePath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, idx) => {
                const matches = line.match(vocabRegex);
                if (matches) {
                    matches.forEach(m => {
                        const evidenceItem: EvidenceItem = {
                            evidenceId: `E-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            type: "CODE_EVIDENCE",
                            sourceId: relPath,
                            description: `Vocabulary Purity Violation: found '${m}' at line ${idx + 1}`,
                            filePath: relPath,
                            graphNodeId: relPath
                        };
                        
                        findings.push({
                            findingId: `F-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                            patternId: PatternId.VOCABULARY_VIOLATION,
                            targetScope: 'NODE',
                            targetId: relPath,
                            confidence: 1.0,
                            evidence: [evidenceItem]
                        });
                    });
                }
            });
        });

        return findings;
    }
}
