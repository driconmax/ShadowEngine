class Engine {
    /**
     *
     */
    constructor(canvas, framerate, updaterate = 30) {        
        this.canvas = canvas;
        this.renderer = new Renderer(this.canvas, framerate, 3);
        this.objs = [];
        this.scripts = [];
        this.onKeyPressDown = {};
        this.onKeyPress = {};
        this.onKeyPressUp = {};
        this.onKeyPressUpDelete = {};
        this.mouse = {
            position: new Vector2(0, 0),
            velocity: new Vector2(0, 0),
            wheelDelta: 0,
        }

        this.updaterate = Math.min(1, updaterate);
        this.updaterate = updaterate;

        
    }

    Start(){
        
        this.canvas.addEventListener("click", async () => {
            await this.canvas.requestPointerLock({
                unadjustedMovement: true,
            });
        });

        this.canvas.addEventListener("wheel", (event) => {
            this.mouse.wheelDelta = event.deltaY;
        });

        document.addEventListener("mousemove", (event) => {
            this.mouse.position.x += event.movementX;
            this.mouse.position.y += event.movementY;
            //LockStatus: (document.pointerLockElement === this.canvas)
        });

        addEventListener("keydown", (event) => {
            if(this.onKeyPressDown[event.code] || this.onKeyPress[event.code]){
                delete this.onKeyPressDown[event.code];
                this.onKeyPress[event.code] = true;
            } else {
                this.onKeyPressDown[event.code] = true;
                this.onKeyPress[event.code] = true;
            }
        });
        addEventListener("keyup", (event) => {
            delete this.onKeyPress[event.code];
            this.onKeyPressUp[event.code] = true;
        });
        //this.mainUpdate = setInterval();

        this.lastDrawInterval = Date.now();
        this.mainDrawInterval = setInterval(() => this.mainDraw(), 1000/this.framerate);

        this.lastUpdateInterval = Date.now();
        this.mainUpdateInterval = setInterval(() => this.mainUpdate(), 1000 / this.updaterate);
    }

    AddScript(path){
        this.loadScript(path);
    }


    loadScript(path) {
        const script = document.createElement('script');
        script.src = path;
        script.onload = function() {
          console.log('Script loaded successfully!');
        };
        script.onerror = function() {
          console.error('Failed to load the script.');
        };
        document.body.appendChild(script);
    }

    registerScript(scriptClass) {
        const scriptInstance = new scriptClass();
        scriptInstance.ctx = this.ctx; // Pass the canvas context
        this.scripts.push(scriptInstance);
        if (typeof scriptInstance.Create === 'function') {
            scriptInstance.SetDefaults(this, this.renderer);
            scriptInstance.Create();
        }
    }

    mainDraw(){
        const meshes = [];

        this.scripts.forEach(script => {
            script.sobjects.forEach(sobject => {
                const sobjectMatrix = sobject.computeMatrix();
                sobject.meshes.forEach(mesh => {
                    mesh.transformationMatrix = sobjectMatrix;
                });
                meshes.push(...sobject.meshes);
            });
            meshes.push(...script.meshes);
        });

        var now = Date.now();

        this.renderer.UpdateMeshes(meshes);
        this.renderer.Draw((now - this.lastDrawInterval) / 1000);

        this.lastDrawInterval = now;
    }
    
    
    mainUpdate(){
        
        for (const key in this.onKeyPressUpDelete) {
            if (Object.prototype.hasOwnProperty.call(this.onKeyPressUpDelete, key)) {
                const element = this.onKeyPressUpDelete[key];
                delete this.onKeyPressUp[element];
                delete this.onKeyPressUpDelete[element];
            }
        }

        var now = Date.now();

        this.scripts.forEach(script => {
            script.Update((now - this.lastUpdateInterval) / 1000);
        });

        this.lastUpdateInterval = now;
        this.mouse.wheelDelta = 0;
    }
}