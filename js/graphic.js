class Graphic {
    /**
     *
     */
    constructor(position) {
        this.position = position;
        this.layer = 0;
        this.color = "#534857";
    }

    SetLayer(layer){
        this.layer = layer;
    }

    SetColor(color){
        this.color = color;
    }

    Draw(cameraPosition, cameraRotation, cameraScale){

    }
}

class Square extends Graphic {
    /**
     *
     */
    constructor(position, size) {
        super(position);
        this.size = size;
    }

    Draw(ctx, cameraPosition, cameraRotation, cameraScale){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x - cameraPosition.x,this.position.y - cameraPosition.y, this.size.x, this.size.y);
    }
}