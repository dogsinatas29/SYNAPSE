import { ValidationContext } from '../validation/ValidationContext';
import { SimulationContext } from '../../types/schema';
import { OnboardingPath } from './types';
import { EntryPointDetector } from '../analysis/patterns/detectors/EntryPointDetector';
import { OnboardingPatternDetector } from '../analysis/patterns/detectors/OnboardingPatternDetector';
import { SafeRefactoringZoneDetector } from '../analysis/patterns/detectors/SafeRefactoringZoneDetector';
import { PatternId } from '../analysis/patterns/PatternId';
import { traceDetectorExecution } from '../analysis/pipeline/DiagnosticTracer';

export class OnboardingAnalyzer {
    private isRealFile(filePath: string): boolean {
        if (!filePath) return false;
        if (filePath.startsWith('AGGREGATE_') || filePath.startsWith('SYSTEM_') || filePath.includes('UNKNOWN') || filePath.includes('OUT_OF_SCOPE')) {
            return false;
        }
        if (!filePath.includes('.')) return false;
        return /\.(ts|js|rs|kt|java|py|cpp|c|h|go|rb)$/i.test(filePath);
    }

    private getRoleScore(filePath: string): number {
        const lower = filePath.toLowerCase();
        // Heavy penalty for test and script files
        if (lower.includes('test') || lower.includes('spec') || lower.includes('mock') || lower.includes('script') || lower.includes('benchmark')) {
            return -1000;
        }
        // Bonus for entry/bootstrap semantics
        if (lower.includes('main') || lower.includes('index') || lower.includes('bootstrap') || lower.includes('extension') || lower.includes('orchestrator') || lower.includes('init') || lower.includes('core')) {
            return +500;
        }
        return 0;
    }

    private getPipelineRoleScore(filePath: string): number {
        const lower = filePath.toLowerCase();
        
        // 1. Domain/Model (Heart of the app)
        if (lower.includes('model') || lower.includes('domain') || lower.includes('entity')) return 400;
        
        // 2. Core Logic/Service
        if (lower.includes('service') || lower.includes('manager') || lower.includes('engine') || lower.includes('core') || lower.includes('usecase')) return 300;
        
        // 3. Storage/Persistence
        if (lower.includes('repository') || lower.includes('database') || lower.includes('storage') || lower.includes('dao')) return 200;
        
        // 4. UI/Presentation (Lowest priority for pipeline to avoid blackhole)
        if (lower.includes('ui') || lower.includes('view') || lower.includes('activity') || lower.includes('fragment') || lower.includes('adapter') || lower.includes('action')) return -100;
        
        return 0;
    }

    private calculateEntryPointScore(node: any): number {
        const fanIn = node.fanIn || 0;
        const fanOut = node.fanOut || 0;
        const depth = (node.filePath || node.id || '').split('/').length;
        const filePath = (node.filePath || node.id || '').toLowerCase();
        
        let priorityScore = 0;
        
        // Priority 1: Activation point / Extension entry
        if (filePath.includes('extension.ts') || filePath.includes('activate') || filePath.includes('main.ts') || filePath.includes('index.ts') || filePath.includes('bootstrap')) {
            priorityScore += 10000;
        }
        
        // Priority 2: Assembly/Authority (if flagged elsewhere, it typically has high fanOut and low depth)
        // Score = Priority - (Depth * 10) - (FanIn * 5) + FanOut
        return priorityScore - (depth * 10) - (fanIn * 5) + fanOut;
    }

    public extractPath(context: ValidationContext, simContext?: SimulationContext): OnboardingPath {
        const path: OnboardingPath = {
            entryPoint: 'N/A',
            corePipeline: [],
            safeAreas: [],
            readLater: []
        };

        const epFindings = traceDetectorExecution(PatternId.ROOT_ENTRY_POINT, 'EntryPointDetector', new EntryPointDetector(), context, simContext);
        
        let trueEntryPoint = 'N/A';
        if (epFindings && epFindings.length > 0) {
            trueEntryPoint = Array.isArray(epFindings[0].targetId) ? epFindings[0].targetId[0] : epFindings[0].targetId;
        }
        
        path.entryPoint = trueEntryPoint;

        // 3. Delegate LEARNING_HUB and PERIPHERAL_COMPONENT to OnboardingPatternDetector
        const onboardingDetector = new OnboardingPatternDetector();
        const onboardingFindings = traceDetectorExecution(PatternId.LEARNING_HUB, 'OnboardingPatternDetector', onboardingDetector, context, simContext);

        const safeZoneDetector = new SafeRefactoringZoneDetector();
        const safeZoneFindings = traceDetectorExecution(PatternId.SAFE_REFACTORING_ZONE, 'SafeRefactoringZoneDetector', safeZoneDetector, context, simContext);

        path.findings = [...(epFindings || []), ...(onboardingFindings || []), ...(safeZoneFindings || [])];

        // Legacy Pipeline calculation - keeping this logic as is for corePipeline
        const pipeline: string[] = [];
        let topFiles: any[] = [];
        if (simContext && simContext.evidenceBundle && simContext.evidenceBundle.findings) {
            const counts = new Map<string, number>();
            for (const f of simContext.evidenceBundle.findings) {
                const src = f.sourceId || f.targetId || f.nodeId || '';
                if (src && this.isRealFile(src) && this.getRoleScore(src) > -1000) {
                    counts.set(src, (counts.get(src) || 0) + 1);
                }
            }
            const sortedCounts = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
            topFiles = sortedCounts.map(entry => ({
                filePath: entry[0],
                externalEdges: entry[1]
            })) as any[];
        }
        
        if (topFiles.length > 0) {
            const sortedImpact = [...topFiles].sort((a, b) => {
                const scoreA = this.getPipelineRoleScore(a.filePath || '') - ((a.externalEdges || 0) * 0.01);
                const scoreB = this.getPipelineRoleScore(b.filePath || '') - ((b.externalEdges || 0) * 0.01);
                return scoreB - scoreA;
            });
            if (trueEntryPoint === 'N/A') {
                trueEntryPoint = sortedImpact[0].filePath || 'N/A';
                path.entryPoint = trueEntryPoint;
            }
            for (const f of sortedImpact) {
                const fPath = f.filePath || '';
                if (fPath !== trueEntryPoint && pipeline.length < 4) {
                    pipeline.push(fPath);
                }
            }
        }
        
        path.corePipeline = pipeline;

        const peripherals = onboardingFindings.filter(f => f.patternId === PatternId.PERIPHERAL_COMPONENT);
        path.safeAreas = peripherals.length > 0 ? peripherals.map(p => p.targetId as string) : ['N/A (No isolated leaf nodes detected)'];

        const learningHubs = onboardingFindings.filter(f => f.patternId === PatternId.LEARNING_HUB);
        path.readLater = learningHubs.length > 0 ? learningHubs.map(l => l.targetId as string) : ['N/A (No peripheral complexity detected)'];

        path.safeRefactoringZones = safeZoneFindings.length > 0 ? safeZoneFindings.map(z => z.targetId as string) : ['N/A (No zero fan-in files detected)'];

        return path;
    }
}
