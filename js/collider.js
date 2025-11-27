let __colliderIdCounter = 0;

function cloneVector3(source = new Vector3(0, 0, 0)) {
    return new Vector3(source.x, source.y, source.z);
}

function addVectors(a, b) {
    return new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function subtractVectors(a, b) {
    return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function multiplyVectorScalar(v, scalar) {
    return new Vector3(v.x * scalar, v.y * scalar, v.z * scalar);
}

function minVector(a, b) {
    return new Vector3(
        Math.min(a.x, b.x),
        Math.min(a.y, b.y),
        Math.min(a.z, b.z)
    );
}

function maxVector(a, b) {
    return new Vector3(
        Math.max(a.x, b.x),
        Math.max(a.y, b.y),
        Math.max(a.z, b.z)
    );
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function clampVector(value, minV, maxV) {
    return new Vector3(
        clamp(value.x, minV.x, maxV.x),
        clamp(value.y, minV.y, maxV.y),
        clamp(value.z, minV.z, maxV.z)
    );
}

function lengthVector(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function normalizeVector(v) {
    const len = lengthVector(v);
    if (len === 0) {
        return new Vector3(0, 0, 0);
    }
    return new Vector3(v.x / len, v.y / len, v.z / len);
}

function dotProduct(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function negateVector(v) {
    return new Vector3(-v.x, -v.y, -v.z);
}

function createRotationMatrixFromEuler(rotation) {
    const rotationX = Matrix.CreateRotationXMatrix(rotation.x);
    const rotationY = Matrix.CreateRotationYMatrix(rotation.y);
    const rotationZ = Matrix.CreateRotationZMatrix(rotation.z);
    return Matrix.Multiply(rotationZ, Matrix.Multiply(rotationY, rotationX));
}

function transformDirection(matrix, direction) {
    return new Vector3(
        matrix[0][0] * direction.x + matrix[0][1] * direction.y + matrix[0][2] * direction.z,
        matrix[1][0] * direction.x + matrix[1][1] * direction.y + matrix[1][2] * direction.z,
        matrix[2][0] * direction.x + matrix[2][1] * direction.y + matrix[2][2] * direction.z
    );
}

class Collider {
    constructor(type, options = {}) {
        this.id = `col_${__colliderIdCounter += 1}`;
        this.type = type;
        this.isTrigger = !!options.isTrigger;
        this.enabled = options.enabled !== false;
        this.owner = null;
        this._system = null;
    }

    attach(owner) {
        this.owner = owner;
    }

    detach() {
        this.owner = null;
    }

    updateWorld(matrix, owner) {
        return null;
    }
}

class SphereCollider extends Collider {
    constructor(radius = 1, options = {}) {
        super("sphere", options);
        this.radius = radius;
        this.center = options.center ? cloneVector3(options.center) : new Vector3(0, 0, 0);
        this.worldCenter = cloneVector3(this.center);
        this.worldRadius = this.radius;
    }

    updateWorld(matrix, owner) {
        this.worldCenter = Matrix.TransformPoint(matrix, this.center);
        const scale = owner && owner.scale ? owner.scale : new Vector3(1, 1, 1);
        const maxScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
        this.worldRadius = this.radius * maxScale;
    }
}

class BoxCollider extends Collider {
    constructor(size = new Vector3(1, 1, 1), options = {}) {
        super("box", options);
        this.size = size instanceof Vector3 ? cloneVector3(size) : new Vector3(size, size, size);
        this.center = options.center ? cloneVector3(options.center) : new Vector3(0, 0, 0);
        this.worldMin = new Vector3();
        this.worldMax = new Vector3();
        this.worldCenter = new Vector3();
    }

    updateWorld(matrix) {
        const half = multiplyVectorScalar(this.size, 0.5);
        const localCenter = this.center;
        const offsets = [
            new Vector3(-half.x, -half.y, -half.z),
            new Vector3(half.x, -half.y, -half.z),
            new Vector3(-half.x, half.y, -half.z),
            new Vector3(half.x, half.y, -half.z),
            new Vector3(-half.x, -half.y, half.z),
            new Vector3(half.x, -half.y, half.z),
            new Vector3(-half.x, half.y, half.z),
            new Vector3(half.x, half.y, half.z),
        ];

        let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

        for (let i = 0; i < offsets.length; i += 1) {
            const offset = offsets[i];
            const cornerLocal = addVectors(localCenter, offset);
            const cornerWorld = Matrix.TransformPoint(matrix, cornerLocal);
            min = minVector(min, cornerWorld);
            max = maxVector(max, cornerWorld);
        }

        this.worldMin = min;
        this.worldMax = max;
        this.worldCenter = multiplyVectorScalar(addVectors(this.worldMin, this.worldMax), 0.5);
    }
}

class PlaneCollider extends Collider {
    constructor(normal = new Vector3(0, 1, 0), options = {}) {
        super("plane", options);
        this.normal = normalizeVector(normal);
        this.localPoint = options.point ? cloneVector3(options.point) : new Vector3(0, 0, 0);
        this.worldNormal = cloneVector3(this.normal);
        this.worldPoint = cloneVector3(this.localPoint);
        this.worldConstant = 0;
    }

    updateWorld(matrix, owner) {
        const rotation = owner && owner.rotation ? owner.rotation : new Vector3(0, 0, 0);
        const rotationMatrix = createRotationMatrixFromEuler(rotation);
        const rotatedNormal = normalizeVector(transformDirection(rotationMatrix, this.normal));
        const pointWorld = Matrix.TransformPoint(matrix, this.localPoint);
        this.worldNormal = rotatedNormal;
        this.worldPoint = pointWorld;
        this.worldConstant = dotProduct(this.worldNormal, this.worldPoint);
    }
}

class MeshCollider extends BoxCollider {
    constructor(mesh, options = {}) {
        const bounds = MeshCollider._calculateLocalBounds(mesh);
        const size = bounds ? subtractVectors(bounds.max, bounds.min) : new Vector3(1, 1, 1);
        const center = bounds ? multiplyVectorScalar(addVectors(bounds.min, bounds.max), 0.5) : new Vector3(0, 0, 0);
        const opts = Object.assign({}, options, { center });
        super(size, opts);
        this.type = "mesh";
        this.mesh = mesh || null;
        this.localBounds = bounds;
    }

    static _calculateLocalBounds(mesh) {
        if (!mesh || !mesh.vertices || mesh.vertices.length === 0) {
            return null;
        }
        let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        for (let i = 0; i < mesh.vertices.length; i += 1) {
            const v = mesh.vertices[i];
            min = minVector(min, v);
            max = maxVector(max, v);
        }
        return { min, max };
    }

    setMesh(mesh) {
        this.mesh = mesh;
        this.localBounds = MeshCollider._calculateLocalBounds(mesh);
        if (this.localBounds) {
            this.size = subtractVectors(this.localBounds.max, this.localBounds.min);
            this.center = multiplyVectorScalar(addVectors(this.localBounds.min, this.localBounds.max), 0.5);
        }
    }

    updateWorld(matrix, owner) {
        if (this.mesh && (!this.localBounds || this.mesh._colliderDirty)) {
            this.localBounds = MeshCollider._calculateLocalBounds(this.mesh);
            if (this.localBounds) {
                this.size = subtractVectors(this.localBounds.max, this.localBounds.min);
                this.center = multiplyVectorScalar(addVectors(this.localBounds.min, this.localBounds.max), 0.5);
            }
            this.mesh._colliderDirty = false;
        }
        super.updateWorld(matrix, owner);
    }
}

class ColliderSystem {
    constructor(engine) {
        this.engine = engine;
        this.colliders = new Set();
        this.activePairs = new Map();
    }

    registerCollider(collider) {
        if (!collider) {
            return;
        }
        this.colliders.add(collider);
        collider._system = this;
    }

    unregisterCollider(collider) {
        if (!collider) {
            return;
        }
        this.colliders.delete(collider);
        if (collider._system === this) {
            collider._system = null;
        }
        const keysToRemove = [];
        this.activePairs.forEach((value, key) => {
            if (value && (value.colliderA === collider || value.colliderB === collider)) {
                keysToRemove.push(key);
            }
        });
        for (let i = 0; i < keysToRemove.length; i += 1) {
            const key = keysToRemove[i];
            const collision = this.activePairs.get(key);
            if (collision) {
                this.emitCollision(collision, "exit");
            }
            this.activePairs.delete(key);
        }
    }

    step(deltaTime) {
        const colliders = Array.from(this.colliders).filter(collider => collider.enabled && collider.owner);
        const matrices = new Map();
        for (let i = 0; i < colliders.length; i += 1) {
            const collider = colliders[i];
            const owner = collider.owner;
            if (!matrices.has(owner)) {
                matrices.set(owner, owner.computeMatrix());
            }
            const matrix = matrices.get(owner);
            collider.updateWorld(matrix, owner);
        }

        const newPairs = new Map();
        for (let i = 0; i < colliders.length; i += 1) {
            for (let j = i + 1; j < colliders.length; j += 1) {
                const a = colliders[i];
                const b = colliders[j];
                if (!a.owner || !b.owner) {
                    continue;
                }
                if (a.owner === b.owner) {
                    continue;
                }
                const collision = this.testPair(a, b);
                if (!collision) {
                    continue;
                }
                const key = this.makePairKey(a, b);
                newPairs.set(key, collision);
                const previous = this.activePairs.get(key);
                if (previous) {
                    this.emitCollision(collision, "stay");
                } else {
                    this.emitCollision(collision, "enter");
                }
            }
        }

        const exits = [];
        this.activePairs.forEach((collision, key) => {
            if (!newPairs.has(key)) {
                exits.push({ collision, key });
            }
        });
        for (let i = 0; i < exits.length; i += 1) {
            this.emitCollision(exits[i].collision, "exit");
            this.activePairs.delete(exits[i].key);
        }

        this.activePairs = newPairs;
        this.deltaTime = deltaTime;
    }

    makePairKey(a, b) {
        return a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    }

    emitCollision(collision, phase) {
        const aOwner = collision.colliderA.owner;
        const bOwner = collision.colliderB.owner;
        if (!aOwner || !bOwner) {
            return;
        }
        const normalAB = collision.normal;
        const normalBA = negateVector(normalAB);
        const infoA = Object.assign({}, collision, {
            self: aOwner,
            other: bOwner,
            otherCollider: collision.colliderB,
            normal: normalAB,
            phase
        });
        const infoB = Object.assign({}, collision, {
            self: bOwner,
            other: aOwner,
            otherCollider: collision.colliderA,
            normal: normalBA,
            phase
        });
        if (phase === "enter" || phase === "stay") {
            this.resolveCollision(infoA, infoB, phase);
        }
        this.invokeCollisionCallbacks(aOwner, infoA);
        this.invokeCollisionCallbacks(bOwner, infoB);
    }

    resolveCollision(infoA, infoB, phase) {
        if (!infoA || !infoB) {
            return;
        }
        const a = infoA.self;
        const b = infoB.self;
        if (!a || !b) {
            return;
        }

        const invMassA = (a.physicsEnabled && !a.isKinematic) ? a.invMass : 0;
        const invMassB = (b.physicsEnabled && !b.isKinematic) ? b.invMass : 0;
        const totalInvMass = invMassA + invMassB;
        const penetration = infoA.penetration !== undefined ? infoA.penetration : 0;

        if (penetration > 0 && totalInvMass > 0) {
            const correction = Math.max(0, penetration - 0.0001);
            if (correction > 0) {
                const moveA = invMassA > 0 ? correction * (invMassA / totalInvMass) : 0;
                const moveB = invMassB > 0 ? correction * (invMassB / totalInvMass) : 0;
                if (moveA > 0) {
                    const offsetA = multiplyVectorScalar(infoA.normal, moveA);
                    if (typeof a.position.set === "function") {
                        a.position.set(a.position.x + offsetA.x, a.position.y + offsetA.y, a.position.z + offsetA.z);
                    } else {
                        a.position = addVectors(a.position, offsetA);
                    }
                }
                if (moveB > 0) {
                    const offsetB = multiplyVectorScalar(infoB.normal, moveB);
                    if (typeof b.position.set === "function") {
                        b.position.set(b.position.x + offsetB.x, b.position.y + offsetB.y, b.position.z + offsetB.z);
                    } else {
                        b.position = addVectors(b.position, offsetB);
                    }
                }
            }
        }

        if (totalInvMass === 0) {
            return;
        }

        const velocityA = a.velocity || new Vector3(0, 0, 0);
        const velocityB = b.velocity || new Vector3(0, 0, 0);
        const relativeVelocity = subtractVectors(velocityA, velocityB);
        const separatingVelocity = dotProduct(relativeVelocity, infoA.normal);

        if (separatingVelocity >= 0) {
            return;
        }

        const restitutionA = a.restitution !== undefined ? a.restitution : 0;
        const restitutionB = b.restitution !== undefined ? b.restitution : 0;
        const restitution = Math.max(0, Math.min(restitutionA, restitutionB));
        const impulseMagnitude = -(1 + restitution) * separatingVelocity / totalInvMass;
        const impulse = multiplyVectorScalar(infoA.normal, impulseMagnitude);

        if (invMassA > 0) {
            const deltaVA = multiplyVectorScalar(impulse, invMassA);
            if (a.velocity && typeof a.velocity.set === "function") {
                a.velocity.set(a.velocity.x + deltaVA.x, a.velocity.y + deltaVA.y, a.velocity.z + deltaVA.z);
            } else {
                a.velocity = addVectors(velocityA, deltaVA);
            }
        }
        if (invMassB > 0) {
            const deltaVB = multiplyVectorScalar(impulse, invMassB);
            if (b.velocity && typeof b.velocity.set === "function") {
                b.velocity.set(b.velocity.x - deltaVB.x, b.velocity.y - deltaVB.y, b.velocity.z - deltaVB.z);
            } else {
                b.velocity = subtractVectors(velocityB, deltaVB);
            }
        }
    }

    invokeCollisionCallbacks(target, info) {
        const methodName = phaseMethodName(info.phase);
        if (typeof target[methodName] === "function") {
            target[methodName](info);
        } else if (typeof target.OnCollision === "function") {
            target.OnCollision(info);
        }
        if (target.parentScript) {
            const script = target.parentScript;
            if (typeof script[methodName] === "function") {
                script[methodName](info);
            } else if (typeof script.OnCollision === "function") {
                script.OnCollision(info);
            }
        }
    }

    testPair(a, b) {
        if (a.isTrigger && b.isTrigger) {
            return null;
        }
        if (a.type === "sphere") {
            if (b.type === "sphere") {
                return this.intersectSphereSphere(a, b);
            } else if (b.type === "box" || b.type === "mesh") {
                return this.intersectSphereAABB(a, b);
            } else if (b.type === "plane") {
                return this.intersectSpherePlane(a, b);
            }
        } else if (a.type === "box" || a.type === "mesh") {
            if (b.type === "sphere") {
                const result = this.intersectSphereAABB(b, a);
                if (!result) {
                    return null;
                }
                return Object.assign(result, {
                    colliderA: a,
                    colliderB: b,
                    normal: negateVector(result.normal)
                });
            } else if (b.type === "box" || b.type === "mesh") {
                return this.intersectAABBAABB(a, b);
            } else if (b.type === "plane") {
                return this.intersectAABBPlane(a, b);
            }
        } else if (a.type === "plane") {
            if (b.type === "sphere") {
                const result = this.intersectSpherePlane(b, a);
                if (!result) {
                    return null;
                }
                return Object.assign(result, {
                    colliderA: a,
                    colliderB: b,
                    normal: negateVector(result.normal)
                });
            } else if (b.type === "box" || b.type === "mesh") {
                const result = this.intersectAABBPlane(b, a);
                if (!result) {
                    return null;
                }
                return Object.assign(result, {
                    colliderA: a,
                    colliderB: b,
                    normal: negateVector(result.normal)
                });
            }
        }
        return null;
    }

    intersectSphereSphere(a, b) {
        const delta = subtractVectors(b.worldCenter, a.worldCenter);
        const distance = lengthVector(delta);
        const radiusSum = a.worldRadius + b.worldRadius;
        if (distance >= radiusSum) {
            return null;
        }
        const normal = distance > 0 ? multiplyVectorScalar(delta, 1 / distance) : new Vector3(0, 1, 0);
        const penetration = radiusSum - distance;
        const contactPoint = addVectors(a.worldCenter, multiplyVectorScalar(normal, a.worldRadius - penetration * 0.5));
        return {
            colliderA: a,
            colliderB: b,
            normal,
            penetration,
            point: contactPoint
        };
    }

    intersectSphereAABB(sphere, box) {
        const closest = clampVector(sphere.worldCenter, box.worldMin, box.worldMax);
        const delta = subtractVectors(closest, sphere.worldCenter);
        const distanceSq = dotProduct(delta, delta);
        const radiusSq = sphere.worldRadius * sphere.worldRadius;
        if (distanceSq > radiusSq) {
            return null;
        }
        const distance = Math.sqrt(distanceSq);
        const normal = distance > 0 ? multiplyVectorScalar(delta, -1 / distance) : new Vector3(0, 1, 0);
        const penetration = sphere.worldRadius - distance;
        const contactPoint = closest;
        return {
            colliderA: sphere,
            colliderB: box,
            normal,
            penetration,
            point: contactPoint
        };
    }

    intersectSpherePlane(sphere, plane) {
        const distance = dotProduct(plane.worldNormal, sphere.worldCenter) - plane.worldConstant;
        const absDistance = Math.abs(distance);
        if (absDistance > sphere.worldRadius) {
            return null;
        }
        const normal = distance >= 0 ? plane.worldNormal : negateVector(plane.worldNormal);
        const penetration = sphere.worldRadius - absDistance;
        const contactPoint = subtractVectors(sphere.worldCenter, multiplyVectorScalar(plane.worldNormal, distance));
        return {
            colliderA: sphere,
            colliderB: plane,
            normal,
            penetration,
            point: contactPoint
        };
    }

    intersectAABBAABB(a, b) {
        const overlapX = Math.min(a.worldMax.x, b.worldMax.x) - Math.max(a.worldMin.x, b.worldMin.x);
        if (overlapX <= 0) {
            return null;
        }
        const overlapY = Math.min(a.worldMax.y, b.worldMax.y) - Math.max(a.worldMin.y, b.worldMin.y);
        if (overlapY <= 0) {
            return null;
        }
        const overlapZ = Math.min(a.worldMax.z, b.worldMax.z) - Math.max(a.worldMin.z, b.worldMin.z);
        if (overlapZ <= 0) {
            return null;
        }
        let penetration = overlapX;
        let normal = new Vector3(overlapX > 0 ? (a.worldCenter.x < b.worldCenter.x ? -1 : 1) : 0, 0, 0);
        if (overlapY < penetration) {
            penetration = overlapY;
            normal = new Vector3(0, a.worldCenter.y < b.worldCenter.y ? -1 : 1, 0);
        }
        if (overlapZ < penetration) {
            penetration = overlapZ;
            normal = new Vector3(0, 0, a.worldCenter.z < b.worldCenter.z ? -1 : 1);
        }
        const contactPoint = multiplyVectorScalar(addVectors(a.worldCenter, b.worldCenter), 0.5);
        return {
            colliderA: a,
            colliderB: b,
            normal,
            penetration,
            point: contactPoint
        };
    }

    intersectAABBPlane(box, plane) {
        const center = box.worldCenter;
        const extents = multiplyVectorScalar(subtractVectors(box.worldMax, box.worldMin), 0.5);
        const distance = dotProduct(plane.worldNormal, center) - plane.worldConstant;
        const projectedRadius = Math.abs(extents.x * plane.worldNormal.x) + Math.abs(extents.y * plane.worldNormal.y) + Math.abs(extents.z * plane.worldNormal.z);
        if (Math.abs(distance) > projectedRadius) {
            return null;
        }
        const normal = distance >= 0 ? plane.worldNormal : negateVector(plane.worldNormal);
        const penetration = projectedRadius - Math.abs(distance);
        const contactPoint = subtractVectors(center, multiplyVectorScalar(plane.worldNormal, distance));
        return {
            colliderA: box,
            colliderB: plane,
            normal,
            penetration,
            point: contactPoint
        };
    }
}

function phaseMethodName(phase) {
    switch (phase) {
        case "enter":
            return "OnCollisionEnter";
        case "stay":
            return "OnCollisionStay";
        case "exit":
            return "OnCollisionExit";
        default:
            return "OnCollision";
    }
}
