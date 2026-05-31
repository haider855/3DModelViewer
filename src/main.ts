import "./styles.css";
import { BabylonEngine } from "./engine/BabylonEngine";
import {
  ACCEPTED_MODEL_FILE_TYPES,
  SUPPORTED_MODEL_EXTENSIONS,
} from "./loading/SupportedFormats";
import { validateModelFile } from "./loading/FileValidator";
import { ModelLoader } from "./loading/ModelLoader";
import { centerModelOnFloor } from "./inspection/BoundingBoxAnalyzer";
import {
  calculateModelStats,
  type ModelDimensions,
  type ModelStats,
} from "./inspection/ModelStats";
import { formatBytes } from "./utils/formatBytes";
import { formatNumber } from "./utils/formatNumber";
import { ViewModeController } from "./view-modes/ViewModeController";
import { isViewMode, type ViewMode } from "./view-modes/ViewModeTypes";
import {
  isCameraProjectionMode,
  isFixedCameraView,
  type CameraProjectionMode,
  type FixedCameraView,
} from "./engine/CameraTypes";

type AppLoadState = "empty" | "loading" | "loaded" | "error";
type DotState = "idle" | "loading" | "ok" | "error";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found.");
}

const appRoot = app;

appRoot.innerHTML = `
  <div class="app-shell" data-app-shell data-state="empty">
    <header class="topbar">
      <div class="brand">
        <div class="brand-icon" aria-hidden="true">${iconCube()}</div>
        <h1 class="brand-name" id="app-title">ModelScope 3D</h1>
        <span class="brand-ver">v1.0.0</span>
      </div>

      <div class="tb-divider" aria-hidden="true"></div>

      <nav class="tb-group" aria-label="Render mode">
        <span class="tb-group-label">Render</span>
        <div class="seg-group" role="group">
          <button id="btn-material" class="seg-btn active" type="button" data-view-mode-button data-view-mode="material" aria-pressed="true" disabled>Material</button>
          <button id="btn-solid" class="seg-btn" type="button" data-view-mode-button data-view-mode="solid" aria-pressed="false" disabled>Solid</button>
          <button id="btn-wireframe" class="seg-btn" type="button" data-view-mode-button data-view-mode="wireframe" aria-pressed="false" disabled>Wireframe</button>
        </div>
      </nav>

      <div class="tb-divider" aria-hidden="true"></div>

      <nav class="tb-group" aria-label="Camera mode">
        <span class="tb-group-label">Camera</span>
        <div class="seg-group" role="group">
          <button id="btn-perspective" class="seg-btn active" type="button" data-camera-projection-button data-camera-projection="perspective" aria-pressed="true" disabled>Perspective</button>
          <button id="btn-orthographic" class="seg-btn" type="button" data-camera-projection-button data-camera-projection="orthographic" aria-pressed="false" disabled>Orthographic</button>
        </div>
      </nav>

      <div class="tb-divider" aria-hidden="true"></div>

      <nav class="tb-group" aria-label="Fixed views">
        <span class="tb-group-label">View</span>
        <div class="seg-group" role="group">
          <button id="btn-front" class="seg-btn" type="button" data-fixed-view-button data-fixed-view="front" aria-pressed="false" disabled>Front</button>
          <button id="btn-side" class="seg-btn" type="button" data-fixed-view-button data-fixed-view="side" aria-pressed="false" disabled>Side</button>
          <button id="btn-top" class="seg-btn" type="button" data-fixed-view-button data-fixed-view="top" aria-pressed="false" disabled>Top</button>
        </div>
      </nav>

      <div class="tb-spacer"></div>

      <button id="btn-reset" class="btn-icon" type="button" title="Reset camera" disabled>${iconReset()}</button>
      <button id="btn-clear" class="btn-icon btn-icon--danger" type="button" title="Clear model" disabled>${iconTrash()}</button>
      <button id="btn-upload" class="btn-primary" type="button">
        ${iconUpload()}
        <span>Upload</span>
      </button>

      <input
        id="file-input"
        class="visually-hidden"
        type="file"
        accept="${ACCEPTED_MODEL_FILE_TYPES}"
        aria-label="Choose a ${SUPPORTED_MODEL_EXTENSIONS.join(" or ")} model file"
      />
    </header>

    <main class="workspace" aria-labelledby="app-title">
      <section class="viewport-wrap" id="viewport-wrap" aria-label="3D viewport">
        <canvas id="renderCanvas" aria-label="3D scene viewport"></canvas>

        <div class="overlay empty-overlay" id="empty-overlay">
          <div class="empty-panel">
            <div class="empty-icon" aria-hidden="true">${iconCube()}</div>
            <h2>No model loaded</h2>
            <p>Drag a .glb or .gltf file into the viewport, or browse from your computer.</p>
            <div class="fmt-row" aria-hidden="true">
              <span class="fmt">.GLB</span>
              <span class="fmt">.GLTF</span>
            </div>
            <button id="btn-choose" class="btn-browse" type="button">Browse files</button>
          </div>
        </div>

        <div class="overlay loading-overlay" id="loading-overlay" hidden>
          <div class="loading-panel">
            <div class="loader" aria-hidden="true">
              <svg viewBox="0 0 40 40">
                <circle class="loader-track" cx="20" cy="20" r="15"></circle>
                <circle class="loader-arc" cx="20" cy="20" r="15"></circle>
              </svg>
            </div>
            <p id="loading-label">Loading...</p>
            <span id="loading-sub">Reading file</span>
          </div>
        </div>

        <div class="overlay error-overlay" id="error-overlay" hidden>
          <div class="error-panel">
            <div class="error-icon" aria-hidden="true">${iconAlert()}</div>
            <h2 id="error-title">Failed to load</h2>
            <p id="error-msg">The selected file could not be imported.</p>
            <button id="btn-retry" class="btn-browse" type="button">Try another file</button>
          </div>
        </div>

        <div class="overlay drag-overlay" id="drag-overlay" hidden>
          <div class="drag-inner">
            ${iconUpload()}
            <p>Release to open</p>
          </div>
        </div>

        <div class="vp-label vp-label--tl" id="status-badge">
          <span class="vp-dot vp-dot--idle" id="badge-dot" aria-hidden="true"></span>
          <span id="badge-label">Empty</span>
        </div>

        <div class="vp-label vp-label--tr" id="camera-badge">
          <span id="camera-label">Perspective</span>
        </div>

        <svg class="axis-gizmo" viewBox="0 0 44 44" aria-hidden="true">
          <line x1="22" y1="22" x2="22" y2="6" class="axis axis-y" />
          <text x="22" y="5" text-anchor="middle" class="axis-txt axis-y">Y</text>
          <line x1="22" y1="22" x2="36" y2="33" class="axis axis-x" />
          <text x="41" y="37" text-anchor="middle" class="axis-txt axis-x">X</text>
          <line x1="22" y1="22" x2="8" y2="33" class="axis axis-z" />
          <text x="3" y="37" text-anchor="middle" class="axis-txt axis-z">Z</text>
        </svg>

        <div class="vp-hints" aria-hidden="true">
          <span class="hint"><kbd>Drag</kbd> Orbit</span>
          <span class="hint"><kbd>RMB</kbd> Pan</span>
          <span class="hint"><kbd>Scroll</kbd> Zoom</span>
        </div>
      </section>

      <aside class="sidebar" aria-label="Model inspector">
        <section class="s-block">
          <h2 class="s-label">File</h2>
          <dl class="stat-list">
            <div class="stat-row"><dt>Name</dt><dd id="stat-name" class="empty">-</dd></div>
            <div class="stat-row"><dt>Size</dt><dd id="stat-size" class="empty">-</dd></div>
            <div class="stat-row stat-row--last"><dt>Format</dt><dd id="stat-type" class="empty">-</dd></div>
          </dl>
        </section>

        <section class="s-block">
          <h2 class="s-label">Geometry</h2>
          <dl class="stat-list">
            <div class="stat-row"><dt>Meshes</dt><dd id="stat-meshes">0</dd></div>
            <div class="stat-row"><dt>Materials</dt><dd id="stat-materials">0</dd></div>
            <div class="stat-row"><dt>Vertices</dt><dd id="stat-vertices">0</dd></div>
            <div class="stat-row stat-row--last"><dt>Triangles</dt><dd id="stat-triangles">0</dd></div>
          </dl>
        </section>

        <section class="s-block">
          <h2 class="s-label">Dimensions</h2>
          <dl class="stat-list">
            <div class="stat-row"><dt>X width</dt><dd id="stat-dim-x" class="empty">-</dd></div>
            <div class="stat-row"><dt>Y height</dt><dd id="stat-dim-y" class="empty">-</dd></div>
            <div class="stat-row"><dt>Z depth</dt><dd id="stat-dim-z" class="empty">-</dd></div>
            <div class="stat-row stat-row--last"><dt>Units</dt><dd class="muted-value">source units</dd></div>
          </dl>
        </section>

        <section class="s-block s-block--last">
          <h2 class="s-label">Scene</h2>
          <div class="toggle-list">
            <label class="toggle-row">
              <span class="toggle-label">
                ${iconGrid()}
                <span>Grid</span>
                <span class="toggle-sub">Ground grid</span>
              </span>
              <input type="checkbox" id="toggle-grid" role="switch" checked />
              <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
            </label>
            <label class="toggle-row">
              <span class="toggle-label">
                ${iconAxes()}
                <span>Axes</span>
                <span class="toggle-sub">World axes</span>
              </span>
              <input type="checkbox" id="toggle-axes" role="switch" checked />
              <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
            </label>
            <label class="toggle-row">
              <span class="toggle-label">
                ${iconBackground()}
                <span>Background</span>
                <span class="toggle-sub">Neutral gray</span>
              </span>
              <input type="checkbox" id="toggle-neutral-bg" role="switch" />
              <span class="toggle-track" aria-hidden="true"><span class="toggle-thumb"></span></span>
            </label>
          </div>
        </section>
      </aside>
    </main>

    <footer class="statusbar">
      <div class="sb-left">
        <div class="sb-item">
          <span class="sb-dot sb-dot--idle" id="sb-dot" aria-hidden="true"></span>
          <span id="sb-status">No model loaded</span>
        </div>
      </div>
      <div class="sb-right">
        <div class="sb-item"><span class="sb-dot sb-dot--ok" aria-hidden="true"></span>WebGL 2.0</div>
        <div class="sb-item">Babylon.js</div>
      </div>
    </footer>
  </div>
`;

