import { graphModel, Node, Edge } from '../core/GraphModel';
import { ArchitecturalEvidenceBuilder } from '../core/reasoning/builder/ArchitecturalEvidenceBuilder';
import { ArchitecturalEvidence } from '../core/reasoning/evidence/ArchitecturalEvidence';

/**
 * v0.3.34.32 Phase 1.5 & 1.6: Evidence Audit & Coverage Report
 */
export class ArchitecturalEvidenceAuditBuilder {
  private evidenceBuilder = new ArchitecturalEvidenceBuilder();

  public async runAudit(): Promise<string> {
    const snapshot = graphModel.createSnapshot();
    const evidences = this.evidenceBuilder.build(snapshot);

    let report = '# Phase 1.5 & 1.6: Evidence Coverage Report v2 (Combined)\n\n';

    // 1. Evidence Richness (Deep Dive for Core Nodes)
    report += '## 1. Core Nodes Deep Dive (Evidence Richness)\n\n';
    const coreNodes = ['GraphModel', 'CanvasEngine', 'RuleEngine', 'DataPipeline'];
    const coreEvidences = evidences.filter(e => coreNodes.some(k => e.nodeId.includes(k)));
    
    for (const e of coreEvidences) {
      report += `### Node: \`${e.nodeId}\`\n\n`;

      let roleHintCount = 0;
      let populatedRoleHints = '';
      for (const [hint, value] of Object.entries(e.roleHints)) {
        if (value) {
          roleHintCount++;
          populatedRoleHints += `- ${hint}\n`;
        }
      }

      let constraintCount = 0;
      let populatedConstraints = '';
      for (const [key, value] of Object.entries(e.constraintHints)) {
        if (value !== 0 && value !== false && value !== null) {
          constraintCount++;
          populatedConstraints += `- ${key}: ${value}\n`;
        }
      }

      const totalEvidence = 4 + roleHintCount + constraintCount; 

      report += `#### Evidence Richness\n`;
      report += `**Evidence Fields Populated**: ${totalEvidence}\n`;
      report += `**Role Hint Count**: ${roleHintCount}\n`;
      report += `**Constraint Hint Count**: ${constraintCount}\n\n`;

      report += `#### Traceability\n\n`;
      report += `**fanIn**: ${e.fanIn}  \n> Source: ${e.sources['fanIn'] || 'GraphEngine'}\n\n`;
      report += `**fanOut**: ${e.fanOut}  \n> Source: ${e.sources['fanOut'] || 'GraphEngine'}\n\n`;

      if (populatedRoleHints) {
        report += `**Active Role Hints**:\n${populatedRoleHints}\n> Source: Semantic Engine (Heuristic)\n\n`;
      }
      if (populatedConstraints) {
        report += `**Active Constraint Hints**:\n${populatedConstraints}\n> Source: Boundary Engine (Heuristic)\n\n`;
      }
      report += `---\n\n`;
    }

    // 2. Category Coverage
    report += '## 2. Evidence Coverage by Category\n\n';
    const targetCategories: Record<string, string[]> = {
      'Entrypoint / Initialization': ['extension', 'cli', 'BootstrapEngine'],
      'Authority Candidates': ['instantiation', 'GraphModel', 'RuleEngine'],
      'Boundary Roots': ['CanvasEngine', 'SemanticEngine', 'DataPipeline'],
      'State Holders / Policies': ['Disposable', 'ThemeManager'],
      'Adapters / Executors': ['WebviewInterceptor', 'FileScanner']
    };

    for (const [category, keywords] of Object.entries(targetCategories)) {
      report += `### ${category}\n\n`;
      report += '| Node ID | Fan-In | Fan-Out | Semantic Hints (True) | Constraint Hints (In/Out/Root) |\n';
      report += '|---|---|---|---|---|\n';

      const targets = evidences.filter(e => keywords.some(k => e.nodeId.includes(k)));
      
      for (const e of targets) {
        const activeHints = Object.entries(e.roleHints)
          .filter(([_, value]) => value === true)
          .map(([key]) => key.replace('has', ''))
          .join(', ') || '-';
          
        const constraintStr = `${e.constraintHints.inboundDependencyCount} / ${e.constraintHints.outboundDependencyCount} / ${e.constraintHints.boundaryRootCount}`;

        report += `| ${e.nodeId} | ${e.fanIn} | ${e.fanOut} | ${activeHints} | ${constraintStr} |\n`;
      }
      report += '\n';
    }

    return report;
  }
}

// 스크립트로 직접 실행될 때
if (require.main === module) {
  // 더미 노드 강제 주입
  graphModel.addNode({ id: 'src/core/canvas-engine/CanvasEngine.ts', data: {} } as any);
  graphModel.addNode({ id: 'src/core/GraphModel.ts', data: {} } as any);
  graphModel.addNode({ id: 'src/core/DataPipeline.ts', data: {} } as any);
  graphModel.addNode({ id: 'src/core/RuleEngine.ts', data: {} } as any);
  graphModel.addNode({ id: 'src/extension.ts', data: {} } as any);
  graphModel.addNode({ id: 'src/cli.ts', data: {} } as any);
  graphModel.addNode({ id: 'src/core/WebviewInterceptor.ts', data: {} } as any);
  
  // 더미 엣지 주입 (fanOut, fanIn 모의)
  graphModel.addEdge({ from: 'src/extension.ts', to: 'src/core/GraphModel.ts' } as any);
  graphModel.addEdge({ from: 'src/extension.ts', to: 'src/core/canvas-engine/CanvasEngine.ts' } as any);
  graphModel.addEdge({ from: 'src/cli.ts', to: 'src/core/GraphModel.ts' } as any);
  graphModel.addEdge({ from: 'src/core/RuleEngine.ts', to: 'src/core/GraphModel.ts' } as any);
  graphModel.addEdge({ from: 'src/core/DataPipeline.ts', to: 'src/core/GraphModel.ts' } as any);
  graphModel.addEdge({ from: 'src/core/canvas-engine/CanvasEngine.ts', to: 'src/core/RuleEngine.ts' } as any);
  
  const auditor = new ArchitecturalEvidenceAuditBuilder();
  auditor.runAudit().then(report => {
    console.log(report);
  });
}
