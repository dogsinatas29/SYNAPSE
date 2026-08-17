export enum ArchitecturalRole {
    STATE_OWNER = 'STATE_OWNER',
    POLICY_OWNER = 'POLICY_OWNER',
    CONTROLLER = 'CONTROLLER',
    ADAPTER = 'ADAPTER',
    VIEW = 'VIEW'
}

export enum AuthorityLevel {
    CANDIDATE = 'CANDIDATE',
    MAJOR = 'MAJOR',
    DOMINANT = 'DOMINANT'
}

export enum BoundaryType {
    BOUNDARY = 'BOUNDARY',
    CROSSING = 'CROSSING',
    VIOLATION = 'VIOLATION'
}

export enum ExtensionPointType {
    EXTENSION_POINT = 'EXTENSION_POINT',
    PRIMARY = 'PRIMARY',
    UNSAFE = 'UNSAFE'
}

export interface IArchitecturalConcept {
    id: string;
    nodeId: string;
}

export interface IRoleConcept extends IArchitecturalConcept {
    role: ArchitecturalRole;
}

export interface IAuthorityConcept extends IArchitecturalConcept {
    level: AuthorityLevel;
    authorityScore: number;
}

export interface IBoundaryConcept extends IArchitecturalConcept {
    type: BoundaryType;
    layer?: string;
}

export interface IExtensionConcept extends IArchitecturalConcept {
    type: ExtensionPointType;
}

export interface IFlowConcept extends IArchitecturalConcept {
    isSource: boolean;
    isSink: boolean;
}
