import * as fs from 'fs';
import * as path from 'path';

export enum ProjectEcosystem {
    NODE = 'NODE',
    LINUX = 'LINUX',
    ANDROID = 'ANDROID',
    UNKNOWN = 'UNKNOWN'
}

export enum ProjectDomain {
    IDE = 'IDE',
    OS_KERNEL = 'OS_KERNEL',
    BACKEND_API = 'BACKEND_API',
    ANDROID_APP = 'ANDROID_APP',
    UNKNOWN = 'UNKNOWN'
}

export interface ProfileEvidence {
    source: string;
    score: number;
}

export interface ProfileResolutionResult {
    status: 'RESOLVED' | 'UNKNOWN';
    ecosystem: ProjectEcosystem;
    domain: ProjectDomain;
    isVSCode: boolean;
    isLinux: boolean;
    isNestJS: boolean;
    isAntennaPod: boolean;
    confidence: number;
    evidence: ProfileEvidence[];
}

export class ProjectContextDetector {
    private static CONFIDENCE_THRESHOLD = 0.5; // 50% threshold

    static detect(workspaceRoot: string): ProfileResolutionResult {
        let isVSCode = false;
        let isLinux = false;
        let isNestJS = false;
        let isAntennaPod = false;
        
        let ecosystem = ProjectEcosystem.UNKNOWN;
        let domain = ProjectDomain.UNKNOWN;
        let confidence = 0;
        let evidence: ProfileEvidence[] = [];

        try {
            // Check for Linux Kernel
            const hasKbuild = fs.existsSync(path.join(workspaceRoot, 'Kbuild'));
            const hasKconfig = fs.existsSync(path.join(workspaceRoot, 'Kconfig'));
            const archPath = path.join(workspaceRoot, 'arch');
            const hasArchDir = fs.existsSync(archPath) && fs.statSync(archPath).isDirectory();
            
            let linuxScore = 0;
            let linuxEvidence: ProfileEvidence[] = [];
            if (hasKbuild) { linuxScore += 0.35; linuxEvidence.push({ source: 'Kbuild', score: 0.35 }); }
            if (hasKconfig) { linuxScore += 0.35; linuxEvidence.push({ source: 'Kconfig', score: 0.35 }); }
            if (hasArchDir) { linuxScore += 0.30; linuxEvidence.push({ source: 'arch/', score: 0.30 }); }

            if (linuxScore > confidence) {
                confidence = linuxScore;
                evidence = linuxEvidence;
                ecosystem = ProjectEcosystem.LINUX;
                domain = ProjectDomain.OS_KERNEL;
                isLinux = linuxScore >= this.CONFIDENCE_THRESHOLD;
            }

            // Check for Node Ecosystem
            const packageJsonPath = path.join(workspaceRoot, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                let nodeScore = 0.1; // Base node score for package.json
                
                // VSCode Check
                let vsCodeScore = 0;
                let vsCodeEvidence: ProfileEvidence[] = [{ source: 'package.json', score: 0.1 }];
                if (pkg.name === 'code-oss-dev' || pkg.name === 'vscode') {
                    vsCodeScore = nodeScore + 0.9;
                    vsCodeEvidence.push({ source: `package.name=${pkg.name}`, score: 0.9 });
                }
                
                if (vsCodeScore > confidence) {
                    confidence = vsCodeScore;
                    evidence = vsCodeEvidence;
                    ecosystem = ProjectEcosystem.NODE;
                    domain = ProjectDomain.IDE;
                    isVSCode = vsCodeScore >= this.CONFIDENCE_THRESHOLD;
                    isLinux = false; // Reset if we beat it
                }
                
                // NestJS Check
                const nestCliPath = path.join(workspaceRoot, 'nest-cli.json');
                const hasNestCli = fs.existsSync(nestCliPath);
                const hasNestCore = pkg.dependencies && pkg.dependencies['@nestjs/core'];
                
                let nestScore = nodeScore;
                let nestEvidence: ProfileEvidence[] = [{ source: 'package.json', score: 0.1 }];
                if (hasNestCli) { nestScore += 0.4; nestEvidence.push({ source: 'nest-cli.json', score: 0.4 }); }
                if (hasNestCore) { nestScore += 0.5; nestEvidence.push({ source: '@nestjs/core', score: 0.5 }); }

                if (nestScore > confidence) {
                    confidence = nestScore;
                    evidence = nestEvidence;
                    ecosystem = ProjectEcosystem.NODE;
                    domain = ProjectDomain.BACKEND_API;
                    isNestJS = nestScore >= this.CONFIDENCE_THRESHOLD;
                    isVSCode = false;
                    isLinux = false;
                }
            }

            // Check for Android (AntennaPod)
            const hasBuildGradle = fs.existsSync(path.join(workspaceRoot, 'build.gradle')) || fs.existsSync(path.join(workspaceRoot, 'build.gradle.kts'));
            const appBuildGradle = fs.existsSync(path.join(workspaceRoot, 'app', 'build.gradle')) || fs.existsSync(path.join(workspaceRoot, 'app', 'build.gradle.kts'));
            const hasSettingsGradle = fs.existsSync(path.join(workspaceRoot, 'settings.gradle')) || fs.existsSync(path.join(workspaceRoot, 'settings.gradle.kts'));
            
            let androidScore = 0;
            let androidEvidence: ProfileEvidence[] = [];
            
            if (hasBuildGradle) { androidScore += 0.1; androidEvidence.push({ source: 'build.gradle', score: 0.1 }); }
            if (hasSettingsGradle) { androidScore += 0.1; androidEvidence.push({ source: 'settings.gradle', score: 0.1 }); }
            if (appBuildGradle) { androidScore += 0.1; androidEvidence.push({ source: 'app/build.gradle', score: 0.1 }); }
            
            const coreManifest = path.join(workspaceRoot, 'core', 'src', 'main', 'AndroidManifest.xml');
            const appManifest = path.join(workspaceRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
            
            if (fs.existsSync(coreManifest)) {
                androidScore += 0.2; androidEvidence.push({ source: 'core/AndroidManifest.xml', score: 0.2 });
                const content = fs.readFileSync(coreManifest, 'utf8');
                if (content.includes('de.danoeh.antennapod')) {
                    androidScore += 0.5; androidEvidence.push({ source: 'de.danoeh.antennapod in core', score: 0.5 });
                }
            } else if (fs.existsSync(appManifest)) {
                androidScore += 0.2; androidEvidence.push({ source: 'app/AndroidManifest.xml', score: 0.2 });
                const content = fs.readFileSync(appManifest, 'utf8');
                if (content.includes('de.danoeh.antennapod')) {
                    androidScore += 0.5; androidEvidence.push({ source: 'de.danoeh.antennapod in app', score: 0.5 });
                }
            }
            
            if (androidScore > confidence) {
                confidence = androidScore;
                evidence = androidEvidence;
                ecosystem = ProjectEcosystem.ANDROID;
                domain = ProjectDomain.ANDROID_APP;
                isAntennaPod = androidScore >= this.CONFIDENCE_THRESHOLD;
                isLinux = false;
                isVSCode = false;
                isNestJS = false;
            }

        } catch (e) {
            console.warn(`[ProjectContextDetector] Error detecting project context:`, e);
        }

        // Confidence Gate
        const status = confidence >= this.CONFIDENCE_THRESHOLD ? 'RESOLVED' : 'UNKNOWN';

        return {
            status,
            ecosystem: status === 'RESOLVED' ? ecosystem : ProjectEcosystem.UNKNOWN,
            domain: status === 'RESOLVED' ? domain : ProjectDomain.UNKNOWN,
            isVSCode: status === 'RESOLVED' ? isVSCode : false,
            isLinux: status === 'RESOLVED' ? isLinux : false,
            isNestJS: status === 'RESOLVED' ? isNestJS : false,
            isAntennaPod: status === 'RESOLVED' ? isAntennaPod : false,
            confidence: Math.min(1.0, confidence),
            evidence
        };
    }
}
