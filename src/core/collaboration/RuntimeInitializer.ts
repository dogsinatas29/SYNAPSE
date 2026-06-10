import { Logger } from '../../utils/Logger';
import { ProjectMetadata } from '../ProjectMetadata';
import { SymbolIndex } from '../SymbolIndex';
import { IdentityManager } from './IdentityManager';
import { SessionManager } from './SessionManager';

export type RuntimeState = 'stopped' | 'initializing' | 'ready' | 'error';

export class RuntimeInitializer {
    private static instance: RuntimeInitializer;
    private state: RuntimeState = 'stopped';
    private projectUUID: string | null = null;

    static getInstance(): RuntimeInitializer {
        if (!RuntimeInitializer.instance) {
            RuntimeInitializer.instance = new RuntimeInitializer();
        }
        return RuntimeInitializer.instance;
    }

    async initialize(projectRoot: string, projectName: string): Promise<RuntimeState> {
        this.state = 'initializing';
        Logger.info('[v0.3.30] Runtime initialization started');

        try {
            Logger.info('[v0.3.30] Step 1/4: Loading Project Metadata...');
            const meta = ProjectMetadata.getInstance();
            meta.initialize(projectRoot, projectName);
            const schema = meta.loadSync();
            this.projectUUID = schema.projectUUID;

            Logger.info('[v0.3.30] Step 2/4: Loading Symbol Index...');
            const symbolIndex = SymbolIndex.getInstance();
            symbolIndex.initialize(projectName, projectRoot);

            Logger.info('[v0.3.30] Step 3/4: Initializing Identity Manager...');
            IdentityManager.getInstance();

            Logger.info('[v0.3.30] Step 4/4: Initializing Session Manager...');
            SessionManager.getInstance();

            this.state = 'ready';
            Logger.info(`[v0.3.30] Runtime ready for project: ${projectName} (${this.projectUUID})`);
            return this.state;
        } catch (e: any) {
            this.state = 'error';
            Logger.error(`[v0.3.30] Runtime initialization failed: ${e.message}`);
            throw e;
        }
    }

    getState(): RuntimeState {
        return this.state;
    }

    getProjectUUID(): string | null {
        return this.projectUUID;
    }

    assertReady(): void {
        if (this.state !== 'ready') {
            throw new Error(`[v0.3.30] Runtime not ready (state: ${this.state})`);
        }
    }

    shutdown(): void {
        this.state = 'stopped';
        this.projectUUID = null;
        Logger.info('[v0.3.30] Runtime shut down');
    }
}
