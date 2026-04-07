import * as vscode from 'vscode';
import * as fs from 'fs';
import { Logger } from '../utils/Logger';
import * as path from 'path';

/**
 * [v0.2.53] WebviewInterceptor: Neuro-Link (Wall Penetrator)
 * Webview 내부의 JS Realm까지 침투하여 Host <-> Webview 간의 모든 통신(Upstream/Downstream)을 요격함.
 * Prototype Poisoning의 한계를 극복하기 위해 인스턴스 레벨의 속성 탈취(Hijacking)를 병행함.
 */
export class WebviewInterceptor {
    private static instance: WebviewInterceptor;
    private isArmed = false;
    private isPrototypePoisoned = false;
    private originalHtmlSetter: ((val: string) => void) | undefined;
    private originalHtmlGetter: (() => string) | undefined;

    private constructor() {}

    public static getInstance(): WebviewInterceptor {
        if (!WebviewInterceptor.instance) {
            WebviewInterceptor.instance = new WebviewInterceptor();
        }
        return WebviewInterceptor.instance;
    }

    public activate(context: vscode.ExtensionContext) {
        if (this.isArmed) {
            Logger.info('[SYNAPSE][STEP1] WebviewInterceptor: ALREADY ARMED.');
            return;
        }
        
        Logger.info('[SYNAPSE][STEP1] WebviewInterceptor: ACTIVATION SEQUENCE START (v0.2.53).');
        
        try {
            this.patchWebviewPanelCreation(context);
            this.patchWebviewPanelSerialization(context);
            this.patchWebviewViewRegistration(context);
            
            this.isArmed = true;
            Logger.info('[SYNAPSE][STEP1] WebviewInterceptor: ARMED & READY (v0.2.53).');
        } catch (e) {
            Logger.error(`[SYNAPSE][STEP1] WebviewInterceptor activation failed: ${e}`);
        }
        
        const webviewStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1003);
        webviewStatus.text = '$(eye) NEURO-LINK SYNC';
        webviewStatus.tooltip = 'SYNAPSE: Wall Penetrator (v0.2.53) Active';
        webviewStatus.color = '#00FFFF'; // Cyan
        webviewStatus.show();
        context.subscriptions.push(webviewStatus);
    }

    private patchWebviewPanelCreation(context: vscode.ExtensionContext) {
        const originalCreateWebviewPanel = vscode.window.createWebviewPanel;
        const self = this;

        (vscode.window as any).createWebviewPanel = function(
            viewType: string,
            title: string,
            showOptions: vscode.ViewColumn | { readonly viewColumn: vscode.ViewColumn; readonly preserveFocus?: boolean },
            options?: vscode.WebviewPanelOptions & vscode.WebviewOptions
        ): vscode.WebviewPanel {
            const panel = originalCreateWebviewPanel.apply(this, [viewType, title, showOptions, options]);
            
            Logger.info(`[SYNAPSE][WEBVIEW] Panel Created: ${viewType} (${title})`);
            
            // [v0.2.52] Rapid Prototype & Instance Capture
         /* [v0.3.10] Disable ghost protocol injection
        if (viewType === 'synapseCanvas' || viewType === 'synapse-visual-architecture.canvas') {
            setTimeout(() => this.injectGhostProtocol(panel, viewType), 3000);
        }
        */
        Logger.info(`[SYNAPSE][WEBVIEW] CDP Injection DISABLED for ${viewType} per user request.`);
    
            return panel;
        };
    }

    private patchWebviewPanelSerialization(context: vscode.ExtensionContext) {
        const originalRegisterWebviewPanelSerializer = vscode.window.registerWebviewPanelSerializer;
        const self = this;

        (vscode.window as any).registerWebviewPanelSerializer = function(
            viewType: string,
            serializer: vscode.WebviewPanelSerializer
        ): vscode.Disposable {
            const originalDeserialize = serializer.deserializeWebviewPanel;
            
            serializer.deserializeWebviewPanel = async (panel: vscode.WebviewPanel, state: any) => {
                Logger.info(`[SYNAPSE][WEBVIEW] Panel Revived: ${viewType}`);
                
                self.ensurePrototypePoisoned(panel.webview);
                self.hookWebviewInstance(panel, viewType);
                return originalDeserialize.apply(serializer, [panel, state]);
            };

            return originalRegisterWebviewPanelSerializer.apply(this, [viewType, serializer]);
        };
    }

    private patchWebviewViewRegistration(context: vscode.ExtensionContext) {
        const originalRegisterWebviewViewProvider = vscode.window.registerWebviewViewProvider;
        const self = this;

        (vscode.window as any).registerWebviewViewProvider = function(
            viewId: string,
            provider: vscode.WebviewViewProvider,
            options?: { readonly webviewOptions?: { readonly retainContextWhenHidden?: boolean } }
        ): vscode.Disposable {
            const originalResolve = provider.resolveWebviewView;
            
            provider.resolveWebviewView = async (webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken) => {
                Logger.info(`[SYNAPSE][WEBVIEW] WebviewView Resolved: ${viewId}`);
                
                self.ensurePrototypePoisoned(webviewView.webview);
                self.hookWebviewInstance(webviewView as any, viewId);
                return originalResolve.apply(provider, [webviewView, context, token]);
            };

            return originalRegisterWebviewViewProvider.apply(this, [viewId, provider, options]);
        };
    }

    private ensurePrototypePoisoned(webview: vscode.Webview) {
        if (this.isPrototypePoisoned) return;

        try {
            Logger.info('[SYNAPSE][NEURO_LINK] Attempting Global Prototype Poisoning...');
            
            let proto = webview;
            let descriptor = null;
            while (proto) {
                descriptor = Object.getOwnPropertyDescriptor(proto, 'html');
                if (descriptor && descriptor.set) break;
                proto = Object.getPrototypeOf(proto);
            }

            if (proto && descriptor && descriptor.set) {
                const self = this;
                this.originalHtmlSet = descriptor.set;
                this.originalHtmlGet = descriptor.get;

                Logger.info(`[SYNAPSE][NEURO_LINK] Poisoning Webview Prototype: ${proto.constructor?.name || 'unknown'}`);

                Object.defineProperty(proto, 'html', {
                    get: function() { return self.originalHtmlGet?.call(this); },
                    set: function(newHtml: string) {
                        const viewType = (this as any).__synapse_view_type || 'unknown';
                        
                        // [v0.2.50] Minimal Guard: Only skip if already injected to prevent loop, 
                        // but ALLOW initial injection for 'synapse' if it's the target.
                        const spyTag = '<!-- [SYNAPSE GHOST SPY v0.2.52] -->';
                        if (newHtml.includes(spyTag)) return self.originalHtmlSet?.call(this, newHtml);

                        Logger.info(`[SYNAPSE][NEURO_LINK] Global HTML Hook Triggered for [${viewType}]`);
                        const patchedHtml = self.patchHtml(newHtml, viewType);
                        return self.originalHtmlSet?.call(this, patchedHtml);
                    },
                    configurable: true,
                    enumerable: true
                });

                // postMessage (Host -> Webview) Hook
                let msgProto = webview;
                while (msgProto) {
                    if (Object.prototype.hasOwnProperty.call(msgProto, 'postMessage')) break;
                    msgProto = Object.getPrototypeOf(msgProto);
                }
                
                if (msgProto && (msgProto as any).postMessage) {
                    const originalPost = (msgProto as any).postMessage;
                    (msgProto as any).postMessage = function(msg: any) {
                        const viewType = (this as any).__synapse_view_type || 'unknown';
                        // Intercept Downstream (Extension -> Webview)
                        self.interceptOutgoingMessage(viewType, msg);
                        return originalPost.call(this, msg);
                    };
                    Logger.info(`[SYNAPSE][NEURO_LINK] postMessage hooked on prototype (Downstream capture active).`);
                }

                this.isPrototypePoisoned = true;
                Logger.info('[SYNAPSE][NEURO_LINK] Global Prototype Poisoning SUCCESSFUL.');
            }
        } catch (e) {
            Logger.error(`[SYNAPSE][NEURO_LINK] Prototype poisoning failed: ${e}`);
        }
    }

    private originalHtmlSet: ((val: string) => void) | undefined;
    private originalHtmlGet: (() => string) | undefined;

    private patchHtml(html: string, viewType: string): string {
        const spyTag = '<!-- [SYNAPSE GHOST SPY v0.2.52] -->';
        if (html.includes(spyTag)) return html;

        const relaxedHtml = this.relaxCSP(html);
        const spyScript = this.getSpyScript();
        let patchedHtml = relaxedHtml;

        if (relaxedHtml.toLowerCase().includes('<body')) {
            patchedHtml = relaxedHtml.replace(/<body([^>]*)>/i, `<body$1>${spyScript}`);
        } else if (relaxedHtml.toLowerCase().includes('<html>')) {
            patchedHtml = relaxedHtml.replace('<html>', `<html><body>${spyScript}`);
        } else {
            patchedHtml = spyScript + relaxedHtml;
        }
        return patchedHtml;
    }

    private interceptOutgoingMessage(viewType: string, msg: any) {
        const timestamp = new Date().toISOString();
        const extracted = this.recursiveScan(msg);
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!projectRoot) return;
        const interceptHits = path.join(projectRoot, '.synapse_contexts', 'intercept_hits.log');

        for (const content of extracted) {
            if (this.hasHangeul(content) || (content.length > 50 && (viewType.includes('antigravity') || viewType.includes('synapse')))) {
                if (content.includes('Boundary Violation') || content.includes('LogicAnalyzer')) continue;

                const clean = content.replace(/\n/g, ' ').substring(0, 1000);
                // [v0.3.10] Intercept logging to file disabled
                // fs.appendFileSync(interceptHits, `[${timestamp}] [VEIN_HIT][HOST->WEBVIEW] [${viewType}] -> ${clean}\n`, 'utf-8');
                
                vscode.commands.executeCommand('synapse.logPrompt', {
                    chunk: `[DOWNSTREAM] ${clean}`,
                    finish: true, 
                    source: `NeuroLink:Downstream:${viewType}`
                });
            }
        }
    }

    private hookWebviewInstance(panel: any, viewType: string) {
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!projectRoot) return;

        panel.webview.__synapse_view_type = viewType;

        // [v0.2.50] Forced Instance-level Property Hijacking (Backup for Prototype failure)
        try {
            const webview = panel.webview;
            const self = this;
            if (!(webview as any).__synapse_hijacked) {
                Logger.info(`[SYNAPSE][WEBVIEW] Hijacking Instance: ${viewType}`);
                
                // If it already has HTML, inject immediately
                if (webview.html) {
                    const currentHtml = webview.html;
                    const spyTag = '<!-- [SYNAPSE GHOST SPY v0.2.52] -->';
                    if (!currentHtml.includes(spyTag)) {
                        Logger.info(`[SYNAPSE][FORCE] Manually injecting into existing ${viewType} content`);
                        // Use original class setter if we have it, otherwise fallback to direct assignment
                        if (this.originalHtmlSet) {
                            this.originalHtmlSet.call(webview, self.patchHtml(currentHtml, viewType));
                        } else {
                            webview.html = self.patchHtml(currentHtml, viewType);
                        }
                    }
                }
                
                // [v0.3.10] Ghost Protocol Trigger Removed
                
                // Patch the .html property on this specific instance
                Object.defineProperty(webview, 'html', {
                    get: function() { return self.originalHtmlGet?.call(this); },
                    set: function(val: string) {
                        const patched = self.patchHtml(val, viewType);
                        if (self.originalHtmlSet) {
                            return self.originalHtmlSet.call(this, patched);
                        } else {
                            // Recursion guard if we have to set directly
                            if ((this as any).__synapse_setting) return;
                            (this as any).__synapse_setting = true;
                            this.html = patched;
                            delete (this as any).__synapse_setting;
                        }
                    },
                    configurable: true,
                    enumerable: true
                });
                (webview as any).__synapse_hijacked = true;
            }
        } catch (e) {
            Logger.warn(`[SYNAPSE][WEBVIEW] Instance hijacking failed for ${viewType}: ${e}`);
        }

        const interceptHits = path.join(projectRoot, '.synapse_contexts', 'intercept_hits.log');

        // Instance-level message handler (Webview -> Host)
        panel.webview.onDidReceiveMessage((msg: any) => {
            const timestamp = new Date().toISOString();
            
            if (msg.command === 'synapse-ghost-pong') {
                Logger.info(`[SYNAPSE][STEP4] Neuro-Link HANDSHAKE SUCCESS from [${viewType}]`);
                // [v0.3.10] Handshake logging disabled
                // fs.appendFileSync(interceptHits, `[${timestamp}] [PONG] Neuro-Link Sync ${viewType}\n`, 'utf-8');
                return;
            }

            if (msg.command === 'synapse-spy-hit' && (msg.text || msg.data)) {
                const text = msg.text || JSON.stringify(msg.data);
                Logger.info(`[SYNAPSE][NEURO_HIT] [${msg.source || 'DOM'}] Capture from [${viewType}]: ${text.substring(0, 50)}...`);
                
                const clean = text.replace(/\n/g, ' ').substring(0, 1000);
                if (clean.includes('Boundary Violation') || clean.includes('LogicAnalyzer')) return;

                // [v0.3.10] Spy hit logging disabled
                // fs.appendFileSync(interceptHits, `[${timestamp}] [NEURO_HIT] [${viewType}] -> ${clean}\n`, 'utf-8');
                
                vscode.commands.executeCommand('synapse.logPrompt', {
                    prompt: `[NEURO] ${clean}`,
                    source: `NeuroLink:Upstream:${viewType}`
                });
                return;
            }

            // Fallback: Intercept Upstream (Webview -> Extension) if not caught by spy
            const extracted = this.recursiveScan(msg);
            for (const content of extracted) {
                if (this.hasHangeul(content) || (content.length > 50 && (viewType.includes('antigravity') || viewType.includes('synapse')))) {
                    if (content.includes('Boundary Violation') || content.includes('LogicAnalyzer')) continue;

                    const clean = content.replace(/\n/g, ' ').substring(0, 1000);
                    // [v0.3.10] Upstream hit logging disabled
                    // fs.appendFileSync(interceptHits, `[${timestamp}] [VEIN_HIT][WEBVIEW->HOST] [${viewType}] -> ${clean}\n`, 'utf-8');
                    
                    vscode.commands.executeCommand('synapse.logPrompt', {
                        prompt: `[UPSTREAM] ${clean}`,
                        source: `VeinPiercer:Upstream:${viewType}`
                    });
                }
            }
        });
    }

    // [v0.3.10] Ghost Protocol trigger REMOVED

    private relaxCSP(html: string): string {
        return html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'].*?>/gi, (match) => {
            let result = match;
            if (result.includes('script-src')) {
                if (!result.includes("'unsafe-inline'")) {
                    result = result.replace("script-src", "script-src 'unsafe-inline' 'unsafe-eval'");
                }
            } else if (result.includes('default-src')) {
                result = result.replace("default-src", "script-src 'unsafe-inline' 'unsafe-eval' ; default-src");
            }
            return result;
        });
    }

    private getGhostInjectionScript(): string {
        // [v0.2.53] Enhanced bridge hijacking with debugging beacons
        return `
        (function() {
            if (window.__synapse_ghost_active) return;
            window.__synapse_ghost_active = true;
            
            console.log('[SYNAPSE][GHOST][DEBUG] Ghost Protocol Injected. Context: ' + (typeof acquireVsCodeApi !== 'undefined' ? 'MAIN' : 'ISOLATED'));
            
            const hookApi = (api) => {
                if (!api || api.__synapse_hooked) return api;
                const orig = api.postMessage;
                api.postMessage = function(msg) {
                    // Filter out our own signals to prevent loops
                    if (msg && msg.command !== 'synapse-spy-hit' && msg.command !== 'synapse-ghost-pong') {
                        console.log('[SYNAPSE][GHOST][UPSTREAM]', msg);
                        try {
                            orig.call(this, {
                                command: 'synapse-spy-hit',
                                data: msg,
                                source: 'CDP:GhostHook'
                            });
                        } catch (e) {}
                    }
                    return orig.apply(this, arguments);
                };
                api.__synapse_hooked = true;
                console.log('[SYNAPSE][GHOST] acquireVsCodeApi.postMessage successfully hooked.');
                return api;
            };

            // 1. Hook existing global acquireVsCodeApi
            const origAcquire = window.acquireVsCodeApi || (window.parent && window.parent.acquireVsCodeApi);
            if (origAcquire) {
                window.acquireVsCodeApi = function() {
                    console.log('[SYNAPSE][GHOST] acquireVsCodeApi called by app.');
                    return hookApi(origAcquire.apply(this, arguments));
                };
                
                // 2. Pre-emptive hook if already initialized
                try {
                    const api = window.acquireVsCodeApi(); 
                    if (api) {
                        api.postMessage({ command: 'synapse-ghost-pong', version: 'v0.2.53' });
                    }
                } catch(e) {}
            } else {
                console.warn('[SYNAPSE][GHOST] acquireVsCodeApi not found in this context.');
            }
            
            // 3. Mutation Observer as a safety net (Isolated World fallback)
            // Even if we are in Isolated World, we can see the DOM changes.
            const obs = new MutationObserver((m) => {
                m.forEach(n => {
                    if (n.type === 'childList') n.addedNodes.forEach(node => {
                        const txt = node.innerText || node.textContent;
                        if (txt && txt.length > 5 && /[가-힣]/.test(txt)) {
                             try { 
                                const api = acquireVsCodeApi();
                                api.postMessage({ command: 'synapse-spy-hit', text: txt, source: 'CDP:Observer' }); 
                             } catch(e) {}
                        }
                    });
                });
            });
            if (document.body) obs.observe(document.body, { childList: true, subtree: true });
        })();
        `;
    }

    private getSpyScript(): string {
        return `
        <!-- [SYNAPSE GHOST SPY v0.2.52] -->
        <script>
        (function() {
            if (window.__synapse_renderer_spy_active) return;
            window.__synapse_renderer_spy_active = true;
            let vscodeApi = null;
            
            const reportHit = (text, source = 'observer') => {
                if (!text || text.length < 5) return;
                // Korean monitor OR large data (likely JSON/State)
                if (/[가-힣]/.test(text) || text.length > 500) {
                    if (vscodeApi) {
                        vscodeApi.postMessage({
                            command: 'synapse-spy-hit',
                            text: text.trim(),
                            source: source
                        });
                    }
                }
            };

            const hookVsCodeApi = (api) => {
                if (!api || api.__synapse_hooked) return api;
                console.log('[SYNAPSE][RENDERER] Hooking VsCodeApi (Wall Penetrator active)');
                
                const originalPost = api.postMessage;
                api.postMessage = function(msg) {
                    // Capture Upstream (Webview -> Host) explicitly
                    if (msg && msg.command !== 'synapse-spy-hit' && msg.command !== 'synapse-ghost-pong') {
                         console.log('[SYNAPSE][RENDERER][UPSTREAM] Data captured:', msg);
                         // We report it back so host can log it as [NEURO]
                         originalPost.call(this, {
                            command: 'synapse-spy-hit',
                            data: msg,
                            source: 'UpstreamHook'
                         });
                    }
                    return originalPost.apply(this, arguments);
                };
                api.__synapse_hooked = true;
                return api;
            };

            try {
                // [v0.2.50] Mandatory acquireVsCodeApi Hook
                const originalAcquire = window.acquireVsCodeApi || (window.parent && window.parent.acquireVsCodeApi);
                if (originalAcquire) {
                    window.acquireVsCodeApi = function() {
                        const api = originalAcquire.apply(this, arguments);
                        vscodeApi = hookVsCodeApi(api);
                        return vscodeApi;
                    };
                }

                // Global postMessage Monitoring (Alternative channel)
                window.addEventListener('message', (event) => {
                    // Possible cross-iframe communication capture
                });

                // Handshake & Init
                const initSpy = () => {
                    if (!vscodeApi) {
                        try { vscodeApi = acquireVsCodeApi(); } catch(e) {}
                    }
                    if (vscodeApi) {
                        console.log('[SYNAPSE][STEP3] Neuro-Link SYNC established');
                        vscodeApi.postMessage({ command: 'synapse-ghost-pong' });
                    }
                };

                setTimeout(initSpy, 500);

                // DOM observer
                const observedNodes = new WeakSet();
                const setupObserver = (root) => {
                    if (!root || observedNodes.has(root)) return;
                    observedNodes.add(root);

                    const observer = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeType === 3) reportHit(node.textContent);
                                    else if (node.nodeType === 1) {
                                        reportHit(node.innerText || node.textContent);
                                        if (node.shadowRoot) setupObserver(node.shadowRoot);
                                        node.querySelectorAll?.('*').forEach(el => { if (el.shadowRoot) setupObserver(el.shadowRoot); });
                                    }
                                });
                            } else if (mutation.type === 'characterData') {
                                reportHit(mutation.target.textContent);
                            }
                        }
                    });

                    observer.observe(root, { childList: true, subtree: true, characterData: true });
                    root.querySelectorAll?.('*').forEach(el => { if (el.shadowRoot) setupObserver(el.shadowRoot); });
                };

                const originalAttachShadow = Element.prototype.attachShadow;
                if (originalAttachShadow) {
                    Element.prototype.attachShadow = function(options) {
                        const shadow = originalAttachShadow.call(this, options);
                        setTimeout(() => setupObserver(shadow), 100);
                        return shadow;
                    };
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => setupObserver(document.body));
                } else {
                    setupObserver(document.body);
                }
                
                console.log('[SYNAPSE][GHOST] Wall Penetrator ARMED');
            } catch (err) {
                console.warn('[SYNAPSE][GHOST] Neuro-Link sync error:', err);
            }
        })();
        </script>
        `;
    }

    private hasHangeul(text: string): boolean {
        return /[가-힣]/.test(text);
    }

    private recursiveScan(obj: any, depth = 0): string[] {
        if (depth > 5 || !obj) return [];
        const results: string[] = [];

        if (typeof obj === 'string' && obj.trim().length > 1) {
            results.push(obj.trim());
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                results.push(...this.recursiveScan(item, depth + 1));
            }
        } else if (typeof obj === 'object') {
            for (const key in obj) {
                try {
                    results.push(...this.recursiveScan(obj[key], depth + 1));
                } catch (e) {}
            }
        }
        return results;
    }
}
