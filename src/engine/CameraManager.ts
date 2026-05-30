import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

import type { ModelBounds } from "../inspection/BoundingBoxAnalyzer";
import { fitCameraToModel } from "../utils/fitCameraToModel";

export class CameraManager {
  readonly camera: ArcRotateCamera;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.camera = new ArcRotateCamera(
      "inspection-camera",
      Math.PI / 4,
      Math.PI / 3,
      10,
      Vector3.Zero(),
      scene,
    );

    this.camera.setPosition(new Vector3(6, 5, 6));
    this.camera.attachControl(canvas, true);
    this.camera.minZ = 0.01;
    this.camera.lowerRadiusLimit = 1;
    this.camera.upperRadiusLimit = 100;
    this.camera.wheelDeltaPercentage = 0.01;
    this.camera.panningSensibility = 120;
    this.camera.useBouncingBehavior = true;
    this.camera.storeState();
  }

  frameModel(bounds: ModelBounds): void {
    fitCameraToModel(this.camera, bounds);
  }

  resetToStoredFrame(): void {
    this.camera.restoreState();
  }
}
