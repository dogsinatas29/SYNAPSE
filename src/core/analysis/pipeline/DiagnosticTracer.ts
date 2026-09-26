import * as fs from 'fs';
import * as path from 'path';

export interface TraceEvent {
    type: 'DetectorStart' | 'DetectorComplete' | 'FindingCreated' | 'EvidenceCreated' | 'ReportConsume';
    timestamp: number;
    payload: any;
}

export class DiagnosticTracer {
    private static instance: DiagnosticTracer;
    private events: TraceEvent[] = [];
    private enabled: boolean = true;

    private constructor() {}

    public static getInstance(): DiagnosticTracer {
        if (!DiagnosticTracer.instance) {
            DiagnosticTracer.instance = new DiagnosticTracer();
        }
        return DiagnosticTracer.instance;
    }

    public record(type: TraceEvent['type'], payload: any) {
        if (!this.enabled) return;
        this.events.push({
            type,
            timestamp: Date.now(),
            payload
        });
    }

    public dump(dumpDir: string) {
        if (!this.enabled) return;
        if (!fs.existsSync(dumpDir)) {
            fs.mkdirSync(dumpDir, { recursive: true });
        }
        const dumpPath = path.join(dumpDir, 'diagnostic_trace.json');
        fs.writeFileSync(dumpPath, JSON.stringify(this.events, null, 2), 'utf8');
        // Clear events after dump to prevent memory leaks if running as a daemon
        this.events = [];
    }
}

let execCounter = 0;
let findingCounter = 0;
let evidenceCounter = 0;

export function traceDetectorExecution(
    patternId: string,
    detectorId: string,
    detector: { detect: (val: any, sim?: any) => any[] },
    valContext: any,
    simContext?: any
): any[] {
    const tracer = DiagnosticTracer.getInstance();
    execCounter++;
    const executionId = `EXEC-${execCounter}`;
    
    tracer.record('DetectorStart', { 
        detectorId,
        executionId,
        inputCount: valContext?.nodes?.length || simContext?.evidenceBundle?.findings?.length || 0
    });
    
    const findings = detector.detect(valContext, simContext) || [];
    
    tracer.record('DetectorComplete', { 
        detectorId, 
        executionId,
        findingCount: findings.length 
    });
    
    for (const f of findings) {
        tracer.record('FindingCreated', { 
            executionId,
            findingId: f.findingId,
            patternId: f.patternId || patternId, 
            targetId: f.targetId,
            targetScope: f.targetScope || 'UNKNOWN',
            evidenceCount: f.evidence ? f.evidence.length : 0
        });
        
        if (f.evidence) {
            for (const e of f.evidence) {
                tracer.record('EvidenceCreated', {
                    findingId: f.findingId,
                    evidenceId: e.evidenceId,
                    origin: e.type
                });
            }
        }
    }
    
    return findings;
}

export function traceReportConsume(findingId: string, reportId: string, sectionId: string) {
    DiagnosticTracer.getInstance().record('ReportConsume', {
        findingId,
        reportId,
        sectionId
    });
}