const canvas = requireElement<HTMLCanvasElement>("#renderCanvas");
const viewerEngine = new BabylonEngine(canvas);
const modelLoader = new ModelLoader(
  viewerEngine.sceneManager.scene,
  viewerEngine.sceneManager.modelRoot,
);
const viewModeController = new ViewModeController(viewerEngine.sceneManager.scene);
const appShell = requireElement<HTMLDivElement>("[data-app-shell]");
const viewportWrap = requireElement<HTMLElement>("#viewport-wrap");
const fileInput = requireElement<HTMLInputElement>("#file-input");
const emptyOverlay = requireElement<HTMLDivElement>("#empty-overlay");
const loadingOverlay = requireElement<HTMLDivElement>("#loading-overlay");
const errorOverlay = requireElement<HTMLDivElement>("#error-overlay");
const dragOverlay = requireElement<HTMLDivElement>("#drag-overlay");
const loadingLabel = requireElement<HTMLElement>("#loading-label");
const loadingSub = requireElement<HTMLElement>("#loading-sub");
const errorTitle = requireElement<HTMLElement>("#error-title");
const errorMessage = requireElement<HTMLElement>("#error-msg");
const badgeDot = requireElement<HTMLSpanElement>("#badge-dot");
const badgeLabel = requireElement<HTMLSpanElement>("#badge-label");
const cameraLabel = requireElement<HTMLSpanElement>("#camera-label");
const statusBarDot = requireElement<HTMLSpanElement>("#sb-dot");
const statusBarText = requireElement<HTMLSpanElement>("#sb-status");
const uploadButton = requireElement<HTMLButtonElement>("#btn-upload");
const chooseButton = requireElement<HTMLButtonElement>("#btn-choose");
const retryButton = requireElement<HTMLButtonElement>("#btn-retry");
const resetCameraButton = requireElement<HTMLButtonElement>("#btn-reset");
const clearButton = requireElement<HTMLButtonElement>("#btn-clear");
const viewModeButtons = Array.from(
  appRoot.querySelectorAll<HTMLButtonElement>("[data-view-mode-button]"),
);
const cameraProjectionButtons = Array.from(
  appRoot.querySelectorAll<HTMLButtonElement>("[data-camera-projection-button]"),
);
const fixedViewButtons = Array.from(
  appRoot.querySelectorAll<HTMLButtonElement>("[data-fixed-view-button]"),
);
const fileNameStat = requireElement<HTMLElement>("#stat-name");
const fileSizeStat = requireElement<HTMLElement>("#stat-size");
const fileTypeStat = requireElement<HTMLElement>("#stat-type");
const meshCountStat = requireElement<HTMLElement>("#stat-meshes");
const materialCountStat = requireElement<HTMLElement>("#stat-materials");
const vertexCountStat = requireElement<HTMLElement>("#stat-vertices");
const triangleCountStat = requireElement<HTMLElement>("#stat-triangles");
const dimensionXStat = requireElement<HTMLElement>("#stat-dim-x");
const dimensionYStat = requireElement<HTMLElement>("#stat-dim-y");
const dimensionZStat = requireElement<HTMLElement>("#stat-dim-z");
const gridToggle = requireElement<HTMLInputElement>("#toggle-grid");
const axesToggle = requireElement<HTMLInputElement>("#toggle-axes");
const neutralBackgroundToggle = requireElement<HTMLInputElement>("#toggle-neutral-bg");
const uploadControls = [uploadButton, chooseButton, retryButton];
let activeDragEvents = 0;
let loadRequestId = 0;
let isLoading = false;
let currentLoadState: AppLoadState = "empty";

