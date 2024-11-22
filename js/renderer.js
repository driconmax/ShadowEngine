class Renderer extends ShadowScript {
    /**
     *
     */
    constructor(canvas, framerate, dimensions = 2) {
        super();
        this.camera = new SObject(new Vector3(0, 0, 500));

        this.canvas = canvas;
        this.ctx;

        this.dimensions = Math.min(3, dimensions);
        this.dimensions = Math.max(this.dimensions, 2);

        this.framerate = Math.min(60, framerate);
        this.framerate = Math.max(this.framerate, 24);

        this.ctx = this.canvas.getContext("2d");
        
        const fov = Math.PI / 4; // 45 degrees in radians
        const aspect = canvas.width / canvas.height;
        const near = 0.1; // Near clipping plane
        const far = 1000; // Far clipping plane
        this.perspectiveMatrix = Matrix.CreatePerspectiveMatrix(fov, aspect, near, far)
    }

    UpdateGraphics(graphics){
        this.graphics = graphics;
    }

    Draw(timestep){
        const viewMatrix = this.camera.computeInverseMatrix();
        if(this.dimensions == 3){
            //3D Perspective Logic
            const viewProjectionMatrix = Matrix.Multiply(this.perspectiveMatrix, viewMatrix);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.graphics.forEach(graphic => {
                const finalMatrix = Matrix.Multiply(viewProjectionMatrix, graphic.transformationMatrix);
                const transformedVertices = graphic.vertices.map(vertex => 
                    Matrix.MapToScreen(finalMatrix, vertex, this.canvas)
                );

                graphic.FinalDraw(this.ctx, transformedVertices, timestep);
            });
        } else {
            this.graphics.sort((a, b) => a.layer - b.layer);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
            this.graphics.forEach(graphic => {
                const finalMatrix = Matrix.Multiply(viewMatrix, graphic.transformationMatrix);
                graphic.Draw(this.ctx, finalMatrix, timestep);
            });
        }
    }
}