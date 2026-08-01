import * as fs from 'fs';
import * as path from 'path';
import { ProjectState, Node } from '../../../types/schema';
import { AnalysisContext, AnalyzerResult, ArchitectureAnalyzer, BoundaryFinding } from '../types';

export class BoundaryGuardAnalyzer implements ArchitectureAnalyzer {
    public readonly id = 'boundary_guard_analyzer';

    public analyze(state: ProjectState, context: AnalysisContext): AnalyzerResult {
        const findings: BoundaryFinding[] = [];
        if (!context.workspaceRoot) return { findings };

        const configPath = path.join(context.workspaceRoot, 'synapse.config.json');
        if (!fs.existsSync(configPath)) return { findings };

        let config: any = null;
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (e) {
            return { findings };
        }

        if (!config || !config.architecture_guardrail) return { findings };

        const guardrail = config.architecture_guardrail;
        const policies = guardrail.policies || { gravity_rule: { enabled: false }, inter_cluster_rule: { enabled: false }, same_layer_communication: { allow: true } };
        const exceptions = guardrail.exceptions || { bypass_keyword: '@synapse-bypass', allowed_cross_layer_paths: [] };

        const bypassRegex = new RegExp(`//\\s*${exceptions.bypass_keyword}`);
        const nodes = state.nodes || [];
        const edges = state.edges || [];
        const nodeMap = context.nodeMap || new Map<string, Node>(nodes.map(n => [n.id, n]));

        const bypassCache = new Map<string, boolean>();

        edges.forEach(edge => {
            const sourceNode = nodeMap.get(edge.from);
            const targetNode = nodeMap.get(edge.to);

            if (!sourceNode || !targetNode) return;

            let isBypassed = bypassCache.get(sourceNode.id);
            if (isBypassed === undefined) {
                isBypassed = false;
                if (sourceNode.data?.content && bypassRegex.test(sourceNode.data.content)) {
                    isBypassed = true;
                }
                bypassCache.set(sourceNode.id, isBypassed);
            }

            const sourceLayer = sourceNode.data?.layer !== undefined ? sourceNode.data.layer : 1;
            const targetLayer = targetNode.data?.layer !== undefined ? targetNode.data.layer : 1;
            const sourceCluster = sourceNode.data?.cluster_id;
            const targetCluster = targetNode.data?.cluster_id;

            // Step 0: Language Check
            if (guardrail.supported_languages && guardrail.supported_languages.length > 0) {
                const getExt = (file?: string) => file ? path.extname(file).toLowerCase() : '';
                const sourceExt = getExt(sourceNode.data?.file);
                const targetExt = getExt(targetNode.data?.file);

                const sourceSupported = !sourceExt || guardrail.supported_languages.includes(sourceExt);
                const targetSupported = !targetExt || guardrail.supported_languages.includes(targetExt);

                if (!sourceSupported || !targetSupported) {
                    findings.push({
                        type: 'boundary',
                        message: `[Unsupported Language] 연결된 노드 중 일부가 분석 지원 대상 언어가 아닙니다 (${guardrail.supported_languages.join(', ')} 권장).`,
                        sourceId: edge.from,
                        targetId: edge.to,
                        violationType: 'language'
                    });
                }
            }

            // Step 1: Shared Pass (Layer 0) or Global Layer (Layer 99)
            if (sourceLayer === 0 || targetLayer === 0 || sourceLayer === 99 || targetLayer === 99) {
                return;
            }

            // Step 2: Gravity Check
            if (policies.gravity_rule?.enabled) {
                if (targetLayer < sourceLayer) {
                    const isWormhole = exceptions.allowed_cross_layer_paths?.some(
                        (p: any) => edge.type === 'event' || edge.type === p.type
                    );

                    if (!isWormhole) {
                        if (isBypassed) {
                            findings.push({
                                type: 'boundary',
                                message: `[Layer Gravity Bypassed] '${sourceNode.data?.label}' -> '${targetNode.data?.label}' (Layer ${sourceLayer} -> ${targetLayer})`,
                                sourceId: edge.from,
                                targetId: edge.to,
                                violationType: 'gravity'
                            });
                        } else {
                            findings.push({
                                type: 'boundary',
                                message: `[Layer Gravity Violation] '${sourceNode.data?.label}' -> '${targetNode.data?.label}' (Layer ${sourceLayer} -> ${targetLayer}). 역행은 금지됩니다.`,
                                sourceId: edge.from,
                                targetId: edge.to,
                                violationType: 'gravity'
                            });
                        }
                    }
                }
            }

            // Step 3: Boundary Check
            if (policies.inter_cluster_rule?.enabled && sourceCluster && targetCluster && sourceCluster !== targetCluster) {
                if (policies.inter_cluster_rule?.enforce_bridge) {
                    const targetLabel = targetNode.data?.label?.toLowerCase() || '';
                    if (!targetLabel.includes('bridge') && !targetLabel.includes('facade')) {
                        findings.push({
                            type: 'boundary',
                            message: `[Boundary Violation] 타 클러스터의 내부 구현체('${targetNode.data?.label}')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.`,
                            sourceId: edge.from,
                            targetId: edge.to,
                            violationType: 'isolation'
                        });
                    }
                }
            }

            // Step 4: Same Layer Policy
            if (sourceLayer === targetLayer && policies.same_layer_communication?.allow === false) {
                findings.push({
                    type: 'boundary',
                    message: `[Same Layer Policy] '${sourceNode.data?.label}' -> '${targetNode.data?.label}'. 동일 레이어 간 직접 호출이 제한되었습니다.`,
                    sourceId: edge.from,
                    targetId: edge.to,
                    violationType: 'same-layer'
                });
            }
        });

        return { findings };
    }
}
