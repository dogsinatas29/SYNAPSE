import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ValidationEngine } from '../../src/core/validation/ValidationEngine';
import { GraphSnapshot, ValidationContext } from '../../src/core/validation/ValidationContext';
import { ProjectStateSerializer } from '../../src/core/transaction/ProjectStateSerializer';
import { InsightEngine } from '../../src/core/reporting/InsightEngine';
import { ReportScope, SelectionSource } from '../../src/types/schema';

function hashJSON(obj: any): string {
    const str = JSON.stringify(obj, (key, value) => {
        // Sort keys for deterministic JSON stringification
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            return Object.keys(value).sort().reduce((acc: any, k) => {
                acc[k] = value[k];
                return acc;
            }, {});
        }
        return value;
    });
    return crypto.createHash('sha256').update(str).digest('hex');
}

interface DeterminismSnapshot {
    projectHash: string;
    claimIds: string[];
    impactHashes: string[];
    reportHashes: {
        architect: string;
        executive: string;
        onboarding: string;
        simulation: string;
    };
    metricsHash: string;
    metricsStr: string;
}

export function runDeterminismValidation(graphFilePath: string, runs: number = 3): void {
    const workspaceRoot = process.env.SYNAPSE_WORKSPACE_ROOT || path.resolve(path.dirname(graphFilePath), '..');
    
    const logFilePath = path.join(workspaceRoot, 'test_determinism.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'w' });
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
        logStream.write(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n');
        originalConsoleLog(...args);
    };
    console.error = (...args) => {
        logStream.write('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\n');
        originalConsoleError(...args);
    };
    
    console.log(`[Determinism] Starting validation on ${graphFilePath} for ${runs} runs...`);
    console.log(`[Determinism] Logging to ${logFilePath}`);
    
    let rawData = JSON.parse(fs.readFileSync(graphFilePath, 'utf8'));
    const data = ProjectStateSerializer.restore(rawData);
    const snapshot: GraphSnapshot = {
        nodes: data.nodes || (data.graph && data.graph.nodes) || [],
        edges: data.edges || (data.graph && data.graph.edges) || [],
        clusters: data.clusters || []
    };
    
    // Compute intent edges
    const edgeMap = new Map<string, any>();
    for (const e of snapshot.edges) {
        if (!e.from || !e.to) continue;
        const key = `${e.from}|${e.to}`;
        if (!edgeMap.has(key)) {
            edgeMap.set(key, { source: e.from, target: e.to, evidenceCount: 0 });
        }
        edgeMap.get(key).evidenceCount += (e.weight || 1);
    }
    const intentEdges = Array.from(edgeMap.values());

    const projectHash = hashJSON({
        nodes: snapshot.nodes.length,
        edges: snapshot.edges.length,
        intent: intentEdges.length
    });
    
    // Mock simulation evidence for InsightEngine if it doesn't exist
    const simContext = {
        evidenceBundle: { findings: [] },
        validationEvidence: { schemaVersion: '1.0', studies: [] },
        timestamp: Date.now()
    } as any;
    
    const snapshots: DeterminismSnapshot[] = [];
    const insightEngine = new InsightEngine();

    for (let i = 1; i <= runs; i++) {
        console.log(`\n[Determinism] --- Executing Run #${i} ---`);
        
        // Ensure absolutely clean start by deep copying structures if needed, 
        // though ValidationEngine.analyzeState should be stateless.
        
        const context = ValidationEngine.analyzeState(snapshot, 1, workspaceRoot, intentEdges);
        
        // Mock required fields for InsightEngine
        (context as any).reportScope = ReportScope.FULL_PROJECT;
        (context as any).reportTarget = 'Project Root';
        (context as any).selectionSource = SelectionSource.USER_SELECTED;
        
        const execInsight = insightEngine.buildExecutiveInsight(context, simContext);
        const onboardInsight = insightEngine.buildOnboardingInsight(context, simContext);
        const simInsight = insightEngine.buildSimulationInsight(context, simContext);
        const archInsight = insightEngine.buildArchitectInsight(context, simInsight, simContext);
        
        // ValidationEngine doesn't produce 'claims' directly, InsightEngine produces 'findings'
        // We will hash the findings from the Executive and Architect reports as our "Claim Set"
        const claimIds = [
            execInsight.health,
            execInsight.action,
            ...archInsight.findings.map(f => f.filePath)
        ].sort();
        
        // Use Impact metrics from the ValidationContext
        delete context.metrics.generatedAt;
        const impactHashes = [
            hashJSON(context.metrics.ifIgnoredImpact || {}),
            hashJSON(context.metrics.topImpactFiles || []),
            hashJSON(context.metrics.estimatedCost || {})
        ].sort();
        
        snapshots.push({
            projectHash,
            claimIds,
            impactHashes,
            reportHashes: {
                executive: hashJSON(execInsight),
                onboarding: hashJSON(onboardInsight),
                simulation: hashJSON(simInsight),
                architect: hashJSON(archInsight)
            },
            metricsHash: hashJSON(context.metrics),
            metricsStr: JSON.stringify(context.metrics, null, 2)
        });
    }

    console.log(`\n[Determinism] Verifying 100% equivalence...`);
    const base = snapshots[0];
    let passed = true;
    for (let i = 1; i < runs; i++) {
        const prev = snapshots[i - 1];
        const curr = snapshots[i];

        if (prev.metricsHash !== curr.metricsHash) {
            console.error(`❌ Mismatch in raw context.metrics on run ${i + 1}`);
            if (!fs.existsSync(path.join(__dirname, '../../scratch'))) fs.mkdirSync(path.join(__dirname, '../../scratch'));
            fs.writeFileSync(path.join(__dirname, `../../scratch/metrics_run${i}.json`), prev.metricsStr);
            fs.writeFileSync(path.join(__dirname, `../../scratch/metrics_run${i + 1}.json`), curr.metricsStr);
            passed = false;
        }
        
        if (hashJSON(base.claimIds) !== hashJSON(curr.claimIds)) {
            console.error(`❌ Mismatch in claimIds on run ${i + 1}`);
            passed = false;
        }
        if (hashJSON(base.impactHashes) !== hashJSON(curr.impactHashes)) {
            console.error(`❌ Mismatch in impactHashes on run ${i + 1}`);
            passed = false;
        }
        if (base.reportHashes.executive !== curr.reportHashes.executive) {
            console.error(`❌ Mismatch in Executive Report Insight on run ${i + 1}`);
            passed = false;
        }
        if (base.reportHashes.onboarding !== curr.reportHashes.onboarding) {
            console.error(`❌ Mismatch in Onboarding Report Insight on run ${i + 1}`);
            passed = false;
        }
        if (base.reportHashes.architect !== curr.reportHashes.architect) {
            console.error(`❌ Mismatch in Architect Report Insight on run ${i + 1}`);
            passed = false;
        }
    }

    if (!passed) {
        console.error(`\n🚨 Determinism Validation FAILED! Output is not 100% identical across runs.`);
        process.exit(1);
    } else {
        console.log(`\n✅ Determinism Validation PASSED! Output is 100% identical across all ${runs} runs.`);
    }
}

if (require.main === module) {
    const defaultPath = path.join(__dirname, '../../synapse_data/project_state.json');
    const targetPath = process.argv[2] || defaultPath;
    
    if (!fs.existsSync(targetPath)) {
        console.error(`Error: project_state.json not found at ${targetPath}`);
        console.error(`Please provide the correct path to your copied project_state.json`);
        process.exit(1);
    }
    
    runDeterminismValidation(targetPath, 3);
}