const handleWindowDragEnd = (): void => {
  activeDragEvents = 0;
  setDragOver(false);
};

const handleViewerWheel = (event: WheelEvent): void => {
  event.preventDefault();
};

function requireElement<TElement extends Element>(selector: string): TElement {
  const element = appRoot.querySelector<TElement>(selector);

  if (!element) {
    throw new Error(`Required element was not found: ${selector}`);
  }

  return element;
}

function transitionToEmpty(): void {
  currentLoadState = "empty";
  appShell.dataset.state = "empty";
  emptyOverlay.hidden = false;
  loadingOverlay.hidden = true;
  errorOverlay.hidden = true;
  dragOverlay.hidden = true;
  viewportWrap.classList.remove("viewport-wrap--drag");
  clearSidebar();
  setBadge("idle", "Empty");
  setStatusBar("idle", "No model loaded");
  updateCameraLabel("Perspective");
  setViewModeControlsEnabled(false);
  setCameraControlsEnabled(false);
  resetCameraButton.disabled = true;
  clearButton.disabled = true;
  setUploadControlsEnabled(true);
}

function transitionToLoading(file: File, warningMessage: string | null): void {
  currentLoadState = "loading";
  appShell.dataset.state = "loading";
  emptyOverlay.hidden = true;
  loadingOverlay.hidden = false;
  errorOverlay.hidden = true;
  dragOverlay.hidden = true;
  viewportWrap.classList.remove("viewport-wrap--drag");
  loadingLabel.textContent = `Loading ${file.name}...`;
  loadingSub.textContent = warningMessage ?? "Reading file";
  clearSidebar();
  setBadge("loading", "Loading...");
  setStatusBar("loading", "Loading...");
  setViewModeControlsEnabled(false);
  setCameraControlsEnabled(false);
  resetCameraButton.disabled = true;
  clearButton.disabled = true;
  setUploadControlsEnabled(false);
}

