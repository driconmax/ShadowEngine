class Renderer extends ShadowScript {
    /**
     *
     */
    constructor(canvas, framerate, dimensions = 2) {
        super();
        this.camera = new SObject(new Vector3(0, 0, 500));
        this.light = new Light(new Vector3(0, 0, 0));

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

        if(this.dimensions == 3){

            //3D Perspective Logic
            const viewProjectionMatrix = Matrix.Multiply(this.perspectiveMatrix, viewMatrix);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const renderArr = [];

            //this.meshes.sort((a, b) => a.transformationMatrix[2][3] - b.transformationMatrix[2][3]);
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

                    const pV0 = Matrix.TransformPoint(mesh.transformationMatrix, v0);
                    const pV1 = Matrix.TransformPoint(mesh.transformationMatrix, v1);
                    const pV2 = Matrix.TransformPoint(mesh.transformationMatrix, v2);

                    const tV0 = transformedVertices[mesh.triangles[i]];
                    const tV1 = transformedVertices[mesh.triangles[i + 1]];
                    const tV2 = transformedVertices[mesh.triangles[i + 2]];


                    var tCenter = SMath.GetTriangleCenter(pV0, pV1, pV2);
                    var normal = SMath.GetTriangleNormal(pV0, pV1, pV2);
                    const distV = SMath.GetDistance(this.camera.position, tCenter);
                    const dist = SMath.GetMagnitude(distV);
                    const dir = SMath.NormalizeVector(distV);
                    //console.log(dir);

                    if(!mesh.backfaceCulling){
                        // Backface culling
                        const dot = SMath.Dot(normal, dir);
                        if (dot > 0) {
                            // Skip rendering this triangle
                            continue; 
                        }
                    }

                    // In front Objects
                    const dotForwardObjects = SMath.Dot(cameraForward, dir);
                    if (dotForwardObjects < Math.cos(this.fov)) {
                        // Skip rendering this triangle
                        continue; 
                    }

                    var lightIntensity = 0;
                    var lightColor = this.light.color; 
                    const lightDot = SMath.Dot(lightForward, normal);
                    if(lightDot > 0){
                        lightIntensity += this.light.intensity * lightDot;
                    }

                    renderArr.push({
                        mesh: mesh,
                        triangle: {
                           v0: tV0, 
                           v1: tV1, 
                           v2: tV2, 
                        },
                        dist: dist,
                        light: lightIntensity,
                        color: lightColor
                    });
                    
                    /*var relativePosition = new Vector3(
                        v0.x - this.camera.position.x,
                        v0.y - this.camera.position.y,
                        v0.z - this.camera.position.z,
                    );
                    const dot2 = relativePosition.x * cameraForward.x + relativePosition.y * cameraForward.y + relativePosition.z * cameraForward.z;
                    if (dot2 < 0) {
                        // Skip rendering this triangle
                        continue; 
                    }*/
                    // Transform triangle vertices and render if visible
                    //mesh.FinalDraw(this.ctx, transformedVertices, timestep);
                    /*mesh.DrawTriangle(this.ctx, tV0, tV1, tV2);

                    // Draw Triangle Normal

                    var center = SMath.GetTriangleCenter(v0, v1, v2);
                    var normal = SMath.GetTriangleNormal(v0, v1, v2);
                    var mappedCenter = Matrix.MapToScreen(finalMatrix, center, this.canvas)
                    var endPoint = new Vector3(
                        center.x + normal.x * 10,
                        center.y + normal.y * 10,
                        center.z + normal.z * 10
                    );
                    var mappedEndPoint = Matrix.MapToScreen(finalMatrix, endPoint, this.canvas)
                    mesh.DrawLine(this.ctx, mappedCenter, mappedEndPoint);*/
                }

            });
                
            renderArr.sort((a, b) => b.dist - a.dist);
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
            
            this.ctx.fillText("FPS: " + 1/timestep,10,90);
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