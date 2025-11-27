var engine;

window.onload = () => {
    var canvas = document.getElementById("canvas");
    const params = new URLSearchParams(window.location.search);
    const rendererOptions = {};

    if (canvas.dataset && canvas.dataset.renderBackend) {
        rendererOptions.backend = canvas.dataset.renderBackend;
    } else {
        let backendParam = params.get("renderer");
        if (backendParam === null || backendParam === undefined) {
            backendParam = params.get("backend");
        }
        if (backendParam === null || backendParam === undefined) {
            backendParam = params.get("gpu");
        }

        if (backendParam) {
            const normalized = backendParam.toLowerCase();
            if (normalized === "webgl" || normalized === "gpu" || normalized === "1" || normalized === "true") {
                rendererOptions.backend = "webgl";
            } else if (normalized === "2d" || normalized === "canvas") {
                rendererOptions.backend = "2d";
            }
        }
    }

    const localTexturesParam = params.get("localTextures");
    let skipTextureOnFileProtocol = false;
    if (localTexturesParam) {
        const normalizedLocal = localTexturesParam.toLowerCase();
        skipTextureOnFileProtocol = normalizedLocal === "1" || normalizedLocal === "true" || normalizedLocal === "yes";
    }

    if (typeof window !== "undefined") {
        window.ShadowRunnerConfig = window.ShadowRunnerConfig || {};
        window.ShadowRunnerConfig.skipTextureOnFileProtocol = skipTextureOnFileProtocol;
    }

    engine = new Engine(canvas, 60, 60, rendererOptions);

    engine.AddScript("js/scripts/Body1.sdw.js");
    engine.AddScript("js/scripts/Room.sdw.js");
    engine.AddScript("js/scripts/CameraController.sdw.js");
    engine.AddScript("js/scripts/House.sdw.js");
    engine.AddScript("js/scripts/Suzanne.sdw.js");
    engine.Start();
}