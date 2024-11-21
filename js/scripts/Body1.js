class Body1 extends ShadowScript {
    /**
     *
     */
    constructor() {
        super();
        this.img = new Image();
        this.img.src = "../../image/grass.png"

        this.x = 256;
        this.y = 256;
        
    }

    Create(){
        this.square = new Square(new Vector3(50, 50, 0), new Vector3(20, 20, 0));
        this.square.SetColor("#ff0000");
        this.AddGraphic(this.square);
    }

    Update(timestep){
        this.square.position.x += 10 * timestep;
    }
}

engine.registerScript(Body1);