/**
 * SYNAPSE WebGL Renderer (v0.2.23-optimized)
 * @file webgl-renderer.js
 * @description WebGL 2D Renderer for Synapse Node Elements and Background (High Performance)
 */

class TextAtlas {
    constructor(gl) {
        this.gl = gl;
        this.glyphMap = new Map();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.canvas.width = 1024;
        this.canvas.height = 1024;

        this.x = 0;
        this.y = 0;
        this.rowHeight = 0;

        this.texture = gl.createTexture();
        this.needsUpload = false;
        
        // Blank transparent background
        this.ctx.clearRect(0, 0, 1024, 1024);
    }

    addText(text) {
        if (!text) return;
        let modified = false;
        for (const ch of text) {
            if (this.glyphMap.has(ch)) continue;
            const metrics = this._drawGlyph(ch);
            this.glyphMap.set(ch, metrics);
            modified = true;
        }
        if (modified) this.needsUpload = true;
    }

    _drawGlyph(ch) {
        const ctx = this.ctx;
        ctx.font = '12px Inter, sans-serif'; // Default UI font
        
        const m = ctx.measureText(ch);
        const w = Math.ceil(m.width) + 2;
        const h = 16;
        
        if (this.x + w > this.canvas.width) {
            this.x = 0;
            this.y += this.rowHeight;
            this.rowHeight = 0;
        }
        
        ctx.fillStyle = '#ebdbb2'; // Gruvbox light text
        ctx.textBaseline = 'top';
        ctx.fillText(ch, this.x + 1, this.y + 2);
        
        const glyph = {
            u0: this.x / this.canvas.width,
            v0: this.y / this.canvas.height,
            u1: (this.x + w) / this.canvas.width,
            v1: (this.y + h) / this.canvas.height,
            w, h
        };
        
        this.x += w;
        this.rowHeight = Math.max(this.rowHeight, h);
        return glyph;
    }

    upload() {
        if (!this.needsUpload) return;
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.needsUpload = false;
    }
}

