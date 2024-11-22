class Body1 extends ShadowScript {
    /**
     *
     */
    constructor() {
        super();
        this.img = new Image();
        this.img.src = "image/grass.png"

        this.x = 256;
        this.y = 256;
        
    }

    Create(){
        this.circleObj = new SObject();
        this.AddSObject(this.circleObj);
        this.circleObj.position.x = 100;
        this.circleObj.position.y = 100;
        this.circleObj.circle = new Circle(new Vector3(0, 0, 0), 3, -100);
        this.circleObj.AddGraphic(this.circleObj.circle);

        this.squareObj = new SObject(new Vector3(0, 0));
        this.AddSObject(this.squareObj);
        this.squareObj.square = new Square(new Vector3(0, 0, 0), 20);
        this.squareObj.square.SetColor("#ff0000");
        this.squareObj.AddGraphic(this.squareObj.square);

        this.sideSquareObj = new SObject(new Vector3(0, 0), new Vector3(0, 0, 0));
        this.AddSObject(this.sideSquareObj);
        this.sideSquareObj.square = new Square(new Vector3(0, 0, 0), 20);
        this.sideSquareObj.square.SetColor("#00ff00");
        this.sideSquareObj.AddGraphic(this.sideSquareObj.square);
    }

    Update(timestep){
        
        //this.squareObj.rotation.z -= 1 * timestep;
        this.squareObj.rotation.y -= 1 * timestep;
        //this.squareObj.position.x += 10 * timestep;

        //this.sideSquareObj.position.y += 5 * timestep;

        //this.circleObj.scale.x -= 0.1 * timestep;
        //this.circleObj.scale.y -= 0.1 * timestep;
        //this.circleObj.position.z += 10 * timestep;
        this.circleObj.rotation.z += 1 * timestep;

        //this.renderer.camera.position.z = 0;
        //this.renderer.camera.position.y += 10 * timestep;
        //this.renderer.camera.rotation.z += 1 * timestep;
    }
}

engine.registerScript(Body1);