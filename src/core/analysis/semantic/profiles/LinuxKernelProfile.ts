import { SemanticProfile } from './SemanticProfile';
import { ProjectEcosystem, ProjectDomain } from '../ProjectContextDetector';

export class LinuxKernelProfile implements SemanticProfile {
    ecosystem = ProjectEcosystem.LINUX;
    domain = ProjectDomain.OS_KERNEL;
    
    entryPointSearchZones = [
        'init/',
        'arch/'
    ];
    
    corePlatformZones = [
        'kernel/',
        'mm/',
        'fs/',
        'ipc/',
        'security/',
        'crypto/',
        'block/'
    ];

    evidenceSymbols = [
        'start_kernel',
        'rest_init',
        'kernel_init',
        'do_basic_setup'
    ];
}
