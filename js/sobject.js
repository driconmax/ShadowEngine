class SObject extends ShadowScript {
    /**
     *
     */
    constructor(position = new Vector3(0, 0, 0), rotation = new Vector3(0, 0, 0), scale = new Vector3(0, 0, 0)) {
        super();
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }
}