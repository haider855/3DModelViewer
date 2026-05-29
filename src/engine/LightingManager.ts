import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

export class LightingManager {
  constructor(scene: Scene) {
    const hemisphere = new HemisphericLight(
      "ambient-light",
      new Vector3(0, 1, 0),
      scene,
    );
    hemisphere.intensity = 0.82;

    const keyLight = new DirectionalLight(
      "key-light",
      new Vector3(-0.65, -1, -0.55),
      scene,
    );
    keyLight.intensity = 0.75;
    keyLight.position = new Vector3(6, 8, 5);
  }
}
