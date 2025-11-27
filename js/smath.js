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

class SMath {

    static Lerp( a, b, t ) {
        return a + t * ( b - a);
    }

    static GetTriangleNormal(v0, v1, v2){
        // Calculate triangle normal
        const edge1 = new Vector3(v1.x - v0.x, v1.y - v0.y, v1.z - v0.z);
        const edge2 = new Vector3(v2.x - v0.x, v2.y - v0.y, v2.z - v0.z);
        const normal = new Vector3(
            edge1.y * edge2.z - edge1.z * edge2.y,
            edge1.z * edge2.x - edge1.x * edge2.z,
            edge1.x * edge2.y - edge1.y * edge2.x
        );

        // Normalize the normal vector
        const magnitude = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
        if (magnitude > 0) {
            normal.x /= magnitude;
            normal.y /= magnitude;
            normal.z /= magnitude;
        }

        return normal;
    }

    static GetTriangleCenter(v0, v1, v2){
        return new Vector3(
            (v0.x + v1.x + v2.x)/3,
            (v0.y + v1.y + v2.y)/3,
            (v0.z + v1.z + v2.z)/3
        );
    }

    static GetMagnitude(v){
        return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    }

    static GetDistance(a, b){
        return new Vector3(
            b.x - a.x,
            b.y - a.y,
            b.z - a.z,
        );
    }

    static GetDirection(a, b){
        return this.NormalizeVector(this.GetDistance(a, b));
    }

    static NormalizeVector(v){
        var nV = new Vector3(v.x, v.y, v.z);

        const magnitude = this.GetMagnitude(nV);
        if (magnitude > 0) {
            nV.x /= magnitude;
            nV.y /= magnitude;
            nV.z /= magnitude;
        }

        return nV;
    }

    static Dot(a, b){
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
}

class Color {

    /**
     *
     */
    constructor(r = 255, g = 255, b = 255, a = 0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    fac(){
        return new Color(this.r/255, this.g/255, this.b/255, this.a/255);
    }

    hex(){
        return Color.ColorToHex(this);
    }

    static MultiplyColorsIntensity(hex1, hex2, intensity) {
        
        let c1 = this.HexToColor(hex1);
        let c2 = this.HexToColor(hex2);
        let color = new Color();
    
        // Adjust luminosity based on intensity
        color.r = Math.round(Math.min(255, (c1.fac().r * c2.fac().r * intensity) * 255));
        color.g = Math.round(Math.min(255, (c1.fac().g * c2.fac().g * intensity) * 255));
        color.b = Math.round(Math.min(255, (c1.fac().b * c2.fac().b * intensity) * 255));
    
        // Convert back to hex and pad with 0 if needed
        return this.ColorToHex(color);
    }

    static MultiplyColors(hex1, hex2) {
        
        let c1 = this.HexToColor(hex1);
        let c2 = this.HexToColor(hex2);
        let color = new Color();
    
        // Adjust luminosity based on intensity
        color.r = Math.round(Math.min(255, c1.r * c2.r));
        color.g = Math.round(Math.min(255, c1.g * c2.g));
        color.b = Math.round(Math.min(255, c1.b * c2.b));
    
        // Convert back to hex and pad with 0 if needed
        return this.ColorToHex(color);
    }

    static AdjustColorLuminosity(hex, intensity) {
        let color = this.HexToColor(hex);
    
        // Clamp intensity to ensure valid calculations
        intensity = Math.max(0, intensity); 
    
        // Adjust luminosity based on intensity
        color.r = Math.round(Math.min(255, color.r * intensity));
        color.g = Math.round(Math.min(255, color.g * intensity));
        color.b = Math.round(Math.min(255, color.b * intensity));
        
        return this.ColorToHex(color);
    }

    static GetRandomColor(){
        return new Color(
            Math.floor(Math.random()*255),
            Math.floor(Math.random()*255),
            Math.floor(Math.random()*255),
        );
    }

    static HexToColor(hex){
        // Ensure the hex starts with #
        if (!hex.startsWith("#")) {
            throw new Error("Invalid hex color. Hex color must start with #.");
        }
        
        // Remove the # and parse RGB components
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        return new Color(r,g,b);
    }

    static ColorToHex(color){
        const toHex = (value) => value.toString(16).padStart(2, "0");
        return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
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

    static Combine = (a, b) => {
        const result = [];
        for (let i = 0; i < 3; i++) {
            result[i] = [];
            for (let j = 0; j < 3; j++) {
                result[i][j] = 0;
                for (let k = 0; k < 3; k++) {
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

    static TransformPointDivide = (matrix, point) => {
        const x = matrix[0][0] * point.x + matrix[0][1] * point.y + matrix[0][2] * point.z + matrix[0][3];
        const y = matrix[1][0] * point.x + matrix[1][1] * point.y + matrix[1][2] * point.z + matrix[1][3];
        const z = matrix[2][0] * point.x + matrix[2][1] * point.y + matrix[2][2] * point.z + matrix[2][3];
        const w = matrix[3][0] * point.x + matrix[3][1] * point.y + matrix[3][2] * point.z + matrix[3][3];
        return { x, y, z, w };
    };

    static CreatePerspectiveMatrix = (fov, aspect, near, far) => {
        const f = 1 / Math.tan(fov / 2);
        const rangeInv = 1 / (far - near);
    
        return [
            [f / aspect, 0, 0, 0],
            [0, f, 0, 0],
            [0, 0, -(far + near) * rangeInv, (2 * far * near) * rangeInv],
            [0, 0, -1, 0]
        ];
    };
    
    static MapToScreen(matrix, point, canvas) {
        const transformed = Matrix.TransformPointDivide(matrix, point);
        const w = transformed.w !== 0 ? transformed.w : 1;
        const ndcX = transformed.x / w;
        const ndcY = transformed.y / w;
        return {
            x: (ndcX + 1) * 0.5 * canvas.width,
            y: (ndcY + 1) * 0.5 * canvas.height
        };
    }
}
