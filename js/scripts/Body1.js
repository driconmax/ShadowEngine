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
        this.circleObj = new SObject();
        this.AddSObject(this.circleObj);
        this.circleObj.position.x = 100;
        this.circleObj.position.y = 100;
        this.circleObj.circle = new Circle(new Vector3(0, 0, 0), 15, 100);
        this.circleObj.AddGraphic(this.circleObj.circle);

        this.squareObj = new SObject(new Vector3(20, 20));
        this.AddSObject(this.squareObj);
        this.squareObj.square = new Square(new Vector3(0, 0, 0), 20);
        this.squareObj.square.SetColor("#ff0000");
        this.squareObj.AddGraphic(this.squareObj.square);
    }

    Update(timestep){
        this.squareObj.rotation.z -= 1 * timestep;
        this.squareObj.position.x += 10 * timestep;
        this.circleObj.scale.x -= 0.1 * timestep;
        this.circleObj.scale.y -= 0.1 * timestep;
        this.circleObj.rotation.z += 1 * timestep;
    }
}

engine.registerScript(Body1);