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
        }

        this.updaterate = Math.min(1, updaterate);
        this.updaterate = updaterate;

        
    }

    Start(){

        this.canvas.addEventListener("mousemove", (event) => {
            //console.log(event);
            var rect = this.canvas.getBoundingClientRect();
            var pos = new Vector2(event.clientX - rect.left, event.clientY - rect.top);
            this.mouse.position.x = pos.x;
            this.mouse.position.y = pos.y;
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
            console.log("keyup", event.code);
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
        const graphics = [];

        this.scripts.forEach(script => {
            script.sobjects.forEach(sobject => {
                const sobjectMatrix = sobject.computeMatrix();
                sobject.graphics.forEach(graphic => {
                    graphic.transformationMatrix = sobjectMatrix;
                });
                graphics.push(...sobject.graphics);
            });
            graphics.push(...script.graphics);
        });

        var now = Date.now();

        this.renderer.UpdateGraphics(graphics);
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
    }
}