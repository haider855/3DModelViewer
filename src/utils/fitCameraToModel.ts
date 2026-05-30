import type { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import type { ModelBounds } from "../inspection/BoundingBoxAnalyzer";

const DEFAULT_ALPHA = Math.PI / 4;
const DEFAULT_BETA = Math.PI / 3;
const FRAME_PADDING = 1.25;
const MIN_FRAME_RADIUS = 0.01;

export function fitCameraToModel(camera: ArcRotateCamera, bounds: ModelBounds): void {
  const frameRadius = Math.max(bounds.radius, MIN_FRAME_RADIUS);
  const distance = calculateCameraDistance(camera, frameRadius);

  camera.stopInterpolation();
  camera.setTarget(Vector3.Zero());
  camera.alpha = DEFAULT_ALPHA;
  camera.beta = DEFAULT_BETA;
  camera.radius = distance;
  camera.lowerRadiusLimit = Math.max(frameRadius * 0.02, 0.001);
  camera.upperRadiusLimit = Math.max(distance * 8, frameRadius * 20, 10);
  camera.panningDistanceLimit = Math.max(frameRadius * 4, 1);
  camera.minZ = Math.max(distance / 1000, 0.0001);
  camera.maxZ = Math.max(distance + frameRadius * 8, 100);
  camera.storeState();
}

function calculateCameraDistance(camera: ArcRotateCamera, radius: number): number {
  const halfFov = Math.max(camera.fov / 2, 0.1);

  return (radius / Math.sin(halfFov)) * FRAME_PADDING;
}
