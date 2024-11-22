class CameraController extends ShadowScript {
    Create() {
        // Wall (front)
        this.frontWall = new SObject(new Vector3(0, 0, -250));
        const frontWallVertices = [
            new Vector3(-50, -50, 0), // Bottom-left
            new Vector3(50, -50, 0),  // Bottom-right
            new Vector3(50, 50, 0),   // Top-right
            new Vector3(-50, 50, 0)   // Top-left
        ];
        const frontWallPolygon = new Polygon(new Vector3(0, 0, 0), frontWallVertices);
        frontWallPolygon.SetColor("#FF0000"); // Red wall
        this.frontWall.AddGraphic(frontWallPolygon);
        this.AddSObject(this.frontWall);

        // Door Frame
        this.doorFrame = new SObject(new Vector3(0, 0, -150));
        const doorFrameVertices = [
            new Vector3(-20, -50, 0),
            new Vector3(20, -50, 0),
            new Vector3(20, 50, 0),
            new Vector3(-20, 50, 0)
        ];
        const doorFramePolygon = new Polygon(new Vector3(0, 0, 0), doorFrameVertices);
        doorFramePolygon.SetColor("#00FF00"); // Green door frame
        this.doorFrame.AddGraphic(doorFramePolygon);
        this.AddSObject(this.doorFrame);

        // Ceiling
        this.ceiling = new SObject(new Vector3(0, 50, -200), new Vector3(-Math.PI / 2, 0, 0));
        const ceilingVertices = [
            new Vector3(-50, -50, 0),
            new Vector3(50, -50, 0),
            new Vector3(50, 50, 0),
            new Vector3(-50, 50, 0)
        ];
        const ceilingPolygon = new Polygon(new Vector3(0, 0, 0), ceilingVertices);
        ceilingPolygon.SetColor("#0000FF"); // Blue ceiling
        this.ceiling.AddGraphic(ceilingPolygon);
        this.AddSObject(this.ceiling);

        // Side Wall (left)
        this.sideWall = new SObject(new Vector3(-50, 0, -200), new Vector3(0, Math.PI / 2, 0));
        const sideWallVertices = [
            new Vector3(-50, -50, 0),
            new Vector3(50, -50, 0),
            new Vector3(50, 50, 0),
            new Vector3(-50, 50, 0)
        ];
        const sideWallPolygon = new Polygon(new Vector3(0, 0, 0), sideWallVertices);
        sideWallPolygon.SetColor("#FFFF00"); // Yellow side wall
        this.sideWall.AddGraphic(sideWallPolygon);
        this.AddSObject(this.sideWall);
    }

    Update(timestep) {
        // Optional: Rotate camera for a dynamic view
        //this.renderer.camera.rotation.y += 0.1 * timestep;
    }
}

engine.registerScript(CameraController);