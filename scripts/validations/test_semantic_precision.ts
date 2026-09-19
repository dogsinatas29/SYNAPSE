import * as fs from 'fs';
import * as path from 'path';
import { SystemCoreDetector } from '../../src/core/analysis/patterns/detectors/SystemCoreDetector';
import { ValidationContext } from '../../src/core/validation/ValidationContext';
import { SimulationContext } from '../../src/types/schema';

// Helper to compute metrics from raw graph
function buildSimContextFromGraph(projectStatePath: string): SimulationContext {
    const data = JSON.parse(fs.readFileSync(projectStatePath, 'utf8'));
    const nodes = data.nodes || [];
    const edges = data.edges || [];

    // Map nodes by id for quick lookup
    const nodeMap = new Map();
    nodes.forEach((n: any) => nodeMap.set(n.id, n));

    // Calculate Inbound and Outbound edges
    const fanInMap = new Map<string, number>();
    const fanOutMap = new Map<string, number>();
    const adjList = new Map<string, string[]>(); // For blast radius (forward edges)

    nodes.forEach((n: any) => {
        fanInMap.set(n.id, 0);
        fanOutMap.set(n.id, 0);
        adjList.set(n.id, []);
    });

    edges.forEach((e: any) => {
        const from = e.source || e.from;
        const to = e.target || e.to;
        if (fanOutMap.has(from)) fanOutMap.set(from, fanOutMap.get(from)! + 1);
        if (fanInMap.has(to)) fanInMap.set(to, fanInMap.get(to)! + 1);
        
        if (adjList.has(from)) {
            adjList.get(from)!.push(to);
        }
    });

    // Simple Blast Radius: Unique nodes reachable within 2 hops
    const computeBlastRadius = (startId: string) => {
        const visited = new Set<string>();
        let currentQueue = [startId];
        
        for (let hop = 0; hop < 2; hop++) {
            const nextQueue: string[] = [];
            for (const id of currentQueue) {
                const neighbors = adjList.get(id) || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor) && neighbor !== startId) {
                        visited.add(neighbor);
                        nextQueue.push(neighbor);
                    }
                }
            }
            currentQueue = nextQueue;
        }
        return visited.size;
    };

    // Construct mock semantic findings for SystemCoreDetector
    // Note: We'll modify SystemCoreDetector to use fanIn and blastRadius in a moment
    const findings = nodes.map((n: any) => {
        const fanIn = fanInMap.get(n.id) || 0;
        const fanOut = fanOutMap.get(n.id) || 0;
        const blastRadius = computeBlastRadius(n.id);
        
        // authorityReach roughly proportional to fanIn
        const authorityReach = Number((Math.min(fanIn / 10, 1.0)).toFixed(2));

        return {
            type: 'semantic',
            evidenceType: 'BOUNDARY_NODE',
            targetId: n.id,
            evidence: {
                fanIn,
                fanOut,
                blastRadius,
                authorityReach
            },
            metadata: {
                fanIn,
                fanOut,
                blastRadius,
                authorityReach,
                // keep legacy fields just in case
                size: 100,
                externalEdges: fanOut
            }
        };
    });

    return {
        evidenceBundle: {
            findings: findings
        }
    } as unknown as SimulationContext;
}

function runSemanticPrecisionAudit() {
    console.log('🚀 Running Semantic Precision Audit (System Core on SYNAPSE)');
    
    const projectPath = path.resolve(__dirname, '../../synapse_data/project_state.json');
    if (!fs.existsSync(projectPath)) {
        console.error(`❌ Data file not found: ${projectPath}`);
        return;
    }

    const mockSimContext = buildSimContextFromGraph(projectPath);
    const mockValContext = {} as ValidationContext;

    const detector = new SystemCoreDetector();
    const findings = detector.detect(mockValContext, mockSimContext);

    const sortedFindings = findings.sort((a, b) => b.confidence - a.confidence);
    const top100 = sortedFindings.slice(0, 100).map(f => ({
        path: f.targetId,
        confidence: f.confidence,
        evidence: f.evidence
    }));

    // Calculate Distribution
    const scores = findings.map(f => f.confidence).sort((a, b) => a - b);
    const dist = {
        count: findings.length,
        max: scores[scores.length - 1] || 0,
        p99: scores[Math.floor(scores.length * 0.99)] || 0,
        p95: scores[Math.floor(scores.length * 0.95)] || 0,
        p50: scores[Math.floor(scores.length * 0.50)] || 0
    };

    const output = {
        project: "SYNAPSE",
        candidateCount: findings.length,
        distribution: dist,
        top100: top100
    };

    const outPath = path.resolve(__dirname, 'top100_semantic_precision.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Semantic Precision Audit Result saved to: ${outPath}`);
}

if (require.main === module) {
    runSemanticPrecisionAudit();
}
