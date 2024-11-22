class SObject extends ShadowScript {
    /**
     *
     */
    constructor(position = new Vector3(0, 0, 0), rotation = new Vector3(0, 0, 0), scale = new Vector3(1, 1, 1)) {
        super();
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;

        this.transformationMatrix = this.computeMatrix();
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
        const translation = Matrix.CreateTranslationMatrix(-this.position.x, -this.position.y, -this.position.z);
        const rotationX = Matrix.CreateRotationXMatrix(-this.rotation.x);
        const rotationY = Matrix.CreateRotationYMatrix(-this.rotation.y);
        const rotationZ = Matrix.CreateRotationZMatrix(-this.rotation.z);
    
        // Combine inverse transformations (reverse order for inverse)
        return Matrix.Multiply(rotationX, Matrix.Multiply(rotationY, Matrix.Multiply(rotationZ, translation)));
    }
}