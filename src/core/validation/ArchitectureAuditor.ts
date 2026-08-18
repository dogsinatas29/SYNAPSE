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

        const normalizedPath = filePath.replace(/\\/g, '/');

        const matches = (keywords: string[]) => {
            return keywords.some(keyword => {
                // If the keyword contains a slash or dot, use plain includes
                if (keyword.includes('/') || keyword.includes('.')) {
                    return normalizedPath.toLowerCase().includes(keyword.toLowerCase());
                }
                // Otherwise use word boundaries to avoid partial matches like 'ui' in 'builder'
                const regex = new RegExp(`(^|/|_|-)${keyword}($|/|_|-)`, 'i');
                return regex.test(normalizedPath);
            });
        };

        if (matches(['/test/', 'test/', '/mock/', 'mock/', '/fixtures/', 'fixtures/', 'simulation', 'test-resolver', 'test-harness', '.test.', '.spec.'])) {
            return ArchitecturalRole.TEST_ARTIFACT;
        }

        if (matches(['protocol', 'types', 'contracts', 'interfaces', 'schema', 'dto', 'messages', 'ipc', 'events'])) {
            return ArchitecturalRole.CONTRACT_HUB;
        }

        if (matches(['browser', 'widget', 'view', 'ui', 'components', 'activity', 'fragment', 'adapter', 'viewholder'])) {
            return ArchitecturalRole.UI_COMPONENT;
        }

        if (matches(['editor', 'workbench', 'platform', 'common', 'core'])) {
            return ArchitecturalRole.DOMAIN_SERVICE;
        }

        if (matches(['orchestrator', 'coordinator', 'intent', 'manager', 'engine', 'provider', 'registry'])) {
            return ArchitecturalRole.COORDINATOR;
        }

        if (matches(['/ui/', '/browser/', '/components/', '/views/', 'part.ts', 'view.ts'])) {
            return ArchitecturalRole.UI_COMPONENT;
        }

        if (matches(['/service', '/handler', '/controller', '/domain'])) {
            return ArchitecturalRole.DOMAIN_SERVICE;
        }

        if (matches(['/infra', '/database', '/api/', 'client.ts'])) {
            return ArchitecturalRole.INFRASTRUCTURE;
        }

        return ArchitecturalRole.UNKNOWN;
    }
}
