import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../utils/Logger';
import { ProjectMetadata } from '../ProjectMetadata';
import { SubmissionSnapshot, SubmissionFile } from '../../types/schema';
import { VerificationReport } from './ReferenceVerifier';
import { SubmissionManager } from './SubmissionManager';

export interface HarvestInput {
    submissionId: string;
    projectUUID: string;
    approvedFiles: SubmissionFile[];
    originalSnapshot: SubmissionSnapshot;
    verificationReport: VerificationReport;
}

export interface LayerHarvestInput {
    projectUUID: string;
    sessionId: string;
    clientLayerIds: string[];
    username?: string;
}

export interface HarvestedFile {
    filePath: string;
    targetPath: string;
    size: number;
}

export interface HarvestResult {
    submissionId: string;
    projectUUID: string;
    harvestedAt: number;
    masterLayerPath: string;
    filesHarvested: number;
    foldersCreated: number;
    harvestedFiles: HarvestedFile[];
    originalSnapshotPreserved: boolean;
}

export class HarvestEngine {
    private static instance: HarvestEngine;

    static getInstance(): HarvestEngine {
        if (!HarvestEngine.instance) {
            HarvestEngine.instance = new HarvestEngine();
        }
        return HarvestEngine.instance;
    }

    harvest(input: HarvestInput): HarvestResult {
        const projectRoot = ProjectMetadata.getInstance().getProjectRoot();
        const masterLayerPath = path.join(projectRoot, '.synapse', 'master');

        Logger.info(`[v0.3.30] Harvest starting: ${input.submissionId} → ${masterLayerPath}`);

        if (!fs.existsSync(masterLayerPath)) {
            fs.mkdirSync(masterLayerPath, { recursive: true });
        }

        const harvestedFiles: HarvestedFile[] = [];
        const createdFolders = new Set<string>();

        for (const file of input.approvedFiles) {
            if (file.filePath.startsWith('external://') || file.filePath.startsWith('ghost://')) continue;

            const resolvedTarget = path.resolve(masterLayerPath, file.filePath);
            if (!resolvedTarget.startsWith(masterLayerPath + path.sep) && resolvedTarget !== masterLayerPath) {
                Logger.warn(`[v0.3.30] Harvest path traversal denied: ${file.filePath}`);
                continue;
            }

            const targetDir = path.dirname(resolvedTarget);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
                createdFolders.add(targetDir);
            }

            fs.writeFileSync(resolvedTarget, file.content, (file.encoding || 'utf8') as BufferEncoding);
            harvestedFiles.push({
                filePath: file.filePath,
                targetPath: resolvedTarget,
                size: file.content.length,
            });
        }

        const originalSnapshotDir = path.join(projectRoot, '.synapse', 'snapshots', input.submissionId);
        if (!fs.existsSync(originalSnapshotDir)) {
            fs.mkdirSync(originalSnapshotDir, { recursive: true });
            fs.writeFileSync(
                path.join(originalSnapshotDir, 'snapshot.json'),
                JSON.stringify(input.originalSnapshot, null, 2),
                'utf8'
            );
        }

        const result: HarvestResult = {
            submissionId: input.submissionId,
            projectUUID: input.projectUUID,
            harvestedAt: Date.now(),
            masterLayerPath,
            filesHarvested: harvestedFiles.length,
            foldersCreated: createdFolders.size,
            harvestedFiles,
            originalSnapshotPreserved: true,
        };

        Logger.info(`[v0.3.30] Harvest complete: ${result.filesHarvested} files, ${result.foldersCreated} folders`);
        return result;
    }

    harvestLayers(input: LayerHarvestInput): HarvestResult[] {
        const sm = SubmissionManager.getInstance();
        const results: HarvestResult[] = [];
        let totalFiles = 0;

        for (const clientId of input.clientLayerIds) {
            const approvedSubs = sm.getApprovedSubmissionsByClient(input.projectUUID, input.sessionId, clientId);
            if (approvedSubs.length === 0) continue;

            const approvedFiles: SubmissionFile[] = [];
            for (const sub of approvedSubs) {
                for (const f of sub.files) {
                    if (!approvedFiles.some(af => af.filePath === f.filePath)) {
                        approvedFiles.push(f);
                    }
                }
            }

            const combinedInput: HarvestInput = {
                submissionId: `layer_${clientId}_${Date.now()}`,
                projectUUID: input.projectUUID,
                approvedFiles,
                originalSnapshot: approvedSubs[approvedSubs.length - 1],
                verificationReport: { generatedAt: Date.now(), graph: { fileNodes: [], ghostNodes: [], edges: [], clusters: [] }, findings: [], stats: { totalFiles: 0, totalEdges: 0, totalGhosts: 0, resolvedReferences: 0, unresolvedReferences: 0, disconnectedFiles: 0 } },
            };

            const result = this.harvest(combinedInput);
            results.push(result);
            totalFiles += result.filesHarvested;
        }

        Logger.info(`[v0.3.30] Layer harvest complete: ${input.clientLayerIds.length} layers, ${totalFiles} files`);
        return results;
    }
}
