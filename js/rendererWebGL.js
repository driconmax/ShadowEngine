class Renderer extends ShadowScript {
    constructor(canvas, framerate, dimensions = 3, options = {}) {
        super();

        this.canvas = canvas;
        this.gl = null;
        this.ctx = null;
        this.gpu = null;
        this.meshes = [];

        this.dimensions = 3; 
        this.framerate = Math.min(60, Math.max(24, framerate || 60));

        this.camera = new SObject(new Vector3(0, 0, 500));
        this.light  = new Light(new Vector3(0, 0, 0));

        this.fov    = Math.PI / 4;
        this.near   = 0.01;
        this.far    = 1000;
        this.aspect = 1;

        this.enableOverlay = options.debugOverlay !== false;
        this.backend = "webgl";

        this._initWebGL(options);
        this._initStatsOverlay();
    }

    _initWebGL(options = {}) {
        const attributes = Object.assign({
            antialias: true,
            alpha: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
        }, options.webglContextAttributes || {});

        const contextNames = ["webgl2", "webgl", "experimental-webgl"];
        for (const name of contextNames) {
            this.gl = this.canvas.getContext(name, attributes);
            if (this.gl) break;
        }

        if (!this.gl) {
            this.backend = "2d";
            this.ctx = this.canvas.getContext("2d");
            if (!this.ctx) throw new Error("Renderer: no WebGL and no Canvas2D");
            return;
        }

        const gl = this.gl;

        // -- Shaders ---------------------------------------------------------
        const vsSource = `
            attribute vec3 a_position;
            attribute vec4 a_color;
            attribute vec2 a_uv;

            uniform mat4 u_vp;

            varying vec4 v_color;
            varying vec2 v_uv;

            void main() {
                gl_Position = u_vp * vec4(a_position, 1.0);
                v_color = a_color;
                v_uv = v_uv; // avoid unused warning
                v_uv = a_uv;
            }
        `;

        const fsSourceSolid = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `;

        const fsSourceTextured = `
            precision mediump float;
            varying vec4 v_color;
            varying vec2 v_uv;
            uniform sampler2D u_texture;
            void main() {
                vec4 texColor = texture2D(u_texture, v_uv);
                gl_FragColor = texColor * v_color;
            }
        `;

        const vs = this._createShader(gl.VERTEX_SHADER, vsSource);
        const fsSolid = this._createShader(gl.FRAGMENT_SHADER, fsSourceSolid);
        const fsTex = this._createShader(gl.FRAGMENT_SHADER, fsSourceTextured);

        const progSolid = this._createProgram(vs, fsSolid);
        const progTex   = this._createProgram(vs, fsTex);

        // -- State -----------------------------------------------------------
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.BLEND); // enable later for alpha passes

        const vbSolid = gl.createBuffer();
        const vbTex   = gl.createBuffer();

        this.gpu = {
            solid: {
                program: progSolid,
                buffer: vbSolid,
                attribs: {
                    position: gl.getAttribLocation(progSolid, "a_position"),
                    color:    gl.getAttribLocation(progSolid, "a_color"),
                    uv:       gl.getAttribLocation(progSolid, "a_uv"),
                },
                uniforms: {
                    vp: gl.getUniformLocation(progSolid, "u_vp"),
                },
            },
            textured: {
                program: progTex,
                buffer: vbTex,
                attribs: {
                    position: gl.getAttribLocation(progTex, "a_position"),
                    color:    gl.getAttribLocation(progTex, "a_color"),
                    uv:       gl.getAttribLocation(progTex, "a_uv"),
                },
                uniforms: {
                    vp:      gl.getUniformLocation(progTex, "u_vp"),
                    texture: gl.getUniformLocation(progTex, "u_texture"),
                },
            },
        };
    }

    _createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Shader compile error: " + info);
        }
        return shader;
    }

    _createProgram(vs, fs) {
        const gl = this.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error("Program link error: " + info);
        }
        return program;
    }

    _initStatsOverlay() {
        if (this.backend !== "webgl" || !this.enableOverlay || typeof document === "undefined") {
            this.statsOverlay = null;
            return;
        }

        const parent = this.canvas.parentElement || document.body;
        const style = window.getComputedStyle(parent);
        if (style.position === "static") parent.style.position = "relative";

        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "8px";
        overlay.style.left = "8px";
        overlay.style.color = "#00DD00";
        overlay.style.font = "10px monospace";
        overlay.style.pointerEvents = "none";
        overlay.style.whiteSpace = "pre";
        overlay.style.zIndex = 10;
        parent.appendChild(overlay);
        this.statsOverlay = overlay;
    }

    _updateStatsOverlay({ fps, triangles }) {
        if (!this.statsOverlay) return;
        const f = v => (Number.isFinite(v) ? v.toFixed(1) : v);
        this.statsOverlay.textContent = [
            `Cam X: ${this.camera.position.x.toFixed(2)}`,
            `Cam Y: ${this.camera.position.y.toFixed(2)}`,
            `Cam Z: ${this.camera.position.z.toFixed(2)}`,
            `Triangles: ${triangles}`,
            `FPS: ${f(fps)}`,
            `Backend: WebGL`,
        ].join("\n");
    }

    UpdateMeshes(meshes) {
        this.meshes = meshes || [];
    }

    _ensureTexture(mesh) {
        const gl = this.gl;
        if (!mesh || !mesh.texture || !mesh.texture.loaded || mesh.texture.error) return null;

        const texInfo = mesh.texture;
        if (!texInfo.glTexture) {
            texInfo.glTexture = gl.createTexture();
            texInfo.dirty = true;
        }

        if (texInfo.dirty) {
            gl.bindTexture(gl.TEXTURE_2D, texInfo.glTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, texInfo.flipY === false ? 0 : 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texInfo.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            texInfo.dirty = false;
        }

        return texInfo.glTexture;
    }

    // ---------------------------------------------------------------------
    // Main draw
    // ---------------------------------------------------------------------
    Draw(timestep) {
        if (this.backend !== "webgl") {
            // you can keep your 2D fallback here if you want
            return;
        }

        const gl = this.gl;

        // Resize & perspective
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || this.canvas.width;
        const h = rect.height || this.canvas.height;

        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }

        this.aspect = w / h;
        this.fov = Math.min(Math.PI / 2, Math.max(0.1, this.fov));
        const proj = Matrix.CreatePerspectiveMatrix(this.fov, this.aspect, this.near, this.far);
        const view = this.camera.computeInverseMatrix();
        const vp = Matrix.Multiply(proj, view);

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0.25, 0.25, 0.27, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const cameraForward = new Vector3(
            Math.sin(this.camera.rotation.y),
            0,
            -Math.cos(this.camera.rotation.y)
        );

        const lightForward = new Vector3(
            Math.sin(this.light.transform.rotation.y),
            0,
            -Math.cos(this.light.transform.rotation.y)
        );

        const solidTriangles = [];
        const texturedTrianglesPerMesh = new Map();

        // -------------------------------------------------------------
        // Build triangle list in WORLD space (no screen conversion!)
        // -------------------------------------------------------------
        this.meshes.forEach(mesh => {
            const model = mesh.transformationMatrix;

            const meshHasTexture = mesh && typeof mesh.hasTexture === "function" && mesh.hasTexture();
            const meshUVs = mesh.uvs || [];

            for (let i = 0; i < mesh.triangles.length; i += 3) {
                const i0 = mesh.triangles[i];
                const i1 = mesh.triangles[i + 1];
                const i2 = mesh.triangles[i + 2];

                const v0 = Matrix.TransformPoint(model, mesh.vertices[i0]);
                const v1 = Matrix.TransformPoint(model, mesh.vertices[i1]);
                const v2 = Matrix.TransformPoint(model, mesh.vertices[i2]);

                const center = SMath.GetTriangleCenter(v0, v1, v2);
                const normal = SMath.GetTriangleNormal(v0, v1, v2);

                const camToTri = SMath.GetDistance(this.camera.position, center);
                const distance = SMath.GetMagnitude(camToTri);
                const dir = SMath.NormalizeVector(camToTri);

                if (!mesh.backfaceCulling) {
                    const dot = SMath.Dot(normal, dir);
                    if (dot > 0) continue;
                }

                const dotForward = SMath.Dot(cameraForward, dir);
                if (dotForward < Math.cos(this.fov)) {
                    continue;
                }

                // Lighting
                let lightIntensity = 0;
                const lightColor = this.light.color;
                const lightDot = SMath.Dot(lightForward, normal);
                if (lightDot > 0) {
                    lightIntensity += this.light.intensity * lightDot;
                }

                const hasTex = meshHasTexture &&
                    meshUVs[i0] && meshUVs[i1] && meshUVs[i2];

                const baseIntensity = hasTex ? Math.max(lightIntensity, 0.05) : lightIntensity;
                const fillColor = Color.MultiplyColorsIntensity(
                    mesh.color,
                    lightColor,
                    Math.max(baseIntensity, hasTex ? 0.05 : 0)
                );

                const triangleEntry = {
                    mesh,
                    v0, v1, v2,
                    fillColor,
                    dist: distance,
                    uv0: hasTex ? meshUVs[i0] : null,
                    uv1: hasTex ? meshUVs[i1] : null,
                    uv2: hasTex ? meshUVs[i2] : null,
                    hasTexture: !!hasTex,
                };

                if (triangleEntry.hasTexture) {
                    if (!texturedTrianglesPerMesh.has(mesh)) {
                        texturedTrianglesPerMesh.set(mesh, []);
                    }
                    texturedTrianglesPerMesh.get(mesh).push(triangleEntry);
                } else {
                    solidTriangles.push(triangleEntry);
                }
            }
        });
        
        solidTriangles.sort((a, b) => b.dist - a.dist);

        // -----------------------------------------------------------------
        // Draw SOLID
        // -----------------------------------------------------------------
        if (solidTriangles.length) {
            this._drawSolidTriangles3D(vp, solidTriangles);
        }

        // -----------------------------------------------------------------
        // Draw TEXTURED
        // -----------------------------------------------------------------
        if (texturedTrianglesPerMesh.size) {
            this._drawTexturedTriangles3D(vp, texturedTrianglesPerMesh);
        }

        this._updateStatsOverlay({
            fps: timestep ? 1 / timestep : 0,
            triangles: solidTriangles.length +
                       Array.from(texturedTrianglesPerMesh.values())
                            .reduce((acc, arr) => acc + arr.length, 0),
        });
    }

    _drawSolidTriangles3D(vp, triangles) {
        const gl = this.gl;
        const gpu = this.gpu.solid;
        if (!triangles.length) return;

        const floatsPerVertex = 3 + 4 + 2; // pos + color + dummy uv
        const vertexCount = triangles.length * 3;
        const data = new Float32Array(vertexCount * floatsPerVertex);

        let offset = 0;
        triangles.forEach(t => {
            const color = Color.HexToColor(t.fillColor);
            const r = color.r / 255;
            const g = color.g / 255;
            const b = color.b / 255;
            const a = 1.0;

            const verts = [t.v0, t.v1, t.v2];
            verts.forEach(v => {
                data[offset++] = v.x;
                data[offset++] = v.y;
                data[offset++] = v.z;

                data[offset++] = r;
                data[offset++] = g;
                data[offset++] = b;
                data[offset++] = a;

                data[offset++] = 0.0; // dummy uv
                data[offset++] = 0.0;
            });
        });

        gl.useProgram(gpu.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

        const stride = floatsPerVertex * Float32Array.BYTES_PER_ELEMENT;
        gl.enableVertexAttribArray(gpu.attribs.position);
        gl.vertexAttribPointer(gpu.attribs.position, 3, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(gpu.attribs.color);
        gl.vertexAttribPointer(
            gpu.attribs.color,
            4, gl.FLOAT, false,
            stride, 3 * Float32Array.BYTES_PER_ELEMENT
        );

        if (gpu.attribs.uv !== -1) {
            gl.enableVertexAttribArray(gpu.attribs.uv);
            gl.vertexAttribPointer(
                gpu.attribs.uv,
                2, gl.FLOAT, false,
                stride, 7 * Float32Array.BYTES_PER_ELEMENT
            );
        }
        
        gl.uniformMatrix4fv(gpu.uniforms.vp, false, this._toGLMatrix(vp));

        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    }

    _drawTexturedTriangles3D(vp, grouped) {
        const gl = this.gl;
        const gpu = this.gpu.textured;
        const floatsPerVertex = 3 + 4 + 2; // pos + color + uv
        const stride = floatsPerVertex * Float32Array.BYTES_PER_ELEMENT;

        gl.useProgram(gpu.program);
        gl.uniformMatrix4fv(
            gpu.uniforms.vp,
            false,
            this._toGLMatrix(vp)
        );

        grouped.forEach((triangles, mesh) => {
            const texture = this._ensureTexture(mesh);
            if (!texture || !triangles.length) return;

            const vertexCount = triangles.length * 3;
            const data = new Float32Array(vertexCount * floatsPerVertex);
            let offset = 0;

            triangles.forEach(t => {
                const color = Color.HexToColor(t.fillColor);
                const r = color.r / 255;
                const g = color.g / 255;
                const b = color.b / 255;
                const a = 1.0;

                const verts = [
                    { pos: t.v0, uv: t.uv0 },
                    { pos: t.v1, uv: t.uv1 },
                    { pos: t.v2, uv: t.uv2 },
                ];

                verts.forEach(v => {
                    data[offset++] = v.pos.x;
                    data[offset++] = v.pos.y;
                    data[offset++] = v.pos.z;

                    data[offset++] = r;
                    data[offset++] = g;
                    data[offset++] = b;
                    data[offset++] = a;

                    const u = v.uv ? v.uv.x : 0;
                    const vv = v.uv ? v.uv.y : 0;
                    data[offset++] = u;
                    data[offset++] = vv;
                });
            });

            gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

            gl.enableVertexAttribArray(gpu.attribs.position);
            gl.vertexAttribPointer(gpu.attribs.position, 3, gl.FLOAT, false, stride, 0);

            gl.enableVertexAttribArray(gpu.attribs.color);
            gl.vertexAttribPointer(
                gpu.attribs.color,
                4, gl.FLOAT, false,
                stride, 3 * Float32Array.BYTES_PER_ELEMENT
            );

            gl.enableVertexAttribArray(gpu.attribs.uv);
            gl.vertexAttribPointer(
                gpu.attribs.uv,
                2, gl.FLOAT, false,
                stride, 7 * Float32Array.BYTES_PER_ELEMENT
            );

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(gpu.uniforms.texture, 0);

            gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
        });
    }

    _toGLMatrix(mat) {
        let m = mat;
        if (m && m.m !== undefined) {
            m = m.m;
        }
        if (m instanceof Float32Array && m.length === 16) {
            return m;
        }
        if (Array.isArray(m) && m.length === 16 && typeof m[0] === "number") {
            return new Float32Array(m);
        }
        if (Array.isArray(m) && m.length === 4 && Array.isArray(m[0]) && m[0].length === 4) {
            const out = new Float32Array(16);
            let idx = 0;
            for (let c = 0; c < 4; c += 1) {
                for (let r = 0; r < 4; r += 1) {
                    out[idx++] = m[r][c];
                }
            }
            return out;
        }

        console.warn("Renderer: _toGLMatrix received unsupported matrix format", mat);

        // Fallback to identity to avoid hard crash
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

}
