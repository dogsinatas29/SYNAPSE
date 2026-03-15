import * as fs from 'fs';
import * as path from 'path';
import { ProjectState, Node, Edge } from '../types/schema';

export interface AnalysisIssue {
    type: 'circular' | 'dead-end' | 'bottleneck' | 'isolated' | 'warning' | 'schema-violation' | 'architecture-violation';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    nodeIds: string[];
}

export interface ArchitectureConfig {
    architecture_guardrail?: {
        layers: { id: string; index: number; description: string }[];
        policies: {
            gravity_rule: { enabled: boolean; mode: string };
            inter_cluster_rule: { enabled: boolean; enforce_bridge: boolean };
            same_layer_communication: { allow: boolean };
        };
        exceptions: {
            bypass_keyword: string;
            allowed_cross_layer_paths: { from: string; to: string; type: string }[];
        };
        supported_languages?: string[];
    };
}

export class LogicAnalyzer {
    private config: ArchitectureConfig | null = null;
    private projectRoot: string = '';

    /**
     * 프로젝트 상태를 분석하여 아키텍처 결함 및 병목 지점을 찾음
     */
    public analyze(state: ProjectState, workspaceRoot?: string): AnalysisIssue[] {
        if (workspaceRoot) {
            this.projectRoot = workspaceRoot;
            this.loadConfig();
        }
        const issues: AnalysisIssue[] = [];
        const nodes = state.nodes;
        const edges = state.edges;

        // 1. 고립된 노드 탐색 (Isolated Nodes)
        this.detectIsolatedNodes(nodes, edges, issues);

        // 2. 순환 의존성 탐색 (Circular Dependencies)
        this.detectCircularDependencies(nodes, edges, issues);

        // 3. 막다른 길 탐색 (Dead-ends)
        this.detectDeadEnds(nodes, edges, issues);

        // 4. 병목 지점 탐색 (Bottlenecks)
        this.detectBottlenecks(nodes, edges, issues);

        // 5. [v0.2.18.1] Schema 무결성 검증 (Schema Validation)
        this.detectSchemaViolations(nodes, edges, issues);

        // 6. [v0.2.18.2] Architecture Guardrail 검증 (The Iron Guard)
        this.detectArchitectureViolations(nodes, edges, issues);

        // 7. [v0.2.21] Deterministic C++ Rule 검증 (The Static Pillar)
        this.detectDeterministicViolations(nodes, edges, issues);

        // 8. [v0.2.20] Sovereign Principles 검증 (Mandatory Principles)
        if (state.system_context?.principles) {
            const principleIssues = this.validatePrinciples(state, state.system_context.principles);
            issues.push(...principleIssues);
        }

        return issues;
    }

