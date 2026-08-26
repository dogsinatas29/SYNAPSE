import { graphModel } from '../core/GraphModel';
import { ArchitecturalEvidenceBuilder } from '../core/reasoning/builder/ArchitecturalEvidenceBuilder';
import { AuthorityAnalyzer } from '../core/reasoning/analyzers/AuthorityAnalyzer';
import { ArchitecturalReasoningPipeline } from '../core/reasoning/pipeline/ArchitecturalReasoningPipeline';
import * as crypto from 'crypto';

/**
 * v0.3.34.32 Phase 4.5: Pipeline Integrity Gate (Gate F)
 * 
 * 파이프라인 조립 과정에서 시그널 누락, 오염, 임의 합성이 발생하지 않는지 검증합니다.
 */
export class PipelineIntegrityAudit {
    private evidenceBuilder = new ArchitecturalEvidenceBuilder();
    private rawAuthorityAnalyzer = new AuthorityAnalyzer();
    private pipeline = new ArchitecturalReasoningPipeline();

    public runAudit(): string {
        const snapshot = graphModel.createSnapshot();
        const evidences = this.evidenceBuilder.build(snapshot);

        let report = '# Phase 4.5: Pipeline Integrity Report (Gate F)\n\n';
        report += '> [!NOTE]\n> 본 리포트는 `ArchitecturalReasoningPipeline`이 어떠한 화학적 결합(합성 추론) 없이 100% 투명한 라우터 역할을 수행하는지 검증합니다.\n\n';

        // 1. Signal Count Check (Before vs After)
        const rawAuthorityFindings = this.rawAuthorityAnalyzer.analyze(evidences);
        let beforeAuthoritySignalCount = 0;
        rawAuthorityFindings.forEach((f: any) => {
            beforeAuthoritySignalCount += f.signals ? f.signals.length : 0;
        });

        const model = this.pipeline.run(evidences);
        let afterAuthoritySignalCount = 0;
        Object.values(model.nodes).forEach((node: any) => {
            if (node.authority && node.authority.signals) {
                afterAuthoritySignalCount += node.authority.signals.length;
            }
        });

        report += '### Gate F.1: Signal Count Integrity\n';
        report += `- **Before Pipeline (Raw Analyzer):** ${beforeAuthoritySignalCount} Authority Signals\n`;
        report += `- **After Pipeline (Reasoning Model):** ${afterAuthoritySignalCount} Authority Signals\n`;
        report += (beforeAuthoritySignalCount === afterAuthoritySignalCount) 
            ? `> **Result: PASSED** (No signals lost or generated during assembly)\n\n`
            : `> **Result: FAILED** (Mismatch detected)\n\n`;


        // 2. Evidence Reference Preservation
        report += '### Gate F.2: Evidence Reference Preservation\n';
        let referenceIntact = true;
        let sampleReference = '';
        
        for (const node of Object.values(model.nodes)) {
            const n = node as any;
            if (n.authority && n.authority.signals && n.authority.signals.length > 0) {
                if (!n.authority.evidenceReferences || n.authority.evidenceReferences.length === 0) {
                    referenceIntact = false;
                } else if (!sampleReference) {
                    sampleReference = n.authority.evidenceReferences[0];
                }
            }
        }
        
        report += `- **References Preserved:** ${referenceIntact}\n`;
        report += `- **Sample Reference:** \`${sampleReference || 'N/A'}\`\n`;
        report += referenceIntact 
            ? `> **Result: PASSED** (Traceability maintained in model)\n\n`
            : `> **Result: FAILED** (References stripped during assembly)\n\n`;


        // 3. Cross Contamination Check
        report += '### Gate F.3: Cross Contamination Check\n';
        let contaminationDetected = false;
        
        for (const node of Object.values(model.nodes)) {
            const n = node as any;
            if (n.authority && n.authority.signals) {
                // Check if typical ownership/dominance signals leaked into authority
                const hasOwnershipSignal = n.authority.signals.some((s: any) => {
                    const text = typeof s === 'string' ? s : (s.type || '');
                    return text.includes('Boundary') || text.includes('Cross') || text.includes('Responsibility');
                });
                
                if (hasOwnershipSignal) {
                    contaminationDetected = true;
                }
            }
        }

        report += `- **Contamination Detected:** ${contaminationDetected}\n`;
        report += !contaminationDetected 
            ? `> **Result: PASSED** (Clean signal boundaries)\n\n`
            : `> **Result: FAILED** (Signals leaked across domains)\n\n`;


        // 4. Determinism Check (3 runs)
        report += '### Gate F.4: Determinism Check\n';
        const hashes: string[] = [];
        
        for (let i = 0; i < 3; i++) {
            const runModel = this.pipeline.run(evidences);
            // Delete timestamp for stable hashing
            (runModel as any).timestamp = 0; 
            const hash = crypto.createHash('sha256').update(JSON.stringify(runModel)).digest('hex');
            hashes.push(hash.substring(0, 12));
        }

        const allMatch = hashes.every(h => h === hashes[0]);
        report += `- **Run 1 Hash:** \`${hashes[0]}\`\n`;
        report += `- **Run 2 Hash:** \`${hashes[1]}\`\n`;
        report += `- **Run 3 Hash:** \`${hashes[2]}\`\n`;
        report += allMatch 
            ? `> **Result: PASSED** (Perfect determinism across 3 runs)\n\n`
            : `> **Result: FAILED** (Outputs are not deterministic)\n\n`;

        return report;
    }
}

if (require.main === module) {
    // 더미 노드 주입
    graphModel.addNode({ id: 'src/core/canvas-engine/CanvasEngine.ts', data: {} } as any);
    graphModel.addNode({ id: 'src/core/GraphModel.ts', data: {} } as any);
    graphModel.addNode({ id: 'src/core/DataPipeline.ts', data: {} } as any);
    graphModel.addNode({ id: 'src/core/RuleEngine.ts', data: {} } as any);
    graphModel.addNode({ id: 'src/extension.ts', data: {} } as any);
    graphModel.addNode({ id: 'src/cli.ts', data: {} } as any);
    graphModel.addNode({ id: 'src/core/WebviewInterceptor.ts', data: {} } as any);
    
    // 더미 엣지 주입 
    graphModel.addEdge({ from: 'src/extension.ts', to: 'src/core/GraphModel.ts' } as any);
    graphModel.addEdge({ from: 'src/extension.ts', to: 'src/core/canvas-engine/CanvasEngine.ts' } as any);
    graphModel.addEdge({ from: 'src/cli.ts', to: 'src/core/GraphModel.ts' } as any);
    graphModel.addEdge({ from: 'src/core/RuleEngine.ts', to: 'src/core/GraphModel.ts' } as any);
    graphModel.addEdge({ from: 'src/core/DataPipeline.ts', to: 'src/core/GraphModel.ts' } as any);
    graphModel.addEdge({ from: 'src/core/canvas-engine/CanvasEngine.ts', to: 'src/core/RuleEngine.ts' } as any);

    const auditor = new PipelineIntegrityAudit();
    console.log(auditor.runAudit());
}
