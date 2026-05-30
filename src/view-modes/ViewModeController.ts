import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Scene } from "@babylonjs/core/scene";

import type { ViewMode } from "./ViewModeTypes";

export class ViewModeController {
  private readonly solidMaterial: StandardMaterial;
  private readonly wireframeMaterial: StandardMaterial;
  private readonly originalMaterials = new Map<AbstractMesh, Material | null>();
  private meshes: AbstractMesh[] = [];
  private currentMode: ViewMode = "material";

  constructor(scene: Scene) {
    this.solidMaterial = new StandardMaterial("viewer-solid-material", scene);
    this.solidMaterial.diffuseColor = new Color3(0.68, 0.72, 0.75);
    this.solidMaterial.specularColor = new Color3(0.12, 0.13, 0.14);

    this.wireframeMaterial = new StandardMaterial("viewer-wireframe-material", scene);
    this.wireframeMaterial.diffuseColor = new Color3(0.78, 0.9, 1);
    this.wireframeMaterial.emissiveColor = new Color3(0.08, 0.16, 0.22);
    this.wireframeMaterial.specularColor = Color3.Black();
    this.wireframeMaterial.backFaceCulling = false;
    this.wireframeMaterial.wireframe = true;
  }

  setMeshes(meshes: readonly AbstractMesh[]): void {
    this.clearModel();
    this.meshes = meshes.filter(isRenderableMesh);

    for (const mesh of this.meshes) {
      this.originalMaterials.set(mesh, mesh.material);
    }

    this.setViewMode("material");
  }

  setViewMode(viewMode: ViewMode): void {
    this.currentMode = viewMode;

    if (viewMode === "material") {
      this.restoreOriginalMaterials();
      return;
    }

    const material = viewMode === "solid" ? this.solidMaterial : this.wireframeMaterial;

    for (const mesh of this.meshes) {
      if (!mesh.isDisposed()) {
        mesh.material = material;
      }
    }
  }

  getViewMode(): ViewMode {
    return this.currentMode;
  }

  clearModel(): void {
    this.restoreOriginalMaterials();
    this.meshes = [];
    this.originalMaterials.clear();
    this.currentMode = "material";
  }

  dispose(): void {
    this.clearModel();
    this.solidMaterial.dispose();
    this.wireframeMaterial.dispose();
  }

  private restoreOriginalMaterials(): void {
    for (const [mesh, material] of this.originalMaterials) {
      if (!mesh.isDisposed()) {
        mesh.material = material;
      }
    }
  }
}

function isRenderableMesh(mesh: AbstractMesh): boolean {
  try {
    return !mesh.isDisposed() && mesh.getTotalVertices() > 0;
  } catch {
    return false;
  }
}