function transitionToLoaded(
  file: File,
  stats: ModelStats,
  fileType: string,
  fileSize: string,
): void {
  currentLoadState = "loaded";
  appShell.dataset.state = "loaded";
  emptyOverlay.hidden = true;
  loadingOverlay.hidden = true;
  errorOverlay.hidden = true;
  dragOverlay.hidden = true;
  viewportWrap.classList.remove("viewport-wrap--drag");
  populateSidebar(file, stats, fileType, fileSize);
  setBadge("ok", truncateFileName(file.name, 24));
  setStatusBar("ok", `${file.name} | ${fileSize} | ${formatCount(stats.vertexCount)} verts`);
  setViewModeControlsEnabled(true);
  setActiveViewMode(viewModeController.getViewMode());
  setCameraControlsEnabled(true);
  setActiveCameraProjectionMode(viewerEngine.sceneManager.cameraManager.getProjectionMode());
  setActiveFixedView(null);
  updateCameraLabel("Perspective");
  resetCameraButton.disabled = false;
  clearButton.disabled = false;
  setUploadControlsEnabled(true);
}

function transitionToError(title: string, message: string): void {
  currentLoadState = "error";
  appShell.dataset.state = "error";
  emptyOverlay.hidden = true;
  loadingOverlay.hidden = true;
  errorOverlay.hidden = false;
  dragOverlay.hidden = true;
  viewportWrap.classList.remove("viewport-wrap--drag");
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  clearSidebar();
  setBadge("error", "Error");
  setStatusBar("error", `Failed - ${title}`);
  setViewModeControlsEnabled(false);
  setActiveViewMode("material");
  setCameraControlsEnabled(false);
  setActiveCameraProjectionMode(viewerEngine.sceneManager.cameraManager.getProjectionMode());
  setActiveFixedView(null);
  resetCameraButton.disabled = true;
  clearButton.disabled = true;
  setUploadControlsEnabled(true);
  fileInput.value = "";
}

