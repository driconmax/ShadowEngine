class Renderer extends ShadowScript {
    /**
     *
     */
    constructor(canvas, framerate, dimensions = 2, options = {}) {
        super();
        this.camera = new SObject(new Vector3(0, 0, 500));
        this.light = new Light(new Vector3(0, 0, 0));

        this.canvas = canvas;
        this.ctx = null;
        this.gl = null;
        this.gpuResources = null;
        this.statsOverlay = null;

        this.dimensions = Math.min(3, dimensions);
        this.dimensions = Math.max(this.dimensions, 2);

        this.framerate = Math.min(60, framerate);
        this.framerate = Math.max(this.framerate, 24);

        this.enableOverlay = options.debugOverlay !== false;
        this.backend = this._resolveBackend(options);

        this._initContext(options);

        this.meshes = [];

        this.fov = Math.PI / 4; // 45 degrees in radians
        const rect = this.canvas.getBoundingClientRect();
        const aspect = rect.width && rect.height ? rect.width / rect.height : 1;
        this.aspect = aspect;
        this.near = 0.1; // Near clipping plane
        this.far = 1000; // Far clipping plane
        this.perspectiveMatrix = Matrix.CreatePerspectiveMatrix(this.fov, this.aspect, this.near, this.far);
    }

    _resolveBackend(options) {
        const datasetBackend = (this.canvas && this.canvas.dataset) ? this.canvas.dataset.renderBackend : undefined;
        const optionBackend = options && Object.prototype.hasOwnProperty.call(options, "backend") ? options.backend : undefined;

        let source = "";
        if (optionBackend !== undefined && optionBackend !== null) {
            source = optionBackend;
        } else if (datasetBackend !== undefined && datasetBackend !== null) {
            source = datasetBackend;
        }

        const normalized = source.toString().toLowerCase();
        if (normalized === "webgl" || normalized === "gpu") {
            return "webgl";
        }
        return "2d";
    }

    _initContext(options = {}) {
        if (this.backend === "webgl") {
            const attributes = Object.assign({
                antialias: true,
                alpha: true,
                premultipliedAlpha: false,
                preserveDrawingBuffer: false,
                powerPreference: "high-performance",
            }, options.webglContextAttributes || {});

            const contextNames = Array.isArray(options.webglContextNames)
                ? options.webglContextNames
                : ["webgl2", "webgl", "experimental-webgl"];

            for (const name of contextNames) {
                this.gl = this.canvas.getContext(name, attributes);
                if (this.gl) {
                    break;
                }
            }

            if (this.gl) {
                this.ctx = this.gl;
                this._initWebGLResources();
                this._initStatsOverlay();
                if (typeof console !== "undefined" && console.info) {
                    console.info("Renderer: using WebGL backend");
                }
                return;
            }

            if (typeof console !== "undefined" && console.warn) {
                console.warn("Renderer: WebGL context not available, falling back to Canvas 2D.");
            }
            this.backend = "2d";
        }

        this.ctx = this.canvas.getContext("2d");
        if (!this.ctx) {
            throw new Error("Renderer: Unable to acquire a rendering context.");
        }
        if (typeof console !== "undefined" && console.info) {
            console.info("Renderer: using 2D canvas backend");
        }
    }

    _initWebGLResources() {
        const gl = this.gl;
        if (!gl) {
            return;
        }

        const solidVertexShaderSource = `
            attribute vec2 a_position;
            attribute vec4 a_color;
            varying vec4 v_color;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_color = a_color;
            }
        `;

        const solidFragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            void main() {
                gl_FragColor = v_color;
            }
        `;

        const texturedVertexShaderSource = `
            attribute vec2 a_position;
            attribute vec4 a_color;
            attribute vec2 a_uv;
            varying vec4 v_color;
            varying vec2 v_uv;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_color = a_color;
                v_uv = a_uv;
            }
        `;

        const texturedFragmentShaderSource = `
            precision mediump float;
            varying vec4 v_color;
            varying vec2 v_uv;
            uniform sampler2D u_texture;
            void main() {
                vec4 texColor = texture2D(u_texture, v_uv);
                gl_FragColor = texColor * v_color;
            }
        `;

        const solidVertexShader = this._createShader(gl.VERTEX_SHADER, solidVertexShaderSource);
        const solidFragmentShader = this._createShader(gl.FRAGMENT_SHADER, solidFragmentShaderSource);
        const texturedVertexShader = this._createShader(gl.VERTEX_SHADER, texturedVertexShaderSource);
        const texturedFragmentShader = this._createShader(gl.FRAGMENT_SHADER, texturedFragmentShaderSource);

        const solidProgram = this._createProgram(solidVertexShader, solidFragmentShader);
        const texturedProgram = this._createProgram(texturedVertexShader, texturedFragmentShader);

        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const solidBuffer = gl.createBuffer();
        const texturedBuffer = gl.createBuffer();

        this.gpuResources = {
            solid: {
                program: solidProgram,
                buffer: solidBuffer,
                attribLocations: {
                    position: gl.getAttribLocation(solidProgram, "a_position"),
                    color: gl.getAttribLocation(solidProgram, "a_color"),
                },
            },
            textured: {
                program: texturedProgram,
                buffer: texturedBuffer,
                attribLocations: {
                    position: gl.getAttribLocation(texturedProgram, "a_position"),
                    color: gl.getAttribLocation(texturedProgram, "a_color"),
                    uv: gl.getAttribLocation(texturedProgram, "a_uv"),
                },
                uniformLocations: {
                    texture: gl.getUniformLocation(texturedProgram, "u_texture"),
                },
            }
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
            throw new Error(`Renderer: Shader compilation failed. ${info}`);
        }
        return shader;
    }

    _createProgram(vertexShader, fragmentShader) {
        const gl = this.gl;
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Renderer: Program linking failed. ${info}`);
        }
        return program;
    }

    _initStatsOverlay() {
        if (this.backend !== "webgl" || !this.enableOverlay) {
            this.statsOverlay = null;
            return;
        }

        if (typeof document === "undefined") {
            return;
        }

        const parent = this.canvas.parentElement || document.body;
        const parentStyle = typeof window !== "undefined" && window.getComputedStyle
            ? window.getComputedStyle(parent)
            : { position: parent.style.position || "" };

        if (parentStyle.position === "static") {
            parent.style.position = "relative";
        }

        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "8px";
        overlay.style.left = "8px";
        overlay.style.color = "#00DD00";
        overlay.style.font = "10px monospace";
        overlay.style.pointerEvents = "none";
        overlay.style.textShadow = "0 0 4px rgba(0, 0, 0, 0.7)";
        overlay.style.whiteSpace = "pre";
        overlay.style.zIndex = 10;

        parent.appendChild(overlay);
        this.statsOverlay = overlay;
    }

    _updateStatsOverlay({ fps, triangles }) {
        if (!this.statsOverlay) {
            return;
        }

        const toFixed = (value, digits = 2) =>
            typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : value;

        const lines = [
            `Cam X: ${toFixed(this.camera.position.x)}`,
            `Cam Y: ${toFixed(this.camera.position.y)}`,
            `Cam Z: ${toFixed(this.camera.position.z)}`,
            `Triangles: ${triangles}`,
            `FPS: ${toFixed(fps, 1)}`,
            `Backend: ${this.backend === "webgl" ? "WebGL" : "Canvas 2D"}`,
        ];

        this.statsOverlay.textContent = lines.join("\n");
    }

    getContext() {
        return this.backend === "webgl" ? this.gl : this.ctx;
    }

    _beginWebGLFrame() {
        if (!this.gl) {
            return;
        }
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    _ensureTexture(mesh) {
        if (!this.gl || !mesh || !mesh.texture || !mesh.texture.loaded || mesh.texture.error) {
            return null;
        }

        const textureInfo = mesh.texture;
        const gl = this.gl;

        if (!textureInfo.glTexture) {
            textureInfo.glTexture = gl.createTexture();
            textureInfo.dirty = true;
        }

        if (textureInfo.dirty) {
            gl.bindTexture(gl.TEXTURE_2D, textureInfo.glTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, textureInfo.flipY === false ? 0 : 1);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureInfo.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            textureInfo.dirty = false;
        }

        return textureInfo.glTexture;
    }

    _drawSolidTriangles(triangles) {
        const gl = this.gl;
        const resources = this.gpuResources && this.gpuResources.solid;
        if (!gl || !resources || !triangles.length) {
            return;
        }

        const floatsPerVertex = 6;
        const vertexCount = triangles.length * 3;
        const data = new Float32Array(vertexCount * floatsPerVertex);

        let offset = 0;
        const width = this.canvas.width;
        const height = this.canvas.height;

        triangles.forEach((entry) => {
            const color = Color.HexToColor(entry.fillColor);
            const r = color.r / 255;
            const g = color.g / 255;
            const b = color.b / 255;
            const a = entry.alpha !== undefined ? entry.alpha : 1;

            [entry.triangle.v0, entry.triangle.v1, entry.triangle.v2].forEach((vertex) => {
                const ndcX = (vertex.x / width) * 2 - 1;
                const ndcY = 1 - (vertex.y / height) * 2;

                data[offset++] = ndcX;
                data[offset++] = ndcY;
                data[offset++] = r;
                data[offset++] = g;
                data[offset++] = b;
                data[offset++] = a;
            });
        });

        gl.useProgram(resources.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

        const stride = floatsPerVertex * Float32Array.BYTES_PER_ELEMENT;

        gl.enableVertexAttribArray(resources.attribLocations.position);
        gl.vertexAttribPointer(resources.attribLocations.position, 2, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(resources.attribLocations.color);
        gl.vertexAttribPointer(resources.attribLocations.color, 4, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    }

    _drawTexturedTriangles(groupedEntries) {
        const gl = this.gl;
        const resources = this.gpuResources && this.gpuResources.textured;
        if (!gl || !resources || !groupedEntries.size) {
            return;
        }

        const fallback = [];
        const floatsPerVertex = 8;
        const stride = floatsPerVertex * Float32Array.BYTES_PER_ELEMENT;

        gl.useProgram(resources.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);

        gl.enableVertexAttribArray(resources.attribLocations.position);
        gl.vertexAttribPointer(resources.attribLocations.position, 2, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(resources.attribLocations.color);
        gl.vertexAttribPointer(resources.attribLocations.color, 4, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(resources.attribLocations.uv);
        gl.vertexAttribPointer(resources.attribLocations.uv, 2, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);

        groupedEntries.forEach((entries, mesh) => {
            const textureHandle = this._ensureTexture(mesh);
            if (!textureHandle) {
                for (let i = 0; i < entries.length; i += 1) {
                    fallback.push(entries[i]);
                }
                return;
            }

            const vertexCount = entries.length * 3;
            if (!vertexCount) {
                return;
            }

            const data = new Float32Array(vertexCount * floatsPerVertex);
            let offset = 0;
            const width = this.canvas.width;
            const height = this.canvas.height;

            entries.forEach((entry) => {
                const color = Color.HexToColor(entry.fillColor);
                const r = color.r / 255;
                const g = color.g / 255;
                const b = color.b / 255;
                const a = entry.alpha !== undefined ? entry.alpha : 1;

                const uv = entry.uv;
                const uv0 = uv ? uv.v0 : null;
                const uv1 = uv ? uv.v1 : null;
                const uv2 = uv ? uv.v2 : null;

                const vertices = [
                    { position: entry.triangle.v0, uv: uv0 },
                    { position: entry.triangle.v1, uv: uv1 },
                    { position: entry.triangle.v2, uv: uv2 },
                ];

                vertices.forEach((item) => {
                    const vertex = item.position;
                    const ndcX = (vertex.x / width) * 2 - 1;
                    const ndcY = 1 - (vertex.y / height) * 2;

                    data[offset++] = ndcX;
                    data[offset++] = ndcY;
                    data[offset++] = r;
                    data[offset++] = g;
                    data[offset++] = b;
                    data[offset++] = a;

                    const uvCoord = item.uv || { x: 0, y: 0 };
                    data[offset++] = uvCoord.x;
                    data[offset++] = uvCoord.y;
                });
            });

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textureHandle);
            gl.uniform1i(resources.uniformLocations.texture, 0);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
        });

        if (fallback.length) {
            this._drawSolidTriangles(fallback);
        }
    }

    UpdateMeshes(meshes){
        this.meshes = meshes || [];
    }

    Draw(timestep){
        const rect = this.canvas.getBoundingClientRect();
        const aspect = rect.width && rect.height ? rect.width / rect.height : 1;
        this.aspect = aspect;
        this.fov = Math.min(Math.PI / 2, Math.max(0.1, this.fov));
        this.perspectiveMatrix = Matrix.CreatePerspectiveMatrix(this.fov, this.aspect, this.near, this.far);
        const viewMatrix = this.camera.computeInverseMatrix();

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

        if (this.backend === "webgl") {
            this._beginWebGLFrame();
        }

        if (this.dimensions === 3) {
            const viewProjectionMatrix = Matrix.Multiply(this.perspectiveMatrix, viewMatrix);

            if (this.backend === "2d") {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            const renderArr = [];

            this.meshes.forEach(mesh => {
                const finalMatrix = Matrix.Multiply(viewProjectionMatrix, mesh.transformationMatrix);
                const transformedVertices = mesh.vertices.map(vertex =>
                    Matrix.MapToScreen(finalMatrix, vertex, this.canvas)
                );

                for (let i = 0; i < mesh.triangles.length; i += 3) {
                    const v0Index = mesh.triangles[i];
                    const v1Index = mesh.triangles[i + 1];
                    const v2Index = mesh.triangles[i + 2];

                    const v0 = mesh.vertices[v0Index];
                    const v1 = mesh.vertices[v1Index];
                    const v2 = mesh.vertices[v2Index];

                    const projectedV0 = Matrix.TransformPoint(mesh.transformationMatrix, v0);
                    const projectedV1 = Matrix.TransformPoint(mesh.transformationMatrix, v1);
                    const projectedV2 = Matrix.TransformPoint(mesh.transformationMatrix, v2);

                    const tV0 = transformedVertices[v0Index];
                    const tV1 = transformedVertices[v1Index];
                    const tV2 = transformedVertices[v2Index];

                    const triangleCenter = SMath.GetTriangleCenter(projectedV0, projectedV1, projectedV2);
                    const normal = SMath.GetTriangleNormal(projectedV0, projectedV1, projectedV2);
                    const distanceVector = SMath.GetDistance(this.camera.position, triangleCenter);
                    const distance = SMath.GetMagnitude(distanceVector);
                    const direction = SMath.NormalizeVector(distanceVector);

                    if (!mesh.backfaceCulling) {
                        const dot = SMath.Dot(normal, direction);
                        if (dot > 0) {
                            continue;
                        }
                    }

                    const dotForwardObjects = SMath.Dot(cameraForward, direction);
                    if (dotForwardObjects < Math.cos(this.fov)) {
                        continue;
                    }

                    let lightIntensity = 0;
                    const lightColor = this.light.color;
                    const lightDot = SMath.Dot(lightForward, normal);
                    if (lightDot > 0) {
                        lightIntensity += this.light.intensity * lightDot;
                    }

                    const meshHasTexture = mesh && typeof mesh.hasTexture === "function" && mesh.hasTexture();
                    const lightingIntensity = meshHasTexture ? Math.max(lightIntensity, 0.05) : lightIntensity;
                    const fillColor = Color.MultiplyColorsIntensity(mesh.color, lightColor, Math.max(lightingIntensity, meshHasTexture ? 0.05 : 0));

                    let uv = null;
                    let entryHasTexture = false;
                    if (meshHasTexture) {
                        const meshUVs = mesh.uvs || [];
                        const uv0 = meshUVs[v0Index];
                        const uv1 = meshUVs[v1Index];
                        const uv2 = meshUVs[v2Index];
                        if (uv0 && uv1 && uv2) {
                            uv = {
                                v0: uv0,
                                v1: uv1,
                                v2: uv2,
                            };
                            entryHasTexture = true;
                        }
                    }

                    renderArr.push({
                        mesh,
                        triangle: {
                            v0: tV0,
                            v1: tV1,
                            v2: tV2,
                        },
                        dist: distance,
                        light: lightIntensity,
                        color: lightColor,
                        fillColor,
                        uv,
                        hasTexture: entryHasTexture,
                    });
                }

            });

            renderArr.sort((a, b) => b.dist - a.dist);

            if (this.backend === "webgl") {
                const solidEntries = [];
                const texturedEntries = new Map();

                renderArr.forEach((entry) => {
                    if (entry.hasTexture) {
                        if (!texturedEntries.has(entry.mesh)) {
                            texturedEntries.set(entry.mesh, []);
                        }
                        texturedEntries.get(entry.mesh).push(entry);
                    } else {
                        solidEntries.push(entry);
                    }
                });

                if (solidEntries.length) {
                    this._drawSolidTriangles(solidEntries);
                }

                if (texturedEntries.size) {
                    this._drawTexturedTriangles(texturedEntries);
                }

                this._updateStatsOverlay({
                    fps: timestep ? 1 / timestep : 0,
                    triangles: renderArr.length,
                });
            } else {
                for (let i = 0; i < renderArr.length; i++) {
                    const element = renderArr[i];

                    element.mesh.DrawTriangle(
                        this.ctx,
                        element.triangle.v0, element.triangle.v1, element.triangle.v2,
                        element.light,
                        element.color,
                    );
                }

                this.ctx.font = "10px Arial";
                this.ctx.fillStyle = "#00DD00";
                this.ctx.fillText("Cam X: " + this.camera.position.x,10,10);
                this.ctx.fillText("Cam Y: " + this.camera.position.y,10,30);
                this.ctx.fillText("Cam Z: " + this.camera.position.z,10,50);

                this.ctx.fillText("Triangles: " + renderArr.length,10,70);
                this.ctx.fillText("FPS: " + (timestep ? (1 / timestep).toFixed(1) : 0),10,90);
                this.ctx.fillText("Backend: Canvas 2D",10,110);
            }
        } else {
            this.meshes.sort((a, b) => a.layer - b.layer);

            if (this.backend === "webgl") {
                const triangleData = [];
                const viewTransform = viewMatrix;

                this.meshes.forEach(mesh => {
                    const finalMatrix = Matrix.Multiply(viewTransform, mesh.transformationMatrix);
                    for (let i = 0; i < mesh.triangles.length; i += 3) {
                        const v0 = Matrix.TransformPoint(finalMatrix, mesh.vertices[mesh.triangles[i]]);
                        const v1 = Matrix.TransformPoint(finalMatrix, mesh.vertices[mesh.triangles[i + 1]]);
                        const v2 = Matrix.TransformPoint(finalMatrix, mesh.vertices[mesh.triangles[i + 2]]);

                        triangleData.push({
                            triangle: {
                                v0: v0,
                                v1: v1,
                                v2: v2,
                            },
                            fillColor: mesh.color,
                        });
                    }
                });

                this._drawSolidTriangles(triangleData);
                this._updateStatsOverlay({
                    fps: timestep ? 1 / timestep : 0,
                    triangles: triangleData.length,
                });
            } else {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                this.meshes.forEach(mesh => {
                    const finalMatrix = Matrix.Multiply(viewMatrix, mesh.transformationMatrix);
                    mesh.Draw(this.ctx, finalMatrix, timestep);
                });

                this.ctx.font = "10px Arial";
                this.ctx.fillStyle = "#00DD00";
                this.ctx.fillText("Backend: Canvas 2D",10,20);
            }
        }
    }
}