    private loadConfig() {
        if (this.config) return; // 이미 로드됨
        try {
            const configPath = path.join(this.projectRoot, 'synapse.config.json');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                this.config = JSON.parse(content);
            }
        } catch (e) {
            console.error('Failed to load synapse.config.json', e);
        }
    }

    private detectIsolatedNodes(nodes: Node[], edges: Edge[], issues: AnalysisIssue[]) {
        nodes.forEach(node => {
            const hasEdge = edges.some(e => e.from === node.id || e.to === node.id);
            if (!hasEdge && node.type !== 'cluster' && node.type !== 'documentation') {
                issues.push({
                    type: 'isolated',
                    severity: 'medium',
                    message: `고립된 노드: '${node.data.label}'이(가) 어떤 흐름과도 연결되어 있지 않습니다.`,
                    nodeIds: [node.id]
                });
            }
        });
    }

    private detectSchemaViolations(nodes: Node[], edges: Edge[], issues: AnalysisIssue[]) {
        const validNodeTypes = new Set(['component', 'entry', 'database', 'external', 'documentation', 'test', 'config', 'source', 'history', 'cluster', 'Data', 'Processor', 'Service', 'Gate', 'Trigger']);

        nodes.forEach(node => {
            if (!validNodeTypes.has(node.type)) {
                issues.push({
                    type: 'schema-violation',
                    severity: 'high',
                    message: `스키마 위반: '${node.data.label}' 노드가 알 수 없는 타입('${node.type}')을 가지고 있습니다. LLM 환각(Hallucination)일 수 있습니다.`,
                    nodeIds: [node.id]
                });
            }
        });

        edges.forEach(edge => {
            if (!edge.from || !edge.to) {
                issues.push({
                    type: 'schema-violation',
                    severity: 'critical',
                    message: `스키마 위반: 식별자 '${edge.id}'를 가진 엣지의 연결점(from/to)이 유실되었습니다.`,
                    nodeIds: []
                });
            }
        });
    }

    private detectCircularDependencies(nodes: Node[], edges: Edge[], issues: AnalysisIssue[]) {
        const adj = new Map<string, string[]>();
        nodes.forEach(n => adj.set(n.id, []));
        edges.forEach(e => adj.get(e.from)?.push(e.to));

        const visited = new Set<string>();
        const recStack = new Set<string>();
        const cycles: string[][] = [];

        const findCycles = (u: string, path: string[]) => {
            visited.add(u);
            recStack.add(u);
            path.push(u);

            const neighbors = adj.get(u) || [];
            for (const v of neighbors) {
                if (!visited.has(v)) {
                    findCycles(v, [...path]);
                } else if (recStack.has(v)) {
                    const cycleStartIdx = path.indexOf(v);
                    if (cycleStartIdx !== -1) {
                        cycles.push(path.slice(cycleStartIdx));
                    }
                }
            }

            recStack.delete(u);
        };

        nodes.forEach(n => {
            if (!visited.has(n.id)) findCycles(n.id, []);
        });

        cycles.forEach(cycle => {
            const labels = cycle.map(id => nodes.find(n => n.id === id)?.data.label || id);
            issues.push({
                type: 'circular',
                severity: 'critical',
                message: `순환 의존성 발견: ${labels.join(' -> ')} -> ${labels[0]}`,
                nodeIds: cycle
            });
        });
    }

    private detectDeadEnds(nodes: Node[], edges: Edge[], issues: AnalysisIssue[]) {
        nodes.forEach(node => {
            if (node.type === 'cluster' || node.type === 'external' || node.type === 'documentation') return;

            const outgoing = edges.filter(e => e.from === node.id);
            const incoming = edges.filter(e => e.to === node.id);

            if (incoming.length > 0 && outgoing.length === 0) {
                // 진입은 있는데 나가는 흐름이 없는 경우 (Terminal point가 아닌데도)
                // 보통 source나 config는 그럴 수 있음. reasoning/action 레이어에서 체크
                if (node.data.layer && node.data.layer > 0) {
                    issues.push({
                        type: 'dead-end',
                        severity: 'high',
                        message: `로직 단절(Dead-end): '${node.data.label}'에서 더 이상 진행되는 흐름이 없습니다.`,
                        nodeIds: [node.id]
                    });
                }
            }
        });
    }

    private detectBottlenecks(nodes: Node[], edges: Edge[], issues: AnalysisIssue[]) {
        nodes.forEach(node => {
            const incoming = edges.filter(e => e.to === node.id);
            if (incoming.length >= 5) {
                issues.push({
                    type: 'bottleneck',
                    severity: 'medium',
                    message: `병목 지점 의심: '${node.data.label}'에 ${incoming.length}개의 의존성이 집중되어 있습니다.`,
                    nodeIds: [node.id]
                });
            }
        });
    }

    /**
     * 분석 결과를 바탕으로 리포트 생성
     */
    public generateReport(issues: AnalysisIssue[], projectRoot: string, nodes: Node[]): string {
        const reportPath = path.join(projectRoot, 'LOGIC_REPORT.md');
        let content = `# 🛡️ [VISUAL IMPACT] LOGIC_REPORT.md - 아키텍처 로직 리포트\n\n`;
        content += `생성 일시: ${new Date().toLocaleString()}\n`;
        content += `Test Status: ${issues.length === 0 ? '✅ Pass' : '❌ Fail (Visual Indicator: Red-out)'}\n\n`;

        if (issues.length === 0) {
            content += `✅ 분석 결과, 발견된 아키텍처 결함이 없으며 시스템 형상이 매우 견고합니다.\n`;
        } else {
            const necrosis = issues.filter(i => i.type === 'circular' || i.type === 'schema-violation');
            
            content += `## 💀 [Fail Node] Necrosis Nodes\n`;
            if (necrosis.length > 0) {
                necrosis.forEach(issue => {
                    const links = issue.nodeIds.map(id => {
                        const node = nodes.find(n => n.id === id);
                        return `[\`${node?.data?.label || id}\`](command:synapse.focusNode?${encodeURIComponent(JSON.stringify(id))})`;
                    });
                    content += `- 🔴 **${issue.message}**: ${links.join(', ')}\n`;
                });
            } else {
                content += `- 발견된 괴사 노드가 없습니다.\n`;
            }

            content += `\n## ⚡ [Broken Edge] Fractured Edges\n`;
            const fractures = issues.filter(i => i.type === 'circular' || i.type === 'schema-violation');
            if (fractures.length > 0) {
                content += `- 구조적 결함으로 인해 다수의 엣지가 굴절 및 단절되었습니다. (시각적 파손 적용됨)\n`;
            } else {
                content += `- 논리적 흐름이 안전하게 연결되어 있습니다.\n`;
            }

            content += `\n## 🌡️ [Pressure Log] Inference Pressure\n`;
            const pressure = Math.min(100, (issues.length * 15));
            content += `- **현재 시스템 압력**: \`${pressure}%\` ${pressure >= 70 ? '🔥 (Critical Red-out)' : '🟢 (Stable)'}\n`;
            content += `- 인퍼런스 압력이 최고조였던 지점에서 시각적 경고가 발생했습니다.\n`;

            content += `\n## 🚀 [Turbo Mode Feedback]\n`;
            content += `- 터보 모드(고밀도 추론) 분석을 통해 잠재적인 논리 병목 지점을 ${issues.length > 0 ? '확인' : '최적화'}했습니다.\n`;
        }

        content += `\n---\n*이 리포트는 SYNAPSE Logic Analyzer v2.0(Visual Impact Engine)에 의해 자동 생성되었습니다.*`;

        fs.writeFileSync(reportPath, content, 'utf8');
        return reportPath;
    }

    private detectArchitectureViolations(nodes: Node[], edges: Edge[], issues: AnalysisIssue[]) {
        if (!this.config || !this.config.architecture_guardrail) return;

        const guardrail = this.config.architecture_guardrail;
        const policies = guardrail.policies;
        const exceptions = guardrail.exceptions;

        const bypassRegex = new RegExp(`//\\s*${exceptions.bypass_keyword}`);

        edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.from);
            const targetNode = nodes.find(n => n.id === edge.to);

            if (!sourceNode || !targetNode) return;

            // AST 기반 우회 주석 확인 (간이 구현: 노드의 file 스니펫 확인 등)
            let isBypassed = false;
            // 만약 node.data.content 등에 해당 코드가 있다면 체크 가능. 현재는 확장성을 위해 열어둠.
            if (sourceNode.data.content && bypassRegex.test(sourceNode.data.content)) {
                isBypassed = true;
            }

            const sourceLayer = sourceNode.data.layer !== undefined ? sourceNode.data.layer : 1; // Default Layer 1
            const targetLayer = targetNode.data.layer !== undefined ? targetNode.data.layer : 1;

            const sourceCluster = sourceNode.data.cluster_id;
            const targetCluster = targetNode.data.cluster_id;

            // Step 0: Supported Language Check
            if (guardrail.supported_languages && guardrail.supported_languages.length > 0) {
                const getExt = (file?: string) => file ? path.extname(file).toLowerCase() : '';
                const sourceExt = getExt(sourceNode.data.file);
                const targetExt = getExt(targetNode.data.file);

                const sourceSupported = !sourceExt || guardrail.supported_languages.includes(sourceExt);
                const targetSupported = !targetExt || guardrail.supported_languages.includes(targetExt);

                if (!sourceSupported || !targetSupported) {
                    issues.push({
                        type: 'architecture-violation',
                        severity: 'medium', // Use 'medium' instead of 'warning' because 'warning' is not in the severity union type
                        message: `[Unsupported Language] 연결된 노드 중 일부가 분석 지원 대상 언어가 아닙니다 (${guardrail.supported_languages.join(', ')} 권장).`,
                        nodeIds: [edge.from, edge.to]
                    });
                }
            }

            // Step 1: Shared Pass (Layer 0) or Global Layer (Layer 99)
            if (sourceLayer === 0 || targetLayer === 0 || sourceLayer === 99 || targetLayer === 99) {
                return; // VALID
            }

            // Step 2: Gravity Check (The Core)
            if (policies.gravity_rule.enabled) {
                if (targetLayer < sourceLayer) {
                    // Exception Wormhole Check
                    const isWormhole = exceptions.allowed_cross_layer_paths.some(
                        path => {
                            // Layer 이름 변환 매핑이 필요하지만 index 기반으로 간이 처리
                            // 실제 구현에선 Layer ID <-> Index 매핑 사용 권장
                            // 여기서는 일단 단순 역행 자체가 웜홀에 있는지 확인하는 로직 (타입이 event 인지 등)
                            return edge.type === 'event' || edge.type === path.type;
                        }
                    );

                    if (!isWormhole) {
                        if (isBypassed) {
                            issues.push({
                                type: 'architecture-violation',
                                severity: 'medium',
                                message: `[Layer Gravity Bypassed] '${sourceNode.data.label}' -> '${targetNode.data.label}' (Layer ${sourceLayer} -> ${targetLayer})`,
                                nodeIds: [edge.from, edge.to]
                            });
                        } else {
                            issues.push({
                                type: 'architecture-violation',
                                severity: 'critical',
                                message: `[Layer Gravity Violation] '${sourceNode.data.label}' -> '${targetNode.data.label}' (Layer ${sourceLayer} -> ${targetLayer}). 역행은 금지됩니다.`,
                                nodeIds: [edge.from, edge.to]
                            });
                        }
                    }
                }
            }

            // Step 3: Boundary Check (Cluster-to-Cluster)
            if (policies.inter_cluster_rule.enabled && sourceCluster && targetCluster && sourceCluster !== targetCluster) {
                if (policies.inter_cluster_rule.enforce_bridge) {
                    // target 노드가 Bridge 타입이 아니면 경고
                    if (!targetNode.data.label.toLowerCase().includes('bridge') && !targetNode.data.label.toLowerCase().includes('facade')) {
                        issues.push({
                            type: 'architecture-violation',
                            severity: 'medium',
                            message: `[Boundary Violation] 타 클러스터의 내부 구현체('${targetNode.data.label}')에 직접 연결되었습니다. Bridge/Facade를 사용하세요.`,
                            nodeIds: [edge.from, edge.to]
                        });
                    }
                }
            }

            // Step 4: Same Layer Policy
            if (sourceLayer === targetLayer && !policies.same_layer_communication.allow) {
                issues.push({
                    type: 'architecture-violation',
                    severity: 'medium',
                    message: `[Same Layer Policy] '${sourceNode.data.label}' -> '${targetNode.data.label}'. 동일 레이어 간 직접 호출이 제한되었습니다.`,
                    nodeIds: [edge.from, edge.to]
                });
            }
        });
    }

    private detectDeterministicViolations(nodes: Node[], edges: Edge[], issues: AnalysisIssue[]) {
        const rules = [
            { keyword: 'virtual', type: 'virtual', message: 'Deterministic Violation: virtual 키워드 사용 금지 (VTable 오버헤드)' },
            { keyword: 'malloc', type: 'allocation', message: 'Deterministic Violation: dynamic allocation (malloc) 금지' },
            { keyword: 'new ', type: 'allocation', message: 'Deterministic Violation: dynamic allocation (new) 금지' },
            { keyword: 'throw', type: 'exception', message: 'Deterministic Violation: exception handling (throw) 금지' },
            { keyword: 'try', type: 'exception', message: 'Deterministic Violation: exception handling (try) 금지' }
        ];

        nodes.forEach(node => {
            const content = node.data.content || '';
            if (!content) return;

            rules.forEach(rule => {
                if (content.includes(rule.keyword)) {
                    issues.push({
                        type: 'architecture-violation',
                        severity: 'critical',
                        message: `[💀 Tombstone] ${rule.message}`,
                        nodeIds: [node.id]
                    });
                }
            });

            // Recursion check (Simple heuristic: function calling itself by name)
            const nodeName = node.data.label;
            if (nodeName && content.includes(`${nodeName}(`)) {
                // Check if it's a definition or a call
                const occurrences = content.split(`${nodeName}(`).length - 1;
                if (occurrences > 1) { // 1 for definition, > 1 implies potential recursion if it's within the body
                    issues.push({
                        type: 'architecture-violation',
                        severity: 'critical',
                        message: `[💀 Tombstone] Deterministic Violation: Recursion detected in '${nodeName}'`,
                        nodeIds: [node.id]
                    });
                }
            }
        });
    }

    /**
     * [v0.2.20] 주입된 원칙(Sovereign Principles)을 기준으로 설계 분석
     */
    public validatePrinciples(state: ProjectState, principles: string[]): AnalysisIssue[] {
        const issues: AnalysisIssue[] = [];
        const nodes = state.nodes;
        const clusters = state.clusters;

        principles.forEach(principle => {
            const pLower = principle.toLowerCase();

            // Case 1: Simplicity First (단순성 우선)
            if (pLower.includes('simplicity') || pLower.includes('단순성')) {
                // 클러스터당 노드 수 체크 (예: 20개 초과 시 경고)
                clusters.forEach(cluster => {
                    if (cluster.children.length > 20) {
                        issues.push({
                            type: 'warning',
                            severity: 'medium',
                            message: `[SYNS-RULE-01] Principle Violation: '${cluster.label}' 클러스터가 너무 비대합니다. (Limit: 20 nodes)`,
                            nodeIds: cluster.children.slice(0, 5)
                        });
                    }
                });
            }

            // Case 2: No Placeholders (플레이스홀더 금지)
            if (pLower.includes('placeholder') || pLower.includes('플레이스홀더') || pLower.includes('todo')) {
                nodes.forEach(node => {
                    const hasPlaceholder = 
                        (node.data.label.toLowerCase().includes('todo')) ||
                        (node.data.description?.toLowerCase().includes('todo')) ||
                        (node.data.label.toLowerCase().includes('placeholder'));
                    
                    if (hasPlaceholder) {
                        issues.push({
                            type: 'warning',
                            severity: 'low',
                            message: `[SYNS-RULE-02] Principle Violation: '${node.data.label}' 노드에 플레이스홀더/TODO가 발견되었습니다.`,
                            nodeIds: [node.id]
                        });
                    }
                });
            }
            
            // Case 3: Goal-Oriented (목표 중심) -> 과도한 동시 구현 시도 방지
            if (pLower.includes('goal-oriented') || pLower.includes('단계별')) {
                const draftNodes = nodes.filter(n => n.visual.opacity < 1.0);
                if (draftNodes.length > 30) {
                    issues.push({
                        type: 'warning',
                        severity: 'high',
                        message: `[SYNS-RULE-03] Principle Violation: 너무 많은 제안 노드(${draftNodes.length}개)가 있습니다. 단계를 나누세요.`,
                        nodeIds: draftNodes.slice(0, 5).map(n => n.id)
                    });
                }
            }
        });

        return issues;
    }
}
