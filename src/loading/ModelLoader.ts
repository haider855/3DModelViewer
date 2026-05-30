import "@babylonjs/loaders/glTF";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";

export interface LoadedModel {
  meshes: AbstractMesh[];
  rootNode: TransformNode;
}

export class ModelLoader {
  private loadedModel: LoadedModel | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly sceneModelRoot: TransformNode,
  ) {}

  async loadModel(file: File): Promise<LoadedModel> {
    this.clearModel();
    const existingNodeIds = new Set(
      [...this.scene.meshes, ...this.scene.transformNodes].map((node) => node.uniqueId),
    );

    try {
      const result = await ImportMeshAsync(file, this.scene, {
        meshNames: null,
      });

      const loadedNodeSet = new Set([...result.meshes, ...result.transformNodes]);

      for (const mesh of result.meshes) {
        mesh.isPickable = true;
      }

      for (const node of loadedNodeSet) {
        if (!node.parent || !loadedNodeSet.has(node.parent as TransformNode | AbstractMesh)) {
          node.parent = this.sceneModelRoot;
        }
      }

      this.loadedModel = {
        meshes: result.meshes,
        rootNode: this.sceneModelRoot,
      };

      return this.loadedModel;
    } catch (error) {
      this.disposeNodesCreatedAfter(existingNodeIds);
      throw error;
    }
  }

  clearModel(): void {
    const children = this.sceneModelRoot.getChildren();

    for (const child of children) {
      child.dispose(false, true);
    }

    this.sceneModelRoot.position.setAll(0);
    this.sceneModelRoot.rotation.setAll(0);
    this.sceneModelRoot.scaling.setAll(1);
    this.sceneModelRoot.rotationQuaternion = null;
    this.sceneModelRoot.computeWorldMatrix(true);
    this.loadedModel = null;
  }

  dispose(): void {
    this.clearModel();
  }

  private disposeNodesCreatedAfter(existingNodeIds: Set<number>): void {
    const createdNodes = [...this.scene.meshes, ...this.scene.transformNodes].filter(
      (node) => !existingNodeIds.has(node.uniqueId),
    );
    const createdNodeSet = new Set(createdNodes);

    for (const node of createdNodes) {
      if (!node.parent || !createdNodeSet.has(node.parent as AbstractMesh | TransformNode)) {
        node.dispose(false, true);
      }
    }
  }
}
