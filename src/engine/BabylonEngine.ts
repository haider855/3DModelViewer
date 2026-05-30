import { Engine } from "@babylonjs/core/Engines/engine";

import { SceneManager } from "./SceneManager";

export class BabylonEngine {
  private readonly engine: Engine;
  readonly sceneManager: SceneManager;
  private readonly handleResize = (): void => {
    this.engine.resize();
  };

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: false,
      stencil: true,
    });
    this.sceneManager = new SceneManager(this.engine, canvas);

    this.engine.runRenderLoop(() => {
      this.sceneManager.scene.render();
    });

    window.addEventListener("resize", this.handleResize);
  }

  dispose(): void {
    window.removeEventListener("resize", this.handleResize);
    this.engine.stopRenderLoop();
    this.sceneManager.scene.dispose();
    this.engine.dispose();
  }
}
