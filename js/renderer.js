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
        
        this.fov = Math.PI / 4; // 45 degrees in radians
        this.aspect = canvas.width / canvas.height;
        this.near = 0.1; // Near clipping plane
        this.far = 1000; // Far clipping plane
        this.perspectiveMatrix = Matrix.CreatePerspectiveMatrix(this.fov, this.aspect, this.near, this.far);
    }

    UpdateMeshs(meshs){
        this.meshs = meshs;
    }

    Draw(timestep){
        this.fov = Math.min(Math.PI/2, this.fov);
        this.fov = Math.max(.1, this.fov);
        this.perspectiveMatrix = Matrix.CreatePerspectiveMatrix(this.fov, this.aspect, this.near, this.far);
        const viewMatrix = this.camera.computeInverseMatrix();
        if(this.dimensions == 3){
            //3D Perspective Logic
            const viewProjectionMatrix = Matrix.Multiply(this.perspectiveMatrix, viewMatrix);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.meshs.sort((a, b) => b.transformationMatrix[2][3] - a.transformationMatrix[2][3]);
            this.meshs.forEach(mesh => {
                const finalMatrix = Matrix.Multiply(viewProjectionMatrix, mesh.transformationMatrix);
                const transformedVertices = mesh.vertices.map(vertex => 
                    Matrix.MapToScreen(finalMatrix, vertex, this.canvas)
                );

                mesh.FinalDraw(this.ctx, transformedVertices, timestep);
            });
        } else {
            this.meshs.sort((a, b) => a.layer - b.layer);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
            this.meshs.forEach(mesh => {
                const finalMatrix = Matrix.Multiply(viewMatrix, mesh.transformationMatrix);
                mesh.Draw(this.ctx, finalMatrix, timestep);
            });
        }
    }
}