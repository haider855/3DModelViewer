import "./styles.css";
import { BabylonEngine } from "./engine/BabylonEngine";
import {
  ACCEPTED_MODEL_FILE_TYPES,
  SUPPORTED_MODEL_EXTENSIONS,
} from "./loading/SupportedFormats";
import { validateModelFile } from "./loading/FileValidator";
import { formatBytes } from "./utils/formatBytes";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found.");
}

const appRoot = app;

appRoot.innerHTML = `
  <main class="viewer-app" aria-labelledby="app-title">
    <header class="top-toolbar">
      <div class="brand-group">
        <span class="brand-mark" aria-hidden="true">3D</span>
        <div>
          <h1 id="app-title">3D Model Viewer</h1>
          <p data-load-status>No model loaded</p>
        </div>
      </div>

      <nav class="toolbar-actions" aria-label="Viewer controls">
        <button class="primary-button" type="button" data-upload-button>Upload</button>

        <div class="control-group" aria-label="View mode controls">
          <button class="toolbar-button is-active" type="button" disabled>Material</button>
          <button class="toolbar-button" type="button" disabled>Solid</button>
          <button class="toolbar-button" type="button" disabled>Wireframe</button>
        </div>

        <div class="control-group" aria-label="Camera controls">
          <button class="toolbar-button is-active" type="button" disabled>Perspective</button>
          <button class="toolbar-button" type="button" disabled>Orthographic</button>
          <button class="toolbar-button" type="button" disabled>Front</button>
          <button class="toolbar-button" type="button" disabled>Side</button>
          <button class="toolbar-button" type="button" disabled>Top</button>
        </div>

        <div class="control-group" aria-label="Scene actions">
          <button class="toolbar-button" type="button" disabled>Reset</button>
          <button class="toolbar-button danger" type="button" data-clear-button disabled>Clear</button>
        </div>
      </nav>
    </header>

    <section class="workspace" aria-label="Viewer workspace">
      <section class="viewport-panel" aria-label="3D viewport">
        <div class="viewport-surface" data-drop-zone>
          <canvas
            class="viewer-canvas"
            data-viewer-canvas
            aria-label="3D scene viewport"
          ></canvas>
          <div class="viewport-empty-state" data-empty-state>
            <p class="empty-kicker">Ready for model inspection</p>
            <h2>Upload a GLB or GLTF file</h2>
            <p>Upload a GLB or GLTF file to inspect it in the browser.</p>
            <button class="primary-button" type="button" data-upload-button>Choose file</button>
            <p class="drop-copy">Drag a .glb or .gltf file anywhere onto the viewport.</p>
            <p class="status-message" data-status-message role="status">
              No file selected.
            </p>
          </div>
        </div>
      </section>

      <aside class="sidebar" aria-label="Model information">
        <section class="sidebar-section">
          <div class="section-heading">
            <h2>Model Info</h2>
            <span class="status-badge" data-status-badge>Empty</span>
          </div>
          <dl class="stats-list">
            <div>
              <dt>File name</dt>
              <dd data-stat="fileName">-</dd>
            </div>
            <div>
              <dt>File size</dt>
              <dd data-stat="fileSize">-</dd>
            </div>
            <div>
              <dt>File type</dt>
              <dd data-stat="fileType">-</dd>
            </div>
            <div>
              <dt>Meshes</dt>
              <dd data-stat="meshes">-</dd>
            </div>
            <div>
              <dt>Materials</dt>
              <dd data-stat="materials">-</dd>
            </div>
            <div>
              <dt>Vertices</dt>
              <dd data-stat="vertices">-</dd>
            </div>
            <div>
              <dt>Triangles</dt>
              <dd data-stat="triangles">-</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd data-stat="dimensions">-</dd>
            </div>
          </dl>
        </section>

        <section class="sidebar-section">
          <h2>Scene Helpers</h2>
          <label class="toggle-row">
            <input type="checkbox" checked disabled />
            <span>Grid</span>
          </label>
          <label class="toggle-row">
            <input type="checkbox" checked disabled />
            <span>Axes</span>
          </label>
          <label class="toggle-row">
            <input type="checkbox" disabled />
            <span>Neutral background</span>
          </label>
        </section>
      </aside>
    </section>
  </main>
`;

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ACCEPTED_MODEL_FILE_TYPES;
fileInput.className = "visually-hidden";
fileInput.setAttribute(
  "aria-label",
  `Choose a ${SUPPORTED_MODEL_EXTENSIONS.join(" or ")} model file`,
);
document.body.append(fileInput);

const canvas = appRoot.querySelector<HTMLCanvasElement>("[data-viewer-canvas]");

