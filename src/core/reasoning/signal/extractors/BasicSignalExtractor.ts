import { ArchitecturalEvidence } from '../../evidence/ArchitecturalEvidence';
import { SignalFinding } from '../SignalFinding';
import { SignalExtractor } from '../SignalExtractor';

export class BasicSignalExtractor implements SignalExtractor {
    public id = 'basic_signal_extractor_v1';

    public extract(evidences: ArchitecturalEvidence[]): SignalFinding[] {
        const findings: SignalFinding[] = [];

        for (const evidence of evidences) {
            // 1. state_mutation
            if (evidence.roleHints?.hasStateMutation) {
                findings.push({
                    nodeId: evidence.nodeId,
                    signalId: 'state_mutation',
                    evidenceIds: [evidence.sources['hasStateMutation'] || 'SemanticEngine']
                });
            }

            // 2. lifecycle_control
            if (evidence.roleHints?.hasLifecycleControl) {
                findings.push({
                    nodeId: evidence.nodeId,
                    signalId: 'lifecycle_control',
                    evidenceIds: [evidence.sources['hasLifecycleControl'] || 'SemanticEngine']
                });
            }

            // 3. object_creation (formerly factory_provider)
            if (evidence.roleHints?.hasFactoryPattern) {
                findings.push({
                    nodeId: evidence.nodeId,
                    signalId: 'object_creation',
                    evidenceIds: [evidence.sources['hasFactoryPattern'] || 'SemanticEngine']
                });
            }

            // 4. cross_boundary_reference
            if (evidence.crossBoundaryDependencies && evidence.crossBoundaryDependencies.length > 0) {
                findings.push({
                    nodeId: evidence.nodeId,
                    signalId: 'cross_boundary_reference',
                    evidenceIds: ['BoundaryPressureEngine']
                });
            }
            
            // 5. dependency_resolution (fanIn >= 3)
            if (evidence.fanIn >= 3) {
                findings.push({
                    nodeId: evidence.nodeId,
                    signalId: 'dependency_resolution',
                    evidenceIds: ['StructuralEngine']
                });
            }
        }

        return findings;
    }
}
