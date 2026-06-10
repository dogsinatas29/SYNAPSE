import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/Logger';

export interface ProjectMetadataSchema {
    projectUUID: string;
    projectName: string;
    version: string;
    createdAt: number;
    updatedAt: number;
    snapshotCount: number;
    metadataVersion: number;
}

export class ProjectMetadata {
    private static instance: ProjectMetadata;
    private metadata: ProjectMetadataSchema | null = null;
    private projectRoot: string | null = null;
    private storagePath: string | null = null;

    static getInstance(): ProjectMetadata {
        if (!ProjectMetadata.instance) {
            ProjectMetadata.instance = new ProjectMetadata();
        }
        return ProjectMetadata.instance;
    }

    initialize(projectRoot: string, projectName?: string): void {
        this.projectRoot = path.resolve(projectRoot);
        this.storagePath = path.join(this.projectRoot, 'data', 'project_metadata.json');
        this.metadata = null;
        if (projectName && this.storagePath && fs.existsSync(this.storagePath)) {
            try {
                const data = fs.readFileSync(this.storagePath, 'utf8');
                this.metadata = JSON.parse(data) as ProjectMetadataSchema;
                return;
            } catch {}
        }
        if (projectName) {
            this.metadata = this.createDefault(projectName);
        }
    }

    loadSync(): ProjectMetadataSchema {
        if (!this.storagePath) throw new Error('[v0.3.30] ProjectMetadata: not initialized');
        if (fs.existsSync(this.storagePath)) {
            const data = fs.readFileSync(this.storagePath, 'utf8');
            this.metadata = JSON.parse(data) as ProjectMetadataSchema;
            Logger.info(`[v0.3.30] ProjectMetadata loaded: ${this.metadata.projectName} (${this.metadata.projectUUID})`);
            return this.metadata;
        }
        if (!this.metadata) {
            this.metadata = this.createDefault(path.basename(this.projectRoot || 'unknown'));
        }
        this.saveSync();
        return this.metadata;
    }

    async load(): Promise<ProjectMetadataSchema> {
        return this.loadSync();
    }

    saveSync(): void {
        if (!this.metadata || !this.storagePath) throw new Error('[v0.3.30] ProjectMetadata: not initialized');
        this.metadata.updatedAt = Date.now();
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.storagePath, JSON.stringify(this.metadata, null, 2), 'utf8');
        Logger.info(`[v0.3.30] ProjectMetadata saved: ${this.metadata.projectName}`);
    }

    async save(): Promise<void> {
        return this.saveSync();
    }

    get(): ProjectMetadataSchema {
        if (!this.metadata) throw new Error('[v0.3.30] ProjectMetadata: not loaded');
        return { ...this.metadata };
    }

    incrementSnapshotCount(): void {
        if (!this.metadata) return;
        this.metadata.snapshotCount++;
    }

    getProjectRoot(): string {
        if (!this.projectRoot) throw new Error('[v0.3.30] ProjectMetadata: not initialized');
        return this.projectRoot;
    }

    validatePath(targetPath: string): boolean {
        if (!this.projectRoot) return false;
        const resolved = path.resolve(this.projectRoot, targetPath);
        const root = path.resolve(this.projectRoot);
        if (!resolved.startsWith(root + path.sep) && resolved !== root) {
            Logger.warn(`[v0.3.30] Security: Path escapes workspace root: ${targetPath}`);
            return false;
        }
        return true;
    }

    private createDefault(projectName: string): ProjectMetadataSchema {
        return {
            projectUUID: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            projectName,
            version: 'v0.3.30',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            snapshotCount: 0,
            metadataVersion: 1
        };
    }
}
