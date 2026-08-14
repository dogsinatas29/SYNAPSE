import * as path from 'path';
import { 
    GraphSnapshot, Node, 
    ArchitecturalRole, FindingType, RiskLevel, ArchitecturalFinding, SemanticRole
} from '../../types/schema';

export class ArchitectureAuditor {
    
    /**
     * Executes the architecture audit over the graph snapshot and returns findings.
     * Evaluates top impact candidates to deduce structural roles and issue types.
     */
    static audit(snapshot: GraphSnapshot, candidates: any[]): ArchitecturalFinding[] {
        const findings: ArchitecturalFinding[] = [];
        const nodeMap = new Map<string, Node>();
        for (const n of snapshot.nodes) nodeMap.set(n.id, n);

        for (const candidate of candidates) {
            const node = nodeMap.get(candidate.filePath);
            if (!node) continue;

            const finding = this.evaluateNode(node, candidate);
            if (finding) {
                findings.push(finding);
            }
        }

        return findings;
    }

    private static evaluateNode(node: Node, candidateData: any): ArchitecturalFinding {
        const filePath = node.filePath || node.id;
        let role = this.deduceRole(filePath, node.semanticRole, (node as any).isAssemblyPoint);
        let findingType = FindingType.NORMAL;
        let risk = RiskLevel.NONE;
        const reasonCodes: string[] = [];
        
        const boundaryRatio = candidateData.fanOut > 0 ? candidateData.externalEdges / candidateData.fanOut : 0;
        
        // Evidence collection
        const evidence = [
            { type: 'Boundary Crossing', value: candidateData.externalEdges },
            { type: 'Blast Radius (Clusters)', value: candidateData.reachability || 0 },
            { type: 'Fan-Out', value: candidateData.fanOut },
            { type: 'Fan-In', value: candidateData.fanIn }
        ];

        if (role === ArchitecturalRole.ASSEMBLY_POINT) {
            findingType = FindingType.HEALTHY_HUB;
            risk = RiskLevel.NONE;
            
            if (candidateData.fanOut > 100) reasonCodes.push('ASSEMBLY_HIGH_FANOUT');
            if (boundaryRatio > 0.8) reasonCodes.push('ASSEMBLY_HIGH_BOUNDARY_RATIO');
        } else if (role === ArchitecturalRole.CONTRACT_HUB) {
            if (candidateData.fanIn > 200 && candidateData.fanOut > 100) {
                findingType = FindingType.CONTRACT_BLOAT;
                risk = RiskLevel.MEDIUM;
            } else {
                findingType = FindingType.NORMAL;
                risk = RiskLevel.NONE;
            }
        } else {
            // Assess dangerous coupling based on role and metrics
            if (role === ArchitecturalRole.UI_COMPONENT) {
                if (candidateData.externalEdges > 20 || (candidateData.reachability && candidateData.reachability >= 3)) {
                    findingType = FindingType.UI_TO_SERVICE_COUPLING;
                    risk = RiskLevel.HIGH;
                }
            } else if (role === ArchitecturalRole.DOMAIN_SERVICE) {
                if (candidateData.fanOut > 50 && boundaryRatio > 0.6) {
                    findingType = FindingType.GOD_SERVICE;
                    risk = RiskLevel.CRITICAL;
                }
            } else {
                if (candidateData.fanOut > 30 && boundaryRatio > 0.7) {
                    findingType = FindingType.EXCESSIVE_FAN_OUT;
                    risk = RiskLevel.MEDIUM;
                }
            }
        }

        return {
            nodeId: node.id,
            filePath: filePath,
            role,
            findingType,
            risk,
            evidence,
            reasonCodes
        };
    }

    private static deduceRole(filePath: string, semanticRole?: SemanticRole, isAssemblyPoint?: boolean): ArchitecturalRole {
        if (isAssemblyPoint === true) {
            return ArchitecturalRole.ASSEMBLY_POINT;
        }

        const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');

        if (normalizedPath.includes('/test/') || 
            normalizedPath.includes('test/') || 
            normalizedPath.includes('/mock/') || 
            normalizedPath.includes('mock/') || 
            normalizedPath.includes('/fixtures/') || 
            normalizedPath.includes('fixtures/') || 
            normalizedPath.includes('simulation') || 
            normalizedPath.includes('test-resolver') || 
            normalizedPath.includes('test-harness') || 
            normalizedPath.includes('.test.') || 
            normalizedPath.includes('.spec.')) {
            return ArchitecturalRole.TEST_ARTIFACT;
        }

        if (normalizedPath.includes('protocol') || 
            normalizedPath.includes('types') || 
            normalizedPath.includes('contracts') || 
            normalizedPath.includes('interfaces') || 
            normalizedPath.includes('schema') || 
            normalizedPath.includes('dto') || 
            normalizedPath.includes('messages') || 
            normalizedPath.includes('ipc') || 
            normalizedPath.includes('events')) {
            return ArchitecturalRole.CONTRACT_HUB;
        }

        if (normalizedPath.includes('browser') || 
            normalizedPath.includes('widget') || 
            normalizedPath.includes('view') || 
            normalizedPath.includes('ui') ||
            normalizedPath.includes('components')) {
            return ArchitecturalRole.UI_COMPONENT;
        }

        if (normalizedPath.includes('editor') || 
            normalizedPath.includes('workbench') || 
            normalizedPath.includes('platform') || 
            normalizedPath.includes('common') ||
            normalizedPath.includes('core')) {
            return ArchitecturalRole.DOMAIN_SERVICE;
        }

        if (normalizedPath.includes('orchestrator') ||
            normalizedPath.includes('coordinator') ||
            normalizedPath.includes('intent') ||
            normalizedPath.includes('manager') ||
            normalizedPath.includes('engine') ||
            normalizedPath.includes('provider') ||
            normalizedPath.includes('registry')) {
            return ArchitecturalRole.COORDINATOR;
        }

        if (normalizedPath.includes('/ui/') || 
            normalizedPath.includes('/browser/') || 
            normalizedPath.includes('/components/') || 
            normalizedPath.includes('/views/') || 
            normalizedPath.includes('part.ts') || 
            normalizedPath.includes('view.ts')) {
            return ArchitecturalRole.UI_COMPONENT;
        }

        if (normalizedPath.includes('/service') || 
            normalizedPath.includes('/handler') || 
            normalizedPath.includes('/controller') || 
            normalizedPath.includes('/domain')) {
            return ArchitecturalRole.DOMAIN_SERVICE;
        }

        if (normalizedPath.includes('/infra') || 
            normalizedPath.includes('/database') || 
            normalizedPath.includes('/api/') || 
            normalizedPath.includes('client.ts')) {
            return ArchitecturalRole.INFRASTRUCTURE;
        }

        return ArchitecturalRole.UNKNOWN;
    }
}
