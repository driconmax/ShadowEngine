class Mesh {
    /**
     *
     */
    constructor(position, vertices = [], triangles = [], backfaceCulling = false, uvs = []) {
        this.position = position;
        this.layer = 0;
        this.color = "#534857";
        this.vertices = vertices;
        this.triangles = triangles;
        this.backfaceCulling = backfaceCulling;
        this.transformationMatrix = Matrix.CreateTranslationMatrix(0, 0, 0);
        this.uvs = Array.isArray(uvs) ? uvs : [];
        this.texture = null;
    }

    SetLayer(layer){
        this.layer = layer;
    }

    SetColor(color){
        this.color = color;
    }

    SetUVs(uvs){
        this.uvs = Array.isArray(uvs) ? uvs : [];
    }

    SetTexture(source, options = {}){
        if (!source) {
            this.texture = null;
            return null;
        }

        const globalConfig = (typeof window !== "undefined" && window.ShadowRunnerConfig) ? window.ShadowRunnerConfig : {};
        const locationProtocol = (typeof window !== "undefined" && window.location && window.location.protocol) ? window.location.protocol : "";
        const isFileProtocol = locationProtocol === "file:";

        const skipLocalFlag = !!options.skipLocal || !!globalConfig.skipTextureOnFileProtocol;
        if (isFileProtocol && skipLocalFlag) {
            if (typeof console !== "undefined" && console.info) {
                console.info(`Mesh.SetTexture: skipping texture load for "${source}" while running from file protocol.`);
            }
            this.texture = null;
            return null;
        }

        if (isFileProtocol && !skipLocalFlag) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn(`Mesh.SetTexture: attempting to load "${source}" from file protocol may fail in WebGL. Serve via HTTP or launch with ?localTextures=1 to skip.`);
            }
        }

        const texture = {
            loaded: false,
            error: false,
            dirty: true,
            flipY: options.flipY !== undefined ? !!options.flipY : true,
            glTexture: null,
            image: null,
            width: 0,
            height: 0,
            url: null,
        };

        const assignImage = (image) => {
            texture.image = image;
            texture.width = image.width;
            texture.height = image.height;
            texture.loaded = true;
            texture.error = false;
            texture.dirty = true;
        };

        const crossOriginValue = options.crossOrigin !== undefined ? options.crossOrigin : globalConfig.crossOrigin;

        if (typeof source === "string") {
            const image = new Image();
            if (crossOriginValue !== undefined) {
                image.crossOrigin = crossOriginValue;
            }
            image.onload = () => {
                assignImage(image);
            };
            image.onerror = () => {
                texture.error = true;
            };
            image.src = source;
            texture.image = image;
            texture.url = source;
        } else if (source instanceof HTMLImageElement) {
            assignImage(source);
            texture.url = source.src;
        } else {
            throw new Error("Mesh.SetTexture: unsupported texture source type.");
        }

        this.texture = texture;
        return texture.image;
    }

    ClearTexture(){
        if (this.texture) {
            this.texture.glTexture = null;
        }
        this.texture = null;
    }

    hasTexture(){
        return !!(this.texture && this.texture.loaded && !this.texture.error);
    }

    Draw(ctx, finalMatrix){

        for (let i = 0; i < this.triangles.length; i += 3) {
        
            var vertex = this.vertices[this.triangles[i]];
            var position = Matrix.TransformPoint(finalMatrix, vertex);

            ctx.beginPath();
            ctx.moveTo(
                position.x,
                position.y
            );

            vertex = this.vertices[this.triangles[i + 1]];
            position = Matrix.TransformPoint(finalMatrix, vertex);
            ctx.lineTo(
                position.x,
                position.y
            );

            vertex = this.vertices[this.triangles[i + 2]];
            position = Matrix.TransformPoint(finalMatrix, vertex);
            ctx.lineTo(
                position.x,
                position.y
            );
            
            ctx.fillStyle = this.color;
            ctx.closePath();
            ctx.fill();
        }
    }

    DrawTriangle(ctx, v0, v1, v2, lightIntensity = 1, lightColor = "#FFFFFF"){
        ctx.beginPath();
        ctx.moveTo(
            v0.x,
            v0.y
        );
        
        ctx.lineTo(
            v1.x,
            v1.y
        );

        ctx.lineTo(
            v2.x,
            v2.y
        );
        
        //ctx.fillStyle = Color.MultiplyColorsIntensity(Color.GetRandomColor().hex(), lightColor, lightIntensity);
        ctx.fillStyle = Color.MultiplyColorsIntensity(this.color, lightColor, lightIntensity);
        //ctx.fillStyle = this.color;
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#000";
        //ctx.stroke();
    }

    DrawLine(ctx, a, b){
        ctx.beginPath();
        ctx.moveTo(
            a.x,
            a.y
        );
        
        ctx.lineTo(
            b.x,
            b.y
        );
        //ctx.closePath();
        ctx.fillStyle = "#000";
        ctx.stroke();
    }

    static ParseOBJ(fileContent) {
        const lines = fileContent.split("\n");
        const vertices = [];
        const triangles = [];
        const tempUVs = [];
        const vertexUVs = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith("#")) {
                continue;
            }

            const parts = line.split(/\s+/);
            const prefix = parts[0];

            if (prefix === "v") {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                vertices.push(new Vector3(x, y, z));
            } else if (prefix === "vt") {
                const u = parseFloat(parts[1]);
                const v = parts.length > 2 ? parseFloat(parts[2]) : 0;
                tempUVs.push(new Vector2(u, v));
            } else if (prefix === "f") {
                const faceVertices = parts.slice(1);
                if (faceVertices.length < 3) {
                    continue;
                }

                for (let i = 1; i < faceVertices.length - 1; i += 1) {
                    const faceIndices = [faceVertices[0], faceVertices[i], faceVertices[i + 1]];

                    faceIndices.forEach((token) => {
                        const components = token.split("/");
                        const vertexIndex = parseInt(components[0], 10) - 1;
                        triangles.push(vertexIndex);

                        if (components.length > 1 && components[1]) {
                            const uvIndex = parseInt(components[1], 10) - 1;
                            const uv = tempUVs[uvIndex];
                            if (uv && !vertexUVs[vertexIndex]) {
                                vertexUVs[vertexIndex] = new Vector2(uv.x, uv.y);
                            }
                        }
                    });
                }
            }
        }

        const mesh = new Mesh(new Vector3(0,0,0), vertices, triangles, false, vertexUVs);
        return mesh;
    }
}