class WebGLRenderer {
    constructor(canvas2d) {
        // [v0.2.21-fix] WebGL needs its OWN canvas.
        this.canvas2d = canvas2d;
        this.glCanvas = document.createElement('canvas');
        this.glCanvas.id = 'webgl-overlay-canvas';
        this.glCanvas.width = canvas2d.width;
        this.glCanvas.height = canvas2d.height;
        this.glCanvas.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            pointer-events: none !important;
            z-index: 5;
            background: transparent !important;
            background-color: transparent !important;
        `;
        canvas2d.parentElement.insertBefore(this.glCanvas, canvas2d);
        if (canvas2d.parentElement.style.position === '') {
            canvas2d.parentElement.style.position = 'relative';
        }

        this.canvas = this.glCanvas;
        this.gl = this.glCanvas.getContext('webgl', { 
            antialias: true, 
            alpha: true, 
            depth: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: true // [v0.2.25] Ensures nodes stay visible without dirty redraw
        });

        if (!this.gl) {
            console.error('[SYNAPSE] WebGL not supported.');
            return;
        }

        this.ext = this.gl.getExtension('ANGLE_instanced_arrays');
        
        // [v0.2.23] Layer Management
        this.layers = {
            background: { id: 'background', fbo: null, texture: null, isDirty: true },
            middle: { id: 'middle', fbo: null, texture: null, isDirty: true }
        };

        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0, 0, 0, 0);

        this.textAtlas = new TextAtlas(this.gl);

        this.initShaders();
        this.cacheLocations();
        this.initBuffers();
        this.initStarfield();
        this.initLayerFBOs();

        console.log('[SYNAPSE WebGL] Renderer Initialized. Instancing:', !!this.ext);
        this.nodeCount = 0;
        this.edgeCount = 0;
        this.charCount = 0;
        this.starRotation = 0;
        
        this._nodeCache = null;
        this._lastDataVersion = 0;
        
        // [v0.2.24] Buffers for reuse to minimize GC
        this._textData = null;
        this._lastTransform = { zoom: 1, offsetX: 0, offsetY: 0 };
    }

    initShaders() {
        // Node Instanced Shader
        const vsSource = `
            attribute vec2 aVertexPosition;
            attribute vec2 aInstancePosition;
            attribute vec3 aInstanceColor;
            attribute float aInstanceSize;
            uniform mat3 uProjectionMatrix;
            varying vec3 vColor;
            varying vec2 vCoord;
            void main() {
                vColor = aInstanceColor;
                vCoord = aVertexPosition;
                vec2 worldPos = aInstancePosition + aVertexPosition * aInstanceSize;
                vec3 projected = uProjectionMatrix * vec3(worldPos, 1.0);
                gl_Position = vec4(projected.xy, 0.0, 1.0);
            }
        `;
        const fsSource = `
            precision mediump float;
            varying vec3 vColor;
            varying vec2 vCoord;
            void main() {
                // [v0.2.25] Enhanced Box Shader with Emissive Bloom
                float distMask = max(abs(vCoord.x), abs(vCoord.y));
                if (distMask > 1.0) discard;
                
                // Node Body
                float body = 1.0 - smoothstep(0.8, 0.82, distMask);
                // Glow/Aura (Pulsing simulated by shader time or just heavy weight)
                float aura = 1.0 - smoothstep(0.7, 1.0, distMask);
                
                vec3 nodeColor = vColor;
                vec3 finalColor = nodeColor * body * 0.8; // darkened body
                finalColor += nodeColor * aura * 1.8;      // strong emissive glow
                
                float finalAlpha = max(body * 0.9, aura * 0.6);
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `;
        this.nodeProgram = this.createProgram(vsSource, fsSource);

        // Starfield Shaders
        const starVS = `
            attribute vec3 aPosition;
            uniform mat4 uMatrix;
            varying float vBrightness;
            void main() {
                gl_Position = uMatrix * vec4(aPosition.xy, 0.0, 1.0);
                gl_PointSize = aPosition.z * 2.0;
                vBrightness = aPosition.z / 5.0;
            }
        `;
        const starFS = `
            precision mediump float;
            varying float vBrightness;
            void main() {
                gl_FragColor = vec4(1.0, 1.0, 1.0, vBrightness);
            }
        `;
        this.starProgram = this.createProgram(starVS, starFS);

        // Edge Instanced Shader
                const vsEdge = `
            attribute vec2 aVertexPosition;
            attribute vec3 aColor;
            varying vec3 vColor;
            uniform mat3 uProjectionMatrix;
            void main() {
                vColor = aColor;
                gl_Position = vec4((uProjectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
            }
`;
                const fsEdge = `
            precision mediump float;
            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4(vColor, 0.8); 
            }
        `;
        this.edgeProgram = this.createProgram(vsEdge, fsEdge);

        // Text Instanced Shader
        const vsText = `
            attribute vec2 aVertexPosition; // [0,0] to [1,1]
            attribute vec4 aInstancePosArea; // [x, y, w, h]
            attribute vec4 aInstanceUV;      // [u0, v0, u1, v1]
            uniform mat3 uProjectionMatrix;
            varying vec2 v_uv;

            void main() {
                vec2 pos = aInstancePosArea.xy + aVertexPosition * aInstancePosArea.zw;
                vec3 projected = uProjectionMatrix * vec3(pos, 1.0);
                gl_Position = vec4(projected.xy, 0.0, 1.0);
                v_uv = mix(aInstanceUV.xy, aInstanceUV.zw, aVertexPosition);
            }
        `;
        const fsText = `
            precision mediump float;
            varying vec2 v_uv;
            uniform sampler2D u_tex;
            void main() {
                gl_FragColor = texture2D(u_tex, v_uv);
            }
        `;
        this.textProgram = this.createProgram(vsText, fsText);

        // [v0.2.23] Composite Shader (Kept for compatibility, though currently unused)
        const compVS = `
            attribute vec2 aPosition;
            varying vec2 vTexCoord;
            void main() {
                vTexCoord = aPosition * 0.5 + 0.5;
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        `;
        const compFS = `
            precision mediump float;
            uniform sampler2D uTexture;
            varying vec2 vTexCoord;
            void main() {
                gl_FragColor = texture2D(uTexture, vTexCoord);
            }
        `;
        this.compProgram = this.createProgram(compVS, compFS);
    }

    cacheLocations() {
        this.locs = {
            node: {
                pos: this.gl.getAttribLocation(this.nodeProgram, 'aInstancePosition'),
                color: this.gl.getAttribLocation(this.nodeProgram, 'aInstanceColor'),
                size: this.gl.getAttribLocation(this.nodeProgram, 'aInstanceSize'),
                vertex: this.gl.getAttribLocation(this.nodeProgram, 'aVertexPosition'),
                uProj: this.gl.getUniformLocation(this.nodeProgram, 'uProjectionMatrix')
            },
            star: {
                pos: this.gl.getAttribLocation(this.starProgram, 'aPosition'),
                uMat: this.gl.getUniformLocation(this.starProgram, 'uMatrix')
            },
            edge: {
                vertex: this.gl.getAttribLocation(this.edgeProgram, 'aVertexPosition'),
                instanceEdge: this.gl.getAttribLocation(this.edgeProgram, 'aInstanceEdge'),
                uProj: this.gl.getUniformLocation(this.edgeProgram, 'uProjectionMatrix')
            },
            text: {
                vertex: this.gl.getAttribLocation(this.textProgram, 'aVertexPosition'),
                instancePosArea: this.gl.getAttribLocation(this.textProgram, 'aInstancePosArea'),
                instanceUV: this.gl.getAttribLocation(this.textProgram, 'aInstanceUV'),
                uProj: this.gl.getUniformLocation(this.textProgram, 'uProjectionMatrix'),
                uTex: this.gl.getUniformLocation(this.textProgram, 'u_tex')
            }
        };
    }

    createProgram(vsSource, fsSource) {
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fsSource);
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        return program;
    }

    loadShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    initBuffers() {
        const positions = [-1, 1, 1, 1, -1, -1, 1, -1];
        this.rectBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        this.posBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.sizeBuffer = this.gl.createBuffer();

        // Edge Buffer setup
        const edgeVertices = [0, -0.5, 1, -0.5, 0, 0.5, 1, 0.5];
        this.edgeRectBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeRectBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(edgeVertices), this.gl.STATIC_DRAW);

        this.edgeInstanceBuffer = this.gl.createBuffer();

        // Text Buffer setup
        const textVertices = [0, 0, 1, 0, 0, 1, 1, 1];
        this.textRectBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textRectBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textVertices), this.gl.STATIC_DRAW);

        this.textInstanceBuffer = this.gl.createBuffer();
        
        // [v0.2.24-Final] Pre-allocate large buffers once to avoid gl.bufferData stalls
        // 10k nodes, 20k edges, 50k characters
        this._nodePosArr = new Float32Array(10000 * 2);
        this._nodeColorArr = new Float32Array(10000 * 3);
        this._nodeSizeArr = new Float32Array(10000);
        this._edgeArr = new Float32Array(20000 * 4);
        this._textArr = new Float32Array(50000 * 8);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodePosArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeColorArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeSizeArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeInstanceBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._edgeArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textInstanceBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._textArr.byteLength, this.gl.DYNAMIC_DRAW);

        // [v0.2.23] Full-screen quad for composite
        const quadPos = [-1, -1, 1, -1, -1, 1, 1, 1];
        this.quadBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(quadPos), this.gl.STATIC_DRAW);
    }

    initStarfield() {
        const stars = [];
        for (let i = 0; i < 3000; i++) {
            stars.push(Math.random() * 4000 - 2000); // X
            stars.push(Math.random() * 4000 - 2000); // Y
            stars.push(Math.random() * 4.0);         // Size/Brightness
        }
        this.starBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.starBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(stars), this.gl.STATIC_DRAW);
    }

    /**
     * [v0.2.23] FBO Initialization & Layer Texture allocation
     */
    initLayerFBOs() {
        Object.values(this.layers).forEach(layer => {
            const { fbo, texture } = this.createFBO(this.canvas.width, this.canvas.height);
            layer.fbo = fbo;
            layer.texture = texture;
            layer.isDirty = true;
        });
    }

    createFBO(width, height) {
        const gl = this.gl;
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { fbo, texture };
    }

    resizeLayers(width, height) {
        console.log(`[SYNAPSE] FBO Resize: ${width}x${height}`);
        this.glCanvas.width = width;
        this.glCanvas.height = height;

        Object.values(this.layers).forEach(layer => {
            if (layer.fbo) this.gl.deleteFramebuffer(layer.fbo);
            if (layer.texture) this.gl.deleteTexture(layer.texture);
            const { fbo, texture } = this.createFBO(width, height);
            layer.fbo = fbo;
            layer.texture = texture;
            layer.isDirty = true;
        });
    }

    updateNodeData(nodes) {
        if (!this.gl || !nodes || nodes.length === 0) {
            this.nodeCount = 0;
            return;
        }

        this.nodeCount = nodes.length;

        // Use pre-allocated buffers
        const posArr = this._nodePosArr;
        const colorArr = this._nodeColorArr;
        const sizeArr = this._nodeSizeArr;

        if (!posArr) return; // Should be initialized in initBuffers

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const p = n.position || { x: 0, y: 0 };
            
            // Adjust to match 2D layout centering
            posArr[i * 2] = p.x + 60;
            posArr[i * 2 + 1] = p.y + 30;

            // [v0.2.22] Map Status and Type to WebGL Colors (Sync with Conventions)
            let nColor = n.data?.color || '#ebdbb2';
            if (n.status === 'active') nColor = '#83a598';
            else if (n.status === 'warning' || n.isError) nColor = '#fb4934';
            else if (n.status === 'ghost') nColor = '#928374';
            else if (n.status === 'deleted') nColor = '#282828';
            else if (n.status === 'error_necrosis' || n.status === 'error_tombstone') nColor = '#1d2021';
            else if (n.intelligence?.dtr >= 0.7) nColor = '#8a2be2'; // DTR Purple

            const c = this.hexToRgb(nColor);
            colorArr[i * 3] = c.r;
            colorArr[i * 3 + 1] = c.g;
            colorArr[i * 3 + 2] = c.b;

            sizeArr[i] = 45.0; // radius adapted for boxes
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, posArr.subarray(0, this.nodeCount * 2));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, colorArr.subarray(0, this.nodeCount * 3));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, sizeArr.subarray(0, this.nodeCount));
    }

    updateEdgeData(edges, nodeMap) {
        if (!this.gl || !edges || edges.length === 0) {
            this.edgeCount = 0;
            return;
        }

        let sizeChanged = false;
        if (!this._edgeData || this._edgeData.length !== edges.length * 4) {
            this._edgeData = new Float32Array(edges.length * 4);
            sizeChanged = true;
        }
        
        const data = this._edgeData;
        let cnt = 0;
        for (const e of edges) {
            // [v0.2.24] O(N) Map Lookup 제거: 한 번 찾으면 직접 참조
            if (e.srcNode && e.tgtNode) {
                data[cnt++] = e.srcNode.position.x + 60;
                data[cnt++] = e.srcNode.position.y + 30;
                data[cnt++] = e.tgtNode.position.x + 60;
                data[cnt++] = e.tgtNode.position.y + 30;
            } else {
                const src = nodeMap.get(e.from);
                const tgt = nodeMap.get(e.to);
                if (src && tgt && src.position && tgt.position) {
                    e.srcNode = src; // cache it!
                    e.tgtNode = tgt;
                    data[cnt++] = src.position.x + 60;
                    data[cnt++] = src.position.y + 30;
                    data[cnt++] = tgt.position.x + 60;
                    data[cnt++] = tgt.position.y + 30;
                }
            }
        }
        this.edgeCount = cnt / 4;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeInstanceBuffer);
        if (sizeChanged) {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, data.subarray(0, cnt), this.gl.DYNAMIC_DRAW);
        } else {
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data.subarray(0, cnt));
        }
    }

    updateTextData(nodes) {
        if (!this.gl || !this.textAtlas || !nodes || nodes.length === 0) {
            this.charCount = 0;
            return;
        }

        const t0 = performance.now();

        // 1️⃣ Pre-bake Relative Layout per Node (O(N) only when label changes)
        nodes.forEach(n => {
            const label = n.data?.label || n.id || "";
            // If label changed or layout missing, bake it
            if (!n._textLayout || n._textLayoutLabel !== label) {
                this.textAtlas.addText(label);
                const items = [];
                let totalW = 0;
                for (const ch of label) {
                    const g = this.textAtlas.glyphMap.get(ch);
                    if (g) totalW += g.w;
                }
                
                // Rel centers (relative to node top-left)
                let relXStart = 60 - totalW / 2;
                let relY = 65; 
                let curX = relXStart;
                
                for (const ch of label) {
                    const g = this.textAtlas.glyphMap.get(ch);
                    if (!g) continue;
                    items.push({
                        dx: curX, dy: relY,
                        w: g.w, h: g.h,
                        u0: g.u0, v0: g.v0, u1: g.u1, v1: g.v1
                    });
                    curX += g.w;
                }
                n._textLayout = items;
                n._textLayoutLabel = label;
            }
        });

        // 2️⃣ Calculate Total Buffer Size
        let totalChars = 0;
        for (const n of nodes) {
            if (n._textLayout) totalChars += n._textLayout.length;
        }

        if (totalChars === 0) {
            this.charCount = 0;
            return;
        }

        // 3️⃣ Reuse Float32Array (O(1) buffer allocation after first run)
        if (!this._textData || this._textData.length !== totalChars * 8) {
            this._textData = new Float32Array(totalChars * 8);
        }
        const data = this._textData;

        // 4️⃣ Fast Fill (No string ops, pure math, zero GC)
        let idx = 0;
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            // Safety: Skip if node isn't fully ready
            if (!n.position || typeof n.position.x !== 'number') continue;
            
            const px = n.position.x;
            const py = n.position.y;
            const layout = n._textLayout;
            if (!layout) continue;
            
            for (let j = 0; j < layout.length; j++) {
                const l = layout[j];
                data[idx++] = px + l.dx;
                data[idx++] = py + l.dy;
                data[idx++] = l.w;
                data[idx++] = l.h;
                data[idx++] = l.u0;
                data[idx++] = l.v0;
                data[idx++] = l.u1;
                data[idx++] = l.v1;
            }
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textInstanceBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
        this.charCount = totalChars;

        // 5️⃣ Atlas Upload (Lazy - only if new glyphs were added)
        this.textAtlas.upload();

        const dt = performance.now() - t0;
        if (dt > 10) {
            console.warn(`[SYNAPSE WebGL] Heavy Text Update: ${dt.toFixed(2)}ms for ${totalChars} chars`);
        }
    }

    /**
     * [v0.2.24] Direct Rendering Optimization — Bye bye FBO caching for now.
     * Everything is drawn directly to screen buffer in a single pass.
     */
    handleResize() {
        const width = Math.floor(this.canvas2d.width);
        const height = Math.floor(this.canvas2d.height);
        
        if (this.glCanvas.width !== width || this.glCanvas.height !== height) {
            this.glCanvas.width = width;
            this.glCanvas.height = height;
            if (this.gl) {
                this.gl.viewport(0, 0, width, height);
            }
            console.log(`[SYNAPSE WebGL] Context resize sync: ${width}x${height}`);
        }
    }

    render(nodes, transform, isDataDirty = false, edges = null, nodeMap = null, isEdgeDirty = false, isTextDirty = false) {
        if (!this.gl) return;
        
        // [v0.2.25] Iron Isolation: Stop everything if not in graph mode
        if (this.canvas2d.dataset.mode !== 'graph' && (!window.engine || window.engine.currentMode !== 'graph')) {
            return;
        }

        // Entire buffer clear is now deferred to just before drawing to minimize flickering gap.
        
        // Ensure alpha blending is explicitly ENABLED for proper transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);

        const edgeLen = edges ? edges.length : 0;
        if (isDataDirty || this.nodeCount !== nodes.length) {
            this.updateNodeData(nodes);
            // 만약 노드가 바뀌면 선 위치도 바뀌어야 하므로 edgeDirty 강제 처리
            isEdgeDirty = true; 
            isTextDirty = true;
        }

        if (isEdgeDirty || this.lastEdgeCount !== edgeLen) {
            if (edges && nodeMap) {
                this.updateEdgeData(edges, nodeMap);
            }
            this.lastEdgeCount = edgeLen;
        }

        const isSatellite = transform.zoom < 0.4;
        
        // [v0.2.24-perf] ONLY update text data if dirty OR zoom level crossed satellite threshold
        const wasSatellite = (this._lastZoom === undefined) ? !isSatellite : (this._lastZoom < 0.4); // Initialize _lastZoom state
        const zoomPhaseChanged = isSatellite !== wasSatellite;
        
        if (isTextDirty || zoomPhaseChanged) {
            if (isSatellite) {
                this.charCount = 0; // Disable text in satellite view
            } else {
                this.updateTextData(nodes);
            }
        }
        this._lastZoom = transform.zoom;

        // Clear WebGL context
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); // Ensure drawing to screen
        this.gl.clearColor(0, 0, 0, 0); 
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Draw Sequence: Background (Stars) -> Edges -> Nodes -> Text
        this.drawStars(transform);
        if (this.edgeCount > 0) this.drawEdges(transform);
        this.drawNodes(transform);
        
        // Satellite view에서는 텍스트 생략
        if (!isSatellite && this.charCount > 0) {
            this.drawText(transform);
        }

        this._lastTransform = { ...transform };

        // [v0.2.24] Perf Audit & Robust Logging
        if (!this.__perfCounter) this.__perfCounter = 0;
        this.__perfCounter++;

        // ALWAYS log at least once, then every 60 frames
        if (this.__perfCounter < 10 || this.__perfCounter % 60 === 0) {
            console.log(`[SYNAPSE WebGL] Frame #${this.__perfCounter} | DrawCalls: ${this.drawCalls} | Instancing: ${this.ext ? 'ON' : 'OFF'} | Nodes: ${nodes.length} | Edges: ${this.edgeCount}`);
        }
        // [v0.2.26] Explicit Cleanup to avoid Context Contamination
        this.gl.useProgram(null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    drawStars(transform) {
        this.gl.useProgram(this.starProgram);
        const zoomScale = transform.zoom * 0.2;
        const matrix = [
            zoomScale, 0, 0, 0,
            0, zoomScale, 0, 0,
            0, 0, 1, 0,
            (transform.offsetX * 0.001), (transform.offsetY * 0.001), 0, 1
        ];
        this.gl.uniformMatrix4fv(this.locs.star.uMat, false, matrix);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.starBuffer);
        const posLoc = this.locs.star.pos;
        this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(posLoc);
        // Important: Reset divisor for non-instanced drawing
        if (this.ext) this.ext.vertexAttribDivisorANGLE(posLoc, 0);
        
        this.gl.drawArrays(this.gl.POINTS, 0, 3000);
        this.drawCalls++;
    }

    drawEdges(transform) {
        if (!this.ext || this.edgeCount === 0) return;
        this.gl.useProgram(this.edgeProgram);
        
        const dpr = window.devicePixelRatio || 1;
        const scaleX = 2 / this.canvas.width;
        const scaleY = -2 / this.canvas.height;
        const mat = [
            (transform.zoom * dpr) * scaleX, 0, 0,
            0, (transform.zoom * dpr) * scaleY, 0,
            -1 + (transform.offsetX * dpr) * scaleX, 1 + (transform.offsetY * dpr) * scaleY, 1
        ];
        this.gl.uniformMatrix3fv(this.locs.edge.uProj, false, mat);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeRectBuffer);
        const vPos = this.locs.edge.vertex;
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);
        if (this.ext) this.ext.vertexAttribDivisorANGLE(vPos, 0);

        this.setAttrPointer(this.edgeInstanceBuffer, this.locs.edge.instanceEdge, 4, 0, 0, 1);

        if (this.ext) {
            this.ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, 4, this.edgeCount);
            this.drawCalls++;
        }
    }

