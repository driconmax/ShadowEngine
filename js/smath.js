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

class Matrix {

    static CreateTranslationMatrix = (tx, ty, tz) => {
        return [
            [1, 0, 0, tx],
            [0, 1, 0, ty],
            [0, 0, 1, tz],
            [0, 0, 0, 1]
        ];
    };
    
    static CreateRotationXMatrix = (angle) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [1, 0, 0, 0],
            [0, cos, -sin, 0],
            [0, sin, cos, 0],
            [0, 0, 0, 1]
        ];
    };
    
    static CreateRotationYMatrix = (angle) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [cos, 0, sin, 0],
            [0, 1, 0, 0],
            [-sin, 0, cos, 0],
            [0, 0, 0, 1]
        ];
    };
    
    static CreateRotationZMatrix = (angle) => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [cos, -sin, 0, 0],
            [sin, cos, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
    };
    
    static CreateScaleMatrix = (sx, sy, sz) => {
        return [
            [sx, 0, 0, 0],
            [0, sy, 0, 0],
            [0, 0, sz, 0],
            [0, 0, 0, 1]
        ];
    };

    static Multiply = (a, b) => {
        const result = Array(4).fill().map(() => Array(4).fill(0));
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    };

    static TransformPoint = (matrix, point) => {
        return new Vector3(
            matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2] * point.z + matrix[0][3],
            matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2] * point.z + matrix[1][3],
            matrix[2][0] * point.x + matrix[2][1] * point.y + matrix[2][2] * point.z + matrix[2][3]
        );
    };
}
