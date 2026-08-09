import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../utils/Logger';
import { ProjectMetadata } from '../ProjectMetadata';
import { HarvestCandidate, HarvestFailure, HarvestFailureReason } from '../../types/schema';

export interface HarvestResult {
    projectUUID: string;
    harvestedAt: number;
    clientsPath: string;
    harvestedClients: string[];
    filesHarvested: number;
    foldersCreated: number;
    harvestedFiles: string[];
    failedFiles: HarvestFailure[];
}

export class HarvestEngine {
    private static instance: HarvestEngine;

    static getInstance(): HarvestEngine {
        if (!HarvestEngine.instance) {
            HarvestEngine.instance = new HarvestEngine();
        }
        return HarvestEngine.instance;
    }

    async harvest(candidates: HarvestCandidate[], getFileContentCallback: (userId: string, filePath: string) => Promise<string>, onProgress?: (msg: string, percent: number) => void): Promise<HarvestResult> {
        const projectRoot = ProjectMetadata.getInstance().getProjectRoot();
        const clientsPath = path.join(projectRoot, '.synapse', 'clients');

        Logger.info(`[v0.3.30] Harvest starting: Processing ${candidates.length} approved files`);

        if (!fs.existsSync(clientsPath)) {
            fs.mkdirSync(clientsPath, { recursive: true });
        }

        const harvestedFiles: string[] = [];
        const failedFiles: HarvestFailure[] = [];
        const createdFolders = new Set<string>();
        const harvestedClients = new Set<string>();

        let processedCount = 0;
        const totalCount = candidates.length;

        for (const candidate of candidates) {
            processedCount++;
            if (onProgress && (processedCount % 5 === 0 || processedCount === totalCount)) {
                const percent = Math.floor((processedCount / totalCount) * 100);
                onProgress(`Harvesting... ${processedCount} / ${totalCount} files`, percent);
            }
            // [SYN-SEC-013] Prevent Arbitrary File Write via malicious clientUsername
            if (!candidate.clientUsername || !/^[a-zA-Z0-9_-]{1,64}$/.test(candidate.clientUsername)) {
                Logger.warn(`[v0.3.30] Harvest rejected: Invalid clientUsername format '${candidate.clientUsername}'`);
                failedFiles.push({ candidate, reason: 'PATH_TRAVERSAL', detail: 'Invalid clientUsername' });
                continue;
            }
            
            // [SYN-SEC-010] Prevent Path Traversal in paths
            if (candidate.targetPath.includes('../') || candidate.targetPath.includes('..\\') ||
                candidate.sourcePath.includes('../') || candidate.sourcePath.includes('..\\')) {
                Logger.warn(`[v0.3.30] Harvest rejected: Path Traversal attempt`);
                failedFiles.push({ candidate, reason: 'PATH_TRAVERSAL', detail: 'Path contains directory traversal characters' });
                continue;
            }

            const clientRoot = path.join(clientsPath, candidate.clientUsername);
            const clientHarvestDir = path.join(clientRoot, 'harvest');
            
            // User Root Structure
            if (!fs.existsSync(clientRoot)) {
                fs.mkdirSync(path.join(clientRoot, 'harvest'), { recursive: true });
                fs.mkdirSync(path.join(clientRoot, 'snapshots'), { recursive: true });
                fs.mkdirSync(path.join(clientRoot, 'cache'), { recursive: true });
                fs.writeFileSync(path.join(clientRoot, 'metadata.json'), JSON.stringify({ createdAt: Date.now(), username: candidate.clientUsername }), 'utf8');
                createdFolders.add(clientRoot);
            }

            let resolvedTarget = path.resolve(clientHarvestDir, candidate.targetPath);
            if (!resolvedTarget.startsWith(clientHarvestDir + path.sep) && resolvedTarget !== clientHarvestDir) {
                Logger.warn(`[v0.3.30] Harvest path traversal denied: ${candidate.targetPath}`);
                failedFiles.push({ candidate, reason: 'PATH_TRAVERSAL', detail: 'Target path escapes client harvest layer' });
                continue;
            }

            const targetDir = path.dirname(resolvedTarget);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
                createdFolders.add(targetDir);
            }

            // [SYN-SEC-011] Symlink Escape Defense
            try {
                const realDir = fs.realpathSync(targetDir);
                const realHarvestDir = fs.realpathSync(clientHarvestDir);
                if (!realDir.startsWith(realHarvestDir)) {
                    throw new Error('Symlink escape detected');
                }
                resolvedTarget = path.join(realDir, path.basename(resolvedTarget));
            } catch (e: any) {
                Logger.warn(`[v0.3.30] Harvest symlink escape denied: ${candidate.targetPath}`);
                failedFiles.push({ candidate, reason: 'PATH_TRAVERSAL', detail: 'Symlink escape detected' });
                continue;
            }



            try {
                const content = await getFileContentCallback(candidate.userId, candidate.sourcePath);
                fs.writeFileSync(resolvedTarget, content);
                harvestedFiles.push(candidate.targetPath);
                harvestedClients.add(candidate.clientUsername);
            } catch (err: any) {
                const errorStr = String(err);
                let reason: HarvestFailureReason = 'UNKNOWN';
                if (errorStr.includes('Timeout') || errorStr.includes('timeout')) {
                    reason = 'SSE_TIMEOUT';
                } else if (errorStr.includes('EACCES') || errorStr.includes('ENOENT')) {
                    reason = 'WRITE_ERROR';
                }
                failedFiles.push({ candidate, reason, detail: errorStr });
                Logger.warn(`[v0.3.30] Harvest source file missing or fetch failed: ${candidate.sourcePath} - ${err}`);
            }
        }

