class ShadowScript {
    /**
     *
     */
    constructor() {
        this.graphics = [];
        this.sobjects = [];
        this.engine;
    }

    Load(){

    }

    Create(engine){
        this.engine = engine;
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