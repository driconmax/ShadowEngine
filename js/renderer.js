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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.graphics.sort((a, b) => a.layer - b.layer);
        this.graphics.forEach(graphic => {
            graphic.Draw(this.ctx, this.camera.position, this.camera.rotation, this.camera.scale, timestep);
        });
    }
}