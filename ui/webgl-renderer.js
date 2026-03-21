/**
 * SYNAPSE WebGL Renderer (v0.2.23-optimized)
 * High-performance GPU-accelerated rendering path with Layer-based Caching (FBO).
 */
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
            pointer-events: none;
            z-index: 0;
        `;
        canvas2d.parentElement.insertBefore(this.glCanvas, canvas2d);
        if (canvas2d.parentElement.style.position === '') {
            canvas2d.parentElement.style.position = 'relative';
        }

        this.canvas = this.glCanvas;
        this.gl = this.glCanvas.getContext('webgl', { antialias: true, alpha: true, depth: false });

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

        this.initShaders();
        this.cacheLocations();
        this.initBuffers();
        this.initStarfield();
        this.initLayerFBOs();

        console.log('[SYNAPSE WebGL] Renderer Initialized. Instancing:', !!this.ext);
        this.nodeCount = 0;
        this.starRotation = 0;
        
        this._nodeCache = null;
        this._lastDataVersion = 0;
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
                float dist = length(vCoord);
                if (dist > 1.0) discard;
                float alpha = 1.0 - smoothstep(0.8, 1.0, dist);
                vec3 glow = vColor * (1.2 - dist * 0.5);
                gl_FragColor = vec4(glow, alpha);
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
            attribute vec4 aInstanceEdge;
            uniform mat3 uProjectionMatrix;
            void main() {
                vec2 start = aInstanceEdge.xy;
                vec2 end = aInstanceEdge.zw;
                vec2 dir = end - start;
                float len = length(dir);
                if (len < 0.001) {
                    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                    return;
                }
                vec2 norm = normalize(dir);
                vec2 perp = vec2(-norm.y, norm.x);
                float thickness = 2.0; 
                vec2 pos = start + dir * aVertexPosition.x + perp * (aVertexPosition.y * thickness);
                vec3 projected = uProjectionMatrix * vec3(pos, 1.0);
                gl_Position = vec4(projected.xy, 0.0, 1.0);
            }
        `;
        const fsEdge = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(0.4, 0.36, 0.33, 0.6); // #665c54 with opacity
            }
        `;
        this.edgeProgram = this.createProgram(vsEdge, fsEdge);

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
        if (!this.gl || nodes.length === 0) return;
        this.nodeCount = nodes.length;

        // [Perf Check] Step 2 & 3: 로그 출력하여 매 프레임 불리는지 검증
        console.warn("[Perf] webgl-renderer: build array & bufferData called");

        // 배열 재사용 로직 (GC 압박 완화 - Step 3 최적화 보완)
        if (!this._positions || this._positions.length !== nodes.length * 2) {
            this._positions = new Float32Array(nodes.length * 2);
            this._colors = new Float32Array(nodes.length * 3);
            this._sizes = new Float32Array(nodes.length);
        }

        const positions = this._positions;
        const colors = this._colors;
        const sizes = this._sizes;

        nodes.forEach((n, i) => {
            positions[i * 2] = n.position.x + 60;
            positions[i * 2 + 1] = n.position.y + 30;
            const rgb = this.hexToRgb(n.data?.color || '#458588');
            colors[i * 3] = rgb.r;
            colors[i * 3 + 1] = rgb.g;
            colors[i * 3 + 2] = rgb.b;
            sizes[i] = 30; 
        });

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.DYNAMIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, sizes, this.gl.DYNAMIC_DRAW);
    }

    updateEdgeData(edges, nodeMap) {
        if (!this.gl || !edges || edges.length === 0) {
            this.edgeCount = 0;
            return;
        }

        if (!this._edgeData || this._edgeData.length !== edges.length * 4) {
            this._edgeData = new Float32Array(edges.length * 4);
        }
        
        const data = this._edgeData;
        let cnt = 0;
        for (const e of edges) {
            const src = nodeMap.get(e.from);
            const tgt = nodeMap.get(e.to);
            if (src && tgt && src.position && tgt.position) {
                // Nodes are shifted by +60 and +30 to point to center
                data[cnt++] = src.position.x + 60;
                data[cnt++] = src.position.y + 30;
                data[cnt++] = tgt.position.x + 60;
                data[cnt++] = tgt.position.y + 30;
            }
        }
        this.edgeCount = cnt / 4;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeInstanceBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data.subarray(0, cnt), this.gl.DYNAMIC_DRAW);
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

    render(nodes, transform, isDataDirty = false, edges = null, nodeMap = null, isEdgeDirty = false) {
        if (!this.gl) return;
        this.drawCalls = 0;

        // [v0.2.24] Buffer state setup
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const edgeLen = edges ? edges.length : 0;
        if (isDataDirty || this.nodeCount !== nodes.length) {
            this.updateNodeData(nodes);
            // 만약 노드가 바뀌면 선 위치도 바뀌어야 하므로 edgeDirty 강제 처리
            isEdgeDirty = true; 
        }

        if (isEdgeDirty || this.lastEdgeCount !== edgeLen) {
            if (edges && nodeMap) {
                this.updateEdgeData(edges, nodeMap);
            }
            this.lastEdgeCount = edgeLen;
        }

        // Draw Sequence: Background (Stars) -> Edges -> Nodes
        this.drawStars(transform);
        if (this.edgeCount > 0) this.drawEdges(transform);
        this.drawNodes(transform);

        this._lastTransform = { ...transform };

        // [v0.2.24] Perf Audit & Robust Logging
        if (!this.__perfCounter) this.__perfCounter = 0;
        this.__perfCounter++;

        // ALWAYS log at least once, then every 60 frames
        if (this.__perfCounter < 10 || this.__perfCounter % 60 === 0) {
            console.log(`[SYNAPSE WebGL] Frame #${this.__perfCounter} | DrawCalls: ${this.drawCalls} | Instancing: ${this.ext ? 'ON' : 'OFF'} | Nodes: ${nodes.length} | Edges: ${this.edgeCount}`);
        }
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
        this.gl.drawArrays(this.gl.POINTS, 0, 3000);
        this.drawCalls++;
    }

    drawEdges(transform) {
        if (!this.ext || this.edgeCount === 0) return;
        this.gl.useProgram(this.edgeProgram);
        
        const scaleX = 2 / this.canvas.width;
        const scaleY = -2 / this.canvas.height;
        const mat = [
            transform.zoom * scaleX, 0, 0,
            0, transform.zoom * scaleY, 0,
            -1 + transform.offsetX * transform.zoom * scaleX, 1 + transform.offsetY * transform.zoom * scaleY, 1
        ];
        this.gl.uniformMatrix3fv(this.locs.edge.uProj, false, mat);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeRectBuffer);
        const vPos = this.locs.edge.vertex;
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);

        this.setAttrPointer(this.edgeInstanceBuffer, this.locs.edge.instanceEdge, 4);

        if (this.ext) {
            this.ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, 4, this.edgeCount);
            this.drawCalls++;
        }
    }

    drawNodes(transform) {
        if (this.nodeCount === 0) return;
        this.gl.useProgram(this.nodeProgram);
        const scaleX = 2 / this.canvas.width;
        const scaleY = -2 / this.canvas.height;
        const mat = [
            transform.zoom * scaleX, 0, 0,
            0, transform.zoom * scaleY, 0,
            -1 + transform.offsetX * transform.zoom * scaleX, 1 + transform.offsetY * transform.zoom * scaleY, 1
        ];
        this.gl.uniformMatrix3fv(this.locs.node.uProj, false, mat);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
        const vPos = this.locs.node.vertex;
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);
        this.setAttrPointer(this.posBuffer, this.locs.node.pos, 2);
        this.setAttrPointer(this.colorBuffer, this.locs.node.color, 3);
        this.setAttrPointer(this.sizeBuffer, this.locs.node.size, 1);
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

    setAttrPointer(buffer, loc, size) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        if (loc === -1) return;
        this.gl.enableVertexAttribArray(loc);
        this.gl.vertexAttribPointer(loc, size, this.gl.FLOAT, false, 0, 0);
        if (this.ext) {
            this.ext.vertexAttribDivisorANGLE(loc, 1);
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


