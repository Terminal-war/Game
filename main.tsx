import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './Core/App';
import { RootErrorBoundary } from './Core/components/RootErrorBoundary';
import { logBoot } from './Core/runtime/diagnostics';
import './main.css';

const mountNode = document.getElementById('root');

if (!mountNode) {
  logBoot('mount', 'Root mount node #root was not found in index.html.', 'error');
  throw new Error('Unable to mount app: missing #root');
}

logBoot('mount', 'Mounting RootAccess UI.');


const BOOT_FAILSAFE_MS = 6000;
const bootFailsafe = window.setTimeout(() => {
  const root = document.getElementById('root');
  if (!root) return;
  if (root.childElementCount > 0) return;
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#050b16;color:#d7fff4;font-family:Inter,system-ui,sans-serif;padding:24px;">
      <section style="max-width:760px;border:1px solid rgba(84,247,216,.35);background:rgba(6,20,36,.92);border-radius:12px;padding:16px;">
        <h1 style="margin:0 0 8px;">RootAccess failed to boot</h1>
        <p style="margin:0 0 10px;">The app bundle did not mount. This usually means GitHub Pages is serving the wrong build source or base path.</p>
        <ul>
          <li>Set Pages source to <strong>GitHub Actions</strong>.</li>
          <li>Ensure deploy workflow builds with <code>VITE_BASE_PATH=/${window.location.pathname.split('/')[1] || ''}/</code>.</li>
          <li>Hard refresh after deploy.</li>
        </ul>
      </section>
    </main>`;
  logBoot('mount', 'Boot failsafe rendered because app did not mount in time.', 'error');
}, BOOT_FAILSAFE_MS);


const redirectedPath = sessionStorage.getItem('rootaccess:redirect-path');
if (redirectedPath) {
  sessionStorage.removeItem('rootaccess:redirect-path');
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (redirectedPath !== current) {
    window.history.replaceState(null, '', redirectedPath);
    logBoot('routing', 'Recovered SPA path from 404 redirect.', 'info', { redirectedPath });
  }
}


createRoot(mountNode).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);

window.requestAnimationFrame(() => {
  if (mountNode.childElementCount > 0) {
    window.clearTimeout(bootFailsafe);
  }
});
