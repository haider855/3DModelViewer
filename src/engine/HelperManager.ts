import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import type { Scene } from "@babylonjs/core/scene";

import type { ModelBounds } from "../inspection/BoundingBoxAnalyzer";

const DEFAULT_GRID_SPAN = 20;
const DEFAULT_GRID_SPACING = 1;
const GRID_FLOOR_MODEL_PADDING = 8;
const TARGET_GRID_DIVISIONS = 48;
const X_AXIS_COLOR = new Color3(0.851, 0.376, 0.29);
const Y_AXIS_COLOR = new Color3(0.29, 0.565, 0.851);
const Z_AXIS_COLOR = new Color3(0.29, 0.851, 0.627);

export class HelperManager {
  private readonly scene: Scene;
  private grid: LinesMesh;
  private xAxis: LinesMesh;
  private yAxis: LinesMesh;
  private zAxis: LinesMesh;

  constructor(scene: Scene) {
    this.scene = scene;
    this.grid = this.createGrid(DEFAULT_GRID_SPAN / 2, DEFAULT_GRID_SPACING, 0);
    [this.xAxis, this.yAxis, this.zAxis] = this.createAxes(DEFAULT_GRID_SPAN / 2, 0);
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

  frameGrid(bounds: ModelBounds): number {
    const footprint = Math.max(bounds.size.x, bounds.size.z);
    const gridSpan = Math.max(
      footprint * GRID_FLOOR_MODEL_PADDING,
      DEFAULT_GRID_SPAN,
    );
    const spacing = getNiceGridSpacing(gridSpan / TARGET_GRID_DIVISIONS);

    const gridHalfSize = this.rebuildGrid(gridSpan, spacing, snapToZero(bounds.minimum.y));

    return gridHalfSize * Math.SQRT2;
  }

  resetGrid(): void {
    this.rebuildGrid(DEFAULT_GRID_SPAN, DEFAULT_GRID_SPACING, 0);
  }

  private rebuildGrid(span: number, spacing: number, yPosition: number): number {
    const wasVisible = this.grid.isEnabled();
    const wereAxesVisible = this.getAxesVisible();
    const gridHalfSize = getGridHalfSize(span, spacing);

    this.grid.dispose();
    this.disposeAxes();
    this.grid = this.createGrid(gridHalfSize, spacing, yPosition);
    [this.xAxis, this.yAxis, this.zAxis] = this.createAxes(gridHalfSize, yPosition);
    this.grid.setEnabled(wasVisible);
    this.setAxesVisible(wereAxesVisible);

    return gridHalfSize;
  }

  private createGrid(size: number, spacing: number, yPosition: number): LinesMesh {
    const lines: Vector3[][] = [];

    for (let position = -size; position <= size + spacing * 0.5; position += spacing) {
      const gridPosition = roundToPrecision(position);

      lines.push([
        new Vector3(gridPosition, yPosition, -size),
        new Vector3(gridPosition, yPosition, size),
      ]);
      lines.push([
        new Vector3(-size, yPosition, gridPosition),
        new Vector3(size, yPosition, gridPosition),
      ]);
    }

    const grid = MeshBuilder.CreateLineSystem(
      "grid-helper",
      { lines, updatable: false },
      this.scene,
    );
    grid.color = new Color3(0.18, 0.18, 0.18);
    grid.alpha = 0.6;
    grid.isPickable = false;

    return grid;
  }

  private createAxes(size: number, yPosition: number): [LinesMesh, LinesMesh, LinesMesh] {
    const origin = new Vector3(0, yPosition, 0);

    return [
      this.createAxis(
        "x-axis-helper",
        new Vector3(-size, yPosition, 0),
        new Vector3(size, yPosition, 0),
        X_AXIS_COLOR,
      ),
      this.createAxis("y-axis-helper", origin, new Vector3(0, yPosition + size, 0), Y_AXIS_COLOR),
      this.createAxis(
        "z-axis-helper",
        new Vector3(0, yPosition, -size),
        new Vector3(0, yPosition, size),
        Z_AXIS_COLOR,
      ),
    ];
  }

  private disposeAxes(): void {
    this.xAxis.dispose();
    this.yAxis.dispose();
    this.zAxis.dispose();
  }

  private createAxis(
    name: string,
    start: Vector3,
    end: Vector3,
    color: Color3,
  ): LinesMesh {
    const axis = MeshBuilder.CreateLines(
      name,
      {
        points: [start, end],
        updatable: false,
      },
      this.scene,
    );
    axis.color = color;
    axis.isPickable = false;

    return axis;
  }
}

function getNiceGridSpacing(rawSpacing: number): number {
  if (!Number.isFinite(rawSpacing) || rawSpacing <= 0) {
    return DEFAULT_GRID_SPACING;
  }

  const magnitude = 10 ** Math.floor(Math.log10(rawSpacing));
  const normalized = rawSpacing / magnitude;

  if (normalized <= 1) {
    return magnitude;
  }

  if (normalized <= 2) {
    return 2 * magnitude;
  }

  if (normalized <= 5) {
    return 5 * magnitude;
  }

  return 10 * magnitude;
}

function getGridHalfSize(span: number, spacing: number): number {
  return roundToPrecision(
    Math.max(Math.ceil(span / (spacing * 2)) * spacing, spacing),
  );
}

function snapToZero(value: number): number {
  return Math.abs(value) < 0.000001 ? 0 : value;
}

function roundToPrecision(value: number): number {
  return Number(value.toPrecision(12));
}
