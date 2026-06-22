import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Logger } from '../../utils/Logger';
import { ProjectMetadata } from '../ProjectMetadata';
import { AccountManager } from './AccountManager';
import { CompareResult, ClientFileHash } from '../../types/schema';

export class CompareEngine {
    private static instance: CompareEngine;

    static getInstance(): CompareEngine {
        if (!CompareEngine.instance) {
            CompareEngine.instance = new CompareEngine();
        }
        return CompareEngine.instance;
    }

    private getHash(filePath: string): string {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('sha256').update(content).digest('hex');
        } catch {
            return '';
        }
    }

    async compare(visibleClientIds: string[], getHashesCallback: (userId: string) => Promise<ClientFileHash[]>): Promise<CompareResult[]> {
        const results: CompareResult[] = [];
        const projectRoot = ProjectMetadata.getInstance().getProjectRoot();
        const masterLayerPath = projectRoot; // [v0.3.30] Host Workspace is the SSOT

        const accManager = AccountManager.getInstance();

        for (const clientId of visibleClientIds) {
            const username = accManager.getUsernameByUserId(clientId) || clientId;

            try {
                const clientHashes = await getHashesCallback(clientId);
                
                for (const cFile of clientHashes) {
                    const relPath = cFile.filePath;
                    const mFile = path.join(masterLayerPath, relPath);

                    if (!fs.existsSync(mFile)) {
                        results.push({
                            filePath: relPath,
                            state: 'ADDED',
                            clientUsername: username,
                            userId: clientId
                        });
                    } else {
                        const cHash = cFile.hash;
                        const mHash = this.getHash(mFile);
                        if (cHash !== mHash) {
                            results.push({
                                filePath: relPath,
                                state: 'MODIFIED',
                                clientUsername: username,
                                userId: clientId
                            });
                        }
                        // UNCHANGED is ignored per Harvest Goal
                    }
                }
            } catch (err: any) {
                Logger.warn(`[v0.3.30] CompareEngine: Failed to get hashes for ${username} - ${err}`);
            }
        }

        Logger.info(`[v0.3.30] CompareEngine: Found ${results.length} differences`);
        return results;
    }
}
