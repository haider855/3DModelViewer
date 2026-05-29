import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found.");
}

app.innerHTML = `
  <main class="app-shell" aria-labelledby="app-title">
    <section class="hero-panel">
      <p class="eyebrow">Browser-based inspection tool</p>
      <h1 id="app-title">3D Model Viewer</h1>
      <p class="intro">
        Phase 1 placeholder for a client-side GLB and GLTF viewer.
      </p>
      <div class="status-panel" aria-label="Project status">
        <span class="status-dot" aria-hidden="true"></span>
        Vite and TypeScript are ready.
      </div>
    </section>
  </main>
`;
