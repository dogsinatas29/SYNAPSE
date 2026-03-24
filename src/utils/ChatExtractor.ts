import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatAdapter extends vscode.Disposable {
    id: string;
    start(callback: (msg: ChatMessage) => void): void;
    isSupported(): boolean;
}

/**
 * [v0.2.25 Ultimate] StreamAdapter: 세션 분리, 실시간 수집, 수명 주기 관리
 */
export class StreamAdapter implements ChatAdapter {
    id = 'stream-buffer';
    private buffers = new Map<string, string>();
    private lastActivity = new Map<string, number>();
    private env: 'DEV' | 'PROD' = (process.env.NODE_ENV === 'production') ? 'PROD' : 'DEV';
    private disableAnalyzer = false; 
    private lastNodeTime = 0;
    private lastContentLength = 0;
    private nodeCount = 0;
    private edgeCount = 0;
    private totalContentLength = 0;
    private currentSessionId: string | null = null;
    private lastSpeakerType: 'user' | 'assistant' | null = null;
    private prevDensity = 0;

    private config = {
        timeGapMs: 30000,
        lengthJumpThreshold: 100,
        edgeMultiplier: 0.1,
        createScoreThreshold: 2,
        markerSensitivity: 1.0
    };

    private callback?: (msg: ChatMessage) => void;
    private interval: NodeJS.Timeout;

    isSupported() { 
        // [Fixed] Tiered Selection을 위해 명시적 환경 변수 체크만 수행
        return !!process.env.ANTIGRAVITY_AGENT || !!process.env.SYNAPSE_STREAM_ENABLED;
    }

    constructor() {
        this.loadConfig();
        this.interval = setInterval(() => {
            const now = Date.now();
            this.lastActivity.forEach((time, sessionId) => {
                if (now - time > 2000) {
                    console.log(`[STREAM] Idle timeout for session: ${sessionId}. Flushing.`);
                    this.commitAssistant(sessionId);
                }
            });
        }, 1000);
    }

    private loadConfig() {
        try {
            // [v0.2.30 Golden Config Loader]
            const configPath = path.join(process.cwd(), 'synapse.config.json');
            if (fs.existsSync(configPath)) {
                const raw = fs.readFileSync(configPath, 'utf-8');
                const data = JSON.parse(raw);
                this.config = { ...this.config, ...data };
                console.log('[SYNAPSE][Config] Loaded Golden State:', this.config);
            } else {
                console.log('[SYNAPSE][Config] No custom config found, using defaults.');
            }
        } catch (e) {
            console.error('[SYNAPSE][Config] Critical parsing error, using fallback defaults.');
        }
    }

    public dispose() {
        console.log("[STREAM] Disposing StreamAdapter, clearing intervals.");
        clearInterval(this.interval);
        // 남아 있는 모든 버퍼 강제 플러시
        this.lastActivity.forEach((_, sessionId) => {
            try {
                this.commitAssistant(sessionId);
            } catch (e) {}
        });
    }

    start(callback: (msg: ChatMessage) => void) {
        this.callback = callback;
    }

    /** [Option A] 중복 방지를 위해 모든 기록은 이 어댑터를 통해서만 전달 */
    public pushUser(sessionId: string, text: string) {
        if (!text.trim()) return;
        // sessionId가 있을 경우 로그 가독성을 위해 추가
        const formatted = sessionId && sessionId !== 'default' ? `[${sessionId}] ${text}` : text;
        this.callback?.({ role: 'user', content: formatted });
    }

    public pushChunk(sessionId: string, chunk: string) {
        if (!sessionId) return;
        const sid = sessionId;
        const prev = this.buffers.get(sid) || "";
        this.buffers.set(sid, prev + chunk);
        this.lastActivity.set(sid, Date.now());
    }

    public commitAssistant(sessionId: string) {
        if (!sessionId) return;
        const sid = sessionId;
        const content = this.buffers.get(sid);
        
        if (!content) return; 

        if (content.trim()) {
            this.logNormalizationDecision(sid, 'assistant', content);
            console.log(`[SYNAPSE STREAM COMMIT] ${sid} (${content.length} chars)`);
            this.callback?.({ role: 'user', content: `[Assistant Response - Session: ${sid}]` }); 
            this.callback?.({ role: 'assistant', content: content.trim() });
            
            this.totalContentLength += content.length;
            this.lastNodeTime = Date.now();
            this.lastContentLength = content.length;
            this.lastSpeakerType = 'assistant';
            this.nodeCount++;
            
            this.finalizeContextVault();
        }
        
        this.buffers.delete(sid);
        this.lastActivity.delete(sid);
    }

