var engine;

window.onload = () => {
    var canvas = document.getElementById("canvas");
    engine = new Engine(canvas, 60, 60);

    engine.AddScript("js/scripts/Body1.js");
    engine.Start();
}