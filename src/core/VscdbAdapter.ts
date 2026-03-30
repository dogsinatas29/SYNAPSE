import * as fs from 'fs';
import * as path from 'path';

/**
 * Lazy-loaded sqlite3 for VS Code compatibility
 */
let sqlite3: any = null;
function getSqlite3() {
    if (!sqlite3) {
        try {
            sqlite3 = require('sqlite3');
        } catch (e) {
            console.error('[SYNAPSE] Failed to load sqlite3 native module:', e);
            throw new Error('sqlite3 module not found or incompatible. Please ensure native dependencies are correctly built.');
        }
    }
    return sqlite3;
}

export interface TrajectoryEntry {
    timestamp?: number;
    role: 'user' | 'assistant';
    content: string;
}

export class VscdbAdapter {
    private db: any = null;

    private tmpPath: string | null = null;

    /**
     * SQLite 데이터베이스 파일을 읽기 전용으로 엽니다.
     * 파일이 잠겨 있을 경우를 대비하여 임시 디렉토리에 복사하여 스캔합니다.
     */
    public async openReadOnly(dbPath: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!fs.existsSync(dbPath)) {
                console.error(`[SYNAPSE] DB not found: ${dbPath}`);
                return resolve(false);
            }

            // DB 잠금 회피를 위해 임시 복사본 생성
            const timestamp = Date.now();
            this.tmpPath = path.join(process.env.TMPDIR || '/tmp', `state_copy_${timestamp}.vscdb`);
            try {
                fs.copyFileSync(dbPath, this.tmpPath);
                
                // WAL 파일들도 함께 복사 (커밋되지 않은 데이터 반영을 위해)
                const walPath = dbPath + '-wal';
                const shmPath = dbPath + '-shm';
                try {
                    if (fs.existsSync(walPath)) {
                        fs.copyFileSync(walPath, this.tmpPath + '-wal');
                        console.log('[SYNAPSE] WAL file copied for latest session data.');
                    }
                    if (fs.existsSync(shmPath)) {
                        fs.copyFileSync(shmPath, this.tmpPath + '-shm');
                        console.log('[SYNAPSE] SHM file copied for memory-resident data.');
                    }
                } catch (walErr) {
                    console.warn('[SYNAPSE] WAL files copy failed (continuing anyway):', walErr);
                }

                const sqlite = getSqlite3();
                this.db = new sqlite.Database(this.tmpPath, sqlite.OPEN_READONLY, (err: any) => {
                    if (err) {
                        console.error('[SYNAPSE] Failed to connect to SQLite:', err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            } catch (e) {
                console.error('[SYNAPSE] Copy failed:', e);
                resolve(false);
            }
        });
    }

    /**
     * [Option 1: Re-indexing Injection]
     * 지정된 DB(state.vscdb)에 새로운 세션 ID와 .pb 파일 경로를 직접 맵핑합니다.
     * IDE가 이를 읽고 화면에 대화를 부활시키게 됩니다.
     */
    public async injectPbMapping(dbPath: string, pbFilePath: string, sessionId: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (!fs.existsSync(dbPath)) {
                console.error(`[SYNAPSE] DB not found for injection: ${dbPath}`);
                return resolve(false);
            }

            // IDE가 실행 중일 때 잠금 문제가 발생할 수 있으므로 조심스럽게 OPEN_READWRITE 시도
            const sqlite = getSqlite3();
            const writeDb = new sqlite.Database(dbPath, sqlite.OPEN_READWRITE, (err: any) => {
                if (err) {
                    console.error('[SYNAPSE] Failed to open DB in write mode:', err);
                    return resolve(false);
                }

                // 맵핑 키 (Antigravity/Gemini 환경에 맞춘 휴리스틱 키 구조)
                const key = `chat.session.${sessionId}`;
                const valueObject = {
                    sessionId: sessionId,
                    pbPath: pbFilePath,
                    injectedAt: Date.now(),
                    isRecovered: true
                };
                const valueString = JSON.stringify(valueObject);

                const query = "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)";
                writeDb.run(query, [key, valueString], (insertErr: any) => {
                    writeDb.close();
                    if (insertErr) {
                        console.error('[SYNAPSE] Failed to inject PB mapping:', insertErr);
                        resolve(false);
                    } else {
                        console.log(`[SYNAPSE] Successfully injected ${pbFilePath} as ${key}`);
                        resolve(true);
                    }
                });
            });
        });
    }

    /**
     * Trajectory Summaries를 추출하여 파싱합니다.
     */
    public async fetchTrajectorySummaries(): Promise<TrajectoryEntry[]> {
        return new Promise((resolve) => {
            if (!this.db) return resolve([]);

            const query = "SELECT key, value FROM ItemTable WHERE key LIKE '%trajectorySummaries%' OR key LIKE '%jetski.chat.state%' OR key LIKE '%antigravity%' OR key LIKE '%chat.workspaceState%' OR key LIKE '%history%' OR key LIKE '%session%' OR key LIKE '%request%'";
            this.db.all(query, (err: any, rows: any[]) => {
                const entries: TrajectoryEntry[] = [];

                if (err) {
                    console.error('[SYNAPSE] Query failed:', err);
                } else {
                    rows.forEach(row => {
                        const extracted = this.heuristicExtract(row.value);
                        entries.push(...extracted);
                    });
                }

                // [v0.2.41] WAL Sniffer Fallback
                // db query may miss uncheckpointed WAL. Parse WAL binary directly just in case.
                let walEntries: TrajectoryEntry[] = [];
                if (this.tmpPath && fs.existsSync(this.tmpPath + '-wal')) {
                    try {
                        const walBuffer = fs.readFileSync(this.tmpPath + '-wal');
                        console.log(`[SYNAPSE] WAL Miner: Scraping ${walBuffer.length} bytes from WAL fallback.`);
                        walEntries = this.heuristicExtract(walBuffer);
                    } catch (we) {
                        console.warn('[SYNAPSE] WAL Miner failed:', we);
                    }
                }
                
                // Merge wal Entries
                walEntries.forEach(we => {
                     entries.push(we);
                });

                resolve(entries);
            });
        });
    }

    /**
     * 블롭(Blob) 데이터에서 문자열 조각을 휴리스틱하게 추출합니다.
     */
    private heuristicExtract(blob: Buffer): TrajectoryEntry[] {
        if (!blob || blob.length === 0) return [];
        
        // 1. Try Decompression
        let buffer = blob;
        try {
            const zlib = require('zlib');
            for (let offset = 0; offset < Math.min(buffer.length, 64); offset++) {
                try {
                    const inflated = zlib.inflateSync(buffer.slice(offset));
                    buffer = inflated;
                    break;
                } catch (e) {}
            }
        } catch (e) {}

        const result: TrajectoryEntry[] = [];
        const contentString = buffer.toString('utf-8');

        // 2. [LOB Sniffer] Strict Regular Expression Scan
        // Match sequences of 20+ characters including Hangeul
        const textRegex = /[\t\n\r\u0020-\u007E\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]{20,}/g;
        const matches = contentString.match(textRegex) || [];
        
        const filteredStrings: string[] = [];
        matches.forEach(m => {
            const trimmed = m.trim();
            // Filter out purely numeric/symbolic strings or rows with replacement chars
            if (/[a-zA-Z가-힣]/.test(trimmed) && !trimmed.includes('')) {
                if (trimmed.length > 30) {
                    filteredStrings.push(trimmed);
                }
            }
        });

        // 3. Structured Data Detection & Fallback
        filteredStrings.forEach(text => {
            // [v0.2.38] Metadata Filter
            if (text.includes('workbench.') || text.includes('antigravity.') || text.includes('jetski.')) return;
            if (text.includes('ItemTable')) return;

            // Priority 1: JSON detection
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed.messages)) {
                        parsed.messages.forEach((msg: any) => {
                            if (msg.role && msg.content) {
                                result.push({ role: msg.role, content: msg.content });
                            }
                        });
                        return;
                    }
                }
            } catch (e) {}

            // Priority 2: Heuristic mapping
            const cleaned = text.replace(/\s+/g, ' ').substring(0, 1000);
            
            // Refined User Detection
            const userMarkers = ['?', '왜', '어떻게', '해줘', '보여줘', '코드', 'fix', 'how', 'why', 'explain'];
            const isUser = userMarkers.some(m => cleaned.toLowerCase().includes(m)) && cleaned.length < 500;

            if (isUser) {
                result.push({ role: 'user', content: cleaned });
            } else {
                // Only push as assistant if it seems like a real sentence (contains space or hangeul)
                if (cleaned.includes(' ') || /[\uAC00-\uD7A3]/.test(cleaned)) {
                    result.push({ role: 'assistant', content: cleaned });
                }
            }
        });

        return result;
    }

    public close() {
        if (this.db) {
            this.db.close((err: any) => {
                if (!err && this.tmpPath) {
                    try {
                        if (fs.existsSync(this.tmpPath)) fs.unlinkSync(this.tmpPath);
                        if (fs.existsSync(this.tmpPath + '-wal')) fs.unlinkSync(this.tmpPath + '-wal');
                        if (fs.existsSync(this.tmpPath + '-shm')) fs.unlinkSync(this.tmpPath + '-shm');
                    } catch (e) {}
                }
            });
        }
    }
}
