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
            if (cleaned.includes('?') || /^(어떻게|왜|해줘|보여줘|코드|fix|how|why|explain)/i.test(cleaned)) {
                result.push({ role: 'user', content: cleaned });
            } else {
                result.push({ role: 'assistant', content: cleaned });
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
