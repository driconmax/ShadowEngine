class ShadowScript {
    /**
     *
     */
    constructor() {
        this.meshes = [];
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
        this.meshes.push(mesh);
    }

    AddSObject(sobject){
        this.sobjects.push(sobject);
    }


}