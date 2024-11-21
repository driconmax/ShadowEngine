class ShadowScript {
    /**
     *
     */
    constructor() {
        this.graphics = [];
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


}