        const result: HarvestResult = {
            projectUUID: ProjectMetadata.getInstance().get().projectUUID,
            harvestedAt: Date.now(),
            clientsPath,
            harvestedClients: Array.from(harvestedClients),
            filesHarvested: harvestedFiles.length,
            foldersCreated: createdFolders.size,
            harvestedFiles,
            failedFiles
        };

        // B9: Report Generation
        const reportDir = path.join(projectRoot, '.synapse', 'reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const ts = result.harvestedAt;
        const jsonPath = path.join(reportDir, `harvest_${ts}.json`);
        const mdPath = path.join(reportDir, `harvest_${ts}.md`);

        fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');

        let md = `# SYNAPSE Harvest Report\n`;
        md += `- **Harvest ID:** ${ts}\n`;
        md += `- **Timestamp:** ${new Date(ts).toISOString()}\n`;
        md += `- **Project UUID:** ${result.projectUUID}\n\n`;
        md += `## Summary\n`;
        md += `- **Requested Files:** ${candidates.length}\n`;
        md += `- **Harvested Files:** ${result.filesHarvested}\n`;
        md += `- **Failed Files:** ${failedFiles.length}\n`;
        md += `- **Harvested Clients:** ${result.harvestedClients.length > 0 ? result.harvestedClients.join(', ') : 'None'}\n\n`;
        md += `## Harvested Files\n`;
        if (harvestedFiles.length === 0) {
            md += `*None*\n`;
        } else {
            harvestedFiles.forEach(f => md += `- \`${f}\`\n`);
        }
        md += `\n## Failed Files\n`;
        if (failedFiles.length === 0) {
            md += `*None*\n`;
        } else {
            failedFiles.forEach(f => {
                md += `- \`${f.candidate.filePath}\` [${f.candidate.clientUsername}] - **${f.reason}**: ${f.detail}\n`;
            });
        }
        
        fs.writeFileSync(mdPath, md, 'utf8');

        Logger.info(`[v0.3.30] Harvest complete: ${result.filesHarvested} files, ${result.foldersCreated} folders`);
        return result;
    }
}
