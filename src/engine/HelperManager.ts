import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import type { Scene } from "@babylonjs/core/scene";

export class HelperManager {
  readonly grid: LinesMesh;
  readonly xAxis: LinesMesh;
  readonly yAxis: LinesMesh;
  readonly zAxis: LinesMesh;

  constructor(scene: Scene) {
    this.grid = this.createGrid(scene);
    this.xAxis = this.createAxis(
      "x-axis-helper",
      scene,
      new Vector3(1, 0, 0),
      new Color3(0.95, 0.25, 0.25),
    );
    this.yAxis = this.createAxis(
      "y-axis-helper",
      scene,
      new Vector3(0, 1, 0),
      new Color3(0.3, 0.78, 0.35),
    );
    this.zAxis = this.createAxis(
      "z-axis-helper",
      scene,
      new Vector3(0, 0, 1),
      new Color3(0.25, 0.52, 0.95),
    );
  }

  setGridVisible(isVisible: boolean): void {
    this.grid.setEnabled(isVisible);
  }

  setAxesVisible(isVisible: boolean): void {
    this.xAxis.setEnabled(isVisible);
    this.yAxis.setEnabled(isVisible);
    this.zAxis.setEnabled(isVisible);
  }

  getGridVisible(): boolean {
    return this.grid.isEnabled();
  }

  getAxesVisible(): boolean {
    return this.xAxis.isEnabled() && this.yAxis.isEnabled() && this.zAxis.isEnabled();
  }

  private createGrid(scene: Scene): LinesMesh {
    const size = 10;
    const lines: Vector3[][] = [];

    for (let position = -size; position <= size; position += 1) {
      lines.push([
        new Vector3(position, 0, -size),
        new Vector3(position, 0, size),
      ]);
      lines.push([
        new Vector3(-size, 0, position),
        new Vector3(size, 0, position),
      ]);
    }

    const grid = MeshBuilder.CreateLineSystem(
      "grid-helper",
      { lines, updatable: false },
      scene,
    );
    grid.color = new Color3(0.46, 0.54, 0.6);
    grid.alpha = 0.45;
    grid.isPickable = false;

    return grid;
  }

  private createAxis(
    name: string,
    scene: Scene,
    direction: Vector3,
    color: Color3,
  ): LinesMesh {
    const axis = MeshBuilder.CreateLines(
      name,
      {
        points: [Vector3.Zero(), direction.scale(3)],
        updatable: false,
      },
      scene,
    );
    axis.color = color;
    axis.isPickable = false;

    return axis;
  }
}
