import * as fs from 'fs';
import * as path from 'path';
import { AggregatedReportBundle, ReasonedReportBundle } from './types';
import { ProjectState } from '../../types/schema';
import { InterventionResult } from './InterventionSimulator';

export class ReportExporter {
    public static export(bundle: ReasonedReportBundle, state: ProjectState, projectRoot: string): string {
        // --- PROVENANCE AUDIT: REPORT_EXPORTER ---
        const exportProvStats: Record<string, number> = {};
        state.edges?.forEach(e => {
            const p = e.provenance || 'UNDEFINED';
            exportProvStats[p] = (exportProvStats[p] || 0) + 1;
        });
        const Logger = require('../../utils/Logger').Logger;
        Logger.info(`[PROVENANCE_AUDIT] [REPORT_EXPORTER] Total Edges: ${state.edges?.length || 0} | Stats: ${JSON.stringify(exportProvStats)}`);
        // -----------------------------------------
        
        const reportDir = path.join(projectRoot, 'synapse_report');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        const reportPath = path.join(reportDir, 'LOGIC_REPORT.md');
        
        let isKo = false;
        try {
            const vscode = require('vscode');
            isKo = vscode.env.language.startsWith('ko');
        } catch (e) {
            // fallback
        }

        let content = isKo
            ? `# 🛡️ [VISUAL IMPACT] LOGIC_REPORT.md - Actionable Architecture Report\n\n`
            : `# 🛡️ [VISUAL IMPACT] LOGIC_REPORT.md - Actionable Architecture Report\n\n`;

        content += isKo ? `생성 일시: ${new Date(bundle.timestamp).toLocaleString()}\n` : `Generated At: ${new Date(bundle.timestamp).toLocaleString()}\n`;
        content += `분석 대상 노드 (Analyzed Nodes): ${state.nodes?.length || 0}개\n`;
        content += `분석 대상 엣지 (Analyzed Edges): ${state.edges?.length || 0}개\n`;
        content += `총 발견 항목 (Raw Findings): ${bundle.base.rawFindingsCount}개\n\n`;
        
        if ((state.nodes?.length || 0) === 0) {
            content += isKo 
                ? `> ⚠️ **분석 대상 노드가 없습니다 (0 Nodes Analyzed).**\n> 가시성(눈알 아이콘)이 켜진 클러스터(폴더) 내부에 분석 가능한 런타임/로직 노드가 없거나, 필터링 조건에 의해 모두 제외되었습니다.\n\n`
                : `> ⚠️ **No Analyzed Nodes (0 Nodes Analyzed).**\n> There are no analyzable runtime/logic nodes within the visible (eye icon toggled) clusters, or all were excluded by filtering conditions.\n\n`;
        }
        
        // --- 1. EXECUTIVE SUMMARY ---
        content += isKo 
            ? `## 🚀 Executive Summary (권장 조사 순서)\n`
            : `## 🚀 Executive Summary (Recommended Investigation Order)\n`;

        // 1. Critical Intervention (Tier 0)
        let criticalInterventions = bundle.interventions?.filter((i: InterventionResult) => i.absoluteSccReduction >= 10 && i.aig >= 50) || [];
        if (criticalInterventions.length > 0) {
            const ci = criticalInterventions.sort((a: InterventionResult, b: InterventionResult) => b.absoluteSccReduction - a.absoluteSccReduction)[0];
            content += isKo 
                ? `1. 🔥 **Critical Intervention**: [Edges: ${ci.targetEdges.length}개 절단] (SCC ${ci.beforeSccSize} → ${ci.afterSccSize}, AIG: ${ci.aig.toFixed(1)}%)\n` 
                : `1. 🔥 **Critical Intervention**: [Edges: ${ci.targetEdges.length} cut] (SCC ${ci.beforeSccSize} → ${ci.afterSccSize}, AIG: ${ci.aig.toFixed(1)}%)\n`;
        } else {
            content += `1. 🔥 **Critical Intervention**: N/A\n`;
        }

        // 2. Quick Win
        let quickWins = bundle.interventions?.filter((i: InterventionResult) => i.adjustedRoi > 5 && i.structuralCost.totalCost < 5 && i.confidence.weighted >= 80 && i.absoluteSccReduction >= 20) || [];
        if (quickWins.length > 0) {
            const qw = quickWins.sort((a: InterventionResult, b: InterventionResult) => b.adjustedRoi - a.adjustedRoi)[0];
            content += isKo 
                ? `2. ⚡ **Quick Win**: [Edges: ${qw.targetEdges.length}개 절단] (Cost: ${qw.structuralCost.totalCost}, ROI: ${qw.adjustedRoi}, Conf: ${qw.confidence.weighted}%)\n` 
                : `2. ⚡ **Quick Win**: [Edges: ${qw.targetEdges.length} cut] (Cost: ${qw.structuralCost.totalCost}, ROI: ${qw.adjustedRoi}, Conf: ${qw.confidence.weighted}%)\n`;
        } else {
            content += `2. ⚡ **Quick Win**: N/A\n`;
        }

        // 3. Highest ROI Intervention
        let topRois = bundle.interventions?.sort((a: InterventionResult, b: InterventionResult) => b.adjustedRoi - a.adjustedRoi) || [];
        if (topRois.length > 0) {
            const topRoi = topRois[0];
            content += isKo 
                ? `3. 🚀 **Highest ROI Intervention**: [Edges: ${topRoi.targetEdges.length}개 절단] (ROI: ${topRoi.adjustedRoi}, AIG: ${topRoi.compositeAig.toFixed(1)}%, Cost: ${topRoi.structuralCost.totalCost})\n` 
                : `3. 🚀 **Highest ROI Intervention**: [Edges: ${topRoi.targetEdges.length} cut] (ROI: ${topRoi.adjustedRoi}, AIG: ${topRoi.compositeAig.toFixed(1)}%, Cost: ${topRoi.structuralCost.totalCost})\n`;
        } else {
            content += `3. 🚀 **Highest ROI Intervention**: N/A\n`;
        }

        // 4. Largest SCC
        if (bundle.sccs && bundle.sccs.length > 0) {
            const largest = bundle.sccs[0];
            content += isKo
                ? `4. **Largest SCC**: ${largest.nodeIds.length}개 노드 순환 참조\n`
                : `4. **Largest SCC**: ${largest.nodeIds.length} nodes cyclic reference\n`;
        } else {
            content += `4. **Largest SCC**: N/A\n`;
        }

        // 5. Strongest Cluster Bridge
        if (bundle.clusterBridges && bundle.clusterBridges.length > 0) {
            const strongestBridge = [...bundle.clusterBridges].sort((a, b) => b.couplingStrength - a.couplingStrength)[0];
            content += isKo
                ? `5. **Strongest Cluster Bridge**: \`${strongestBridge.sourceCluster}\` ↔ \`${strongestBridge.targetCluster}\` (강도: ${strongestBridge.couplingStrength})\n`
                : `5. **Strongest Cluster Bridge**: \`${strongestBridge.sourceCluster}\` ↔ \`${strongestBridge.targetCluster}\` (Strength: ${strongestBridge.couplingStrength})\n`;
        } else {
            content += `5. **Strongest Cluster Bridge**: N/A\n`;
        }

        // 6. Highest Risk Hub
        if (bundle.auditLog?.topHubsA && bundle.auditLog.topHubsA.length > 0) {
            const topHub = bundle.auditLog.topHubsA[0];
            const link = this.extractNodeLinks([topHub.id], state.nodes || []);
            content += isKo
                ? `6. **Highest Risk Hub**: ${link} (위험도: ${topHub.stability}%)\n`
                : `6. **Highest Risk Hub**: ${link} (Stability: ${topHub.stability}%)\n`;
        } else {
            content += `6. **Highest Risk Hub**: N/A\n`;
        }
        
        // --- 2. TOP 20 INTERVENTIONS ---
        content += isKo ? `\n## ⚔️ Top 20 Interventions (가상 절단 시뮬레이션 결과)\n\n` : `\n## ⚔️ Top 20 Interventions (Demolition Simulation)\n\n`;
        
        let allInterventions = bundle.interventions?.sort((a: InterventionResult, b: InterventionResult) => {
            // [v0.3.34.9 FIX] 1차: SCC 실제 감소량 (아키텍트 1순위)
            // 2차: adjustedRoi (Confidence/Cost 반영)
            if (b.absoluteSccReduction !== a.absoluteSccReduction) return b.absoluteSccReduction - a.absoluteSccReduction;
            return b.adjustedRoi - a.adjustedRoi;
        }) || [];
        
        // 1차 필터링: Root Cause (hub/bridge/scc) 기준 중복 랭킹 제거 (Ranking Pollution 방지)
        const rootCauseMap = new Map<string, InterventionResult[]>();
        allInterventions.forEach(inv => {
            if (!rootCauseMap.has(inv.rootCauseId)) rootCauseMap.set(inv.rootCauseId, []);
            rootCauseMap.get(inv.rootCauseId)!.push(inv);
        });
        const uniqueInterventions = Array.from(rootCauseMap.values()).map(group => group[0]).sort((a, b) => {
            if (b.absoluteSccReduction !== a.absoluteSccReduction) return b.absoluteSccReduction - a.absoluteSccReduction;
            return b.adjustedRoi - a.adjustedRoi;
        });

        uniqueInterventions.slice(0, 20).forEach((inv: InterventionResult, index: number) => {
            content += `### #${index + 1} Target [${inv.targetTier}] (Rank: ${inv.candidateRank})\n`;
            content += `- **Reason**: ${inv.targetReason}\n`;
            content += `- **Edges to Cut**: ${inv.targetEdges.length}개\n`;
            content += `- **Absolute SCC Reduction**: ${inv.absoluteSccReduction} (${inv.beforeSccSize} → ${inv.afterSccSize})\n`;
            content += `- **AIG**: ${inv.aig.toFixed(1)}%\n`;
            content += `- **Structural Cost**: ${inv.structuralCost.totalCost} (Files: ${inv.structuralCost.affectedFiles}, Clusters: ${inv.structuralCost.affectedClusters})\n`;
            content += `- **Confidence**: ${inv.confidence.weighted}% (Min: ${inv.confidence.minimum}%)\n`;
            content += `- **Adjusted ROI**: ${inv.adjustedRoi}\n`;
            if (inv.astRecommended) {
                content += `- **AST Microscope**: 🔍 ${inv.astReason}\n`;
            }
            
            const siblings = rootCauseMap.get(inv.rootCauseId)!.length - 1;
            if (siblings > 0) {
                content += `- **Alternatives**: 동일 원인(${inv.rootCauseId})의 하위 대안 ${siblings}개 생략됨\n`;
            }
            
            content += `- **Decision**: ${inv.decision}\n\n`;
        });
        
        // --- 3. Largest SCC ---
        if (bundle.auditLog?.sccSize_A !== undefined) {
            content += isKo
                ? `3. **Largest SCC (Raw Runtime)**: \`${bundle.auditLog.sccSize_A} 개 노드\`\n`
                : `3. **Largest SCC (Raw Runtime)**: \`${bundle.auditLog.sccSize_A} nodes\`\n`;
        }
        
        // 4. Highest Complexity Hotspot
        content += isKo
            ? `4. **Highest Complexity Hotspot**: *(v0.3.34.8 - AST Microscope에서 지원 예정)*\n`
            : `4. **Highest Complexity Hotspot**: *(Coming in v0.3.34.8 - AST Microscope)*\n`;
        
        // 5. Recommended Investigation Order
        content += isKo
            ? `5. **Recommended Investigation Order**:\n   - **1순위**: 최강 결합 브릿지 (모듈 경계 독립성 파악)\n   - **2순위**: 가장 큰 SCC (순환 참조 고리 끊기 타당성 검토)\n   - **3순위**: 최고 위험도 허브 (의존성 집중도 해소)\n\n`
            : `5. **Recommended Investigation Order**:\n   - **Priority 1**: Strongest Bridge (Assess module boundary independence)\n   - **Priority 2**: Largest SCC (Evaluate breaking dependency cycles)\n   - **Priority 3**: Highest Risk Hub (Resolve dependency bottlenecks)\n\n`;

        // --- 2. MACRO ARCHITECTURE (Graph) ---
        content += isKo ? `## 🏛️ 거시적 아키텍처 (Macro Architecture - Graph)\n\n` : `## 🏛️ Macro Architecture (Graph)\n\n`;

        
        // 1. Runtime Graph Audit & Hub Stability Index
        if (bundle.auditLog) {
            content += `## 📊 Runtime Graph Audit\n`;
            content += `- **Runtime Nodes:** ${bundle.auditLog.runtimeNodes}\n`;
            content += `- **SCC Size (A - All):** ${bundle.auditLog.sccSize_A}\n`;
            content += `- **SCC Size (B - No Unknown):** ${bundle.auditLog.sccSize_B}\n`;
            content += `- **SCC Size (C - No Type Only):** ${bundle.auditLog.sccSize_C}\n`;
            content += `- **SCC Size (D - No Framework):** ${bundle.auditLog.sccSize_D}\n`;
            content += `- **SCC Size (E - Strict Runtime):** ${bundle.auditLog.sccSize_E}\n\n`;

            if (bundle.auditLog.topHubsA && bundle.auditLog.topHubsA.length > 0) {
                content += `## 🎯 Hub Stability Index (Top 10)\n`;
                bundle.auditLog.topHubsA.forEach((hub: any) => {
                    content += `- \`${hub.id.split('/').pop()}\`: ${hub.degA} -> ${hub.degE} (${hub.stability}%)\n`;
                });
                content += `\n`;
            }
        }
        
        // 1.5 Cluster Coupling Breakdown
        if (bundle.clusterBridges && bundle.clusterBridges.length > 0) {
            content += isKo
                ? `## 🔗 Cluster Coupling Breakdown (상위 10개 브릿지)\n*서브시스템 간 결합의 강도(Strength)와 밀도(Density)를 정밀하게 분석합니다.*\n\n`
                : `## 🔗 Cluster Coupling Breakdown (Top 10 Bridges)\n*Precise analysis of coupling strength and density between subsystems.*\n\n`;
            
            const topBridges = [...bundle.clusterBridges]
                .sort((a, b) => b.couplingStrength - a.couplingStrength)
                .slice(0, 10);
                
            topBridges.forEach((bridge, idx) => {
                content += `### #${idx + 1} \`${bridge.sourceCluster}\` ↔ \`${bridge.targetCluster}\`\n`;
                content += isKo 
                    ? `- **Coupling Strength (질)**: \`${bridge.couplingStrength}\`\n- **Coupling Density (양)**: \`${bridge.couplingDensity} 개 엣지\`\n`
                    : `- **Coupling Strength**: \`${bridge.couplingStrength}\`\n- **Coupling Density**: \`${bridge.couplingDensity} edges\`\n`;
                    
                const outb = bridge.outboundEdges || 0;
                const inb = bridge.inboundEdges || 0;
                content += isKo 
                    ? `- **Directionality (방향성)**: \`Outbound: ${outb} | Inbound: ${inb}\`\n`
                    : `- **Directionality**: \`Outbound: ${outb} | Inbound: ${inb}\`\n`;

                if (bridge.distribution) {
                    content += isKo ? `- **Edge Distribution (엣지 분포)**:\n` : `- **Edge Distribution**:\n`;
                    if (bridge.functionCallEdges > 0) content += `  - Function Calls: ${bridge.functionCallEdges} (${bridge.distribution.functionCallPct}%)\n`;
                    if (bridge.inheritanceEdges > 0) content += `  - Inheritance: ${bridge.inheritanceEdges} (${bridge.distribution.inheritancePct}%)\n`;
                    if (bridge.constructorEdges > 0) content += `  - Constructors: ${bridge.constructorEdges} (${bridge.distribution.constructorPct}%)\n`;
                    if (bridge.frameworkRegistrationEdges > 0) content += `  - Framework/DI: ${bridge.frameworkRegistrationEdges}\n`;
                    if (bridge.typeOnlyEdges > 0) content += `  - Type Only: ${bridge.typeOnlyEdges} (${bridge.distribution.typeOnlyPct}%)\n`;
                    if (bridge.unknownRuntimeEdges > 0) content += `  - Unknown/Other: ${bridge.unknownRuntimeEdges} (${bridge.distribution.unknownPct}%)\n`;
                }
                content += `\n`;
            });
        }

        // 2. Critical Violations
        const criticalCount = bundle.base.criticalNecrosis.length + bundle.base.criticalFractures.length;
        content += `Test Status: ${criticalCount === 0 ? '✅ Pass' : '❌ Fail (Visual Indicator: Red-out)'}\n\n`;

        if (criticalCount > 0) {
            content += `## 💀 Architecture Violations & Fractures\n`;
            bundle.base.criticalNecrosis.forEach(issue => {
                const anyIssue = issue as any;
                const ids: string[] = [];
                if (anyIssue.nodeId) ids.push(anyIssue.nodeId);
                if (anyIssue.sourceId) ids.push(anyIssue.sourceId);
                if (anyIssue.targetId) ids.push(anyIssue.targetId);
                if (anyIssue.nodeIds) ids.push(...anyIssue.nodeIds);
                
                const links = this.extractNodeLinks(ids, state.nodes || []);
                content += `- 🔴 **${issue.message}**: ${links}\n`;
            });
            bundle.base.criticalFractures.forEach(issue => {
                const links = this.extractNodeLinks([issue.sourceNodeId], state.nodes || []);
                content += `- ⚡ **단절된 흐름**: ${links}\n`;
            });
            content += `\n`;
        }

        // 2. Pressure: Top Bottlenecks (Super Hubs)
        if (bundle.base.stats.totalBottleneck > 0) {
            content += `## 🔥 Top 10 Super Hubs (Bottlenecks)\n`;
            content += `*전체 ${bundle.base.stats.totalBottleneck}개의 병목 중 상위 10개*\n`;
            bundle.base.topBottlenecks.forEach(issue => {
                const link = this.extractNodeLinks([issue.nodeId], state.nodes || []);
                content += `- 🟠 ${link} (집중도: ${issue.value})\n`;
            });
            content += `\n`;
        }

        // 3. Pressure: High Blast Radius Modules (Fan-out)
        if (bundle.base.stats.totalFanOut > 0) {
            content += `## 🚀 High Blast Radius Modules (Fan-out)\n`;
            content += `*전체 ${bundle.base.stats.totalFanOut}개의 Fan-out 모듈 중 상위 10개 (변경 시 영향도 최대)*\n`;
            bundle.base.topFanOuts.forEach(issue => {
                const link = this.extractNodeLinks([issue.nodeId], state.nodes || []);
                content += `- 🟡 ${link} (Fan-out: ${issue.value})\n`;
            });
            content += `\n`;
        }
        
        // 4. Critical Bridges (Intervention Simulator)
        if (bundle.criticalBridges && bundle.criticalBridges.length > 0) {
            content += `## 🌉 Top Intervention Targets (Structural Demolition Map)\n`;
            content += `*거대 순환 참조 군집(SCC)을 효과적으로 쪼개기 위한 가상 절단 시뮬레이션 결과입니다.*\n\n`;
            
            bundle.criticalBridges.forEach((bridge, idx) => {
                const srcLink = this.extractNodeLinks([bridge.sourceId], state.nodes || []);
                const tgtLink = this.extractNodeLinks([bridge.targetId], state.nodes || []);
                
                content += `> 🥇 **#${idx + 1} ${srcLink} → ${tgtLink}**\n`;
                content += `> - **Largest Remaining SCC:** \`${bridge.largestRemainingScc} nodes\`\n`;
                content += `> - **Fragment Count:** \`${bridge.fragmentCount}\`\n`;
                content += `> - **Impact (Edge Reduction):** \`${bridge.impact}%\`\n`;
                content += `> - **Untangle Score:** \`${bridge.untangleScore}\`\n`;
                content += `> - **SCC Fragmentation:** \`${bridge.sccFragmentation}\`\n`;
                content += `> - **Separated Fragments:**\n`;
                
                bridge.fragments.slice(0, 2).forEach((frag, fIdx) => {
                    const char = String.fromCharCode(65 + fIdx);
                    const reps = frag.representativeNodes.map(r => {
                        const link = this.extractNodeLinks([r.id], state.nodes || []);
                        return `${link} (Deg: ${r.degree})`;
                    }).join(', ');
                    content += `>   - \`Fragment ${char}\` (${frag.nodeCount} nodes) - Core Nodes: ${reps}\n`;
                });
                if (bridge.fragments.length > 2) {
                    content += `>   - ... and ${bridge.fragments.length - 2} smaller fragments\n`;
                }
                
                content += `> - **Structural Role:** \`${bridge.structuralRole}\`\n`;
                content += `> - **Edge Type:** \`${bridge.edgeType}\`\n\n`;
            });
        } else {
            // Fallback for clean architecture
            if (bundle.base.stats.totalCycleClusters > 0) {
                content += `## 🔄 Top Circular Dependency Clusters (Legacy)\n`;
                content += `*총 ${bundle.base.stats.totalCycles}개의 원시(Raw) 순환 참조가 **${bundle.base.stats.totalCycleClusters}개의 핵심 군집**으로 압축되었습니다.*\n\n`;
                
                // Show up to 20 clusters
                const clustersToShow = bundle.base.canonicalCycles.slice(0, 20);
                clustersToShow.forEach((cluster, idx) => {
                    const links = this.extractNodeLinks(cluster.nodeIds, state.nodes || []);
                    content += `### Cluster #${idx + 1} (중복도: ${cluster.count}회)\n`;
                    content += `- **관련 모듈**: ${links}\n`;
                    content += `- **대표 경로 예시**:\n`;
                    cluster.paths.forEach(p => {
                        content += `  - \`${p}\`\n`;
                    });
                    content += `\n`;
                });
            }
        }

        // 5. Relevant Structural Defects
        if (bundle.base.stats.totalStructurals > 0) {
            content += `## 🏗️ Relevant Structural Defects (Isolated/DeadEnd)\n`;
            content += `*총 ${bundle.base.stats.totalStructurals}개의 구조 결함 중 시스템 영향도가 높은(Layer>0 등) 상위 항목만 표시합니다.*\n\n`;
            if (bundle.base.criticalStructurals.length > 0) {
                bundle.base.criticalStructurals.forEach(issue => {
                    const link = this.extractNodeLinks([issue.nodeId], state.nodes || []);
                    content += `- 🟡 **${issue.message}**: ${link}\n`;
                });
            } else {
                content += `- 우선순위가 높은(치명적인) 구조 결함은 발견되지 않았습니다.\n`;
            }
            content += `\n`;
        }

        content += `\n---\n*이 리포트는 SYNAPSE Unified Architecture Analysis Engine에 의해 자동 생성되었습니다.*`;

        fs.writeFileSync(reportPath, content, 'utf8');
        return reportPath;
    }

    private static extractNodeLinks(ids: string[], nodes: any[]): string {
        // De-duplicate
        const uniqueIds = Array.from(new Set(ids.filter(id => !!id)));
        
        return uniqueIds.map(id => {
            const node = nodes.find(n => n.id === id);
            return `[\`${node?.data?.label || id}\`](command:synapse.focusNode?${encodeURIComponent(JSON.stringify(id))})`;
        }).join(' ↔ ');
    }
}
