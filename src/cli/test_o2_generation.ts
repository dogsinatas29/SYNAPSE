import * as fs from 'fs';
import { ValidationContext, GraphSnapshot } from '../core/validation/ValidationContext';
import { ValidationReportBuilder } from '../core/validation/ValidationReportBuilder';
import { OnboardingAnalyzer } from '../core/reporting/OnboardingAnalyzer';

const data = JSON.parse(fs.readFileSync('/home/dogsinatas/다운로드/rustdesk-master/synapse_data/project_state.json', 'utf8'));
const snapshot: GraphSnapshot = {
    nodes: data.nodes || (data.graph && data.graph.nodes) || [],
    edges: data.edges || (data.graph && data.graph.edges) || [],
    clusters: data.clusters || []
};
const context = { snapshot, metrics: { topImpactFiles: [] }, workspaceRoot: '/home/dogsinatas/다운로드/rustdesk-master' } as any;

const analyzer = new OnboardingAnalyzer();
const path = analyzer.extractPath(context);
const epFindings = (path.findings || []).filter(f => f.patternId === 'DEPENDENCY_ROOT');
console.log("EP Findings:", epFindings.length);

// See if ValidationReportBuilder generates O2 correctly
ValidationReportBuilder.generateReports(context, 'TEST');
console.log("Generated reports successfully.");
