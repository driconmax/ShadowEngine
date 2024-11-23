class Room extends ShadowScript {
    Create() {
        // Wall (front)
        this.frontWall = new SObject(new Vector3(0, 0, -250));
        const frontWallVertices = [
            new Vector3(-50, -50, 0), // Bottom-left
            new Vector3(50, -50, 0),  // Bottom-right
            new Vector3(50, 50, 0),   // Top-right
            new Vector3(-50, 50, 0)   // Top-left
        ];
        const frontWallTriangles = [0, 2, 1, 0, 3, 2];
        const frontWallPolygon = new Mesh(new Vector3(0, 0, 0), frontWallVertices, frontWallTriangles);
        frontWallPolygon.SetColor("#FF0000"); // Red wall
        this.frontWall.AddMesh(frontWallPolygon);
        this.AddSObject(this.frontWall);

        // Door Frame
        this.doorFrame = new SObject(new Vector3(0, 0, 150));
        const doorFrameVertices = [
            new Vector3(-20, -50, 0),
            new Vector3(20, -50, 0),
            new Vector3(20, 50, 0),
            new Vector3(-20, 50, 0)
        ];
        const doorFrameTriangles = [0, 2, 1, 0, 3, 2];
        const doorFramePolygon = new Mesh(new Vector3(0, 0, 0), doorFrameVertices, doorFrameTriangles);
        doorFramePolygon.SetColor("#00FF00"); // Green door frame
        this.doorFrame.AddMesh(doorFramePolygon);
        this.AddSObject(this.doorFrame);

        /*
        // Ceiling
        this.ceiling = new SObject(new Vector3(0, 50, -200), new Vector3(-Math.PI / 2, 0, 0));
        const ceilingVertices = [
            new Vector3(-50, -50, 0),
            new Vector3(50, -50, 0),
            new Vector3(50, 50, 0),
            new Vector3(-50, 50, 0)
        ];
        const ceilingTriangles = [0, 2, 1, 0, 3, 2];
        const ceilingPolygon = new Mesh(new Vector3(0, 0, 0), ceilingVertices, ceilingTriangles);
        ceilingPolygon.SetColor("#0000FF"); // Blue ceiling
        this.ceiling.AddMesh(ceilingPolygon);
        this.AddSObject(this.ceiling);

        // Side Wall (left)
        this.sideWall = new SObject(new Vector3(-50, 0, -200), new Vector3(0, Math.PI / 2, 0));
        const sideWallVertices = [
            new Vector3(-50, -50, 0),
            new Vector3(50, -50, 0),
            new Vector3(50, 50, 0),
            new Vector3(-50, 50, 0)
        ];
        const sideWallTriangles = [0, 2, 1, 0, 3, 2];
        const sideWallPolygon = new Mesh(new Vector3(0, 0, 0), sideWallVertices, sideWallTriangles);
        sideWallPolygon.SetColor("#FFFF00"); // Yellow side wall
        this.sideWall.AddMesh(sideWallPolygon);
        this.AddSObject(this.sideWall);
        */
    }

    Update(timestep) {
        // Optional: Rotate camera for a dynamic view
        //this.renderer.camera.rotation.y += 0.1 * timestep;
    }
}

engine.registerScript(Room);