    drawNodes(transform) {
        if (this.nodeCount === 0) return;
        this.gl.useProgram(this.nodeProgram);
        const dpr = window.devicePixelRatio || 1;
        const scaleX = 2 / this.canvas.width;
        const scaleY = -2 / this.canvas.height;
        const mat = [
            (transform.zoom * dpr) * scaleX, 0, 0,
            0, (transform.zoom * dpr) * scaleY, 0,
            -1 + (transform.offsetX * dpr) * scaleX, 1 + (transform.offsetY * dpr) * scaleY, 1
        ];
        this.gl.uniformMatrix3fv(this.locs.node.uProj, false, mat);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
        const vPos = this.locs.node.vertex;
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);
        if (this.ext) this.ext.vertexAttribDivisorANGLE(vPos, 0); // Core Quad vertex: divisor 0

        this.setAttrPointer(this.posBuffer, this.locs.node.pos, 2, 0, 0, 1);
        this.setAttrPointer(this.colorBuffer, this.locs.node.color, 3, 0, 0, 1);
        this.setAttrPointer(this.sizeBuffer, this.locs.node.size, 1, 0, 0, 1);
        if (this.ext) {
            this.ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, 4, this.nodeCount);
            this.drawCalls++;
        } else {
            for (let i = 0; i < this.nodeCount; i++) {
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
                this.drawCalls++;
            }
        }
    }

    drawText(transform) {
        if (!this.ext || this.charCount === 0) return;
        this.gl.useProgram(this.textProgram);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textAtlas.texture);
        this.gl.uniform1i(this.locs.text.uTex, 0);

        const scaleX = 2 / this.canvas.width;
        const scaleY = -2 / this.canvas.height;
        const dpr = window.devicePixelRatio || 1;
        const mat = [
            transform.zoom * scaleX, 0, 0,
            0, transform.zoom * scaleY, 0,
            -1 + (transform.offsetX * dpr) * scaleX, 1 + (transform.offsetY * dpr) * scaleY, 1
        ];
        this.gl.uniformMatrix3fv(this.locs.text.uProj, false, mat);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textRectBuffer);
        const vPos = this.locs.text.vertex;
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);
        if (this.ext) this.ext.vertexAttribDivisorANGLE(vPos, 0);

        // Interleaved: [x, y, w, h, u0, v0, u1, v1] = 8 floats = 32 bytes
        this.setAttrPointer(this.textInstanceBuffer, this.locs.text.instancePosArea, 4, 32, 0, 1);
        this.setAttrPointer(this.textInstanceBuffer, this.locs.text.instanceUV, 4, 32, 16, 1);

        if (this.ext) {
            this.ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, 4, this.charCount);
            this.drawCalls++;
        }
    }

    composite() {
        this.gl.useProgram(this.compProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
        const posLoc = this.gl.getAttribLocation(this.compProgram, 'aPosition');
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

        const texLoc = this.gl.getUniformLocation(this.compProgram, 'uTexture');

        // Draw In Order: background -> middle
        [this.layers.background, this.layers.middle].forEach(layer => {
            if (!layer.texture) return;
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, layer.texture);
            this.gl.uniform1i(texLoc, 0);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        });
    }

    setAttrPointer(buffer, loc, size, stride = 0, offset = 0, divisor = 1) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        if (loc === -1) return;
        this.gl.enableVertexAttribArray(loc);
        this.gl.vertexAttribPointer(loc, size, this.gl.FLOAT, false, stride, offset);
        if (this.ext) {
            this.ext.vertexAttribDivisorANGLE(loc, divisor);
        }
    }

    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') return { r: 0.27, g: 0.52, b: 0.53 };
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 1, g: 1, b: 1 };
    }
}


