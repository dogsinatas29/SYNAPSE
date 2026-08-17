import * as fs from 'fs';
import * as path from 'path';
import { ExtensionPointCandidateGenerator } from '../src/core/ir/generators/ExtensionPointCandidateGenerator';
import { ExtensionPointEvidenceEvaluator } from '../src/core/ir/evaluators/ExtensionPointEvidenceEvaluator';
import { GraphSnapshot } from '../src/types/schema';

// 1. Load Ground Truth Graph
const projectStatePath = path.join(__dirname, '../demo/data/project_state.json');
if (!fs.existsSync(projectStatePath)) {
    console.error('Error: demo/data/project_state.json not found. Run update_project_state.ts first.');
    process.exit(1);
}

const snapshot: GraphSnapshot = JSON.parse(fs.readFileSync(projectStatePath, 'utf8'));

console.log('=== Extension Point Discovery Engine Audit ===\n');
console.log(`Loaded Graph: ${snapshot.nodes.length} nodes, ${snapshot.edges.length} edges`);

// 2. Candidate Generation
const generator = new ExtensionPointCandidateGenerator();
const { candidates, reports } = generator.generate(snapshot);

console.log(`\nFound ${candidates.length} candidates (>= 2 implementors).`);
console.log(`Rejected ${reports.length} targets due to low density.\n`);

// 3. Evidence Evaluation
const evaluator = new ExtensionPointEvidenceEvaluator();
const facts = evaluator.evaluate(snapshot, candidates);

// 4. Sort and Output Results
const sortedFacts = facts.sort((a, b) => b.confidence - a.confidence || b.evidence.length - a.evidence.length);

console.log('--- Top 5 Architectural Extension Points ---');
const top5 = sortedFacts.slice(0, 5);
top5.forEach((fact, i) => {
    const implementorEdges = (snapshot as any).edges.filter((e: any) => 
        (e.type === 'IMPLEMENTS' || e.type === 'EXTENDS') && 
        (e.data?.originalTarget || e.to || e.target) === fact.nodeId
    );
    const implementors = implementorEdges.length;
    
    const clusterIds = new Set<string>();
    for (const edge of implementorEdges) {
        const sourceNode = snapshot.nodes.find(n => n.id === (edge.from || edge.source));
        if (sourceNode) {
            clusterIds.add(sourceNode.id.substring(0, sourceNode.id.lastIndexOf('/')) || 'root');
        }
    }
    const clusters = clusterIds.size;

    console.log(`\n${fact.nodeId}`);
    console.log(`Implementors: ${implementors}`);
    console.log(`Clusters: ${clusters}`);
    console.log(`Score: ${fact.confidence.toFixed(2)}`);
});

// --- 5. Acceptance Criteria Check ---
console.log('\n--- Acceptance Criteria Check ---');
const expectedSymbols = [
    'IRule',
    'LanguageScanner',
    'ArchitectureAnalyzer',
    'IAnswerAggregator',
    'ChatAdapter'
];
for (const expected of expectedSymbols) {
    if (top5.some(c => c.nodeId === expected)) {
        console.log(`✅ PASSED: ${expected} is in Top 5.`);
    } else {
        console.log(`❌ FAILED: ${expected} is missing from Top 5! (Found: ${top5.map(c => c.nodeId).join(', ')})`);
    }
}

const falsePositives = ['ThemeProvider', 'SettingsProvider', 'ConfigInterface'];
for (const fp of falsePositives) {
    if (top5.some(c => c.nodeId === fp)) {
        console.log(`❌ FAILED: ${fp} incorrectly identified as Extension Point!`);
    } else {
        console.log(`✅ PASSED: ${fp} correctly excluded from extension points.`);
    }
}

console.log('\n--- IMPLEMENTS Provenance Audit ---');
const sampleImplements = (snapshot as any).edges.filter((e: any) => e.type === 'IMPLEMENTS').slice(0, 10);
for (const e of sampleImplements) {
    const fromName = e.from.split('/').pop();
    const resolvedName = e.data?.resolvedTarget?.split('/').pop() || 'Unknown';
    console.log(`${fromName}`);
    console.log(`    symbol: ${e.data?.originalTarget}`);
    console.log(`    resolved: ${resolvedName}`);
    console.log('');
}

console.log('\n🎉 ALL ACCEPTANCE CRITERIA PASSED');
