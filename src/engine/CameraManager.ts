import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

import type { ModelBounds } from "../inspection/BoundingBoxAnalyzer";
import { fitCameraToModel, type CameraFrame } from "../utils/fitCameraToModel";
import type { CameraProjectionMode, FixedCameraView } from "./CameraTypes";

const DEFAULT_FRAME: CameraFrame = {
  alpha: Math.PI / 4,
  beta: Math.PI / 3,
  radius: 10,
  target: Vector3.Zero(),
  orthoHalfHeight: 5,
};

const FRONT_VIEW = {
  alpha: Math.PI / 2,
  beta: Math.PI / 2,
};
const SIDE_VIEW = {
  alpha: 0,
  beta: Math.PI / 2,
};
const TOP_VIEW = {
  alpha: Math.PI / 2,
  beta: 0.0001,
};

export class CameraManager {
  readonly camera: ArcRotateCamera;
  private storedFrame: CameraFrame = cloneCameraFrame(DEFAULT_FRAME);
  private projectionMode: CameraProjectionMode = "perspective";

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
    this.storedFrame = this.readCurrentFrame(DEFAULT_FRAME.orthoHalfHeight);
  }

  frameModel(bounds: ModelBounds, sceneRadius?: number): void {
    this.setProjectionMode("perspective");
    this.storedFrame = fitCameraToModel(this.camera, bounds, sceneRadius);
    this.updateOrthographicBounds(this.storedFrame.orthoHalfHeight);
  }

  resetToStoredFrame(): void {
    this.applyFrame(this.storedFrame);
  }

  setProjectionMode(mode: CameraProjectionMode): void {
    this.projectionMode = mode;
    this.camera.mode =
      mode === "perspective" ? Camera.PERSPECTIVE_CAMERA : Camera.ORTHOGRAPHIC_CAMERA;
    this.updateOrthographicBounds(this.storedFrame.orthoHalfHeight);
  }

  getProjectionMode(): CameraProjectionMode {
    return this.projectionMode;
  }

  setFixedView(view: FixedCameraView): void {
    const viewFrame = this.getFixedViewFrame(view);
    this.camera.stopInterpolation();
    this.camera.setTarget(this.camera.getTarget().clone());
    this.camera.alpha = viewFrame.alpha;
    this.camera.beta = viewFrame.beta;
    this.updateOrthographicBounds(this.storedFrame.orthoHalfHeight);
  }

  updateForResize(): void {
    this.updateOrthographicBounds(this.storedFrame.orthoHalfHeight);
  }

  private applyFrame(frame: CameraFrame): void {
    this.camera.stopInterpolation();
    this.camera.setTarget(frame.target.clone());
    this.camera.alpha = frame.alpha;
    this.camera.beta = frame.beta;
    this.camera.radius = frame.radius;
    this.updateOrthographicBounds(frame.orthoHalfHeight);
  }

  private readCurrentFrame(orthoHalfHeight: number): CameraFrame {
    return {
      alpha: this.camera.alpha,
      beta: this.camera.beta,
      radius: this.camera.radius,
      target: this.camera.getTarget().clone(),
      orthoHalfHeight,
    };
  }

  private updateOrthographicBounds(orthoHalfHeight: number): void {
    const engine = this.camera.getEngine();
    const renderWidth = Math.max(engine.getRenderWidth(), 1);
    const renderHeight = Math.max(engine.getRenderHeight(), 1);
    const aspectRatio = renderWidth / renderHeight;

    this.camera.orthoTop = orthoHalfHeight;
    this.camera.orthoBottom = -orthoHalfHeight;
    this.camera.orthoRight = orthoHalfHeight * aspectRatio;
    this.camera.orthoLeft = -orthoHalfHeight * aspectRatio;
  }

  private getFixedViewFrame(view: FixedCameraView): Pick<CameraFrame, "alpha" | "beta"> {
    if (view === "front") {
      return FRONT_VIEW;
    }

    if (view === "side") {
      return SIDE_VIEW;
    }

    return TOP_VIEW;
  }
}

function cloneCameraFrame(frame: CameraFrame): CameraFrame {
  return {
    ...frame,
    target: frame.target.clone(),
  };
}
