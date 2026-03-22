const fs = require('fs');

// 1. Fix WebGLRenderer.render signature and cleanup
let webglCode = fs.readFileSync('ui/webgl-renderer.js', 'utf8');

// Fix signature to match CanvasEngine's call: (nodes, transform, isDirty, edges, ...)
const oldSignature = /render\(transform, nodes, edges, currentMode\) \{/;
const newSignature = `render(nodes, transform, isDirty, edges, nodeMap, isEdgeDirty, isTextDirty) {
        this.drawCalls = 0; // [v0.2.26] Reset counter`;
webglCode = webglCode.replace(oldSignature, newSignature);

// Add Cleanup at the end of render
const renderEndMark = "console.log(`[SYNAPSE WebGL] Frame #${this.__perfCounter} | DrawCalls: ${this.drawCalls} | Instancing: ${this.ext ? 'ON' : 'OFF'} | Nodes: ${nodes.length} | Edges: ${this.edgeCount}`);\n        }\n    }";
const renderCleanup = `console.log(\`[SYNAPSE WebGL] Frame #\${this.__perfCounter} | DrawCalls: \${this.drawCalls} | Instancing: \${this.ext ? 'ON' : 'OFF'} | Nodes: \${nodes.length} | Edges: \${this.edgeCount}\`);
        }
        // [v0.2.26] Explicit Cleanup to avoid Context Contamination
        this.gl.useProgram(null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }`;
webglCode = webglCode.replace(renderEndMark, renderCleanup);

// 2. Fix Edge Colors in WebGL
const edgeShaderPatch = `        const fsEdge = \`
            precision mediump float;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 0.8); 
            }
        \`;`;
webglCode = webglCode.replace(/const fsEdge = `[\s\S]*?`;/, edgeShaderPatch);

// Add vColor varying to vsEdge
const edgeVertexShaderPatch = `        const vsEdge = \`
            attribute vec2 aVertexPosition;
            attribute vec3 aColor;
            varying vec3 vColor;
            uniform mat3 uProjectionMatrix;
            void main() {
                vColor = aColor;
                gl_Position = vec4((uProjectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
            }
\`;`;
webglCode = webglCode.replace(/const vsEdge = `[\s\S]*?`;/, edgeVertexShaderPatch);

fs.writeFileSync('ui/webgl-renderer.js', webglCode);

// 3. Fix CanvasEngine.render (Isolation and Opacity)
let canvasCode = fs.readFileSync('ui/canvas-engine.js', 'utf8');

// Add forceResetGLState
const forceResetFn = `
    /**
     * [v0.2.26] GPU 및 WebGL 상태 강제 초기화 (Isolation Guard)
     */
    forceResetGLState() {
        if (!this.webglEnabled || !this.webglRenderer) return;
        const gl = this.webglRenderer.gl;
        if (!gl) return;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(null);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // 2D 캔버스 초기화 (Flicker 방지용)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
`;

// Insert it before render()
canvasCode = canvasCode.replace(/render\(\) \{/, `${forceResetFn}\n    render() {`);

// Update render loop to use reset and strict branching
const renderPatch = `                    if (this.webglEnabled && this.webglRenderer && this.currentMode === 'graph') {
                        this.webglRenderer.render(
                            this.nodes,
                            this.transform,
                            this.isGraphDataDirty,
                            this.edges,
                            this.nodeMap,
                            this.isEdgeDirty,
                            this.isTextDirty
                        );
                        this.isGraphDataDirty = false;
                        this.isEdgeDirty = false;
                        this.isTextDirty = false;
                    } else {
                        // [v0.2.26] Non-WebGL Mode or Mode Change: Clear and Draw 2D
                        this.forceResetGLState();
                        this.renderEdges2D();  
                        this.renderLabels2D(); 
                    }
`;
canvasCode = canvasCode.replace(/if \(this\.webglEnabled && this\.webglRenderer && this\.currentMode === 'graph'\) \{[\s\S]*?else if \(!this\.webglEnabled \|\| this\.currentMode !== 'graph'\) \{[\s\S]*?this\.renderLabels2D\(\); \n\s+\}/, renderPatch);

// Fix 2D Active node opacity
const opacityFix = `        // [v0.2.22/v0.2.26] Node Status & High DTR Glow Override
        if (node.status === 'active') {
            borderColor = '#83a598'; 
            node.visual.opacity = 1.0; // Ensure full visibility
        } else if (node.status === 'ghost') {`;
canvasCode = canvasCode.replace(/if \(node\.status === 'active'\) \{[\s\S]*?\} else if \(node\.status === 'ghost'\) \{/, opacityFix);

fs.writeFileSync('ui/canvas-engine.js', canvasCode);
console.log("Successfully applied v0.2.26: Rendering Isolation & Argument Fix");
