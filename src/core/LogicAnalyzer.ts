import * as fs from 'fs';
import * as path from 'path';
import { ProjectState, Node, Edge } from '../types/schema';

export interface AnalysisIssue {
    type: 'circular' | 'dead-end' | 'bottleneck' | 'isolated' | 'warning' | 'schema-violation';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    nodeIds: string[];
}

export class LogicAnalyzer {
    /**
     * 프로젝트 상태를 분석하여 아키텍처 결함 및 병목 지점을 찾음
     */
    public analyze(state: ProjectState): AnalysisIssue[] {
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

        return issues;
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
        const reportPath = path.join(projectRoot, 'architecture_report.md');
        let content = `# 🛡️ SYNAPSE 아키텍처 로직 리포트\n\n`;
        content += `생성 일시: ${new Date().toLocaleString()}\n\n`;

        if (issues.length === 0) {
            content += `✅ 분석 결과, 발견된 아키텍처 결함이 없습니다. 깨끗한 구조입니다!\n`;
        } else {
            const criticals = issues.filter(i => i.severity === 'critical');
            const highs = issues.filter(i => i.severity === 'high');
            const others = issues.filter(i => i.severity !== 'critical' && i.severity !== 'high');

            content += `## 🚨 주요 위험 요소 (${criticals.length + highs.length})\n\n`;

            [...criticals, ...highs].forEach(issue => {
                const icon = issue.severity === 'critical' ? '🔴' : '🟠';
                content += `### ${icon} ${issue.message}\n`;
                const links = issue.nodeIds.map(id => {
                    const node = nodes.find(n => n.id === id);
                    const label = node?.data?.label || id;
                    return `[\`${label}\`](command:synapse.focusNode?${encodeURIComponent(JSON.stringify(id))})`;
                });
                content += `- 관련 노드: ${links.join(', ')}\n\n`;
            });

            if (others.length > 0) {
                content += `## ⚠️ 참고 및 병목 사항 (${others.length})\n\n`;
                others.forEach(issue => {
                    content += `- [${issue.type.toUpperCase()}] ${issue.message}\n`;
                });
            }
        }

        content += `\n---\n*이 리포트는 SYNAPSE Logic Analyzer에 의해 자동 생성되었습니다.*`;

        fs.writeFileSync(reportPath, content, 'utf8');
        return reportPath;
    }
}
