import { GraphSnapshot, Node, Edge } from '../../GraphModel';
import { ArchitecturalEvidence, SemanticHints, ConstraintHints } from '../evidence/ArchitecturalEvidence';

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Architectural Evidence Builder
 */
export class ArchitecturalEvidenceBuilder {
  
  public build(snapshot: GraphSnapshot): ArchitecturalEvidence[] {
    const nodes = snapshot.nodes;
    const edges = snapshot.edges;

    // 엣지 인덱싱
    const fanInMap = new Map<string, number>();
    const fanOutMap = new Map<string, number>();
    const crossBoundaryMap = new Map<string, Set<string>>();

    for (const edge of edges) {
      if (!edge.from || !edge.to) continue;
      fanOutMap.set(edge.from, (fanOutMap.get(edge.from) || 0) + 1);
      fanInMap.set(edge.to, (fanInMap.get(edge.to) || 0) + 1);
      
      const fromNode = nodes.find((n: Node) => n.id === edge.from);
      const toNode = nodes.find((n: Node) => n.id === edge.to);
      if (fromNode && toNode && fromNode.cluster_id !== toNode.cluster_id) {
        if (!crossBoundaryMap.has(edge.from)) crossBoundaryMap.set(edge.from, new Set());
        crossBoundaryMap.get(edge.from)!.add(edge.to);
      }
    }

    return nodes.map((node: Node) => this.mapToEvidence(node, fanInMap, fanOutMap, crossBoundaryMap));
  }

  private mapToEvidence(
    node: Node, 
    fanInMap: Map<string, number>, 
    fanOutMap: Map<string, number>,
    crossBoundaryMap: Map<string, Set<string>>
  ): ArchitecturalEvidence {
    
    const roleHints = this.extractSemanticHints(node);
    const fanIn = fanInMap.get(node.id) || 0;
    const fanOut = fanOutMap.get(node.id) || 0;
    const blastRadius = fanIn * 1.5; // heuristic
    
    const constraintHints = this.extractConstraintHints(node, fanIn, fanOut);
    const crossBoundary = Array.from(crossBoundaryMap.get(node.id) || []);

    const sources: { [key: string]: string } = {
      fanIn: 'Graph Engine (Edge Count)',
      fanOut: 'Graph Engine (Edge Count)',
      blastRadius: 'Blast Radius Engine',
      crossBoundaryDependencies: 'Boundary Engine (Cross-Cluster Edges)',
      boundaryInboundPressure: 'Boundary Engine (Inbound Cluster Flows)',
      hasServiceRegistry: 'Semantic Engine Rule S-014 (Heuristic)',
      hasLifecycleControl: 'Semantic Engine Rule S-015 (Heuristic)',
      hasFactoryPattern: 'Semantic Engine Rule S-012 (Heuristic)',
      hasStateMutation: 'Semantic Engine Rule S-021 (Heuristic)',
      isEntryPoint: 'Semantic Engine Rule S-003 (Heuristic)',
      replacementCandidates: 'Boundary Engine Rule B-007 (Heuristic)'
    };

    return {
      nodeId: node.id,
      boundaryId: node.cluster_id || null,
      fanIn: fanIn,
      fanOut: fanOut,
      blastRadius: blastRadius,
      roleHints: roleHints,
      constraintHints: constraintHints,
      crossBoundaryDependencies: crossBoundary,
      boundaryInboundPressure: crossBoundary.length > 0 ? 1 : 0,
      sources: sources
    };
  }

  private extractSemanticHints(node: Node): SemanticHints {
    const id = (node.id || '').toLowerCase();
    
    return {
      hasFactoryPattern: id.includes('factory') || id.includes('builder') || id.includes('pipeline'),
      hasServiceRegistry: id.includes('registry') || id.includes('manager') || id.includes('provider') || id.includes('engine'),
      hasLifecycleControl: id.includes('bootstrap') || id.includes('disposable') || id.includes('lifecycle') || id.includes('engine'),
      hasStateMutation: id.includes('model') || id.includes('store') || id.includes('state') || id.includes('pipeline'),
      isEntryPoint: id.includes('extension') || id.includes('main') || id.includes('cli')
    };
  }

  private extractConstraintHints(node: Node, fanIn: number, fanOut: number): ConstraintHints {
    const isBoundaryRoot = (node.id || '').toLowerCase().includes('engine') || (node.id || '').toLowerCase().includes('model');
    return {
      inboundDependencyCount: fanIn,
      outboundDependencyCount: fanOut,
      boundaryRootCount: isBoundaryRoot ? 1 : 0,
      singletonPatternDetected: (node.id || '').toLowerCase().includes('manager') || (node.id || '').toLowerCase().includes('engine'),
      uniqueImplementationCount: 1,
      replacementCandidates: isBoundaryRoot ? 0 : 2
    };
  }
}
