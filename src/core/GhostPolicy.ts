import { CodeSummary } from './FileScanner';

export interface RawReference {
    target: string;
    type: string;
    fullPath?: string;
    [key: string]: any;
}

export interface ReferenceWithSource {
    sourceFilePath: string;
    ref: RawReference;
}

export interface GhostPolicyOutput {
    validReferences: ReferenceWithSource[];
    packageFilteredCount: number;
    exactFilteredCount: number;
}

export class GhostPolicy {
    private static readonly packagePrefix = [
        'android.', 'androidx.', 'java.', 'javax.', 'kotlin.', 'kotlinx.collections.', 'kotlinx.atomicfu.', 'kotlinx.datetime.',
        'org.junit.', 'org.mockito.', 'com.bumptech.glide.', 'org.greenrobot.eventbus.', 'com.google.android.'
    ];

    private static readonly exact = [
        'os', 'sys', 'math', 'json', 'datetime', 'vscode', 'path', 'fs',
        'context', 'nonnull', 'list', 'log', 'arraylist', 'nullable', 'r', 'view',
        'bundle', 'layoutinflater', 'collections', 'schedulers', 'eventbus',
        'ioexception', 'androidschedulers', 'test', 'disposable', 'date',
        'textutils', 'intent', 'locale', 'materialalertdialogbuilder', 'static',
        'string', 'object'
    ];

    public static filter(summaries: { filePath: string; summary: CodeSummary }[]): GhostPolicyOutput {
        const validReferences: ReferenceWithSource[] = [];
        let packageFilteredCount = 0;
        let exactFilteredCount = 0;

        for (const item of summaries) {
            for (const ref of item.summary.references) {
                if (!ref.target) continue;

                let isBlacklisted = false;

                if ((ref as any).fullPath) {
                    const lowerFullPath = ((ref as any).fullPath as string).toLowerCase();
                    if (this.packagePrefix.some(prefix => lowerFullPath.startsWith(prefix))) {
                        isBlacklisted = true;
                        packageFilteredCount++;
                    }
                }

                const lowerId = ref.target.toLowerCase();
                if (!isBlacklisted && this.exact.some(b => lowerId === b || lowerId.startsWith(b + '.'))) {
                    isBlacklisted = true;
                    exactFilteredCount++;
                }

                if (!isBlacklisted) {
                    validReferences.push({ sourceFilePath: item.filePath, ref: ref as RawReference });
                }
            }
        }

        return {
            validReferences,
            packageFilteredCount,
            exactFilteredCount
        };
    }
}
