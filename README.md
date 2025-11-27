# Shadow Engine

A lightweight, browser-based 3D engine, built from scratch in JavaScript. **Shadow Engine** was created as an educational stepping stone—designed to be fully readable, modifiable, and free from dependencies, all the while capturing the essence of how real-time rendering engines work.

---

##  Why Shadow Engine?

- **Readable & Accessible**  
  No installations or heavy libraries. Just open it in your browser to explore how meshes, transforms, shaders, and logic come together to render a 3D scene.

- **From Scratch**  
  Every part of the rendering pipeline—math, object management, camera, script execution—is built from zero. No Three.js or other frameworks.

- **Stepping Stone**  
  A bridge from theory to practice, preparing the ground for my upcoming C++ engine by grounding the fundamentals in code you can actually read and tweak.
  
---

##  Features

- **Custom Math Library**  
  Vectors, matrices, quaternions, and interpolation—for precise control over transformations.

- **Rendering Pipeline**  
  World → View → Projection matrix chain, backface culling, depth sorting, and triangle-by-triangle lighting.

- **Geometry Support**  
  Procedural primitives (circles, squares) and `.OBJ` file loading to support both experimentation and model imports.

- **Script API (ShadowScript)**  
  Hook into `Create()`, `Update()`, and `Destroy()` to control logic, behavior, and animations.

- **Dynamic Lighting**  
  Per-triangle diffuse shading with customizable light color and intensity.

- **Interactive Input**  
  WASD + mouse look + wheel zoom, with optional pointer lock integration.

- **Runs in the Browser**  
  Nothing to build—just open `index.html` (or the live demo) and play.

---

##  Try It Live

Check out a playable demo at the bottom of the [project page on my website](https://driconmax.com/project/shadow-engine/).  
(Pointers: Use WASD to move, mouse to look, and scroll to zoom.)

---

##  Example Scripts

Explore these in the `/scripts` folder:

| Script | What it Does |
|--------|--------------|
| `Body1.sdw.js` | Animated rotating shapes with procedural lighting. |
| `CameraController.sdw.js` | Fly-through controls—WASD + mouse look + zoom. |
| `Suzanne.sdw.js` | Import and render Blender’s Suzanne monkey via OBJ data. |
| `Room.sdw.js`, `House.sdw.js` | Example scenes with primitive geometry layout. |

---

##  Getting Started (Local)

1. Clone the repository  
   ```bash
   git clone https://github.com/driconmax/ShadowEngine.git
