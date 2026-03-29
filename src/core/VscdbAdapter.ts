import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export interface TrajectoryEntry {
    timestamp?: number;
    role: 'user' | 'assistant';
    content: string;
}

export class VscdbAdapter {
    private db: sqlite3.Database | null = null;

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
            this.tmpPath = path.join(process.env.TMPDIR || '/tmp', `state_copy_${Date.now()}.vscdb`);
            try {
                fs.copyFileSync(dbPath, this.tmpPath);
                this.db = new sqlite3.Database(this.tmpPath, sqlite3.OPEN_READONLY, (err) => {
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
     * Trajectory Summaries를 추출하여 파싱합니다.
     */
    public async fetchTrajectorySummaries(): Promise<TrajectoryEntry[]> {
        return new Promise((resolve) => {
            if (!this.db) return resolve([]);

            const query = "SELECT key, value FROM ItemTable WHERE key LIKE '%trajectorySummaries%' OR key LIKE '%jetski.chat.state%' OR key LIKE '%antigravity%' OR key LIKE '%chat.workspaceState%' OR key LIKE '%history%'";
            this.db.all(query, (err, rows: any[]) => {
                if (err) {
                    console.error('[SYNAPSE] Query failed:', err);
                    return resolve([]);
                }

                const entries: TrajectoryEntry[] = [];
                rows.forEach(row => {
                    const extracted = this.heuristicExtract(row.value);
                    entries.push(...extracted);
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
        
        // 1. Try Decompression (v0.2.29 Strategy)
        let buffer = blob;
        try {
            const zlib = require('zlib');
            // Brute force a few common offsets for zlib headers
            for (let offset = 0; offset < Math.min(buffer.length, 32); offset++) {
                try {
                    const inflated = zlib.inflateSync(buffer.slice(offset));
                    buffer = inflated;
                    break;
                } catch (e) {}
            }
        } catch (e) {}

        const result: TrajectoryEntry[] = [];
        const resultStrings: string[] = [];
        let currentChunk: number[] = [];

        // 2. [LOB Sniffer] Binary Scan
        for (let i = 0; i < buffer.length; i++) {
            const b = buffer[i];
            const isPrintable = (b >= 32 && b <= 126) || [9, 10, 13].includes(b);
            const isMultibyte = (b >= 0x80);

            if (isPrintable || isMultibyte) {
                currentChunk.push(b);
            } else {
                if (currentChunk.length > 20) {
                    try {
                        const str = Buffer.from(currentChunk).toString('utf-8').trim();
                        if (/[a-zA-Z가-힣]/.test(str) && str.length > 20) {
                            resultStrings.push(str);
                        }
                    } catch (e) {}
                }
                currentChunk = [];
            }
        }

        // Final check for JSON structure within extracted chunks
        resultStrings.forEach(text => {
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
                        return; // Successfully parsed as JSON, skip heuristic mapping
                    }
                }
            } catch (e) {}

            // Heuristic Fallback
            if (text.includes('?') || /^(How|What|Please|Show|코드|이거|어떻게)/i.test(text)) {
                result.push({ role: 'user', content: text });
            } else {
                result.push({ role: 'assistant', content: text });
            }
        });

        return result;
    }

    public close() {
        if (this.db) {
            this.db.close((err) => {
                if (!err && this.tmpPath && fs.existsSync(this.tmpPath)) {
                    try {
                        fs.unlinkSync(this.tmpPath);
                    } catch (e) {}
                }
            });
        }
    }
}