    private finalizeContextVault() {
        if (this.env === 'PROD') {
            // [v0.2.30 PROD Guard]
            this.disableAnalyzer = true; 
            console.log('[SYNAPSE][PROD] Tuning tools disabled (Read-only Config Mode)');
            return;
        }

        if (!this.disableAnalyzer) {
            // [v0.2.30 DEV] 자동 분석 및 튜닝 파이프라인 호출 (가상)
            console.log('[SYNAPSE][DEV] Normalization metrics updated.');
        }
    }

    private logNormalizationDecision(sessionId: string, type: 'user' | 'assistant', content: string) {
        const DEBUG_CONTEXT = true; 
        if (!DEBUG_CONTEXT || content.length < 20) return;

        const now = Date.now();
        const timeGap = now - this.lastNodeTime;
        const { isShift, strength, matches } = this.analyzeContextShift(content);
        
        const signals = {
            sessionChanged: this.currentSessionId !== sessionId,
            contextShift: isShift,
            speakerChanged: this.lastSpeakerType !== type,
            longGap: timeGap > this.config.timeGapMs
        };

        const score = 
            (signals.sessionChanged ? 3 : 0) + 
            (strength >= 2 ? 2 : (isShift ? 1 : 0)) + 
            (signals.speakerChanged ? 1 : 0) + 
            (signals.longGap ? 1 : 0);

        console.log('[SYNAPSE][NodeDecision]', {
            op: score >= this.config.createScoreThreshold ? 'CREATE' : 'APPEND',
            score,
            signals,
            matches: matches.length > 0 ? matches : undefined
        });

        if (this.nodeCount % 5 === 0) {
            const density = (this.edgeCount / (this.nodeCount || 1));
            const delta = density - this.prevDensity;
            
            console.log('[SYNAPSE][GraphStats]', {
                nodes: this.nodeCount,
                edges: this.edgeCount,
                density: density.toFixed(2),
                delta: delta.toFixed(3),
                avgLen: (this.totalContentLength / (this.nodeCount || 1)).toFixed(0)
            });
            this.prevDensity = density;
        }
    }

    private analyzeContextShift(content: string) {
        const text = content.toLowerCase();
        const markers = ['?', '왜', '어떻게', '해줘', '다시', '수정', '오류', '버그', 'how', 'why', 'fix', 'error'];
        const matches = markers.filter(m => text.includes(m));
        
        const isLengthJump = Math.abs(content.length - this.lastContentLength) > this.config.lengthJumpThreshold;
        const strength = matches.length + (isLengthJump ? 1 : 0);

        return { isShift: strength > 0, strength, matches };
    }
}

/**
 * Tier 3: Legacy File Sniffer (Fallback)
 */
export class FileAdapter implements ChatAdapter {
    id = 'file-sniffer';
    private lastChatFilePos = 0;
    private currentChatFile: string | null = null;
    private watcher: fs.FSWatcher | null = null;
    private callback?: (msg: ChatMessage) => void;

    isSupported() { return true; }

    start(callback: (msg: ChatMessage) => void) {
        this.callback = callback;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        // Note: This logic previously lived in extension.ts initAuditLog
        const storagePath = ChatExtractor.getChatSessionsFolderPath({ storageUri: (vscode.workspace as any).storageUri } as any);
        if (storagePath && fs.existsSync(storagePath)) {
            // 1. Initial Scan
            const files = fs.readdirSync(storagePath)
                .filter(f => f.endsWith('.jsonl'))
                .map(f => path.join(storagePath, f));
            
            if (files.length > 0) {
                const latestFile = files.reduce((latest, current) => {
                    const latestStat = fs.statSync(latest);
                    const currentStat = fs.statSync(current);
                    return latestStat.mtimeMs > currentStat.mtimeMs ? latest : current;
                });
                this.syncChatEvents(latestFile);
            }

            // 2. Real-time Watcher
            this.watcher = fs.watch(storagePath, (event, filename) => {
                if (filename && filename.endsWith('.jsonl')) {
                    const fullPath = path.join(storagePath, filename);
                    this.syncChatEvents(fullPath);
                }
            });
        }
    }

