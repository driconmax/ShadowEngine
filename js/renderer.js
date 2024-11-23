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
        var rect = canvas.getBoundingClientRect();
        this.aspect = rect.width / rect.height;
        this.near = 0.1; // Near clipping plane
        this.far = 1000; // Far clipping plane
        this.perspectiveMatrix = Matrix.CreatePerspectiveMatrix(this.fov, this.aspect, this.near, this.far);
    }

    UpdateMeshes(meshes){
        this.meshes = meshes;
    }

    Draw(timestep){
        var rect = canvas.getBoundingClientRect();
        this.aspect = rect.width / rect.height;
        this.fov = Math.min(Math.PI/2, this.fov);
        this.fov = Math.max(.1, this.fov);
        this.perspectiveMatrix = Matrix.CreatePerspectiveMatrix(this.fov, this.aspect, this.near, this.far);
        const viewMatrix = this.camera.computeInverseMatrix();

        // Compute the camera's forward vector
        const forwardVector = new Vector3(
            Math.sin(this.camera.rotation.y),
            0,
            -Math.cos(this.camera.rotation.y)
        );

        if(this.dimensions == 3){
            //3D Perspective Logic
            const viewProjectionMatrix = Matrix.Multiply(this.perspectiveMatrix, viewMatrix);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.meshes.sort((a, b) => b.transformationMatrix[2][3] - a.transformationMatrix[2][3]);
            this.meshes.forEach(mesh => {
                const finalMatrix = Matrix.Multiply(viewProjectionMatrix, mesh.transformationMatrix);
                const transformedVertices = mesh.vertices.map(vertex => 
                    Matrix.MapToScreen(finalMatrix, vertex, this.canvas)
                );

                // Perform backface culling
                for (let i = 0; i < mesh.triangles.length; i += 3) {
                    const v0 = mesh.vertices[mesh.triangles[i]];
                    const v1 = mesh.vertices[mesh.triangles[i + 1]];
                    const v2 = mesh.vertices[mesh.triangles[i + 2]];

                    const tV0 = transformedVertices[mesh.triangles[i]];
                    const tV1 = transformedVertices[mesh.triangles[i + 1]];
                    const tV2 = transformedVertices[mesh.triangles[i + 2]];

                    var center = SMath.GetTriangleCenter(v0, v1, v2);
                    var normal = SMath.GetTriangleNormal(v0, v1, v2);

                    // Compute dot product with camera forward vector
                    const dot = normal.x * forwardVector.x + normal.y * forwardVector.y + normal.z * forwardVector.z;
                    if (dot < 0) {
                        // Skip rendering this triangle
                        continue; 
                    }
                    
                    var relativePosition = new Vector3(
                        v0.x - this.camera.position.x,
                        v0.y - this.camera.position.y,
                        v0.z - this.camera.position.z,
                    );
                    const dot2 = relativePosition.x * forwardVector.x + relativePosition.y * forwardVector.y + relativePosition.z * forwardVector.z;
                    if (dot2 < 0) {
                        // Skip rendering this triangle
                        continue; 
                    }
                    // Transform triangle vertices and render if visible
                    //mesh.FinalDraw(this.ctx, transformedVertices, timestep);
                    mesh.DrawTriangle(this.ctx, tV0, tV1, tV2);

                    // Draw Triangle Normal
                    var mappedCenter = Matrix.MapToScreen(finalMatrix, center, this.canvas)
                    var endPoint = new Vector3(
                        center.x + normal.x * 10,
                        center.y + normal.y * 10,
                        center.z + normal.z * 10
                    );
                    var mappedEndPoint = Matrix.MapToScreen(finalMatrix, endPoint, this.canvas)
                    mesh.DrawLine(this.ctx, mappedCenter, mappedEndPoint);
                }
            });
        } else {
            this.meshes.sort((a, b) => a.layer - b.layer);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
            this.meshes.forEach(mesh => {
                const finalMatrix = Matrix.Multiply(viewMatrix, mesh.transformationMatrix);
                mesh.Draw(this.ctx, finalMatrix, timestep);
            });
        }
    }
}