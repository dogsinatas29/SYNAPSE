import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../../utils/Logger';
import { ProjectMetadata } from '../ProjectMetadata';
import { SubmissionSnapshot, SubmissionFile } from '../../types/schema';
import { VerificationReport } from './ReferenceVerifier';

export interface HarvestInput {
    submissionId: string;
    projectUUID: string;
    approvedFiles: SubmissionFile[];
    originalSnapshot: SubmissionSnapshot;
    verificationReport: VerificationReport;
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

            const targetFilePath = path.join(masterLayerPath, file.filePath);
            const targetDir = path.dirname(targetFilePath);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
                createdFolders.add(targetDir);
            }

            fs.writeFileSync(targetFilePath, file.content, (file.encoding || 'utf8') as BufferEncoding);
            harvestedFiles.push({
                filePath: file.filePath,
                targetPath: targetFilePath,
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
}
