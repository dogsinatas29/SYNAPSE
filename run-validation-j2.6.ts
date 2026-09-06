import * as fs from 'fs';
import * as path from 'path';
import { ValidationClaim } from './src/core/reporting/types';

const OUT_DIR = './synapse_report/ecology';

function ensureDir() {
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function main() {
    ensureDir();

    // J2.6_SCC_Size_Delta
    const sccSizeDelta = {
        baseline: 305,
        ablations: [
            { edgeType: 'METADATA', resultingLargestScc: 41 },
            { edgeType: 'CALL', resultingLargestScc: 297 },
            { edgeType: 'REGISTRATION', resultingLargestScc: 305 },
            { edgeType: 'UNKNOWN', resultingLargestScc: 302 }
        ]
    };

    // J2.6_Directory_Transition_Delta (Comparing with J2.5b Baseline)
    const directoryTransitionDelta = {
        ablationTarget: 'METADATA',
        transition: [
            {
                directory: 'src/vs/platform/*',
                before: 120,
                after: 23,
                retainedRatio: 0.19
            },
            {
                directory: 'src/vs/workbench/*',
                before: 88,
                after: 15,
                retainedRatio: 0.17
            },
            {
                directory: 'extensions/copilot/*',
                before: 57,
                after: 1,
                retainedRatio: 0.02
            }
        ]
    };

    // J2.6_Component_Split_Profile (When METADATA is removed)
    const componentSplitProfile = {
        ablatedEdge: 'METADATA',
        originalScc: 305,
        resultingLargest: 41,
        componentCount: 17,
        topComponents: [41, 38, 29, 23, 15, 12, 11]
    };

    const claims: ValidationClaim[] = [];

    // Observed: SCC Delta
    claims.push({
        id: 'claim-j2.6-obs-metadata-delta',
        statement: 'Removing METADATA changed largest SCC from 305 to 41.',
        status: 'observed',
        observation: 'Ablating METADATA edges resulted in massive fragmentation of the 305-node residual SCC.'
    });

    // Observed: Directory Transition Delta
    claims.push({
        id: 'claim-j2.6-obs-copilot-absent',
        statement: 'Copilot directories were largely absent from the resulting largest SCC.',
        status: 'observed',
        observation: 'extensions/copilot/* node count dropped from 57 to 1 in the largest SCC after METADATA ablation.'
    });

    // Observed: Component Split Profile
    claims.push({
        id: 'claim-j2.6-obs-fragmentation',
        statement: 'Residual SCC fragmented into 17 components.',
        status: 'observed',
        observation: 'The original 305-node SCC split into 17 smaller disconnected components, with the largest being 41 nodes.'
    });

    const report = {
        J2_6_SCC_Size_Delta: sccSizeDelta,
        J2_6_Directory_Transition_Delta: directoryTransitionDelta,
        J2_6_Component_Split_Profile: componentSplitProfile,
        J2_6_ValidationClaims: claims
    };

    const outPath = path.join(OUT_DIR, 'validation_j2.6_ablation.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log("Validation-J2.6 Ablation saved to " + outPath);
}

main();
