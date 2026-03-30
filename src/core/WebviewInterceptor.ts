import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * [v0.2.46] WebviewInterceptor: The Vein Piercer
 * 웹뷰 통신(postMessage)을 직접 가로채어 '하수구'가 아닌 '전용 광케이블'을 도청함.
 */
export class WebviewInterceptor {
    private static instance: WebviewInterceptor;
    private isArmed = false;

    private constructor() {}

    public static getInstance(): WebviewInterceptor {
        if (!WebviewInterceptor.instance) {
            WebviewInterceptor.instance = new WebviewInterceptor();
        }
        return WebviewInterceptor.instance;
    }

    public activate(context: vscode.ExtensionContext) {
        if (this.isArmed) return;
        
        console.log('[SYNAPSE] WebviewInterceptor: Arming message sniffer (VEIN PIERCER MODE)...');
        
        this.patchWebviewPanelCreation(context);
        this.patchWebviewPanelSerialization(context);
        this.patchWebviewViewRegistration(context); // [v0.2.46] Add View Provider hooking
        
        this.isArmed = true;
        
        // Status Bar Update for v0.2.47
        const webviewStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1003);
        webviewStatus.text = '$(eye) GHOST IN THE SHELL';
        webviewStatus.tooltip = 'SYNAPSE: DOM Spy (v0.2.47) Active';
        webviewStatus.color = '#00FF00'; // Matrix Green
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
            
