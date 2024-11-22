class Renderer extends ShadowScript {
    /**
     *
     */
    constructor(canvas, framerate) {
        super();
        this.camera = new SObject();

        this.canvas = canvas;
        this.ctx;
        this.framerate = Math.min(24, framerate);
        this.framerate = Math.max(this.framerate, 60);
        this.ctx = this.canvas.getContext("2d");
    }

    UpdateGraphics(graphics){
        this.graphics = graphics;
    }

    Draw(timestep){
        const cameraMatrix = this.camera.computeMatrix();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.graphics.sort((a, b) => a.layer - b.layer);
        this.graphics.forEach(graphic => {
            const finalMatrix = Matrix.Multiply(cameraMatrix, graphic.transformationMatrix);
            graphic.Draw(this.ctx, finalMatrix, timestep);
        });
    }
}