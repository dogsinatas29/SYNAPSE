import * as fs from 'fs';
import * as path from 'path';

interface PbFileState {
    lastSize: number;
    lastMtime: number;
    modCount: number;
    sessionId: string;
}

/**
 * [v0.2.34] PbSessionWatcher
 *
 * Antigravity .pb 파일을 내용 무처리로 감시하여 '변경 이벤트'만 발생시킵니다.
 *
 * 이 방식은 직접적인 바이너리 파싱 대신 UI 스크레이퍼를 트리거하여
 * 깨짐 없는 텍스트와 정확한 화자 분류를 보장합니다.
 */
export class PbSessionWatcher {
    private watcher: fs.FSWatcher | null = null;
    private fileStates = new Map<string, PbFileState>();
    private callback: ((sessionId: string, delta: number) => void) | null = null;
    private debounceTimers = new Map<string, NodeJS.Timeout>();
    private pollingInterval: NodeJS.Timeout | null = null;

    public start(conversationsPath: string, callback: (sessionId: string, delta: number) => void): void {
        if (!fs.existsSync(conversationsPath)) {
            console.warn(`[PbSessionWatcher] Path not found: ${conversationsPath}`);
            return;
        }

        this.callback = callback;

        // 기존 파일 베이스라인 등록
        this.baselineFiles(conversationsPath);

        // [v0.2.34-hotfix.2] Linux fs.watch unreliable on directory content changes
        // Adding 3s polling fallback
        this.pollingInterval = setInterval(() => {
            this.scanDirectory(conversationsPath);
        }, 3000);

        this.watcher = fs.watch(conversationsPath, (eventType, filename) => {
            // [v0.2.34-hotfix] 리눅스 대응: filename이 없을 경우 전수 조사 트리거
            if (!filename) {
                this.scanDirectory(conversationsPath);
                return;
            }

            if (!filename.endsWith('.pb')) return;
            const fullPath = path.join(conversationsPath, filename);

            const prev = this.debounceTimers.get(fullPath);
            if (prev) clearTimeout(prev);
            this.debounceTimers.set(fullPath, setTimeout(() => {
                this.handlePbChange(fullPath);
            }, 500));
        });
    }

    private baselineFiles(dir: string): void {
        try {
            const existing = fs.readdirSync(dir).filter(f => f.endsWith('.pb'));
            for (const f of existing) {
                const fullPath = path.join(dir, f);
                const stat = fs.statSync(fullPath);
                this.fileStates.set(fullPath, {
                    lastSize: stat.size,
                    lastMtime: stat.mtimeMs,
                    modCount: 0,
                    sessionId: f.replace('.pb', '')
                });
            }
            console.log(`[PbSessionWatcher] Watching ${dir} | ${existing.length} sessions baselined`);
        } catch (e) {
            console.error('[PbSessionWatcher] Baseline error:', e);
        }
    }

    private scanDirectory(dir: string): void {
        try {
            if (!fs.existsSync(dir)) return;
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.pb'));
            for (const f of files) {
                this.handlePbChange(path.join(dir, f));
            }
        } catch (e) {}
    }

    private handlePbChange(filePath: string): void {
        try {
            if (!fs.existsSync(filePath)) return;
            const stat = fs.statSync(filePath);
            const sessionId = path.basename(filePath, '.pb');

            let state = this.fileStates.get(filePath);
            if (!state) {
                state = { lastSize: 0, lastMtime: 0, modCount: 0, sessionId };
                this.fileStates.set(filePath, state);
            }

            const delta = stat.size - state.lastSize;
            const isTimeChanged = stat.mtimeMs > state.lastMtime;
            
            // [v0.2.34-hotfix] 파일 크기 변화 뿐만 아니라 수정 시간도 체크하여 트리거 무결성 확보
            if (delta === 0 && !isTimeChanged) {
                return;
            }

            console.log(`[PbSessionWatcher] Triggered: ${sessionId} | Delta: ${delta} bytes | Size: ${stat.size}`);

            state.modCount++;
            state.lastSize = stat.size;
            state.lastMtime = stat.mtimeMs;

            // [v0.2.34] 트리거 발생 - 실제 분류 및 텍스트는 Scraper 가 담당
            this.callback?.(sessionId, delta);

        } catch (e) {
            // console.error('[PbSessionWatcher] handlePbChange error:', e);
        }
    }

    public dispose(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.debounceTimers.forEach(t => clearTimeout(t));
        this.debounceTimers.clear();
        console.log('[PbSessionWatcher] Disposed.');
    }
}
