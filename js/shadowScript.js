class ShadowScript {
    /**
     *
     */
    constructor() {
        this.meshs = [];
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

    AddMesh(mesh){
        this.meshs.push(mesh);
    }

    AddSObject(sobject){
        this.sobjects.push(sobject);
    }


}