    private syncChatEvents(filePath: string) {
        try {
            if (!fs.existsSync(filePath)) return;
            const stats = fs.statSync(filePath);
            
            if (this.currentChatFile !== filePath) {
                this.currentChatFile = filePath;
                this.lastChatFilePos = 0;
            }

            if (stats.size > this.lastChatFilePos) {
                const fd = fs.openSync(filePath, 'r');
                const sizeToRead = stats.size - this.lastChatFilePos;
                const buffer = Buffer.alloc(sizeToRead);
                fs.readSync(fd, buffer, 0, sizeToRead, this.lastChatFilePos);
                fs.closeSync(fd);

                const newContent = buffer.toString('utf-8');
                const newLines = newContent.split('\n').filter(l => l.trim().length > 0);

                newLines.forEach(line => {
                    try {
                        const parsed = JSON.parse(line);
                        // User Prompt Event
                        if ((parsed.kind === 2 || parsed.k?.[0] === 'requests') && Array.isArray(parsed.v)) {
                            parsed.v.forEach((req: any) => {
                                if (req.message && req.message.text) {
                                    this.callback?.({ role: 'user', content: req.message.text });
                                }
                            });
                        }
                        // Assistant Response Event
                        if (parsed.k && Array.isArray(parsed.k) && parsed.k.includes('response')) {
                            if (parsed.v && Array.isArray(parsed.v)) {
                                const text = parsed.v
                                    .filter((r: any) => r.value && r.kind !== 'thinking' && !r.kind?.includes('mcp'))
                                    .map((r: any) => r.value)
                                    .join('');
                                if (text) this.callback?.({ role: 'assistant', content: text });
                            }
                        }
                    } catch(e) {}
                });
                this.lastChatFilePos = stats.size;
            }
        } catch(e) {}
    }

    public dispose() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
}

export class ChatExtractor {
    private static adapter: ChatAdapter;

    public static initialize(context: vscode.ExtensionContext): ChatAdapter {
        // 우선순위: Stream > File
        // (VSCodeAdapter는 향후 추가 가능)
        const adapters: ChatAdapter[] = [
            new StreamAdapter(),
            new FileAdapter()
        ];

        for (const a of adapters) {
            if (a.isSupported()) {
                this.adapter = a;
                if (context.subscriptions) {
                    context.subscriptions.push(this.adapter); // 자동 Dispose 등록
                }
                console.log(`[SYNAPSE] ChatAdapter resolved & registered: ${this.adapter.id}`);
                break;
            }
        }
        return this.adapter;
    }

    public static getAdapter(): ChatAdapter {
        if (!this.adapter) {
            throw new Error("[SYNAPSE] ChatExtractor not initialized. Ensure initialize() is called during activation.");
        }
        return this.adapter;
    }

    // 기존 하위 호환성을 위한 경로 탐색 로직 (동일)
    public static getChatSessionsFolderPath(context: vscode.ExtensionContext): string | null {
        const wsPath = this.getWorkspaceStoragePath(context);
        return wsPath ? path.join(wsPath, 'chatSessions') : null;
    }
    
    private static getWorkspaceStoragePath(context: vscode.ExtensionContext): string | null {
        if (context.storageUri) {
            const potentialPath = path.dirname(context.storageUri.fsPath);
            if (fs.existsSync(path.join(potentialPath, 'chatSessions'))) return potentialPath;
        }
        
        // Fallback: Linux Standard Path Search
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        if (homeDir) {
            const wsStorageRoot = path.join(homeDir, '.config', 'Code', 'User', 'workspaceStorage');
            if (fs.existsSync(wsStorageRoot)) {
                try {
                    const folders = fs.readdirSync(wsStorageRoot);
                    for (const folder of folders) {
                        const wsJsonPath = path.join(wsStorageRoot, folder, 'workspace.json');
                        if (fs.existsSync(wsJsonPath)) {
                            const content = fs.readFileSync(wsJsonPath, 'utf-8');
                            const workspaceFolders = vscode.workspace.workspaceFolders;
                            if (workspaceFolders && workspaceFolders.length > 0) {
                                const currentWsPath = workspaceFolders[0].uri.toString();
                                if (content.includes(currentWsPath)) {
                                    return path.join(wsStorageRoot, folder);
                                }
                            }
                        }
                    }
                } catch (e) {}
            }
        }
        return null;
    }
}
