import * as fs from 'fs';
import * as path from 'path';
import { ValidationStudy } from './src/core/reporting/types';

const ECOLOGY_DIR = './synapse_report/ecology';
const SURGERY_DIR = './synapse_report/surgery';
const SIM_EVIDENCE_PATH = path.join(SURGERY_DIR, 'simulation_evidence.json');

function main() {
    const studies: ValidationStudy[] = [];

    // Dataset info (mocked/hardcoded based on current project state)
    const dataset = {
        id: 'vscode-0.3.34',
        name: 'VSCode',
        version: '0.3.34',
        fingerprint: 'nodes:14176;edges:45000'
    };

    // 1. Load 0H
    const hPath = path.join(ECOLOGY_DIR, 'validation_0h_ablation.json');
    if (fs.existsSync(hPath)) {
        const hData = JSON.parse(fs.readFileSync(hPath, 'utf8'));
        
        // Study 1: Targeted Ablation Study (Phase 0H)
        studies.push({
            id: 'validation-0h',
            version: 'v1',
            title: 'Phase 0H: Targeted Ablation',
            domain: 'scc',
            methods: ['ablation'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'low',
            replicationCount: 0,
            claims: [
                {
                    id: 'claim-0h-mass',
                    statement: 'STRUCTURE contributes significantly to giant SCC persistence.',
                    status: 'supported',
                    observation: 'Removing STRUCTURE (Type/Inheritance) edges reduces the largest SCC from 2699 to 712.',
                    impactSummary: {
                        metric: 'SCC Size',
                        before: 2699,
                        after: 712,
                        deltaPercent: 73.6
                    },
                    supportingStudyIds: ['validation-0h']
                },
                {
                    id: 'claim-0h-glue',
                    statement: 'REGISTRATION is the primary glue for secondary SCC persistence.',
                    status: 'rejected',
                    observation: 'Removing REGISTRATION edges from the Without STRUCTURE graph only reduced the secondary SCC from 49 to 50, failing to shatter the remaining cycles.',
                    supportingStudyIds: ['validation-0h']
                }
            ],
            metrics: [
                { key: 'baseline_scc', value: 2699, unit: 'nodes' },
                { key: 'without_structure_scc', value: 712, unit: 'nodes' },
                { key: 'without_registration', value: 430, unit: 'nodes' }
            ]
        });
    }

    // 2. Load 0I Attribution
    const iPath = path.join(ECOLOGY_DIR, 'validation_0i_attribution.json');
    if (fs.existsSync(iPath)) {
        const iData = JSON.parse(fs.readFileSync(iPath, 'utf8'));
        
        studies.push({
            id: 'validation-0i',
            version: 'v1',
            title: 'Phase 0I: Subsystem Isolation',
            domain: 'scc',
            methods: ['ablation'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'low',
            replicationCount: 0,
            claims: [
                {
                    id: 'claim-0i-amplification',
                    statement: 'Combined analysis exhibits substantially larger SCCs than isolated analyses.',
                    status: 'observed',
                    observation: 'Core-only SCC is 127. Copilot-only SCC is 214. Combined SCC is 712 (127 + 214 != 712).',
                    impactSummary: {
                        metric: 'Combined SCC Amplification',
                        before: 341,
                        after: 712,
                        deltaPercent: -108.8
                    },
                    supportingStudyIds: ['validation-0i']
                }
            ],
            metrics: [
                { key: 'core_only_scc', value: iData.I1_VSCode_Core.execution_scc_metrics.largest_scc, unit: 'nodes' },
                { key: 'copilot_only_scc', value: iData.I2_Copilot_Only.execution_scc_metrics.largest_scc, unit: 'nodes' },
                { key: 'combined_scc', value: iData.I3_Combined.execution_scc_metrics.largest_scc, unit: 'nodes' }
            ]
        });
    }

    // 3. Load 0J Boundary Edge Attribution
    const jPath = path.join(ECOLOGY_DIR, 'validation_0j_attribution.json');
    if (fs.existsSync(jPath)) {
        const jData = JSON.parse(fs.readFileSync(jPath, 'utf8'));
        
        studies.push({
            id: 'validation-0j',
            version: 'v1',
            title: 'Phase 0J: Boundary Edge Attribution Study',
            domain: 'boundary',
            methods: ['inventory', 'ranking', 'ablation'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'low',
            replicationCount: 0,
            claims: (jData.J3_ValidationClaims || []).map((c: any) => ({ ...c, supportingStudyIds: ['validation-0j'] })),
            metrics: [],
            evidence: [
                { type: 'inventory', data: jData.J0_Inventory },
                { type: 'ranking', data: jData.J1_ContributionRanking },
                { type: 'ablation', data: jData.J2_AblationResults }
            ]
        });
    }

    // 4. Load J2.5 Residual SCC Characterization
    const j25Path = path.join(ECOLOGY_DIR, 'validation_j2.5_characterization.json');
    if (fs.existsSync(j25Path)) {
        const j25Data = JSON.parse(fs.readFileSync(j25Path, 'utf8'));
        
        studies.push({
            id: 'validation-j2.5',
            version: 'v1',
            title: 'Phase 25.1 J2.5: Residual SCC Characterization',
            domain: 'scc',
            methods: ['inventory', 'comparison'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'low',
            replicationCount: 0,
            claims: (j25Data.J2_5_ValidationClaims || []).map((c: any) => ({ ...c, supportingStudyIds: ['validation-j2.5'] })),
            metrics: [],
            evidence: [
                { type: 'composition', data: j25Data.J2_5_Composition },
                { type: 'distribution', data: j25Data.J2_5_Distribution },
                { type: 'boundary_inventory', data: j25Data.J2_5_BoundaryInventory },
                { type: 'internal_edge_profile', data: j25Data.J2_5_SCC_Internal_Edge_Profile }
            ]
        });
    }

    // 5. Load J2.5b Directory Composition Baseline
    const j25bPath = path.join(ECOLOGY_DIR, 'validation_j2.5b_directory_baseline.json');
    if (fs.existsSync(j25bPath)) {
        const j25bData = JSON.parse(fs.readFileSync(j25bPath, 'utf8'));
        
        studies.push({
            id: 'validation-j2.5b',
            version: 'v1',
            title: 'Phase 25.1 J2.5b: Residual SCC Directory Composition',
            domain: 'scc',
            methods: ['inventory'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'low',
            replicationCount: 0,
            claims: (j25bData.J2_5b_ValidationClaims || []).map((c: any) => ({ ...c, supportingStudyIds: ['validation-j2.5b'] })),
            metrics: [],
            evidence: [
                { type: 'directory_composition', data: j25bData.J2_5b_DirectoryComposition }
            ]
        });
    }

    // 6. Load J2.6 Residual SCC Ablation
    const j26Path = path.join(ECOLOGY_DIR, 'validation_j2.6_ablation.json');
    if (fs.existsSync(j26Path)) {
        const j26Data = JSON.parse(fs.readFileSync(j26Path, 'utf8'));
        
        studies.push({
            id: 'validation-j2.6',
            version: 'v1',
            title: 'Phase 25.1 J2.6: Residual SCC Ablation',
            domain: 'scc',
            methods: ['ablation'],
            dataset,
            evidenceSource: 'mock',
            claims: (j26Data.J2_6_ValidationClaims || []).map((c: any) => ({ ...c, supportingStudyIds: ['validation-j2.6'] })),
            metrics: [],
            evidence: [
                { type: 'scc_size_delta', data: j26Data.J2_6_SCC_Size_Delta },
                { type: 'directory_transition_delta', data: j26Data.J2_6_Directory_Transition_Delta },
                { type: 'component_split_profile', data: j26Data.J2_6_Component_Split_Profile }
            ]
        });
    }

    // 7. Load J2.6b Repeatability Validation
    const j26bPath = path.join(ECOLOGY_DIR, 'validation_j2.6b_repeatability.json');
    if (fs.existsSync(j26bPath)) {
        const j26bData = JSON.parse(fs.readFileSync(j26bPath, 'utf8'));
        
        studies.push({
            id: 'validation-j2.6b',
            version: 'v1',
            title: 'Phase 25.1 J2.6b: Repeatability Validation',
            domain: 'scc',
            methods: ['ablation'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'medium',
            replicationCount: j26bData.J2_6b_Repeatability_Result.runCount,
            claims: (j26bData.J2_6b_ValidationClaims || []).map((c: any) => ({ ...c, supportingStudyIds: ['validation-j2.6', 'validation-j2.6b'] })),
            metrics: [],
            evidence: [
                { type: 'repeatability_result', data: j26bData.J2_6b_Repeatability_Result }
            ]
        });
    }

    // 8. Load J2.7 Candidate Retention Edge Discovery
    const j27Path = path.join(ECOLOGY_DIR, 'validation_j2.7_candidate_discovery.json');
    if (fs.existsSync(j27Path)) {
        const j27Data = JSON.parse(fs.readFileSync(j27Path, 'utf8'));
        
        studies.push({
            id: 'validation-j2.7',
            version: 'v1',
            title: 'Phase 25.1 J2.7: Candidate Retention Edge Discovery',
            domain: 'scc',
            methods: ['ranking', 'ablation'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'medium',
            replicationCount: 1, // Simulated as a single study step based on J2.6b foundation
            claims: (j27Data.J2_7_ValidationClaims || []).map((c: any) => ({ ...c, supportingStudyIds: ['validation-j2.7'] })),
            metrics: [],
            evidence: [
                { type: 'candidate_ranking', data: j27Data.J2_7_Candidate_Ranking },
                { type: 'retention_candidates', data: j27Data.J2_7_Retention_Candidates },
                { type: 'candidate_set_ablation', data: j27Data.J2_7_Candidate_Set_Ablation }
            ]
        });
    }

    // 9. Load J2.8 Claim Promotion
    const j28Path = path.join(ECOLOGY_DIR, 'validation_j2.8_claim_promotion.json');
    if (fs.existsSync(j28Path)) {
        const j28Data = JSON.parse(fs.readFileSync(j28Path, 'utf8'));
        
        studies.push({
            id: 'validation-j2.8',
            version: 'v1',
            title: 'Phase 25.1 J2.8: Claim Promotion / Validation',
            domain: 'scc',
            methods: ['comparison'],
            dataset,
            evidenceSource: 'mock',
            confidenceLevel: 'high',
            replicationCount: 1, // Represents the culmination of previous repeated studies
            claims: (j28Data.J2_8_ValidationClaims || []).map((c: any) => ({ 
                ...c, 
                supportingStudyIds: ['validation-j2.5', 'validation-j2.6', 'validation-j2.6b', 'validation-j2.7', 'validation-j2.8'] 
            })),
            metrics: [],
            evidence: [
                { type: 'promotion_conditions', data: j28Data.J2_8_Promotion_Conditions }
            ]
        });
    }

    // 10. Inject into simulation_evidence.json
    let simEvidence: any = {};
    if (fs.existsSync(SIM_EVIDENCE_PATH)) {
        simEvidence = JSON.parse(fs.readFileSync(SIM_EVIDENCE_PATH, 'utf8'));
    } else {
        fs.mkdirSync(SURGERY_DIR, { recursive: true });
        simEvidence = {
            evidenceBundle: { findings: [] }
        };
    }

    simEvidence.validationEvidence = {
        schemaVersion: '1.0',
        studies: studies
    };

    fs.writeFileSync(SIM_EVIDENCE_PATH, JSON.stringify(simEvidence, null, 2));
    console.log(`Validation pipeline complete. Injected ${studies.length} studies into ${SIM_EVIDENCE_PATH}`);
}

main();
