import * as http from 'http';
import * as net from 'net';
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { Logger } from '../utils/Logger';

/**
 * [v0.2.52 Phase 5] CDPManager: Ghost Protocol (Zero-Dependency Bridge)
 */
export class CDPManager {
    private static instance: CDPManager;
    private requestId: number = 1;

    private constructor() {}

    public static getInstance(): CDPManager {
        if (!CDPManager.instance) CDPManager.instance = new CDPManager();
        return CDPManager.instance;
    }

    public async findTarget(identifier: string): Promise<any | null> {
        // [v0.2.51] Priority 1: Use specific MCP command if available
        try {
            const mcpUrl: string | undefined = await vscode.commands.executeCommand('antigravity.getChromeDevtoolsMcpUrl');
            if (mcpUrl) {
                Logger.info(`[SYNAPSE][CDP] MCP URL detected: ${mcpUrl}`);
                const resp = await this.httpGet(mcpUrl);
                try {
                    const targets = JSON.parse(resp);
                    if (Array.isArray(targets)) {
                        const target = this.matchTarget(targets, identifier);
                        if (target) return target;
                    } else {
                        Logger.warn(`[SYNAPSE][CDP] MCP response is not a list. Type: ${typeof targets}`);
                    }
                } catch (e) {
                    Logger.warn(`[SYNAPSE][CDP] MCP response parse failed or not a JSON list.`);
                }
            }
        } catch (e) { /* command not found or failed */ }

        // Priority 2: Standard port scan
        const ports = [9222, 9223, 6009, 6010]; 
        for (const port of ports) {
            try {
                const req = await this.httpGet(`http://localhost:${port}/json`);
                const targets = JSON.parse(req);
                if (Array.isArray(targets)) {
                    const target = this.matchTarget(targets, identifier);
                    if (target) {
                        (target as any)._port = port;
                        return target;
                    }
                }
            } catch (e) { /* ignore */ }
        }
        return null;
    }

    private matchTarget(targets: any[], identifier: string): any | null {
        Logger.info(`[SYNAPSE][CDP] Scanning ${targets.length} targets for: ${identifier}`);
        
        for (const t of targets) {
            Logger.info(`[SYNAPSE][CDP] Candidate: ${t.type} | ${t.title?.substring(0, 30)}... | URL: ${(t.url || '').substring(0, 50)}...`);
        }

        // Priority 1: Exact webview match
        const webviewTarget = targets.find((t: any) => 
            (t.url || '').startsWith('vscode-webview://') && 
            (t.url || '').includes('synapse-visual-architecture')
        );
        if (webviewTarget) {
            Logger.info(`[SYNAPSE][CDP] High-Confidence Target Found: ${webviewTarget.title.substring(0, 50)}... (WebView)`);
            return webviewTarget;
        }

        return targets.find((t: any) => {
            const title = t.title || '';
            const url = t.url || '';
            const type = t.type || '';
            
            // Flexible matching for VSCode webviews and components
            const isMatch = 
                title.toLowerCase().includes(identifier.toLowerCase()) ||
                title.includes('SYNAPSE') ||
                title.includes('Canvas') ||
                title.includes('Architecture') ||
                url.includes('vscode-webview://') ||
                url.includes('synapse') ||
                url.includes(identifier) ||
                ((type === 'page' || type === 'iframe') && url.includes('webview'));

            if (isMatch) {
                Logger.info(`[SYNAPSE][CDP] Target identified: ${title.substring(0, 50)}... (${type})`);
            }
            return isMatch;
        });
    }

