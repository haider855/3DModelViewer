import { Color4 } from "@babylonjs/core/Maths/math.color";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";

import { CameraManager } from "./CameraManager";
import { HelperManager } from "./HelperManager";
import { LightingManager } from "./LightingManager";

const DEFAULT_BACKGROUND = new Color4(0.055, 0.055, 0.055, 1);
const NEUTRAL_BACKGROUND = new Color4(0.102, 0.102, 0.102, 1);

export class SceneManager {
  readonly scene: Scene;
  readonly cameraManager: CameraManager;
  readonly helperManager: HelperManager;
  readonly modelRoot: TransformNode;

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this.scene = new Scene(engine);
    this.scene.clearColor = DEFAULT_BACKGROUND.clone();

    this.modelRoot = new TransformNode("model-root", this.scene);
    this.cameraManager = new CameraManager(this.scene, canvas);
    new LightingManager(this.scene);
    this.helperManager = new HelperManager(this.scene);
  }

  setNeutralBackground(isNeutral: boolean): void {
    this.scene.clearColor = (isNeutral ? NEUTRAL_BACKGROUND : DEFAULT_BACKGROUND).clone();
  }

  getNeutralBackground(): boolean {
    return this.scene.clearColor.equals(NEUTRAL_BACKGROUND);
  }
}
