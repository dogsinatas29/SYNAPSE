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
    category?: string; // Ghost or External breakdown category
}

export interface GhostPolicyOutput {
    validReferences: ReferenceWithSource[];
    ghostBreakdown: Record<string, number>;
    externalBreakdown: Record<string, number>;
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
        const ghostBreakdown: Record<string, number> = {
            'GRAMMAR_REFERENCE': 0,
            'UNRESOLVED_IMPORT': 0,
            'DYNAMIC_IMPORT': 0,
            'GENERATED_REFERENCE': 0,
            'UNKNOWN_REFERENCE': 0
        };
        const externalBreakdown: Record<string, number> = {
            'NPM_PACKAGE': 0,
            'JAVA_PACKAGE': 0,
            'ANDROID_PACKAGE': 0,
            'PYTHON_PACKAGE': 0,
            'RUST_CRATE': 0,
            'VSCODE_API': 0
        };

        for (const item of summaries) {
            for (const ref of item.summary.references) {
                if (!ref.target) continue;

                let isBlacklisted = false;
                let category: string | undefined;

                if ((ref as any).fullPath) {
                    const lowerFullPath = ((ref as any).fullPath as string).toLowerCase();
                    if (lowerFullPath.includes('node_modules')) {
                        externalBreakdown['NPM_PACKAGE']++;
                        isBlacklisted = true;
                    } else if (lowerFullPath.startsWith('vscode')) {
                        externalBreakdown['VSCODE_API']++;
                        isBlacklisted = true;
                    } else if (this.packagePrefix.some(prefix => lowerFullPath.startsWith(prefix))) {
                        if (lowerFullPath.startsWith('java.') || lowerFullPath.startsWith('javax.') || lowerFullPath.startsWith('org.')) {
                            externalBreakdown['JAVA_PACKAGE']++;
                        } else if (lowerFullPath.startsWith('android.') || lowerFullPath.startsWith('androidx.') || lowerFullPath.startsWith('com.google.android.')) {
                            externalBreakdown['ANDROID_PACKAGE']++;
                        } else if (lowerFullPath.startsWith('kotlin')) {
                            externalBreakdown['JAVA_PACKAGE']++;
                        } else {
                            externalBreakdown['JAVA_PACKAGE']++;
                        }
                        isBlacklisted = true;
                    }
                }

                const lowerId = ref.target.toLowerCase();
                
                // Grammar reference filters
                if (!isBlacklisted && (
                    lowerId === '$self' || 
                    lowerId === '$base' || 
                    lowerId.startsWith('#') || 
                    lowerId.includes('#') ||
                    lowerId.startsWith('source.') || 
                    lowerId.startsWith('text.') ||
                    lowerId.includes('include:') ||
                    lowerId.includes('include ') ||
                    item.filePath.toLowerCase().endsWith('.tmlanguage.json')
                )) {
                    isBlacklisted = true;
                    ghostBreakdown['GRAMMAR_REFERENCE']++;
                }

                if (!isBlacklisted && this.exact.some(b => lowerId === b || lowerId.startsWith(b + '.'))) {
                    isBlacklisted = true;
                    ghostBreakdown['UNKNOWN_REFERENCE']++;
                }

                if (!isBlacklisted) {
                    // For now, references making it here are un-filtered CODE references or local unresolved.
                    validReferences.push({ sourceFilePath: item.filePath, ref: ref as RawReference, category });
                }
            }
        }

        return {
            validReferences,
            ghostBreakdown,
            externalBreakdown
        };
    }
}
