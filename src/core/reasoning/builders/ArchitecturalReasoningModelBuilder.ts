import { ArchitecturalEvidence } from '../evidence/ArchitecturalEvidence';
import { AuthorityFinding } from '../analyzers/AuthorityAnalyzer';
import { OwnershipFinding } from '../analyzers/OwnershipAnalyzer';
import { DominanceFinding } from '../analyzers/DominanceAnalyzer';
import { CorridorFinding } from '../analyzers/ArchitecturalCorridorBuilder';
import { PropagationFinding } from '../analyzers/PropagationAnalyzer';
import { RefactorConstraintFinding } from '../analyzers/RefactorAnalyzer';
import { TransitionResult } from '../analyzers/StateTransitionAnalyzer';

/**
 * v0.3.34.32 Architectural Reasoning Layer
 * 
 * Phase 10: Assembly (순수 컨테이너 조립기)
 * 모든 하위 Analyzer 및 Pipeline의 결과를 담아두는 순수 DTO 객체.
 * [!CAUTION] 
 * 이 모델 내부에는 어떠한 계산/추론(riskLevel, architectureHealth 등) 필드도 존재할 수 없습니다.
 */
export interface ArchitecturalReasoningModel {
    timestamp: number;
    evidences: ArchitecturalEvidence[];
    
    authority: AuthorityFinding[];
    ownership: OwnershipFinding[];
    dominance: DominanceFinding[];
    
    corridors: CorridorFinding[];
    propagation: PropagationFinding[];
    
    constraints: RefactorConstraintFinding[];
    transitions: TransitionResult[];
}

/**
 * Architectural Reasoning 파이프라인의 최종 산출물(Model)을 조립합니다.
 * 주의: 조립 과정에서 새로운 결론, 권고(Recommendation), 점수 매기기를 절대 추가하지 않습니다.
 * 오직 합집합 보존(Union Preservation) 및 불변성 유지만을 담당합니다.
 */
export class ArchitecturalReasoningModelBuilder {
    private model: Partial<ArchitecturalReasoningModel> = {
        timestamp: Date.now()
    };

    public setEvidences(evidences: ArchitecturalEvidence[]): this {
        this.model.evidences = [...evidences];
        return this;
    }

    public setAuthority(findings: AuthorityFinding[]): this {
        this.model.authority = [...findings];
        return this;
    }

    public setOwnership(findings: OwnershipFinding[]): this {
        this.model.ownership = [...findings];
        return this;
    }

    public setDominance(findings: DominanceFinding[]): this {
        this.model.dominance = [...findings];
        return this;
    }

    public setCorridors(findings: CorridorFinding[]): this {
        this.model.corridors = [...findings];
        return this;
    }

    public setPropagation(findings: PropagationFinding[]): this {
        this.model.propagation = [...findings];
        return this;
    }

    public setConstraints(findings: RefactorConstraintFinding[]): this {
        this.model.constraints = [...findings];
        return this;
    }

    public setTransitions(findings: TransitionResult[]): this {
        this.model.transitions = [...findings];
        return this;
    }

    public build(): ArchitecturalReasoningModel {
        if (!this.model.evidences) throw new Error("Evidences are required to build the ArchitecturalReasoningModel.");
        
        // 빈 배열 기본값 할당 (합집합 보존 원칙)
        return {
            timestamp: this.model.timestamp!,
            evidences: this.model.evidences,
            authority: this.model.authority || [],
            ownership: this.model.ownership || [],
            dominance: this.model.dominance || [],
            corridors: this.model.corridors || [],
            propagation: this.model.propagation || [],
            constraints: this.model.constraints || [],
            transitions: this.model.transitions || []
        };
    }
}
