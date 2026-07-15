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
        
        // [FIX v0.3.09] Emoji detection and font selection
        // Inter는 이모지를 지원하지 않으므로, 이모지인 경우 별도 폰트 사용
        const isEmoji = /\p{Emoji}/u.test(ch);
        if (isEmoji) {
            // 이모지 지원 폰트 스택: Noto Color Emoji (가장 광범위) → Apple Color Emoji → Segoe UI Emoji
            ctx.font = '14px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        } else {
            ctx.font = '12px Inter, sans-serif';  // Default UI font for ASCII/Latin
        }
        
        const m = ctx.measureText(ch);
        let w = Math.ceil(m.width) + 2;
        let h = isEmoji ? 18 : 16;  // Emoji는 더 크게
        
        // [FIX v0.3.09] Emoji minimum size guarantee
        // 이모지가 너무 작으면 안보이니 최소값 보증
        if (isEmoji && w < 16) w = 18;
        if (isEmoji && h < 16) h = 18;
        
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
            z-index: 10;
            background: transparent !important;
            background-color: transparent !important;
        `;
        // [v0.2.26] Swap order: Insert AFTER canvas2d to be on top
        canvas2d.parentElement.appendChild(this.glCanvas);
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

        // [v0.2.26] State Tracking for Inversion correction
        this._isYInverted = true;
        
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
            attribute vec2 aVertexPosition; // Quad: [-1,-1] to [1,1]
            attribute vec2 aInstancePosition;
            attribute vec3 aInstanceColor;
            attribute vec3 aInstanceBorderColor;
            attribute vec2 aInstanceSize; // [w/2, h/2]
            attribute float aIsSelected;
            attribute float aInstanceAlpha;
            attribute float aShapeType;
            attribute float aDtrLevel;
            attribute float aStatusType; // 0:Normal, 1:Active, 2:Ghost, 3:Deleted, 4:Warning, 5:Necrosis/Tombstone
            uniform mat3 uProjectionMatrix;
            uniform float uTime;
            varying vec3 vColor;
            varying vec3 vBorderColor;
            varying vec2 vCoord;
            varying float vIsSelected;
            varying float vAlpha;
            varying float vShape;
            varying float vDtr;
            varying float vStatus;
            varying float vTime;
            void main() {
                vColor = aInstanceColor;
                vBorderColor = aInstanceBorderColor;
                vCoord = aVertexPosition;
                vIsSelected = aIsSelected;
                vAlpha = aInstanceAlpha;
                vShape = aShapeType;
                vDtr = aDtrLevel;
                vStatus = aStatusType;
                vTime = uTime;
                vec2 worldPos = aInstancePosition + aVertexPosition * aInstanceSize;
                vec3 projected = uProjectionMatrix * vec3(worldPos, 1.0);
                gl_Position = vec4(projected.xy, 0.0, 1.0);
            }
        `;
        const fsSource = `
            precision mediump float;
            varying vec3 vColor;
            varying vec3 vBorderColor;
            varying vec2 vCoord; // -1 to 1
            varying float vIsSelected;
            varying float vAlpha;
            varying float vShape; 
            varying float vDtr;
            varying float vStatus;
            varying float vTime;
            uniform vec4 uSelectionColor;
            uniform vec4 uDtrGlowColor;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            void main() {
                float dist;
                // SDF for shapes
                if (vShape > 0.5 && vShape < 1.5) {
                    // Logic for Diamond (vShape == 1.0)
                    dist = abs(vCoord.x) + abs(vCoord.y) - 1.0;
                } else if (vShape > 1.5 && vShape < 2.5) {
                    // Logic for Hexagon (vShape == 2.0)
                    vec2 q = abs(vCoord);
                    dist = max(q.x * 0.866025 + q.y * 0.5, q.y) - 0.9;
                } else {
                    // [v0.3.2] Sharp Rectangles (vShape == 0.0) - Matches 2D Default
                    dist = max(abs(vCoord.x), abs(vCoord.y)) - 1.0;
                }
                
                if (dist > 0.0) discard;
                
                // [v0.3.22.9] Sharper Border Mask (matches 2D stroke)
                // Expanded to -0.04 to match 2D visual weight (approx 4.8px vs 2px stroke)
                float borderThreshold = -0.04;
                float borderMask = smoothstep(borderThreshold - 0.005, borderThreshold, dist);
                
                vec3 borderColor = vBorderColor; 
                vec3 nodeBaseColor = vColor;

                // [v0.3.22] Attribute-First status effects (No hardcoded color overrides)
                if (vStatus > 3.5 && vStatus < 4.5) { // Warning: Pulse
                    float pulse = 0.5 + 0.5 * sin(vTime * 6.0);
                    borderColor = mix(vBorderColor, vec3(1.0, 0.9, 0.9), pulse * 0.4);
                } else if (vStatus > 4.5 && vStatus < 5.5) { // Necrosis: Static Noise
                    float n = random(vCoord * sin(vTime * 0.1));
                    if (n > 0.9) nodeBaseColor = mix(nodeBaseColor, vec3(0.5), n * 0.2);
                }

                if (vIsSelected > 0.5) {
                    borderColor = uSelectionColor.rgb; 
                }
                
                // [v0.3.22] High DTR Glow (Purple #8a2be2) - High Priority parity
                if (vDtr > 0.7) {
                    float dtrPulse = 1.0 + 0.2 * sin(vTime * 4.0);
                    float glowIntensity = smoothstep(-0.5, 0.0, dist);
                    nodeBaseColor = mix(nodeBaseColor, uDtrGlowColor.rgb, glowIntensity * 0.5 * dtrPulse);
                }
                
                // [v0.3.22] Dashed Border for Ghost & External
                if ((vStatus > 1.5 && vStatus < 2.5) || vStatus > 5.5) {
                    if (borderMask > 0.1) {
                        float perimeter = (vCoord.x + 1.0) + (vCoord.y + 1.0);
                        if (mod(perimeter * 15.0, 2.0) > 1.0) discard;
                    }
                }
                
                // Final Composition
                vec3 finalColor = nodeBaseColor;
                if (borderMask > 0.1) {
                    finalColor = mix(nodeBaseColor, borderColor, borderMask);
                }
                
                float finalAlpha = vAlpha;
                if (vIsSelected < 0.5) finalAlpha *= 0.95; 
                
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

        // Edge Instanced Shader (Reconstructed Line Quad with Arrowhead)
        const vsEdge = `
            attribute vec2 aVertexPosition; // [0, -0.5] to [1, 0.5]
            attribute vec4 aInstanceEdge;   // [x1, y1, x2, y2]
            attribute vec2 aControlPoint;   // [cx, cy] for Quadratic Bezier
            attribute vec3 aEdgeColor;
            attribute float aThickness;
            attribute vec2 aDashParams;     // [dashLen, gapLen] 0 means solid
            attribute float aIsHigh;        // highlighted/pulse
            varying vec3 vColor;
            varying vec2 vTexCoord;
            varying vec2 vDash; 
            varying float vLen;
            varying float vHigh;
            varying float vTime;
            uniform mat3 uProjectionMatrix;
            uniform float uTime;
            void main() {
                vec2 p1 = aInstanceEdge.xy;
                vec2 p2 = aInstanceEdge.zw;
                
                // [v0.3.21] Edge Bundling Lite: Use dynamic control point
                float t = aVertexPosition.x;
                vec2 cp = aControlPoint;
                
                // Bezier Position (Quadratic)
                vec2 pos = (1.0-t)*(1.0-t)*p1 + 2.0*(1.0-t)*t*cp + t*t*p2;
                
                // Bezier Tangent (for normal calculation)
                vec2 tangent = 2.0*(1.0-t)*(cp - p1) + 2.0*t*(p2 - cp);
                float tanLen = length(tangent);
                vec2 norm = (tanLen > 0.01) ? vec2(-tangent.y, tangent.x) / tanLen : vec2(0.0, 1.0);
                
                vColor = aEdgeColor;
                vTexCoord = aVertexPosition;
                vDash = aDashParams;
                vHigh = aIsHigh;
                vTime = uTime;
                vLen = distance(p1, p2); // Approximation for dashing

                float lineWidth = aThickness;
                if (aIsHigh > 0.5) lineWidth += 2.0 * sin(uTime * 4.0);
                
                // [v0.3.33.2] Prevent sub-pixel culling at extreme zooms
                // uProjectionMatrix[0][0] scales roughly inversely with zoom. Ensure minimal screen thickness.
                float zoomScale = uProjectionMatrix[0][0] * 1000.0;
                float minPixelWidth = 1.5;
                float safeLineWidth = max(lineWidth, minPixelWidth / max(zoomScale, 0.0001));

                float maxFlare = 3.5;
                float flaredWidth = safeLineWidth * maxFlare;

                vec2 worldPos = pos + norm * (aVertexPosition.y * flaredWidth);
                vec3 projected = uProjectionMatrix * vec3(worldPos, 1.0);
                gl_Position = vec4(projected.xy, 0.0, 1.0);
            }
        `;
        const fsEdge = `
            precision mediump float;
            varying vec3 vColor;
            varying vec2 vTexCoord;
            varying vec2 vDash;
            varying float vLen;
            varying float vHigh;
            varying float vTime;
            void main() {
                float x = vTexCoord.x;
                float y = abs(vTexCoord.y);
                
                // 1. Dash & Marching Ants Logic
                if (vDash.x > 0.0) {
                    float totalPeriod = vDash.x + vDash.y;
                    float dist = x * vLen;
                    // Apply movement for "marching ants"
                    float move = vTime * 20.0;
                    if (mod(dist + move, totalPeriod) > vDash.x) discard;
                }

                // 2. Arrowhead vs Body
                float arrowLen = 15.0;
                float arrowZoneStart = (vLen > arrowLen) ? 1.0 - (arrowLen / vLen) : 0.0;
                float maxFlare = 3.5;
                if (x > arrowZoneStart) {
                    float ratio = (vLen > arrowLen) ? (1.0 - x) / (1.0 - arrowZoneStart) : 0.0;
                    if (y > ratio * 0.5) discard;
                } else {
                    // Constant body width: body is 1/maxFlare of the flared quad
                    if (y > (0.5 / maxFlare)) discard;
                }
                
                vec3 finalColor = vColor;
                float finalAlpha = 1.0;
                if (vHigh > 2.5) {
                    finalAlpha = 0.15; // External edge stratification
                } else if (vHigh > 1.5) {
                    finalAlpha = 0.3;
                } else if (vHigh > 0.5) {
                    finalColor = mix(vColor, vec3(1.0, 0.9, 0.0), 0.3 * sin(vTime * 6.0) + 0.3);
                }

                gl_FragColor = vec4(finalColor, finalAlpha);
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
                borderColor: this.gl.getAttribLocation(this.nodeProgram, 'aInstanceBorderColor'),
                size: this.gl.getAttribLocation(this.nodeProgram, 'aInstanceSize'),
                selected: this.gl.getAttribLocation(this.nodeProgram, 'aIsSelected'),
                alpha: this.gl.getAttribLocation(this.nodeProgram, 'aInstanceAlpha'),
                shape: this.gl.getAttribLocation(this.nodeProgram, 'aShapeType'),
                dtr: this.gl.getAttribLocation(this.nodeProgram, 'aDtrLevel'),
                statusType: this.gl.getAttribLocation(this.nodeProgram, 'aStatusType'),
                vertex: this.gl.getAttribLocation(this.nodeProgram, 'aVertexPosition'),
                uProj: this.gl.getUniformLocation(this.nodeProgram, 'uProjectionMatrix'),
                uTime: this.gl.getUniformLocation(this.nodeProgram, 'uTime'),
                uSelectionColor: this.gl.getUniformLocation(this.nodeProgram, 'uSelectionColor'),
                uDtrGlowColor: this.gl.getUniformLocation(this.nodeProgram, 'uDtrGlowColor')
            },
            star: {
                pos: this.gl.getAttribLocation(this.starProgram, 'aPosition'),
                uMat: this.gl.getUniformLocation(this.starProgram, 'uMatrix')
            },
            edge: {
                vertex: this.gl.getAttribLocation(this.edgeProgram, 'aVertexPosition'),
                instanceEdge: this.gl.getAttribLocation(this.edgeProgram, 'aInstanceEdge'),
                controlPoint: this.gl.getAttribLocation(this.edgeProgram, 'aControlPoint'),
                color: this.gl.getAttribLocation(this.edgeProgram, 'aEdgeColor'),
                thickness: this.gl.getAttribLocation(this.edgeProgram, 'aThickness'),
                dash: this.gl.getAttribLocation(this.edgeProgram, 'aDashParams'),
                high: this.gl.getAttribLocation(this.edgeProgram, 'aIsHigh'),
                uProj: this.gl.getUniformLocation(this.edgeProgram, 'uProjectionMatrix'),
                uTime: this.gl.getUniformLocation(this.edgeProgram, 'uTime')
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
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('[SYNAPSE WebGL] Link Error:', this.gl.getProgramInfoLog(program));
            return null;
        }
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
        this.borderColorBuffer = this.gl.createBuffer();
        this.sizeBuffer = this.gl.createBuffer();
        this.selectBuffer = this.gl.createBuffer(); // [New] Selection Status Buffer

        // Edge Buffer setup (Smooth Quadratic Curve)
        const segments = 32;
        const curveVertices = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            curveVertices.push(t, -0.5);
            curveVertices.push(t, 0.5);
        }
        this.edgeRectBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeRectBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(curveVertices), this.gl.STATIC_DRAW);
        this.edgeCurveSegments = segments;

        this.edgeInstanceBuffer = this.gl.createBuffer();

        // Text Buffer setup
        const textVertices = [0, 0, 1, 0, 0, 1, 1, 1];
        this.textRectBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textRectBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textVertices), this.gl.STATIC_DRAW);

        this.textInstanceBuffer = this.gl.createBuffer();
        
        // [v0.2.24-Final] Pre-allocate large buffers once to avoid gl.bufferData stalls
        // [v0.3.34] Expanded limits to support large projects like vscode-main
        const maxNodes = 50000;
        const maxEdges = 200000;
        const maxChars = 100000;

        this._nodePosArr = new Float32Array(maxNodes * 2);
        this._nodeColorArr = new Float32Array(maxNodes * 3);
        this._nodeBorderColorArr = new Float32Array(maxNodes * 3);
        this._nodeSizeArr = new Float32Array(maxNodes * 2);
        this._nodeSelectArr = new Float32Array(maxNodes); // 1 float per node
        this._edgeArr = new Float32Array(maxEdges * 4);
        this._textArr = new Float32Array(maxChars * 8);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodePosArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeColorArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeBorderColorArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeSizeArr.byteLength, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.selectBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeSelectArr.byteLength, this.gl.DYNAMIC_DRAW);
        
        this._nodeAlphaArr = new Float32Array(maxNodes);
        this.alphaBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.alphaBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeAlphaArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._nodeShapeArr = new Float32Array(maxNodes);
        this.nodeShapeBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeShapeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeShapeArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._nodeStatusArr = new Float32Array(maxNodes);
        this.nodeStatusBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeStatusBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeStatusArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._nodeDtrArr = new Float32Array(maxNodes);
        this.nodeDtrBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeDtrBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._nodeDtrArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._edgeHighArr = new Float32Array(maxEdges);
        this.edgeHighBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeHighBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._edgeHighArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._edgeColorArr = new Float32Array(maxEdges * 3);
        this.edgeColorBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._edgeColorArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._edgeThickArr = new Float32Array(maxEdges);
        this.edgeThickBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeThickBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._edgeThickArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._edgeDashArr = new Float32Array(maxEdges * 2);
        this.edgeDashBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeDashBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._edgeDashArr.byteLength, this.gl.DYNAMIC_DRAW);

        this._edgeControlArr = new Float32Array(maxEdges * 2);
        this.edgeControlBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeControlBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this._edgeControlArr.byteLength, this.gl.DYNAMIC_DRAW);

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

    updateNodeData(nodes, selectedNodeIds = new Set()) {
        if (!this.gl || !nodes || nodes.length === 0) {
            this.nodeCount = 0;
            return;
        }

        this.nodeCount = nodes.length;

        // Use pre-allocated buffers
        const posArr = this._nodePosArr;
        const colorArr = this._nodeColorArr;
        const borderArr = this._nodeBorderColorArr;
        const sizeArr = this._nodeSizeArr;
        const selectArr = this._nodeSelectArr;
        const alphaArr = this._nodeAlphaArr;
        const shapeArr = this._nodeShapeArr;
        const statusArr = this._nodeStatusArr;
        const dtrArr = this._nodeDtrArr;

        if (!posArr) return; 

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            const p = n.position || { x: 0, y: 0 };
            const nodeWidth = 120;
            const nodeHeight = 60;
            
            // Adjust to match 2D layout centering
            posArr[i * 2] = p.x + (nodeWidth / 2);
            let clientLayer = n.clientLayer || (n.data && n.data.clientLayer) || null;
            let yOffset = clientLayer && window.engine ? window.engine.getClientLayerOffset(clientLayer).y : 0;
            posArr[i * 2 + 1] = p.y + yOffset + (nodeHeight / 2);

            // [v0.3.22] Use Centralized Theme Logic (Defensive)
            const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
            const stats = window.engine?.nodeStatsMap?.get(n.id);
            const style = theme ? (theme.getFullNodeStyle ? theme.getFullNodeStyle(n, stats) : null) : null;

            let nColor = style ? style.bgColor : '#3c3836';
            let bColor = style ? style.borderColor : '#a89984';
            let statusType = style ? style.statusType : 0.0;
            let opacity = style ? style.opacity : 0.98;
            let nodeShape = style ? style.shape : 'box';

            const cBg = this.hexToRgb(nColor);
            const cBorder = this.hexToRgb(bColor);

            colorArr[i * 3] = cBg.r;
            colorArr[i * 3 + 1] = cBg.g;
            colorArr[i * 3 + 2] = cBg.b;

            borderArr[i * 3] = cBorder.r;
            borderArr[i * 3 + 1] = cBorder.g;
            borderArr[i * 3 + 2] = cBorder.b;

            sizeArr[i * 2] = nodeWidth / 2;
            sizeArr[i * 2 + 1] = nodeHeight / 2;

            selectArr[i] = (selectedNodeIds && selectedNodeIds.has(n.id)) ? 1.0 : 0.0;
            alphaArr[i] = opacity;

            // Shape Mapping
            let shape = 0.0; // Box
            if (nodeShape === 'diamond') shape = 1.0;
            else if (nodeShape === 'hexagon') shape = 2.0;
            else if (nodeShape === 'parallelogram') shape = 3.0;
            shapeArr[i] = shape;

            statusArr[i] = statusType;
            dtrArr[i] = (n.intelligence && n.intelligence.dtr !== undefined) ? n.intelligence.dtr : 0.3;
        }

        // Buffer upload
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, posArr.subarray(0, nodes.length * 2));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, colorArr.subarray(0, nodes.length * 3));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.borderColorBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, borderArr.subarray(0, nodes.length * 3));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, sizeArr.subarray(0, nodes.length * 2));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.selectBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, selectArr.subarray(0, nodes.length));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.alphaBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, alphaArr.subarray(0, nodes.length));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeShapeBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, shapeArr.subarray(0, nodes.length));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeStatusBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, statusArr.subarray(0, nodes.length));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeDtrBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, dtrArr.subarray(0, nodes.length));
    }

    updateEdgeData(edges, nodeMap, selectedNodeIds) {
        const data = this._edgeArr;
        const colorData = this._edgeColorArr;
        const thickData = this._edgeThickArr;
        const dashData = this._edgeDashArr;
        const controlData = this._edgeControlArr;
        if (!data || !colorData || !thickData || !dashData || !controlData) return;
        
        let cnt = 0;
        let colorCnt = 0;
        let thickCnt = 0;
        let dashCnt = 0;
        let highCnt = 0;
        let controlCnt = 0;
        
        for (let i = 0; i < edges.length; i++) {
            const e = edges[i];
            
            // [v0.3.16] Edge Visibility Control Early Return
            const isPathSelected = e.isSelected || 
                                 (selectedNodeIds && (selectedNodeIds.has(e.from) || selectedNodeIds.has(e.to)));
            const isEdgeHidden = window.edgeVisibilityMode === 'NO_EDGES';

            if (isEdgeHidden && !isPathSelected) {
                continue; // Skip rendering completely for hidden edges to save GPU/CPU limits
            }

            const src = e.srcNode || (nodeMap ? nodeMap.get(e.from) : null);
            const tgt = e.tgtNode || (nodeMap ? nodeMap.get(e.to) : null);
            
            if (src && tgt && src.position && tgt.position) {
                const nodeWidth = 120;
                const nodeHeight = 60;
                let srcClientLayer = src.clientLayer || (src.data && src.data.clientLayer) || null;
                let srcYOffset = srcClientLayer && window.engine ? window.engine.getClientLayerOffset(srcClientLayer).y : 0;
                let tgtClientLayer = tgt.clientLayer || (tgt.data && tgt.data.clientLayer) || null;
                let tgtYOffset = tgtClientLayer && window.engine ? window.engine.getClientLayerOffset(tgtClientLayer).y : 0;

                let x1 = src.position.x + (nodeWidth / 2);
                let y1 = src.position.y + srcYOffset + (nodeHeight / 2);
                let x2 = tgt.position.x + (nodeWidth / 2);
                let y2 = tgt.position.y + tgtYOffset + (nodeHeight / 2);

                // x1, y1, x2, y2 will be written after border intersection logic

                // [v0.3.2] Boundary Intersection: Stop edges at node borders
                const dx = x2 - x1;
                const dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 10.0) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // Intersection with Target Box (120x60)
                    const tx = (nx !== 0) ? Math.abs(60 / nx) : Infinity;
                    const ty = (ny !== 0) ? Math.abs(30 / ny) : Infinity;
                    const t_tgt = Math.min(tx, ty);
                    
                    // Intersection with Source Box
                    const sx = (nx !== 0) ? Math.abs(60 / nx) : Infinity;
                    const sy = (ny !== 0) ? Math.abs(30 / ny) : Infinity;
                    const t_src = Math.min(sx, sy);

                    // Offset slightly to prevent clipping under nodes
                    x1 += nx * t_src;
                    y1 += ny * t_src;
                    x2 -= nx * t_tgt;
                    y2 -= ny * t_tgt;
                }

                // [v0.3.22.3] Write corrected coordinates to buffer
                data[cnt++] = x1;
                data[cnt++] = y1;
                data[cnt++] = x2;
                data[cnt++] = y2;
                // [v0.3.22] Unified Edge Styles via SYNAPSE_THEME (with safety fallbacks)
                const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
                
                const edgeStyle = theme ? (theme.getEdgeStyle ? theme.getEdgeStyle(e.type) : { color: '#665c54', thickness: 2, dash: [0, 0] }) : { color: '#665c54', thickness: 2, dash: [0, 0] };
                
                let color = edgeStyle.color;
                let thickness = edgeStyle.thickness;

                if (isPathSelected && !isEdgeHidden) {
                    color = theme ? (theme.EDGES.HIGHLIGHTED?.color || '#fabd2f') : '#fabd2f';
                    thickness = thickness + 5.0; // matching 2D bulge
                }
                // v0.4.1: 기본 상태(pending, confirmed 포함)는 타입별 색상을 유지합니다.
                // 모든 엣지가 특정 상태 색상으로 통일되는 시각적 둔감화 방지.

                const c = this.hexToRgb(color);
                colorData[colorCnt++] = c.r;
                colorData[colorCnt++] = c.g;
                colorData[colorCnt++] = c.b;

                thickData[thickCnt++] = thickness;

                const styleDash = edgeStyle.dash && edgeStyle.dash.length > 0 ? edgeStyle.dash : [0, 0];
                dashData[dashCnt++] = styleDash[0] !== undefined ? styleDash[0] : 0.0;
                dashData[dashCnt++] = styleDash[1] !== undefined ? styleDash[1] : 0.0;

                let highVal = 0.0;
                if (isEdgeHidden && isPathSelected) {
                    highVal = 2.0; // Semi-transparent
                } else if (isPathSelected) {
                    highVal = 1.0; // Normal highlighted
                } else if (src && tgt && src.cluster_id && tgt.cluster_id && src.cluster_id !== tgt.cluster_id) {
                    highVal = 3.0; // Stratification: External Edge
                }
                this._edgeHighArr[highCnt++] = highVal;

                // [v0.3.21] Edge Bundling Lite Calculation
                let cx = (x1 + x2) * 0.5;
                let cy = (y1 + y2) * 0.5;

                const isBundlingEnabled = window.enableEdgeBundling !== false && !window.forceStraightEdges;
                const edgeCountThreshold = 20; // Lowered from 80 to prevent flickering during sync
                const safeDist = Math.max(dist, 1.0); // Suspect 2: Divide by Zero protection
                
                // Normal vector for perpendicular offset
                const nx = -dy / safeDist;
                const ny = dx / safeDist;

                if (isBundlingEnabled && edges.length >= edgeCountThreshold && dist > 50) {
                    // 1. Base bundling strength
                    const bundleStrength = Math.min(dist * 0.15, 40);
                    
                    // 2. Direction quantization (16 buckets) - Suspect 3: Quantization check
                    const angle = Math.atan2(dy, dx);
                    const bucket = Math.round(angle / (Math.PI / 8));
                    const groupOffset = (bucket % 8) * 3; // Cyclic offset

                    cx += nx * (bundleStrength + groupOffset);
                    cy += ny * (bundleStrength + groupOffset);
                } else {
                    // Default arch: Use normal vector for consistency (instead of fixed cy += -10)
                    const archStrength = (dist < 10) ? 0 : -5; 
                    cx += nx * archStrength;
                    cy += ny * archStrength;
                }

                // [v0.3.21.1] NaN/Infinity Resilience: Fallback to straight line if math fails
                if (!isFinite(cx) || !isFinite(cy)) {
                    if (window.debugBundling) {
                        console.warn(`[WebGL] Bundling math failed for edge ${i/2}. dist: ${dist}, x1:${x1}, y1:${y1}, x2:${x2}, y2:${y2}. Falling back to straight line.`);
                    }
                    cx = (x1 + x2) * 0.5;
                    cy = (y1 + y2) * 0.5;
                }

                controlData[controlCnt++] = cx;
                controlData[controlCnt++] = cy;
            }
        }
        this.edgeCount = cnt / 4;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeInstanceBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data.subarray(0, cnt));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeColorBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, colorData.subarray(0, colorCnt));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeThickBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, thickData.subarray(0, thickCnt));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeDashBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, dashData.subarray(0, dashCnt));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeHighBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this._edgeHighArr.subarray(0, highCnt));

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeControlBuffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this._edgeControlArr.subarray(0, controlCnt));
    }

    updateTextData(nodes, edges = []) {
        if (!this.gl || !this.textAtlas || !nodes || nodes.length === 0) {
            this.charCount = 0;
            return;
        }

        const t0 = performance.now();

        // 1️⃣ Node Labels & Status Icons & LOD Details
        const currentZoom = window.engine?.transform?.zoom || 1.0;
        
        nodes.forEach(n => {
            const label = n.data?.label || n.id || "";
            const type = (n.type || "").toLowerCase();
            const lowLabel = label.toLowerCase();
            
            // [v0.3.22] Synchronized Semantic Icon Detection (Parity with 2D getNodeStyle)
            const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);
            const stats = window.engine?.nodeStatsMap?.get(n.id);
            const style = theme ? (theme.getFullNodeStyle ? theme.getFullNodeStyle(n, stats) : null) : null;
            
            // [v0.3.22] Priority Fix: Use theme-calculated icon (style.icon) over raw data to ensure 2D/3D parity
            let icon = (style && style.icon) ? style.icon : (n.data?.icon || '📄');

            const summary = n.data?.summary || {};
            const statusDetail = (n.status === 'proposed' || n.state === 'pending') ? `${theme ? theme.STATUS.APPROVAL.icon : '⚡'} Awaiting Approval` : "";
            
            // Build key for layout caching (include zoom/LOD info)
            const lodLevel = currentZoom > 1.5 ? 2 : (currentZoom > 0.8 ? 1 : 0);
            const cacheKey = `${label}_${icon}_${statusDetail}_${JSON.stringify(summary)}_${lodLevel}`;
            
            if (!n._textLayout || n._textLayoutKey !== cacheKey) {
                const items = [];
                
                // A. Type Icon (Top-Left: 5, 5) - Parity with 2D line 5978
                if (currentZoom > 1.2) {
                    this.textAtlas.addText(icon);
                    const gIcon = this.textAtlas.glyphMap.get(icon);
                    if (gIcon) {
                        items.push({
                            dx: 5, dy: 5,
                            w: gIcon.w, h: gIcon.h,
                            u0: gIcon.u0, v0: gIcon.v0, u1: gIcon.u1, v1: gIcon.v1
                        });
                    }
                }

                // B. Main Label (Centered)
                this.textAtlas.addText(label);
                let labelW = 0;
                for (const ch of label) {
                    const g = this.textAtlas.glyphMap.get(ch);
                    if (g) labelW += g.w;
                }
                
                let curX = 60 - labelW / 2;
                let curY = (lodLevel === 2) ? 15 : 35; // Shift up if deep LOD shown
                
                for (const ch of label) {
                    const g = this.textAtlas.glyphMap.get(ch);
                    if (!g) continue;
                    items.push({
                        dx: curX, dy: curY,
                        w: g.w, h: g.h,
                        u0: g.u0, v0: g.v0, u1: g.u1, v1: g.v1
                    });
                    curX += g.w;
                }

                // C. Status Detail (Awaiting Approval etc.)
                if (statusDetail && currentZoom > 1.2) {
                    this.textAtlas.addText(statusDetail);
                    let sW = 0;
                    for (const ch of statusDetail) {
                        const g = this.textAtlas.glyphMap.get(ch);
                        if (g) sW += g.w;
                    }
                    curX = 60 - sW / 2;
                    let sY = 50; 
                    for (const ch of statusDetail) {
                        const g = this.textAtlas.glyphMap.get(ch);
                        if (!g) continue;
                        items.push({
                            dx: curX, dy: sY,
                            w: g.w, h: g.h,
                            u0: g.u0, v0: g.v0, u1: g.u1, v1: g.v1
                        });
                        curX += g.w;
                    }
                }

                // D. Deep LOD: Architectural Stats (Parity with 2D line 6970)
                if (currentZoom > 1.5 && stats) {
                    const statsText = `L: ${stats.logicCount || 0} E: ${stats.entryCount || 0} C: ${stats.connectionCount || 0}`;
                    this.textAtlas.addText(statsText);
                    let stW = 0;
                    for (const ch of statsText) {
                        const g = this.textAtlas.glyphMap.get(ch);
                        if (g) stW += g.w;
                    }
                    curX = 60 - stW / 2;
                    let stY = 65; 
                    for (const ch of statsText) {
                        const g = this.textAtlas.glyphMap.get(ch);
                        if (!g) continue;
                        items.push({
                            dx: curX, dy: stY,
                            w: g.w, h: g.h,
                            u0: g.u0, v0: g.v0, u1: g.u1, v1: g.v1
                        });
                        curX += g.w;
                    }
                }

                // D. Deep LOD (Functions/Classes) - Parity with 2D lines 6031-6074
                if (lodLevel === 2) {
                    const detailLines = [];
                    if (summary.classes) summary.classes.slice(0, 2).forEach(c => detailLines.push(`• ${c}`));
                    if (summary.functions) summary.functions.slice(0, 2).forEach(f => detailLines.push(`• ${f}`));
                    if (summary.tables) summary.tables.slice(0, 2).forEach(t => detailLines.push(`◆ ${t}`));
                    
                    let detailY = 35;
                    detailLines.forEach(line => {
                        this.textAtlas.addText(line);
                        let detailX = 10;
                        for (const ch of line) {
                            const g = this.textAtlas.glyphMap.get(ch);
                            if (!g) continue;
                            items.push({
                                dx: detailX, dy: detailY,
                                w: g.w, h: g.h,
                                u0: g.u0, v0: g.v0, u1: g.u1, v1: g.v1
                            });
                            detailX += g.w;
                        }
                        detailY += 10;
                    });
                }
                
                n._textLayout = items;
                n._textLayoutKey = cacheKey;
            }
        });

        // 2️⃣ Edge Badges (Type Icons, Validation Icons, Status Icons)
        const badgeItems = [];
        const isBadgeHidden = window.edgeVisibilityMode === 'NO_BADGES' || window.edgeVisibilityMode === 'NO_EDGES';
        // [v0.3.22.4] Always draw badges in WebGL for consistent parity across zoom levels
        const skipGpuBadges = false; 

        if (edges && edges.length > 0 && !isBadgeHidden && !skipGpuBadges) {
            const isEditMode = window.engine?.isEditMode;
            // [v0.3.3 Fix] Build nodeMap locally if not passed (to avoid undefined crash)
            const map = new Map();
            for (const n of nodes) map.set(n.id, n);

            // [v0.4.0] Standard Edge Type Icons (Unicode Escapes for build stability)
            // [v0.3.22] Synchronized Edge Icons via Theme
            const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : (window.SYNAPSE_THEME || null);

            edges.forEach(e => {
                const src = e.srcNode || (map ? map.get(e.from) : null);
                const tgt = e.tgtNode || (map ? map.get(e.to) : null);
                if (!src?.position || !tgt?.position) return;

                const nodeWidth = 120;
                const nodeHeight = 60;
                let srcClientLayer = src.clientLayer || (src.data && src.data.clientLayer) || null;
                let srcYOffset = srcClientLayer && window.engine ? window.engine.getClientLayerOffset(srcClientLayer).y : 0;
                let tgtClientLayer = tgt.clientLayer || (tgt.data && tgt.data.clientLayer) || null;
                let tgtYOffset = tgtClientLayer && window.engine ? window.engine.getClientLayerOffset(tgtClientLayer).y : 0;

                const x1 = src.position.x + (nodeWidth / 2);
                const y1 = src.position.y + srcYOffset + (nodeHeight / 2);
                const x2 = tgt.position.x + (nodeWidth / 2);
                const y2 = tgt.position.y + tgtYOffset + (nodeHeight / 2);
                
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                // [v0.3.22.8] Arrow is now drawn separately or omitted to match 2D parity and architecture specs
                /* Arrow logic removed from badge capsule */

                // [v0.3.22] Synchronized High-Density Edge Badges via Theme (Full Parity)
                const badgeStyle = theme ? (theme.getEdgeBadgeStyle ? theme.getEdgeBadgeStyle(e) : null) : null;
                const valText = badgeStyle ? badgeStyle.text : "";

                if (valText) {
                        let cx = midX - 10;
                        for (const ch of valText) {
                            if (ch === ' ') { cx += 10; continue; } 
                            this.textAtlas.addText(ch);
                            const g = this.textAtlas.glyphMap.get(ch);
                            if (g) {
                                badgeItems.push({
                                    x: cx, y: midY - 35, // [v0.3.22.7] Lifted slightly higher for better line clearance
                                    w: g.w * 1.5, h: g.h * 1.5, // [v0.3.22.7] 1.5x Scaling for visibility
                                    u0: g.u0, v0: g.v0, u1: g.u1, v1: g.v1
                                });
                                cx += (g.w * 1.5 + 4); 
                            }
                        }
                    }
                
                // [v0.3.22] High-Density badges (including status) are now handled by the unified valText block above.

                if (isEditMode) {
                    const char = '❌';
                    this.textAtlas.addText(char);
                    const g = this.textAtlas.glyphMap.get(char);
                    if (g) {
                        badgeItems.push({
                            x: midX + 30, y: midY + 10,
                            w: g.w, h: g.h,
                            u0: g.u0, v0: g.v0, u1: g.u1, v1: g.v1
                        });
                    }
                }
            });
        }

        // 3️⃣ Calculate Total Buffer Size
        let totalChars = badgeItems.length;
        for (const n of nodes) {
            if (n._textLayout) totalChars += n._textLayout.length;
        }

        if (totalChars === 0) {
            this.charCount = 0;
            return;
        }

        if (!this._textData || this._textData.length !== totalChars * 8) {
            this._textData = new Float32Array(totalChars * 8);
        }
        const data = this._textData;

        // 4️⃣ Fast Fill
        let idx = 0;
        // Nodes
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            if (!n.position || !n._textLayout) continue;
            const px = n.position.x;
            const py = n.position.y;
            const layout = n._textLayout;
            for (let j = 0; j < layout.length; j++) {
                const l = layout[j];
                data[idx++] = px + l.dx;
                data[idx++] = py + l.dy;
                data[idx++] = l.w; data[idx++] = l.h;
                data[idx++] = l.u0; data[idx++] = l.v0;
                data[idx++] = l.u1; data[idx++] = l.v1;
            }
        }
        // Edges
        for (let i = 0; i < badgeItems.length; i++) {
            const b = badgeItems[i];
            data[idx++] = b.x; data[idx++] = b.y;
            data[idx++] = b.w; data[idx++] = b.h;
            data[idx++] = b.u0; data[idx++] = b.v0;
            data[idx++] = b.u1; data[idx++] = b.v1;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textInstanceBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
        this.charCount = totalChars;
        this.textAtlas.upload();
    }

    /**
     * [v0.2.31] Explicit Frame Lifecycle: Begin
     * Clears buffers and resets GL state to prevent contamination
     */
    beginFrame() {
        if (!this.gl) return;
        const gl = this.gl;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        this.drawCalls = 0;
    }

    /**
     * [v0.2.31] Explicit Frame Lifecycle: End
     * Cleans up program and bindings
     */
    clear() {
        if (!this.gl) return;
        // [v0.3.09_fix] Rendering Isolation: Force clear state & buffers
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        Object.values(this.layers).forEach(layer => {
            if (layer.fbo) {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.fbo);
                this.gl.clearColor(0, 0, 0, 0);
                this.gl.clear(this.gl.COLOR_BUFFER_BIT);
                layer.isDirty = true;
            }
        });
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.nodeCount = 0; // Prevent ghost rendering on leftover instances
    }

    endFrame() {
        if (!this.gl) return;
        const gl = this.gl;
        
        gl.useProgram(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
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

    /**
     * [v0.2.28] Bootstrap: Render from a deterministic frame state
     * @param {Object} frameState 
     */
    renderFromState(frameState) {
        if (!frameState || !this.gl) return;

        this.beginFrame();
        
        const selectedIds = new Set(frameState.selectedNodeIds || []);

        // Update node data
        this.updateNodeData(frameState.nodes, selectedIds);
        
        // Build map for edges (or use from state if available)
        const nodeMap = new Map();
        for (const n of frameState.nodes) nodeMap.set(n.id, n);
        this.updateEdgeData(frameState.edges, nodeMap, selectedIds);
        this.updateTextData(frameState.nodes, frameState.edges);

        // Render Layers
        this.drawNodes(frameState.context);
        this.drawEdges(frameState.context);
        
        this.endFrame();
        const hash = calculateFrameHash(frameState);
        console.log(`[SYNAPSE 3D] Frame Rendered. Hash: ${hash}`);
    }

    /**
     * [v0.3.2] Reset WebGL Context for View Isolation (Rule 08)
     */
    reset() {
        if (!this.gl) return;
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        // Reset counts to block old data rendering
        this.nodeCount = 0;
        this.edgeCount = 0;
        this.charCount = 0;
        
        if (this._nodePosArr) this._nodePosArr.fill(0);
        if (this._edgePosArr) this._edgePosArr.fill(0);
        if (this._textArr) this._textArr.fill(0);

        console.log("[SYNAPSE] WebGL Pipeline Reset (Rule 08 Isolation)");
    }

    render(nodes, transform, isDataDirty = false, edges = null, nodeMap = null, isEdgeDirty = false, isTextDirty = false, selectedNodeIds = null) {
        if (!this.gl) return;
        
        // [v0.2.25] Iron Isolation: Stop everything if not in graph mode
        if (this.canvas2d.dataset.mode !== 'graph' || (!window.engine || window.engine.currentMode !== 'graph')) {
            return;
        }

        // Entire buffer clear is now deferred to just before drawing to minimize flickering gap.
        // [v0.2.31] Note: beginFrame() should have been called by the engine


        const edgeLen = edges ? edges.length : 0;
        if (isDataDirty || this.nodeCount !== nodes.length) {
            this.updateNodeData(nodes, selectedNodeIds);
            // 만약 노드가 바뀌면 선 위치도 바뀌어야 하므로 edgeDirty 강제 처리
            isEdgeDirty = true; 
            isTextDirty = true;
        }

        if (isEdgeDirty || this.lastEdgeCount !== edgeLen) {
            if (edges && nodeMap) {
                this.updateEdgeData(edges, nodeMap, selectedNodeIds);
            }
            this.lastEdgeCount = edgeLen;
        }

        const isSatellite = transform.zoom < 0.1; // [v0.3.22] Parity: Lowered from 0.4 to 0.1
        
        // [v0.2.24-perf] ONLY update text data if dirty OR zoom level crossed satellite threshold
        const wasSatellite = (this._lastZoom === undefined) ? !isSatellite : (this._lastZoom < 0.1);
        const zoomPhaseChanged = isSatellite !== wasSatellite;
        
        if (isTextDirty || zoomPhaseChanged) {
            if (isSatellite) {
                this.charCount = 0; // Disable text in satellite view
            } else {
                this.updateTextData(nodes, edges);
            }
        }
        this._lastZoom = transform.zoom;

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
        // [v0.2.31] State Cleanup moved to endFrame()
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
        
        // [v0.3.2] Use client dimensions for logical coordinate mapping
        const dpr = window.devicePixelRatio || 1;
        const logicalW = this.canvas.width / dpr;
        const logicalH = this.canvas.height / dpr;
        const scaleX = 2 / logicalW;
        const scaleY = -2 / logicalH;
        const mat = [
            transform.zoom * scaleX, 0, 0,
            0, transform.zoom * scaleY, 0,
            -1 + transform.offsetX * scaleX, 1 + transform.offsetY * scaleY, 1
        ];
        // [v0.3.22] Synchronized Glow Dynamics
        const theme = (typeof SYNAPSE_THEME !== 'undefined') ? SYNAPSE_THEME : null;
        const baseGlow = theme ? theme.GLOW.BASE_BLUR : 10.0;
        const pulseRange = theme ? theme.GLOW.PULSE_RANGE : 5.0;
        const pulseSpeed = theme ? theme.GLOW.PULSE_SPEED : 200;
        
        const pulse = Math.sin(Date.now() / pulseSpeed);
        this.gl.uniform1f(this.uSelectionGlow, baseGlow + pulseRange * pulse);
        this.gl.uniform1f(this.uDTRGlow, (baseGlow * 1.5) + (pulseRange * 2) * pulse);
        this.gl.uniformMatrix3fv(this.locs.edge.uProj, false, mat);
        this.gl.uniform1f(this.locs.edge.uTime, (Date.now() % 1000000) / 1000);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeRectBuffer);
        const vPos = this.locs.edge.vertex;
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);
        if (this.ext) this.ext.vertexAttribDivisorANGLE(vPos, 0);

        this.setAttrPointer(this.edgeInstanceBuffer, this.locs.edge.instanceEdge, 4, 0, 0, 1);
        this.setAttrPointer(this.edgeColorBuffer, this.locs.edge.color, 3, 0, 0, 1);
        this.setAttrPointer(this.edgeThickBuffer, this.locs.edge.thickness, 1, 0, 0, 1);
        this.setAttrPointer(this.edgeDashBuffer, this.locs.edge.dash, 2, 0, 0, 1);
        this.setAttrPointer(this.edgeHighBuffer, this.locs.edge.high, 1, 0, 0, 1);
        this.setAttrPointer(this.edgeControlBuffer, this.locs.edge.controlPoint, 2, 0, 0, 1);

        if (this.ext) {
            this.ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, (this.edgeCurveSegments + 1) * 2, this.edgeCount);
            this.drawCalls++;
        }
    }

    drawNodes(transform) {
        if (this.nodeCount === 0) return;
        this.gl.useProgram(this.nodeProgram);
        
        const dpr = window.devicePixelRatio || 1;
        const logicalW = this.canvas.width / dpr;
        const logicalH = this.canvas.height / dpr;
        const scaleX = 2 / logicalW;
        const scaleY = -2 / logicalH;
        const mat = [
            transform.zoom * scaleX, 0, 0,
            0, transform.zoom * scaleY, 0,
            -1 + transform.offsetX * scaleX, 1 + transform.offsetY * scaleY, 1
        ];
        this.gl.uniformMatrix3fv(this.locs.node.uProj, false, mat);
        this.gl.uniform1f(this.locs.node.uTime, (Date.now() % 1000000) / 1000);

        // [v0.3.22] Inject Theme Colors as Uniforms (SSOT)
        const themeAvailable = typeof SYNAPSE_THEME !== 'undefined';
        if (themeAvailable) {
            this.gl.uniform4fv(this.locs.node.uSelectionColor, new Float32Array(SYNAPSE_THEME.SHADERS.SELECTION));
            this.gl.uniform4fv(this.locs.node.uDtrGlowColor, new Float32Array(SYNAPSE_THEME.SHADERS.DTR_GLOW));
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
        const vPos = this.locs.node.vertex;
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);
        if (this.ext) this.ext.vertexAttribDivisorANGLE(vPos, 0); // Core Quad vertex: divisor 0

        this.setAttrPointer(this.posBuffer, this.locs.node.pos, 2, 0, 0, 1);
        this.setAttrPointer(this.colorBuffer, this.locs.node.color, 3, 0, 0, 1);
        this.setAttrPointer(this.borderColorBuffer, this.locs.node.borderColor, 3, 0, 0, 1);
        this.setAttrPointer(this.sizeBuffer, this.locs.node.size, 2, 0, 0, 1);
        this.setAttrPointer(this.selectBuffer, this.locs.node.selected, 1, 0, 0, 1);
        this.setAttrPointer(this.alphaBuffer, this.locs.node.alpha, 1, 0, 0, 1);
        this.setAttrPointer(this.nodeShapeBuffer, this.locs.node.shape, 1, 0, 0, 1);
        this.setAttrPointer(this.nodeStatusBuffer, this.locs.node.statusType, 1, 0, 0, 1);
        this.setAttrPointer(this.nodeDtrBuffer, this.locs.node.dtr, 1, 0, 0, 1);

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

        const dpr = window.devicePixelRatio || 1;
        const logicalW = this.canvas.width / dpr;
        const logicalH = this.canvas.height / dpr;
        const scaleX = 2 / logicalW;
        const scaleY = -2 / logicalH;
        const mat = [
            transform.zoom * scaleX, 0, 0,
            0, transform.zoom * scaleY, 0,
            -1 + transform.offsetX * scaleX, 1 + transform.offsetY * scaleY, 1
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
        
        let r = 0, g = 0, b = 0;
        let h = hex.replace('#', '');
        
        if (h.length === 3) {
            r = parseInt(h[0] + h[0], 16);
            g = parseInt(h[1] + h[1], 16);
            b = parseInt(h[2] + h[2], 16);
        } else if (h.length === 6 || h.length === 8) {
            r = parseInt(h.substring(0, 2), 16);
            g = parseInt(h.substring(2, 4), 16);
            b = parseInt(h.substring(4, 6), 16);
        } else {
            return { r: 1, g: 1, b: 1 };
        }
        
        return { r: r / 255, g: g / 255, b: b / 255 };
    }

    /**
     * [v0.3.22] Coordinate Back-propagation
     * Calculates the screen position of all nodes for 2D Overlay synchronization.
     */
    getProjectedNodePositions(nodes, transform) {
        const positions = new Map();
        const zoom = transform.zoom;
        const ox = transform.offsetX;
        const oy = transform.offsetY;

        for (const n of nodes) {
            if (!n.position) continue;
            // Map world to screen
            const sx = n.position.x * zoom + ox;
            const sy = n.position.y * zoom + oy;
            positions.set(n.id, { x: sx, y: sy });
        }
        return positions;
    }
}


// [v0.3.09] Make WebGLRenderer available globally for inline toggle handlers.
if (typeof window !== 'undefined') {
    window.WebGLRenderer = WebGLRenderer;
}
if (typeof globalThis !== 'undefined') {
    globalThis.WebGLRenderer = globalThis.WebGLRenderer || WebGLRenderer;
}
