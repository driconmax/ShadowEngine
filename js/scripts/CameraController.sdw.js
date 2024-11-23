class CameraController extends ShadowScript {

    /**
     *
     */
    constructor() {
        super();
        this.rotationSpeed = 1;
        this.moveSpeed = 100;
        this.runSpeed = 500;
        this.zoomSpeed = .001;
    }

    Create() {
        
    }

    Update(timestep) {
        const moveDirection = new Vector3(0, 0, 0); // Vector for camera movement

        // Calculate forward and right vectors based on the camera's Y rotation
        const forward = new Vector3(
            Math.sin(this.renderer.camera.rotation.y),
            0,
            -Math.cos(this.renderer.camera.rotation.y)
        );
        
        const right = new Vector3(
            Math.cos(this.renderer.camera.rotation.y),
            0,
            Math.sin(this.renderer.camera.rotation.y)
        );

        // Update movement vector based on input keys
        if (this.engine.onKeyPress["KeyW"]) {
            moveDirection.x += forward.x;
            moveDirection.z += forward.z;
        }
        if (this.engine.onKeyPress["KeyS"]) {
            moveDirection.x -= forward.x;
            moveDirection.z -= forward.z;
        }
        if (this.engine.onKeyPress["KeyA"]) {
            moveDirection.x -= right.x;
            moveDirection.z -= right.z;
        }
        if (this.engine.onKeyPress["KeyD"]) {
            moveDirection.x += right.x;
            moveDirection.z += right.z;
        }

        // Normalize the direction vector to prevent diagonal movement being faster
        const magnitude = Math.sqrt(moveDirection.x ** 2 + moveDirection.z ** 2);
        if (magnitude > 0) {
            moveDirection.x /= magnitude;
            moveDirection.z /= magnitude;
        }

        // Apply movement to the camera's position
        var speed = this.moveSpeed;
        if(this.engine.onKeyPress["ShiftLeft"]){
            speed = this.runSpeed;
        }
        this.renderer.camera.position.x += moveDirection.x * speed * timestep;
        this.renderer.camera.position.z += moveDirection.z * speed * timestep;

        // Handle camera rotation with the mouse (horizontal rotation on Y-axis)
        if (this.engine.mouse && this.engine.mouse.position) {
            this.renderer.camera.rotation.y = SMath.Lerp(
                -Math.PI / 2,
                Math.PI / 2,
                this.engine.mouse.position.x / 1000
            );
        }

        if(this.engine.mouse.wheelDelta != 0){
            this.renderer.fov += this.engine.mouse.wheelDelta * this.zoomSpeed;
        }
    }
}

engine.registerScript(CameraController);