class Engine {
    /**
     *
     */
    constructor(canvas, framerate, updaterate = 30) {        
        this.renderer = new Renderer(canvas, framerate);
        this.objs = [];
        this.scripts = [];
        this.onKeyPressDown = {};
        this.onKeyPress = {};
        this.onKeyPressUp = {};
        this.onKeyPressUpDelete = {};
        this.updaterate = Math.min(1, updaterate);
        this.updaterate = updaterate;
        
    }

    Start(){

        addEventListener("keydown", (event) => {
            this.onKeyPressDown[event.code] = true;
        });
        addEventListener("press", (event) => {
            delete this.onKeyPressDown[event.code];
            this.onKeyPress[event.code] = true;
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
            scriptInstance.Create(this);
        }
    }

    mainDraw(){
        const graphics = [];

        this.scripts.forEach(script => {
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