class Circle extends Mesh {
    /**
     * 
     * @param {Vector3} position 
     * @param {Number} sides 
     * @param {Number} radius 
     */
    constructor(position, sides, radius, startRotation = 0) {
        super(position);
        this.vertices = [];
        
        this.vertices.push(
            new Vector3(
                position.x,
                position.y
            )
        );
        
        this.vertices.push(
            new Vector3(
                position.x +  radius * Math.cos(0 + startRotation),
                position.y +  radius * Math.sin(0 + startRotation)
            )
        );
        
        for (var i = 1; i <= sides;i += 1) {
            this.vertices.push(
                new Vector3(
                    position.x + radius * Math.cos(i * 2 * Math.PI / sides + startRotation),
                    position.y + radius * Math.sin(i * 2 * Math.PI / sides + startRotation)
                )
            );
        }
        
        for (var i = 2; i <= sides; i += 1) {
            this.triangles.push(0);
            this.triangles.push(i-1);
            this.triangles.push(i);
        }

        this.triangles.push(0);
        this.triangles.push(sides);
        this.triangles.push(1);

    }
    
}

class Square extends Mesh {
    /**
     *
     */
    constructor(position, size) {
        const halfSize = size / 2;
        const vertices = [
            new Vector3(-halfSize, -halfSize, 0),
            new Vector3(halfSize, -halfSize, 0),
            new Vector3(halfSize, halfSize, 0),
            new Vector3(-halfSize, halfSize, 0),
        ];
        const triangles = [0, 2, 1, 0, 3, 2];
        const uvs = [
            new Vector2(0, 1),
            new Vector2(1, 1),
            new Vector2(1, 0),
            new Vector2(0, 0),
        ];
        super(position, vertices, triangles, false, uvs);
    }
}