if (!canvas) {
  throw new Error("Viewer canvas element was not found.");
}

const viewerEngine = new BabylonEngine(canvas);
const dropZone = requireElement<HTMLDivElement>("[data-drop-zone]");
const emptyState = requireElement<HTMLDivElement>("[data-empty-state]");
const uploadButtons = Array.from(
  appRoot.querySelectorAll<HTMLButtonElement>("[data-upload-button]"),
);
const clearButton = requireElement<HTMLButtonElement>("[data-clear-button]");
const loadStatus = requireElement<HTMLParagraphElement>("[data-load-status]");
const statusBadge = requireElement<HTMLSpanElement>("[data-status-badge]");
const statusMessage = requireElement<HTMLParagraphElement>("[data-status-message]");
const fileNameStat = requireElement<HTMLElement>('[data-stat="fileName"]');
const fileSizeStat = requireElement<HTMLElement>('[data-stat="fileSize"]');
const fileTypeStat = requireElement<HTMLElement>('[data-stat="fileType"]');
let activeDragEvents = 0;
const handleWindowDragEnd = (): void => {
  activeDragEvents = 0;
  dropZone.classList.remove("is-drag-over");
};

function requireElement<TElement extends Element>(selector: string): TElement {
  const element = appRoot.querySelector<TElement>(selector);

  if (!element) {
    throw new Error(`Required element was not found: ${selector}`);
  }

  return element;
}

function setStatus(message: string, status: "empty" | "ready" | "error" | "warning"): void {
  statusMessage.textContent = message;
  statusMessage.className = `status-message is-${status}`;
}

function resetSelectedFile(): void {
  fileInput.value = "";
  loadStatus.textContent = "No model loaded";
  statusBadge.textContent = "Empty";
  statusBadge.className = "status-badge";
  emptyState.classList.remove("has-file", "has-error");
  clearButton.disabled = true;
  fileNameStat.textContent = "-";
  fileSizeStat.textContent = "-";
  fileTypeStat.textContent = "-";
  setStatus("No file selected.", "empty");
}

function handleRejectedFile(message: string): void {
  resetSelectedFile();
  statusBadge.textContent = "Error";
  statusBadge.className = "status-badge is-error";
  emptyState.classList.add("has-error");
  setStatus(message, "error");
}

function handleAcceptedFile(file: File): void {
  const result = validateModelFile(file);

  if (!result.ok) {
    handleRejectedFile(result.errorMessage);
    return;
  }

  loadStatus.textContent = "File selected";
  statusBadge.textContent = "Selected";
  statusBadge.className = "status-badge is-ready";
  emptyState.classList.remove("has-error");
  emptyState.classList.add("has-file");
  clearButton.disabled = false;

  fileNameStat.textContent = result.fileInfo.name;
  fileSizeStat.textContent = formatBytes(result.fileInfo.sizeBytes);
  fileTypeStat.textContent = result.fileInfo.extension.slice(1).toUpperCase();

  if (result.warningMessage) {
    statusBadge.textContent = "Large";
    statusBadge.className = "status-badge is-warning";
    setStatus(result.warningMessage, "warning");
    return;
  }

  setStatus(
    `${result.fileInfo.name} is ready for loading in the next phase.`,
    "ready",
  );
}

function handleFileList(files: FileList | null): void {
  const file = files?.item(0) ?? null;
  const result = validateModelFile(file);

  if (!result.ok) {
    handleRejectedFile(result.errorMessage);
    return;
  }

  handleAcceptedFile(result.file);
}

uploadButtons.forEach((button) => {
  button.addEventListener("click", () => {
    fileInput.click();
  });
});

fileInput.addEventListener("change", () => {
  handleFileList(fileInput.files);
});

clearButton.addEventListener("click", () => {
  resetSelectedFile();
});

dropZone.addEventListener("dragenter", (event) => {
  event.preventDefault();
  activeDragEvents += 1;
  dropZone.classList.add("is-drag-over");
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
});

dropZone.addEventListener("dragleave", (event) => {
  event.preventDefault();
  activeDragEvents = Math.max(0, activeDragEvents - 1);

  if (activeDragEvents === 0) {
    dropZone.classList.remove("is-drag-over");
  }
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  activeDragEvents = 0;
  dropZone.classList.remove("is-drag-over");
  handleFileList(event.dataTransfer?.files ?? null);
});

window.addEventListener("dragend", handleWindowDragEnd);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    viewerEngine.dispose();
    window.removeEventListener("dragend", handleWindowDragEnd);
    fileInput.remove();
  });
}