            console.log(`[SYNAPSE][WEBVIEW] Panel Created: ${viewType} (${title})`);
            self.hookWebview(panel, viewType);
            
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
                console.log(`[SYNAPSE][WEBVIEW] Panel Revived: ${viewType}`);
                self.hookWebview(panel, viewType);
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
                console.log(`[SYNAPSE][WEBVIEW] WebviewView Resolved: ${viewId}`);
                // [v0.2.46] Hook the WebviewView's webview
                self.hookWebview(webviewView as any, viewId);
                return originalResolve.apply(provider, [webviewView, context, token]);
            };

            return originalRegisterWebviewViewProvider.apply(this, [viewId, provider, options]);
        };
    }

    private hookWebview(panel: any, viewType: string) {
        const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!projectRoot) return;

        // [v0.2.46] VEIN PIERCER: Mirror Loop Guard (자가 요격 방지)
        if (viewType.includes('synapse')) {
            console.log(`[SYNAPSE][WEBVIEW] Guard: Skipping self-interception for ${viewType}`);
            return;
        }

        const isAntigravity = viewType.includes('antigravity') || viewType.includes('gemini');
        const interceptHits = path.join(projectRoot, '.synapse_contexts', 'intercept_hits.log');
        const webviewDebug = path.join(projectRoot, '.synapse_contexts', 'webview_debug.log');

        console.log(`[SYNAPSE][VEIN_PIERCER] Injecting Poison Needle into: ${viewType}`);

        // [v0.2.47] GHOST HIT: 웹뷰 내부 스파이 스크립트로부터의 직접 보고 수신
        panel.webview.onDidReceiveMessage((msg: any) => {
            const timestamp = new Date().toISOString();
            
            if (msg.command === 'synapse-spy-hit' && msg.text) {
                const clean = msg.text.replace(/\n/g, ' ').substring(0, 1000);
                // [v0.2.47] Mirror Loop Suppression for Ghost Hits
                if (clean.includes('Boundary Violation') || clean.includes('LogicAnalyzer')) return;

                fs.appendFileSync(interceptHits, `[${timestamp}] [GHOST_HIT] [${viewType}] -> ${clean}\n`, 'utf-8');
                
                vscode.commands.executeCommand('synapse.logPrompt', {
                    prompt: `[GHOST] ${clean}`,
                    source: `GhostInTheShell:${viewType}`
                });
                return;
            }

            const extracted = this.recursiveScan(msg);
            
            for (const content of extracted) {
                if (this.hasHangeul(content)) {
                    // [v0.2.46] Mirror Loop Suppression
                    if (content.includes('Boundary Violation') || content.includes('LogicAnalyzer')) continue;

                    const clean = content.replace(/\n/g, ' ').substring(0, 1000);
                    fs.appendFileSync(interceptHits, `[${timestamp}] [VEIN_HIT][1] [${viewType}] -> ${clean}\n`, 'utf-8');
                    
                    vscode.commands.executeCommand('synapse.logPrompt', {
                        prompt: clean,
                        source: `VeinPiercer:1:${viewType}`
                    });
                }
            }
            // Debug trace
            fs.appendFileSync(webviewDebug, `[${timestamp}] IN [${viewType}] -> ${JSON.stringify(msg).substring(0, 300)}\n`, 'utf-8');
        });

        // 7번 타격: 호스트 -> 웹뷰 (Assistant Output)
        const originalPost = panel.webview.postMessage.bind(panel.webview);
        panel.webview.postMessage = async (msg: any) => {
            const timestamp = new Date().toISOString();
            const extracted = this.recursiveScan(msg);
            
            for (const content of extracted) {
                if (this.hasHangeul(content) || (isAntigravity && content.length > 50)) {
                    // [v0.2.46] Mirror Loop Suppression
                    if (content.includes('Boundary Violation') || content.includes('LogicAnalyzer')) continue;

                    const clean = content.replace(/\n/g, ' ').substring(0, 1000);
                    fs.appendFileSync(interceptHits, `[${timestamp}] [VEIN_HIT][7] [${viewType}] -> ${clean}\n`, 'utf-8');
                    
                    vscode.commands.executeCommand('synapse.logPrompt', {
                        chunk: clean,
                        finish: true, 
                        source: `VeinPiercer:7:${viewType}`
                    });
                }
            }
            // Debug trace
            fs.appendFileSync(webviewDebug, `[${timestamp}] OUT [${viewType}] -> ${JSON.stringify(msg).substring(0, 300)}\n`, 'utf-8');
            return originalPost(msg);
        };

        // [v0.2.47] NUCLEAR OPTION: HTML Injection (GHOST IN THE SHELL)
        // 놈들의 웹뷰 소스를 직접 수정하여 우리만의 스파이 스크립트를 주입함.
        const self = this;
        
        try {
            const webviewProto = Object.getPrototypeOf(panel.webview);
            console.log(`[SYNAPSE][GHOST] Attempting to hook ${viewType}. Proto: ${webviewProto.constructor.name}`);
            
            // [v0.2.47 Senior] Prototype-level Hooking
            let descriptor = Object.getOwnPropertyDescriptor(webviewProto, 'html');
            
            // If not on immediate proto, check further up (though usually it's there)
            if (!descriptor) {
                console.log(`[SYNAPSE][GHOST] Descriptor 'html' not found on immediate prototype, checking instance...`);
                descriptor = Object.getOwnPropertyDescriptor(panel.webview, 'html');
            }

            if (descriptor && descriptor.set) {
                // Determine if we should patch prototype or instance
                const target = Object.getOwnPropertyDescriptor(webviewProto, 'html') ? webviewProto : panel.webview;
                const isProto = target === webviewProto;

                if (!(target as any).__synapse_patched) {
                    console.log(`[SYNAPSE][GHOST] Patching ${isProto ? 'Prototype' : 'Instance'} 'html' setter...`);
                    const originalSet = descriptor.set;
                    const originalGet = descriptor.get;

                    Object.defineProperty(target, 'html', {
                        get: function() { return originalGet?.call(this); },
                        set: function(newHtml: string) {
                            const instanceViewType = (this as any).__synapse_view_type || 'unknown';
                            const isHooked = (this as any).__synapse_hooked;

                            if (!isHooked || !newHtml) return originalSet.call(this, newHtml);

                            // [v0.2.47] CSP 완화 및 스크립트 주입
                            const spyTag = '<!-- [SYNAPSE GHOST SPY v0.2.47] -->';
                            if (newHtml.includes(spyTag)) return originalSet.call(this, newHtml);

                            console.log(`[SYNAPSE][GHOST] Injecting Spy into ${instanceViewType}`);
                            const relaxedHtml = self.relaxCSP(newHtml);
                            const spyScript = self.getSpyScript();
                            let patchedHtml = relaxedHtml;

                            if (relaxedHtml.toLowerCase().includes('<body')) {
                                patchedHtml = relaxedHtml.replace(/<body([^>]*)>/i, `<body$1>${spyScript}`);
                            } else if (relaxedHtml.toLowerCase().includes('<html>')) {
                                patchedHtml = relaxedHtml.replace('<html>', `<html><body>${spyScript}`);
                            } else {
                                patchedHtml = spyScript + relaxedHtml;
                            }
                            return originalSet.call(this, patchedHtml);
                        },
                        configurable: true,
                        enumerable: true
                    });
                    (target as any).__synapse_patched = true;
                }
            } else {
                console.error(`[SYNAPSE][GHOST] FAILED to find 'html' setter for ${viewType}!`);
            }

            // Flag this instance for interception
            panel.webview.__synapse_hooked = true;
            panel.webview.__synapse_view_type = viewType;

            // 이미 HTML이 설정되어 있다면 즉시 재설정하여 스크립트 주입 트리거
            if (panel.webview.html) {
                panel.webview.html = panel.webview.html;
            }
        } catch (e) {
            console.error(`[SYNAPSE][GHOST] Critical failure in Shell Piercing for ${viewType}:`, e);
        }
    }

    private relaxCSP(html: string): string {
        // [v0.2.47] More aggressive CSP relaxation
        return html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'].*?>/gi, (match) => {
            let result = match;
            // 1. script-src: Add unsafe-inline and unsafe-eval
            if (result.includes('script-src')) {
                if (!result.includes("'unsafe-inline'")) {
                    result = result.replace("script-src", "script-src 'unsafe-inline' 'unsafe-eval'");
                }
            } else {
                // If script-src is missing but default-src is present, add script-src
                if (result.includes('default-src')) {
                    result = result.replace("default-src", "script-src 'unsafe-inline' 'unsafe-eval' ; default-src");
                }
            }
            
            // 2. connect-src: Ensure it doesn't block reporting if we were to use an external collector (optional)
            
            return result;
        });
    }

    private getSpyScript(): string {
        return `
        <!-- [SYNAPSE GHOST SPY v0.2.47] -->
        <script>
        (function() {
            let vscodeApi = null;
            try {
                // VS Code API bridge
                if (window.__synapse_vscode) {
                    vscodeApi = window.__synapse_vscode;
                } else {
                    try {
                        vscodeApi = acquireVsCodeApi();
                        window.__synapse_vscode = vscodeApi;
                    } catch (e) {
                        // Already acquired by another script
                    }
                }

                const reportHit = (text) => {
                    if (!text || text.length < 5 || !/[가-힣]/.test(text)) return;
                    if (vscodeApi) {
                        vscodeApi.postMessage({
                            command: 'synapse-spy-hit',
                            text: text.trim()
                        });
                    }
                };

                const observedNodes = new WeakSet();
                const setupObserver = (root) => {
                    if (!root || observedNodes.has(root)) return;
                    observedNodes.add(root);

                    const observer = new MutationObserver((mutations) => {
                        for (const mutation of mutations) {
                            if (mutation.type === 'childList') {
                                mutation.addedNodes.forEach(node => {
                                    if (node.nodeType === 3) { // TEXT_NODE
                                        reportHit(node.textContent);
                                    } else if (node.nodeType === 1) { // ELEMENT_NODE
                                        if (node.innerText || node.textContent) {
                                            reportHit(node.innerText || node.textContent);
                                        }
                                        // Shadow DOM recursive scan
                                        if (node.shadowRoot) setupObserver(node.shadowRoot);
                                        node.querySelectorAll('*').forEach(el => {
                                            if (el.shadowRoot) setupObserver(el.shadowRoot);
                                        });
                                    }
                                });
                            } else if (mutation.type === 'characterData') {
                                reportHit(mutation.target.textContent);
                            }
                        }
                    });

                    observer.observe(root, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                    
                    // Initial Deep Scan
                    if (root.querySelectorAll) {
                        root.querySelectorAll('*').forEach(el => {
                            if (el.shadowRoot) setupObserver(el.shadowRoot);
                        });
                    }
                };

                // Hook attachShadow to catch dynamically created components
                const originalAttachShadow = Element.prototype.attachShadow;
                if (originalAttachShadow) {
                    Element.prototype.attachShadow = function(options) {
                        const shadow = originalAttachShadow.call(this, options);
                        setTimeout(() => setupObserver(shadow), 100);
                        return shadow;
                    };
                }

                // Initial Arming
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => setupObserver(document.body));
                } else {
                    setupObserver(document.body);
                }

                console.log('[SYNAPSE][GHOST] Ghost Spy ARMED (Shadow DOM Recursive Scan active)');
            } catch (err) {
                console.error('[SYNAPSE][GHOST] initialization error:', err);
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
