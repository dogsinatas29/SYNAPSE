export enum EvidenceCategory {
    STRUCTURAL = 'STRUCTURAL',
    STORAGE = 'STORAGE',
    MUTATION = 'MUTATION',
    READ = 'READ',
    VALIDATION = 'VALIDATION',
    DECISION = 'DECISION',
    DISPATCH = 'DISPATCH',
    ROUTING = 'ROUTING',
    UI_OUTPUT = 'UI_OUTPUT',
    BRIDGE = 'BRIDGE',
    ROLE_DENSITY = 'ROLE_DENSITY',
    DEPENDENCY = 'DEPENDENCY',
    REACHABILITY = 'REACHABILITY',
    DATA_FLOW_SEGMENT = 'DATA_FLOW_SEGMENT',
    CONTROL_FLOW_SEGMENT = 'CONTROL_FLOW_SEGMENT',
    PATH = 'PATH',
    COMMUNITY = 'COMMUNITY',
    BOUNDARY_STRENGTH = 'BOUNDARY_STRENGTH',
    CRITICALITY = 'CRITICALITY',
    EXTENSION = 'EXTENSION',
    BLAST_RADIUS = 'BLAST_RADIUS'
}


export interface IEvidence {
    id: string;
    category: EvidenceCategory;
    nodeId: string;
    description: string;
    metadata: Record<string, any>;
}

export interface IStructuralEvidence extends IEvidence {
    category: EvidenceCategory.STRUCTURAL;
    metadata: {
        degree?: number;
        inDegree?: number;
        outDegree?: number;
    };
}

export interface IStorageEvidence extends IEvidence {
    category: EvidenceCategory.STORAGE;
    metadata: {
        fieldCount: number;
    };
}

export interface IMutationEvidence extends IEvidence {
    category: EvidenceCategory.MUTATION;
    metadata: {
        mutationMethodCount: number;
    };
}

export interface IReadEvidence extends IEvidence {
    category: EvidenceCategory.READ;
    metadata: {
        readMethodCount: number;
    };
}

export interface IValidationEvidence extends IEvidence {
    category: EvidenceCategory.VALIDATION;
    metadata: {
        validationCallCount: number;
    };
}

export interface IDecisionEvidence extends IEvidence {
    category: EvidenceCategory.DECISION;
    metadata: {
        branchCount: number;
    };
}

export interface IDispatchEvidence extends IEvidence {
    category: EvidenceCategory.DISPATCH;
    metadata: {
        dispatchCallCount: number;
    };
}

export interface IRoutingEvidence extends IEvidence {
    category: EvidenceCategory.ROUTING;
    metadata: {
        routeCount: number;
    };
}

export interface IUIOutputEvidence extends IEvidence {
    category: EvidenceCategory.UI_OUTPUT;
    metadata: {
        renderCallCount: number;
    };
}

export interface IBridgeEvidence extends IEvidence {
    category: EvidenceCategory.BRIDGE;
    metadata: {
        crossLayerCallCount: number;
    };
}

export interface IRoleDensityEvidence extends IEvidence {
    category: EvidenceCategory.ROLE_DENSITY;
    metadata: {
        roles: string[];
        roleCount: number;
    };
}

export interface IDependencyEvidence extends IEvidence {
    category: EvidenceCategory.DEPENDENCY;
    metadata: {
        inboundDependencyCount: number;
        outboundDependencyCount: number;
        fanIn: number;
        fanOut: number;
    };
}

export interface IReachabilityEvidence extends IEvidence {
    category: EvidenceCategory.REACHABILITY;
    metadata: {
        mutationReach: number;
        decisionReach: number;
    };
}

export interface IDataFlowSegmentEvidence extends IEvidence {
    category: EvidenceCategory.DATA_FLOW_SEGMENT;
    metadata: {
        sourceId: string;
        targetId: string;
        edgeType: string; // e.g., 'return', 'inject'
        confidence: number;
    };
}

export interface IControlFlowSegmentEvidence extends IEvidence {
    category: EvidenceCategory.CONTROL_FLOW_SEGMENT;
    metadata: {
        sourceId: string;
        targetId: string;
        edgeType: string; // e.g., 'call', 'dispatch'
        confidence: number;
    };
}

export interface IPathEvidence extends IEvidence {
    category: EvidenceCategory.PATH;
    metadata: {
        pathNodes: string[];
        pathType: 'DATA' | 'CONTROL';
        segmentConfidenceProduct: number;
    };
}

export interface ICommunityEvidence extends IEvidence {
    category: EvidenceCategory.COMMUNITY;
    metadata: {
        communityId: string;
        nodeIds: string[];
        internalEdgeCount: number;
        externalEdgeCount: number;
        modularityScore: number;
    };
}

export interface IBoundaryStrengthEvidence extends IEvidence {
    category: EvidenceCategory.BOUNDARY_STRENGTH;
    metadata: {
        communityA: string;
        communityB: string;
        crossingEdgeCount: number;
        bridgeNodeIds: string[];
    };
}

export interface ICriticalityEvidence extends IEvidence {
    category: EvidenceCategory.CRITICALITY;
    metadata: {
        nodeId: string;
        authorityScore: number;
        pipelineParticipationCount: number;
        criticalPipelineCount: number;
        isBoundaryCrosser: boolean;
        isStateOwner: boolean;
        isPolicyOwner: boolean;
        isIsolatedIsland: boolean;
    };
}

export interface IExtensionEvidence extends IEvidence {
    category: EvidenceCategory.EXTENSION;
    metadata: {
        interfaceId: string;
        implementationIds: string[];
        implementationCount: number;
        consumerIds: string[];
        injectedIntoCount: number;
        registryIds: string[];
        hasRegistry: boolean;
        confidence: number;
    };
}

export interface IBlastRadiusEvidence extends IEvidence {
    category: EvidenceCategory.BLAST_RADIUS;
    metadata: {
        nodeId: string;
        affectedBoundaryIds: string[];
        affectedCoreNodeIds: string[];
        affectedPipelineIds: string[];
        affectedExtensionPointIds: string[];
        affectedBoundaryCount: number;
        affectedCoreCount: number;
        affectedPipelineCount: number;
        affectedExtensionPointCount: number;
        affectedExtensionImplementationCount: number;
        isBoundaryCrosser: boolean;
        isPipelineOwner: boolean;
        isPipelinePayloadDefinition: boolean;
        criticality: 'CORE' | 'SUPPORTING' | 'UTILITY';
        confidence: number;
    };
}


