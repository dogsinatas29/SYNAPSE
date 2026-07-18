export type ExternalOriginType =
    | 'IncludeReference'
    | 'ImportReference'
    | 'PackageReference'
    | 'ToolchainReference'
    | 'DocumentationReference'
    | 'CommandArgument'
    | 'LicenseToken'
    | 'ShellLiteral'
    | 'Unknown';

export type ExternalEcosystem =
    | 'C_RUNTIME'
    | 'PYTHON'
    | 'RUST'
    | 'TOOLCHAIN'
    | 'PACKAGE'
    | 'NODE'
    | 'ELECTRON'
    | 'DOCUMENTATION'
    | 'UNKNOWN';

export type ExternalSubgroup =
    | 'C_RUNTIME'
    | 'PYTHON'
    | 'RUST'
    | 'NODE'
    | 'DOCUMENTATION'
    | 'TOOLCHAIN'
    | 'UNKNOWN';

export interface ExternalReferenceSemantic {
    external_origin_type: ExternalOriginType;
    external_ecosystem: ExternalEcosystem;
    external_subgroup: ExternalSubgroup;
}

function ecosystemToSubgroup(ecosystem: ExternalEcosystem): ExternalSubgroup {
    switch (ecosystem) {
        case 'C_RUNTIME':
            return 'C_RUNTIME';
        case 'PYTHON':
            return 'PYTHON';
        case 'RUST':
            return 'RUST';
        case 'NODE':
        case 'ELECTRON':
        case 'PACKAGE':
            return 'NODE';
        case 'DOCUMENTATION':
            return 'DOCUMENTATION';
        case 'TOOLCHAIN':
            return 'TOOLCHAIN';
        default:
            return 'UNKNOWN';
    }
}

export const DEFAULT_EXTERNAL_SEMANTIC: ExternalReferenceSemantic = {
    external_origin_type: 'Unknown',
    external_ecosystem: 'UNKNOWN',
    external_subgroup: 'UNKNOWN'
};

export function makeExternalSemantic(
    originType: ExternalOriginType,
    ecosystem: ExternalEcosystem
): ExternalReferenceSemantic {
    return {
        external_origin_type: originType,
        external_ecosystem: ecosystem,
        external_subgroup: ecosystemToSubgroup(ecosystem)
    };
}
