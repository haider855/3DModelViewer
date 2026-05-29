import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found.");
}

app.innerHTML = `
  <main class="viewer-app" aria-labelledby="app-title">
    <header class="top-toolbar">
      <div class="brand-group">
        <span class="brand-mark" aria-hidden="true">3D</span>
        <div>
          <h1 id="app-title">3D Model Viewer</h1>
          <p>No model loaded</p>
        </div>
      </div>

      <nav class="toolbar-actions" aria-label="Viewer controls">
        <button class="primary-button" type="button" disabled>Upload</button>

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
          <button class="toolbar-button danger" type="button" disabled>Clear</button>
        </div>
      </nav>
    </header>

    <section class="workspace" aria-label="Viewer workspace">
      <section class="viewport-panel" aria-label="3D viewport">
        <div class="viewport-surface">
          <div class="grid-preview" aria-hidden="true"></div>
          <div class="viewport-empty-state">
            <p class="empty-kicker">Ready for model inspection</p>
            <h2>Upload a GLB or GLTF file</h2>
            <p>Upload a GLB or GLTF file to inspect it in the browser.</p>
            <button class="primary-button" type="button" disabled>Choose file</button>
          </div>
        </div>
      </section>

      <aside class="sidebar" aria-label="Model information">
        <section class="sidebar-section">
          <div class="section-heading">
            <h2>Model Info</h2>
            <span class="status-badge">Empty</span>
          </div>
          <dl class="stats-list">
            <div>
              <dt>File name</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>File size</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>File type</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>Meshes</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>Materials</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>Vertices</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>Triangles</dt>
              <dd>-</dd>
            </div>
            <div>
              <dt>Dimensions</dt>
              <dd>-</dd>
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
