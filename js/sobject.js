class SObject extends ShadowScript {
    /**
     *
     */
    constructor(position = new Vector3(0, 0, 0), rotation = new Vector3(0, 0, 0), scale = new Vector3(1, 1, 1)) {
        super();
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.collider = null;
        this.parentScript = null;
        this.physicsEnabled = false;
        this.useGravity = false;
        this.gravityScale = 1;
        this.isKinematic = false;
        this.mass = 1;
        this.invMass = 1;
        this.restitution = 0.1;
        this.linearDamping = 0;
        this.velocity = Vector3.Zero();
        this.accumulatedForce = Vector3.Zero();

        this.transformationMatrix = this.computeMatrix();
    }

    SetDefaults(engine, renderer) {
        super.SetDefaults(engine, renderer);
        if (this.collider) {
            this.collider.attach(this);
            if (engine && engine.colliderSystem) {
                engine.colliderSystem.registerCollider(this.collider);
            }
        }
    }

    computeMatrix() {
        const translation = Matrix.CreateTranslationMatrix(this.position.x, this.position.y, this.position.z);
        const rotationX = Matrix.CreateRotationXMatrix(this.rotation.x);
        const rotationY = Matrix.CreateRotationYMatrix(this.rotation.y);
        const rotationZ = Matrix.CreateRotationZMatrix(this.rotation.z);
        const scale = Matrix.CreateScaleMatrix(this.scale.x, this.scale.y, this.scale.z);

        // Combine transformations
        return Matrix.Multiply(translation, Matrix.Multiply(rotationZ, Matrix.Multiply(rotationY, Matrix.Multiply(rotationX, scale))));
    }
    
    computeInverseMatrix() {
        const rotationX = Matrix.CreateRotationXMatrix(this.rotation.x);
        const rotationY = Matrix.CreateRotationYMatrix(this.rotation.y);
        const rotationZ = Matrix.CreateRotationZMatrix(this.rotation.z);
    
        const rotation = Matrix.Multiply(rotationZ, Matrix.Multiply(rotationY, rotationX));
        const translation = Matrix.CreateTranslationMatrix(-this.position.x, -this.position.y, -this.position.z);
    
        // First rotate, then translate
        return Matrix.Multiply(rotation, translation);
    }

    SetCollider(collider) {
        if (this.collider === collider) {
            return this.collider;
        }
        if (this.collider && this.engine && this.engine.colliderSystem) {
            this.engine.colliderSystem.unregisterCollider(this.collider);
        }
        if (this.collider) {
            this.collider.detach();
        }
        this.collider = collider || null;
        if (this.collider) {
            this.collider.attach(this);
            if (this.engine && this.engine.colliderSystem) {
                this.engine.colliderSystem.registerCollider(this.collider);
            }
        }
        return this.collider;
    }

    RemoveCollider() {
        this.SetCollider(null);
    }

    Destroy() {
        if (this.collider && this.engine && this.engine.colliderSystem) {
            this.engine.colliderSystem.unregisterCollider(this.collider);
        }
        if (this.collider) {
            this.collider.detach();
            this.collider = null;
        }
        this.DisablePhysics();
        super.Destroy();
    }

    EnablePhysics(options = {}) {
        this.physicsEnabled = true;
        if (options.mass !== undefined) {
            this.mass = Math.max(0.0001, options.mass);
        }
        this.isKinematic = !!options.isKinematic;
        this.useGravity = options.useGravity !== undefined ? !!options.useGravity : this.useGravity;
        this.gravityScale = options.gravityScale !== undefined ? options.gravityScale : this.gravityScale;
        this.restitution = options.restitution !== undefined ? Math.max(0, options.restitution) : this.restitution;
        this.linearDamping = options.linearDamping !== undefined ? Math.max(0, options.linearDamping) : this.linearDamping;
        this.invMass = this.isKinematic ? 0 : 1 / this.mass;
        if (this.isKinematic && this.velocity) {
            this.velocity.set(0, 0, 0);
        }
        if (!this.velocity) {
            this.velocity = Vector3.Zero();
        }
        if (!this.accumulatedForce) {
            this.accumulatedForce = Vector3.Zero();
        } else {
            this.accumulatedForce.set(0, 0, 0);
        }
        return this;
    }

    DisablePhysics() {
        this.physicsEnabled = false;
        this.isKinematic = false;
        this.useGravity = false;
        this.gravityScale = 1;
        this.mass = 1;
        this.invMass = 1;
        if (this.velocity) {
            this.velocity.set(0, 0, 0);
        } else {
            this.velocity = Vector3.Zero();
        }
        if (this.accumulatedForce) {
            this.accumulatedForce.set(0, 0, 0);
        } else {
            this.accumulatedForce = Vector3.Zero();
        }
    }

    ApplyForce(force) {
        if (!this.physicsEnabled || !force) {
            return;
        }
        if (this.accumulatedForce && typeof this.accumulatedForce.set === "function") {
            this.accumulatedForce.set(
                this.accumulatedForce.x + force.x,
                this.accumulatedForce.y + force.y,
                this.accumulatedForce.z + force.z
            );
        } else {
            this.accumulatedForce = Vector3.Add(Vector3.Zero(), force);
        }
    }

    ApplyImpulse(impulse) {
        if (!this.physicsEnabled || this.isKinematic || !impulse) {
            return;
        }
        const deltaV = Vector3.Scale(impulse, this.invMass);
        if (this.velocity && typeof this.velocity.set === "function") {
            this.velocity.set(
                this.velocity.x + deltaV.x,
                this.velocity.y + deltaV.y,
                this.velocity.z + deltaV.z
            );
        } else {
            this.velocity = Vector3.Add(Vector3.Zero(), deltaV);
        }
    }

    SetVelocity(velocity) {
        if (!velocity) {
            return;
        }
        if (!this.velocity) {
            this.velocity = velocity.clone();
        } else {
            this.velocity.set(velocity.x, velocity.y, velocity.z);
        }
    }

    PhysicsStep(delta, gravity) {
        if (!this.physicsEnabled || this.isKinematic) {
            if (this.accumulatedForce) {
                this.accumulatedForce.set(0, 0, 0);
            }
            return;
        }
        const gravityAccel = this.useGravity && gravity ? Vector3.Scale(gravity, this.gravityScale) : Vector3.Zero();
        const forceAccel = Vector3.Scale(this.accumulatedForce, this.invMass);
        const totalAccel = Vector3.Add(forceAccel, gravityAccel);
        const velocityDelta = Vector3.Scale(totalAccel, delta);
        if (this.velocity && typeof this.velocity.set === "function") {
            this.velocity.set(
                this.velocity.x + velocityDelta.x,
                this.velocity.y + velocityDelta.y,
                this.velocity.z + velocityDelta.z
            );
        } else {
            this.velocity = Vector3.Add(Vector3.Zero(), velocityDelta);
        }
        if (this.linearDamping > 0) {
            const dampingFactor = Math.max(0, 1 - this.linearDamping * delta);
            const dampedVelocity = Vector3.Scale(this.velocity, dampingFactor);
            if (this.velocity && typeof this.velocity.set === "function") {
                this.velocity.set(dampedVelocity.x, dampedVelocity.y, dampedVelocity.z);
            } else {
                this.velocity = dampedVelocity;
            }
        }
        const positionDelta = Vector3.Scale(this.velocity, delta);
        if (this.position && typeof this.position.set === "function") {
            this.position.set(
                this.position.x + positionDelta.x,
                this.position.y + positionDelta.y,
                this.position.z + positionDelta.z
            );
        } else {
            this.position = Vector3.Add(this.position, positionDelta);
        }
        if (this.accumulatedForce) {
            this.accumulatedForce.set(0, 0, 0);
        }
    }
    
}