var engine;

window.onload = () => {
    var canvas = document.getElementById("canvas");
    engine = new Engine(canvas, 60, 60);

    engine.AddScript("js/scripts/Body1.sdw.js");
    engine.AddScript("js/scripts/Room.sdw.js");
    engine.AddScript("js/scripts/CameraController.sdw.js");
    engine.Start();
}