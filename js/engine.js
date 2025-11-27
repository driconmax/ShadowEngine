class Engine {
    /**
     *
     */
    constructor(canvas, framerate, updaterate = 30, rendererOptions = {}) {        
        this.canvas = canvas;
        this.framerate = Math.max(1, framerate);
        this.renderer = new Renderer(this.canvas, this.framerate, 3, rendererOptions);
        this.colliderSystem = new ColliderSystem(this);
        this.physics = {
            gravity: new Vector3(0, -9.81, 0)
        };
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

        this.updaterate = Math.max(1, updaterate);

        
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
        //scriptInstance.ctx = this.renderer.getContext(); // Pass the rendering context
        this.scripts.push(scriptInstance);
        if (typeof scriptInstance.Create === 'function') {
            scriptInstance.SetDefaults(this, this.renderer);
            scriptInstance.Create();
        }
    }

    loadOBJ(url) {
        return new Promise((resolve, reject) => {
            fetch(url).then((response) => {
                if (!response.ok) {
                    reject(`Failed to load OBJ file: ${response.statusText}`);
                }
                response.text().then((text) => {
                    resolve(text);
                })
            })
        });
    }
    
    resizeCanvasIfNeeded() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }

    mainDraw() {
        this.resizeCanvasIfNeeded();

        const meshes = [];
        this.scripts.forEach(script => {
            script.sobjects.forEach(obj => {
                meshes.push(...obj.meshes);
            });
            meshes.push(...script.meshes);
        });

        const now = Date.now();
        const delta = (now - this.lastDrawInterval) / 1000;

        this.renderer.UpdateMeshes(meshes);
        this.renderer.Draw(delta);

        this.lastDrawInterval = now;
    }

    _updateTransforms() {
        this.scripts.forEach(script => {
            script.sobjects.forEach(obj => {
                obj.worldMatrix = obj.computeMatrix();
                obj.meshes.forEach(mesh => {
                    mesh.transformationMatrix = obj.worldMatrix;
                });
            });
        });
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
        var delta = (now - this.lastUpdateInterval) / 1000;
        delta = Math.min(delta, 0.05); // avoid spiral of death

        this.scripts.forEach(script => {
            script.Update(delta);
        });

        this._stepPhysics(delta);
        this._updateTransforms();

        if (this.colliderSystem) {
            this.colliderSystem.step(delta);
        }

        this.lastUpdateInterval = now;
        this.mouse.wheelDelta = 0;
    }

    _collectSObjects() {
        const results = [];
        for (let i = 0; i < this.scripts.length; i += 1) {
            const script = this.scripts[i];
            if (!script || !Array.isArray(script.sobjects)) {
                continue;
            }
            for (let j = 0; j < script.sobjects.length; j += 1) {
                const sobject = script.sobjects[j];
                if (sobject) {
                    results.push(sobject);
                }
            }
        }
        return results;
    }

    _stepPhysics(delta) {
        if (!this.physics) {
            return;
        }
        const objects = this._collectSObjects();
        const gravity = this.physics.gravity || Vector3.Zero();
        for (let i = 0; i < objects.length; i += 1) {
            const obj = objects[i];
            if (obj && typeof obj.PhysicsStep === "function") {
                obj.PhysicsStep(delta, gravity);
            }
        }
    }
}