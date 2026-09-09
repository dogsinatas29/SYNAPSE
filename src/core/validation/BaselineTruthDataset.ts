export interface EntryTruth {
    expectedEntryFile: string;
    expectedEntrySymbol: string;
    confidence: 'CANONICAL' | 'HEURISTIC';
}

export interface SemanticTruth {
    pattern: string | RegExp;
    expectedRole: string;
    confidence: 'CANONICAL' | 'HEURISTIC';
}

export interface BaselineTruth {
    projectId: string; // Matches SemanticProfile.profileId
    entryPoints: EntryTruth[];
    semanticTruths: SemanticTruth[];
}

export class BaselineTruthDataset {
    private static datasets = new Map<string, BaselineTruth>([
        ['linux-kernel-7.x', {
            projectId: 'linux-kernel-7.x',
            entryPoints: [
                {
                    expectedEntryFile: 'init/main.c',
                    expectedEntrySymbol: 'start_kernel',
                    confidence: 'CANONICAL'
                }
            ],
            semanticTruths: [
                {
                    pattern: /^arch\//,
                    expectedRole: 'PLATFORM',
                    confidence: 'CANONICAL'
                }
            ]
        }],
        ['vscode-oss', {
            projectId: 'vscode-oss',
            entryPoints: [
                {
                    expectedEntryFile: 'src/main.js',
                    expectedEntrySymbol: 'main',
                    confidence: 'CANONICAL'
                }
            ],
            semanticTruths: [
                {
                    pattern: /^src\/vs\/base\//,
                    expectedRole: 'PLATFORM',
                    confidence: 'CANONICAL'
                }
            ]
        }],
        ['vscode-extension', {
            projectId: 'vscode-extension',
            entryPoints: [
                {
                    expectedEntryFile: 'src/extension.ts',
                    expectedEntrySymbol: 'activate',
                    confidence: 'CANONICAL'
                }
            ],
            semanticTruths: []
        }],
        ['nestjs-backend', {
            projectId: 'nestjs-backend',
            entryPoints: [
                {
                    expectedEntryFile: 'src/main.ts',
                    expectedEntrySymbol: 'bootstrap',
                    confidence: 'CANONICAL'
                }
            ],
            semanticTruths: []
        }],
        ['antennapod', {
            projectId: 'antennapod',
            entryPoints: [], // Heuristics can be added later
            semanticTruths: []
        }]
    ]);

    static getTruth(profileId: string): BaselineTruth | undefined {
        return this.datasets.get(profileId);
    }
}
