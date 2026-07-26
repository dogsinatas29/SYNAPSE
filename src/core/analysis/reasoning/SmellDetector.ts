import { Node, Edge, ProjectState } from '../../../types/schema';
import { ArchitecturalSmell, SccCluster } from '../types';
import * as vscode from 'vscode';

export class SmellDetector {

    public static detect(
        state: ProjectState, 
        sccs: SccCluster[], 
        inDegreeMap: Map<string, number>, 
        outDegreeMap: Map<string, number>, 
        adjacency: Map<string, string[]>,
        reverseAdjacency: Map<string, string[]>
    ): ArchitecturalSmell[] {
        const smells: ArchitecturalSmell[] = [];
        const nodeMap = new Map(state.nodes?.map(n => [n.id, n]));

        // Detect God Objects
        for (const [id, inDeg] of inDegreeMap.entries()) {
            const outDeg = outDegreeMap.get(id) || 0;
            const node = nodeMap.get(id);
            if (!node) continue;

            // Phase C: Candidate Check
            if (inDeg >= 50 && outDeg >= 50) {
                const pathStr = (node.data?.file || node.label || id).toLowerCase();
                const importsStr = node.data?.ast?.imports?.join(' ').toLowerCase() || '';
                
                // IO check (fs, net, ipc, etc.)
                const hasIO = pathStr.includes('fs') || pathStr.includes('net') || pathStr.includes('ipc') ||
                              importsStr.includes('fs') || importsStr.includes('net') || importsStr.includes('http') || importsStr.includes('vscode');

                // Referenced by 3+ subsystems (heuristic based on caller paths)
                const callers = reverseAdjacency.get(id) || [];
                const subsystems = new Set<string>();
                for (const callerId of callers) {
                    const callerNode = nodeMap.get(callerId);
                    if (callerNode) {
                        const callerPath = callerNode.data?.file || callerNode.label || callerId;
                        const dir = callerPath.split('/').slice(0, -1).join('/'); // Get directory as subsystem
                        if (dir) subsystems.add(dir);
                    }
                }

                // Confirmed Check
                if (hasIO && subsystems.size >= 3) {
                    smells.push({
                        type: 'god-object',
                        targetId: id,
                        message: `God Object Detected: ${node.label || id} (In: ${inDeg}, Out: ${outDeg}, IO: true, Subsystems: ${subsystems.size})`,
                        evidence: { inDeg, outDeg, subsystems: subsystems.size, hasIO }
                    });
                } else if (pathStr.includes('locator') || pathStr.includes('registry') || pathStr.includes('container') || pathStr.includes('factory')) {
                    // Service Locator Fallback
                    smells.push({
                        type: 'service-locator',
                        targetId: id,
                        message: `Service Locator Detected: ${node.label || id} (In: ${inDeg}, Out: ${outDeg})`,
                        evidence: { inDeg, outDeg }
                    });
                }
            }
        }

        // Detect UI-Core Coupling in SCCs
        for (const scc of sccs) {
            if (scc.nodeIds.length < 3) continue; // Too small
            
            let hasUI = false;
            let hasCore = false;
            
            for (const id of scc.nodeIds) {
                const node = nodeMap.get(id);
                if (!node) continue;
                const pathStr = (node.data?.file || node.label || id).toLowerCase();
                if (pathStr.includes('/ui/') || pathStr.includes('/view/') || pathStr.includes('widget')) hasUI = true;
                if (pathStr.includes('/core/') || pathStr.includes('/domain/') || pathStr.includes('/services/')) hasCore = true;
            }

            if (hasUI && hasCore) {
                smells.push({
                    type: 'ui-core-coupling',
                    targetId: scc.id,
                    message: `UI-Core Coupling in Massive SCC (${scc.nodeIds.length} nodes)`,
                    evidence: { size: scc.nodeIds.length, hubId: scc.hubId }
                });
            }
        }

        // Detect Layer Inversion (Core -> UI)
        for (const edge of state.edges || []) {
            const srcNode = nodeMap.get(edge.from);
            const tgtNode = nodeMap.get(edge.to);
            if (!srcNode || !tgtNode) continue;

            const srcPath = (srcNode.data?.file || srcNode.label || srcNode.id).toLowerCase();
            const tgtPath = (tgtNode.data?.file || tgtNode.label || tgtNode.id).toLowerCase();

            if (srcPath.includes('/core/') && tgtPath.includes('/ui/')) {
                smells.push({
                    type: 'layer-inversion',
                    targetId: srcNode.id,
                    message: `Layer Inversion: Core module (${srcNode.label || srcNode.id}) depends on UI module (${tgtNode.label || tgtNode.id})`,
                    evidence: { sourceId: edge.from, targetId: edge.to }
                });
            }
        }

        return smells;
    }
}