    private httpGet(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const options = {
                timeout: 1500,
                headers: { 
                    'Accept': 'application/json',
                    'User-Agent': 'Synapse-Ghost-Manager'
                }
            };
            const req = http.get(url, options, (res) => {
                const contentType = res.headers['content-type'] || '';
                if (contentType.includes('text/event-stream')) {
                    req.destroy();
                    reject(new Error('SSE Stream detected, skipping synchronous read'));
                    return;
                }

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 50)}`));
                    } else {
                        resolve(data);
                    }
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            req.setTimeout(1500, () => {
                req.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    public async injectScript(target: any, script: string): Promise<boolean> {
        if (!target.webSocketDebuggerUrl) return false;
        
        Logger.info(`[SYNAPSE][CDP] Attaching Ghost Protocol to: ${target.title}`);

        try {
            await this.ghostProtocolSession(target.webSocketDebuggerUrl, script);
            Logger.info(`[SYNAPSE][CDP] Ghost Injection sequence COMPLETED for: ${target.title}`);
            return true;
        } catch (e) {
            Logger.error(`[SYNAPSE][CDP] Ghost Protocol failed: ${e}`);
            return false;
        }
    }

    private ghostProtocolSession(wsUrl: string, script: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const url = new URL(wsUrl);
            const port = url.port || (url.protocol === 'wss:' ? 443 : 80);
            const host = url.hostname;
            const path = url.pathname + url.search;

            const key = crypto.randomBytes(16).toString('base64');
            const handshake = 
                `GET ${path} HTTP/1.1\r\n` +
                `Host: ${host}:${port}\r\n` +
                `Upgrade: websocket\r\n` +
                `Connection: Upgrade\r\n` +
                `Sec-WebSocket-Key: ${key}\r\n` +
                `Sec-WebSocket-Version: 13\r\n\r\n`;

            const socket = net.createConnection({ host, port: Number(port) }, () => {
                socket.write(handshake);
            });

            let handshaken = false;
            let executionContextFound = false;

            socket.on('data', (buffer) => {
                const response = buffer.toString();
                if (!handshaken) {
                    if (response.includes('HTTP/1.1 101')) {
                        handshaken = true;
                        // STEP 1: Enable Runtime & Page to get execution contexts and persistence
                        const enableRuntime = JSON.stringify({ id: this.requestId++, method: 'Runtime.enable' });
                        const enablePage = JSON.stringify({ id: this.requestId++, method: 'Page.enable' });
                        socket.write(this.createMaskedFrame(enableRuntime));
                        socket.write(this.createMaskedFrame(enablePage));

                        // [v0.2.52] Step 2: Add Persistent Script (Survives Reloads)
                        const addScriptCmd = JSON.stringify({
                            id: this.requestId++,
                            method: 'Page.addScriptToEvaluateOnNewDocument',
                            params: { source: script }
                        });
                        socket.write(this.createMaskedFrame(addScriptCmd));
                        
                        // [v0.2.51] Evaluation Guard: If we don't find a context, we still try a blind evaluate as backup after timeout
                        setTimeout(() => {
                            if (!executionContextFound) {
                                Logger.warn(`[SYNAPSE][CDP] No specialized context found for 2s. Executing blind injection.`);
                                const blindEval = JSON.stringify({
                                    id: this.requestId++,
                                    method: 'Runtime.evaluate',
                                    params: { expression: script, userGesture: true }
                                });
                                socket.write(this.createMaskedFrame(blindEval));
                                setTimeout(() => { socket.destroy(); resolve(); }, 1000);
                            }
                        }, 2000);
                    } else if (response.includes('HTTP/1.1 400') || response.includes('HTTP/1.1 403')) {
                        socket.destroy();
                        reject(new Error(`Handshake failed`));
                    }
                    return;
                }

                // Parse WebSocket frame (Basic implementation for control events)
                try {
                    const raw = buffer.toString('utf8');
                    if (raw.includes('Runtime.executionContextCreated')) {
                        // [v0.2.53] Main World Detection: Prefer contexts with empty name (usually the app world)
                        const match = raw.match(/"id":(\d+).*?"origin":"(vscode-webview:\/\/.*?)"(?:.*?"name":"(.*?)")?/);
                        if (match) {
                            const contextId = parseInt(match[1]);
                            const origin = match[2];
                            const name = match[3] || "";
                            
                            // If name is not empty (e.g., 'vscode-isolated...'), it might be an isolated world.
                            // We prefer the one with no name (Main World).
                            if (name === "" || !executionContextFound) {
                                Logger.info(`[SYNAPSE][CDP] Target Context identified: ${contextId} (Name: "${name}", Origin: ${origin})`);
                                
                                const evaluateCmd = JSON.stringify({
                                    id: this.requestId++,
                                    method: 'Runtime.evaluate',
                                    params: {
                                        expression: script,
                                        contextId: contextId,
                                        userGesture: true,
                                        awaitPromise: true
                                    }
                                });
                                socket.write(this.createMaskedFrame(evaluateCmd));
                                executionContextFound = true;
                                
                                // In v0.2.53, we don't immediately resolve if it was an isolated world.
                                // If it's the main world (name === ""), we wrap up.
                                if (name === "") {
                                    setTimeout(() => { socket.destroy(); resolve(); }, 1500);
                                }
                            }
                        }
                    }
                } catch (e) {
                    // JSON or parsing error, keep listening
                }
            });

            socket.on('error', (err) => reject(err));
            socket.setTimeout(5000, () => { socket.destroy(); resolve(); }); // General safety timeout
        });
    }

    private createMaskedFrame(payload: string): Buffer {
        const data = Buffer.from(payload);
        const len = data.length;
        const mask = crypto.randomBytes(4);
        let headerLen = 2 + 4; // Basic + Mask
        let offset = 2;

        if (len >= 65536) {
            headerLen += 8;
            offset += 8;
        } else if (len >= 126) {
            headerLen += 2;
            offset += 2;
        }

        const frame = Buffer.alloc(headerLen + len);
        frame[0] = 0x81; // FIN + Text

        if (len < 126) {
            frame[1] = 0x80 | len;
        } else if (len < 65536) {
            frame[1] = 0x80 | 126;
            frame.writeUInt16BE(len, 2);
        } else {
            frame[1] = 0x80 | 127;
            frame.writeBigUInt64BE(BigInt(len), 2);
        }

        mask.copy(frame, offset);
        for (let i = 0; i < len; i++) {
            frame[offset + 4 + i] = data[i] ^ mask[i % 4];
        }
        return frame;
    }
}
