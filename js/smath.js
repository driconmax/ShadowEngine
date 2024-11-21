class Vector2 {
    /**
     *
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Vector3 {
    /**
     *
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Vector4 {
    /**
     *
     */
    constructor(x = 0, y = 0, z = 0, w = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

class Quaternion extends Vector4 {
    /**
     *
     */
    constructor(x = 0, y = 0, z = 0, w = 0) {
        super(x, y, z, w);
    }

    static GetQuaternion(vector3){
        return new Quaternion();
    }
}