function resetSelectedFile(): void {
  loadRequestId += 1;
  isLoading = false;
  viewModeController.clearModel();
  modelLoader.clearModel();
  viewerEngine.sceneManager.cameraManager.setProjectionMode("perspective");
  viewerEngine.sceneManager.helperManager.resetGrid();
  fileInput.value = "";
  transitionToEmpty();
}

function handleRejectedFile(message: string): void {
  resetSelectedFile();
  transitionToError("Failed to load", message);
}

async function handleAcceptedFile(file: File): Promise<void> {
  const result = validateModelFile(file);

  if (!result.ok) {
    handleRejectedFile(result.errorMessage);
    return;
  }

  const currentLoadId = loadRequestId + 1;
  loadRequestId = currentLoadId;
  isLoading = true;
  transitionToLoading(result.file, result.warningMessage);

  try {
    viewModeController.clearModel();
    const loadedModel = await modelLoader.loadModel(result.file);

    if (currentLoadId !== loadRequestId) {
      modelLoader.clearModel();
      return;
    }

    const modelBounds = centerModelOnFloor(loadedModel.rootNode, loadedModel.meshes);

    if (!modelBounds) {
      throw new Error("The model does not contain renderable mesh geometry.");
    }

    const sceneRadius = viewerEngine.sceneManager.helperManager.frameGrid(modelBounds);
    viewerEngine.sceneManager.cameraManager.frameModel(modelBounds, sceneRadius);
    const modelStats = calculateModelStats(loadedModel.meshes, modelBounds);
    viewModeController.setMeshes(loadedModel.meshes);
    isLoading = false;
    transitionToLoaded(
      result.file,
      modelStats,
      result.fileInfo.extension.toUpperCase(),
      formatBytes(result.fileInfo.sizeBytes),
    );
  } catch (error) {
    if (currentLoadId !== loadRequestId) {
      return;
    }

    viewModeController.clearModel();
    modelLoader.clearModel();
    viewerEngine.sceneManager.cameraManager.setProjectionMode("perspective");
    viewerEngine.sceneManager.helperManager.resetGrid();
    isLoading = false;
    transitionToError("Failed to load", getLoadErrorMessage(error));
  }
}

function handleFileList(files: FileList | null): void {
  if (isLoading) {
    setStatusBar("loading", "Loading...");
    return;
  }

  const file = files?.item(0) ?? null;
  const result = validateModelFile(file);

  if (!result.ok) {
    handleRejectedFile(result.errorMessage);
    return;
  }

  void handleAcceptedFile(result.file);
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return "The selected file could not be imported. Try a valid .glb or .gltf file.";
  }

  return "The selected file could not be imported. Try a valid .glb or .gltf file.";
}

