import { SemanticProfile } from './SemanticProfile';
import { ProjectEcosystem, ProjectDomain } from '../ProjectContextDetector';

export class NestJSProfile implements SemanticProfile {
    ecosystem = ProjectEcosystem.NODE;
    domain = ProjectDomain.BACKEND_API;
    
    entryPointSearchZones = [
        'src/',
        'app/'
    ];
    
    corePlatformZones = [
        'node_modules/@nestjs/',
        'node_modules/express/',
        'node_modules/fastify/'
    ];

    evidenceSymbols = [
        'bootstrap',
        'NestFactory.create'
    ];
}
