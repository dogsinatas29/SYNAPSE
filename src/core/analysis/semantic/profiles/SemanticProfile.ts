import { ProjectEcosystem, ProjectDomain } from '../ProjectContextDetector';

export interface SemanticProfile {
    /** Target ecosystem this profile applies to */
    ecosystem: ProjectEcosystem;
    
    /** Target domain this profile applies to */
    domain: ProjectDomain;
    
    /** Directory paths that likely contain entry point or core initialization logic (Search Zones) */
    entryPointSearchZones: string[];
    
    /** Directory paths that likely contain core framework/platform logic */
    corePlatformZones: string[];

    /** Expected key symbols (to be used as Evidence by SymbolResolver) */
    evidenceSymbols: string[];
}