function setBadge(state: DotState, label: string): void {
  badgeDot.className = `vp-dot vp-dot--${state}`;
  badgeLabel.textContent = label;
}

function setStatusBar(state: DotState, text: string): void {
  statusBarDot.className = `sb-dot sb-dot--${state}`;
  statusBarText.textContent = text;
}

function updateCameraLabel(label: string): void {
  cameraLabel.textContent = label;
}

function setUploadControlsEnabled(isEnabled: boolean): void {
  for (const button of uploadControls) {
    button.disabled = !isEnabled;
  }
}

function setViewModeControlsEnabled(isEnabled: boolean): void {
  for (const button of viewModeButtons) {
    button.disabled = !isEnabled;
  }
}

function setCameraControlsEnabled(isEnabled: boolean): void {
  for (const button of [...cameraProjectionButtons, ...fixedViewButtons]) {
    button.disabled = !isEnabled;
  }
}

function setActiveViewMode(viewMode: ViewMode): void {
  for (const button of viewModeButtons) {
    const isActive = button.dataset.viewMode === viewMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function setActiveCameraProjectionMode(mode: CameraProjectionMode): void {
  for (const button of cameraProjectionButtons) {
    const isActive = button.dataset.cameraProjection === mode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function setActiveFixedView(view: FixedCameraView | null): void {
  for (const button of fixedViewButtons) {
    const isActive = button.dataset.fixedView === view;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function clearSidebar(): void {
  setEmptyText(fileNameStat);
  setEmptyText(fileSizeStat);
  setEmptyText(fileTypeStat);
  meshCountStat.textContent = "0";
  materialCountStat.textContent = "0";
  vertexCountStat.textContent = "0";
  triangleCountStat.textContent = "0";
  setEmptyText(dimensionXStat);
  setEmptyText(dimensionYStat);
  setEmptyText(dimensionZStat);
}

function populateSidebar(
  file: File,
  stats: ModelStats,
  fileType: string,
  fileSize: string,
): void {
  setValueText(fileNameStat, file.name);
  setValueText(fileSizeStat, fileSize);
  setValueText(fileTypeStat, fileType);
  meshCountStat.textContent = formatNumber(stats.meshCount);
  materialCountStat.textContent = formatNumber(stats.materialCount);
  vertexCountStat.textContent = formatCount(stats.vertexCount);
  triangleCountStat.textContent = formatCount(stats.triangleCount);
  renderDimensions(stats.dimensions);
}

function renderDimensions(dimensions: ModelDimensions): void {
  setValueText(dimensionXStat, formatDimension(dimensions.width));
  setValueText(dimensionYStat, formatDimension(dimensions.height));
  setValueText(dimensionZStat, formatDimension(dimensions.depth));
}

function setEmptyText(element: HTMLElement): void {
  element.textContent = "-";
  element.classList.add("empty");
}

function setValueText(element: HTMLElement, value: string): void {
  element.textContent = value;
  element.classList.remove("empty");
}

function formatDimension(value: number): string {
  const formatter = new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }

  return String(value);
}

function truncateFileName(fileName: string, maxLength: number): string {
  if (fileName.length <= maxLength) {
    return fileName;
  }

  return `${fileName.slice(0, Math.max(0, maxLength - 3))}...`;
}

function syncSceneHelperControls(): void {
  const { helperManager } = viewerEngine.sceneManager;

  gridToggle.checked = helperManager.getGridVisible();
  axesToggle.checked = helperManager.getAxesVisible();
  neutralBackgroundToggle.checked = viewerEngine.sceneManager.getNeutralBackground();
}

function setDragOver(isDragOver: boolean): void {
  if (currentLoadState === "loading") {
    return;
  }

  dragOverlay.hidden = !isDragOver;
  viewportWrap.classList.toggle("viewport-wrap--drag", isDragOver);
}

uploadButton.addEventListener("click", () => {
  fileInput.click();
});

chooseButton.addEventListener("click", () => {
  fileInput.click();
});

retryButton.addEventListener("click", () => {
  resetSelectedFile();
  fileInput.click();
});

viewModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { viewMode } = button.dataset;

    if (!isViewMode(viewMode)) {
      return;
    }

    viewModeController.setViewMode(viewMode);
    setActiveViewMode(viewMode);
  });
});

cameraProjectionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { cameraProjection } = button.dataset;

    if (!isCameraProjectionMode(cameraProjection)) {
      return;
    }

    viewerEngine.sceneManager.cameraManager.setProjectionMode(cameraProjection);
    setActiveCameraProjectionMode(cameraProjection);
    setActiveFixedView(null);
    updateCameraLabel(cameraProjection === "perspective" ? "Perspective" : "Orthographic");
  });
});

fixedViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { fixedView } = button.dataset;

    if (!isFixedCameraView(fixedView)) {
      return;
    }

    viewerEngine.sceneManager.cameraManager.setFixedView(fixedView);
    setActiveFixedView(fixedView);
    updateCameraLabel(toTitleCase(fixedView));
  });
});

fileInput.addEventListener("change", () => {
  handleFileList(fileInput.files);
});

gridToggle.addEventListener("change", () => {
  viewerEngine.sceneManager.helperManager.setGridVisible(gridToggle.checked);
});

axesToggle.addEventListener("change", () => {
  viewerEngine.sceneManager.helperManager.setAxesVisible(axesToggle.checked);
});

neutralBackgroundToggle.addEventListener("change", () => {
  viewerEngine.sceneManager.setNeutralBackground(neutralBackgroundToggle.checked);
});

clearButton.addEventListener("click", () => {
  resetSelectedFile();
});

resetCameraButton.addEventListener("click", () => {
  viewerEngine.sceneManager.cameraManager.resetToStoredFrame();
  setActiveFixedView(null);
  updateCameraLabel(
    viewerEngine.sceneManager.cameraManager.getProjectionMode() === "perspective"
      ? "Perspective"
      : "Orthographic",
  );
});

viewportWrap.addEventListener("dragenter", (event) => {
  event.preventDefault();
  activeDragEvents += 1;
  setDragOver(true);
});

viewportWrap.addEventListener("dragover", (event) => {
  event.preventDefault();
});

viewportWrap.addEventListener("dragleave", (event) => {
  event.preventDefault();
  activeDragEvents = Math.max(0, activeDragEvents - 1);

  if (activeDragEvents === 0) {
    setDragOver(false);
  }
});

viewportWrap.addEventListener("drop", (event) => {
  event.preventDefault();
  activeDragEvents = 0;
  setDragOver(false);
  handleFileList(event.dataTransfer?.files ?? null);
});

viewportWrap.addEventListener("wheel", handleViewerWheel, { passive: false });
window.addEventListener("dragend", handleWindowDragEnd);
syncSceneHelperControls();
transitionToEmpty();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    viewModeController.dispose();
    modelLoader.dispose();
    viewerEngine.dispose();
    window.removeEventListener("dragend", handleWindowDragEnd);
    viewportWrap.removeEventListener("wheel", handleViewerWheel);
  });
}

function toTitleCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function iconCube(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 2 7 4v8l-7 4-7-4V6l7-4Z"/><path d="m3 6 7 4 7-4"/><path d="M10 10v8"/></svg>`;
}

function iconUpload(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14V3"/><path d="m6 7 4-4 4 4"/><path d="M4 14v3h12v-3"/></svg>`;
}

function iconReset(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8a6 6 0 1 1 1.8 4.3"/><path d="M4 4v4h4"/></svg>`;
}

function iconTrash(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h14"/><path d="M8 5V3h4v2"/><path d="m5 5 1 13h8l1-13"/><path d="M8 9v5"/><path d="M12 9v5"/></svg>`;
}

function iconAlert(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 5.8v5.1"/><path d="M10 14.2h.01"/></svg>`;
}

function iconGrid(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h14v14H3V3Z"/><path d="M3 8h14"/><path d="M3 13h14"/><path d="M8 3v14"/><path d="M13 3v14"/></svg>`;
}

function iconAxes(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16V6"/><path d="m4 6 2 2"/><path d="M4 16h10"/><path d="m14 16-2-2"/><path d="M4 16 15 5"/></svg>`;
}

function iconBackground(): string {
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="14" height="12" rx="2"/><path d="M3 12h14"/><path d="M7 8h6"/></svg>`;
}
