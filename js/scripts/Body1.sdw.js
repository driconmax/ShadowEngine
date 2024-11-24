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
        this.circleObj = new SObject(new Vector3(-300, 0));
        this.AddSObject(this.circleObj);
        this.circleObj.circle = new Circle(new Vector3(0, 0, 0), 3, 100);
        this.circleObj.circle.vertices[0].z += 50;
        this.circleObj.AddMesh(this.circleObj.circle);
        
        this.circleObj1 = new SObject(new Vector3(-500, 0));
        this.AddSObject(this.circleObj1);
        this.circleObj1.circle = new Circle(new Vector3(0, 0, 0), 8, 100);
        this.circleObj1.AddMesh(this.circleObj1.circle);

        this.circleObj2 = new SObject(new Vector3(-700, 0));
        this.AddSObject(this.circleObj2);
        this.circleObj2.circle = new Circle(new Vector3(0, 0, 0), 16, 100);
        this.circleObj2.AddMesh(this.circleObj2.circle);


        this.squareObj = new SObject(new Vector3(-0, 50));
        this.AddSObject(this.squareObj);
        this.squareObj.square = new Square(new Vector3(0, 0, 0), 20);
        this.squareObj.square.SetColor("#ff0000");
        this.squareObj.AddMesh(this.squareObj.square);

        this.sideSquareObj = new SObject(new Vector3(-0, 50), new Vector3(0, 0, 0));
        this.AddSObject(this.sideSquareObj);
        this.sideSquareObj.square = new Square(new Vector3(0, 0, 0), 20);
        this.sideSquareObj.square.SetColor("#00ff00");
        this.sideSquareObj.AddMesh(this.sideSquareObj.square);
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

        //this.renderer.light.transform.rotation.y += 1 * timestep;
        this.renderer.light.transform.rotation.y = 45;
        this.renderer.light.color = Color.GetRandomColor().hex();
        //this.renderer.light.intensity = Math.max(1, this.renderer.light.intensity + Math.random()-.5)
    }
}

engine.registerScript(Body1);