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
        if (!sobject) {
            return;
        }
        this.sobjects.push(sobject);
        sobject.parentScript = this;
        if (typeof sobject.SetDefaults === "function") {
            sobject.SetDefaults(this.engine, this.renderer);
        } else {
            sobject.engine = this.engine;
            sobject.renderer = this.renderer;
        }
    }


}