import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";

import { CameraManager } from "./CameraManager";
import { HelperManager } from "./HelperManager";
import { LightingManager } from "./LightingManager";

export class SceneManager {
  readonly scene: Scene;
  readonly cameraManager: CameraManager;
  readonly helperManager: HelperManager;
  readonly modelRoot: TransformNode;

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.scene = new Scene(engine);
    this.scene.clearColor = new Color4(0.08, 0.09, 0.11, 1);

    this.modelRoot = new TransformNode("model-root", this.scene);
    this.cameraManager = new CameraManager(this.scene, canvas);
    new LightingManager(this.scene);
    this.helperManager = new HelperManager(this.scene);
  }
}
