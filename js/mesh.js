class Mesh {
    /**
     *
     */
    constructor(position, vertices = [], triangles = [], backfaceCulling = true) {
        this.position = position;
        this.layer = 0;
        this.color = "#534857";
        this.vertices = vertices;
        this.triangles = triangles;
        this.backfaceCulling = backfaceCulling;
        this.transformationMatrix = Matrix.CreateTranslationMatrix(0, 0, 0);
    }

    SetLayer(layer){
        this.layer = layer;
    }

    SetColor(color){
        this.color = color;
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

    FinalDraw(ctx, transformedVertices) {

        for (let i = 0; i < this.triangles.length; i += 3) {
        
            var v0 = transformedVertices[this.triangles[i]];
            var v1 = transformedVertices[this.triangles[i + 1]];
            var v2 = transformedVertices[this.triangles[i + 2]];

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
            
            ctx.fillStyle = this.color;
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.stroke();
        }

    }

    DrawTriangle(ctx, v0, v1, v2){
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
        
        ctx.fillStyle = this.color;
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#000";
        ctx.stroke();
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
    
        for (const line of lines) {
            const parts = line.trim().split(" ");
            if (parts[0] === "v") {
                // Parse vertex
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                vertices.push(new Vector3(x, y, z));
            } else if (parts[0] === "f") {
                // Parse face
                const v1 = parseInt(parts[1]) - 1; // Convert to 0-based index
                const v2 = parseInt(parts[2]) - 1;
                const v3 = parseInt(parts[3]) - 1;
                triangles.push(v1, v2, v3);
            }
        }
        return new Mesh(new Vector3(0,0,0), vertices, triangles);
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
            this.triangles.push(i);
            this.triangles.push(i-1);
        }

        this.triangles.push(0);
        this.triangles.push(1);
        this.triangles.push(sides);

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
        super(position, vertices, triangles);
    }
}