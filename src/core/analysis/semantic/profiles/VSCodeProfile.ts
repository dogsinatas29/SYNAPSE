import { SemanticProfile } from './SemanticProfile';
import { ProjectEcosystem, ProjectDomain } from '../ProjectContextDetector';

export class VSCodeProfile implements SemanticProfile {
    ecosystem = ProjectEcosystem.NODE;
    domain = ProjectDomain.IDE;
    
    entryPointSearchZones = [
        'src/main.js',
        'src/vs/server/node/server.main.ts',
        'src/vs/code/electron-main/main.ts'
    ];
    
    corePlatformZones = [
        'src/vs/base/',
        'src/vs/platform/',
        'src/vs/workbench/',
        'src/vs/editor/'
    ];

    evidenceSymbols = [
        'main',
        'startup'
    ];
}
