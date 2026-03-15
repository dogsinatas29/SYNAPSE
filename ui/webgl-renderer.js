/**
 * SYNAPSE WebGL Renderer (v0.2.21-instanced)
 * High-performance GPU-accelerated rendering path.
 */
class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { antialias: true, alpha: true });

        if (!this.gl) {
            console.error('[SYNAPSE] WebGL not supported.');
            return;
        }

        this.ext = this.gl.getExtension('ANGLE_instanced_arrays');
        if (!this.ext) {
            console.warn('[SYNAPSE] Instanced Rendering not supported. Performance may be degraded.');
        }

        this.initShaders();
        this.initBuffers();
        this.initStarfield();

        this.nodeCount = 0;
        this.starRotation = 0;
    }

    initShaders() {
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
                
                // Soft circle with glow
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
        // Node Quad Base
        const positions = [-1, 1, 1, 1, -1, -1, 1, -1];
        this.rectBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        // Instance Buffers
        this.posBuffer = this.gl.createBuffer();
        this.colorBuffer = this.gl.createBuffer();
        this.sizeBuffer = this.gl.createBuffer();
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

    render(nodes, edges, transform) {
        if (!this.gl) return;

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.renderStars(transform);
        this.renderNodes(nodes, transform);
    }

    renderStars(transform) {
        this.gl.useProgram(this.starProgram);
        this.starRotation += 0.0005;

        const zoomScale = transform.zoom * 0.2;
        const matrix = [
            zoomScale, 0, 0, 0,
            0, zoomScale, 0, 0,
            0, 0, 1, 0,
            (transform.offsetX * 0.001), (transform.offsetY * 0.001), 0, 1
        ];

        const loc = this.gl.getUniformLocation(this.starProgram, 'uMatrix');
        this.gl.uniformMatrix4fv(loc, false, matrix);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.starBuffer);
        const posLoc = this.gl.getAttribLocation(this.starProgram, 'aPosition');
        this.gl.vertexAttribPointer(posLoc, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(posLoc);

        this.gl.drawArrays(this.gl.POINTS, 0, 3000);
    }

    renderNodes(nodes, transform) {
        if (nodes.length === 0) return;
        this.gl.useProgram(this.nodeProgram);

        // Prep Projection
        const scaleX = 2 / this.canvas.width;
        const scaleY = -2 / this.canvas.height;
        const mat = [
            transform.zoom * scaleX, 0, 0,
            0, transform.zoom * scaleY, 0,
            -1 + transform.offsetX * transform.zoom * scaleX, 1 + transform.offsetY * transform.zoom * scaleY, 1
        ];
        this.gl.uniformMatrix3fv(this.gl.getUniformLocation(this.nodeProgram, 'uProjectionMatrix'), false, mat);

        // Data Prep
        const positions = new Float32Array(nodes.length * 2);
        const colors = new Float32Array(nodes.length * 3);
        const sizes = new Float32Array(nodes.length);

        nodes.forEach((n, i) => {
            positions[i * 2] = n.position.x + 60;
            positions[i * 2 + 1] = n.position.y + 30;
            const rgb = this.hexToRgb(n.data.color || '#458588');
            colors[i * 3] = rgb.r;
            colors[i * 3 + 1] = rgb.g;
            colors[i * 3 + 2] = rgb.b;
            sizes[i] = 30;
        });

        // Bind Base Quad
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectBuffer);
        const vPos = this.gl.getAttribLocation(this.nodeProgram, 'aVertexPosition');
        this.gl.vertexAttribPointer(vPos, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(vPos);

        // Bind Instance Buffers
        this.updateBuffer(this.posBuffer, positions, 'aInstancePosition', 2);
        this.updateBuffer(this.colorBuffer, colors, 'aInstanceColor', 3);
        this.updateBuffer(this.sizeBuffer, sizes, 'aInstanceSize', 1);

        if (this.ext) {
            this.ext.drawArraysInstancedANGLE(this.gl.TRIANGLE_STRIP, 0, 4, nodes.length);
        } else {
            // Fallback for non-instanced (slow)
            for (let i = 0; i < nodes.length; i++) {
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            }
        }
    }

    updateBuffer(buffer, data, attrName, size) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);
        const loc = this.gl.getAttribLocation(this.nodeProgram, attrName);
        this.gl.enableVertexAttribArray(loc);
        this.gl.vertexAttribPointer(loc, size, this.gl.FLOAT, false, 0, 0);
        if (this.ext) {
            this.ext.vertexAttribDivisorANGLE(loc, 1);
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 1, g: 1, b: 1 };
    }
}
