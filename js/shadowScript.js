class ShadowScript {
    /**
     *
     */
    constructor() {
        this.graphics = [];
        this.sobjects = [];
        this.engine;
        this.renderer;
    }

    Load(){

    }

    SetDefaults(engine, renderer){
        this.engine = engine;
        this.renderer = renderer;
    }

    Create(){

    }
    
    Update(timestep){

    }

    Destroy(){
        
    }

    AddGraphic(graphic){
        this.graphics.push(graphic);
    }

    AddSObject(sobject){
        this.sobjects.push(sobject);
    }


}