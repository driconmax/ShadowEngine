class Graphic {
    /**
     *
     */
    constructor(position) {
        this.position = position;
        this.layer = 0;
        this.color = "#534857";
        this.transformationMatrix = Matrix.CreateTranslationMatrix(0, 0, 0);
    }

    SetLayer(layer){
        this.layer = layer;
    }

    SetColor(color){
        this.color = color;
    }

    Draw(ctx, finalMatrix){

    }
}

class Polygon extends Graphic {
    /**
     *
     */
    constructor(position, vertices) {
        super(position);
        this.vertices = vertices;
    }

    Draw(ctx, finalMatrix){
        ctx.fillStyle = this.color;
        const position0 = Matrix.TransformPoint(finalMatrix, this.vertices[0]);
        
        ctx.beginPath();
        ctx.moveTo(
            position0.x,
            position0.y
        );
        for (let i = 1; i < this.vertices.length; i++) {
            const vertex = this.vertices[i];
            const position = Matrix.TransformPoint(finalMatrix, vertex);
            ctx.lineTo(
                position.x,
                position.y
            );
        }
        ctx.closePath();
        ctx.fill();
    }
}

class Circle extends Polygon {
    /**
     * 
     * @param {Vector3} position 
     * @param {Number} sides 
     * @param {Number} radius 
     */
    constructor(position, sides, radius) {
        super(position);
        this.vertices = [];
        
        this.vertices.push(
            new Vector3(
                position.x +  radius * Math.cos(0),
                position.y +  radius * Math.sin(0)
            )
        );
        
        for (var i = 1; i <= sides;i += 1) {
            this.vertices.push(
                new Vector3(
                    position.x + radius * Math.cos(i * 2 * Math.PI / sides),
                    position.y + radius * Math.sin(i * 2 * Math.PI / sides)
                )
            );
        }

    }
    
}

class Square extends Circle {
    /**
     *
     */
    constructor(position, size) {
        super(position, 4, size);
    }
}