import * as fs from 'fs';
import * as path from 'path';

export interface LayoutData {
    revision: number;
    positions: Record<string, { x: number; y: number }>;
    view: { zoom: number; offset: { x: number; y: number } };
    clusters: Record<string, { collapsed: boolean }>;
}

export class LayoutStorage {
    // Single FIFO Promise chain queue for atomic serialization
    private static _queue: Promise<any> = Promise.resolve();

    public static async runSerialized<T>(task: () => Promise<T>): Promise<T> {
        const next = LayoutStorage._queue.then(task, task);
        LayoutStorage._queue = next;
        return next;
    }

    public static getLayoutPath(synapseDataDir: string): string {
        return path.join(synapseDataDir, 'layout.json');
    }

    public static loadLayout(
        synapseDataDir: string,
        fallbackPositions?: Record<string, { x: number; y: number }>,
        fallbackView?: { zoom: number; offset: { x: number; y: number } },
        fallbackClusters?: Record<string, { collapsed: boolean }>
    ): LayoutData {
        const layoutPath = LayoutStorage.getLayoutPath(synapseDataDir);
        const defaultLayout: LayoutData = {
            revision: 0,
            positions: fallbackPositions || {},
            view: fallbackView || { zoom: 1.0, offset: { x: 0, y: 0 } },
            clusters: fallbackClusters || {}
        };

        if (!fs.existsSync(layoutPath)) {
            return defaultLayout;
        }

        try {
            const raw = fs.readFileSync(layoutPath, 'utf8');
            const parsed = JSON.parse(raw);
            if (typeof parsed !== 'object' || parsed === null) {
                console.warn(`[LayoutStorage] Invalid layout.json format (not object). Falling back to SSoT defaults.`);
                return defaultLayout;
            }
            return {
                revision: typeof parsed.revision === 'number' && parsed.revision >= 0 ? parsed.revision : 0,
                positions: parsed.positions && typeof parsed.positions === 'object' ? parsed.positions : (fallbackPositions || {}),
                view: parsed.view && typeof parsed.view === 'object' && typeof parsed.view.zoom === 'number'
                    ? parsed.view
                    : (fallbackView || { zoom: 1.0, offset: { x: 0, y: 0 } }),
                clusters: parsed.clusters && typeof parsed.clusters === 'object' ? parsed.clusters : (fallbackClusters || {})
            };
        } catch (err: any) {
            console.warn(`[LayoutStorage] Failed to read or parse layout.json: ${err.message}. Falling back to SSoT defaults.`);
            return defaultLayout;
        }
    }

    public static async saveLayout(
        synapseDataDir: string,
        data: LayoutData
    ): Promise<{ success: boolean; revision: number; error?: string }> {
        return LayoutStorage.runSerialized(async () => {
            if (!fs.existsSync(synapseDataDir)) {
                fs.mkdirSync(synapseDataDir, { recursive: true });
            }

            const targetPath = LayoutStorage.getLayoutPath(synapseDataDir);
            const tmpPath = path.join(
                synapseDataDir,
                `layout.json.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            );

            let fd: number | null = null;
            try {
                // Exclusive create: O_CREAT | O_EXCL
                fd = fs.openSync(tmpPath, 'wx');
                const content = JSON.stringify(data, null, 2);
                fs.writeSync(fd, content, 0, 'utf8');
                fs.fsyncSync(fd);
                fs.closeSync(fd);
                fd = null;

                // Atomic rename with Windows backoff (retry up to 3 times: 50ms, 100ms, 200ms)
                await LayoutStorage._atomicRenameWithBackoff(tmpPath, targetPath);
                return { success: true, revision: data.revision };
            } catch (err: any) {
                if (fd !== null) {
                    try { fs.closeSync(fd); } catch {}
                }
                if (fs.existsSync(tmpPath)) {
                    try { fs.unlinkSync(tmpPath); } catch {}
                }
                console.error(`[LayoutStorage] saveLayout failed: ${err.message}`);
                return { success: false, revision: data.revision, error: err.message };
            }
        });
    }

    public static async resetLayout(
        synapseDataDir: string,
        currentRevision: number
    ): Promise<{ success: boolean; revision: number; error?: string }> {
        const nextRevision = currentRevision + 1;
        const emptyLayout: LayoutData = {
            revision: nextRevision,
            positions: {},
            view: { zoom: 1.0, offset: { x: 0, y: 0 } },
            clusters: {}
        };
        return LayoutStorage.saveLayout(synapseDataDir, emptyLayout);
    }

    private static async _atomicRenameWithBackoff(tmpPath: string, targetPath: string): Promise<void> {
        const delays = [50, 100, 200];
        let attempt = 0;
        while (true) {
            try {
                fs.renameSync(tmpPath, targetPath);
                return;
            } catch (err: any) {
                const isRetryable = err.code === 'EPERM' || err.code === 'EBUSY';
                if (isRetryable && attempt < delays.length) {
                    const delay = delays[attempt++];
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw err;
            }
        }
    }
}
