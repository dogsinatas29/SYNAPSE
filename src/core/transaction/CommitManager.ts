import * as fs from 'fs';
import { Node, Edge, Cluster, graphModel, GraphModel, GraphSnapshot } from '../GraphModel';
import { buildGraph } from '../graphBuilder';
import { executionLayer } from './ExecutionLayer';
import { verificationLayer } from './VerificationLayer';

/**
 * 🛰️ SYNAPSE Commit Manager (v0.3.11)
 * 
 * "Commit Contract"를 보장하는 트랜잭션 관리자입니다.
 */

export interface CommitRequest {
    nodes: Node[];
    edges: Edge[];
    clusters?: Cluster[];
    deletedNodes?: Node[]; // [v0.3.11] 물리적 삭제 지원
}

export interface CommitResult {
    success: boolean;
    graph?: GraphSnapshot;
    error?: string;
    createdFiles?: string[];
    deletedFiles?: string[];
}

export class CommitManager {
    /**
     * 클러스터 단위의 변경 사항을 확정(Commit)합니다.
     */
    public commitCluster(req: CommitRequest): CommitResult {
        let createdFiles: string[] = [];
        let deletedFiles: string[] = [];
        const projectRoot = graphModel.getProjectRoot();

        try {
            // 1. VALIDATE: (STAGE 2)
            this.validateDraft(req);

            // 2. MATERIALIZE: (STAGE 4) - 생성/수정
            const resolvedNodes = req.nodes.map(n => executionLayer.resolveNode(n, projectRoot));
            try {
                createdFiles = executionLayer.materialize(resolvedNodes, req.edges, projectRoot);
                
                // [v0.3.11] 물리적 파일 삭제 실행 (Unlink) - 명시적 플래그 확인
                if (req.deletedNodes) {
                    for (const dn of req.deletedNodes) {
                        // 사용자가 명시적으로 물리 삭제를 요청한 경우에만 수행
                        const isPhysical = dn.data && (dn.data as any).__isPhysicalDelete;
                        if (isPhysical && dn.filePath && fs.existsSync(dn.filePath)) {
                            // 원본 데이터 보호를 위해 프로젝트 내부 파일만 삭제 허용
                            if (dn.filePath.startsWith(projectRoot)) {
                                fs.unlinkSync(dn.filePath);
                                deletedFiles.push(dn.filePath);
                            }
                        }
                    }
                }
            } catch (execError: any) {
                this.rollback(execError.createdFiles || []);
                throw new Error(`EXECUTION_FAILED: ${execError.message}`);
            }

            // 3. GRAPH: 불변 그래프 재구성 (STAGE 3/4 사이)
            const currentSnap = graphModel.createSnapshot();
            
            // 신규 노드에 실제 생성된 경로 할당 및 Reserved 클러스터 배정
            const finalizedNodes = req.nodes.map(n => {
                const resolved = resolvedNodes.find(rn => rn.id === n.id);
                return { 
                    ...n, 
                    filePath: resolved?.path || n.filePath, 
                    status: 'active',
                    cluster_id: n.cluster_id || 'cluster_reserved' 
                };
            });

            const newNodes = currentSnap.nodes.concat(finalizedNodes);
            const newEdges = currentSnap.edges.concat(req.edges.map(e => ({ ...e, status: 'confirmed' })));
            const newClusters = currentSnap.clusters.concat(req.clusters || []);

            const frozenGraph = buildGraph(newNodes, newEdges, newClusters, (currentSnap as any).metadata);

            // 4. VERIFY: 최종 검증 (STAGE 5)
            this.verifyCommit(createdFiles);

            // 5. FINALIZE: 상태 반영
            graphModel.restoreSnapshot(frozenGraph);

            return {
                success: true,
                graph: frozenGraph,
                createdFiles
            };
        } catch (e: any) {
            console.error(`[SYNAPSE] Commit Failed: ${e.message}`);
            // 전체 롤백 보장
            this.rollback(createdFiles);
            return {
                success: false,
                error: e.message
            };
        }
    }

    private validateDraft(req: CommitRequest) {
        if (req.nodes.length === 0 && req.edges.length === 0) {
            throw new Error("EMPTY_DRAFT");
        }
        // [v0.3.11] 추가 검증 로직 (중복 ID 등)
        const currentNodes = new Set(graphModel.createSnapshot().nodes.map(n => n.id));
        for (const n of req.nodes) {
            if (currentNodes.has(n.id)) {
                throw new Error(`DUPLICATE_NODE_ID: ${n.id}`);
            }
        }
    }

    private verifyCommit(files: string[]) {
        const result = verificationLayer.verify(files);
        if (!result.success) {
            throw new Error(`VERIFICATION_FAILED: ${result.errors.join(', ')}`);
        }
    }

    private rollback(files: string[]) {
        if (files.length === 0) return;
        console.warn(`[SYNAPSE] ⚠️ Transaction Failure. Rolling back ${files.length} files...`);
        for (const file of files) {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            } catch (e) {
                console.error(`[SYNAPSE] Critical: Rollback failed for ${file}`);
            }
        }
    }
}

export const commitManager = new CommitManager();
