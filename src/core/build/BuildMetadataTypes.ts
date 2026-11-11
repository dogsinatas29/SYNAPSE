// encoding: utf-8
/**
 * SYNAPSE EXP-C Track B: Build Metadata Contracts
 * Responsibilities: Isolation of build configuration parsing and declaration fact structures.
 */

export type BuildEcosystem = 'CARGO' | 'NPM' | 'PYTHON' | 'CMAKE' | 'GN';

export interface DeclaredDependencyFact {
    readonly ecosystem: BuildEcosystem;
    readonly sourceBuildFile: string;
    readonly rawDeclaredName: string;
    readonly normalizedName: string;
    readonly dependencyType: 'NORMAL' | 'BUILD' | 'DEV' | 'PATH_LOCAL' | 'WORKSPACE_MEMBER';
    readonly targetScope: string;
    readonly targetPath?: string;
    readonly parseStatus: 'SUCCESS' | 'PARTIAL' | 'UNPARSED_SYNTAX' | 'INVALID_DECLARATION';
    readonly sourceSpan?: { startLine: number; endLine: number } | null;
}

export interface JsPackageScope {
    dirRel: string;
    externalPackages: Set<string>;
}

export interface PyPackageScope {
    dirRel: string;
    externalPackages: Set<string>;
}

export interface BuildMetadataResult {
    readonly projectRoot: string;
    readonly rustCrateMap: Map<string, string>;
    readonly rustExternalPackages: Set<string>;
    readonly jsLocalPackages: Map<string, string>;
    readonly jsPackageScopes: JsPackageScope[];
    readonly pyPackageScopes: PyPackageScope[];
    readonly facts: DeclaredDependencyFact[];
}

// Known standard canonical aliases (import identifier -> distribution package name)
export const pyImportToDistAliases: Record<string, string> = {
    'yaml': 'pyyaml',
    'pil': 'pillow',
    'cv2': 'opencv-python',
    'bs4': 'beautifulsoup4',
    'dotenv': 'python-dotenv',
    'dateutil': 'python-dateutil',
    'magic': 'python-magic',
    'serial': 'pyserial'
};

