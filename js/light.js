class Light extends ShadowScript {
    /**
     *
     */
    constructor() {
        super();    
        this.transform = new SObject(new Vector3(100, 0));
        this.color = "#FF0000";
        this.intensity = 1;
    }

    Create(){
        //this.AddLight(this);
    }
}