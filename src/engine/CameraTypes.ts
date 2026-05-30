export const CAMERA_PROJECTION_MODES = ["perspective", "orthographic"] as const;
export const FIXED_CAMERA_VIEWS = ["front", "side", "top"] as const;

export type CameraProjectionMode = (typeof CAMERA_PROJECTION_MODES)[number];
export type FixedCameraView = (typeof FIXED_CAMERA_VIEWS)[number];

export function isCameraProjectionMode(
  value: string | undefined,
): value is CameraProjectionMode {
  return CAMERA_PROJECTION_MODES.some((mode) => mode === value);
}

export function isFixedCameraView(value: string | undefined): value is FixedCameraView {
  return FIXED_CAMERA_VIEWS.some((view) => view === value);
}
