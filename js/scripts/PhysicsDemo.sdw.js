class PhysicsDemo extends ShadowScript {
    Create() {
        const floorExtent = 200;
        const floorHeight = -80;

        this.floor = new SObject(new Vector3(0, floorHeight, 0));
        this.floor.SetCollider(new PlaneCollider(new Vector3(0, 1, 0)));
        const floorVertices = [
            new Vector3(-floorExtent, 0, -floorExtent),
            new Vector3(floorExtent, 0, -floorExtent),
            new Vector3(floorExtent, 0, floorExtent),
            new Vector3(-floorExtent, 0, floorExtent)
        ];
        const floorTriangles = [0, 1, 2, 0, 2, 3];
        const floorMesh = new Mesh(new Vector3(0, 0, 0), floorVertices, floorTriangles);
        floorMesh.SetColor("#2f2f32");
        this.floor.AddMesh(floorMesh);
        this.AddSObject(this.floor);
        this.floor.EnablePhysics({ isKinematic: true, restitution: 0 });

        const ballRadius = 20;
        this.ball = new SObject(new Vector3(0, 120, 0));
        this.ball.SetCollider(new SphereCollider(ballRadius));
        const ballMesh = new Circle(new Vector3(0, 0, 0), 32, ballRadius);
        ballMesh.SetColor("#f28b2c");
        this.ball.AddMesh(ballMesh);
        this.AddSObject(this.ball);
        this.ball.EnablePhysics({ useGravity: true, mass: 1, restitution: 0.2, linearDamping: 0.02 });

        this.ball.OnCollisionStay = function(info) {
            if (info.normal.y > 0.5 && Math.abs(this.velocity.y) < 0.5) {
                this.velocity.set(this.velocity.x, 0, this.velocity.z);
            }
        };
    }

    Update(timestep) {
        if (this.ball && this.ball.position.y < -400) {
            this.ball.position.y = 120;
            this.ball.velocity.set(0, 0, 0);
        }
    }
}

engine.registerScript(PhysicsDemo);
