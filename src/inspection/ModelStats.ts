import type { Material } from "@babylonjs/core/Materials/material";
import type { MultiMaterial } from "@babylonjs/core/Materials/multiMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import type { ModelBounds } from "./BoundingBoxAnalyzer";

export interface ModelDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface ModelStats {
  meshCount: number;
  materialCount: number;
  vertexCount: number;
  triangleCount: number;
  dimensions: ModelDimensions;
}

export function calculateModelStats(
  meshes: readonly AbstractMesh[],
  bounds: ModelBounds,
): ModelStats {
  const renderableMeshes = meshes.filter(hasGeometry);

  return {
    meshCount: renderableMeshes.length,
    materialCount: countUniqueMaterials(renderableMeshes),
    vertexCount: renderableMeshes.reduce((total, mesh) => total + getVertexCount(mesh), 0),
    triangleCount: renderableMeshes.reduce((total, mesh) => total + getTriangleCount(mesh), 0),
    dimensions: {
      width: bounds.size.x,
      height: bounds.size.y,
      depth: bounds.size.z,
    },
  };
}

function countUniqueMaterials(meshes: readonly AbstractMesh[]): number {
  const materials = new Set<Material>();

  for (const mesh of meshes) {
    const material = mesh.material;

    if (!material) {
      continue;
    }

    if (isMultiMaterial(material)) {
      for (const subMaterial of material.subMaterials) {
        if (subMaterial) {
          materials.add(subMaterial);
        }
      }

      continue;
    }

    materials.add(material);
  }

  return materials.size;
}

function hasGeometry(mesh: AbstractMesh): boolean {
  return !mesh.isDisposed() && getVertexCount(mesh) > 0;
}

function getVertexCount(mesh: AbstractMesh): number {
  try {
    return Math.max(mesh.getTotalVertices(), 0);
  } catch {
    return 0;
  }
}

function getTriangleCount(mesh: AbstractMesh): number {
  try {
    const indexCount = mesh.getTotalIndices();

    if (indexCount > 0) {
      return Math.floor(indexCount / 3);
    }

    return Math.floor(getVertexCount(mesh) / 3);
  } catch {
    return 0;
  }
}

function isMultiMaterial(material: Material): material is MultiMaterial {
  return material.getClassName() === "MultiMaterial";
}
