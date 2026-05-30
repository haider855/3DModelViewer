import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface ModelBounds {
  minimum: Vector3;
  maximum: Vector3;
  center: Vector3;
  size: Vector3;
  radius: number;
}

export function calculateModelBounds(meshes: readonly AbstractMesh[]): ModelBounds | null {
  const boundedMeshes = meshes.filter(hasRenderableBounds);

  if (boundedMeshes.length === 0) {
    return null;
  }

  let minimum = new Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );
  let maximum = new Vector3(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );

  for (const mesh of boundedMeshes) {
    mesh.computeWorldMatrix(true);

    const boundingBox = mesh.getBoundingInfo().boundingBox;
    minimum = Vector3.Minimize(minimum, boundingBox.minimumWorld);
    maximum = Vector3.Maximize(maximum, boundingBox.maximumWorld);
  }

  if (!hasFiniteVector(minimum) || !hasFiniteVector(maximum)) {
    return null;
  }

  const center = Vector3.Center(minimum, maximum);
  const size = maximum.subtract(minimum);

  return {
    minimum,
    maximum,
    center,
    size,
    radius: Math.max(size.length() / 2, 0),
  };
}

export function centerModelAtOrigin(
  modelRoot: TransformNode,
  meshes: readonly AbstractMesh[],
): ModelBounds | null {
  const bounds = calculateModelBounds(meshes);

  if (!bounds) {
    return null;
  }

  modelRoot.position.subtractInPlace(bounds.center);
  modelRoot.computeWorldMatrix(true);

  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
  }

  return calculateModelBounds(meshes);
}

function hasRenderableBounds(mesh: AbstractMesh): boolean {
  return !mesh.isDisposed() && mesh.isEnabled() && mesh.getTotalVertices() > 0;
}

function hasFiniteVector(vector: Vector3): boolean {
  return Number.isFinite(vector.x) && Number.isFinite(vector.y) && Number.isFinite(vector.z);
}
